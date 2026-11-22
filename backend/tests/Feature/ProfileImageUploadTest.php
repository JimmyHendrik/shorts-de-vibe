<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\CloudinaryImageUploader;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class ProfileImageUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_saves_avatar_and_cover_images(): void
    {
        $user = User::factory()->create();
        $this->mock(CloudinaryImageUploader::class, function ($mock): void {
            $mock->shouldReceive('upload')
                ->twice()
                ->andReturn(
                    'https://res.cloudinary.com/test/image/upload/avatar.jpg',
                    'https://res.cloudinary.com/test/image/upload/cover.jpg',
                );
        });

        $this->actingAs($user, 'sanctum')
            ->post('/api/auth/profile/image', [
                'image' => UploadedFile::fake()->image('avatar.jpg'),
                'type' => 'avatar',
            ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('user.avatar_url', 'https://res.cloudinary.com/test/image/upload/avatar.jpg');

        $this->post('/api/auth/profile/image', [
            'image' => UploadedFile::fake()->image('cover.jpg'),
            'type' => 'cover',
        ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('user.cover_url', 'https://res.cloudinary.com/test/image/upload/cover.jpg');

        $this->assertSame(
            'https://res.cloudinary.com/test/image/upload/avatar.jpg',
            $user->fresh()->avatar_url,
        );
        $this->assertSame(
            'https://res.cloudinary.com/test/image/upload/cover.jpg',
            $user->fresh()->cover_url,
        );
    }

    public function test_it_returns_a_service_error_when_image_storage_fails(): void
    {
        $user = User::factory()->create();
        $this->mock(CloudinaryImageUploader::class, function ($mock): void {
            $mock->shouldReceive('upload')->once()->andThrow(new \RuntimeException('Cloudinary unavailable.'));
        });

        $this->actingAs($user, 'sanctum')
            ->post('/api/auth/profile/image', [
                'image' => UploadedFile::fake()->image('avatar.jpg'),
                'type' => 'avatar',
            ], ['Accept' => 'application/json'])
            ->assertServiceUnavailable()
            ->assertJsonPath('message', 'Não foi possível enviar a imagem agora. Verifique a configuração do armazenamento e tente novamente.');
    }
}
