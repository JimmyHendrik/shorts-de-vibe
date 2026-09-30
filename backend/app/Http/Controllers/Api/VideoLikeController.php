<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VideoLikeController extends Controller
{
    public function store(Request $request, Video $video): JsonResponse
    {
        $this->ensureVideoVisibleTo($request, $video);

        $like = $video->likes()->firstOrCreate([
            'user_id' => $request->user()->id,
        ]);
        if ($like->wasRecentlyCreated && $video->user_id !== $request->user()->id) {
            Notification::create(['user_id' => $video->user_id, 'actor_id' => $request->user()->id, 'video_id' => $video->id, 'type' => 'like']);
        }

        return response()->json([
            'data' => $this->likeStatus($video, true),
        ]);
    }

    public function destroy(Request $request, Video $video): JsonResponse
    {
        $this->ensureVideoVisibleTo($request, $video);

        $video->likes()
            ->where('user_id', $request->user()->id)
            ->delete();

        return response()->json([
            'data' => $this->likeStatus($video, false),
        ]);
    }

    /** @return array{liked: bool, likes_count: int} */
    private function likeStatus(Video $video, bool $liked): array
    {
        return [
            'liked' => $liked,
            'likes_count' => $video->likes()->count(),
        ];
    }

    private function ensureVideoVisibleTo(Request $request, Video $video): void
    {
        abort_unless($video->isVisibleTo($request->user('sanctum')), 404);
    }
}
