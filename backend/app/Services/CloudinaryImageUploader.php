<?php

namespace App\Services;

use Cloudinary\Cloudinary;
use Illuminate\Http\UploadedFile;
use RuntimeException;

class CloudinaryImageUploader
{
    public function upload(UploadedFile $file, string $folder): string
    {
        return $this->uploadWithMetadata($file, $folder)['url'];
    }

    /** @return array{url: string, public_id: string} */
    public function uploadWithMetadata(UploadedFile $file, string $folder): array
    {
        $config = config('services.cloudinary');
        if (! $config['cloud_name'] || ! $config['api_key'] || ! $config['api_secret']) {
            throw new RuntimeException('Cloudinary is not configured.');
        }

        $cloudinary = new Cloudinary(['cloud' => [
            'cloud_name' => $config['cloud_name'],
            'api_key' => $config['api_key'],
            'api_secret' => $config['api_secret'],
        ]]);

        $result = $cloudinary->uploadApi()->upload($file->getRealPath(), [
            'resource_type' => 'image',
            'folder' => $folder,
            'use_filename' => true,
            'unique_filename' => true,
        ]);

        return [
            'url' => $result['secure_url'],
            'public_id' => $result['public_id'],
        ];
    }

    public function delete(string $publicId): void
    {
        $config = config('services.cloudinary');
        $cloudinary = new Cloudinary(['cloud' => [
            'cloud_name' => $config['cloud_name'],
            'api_key' => $config['api_key'],
            'api_secret' => $config['api_secret'],
        ]]);

        $cloudinary->uploadApi()->destroy($publicId, [
            'resource_type' => 'image',
            'invalidate' => true,
        ]);
    }
}
