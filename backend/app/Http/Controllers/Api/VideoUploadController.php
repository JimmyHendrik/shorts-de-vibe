<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CloudinaryImageUploader;
use App\Services\CloudinaryVideoUploader;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\Video;
use Throwable;

class VideoUploadController extends Controller
{
    public function store(Request $request, CloudinaryVideoUploader $uploader, CloudinaryImageUploader $imageUploader): JsonResponse
    {
        $validated = $request->validate([
            'video' => [
                'required',
                'file',
                'mimetypes:video/mp4,video/webm,video/quicktime',
                'max:51200',
            ],
            'thumbnail' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $video = null;
        $thumbnailPublicId = null;
        try {
            $video = $uploader->upload($validated['video'], (int) $request->user()->id);
            if (! empty($validated['thumbnail'])) {
                $thumbnail = $imageUploader->uploadWithMetadata(
                    $validated['thumbnail'],
                    'vibe-shorts/videos/'.$request->user()->id.'/thumbnails',
                );
                $video['thumbnail_url'] = $thumbnail['url'];
                $video['thumbnail_public_id'] = $thumbnail['public_id'];
                $thumbnailPublicId = $thumbnail['public_id'];
            }
        } catch (Throwable $exception) {
            if ($thumbnailPublicId) {
                try {
                    $imageUploader->delete($thumbnailPublicId);
                } catch (Throwable $cleanupException) {
                    report($cleanupException);
                }
            }
            if (! empty($video['cloudinary_public_id'])) {
                try {
                    $uploader->delete($video['cloudinary_public_id']);
                } catch (Throwable $cleanupException) {
                    report($cleanupException);
                }
            }
            report($exception);

            return response()->json([
                'message' => 'Não foi possível enviar o vídeo agora. Tente novamente em instantes.',
            ], 503);
        }

        return response()->json(['data' => $video], 201);
    }

    public function destroy(
        Request $request,
        CloudinaryVideoUploader $uploader,
        CloudinaryImageUploader $imageUploader,
    ): JsonResponse
    {
        $data = $request->validate([
            'cloudinary_public_id' => ['required', 'string', 'max:255'],
            'thumbnail_public_id' => ['nullable', 'string', 'max:255'],
        ]);
        $publicId = $data['cloudinary_public_id'];
        $ownerPrefix = 'vibe-shorts/videos/'.$request->user()->id.'/';

        abort_unless(str_starts_with($publicId, $ownerPrefix), 404);
        if (! empty($data['thumbnail_public_id'])) {
            abort_unless(str_starts_with($data['thumbnail_public_id'], $ownerPrefix.'thumbnails/'), 404);
        }
        abort_if(Video::where('cloudinary_public_id', $publicId)->exists(), 409, 'O vídeo já foi publicado.');

        try {
            $uploader->delete($publicId);
            if (! empty($data['thumbnail_public_id'])) {
                $imageUploader->delete($data['thumbnail_public_id']);
            }
        } catch (Throwable $exception) {
            report($exception);

            return response()->json(['message' => 'Não foi possível remover o upload temporário.'], 503);
        }

        return response()->json(status: 204);
    }
}
