<?php

namespace App\Services;

use Cloudinary\Cloudinary;
use Illuminate\Http\UploadedFile;
use RuntimeException;

class CloudinaryVideoUploader
{
    /** @return array{video_url: string, thumbnail_url: string, cloudinary_public_id: string, duration_seconds: int|null} */
    public function upload(UploadedFile $file, int $userId): array
    {
        $config = config('services.cloudinary');

        if (! $config['cloud_name'] || ! $config['api_key'] || ! $config['api_secret']) {
            throw new RuntimeException('Cloudinary is not configured.');
        }

        $cloudinary = new Cloudinary([
            'cloud' => [
                'cloud_name' => $config['cloud_name'],
                'api_key' => $config['api_key'],
                'api_secret' => $config['api_secret'],
            ],
        ]);

        $result = $cloudinary->uploadApi()->upload($file->getRealPath(), [
            'resource_type' => 'video',
            'folder' => "vibe-shorts/videos/{$userId}",
            'use_filename' => true,
            'unique_filename' => true,
        ]);

        $playbackUrl = str_replace(
            '/video/upload/',
            // Entrega uma cópia H.264/AAC mais leve e compatível. O arquivo
            // original continua preservado no Cloudinary, enquanto o feed
            // recebe uma versão com menor risco de travar em redes móveis.
            '/video/upload/f_mp4,vc_h264,ac_aac,q_auto:eco/',
            $result['secure_url'],
        );

        // O Cloudinary gera a primeira imagem do vídeo sob demanda. Isso
        // evita que o feed precise carregar o arquivo inteiro só para exibir
        // uma prévia.
        $thumbnailUrl = preg_replace(
            '~(/video/upload/)([^?]+)$~',
            '/video/upload/so_0,f_jpg,q_auto,w_640/$2',
            $result['secure_url'],
        );
        $thumbnailUrl = is_string($thumbnailUrl)
            ? preg_replace('~\.[^./?]+$~', '.jpg', $thumbnailUrl)
            : null;

        return [
            'video_url' => $playbackUrl,
            'thumbnail_url' => $thumbnailUrl ?: $playbackUrl,
            'cloudinary_public_id' => $result['public_id'],
            'duration_seconds' => isset($result['duration']) ? (int) round($result['duration']) : null,
        ];
    }

    public function delete(string $publicId): void
    {
        $config = config('services.cloudinary');
        $cloudinary = new Cloudinary([
            'cloud' => [
                'cloud_name' => $config['cloud_name'],
                'api_key' => $config['api_key'],
                'api_secret' => $config['api_secret'],
            ],
        ]);

        $cloudinary->uploadApi()->destroy($publicId, [
            'resource_type' => 'video',
            'invalidate' => true,
        ]);
    }
}
