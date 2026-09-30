<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Video;
use App\Models\Comment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SocialInteractionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_authenticated_user_can_like_and_unlike_a_video(): void
    {
        $owner = User::factory()->create();
        $viewer = User::factory()->create();
        $video = $this->createVideo($owner);

        $this->actingAs($viewer, 'sanctum')
            ->putJson("/api/videos/{$video->id}/like")
            ->assertOk()
            ->assertJsonPath('data.liked', true)
            ->assertJsonPath('data.likes_count', 1);

        $this->assertDatabaseHas('video_likes', [
            'video_id' => $video->id,
            'user_id' => $viewer->id,
        ]);

        $this->actingAs($viewer, 'sanctum')
            ->deleteJson("/api/videos/{$video->id}/like")
            ->assertOk()
            ->assertJsonPath('data.liked', false)
            ->assertJsonPath('data.likes_count', 0);

        $this->assertDatabaseMissing('video_likes', [
            'video_id' => $video->id,
            'user_id' => $viewer->id,
        ]);
    }

    public function test_repeated_idempotency_key_replays_the_original_response(): void
    {
        $owner = User::factory()->create();
        $viewer = User::factory()->create();
        $video = $this->createVideo($owner);

        $this->actingAs($viewer, 'sanctum')
            ->withHeader('Idempotency-Key', 'like-'.$video->id.'-1')
            ->putJson("/api/videos/{$video->id}/like")
            ->assertOk()
            ->assertJsonPath('data.likes_count', 1);

        $this->actingAs($viewer, 'sanctum')
            ->withHeader('Idempotency-Key', 'like-'.$video->id.'-1')
            ->putJson("/api/videos/{$video->id}/like")
            ->assertOk()
            ->assertJsonPath('data.likes_count', 1);

        $this->assertDatabaseCount('video_likes', 1);
        $this->assertDatabaseCount('idempotency_keys', 1);
    }

    public function test_comment_editing_keeps_the_same_spam_rules_as_creation(): void
    {
        $owner = User::factory()->create();
        $viewer = User::factory()->create();
        $video = $this->createVideo($owner);
        $comment = new Comment(['body' => 'Comentário válido']);
        $comment->user()->associate($viewer);
        $video->comments()->save($comment);

        $this->actingAs($viewer, 'sanctum')
            ->patchJson("/api/comments/{$comment->id}", [
                'body' => 'https://a.test https://b.test https://c.test',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('body');
    }

    public function test_the_feed_includes_the_current_users_like_status(): void
    {
        $owner = User::factory()->create();
        $viewer = User::factory()->create();
        $video = $this->createVideo($owner);
        $video->likes()->create(['user_id' => $viewer->id]);

        $this->actingAs($viewer, 'sanctum')
            ->getJson('/api/videos')
            ->assertOk()
            ->assertJsonPath('data.0.id', $video->id)
            ->assertJsonPath('data.0.liked_by_current_user', true);
    }

    public function test_an_authenticated_user_can_add_and_list_comments_for_a_video(): void
    {
        $owner = User::factory()->create();
        $viewer = User::factory()->create();
        $video = $this->createVideo($owner);

        $this->actingAs($viewer, 'sanctum')
            ->postJson("/api/videos/{$video->id}/comments", [
                'body' => 'Ótimo conteúdo!',
            ])
            ->assertCreated()
            ->assertJsonPath('data.body', 'Ótimo conteúdo!')
            ->assertJsonPath('data.author.id', $viewer->id);

        $this->getJson("/api/videos/{$video->id}/comments")
            ->assertOk()
            ->assertJsonPath('data.0.body', 'Ótimo conteúdo!')
            ->assertJsonPath('data.0.author.id', $viewer->id);
    }

    public function test_following_the_same_user_twice_creates_only_one_notification(): void
    {
        $follower = User::factory()->create();
        $followed = User::factory()->create();

        $this->actingAs($follower, 'sanctum')
            ->putJson("/api/users/{$followed->id}/follow")
            ->assertOk()
            ->assertJsonPath('data.followers_count', 1);

        $this->actingAs($follower, 'sanctum')
            ->putJson("/api/users/{$followed->id}/follow")
            ->assertOk()
            ->assertJsonPath('data.followers_count', 1);

        $this->assertDatabaseCount('follows', 1);
        $this->assertDatabaseCount('notifications', 1);
    }

    public function test_followers_can_view_followers_only_videos_but_others_cannot(): void
    {
        $owner = User::factory()->create();
        $follower = User::factory()->create();
        $stranger = User::factory()->create();
        $video = $this->createVideo($owner);
        $video->update(['visibility' => 'followers']);
        $follower->following()->attach($owner->id);

        $this->actingAs($follower, 'sanctum')
            ->getJson("/api/videos/{$video->id}")
            ->assertOk();

        $this->getJson('/api/videos?feed=following')
            ->assertOk()
            ->assertJsonPath('data.0.id', $video->id);

        $this->actingAs($stranger, 'sanctum')
            ->getJson("/api/videos/{$video->id}")
            ->assertNotFound();
    }

    public function test_only_the_owner_can_view_a_private_video(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $video = $this->createVideo($owner);
        $video->update(['visibility' => 'private']);

        $this->actingAs($owner, 'sanctum')
            ->getJson("/api/videos/{$video->id}")
            ->assertOk();

        $this->actingAs($stranger, 'sanctum')
            ->getJson("/api/videos/{$video->id}")
            ->assertNotFound();
    }

    public function test_private_profile_follower_lists_are_not_public(): void
    {
        $owner = User::factory()->create(['is_private' => true]);
        $follower = User::factory()->create();
        $follower->following()->attach($owner->id);

        $this->getJson("/api/users/{$owner->id}/followers")
            ->assertNotFound();

        $this->actingAs($owner, 'sanctum')
            ->getJson("/api/users/{$owner->id}/followers")
            ->assertOk()
            ->assertJsonPath('data.0.id', $follower->id);
    }

    public function test_private_profile_videos_are_visible_only_to_the_owner(): void
    {
        $owner = User::factory()->create(['is_private' => true]);
        $viewer = User::factory()->create();
        $video = $this->createVideo($owner);

        $this->getJson('/api/videos')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $this->actingAs($viewer, 'sanctum')
            ->getJson("/api/videos/{$video->id}")
            ->assertNotFound();

        $this->actingAs($owner, 'sanctum')
            ->getJson("/api/videos/{$video->id}")
            ->assertOk();
    }

    public function test_unverified_users_cannot_log_in_or_mutate_resources(): void
    {
        $user = User::factory()->unverified()->create();

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertForbidden()
            ->assertJsonPath('email_verification_required', true)
            ->assertJsonMissingPath('token');

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/auth/profile')
            ->assertForbidden();
    }

    public function test_login_rate_limit_rejects_the_sixth_attempt(): void
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/auth/login', [
                'email' => 'not-found@example.test',
                'password' => 'wrong-password',
            ])->assertUnprocessable();
        }

        $this->postJson('/api/auth/login', [
            'email' => 'not-found@example.test',
            'password' => 'wrong-password',
        ])->assertTooManyRequests();
    }

    public function test_scheduled_videos_are_hidden_until_their_publish_time(): void
    {
        $owner = User::factory()->create();
        $viewer = User::factory()->create();
        $video = $this->createVideo($owner);
        $video->update(['scheduled_at' => now()->addHour()]);

        $this->getJson("/api/videos/{$video->id}")->assertNotFound();
        $this->getJson('/api/videos')->assertJsonMissing(['id' => $video->id]);
        $this->actingAs($viewer, 'sanctum')->getJson("/api/videos/{$video->id}")->assertNotFound();
        $this->actingAs($owner, 'sanctum')->getJson("/api/videos/{$video->id}")->assertOk();
    }

    public function test_repeated_anonymous_views_are_counted_once_per_thirty_minutes(): void
    {
        $video = $this->createVideo(User::factory()->create());

        $this->postJson("/api/videos/{$video->id}/view")
            ->assertOk()
            ->assertJsonPath('data.view_count', 1);
        $this->postJson("/api/videos/{$video->id}/view")
            ->assertOk()
            ->assertJsonPath('data.view_count', 1);
    }

    public function test_api_rejects_media_urls_outside_the_configured_cloudinary_account(): void
    {
        config(['services.cloudinary.cloud_name' => 'test-cloud']);
        $owner = User::factory()->create();

        $this->actingAs($owner, 'sanctum')
            ->postJson('/api/videos', [
                'video_url' => 'https://example.com/video.mp4',
                'cloudinary_public_id' => "vibe-shorts/videos/{$owner->id}/video",
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('video_url');
    }

    public function test_recommendations_exclude_users_hidden_by_the_viewer(): void
    {
        $viewer = User::factory()->create();
        $hidden = User::factory()->create();
        $visible = User::factory()->create();
        $viewer->hiddenUsers()->attach($hidden->id);

        $this->actingAs($viewer, 'sanctum')
            ->getJson('/api/users/recommended')
            ->assertOk()
            ->assertJsonMissing(['id' => $hidden->id])
            ->assertJsonFragment(['id' => $visible->id]);
    }

    public function test_adding_a_video_twice_does_not_move_it_in_a_playlist(): void
    {
        $owner = User::factory()->create();
        $playlist = $owner->playlists()->create(['name' => 'Favoritos']);
        $video = $this->createVideo($owner);

        $this->actingAs($owner, 'sanctum')
            ->putJson("/api/playlists/{$playlist->id}/videos/{$video->id}")
            ->assertOk();
        $initialPosition = $playlist->videos()->first()->pivot->position;

        $this->actingAs($owner, 'sanctum')
            ->putJson("/api/playlists/{$playlist->id}/videos/{$video->id}")
            ->assertOk();

        $this->assertSame($initialPosition, $playlist->videos()->first()->pivot->position);
    }

    public function test_owner_can_pin_a_video(): void
    {
        $owner = User::factory()->create();
        $video = $this->createVideo($owner);

        $this->actingAs($owner, 'sanctum')
            ->patchJson("/api/videos/{$video->id}/pin")
            ->assertOk()
            ->assertJsonPath('data.pinned', true);

        $this->assertNotNull($video->fresh()->pinned_at);
    }

    public function test_owner_cannot_pin_more_than_three_videos(): void
    {
        $owner = User::factory()->create();
        foreach (range(1, 3) as $index) {
            $video = $this->createVideo($owner);
            $video->forceFill(['pinned_at' => now()])->save();
        }
        $fourthVideo = $this->createVideo($owner);

        $this->actingAs($owner, 'sanctum')
            ->patchJson("/api/videos/{$fourthVideo->id}/pin")
            ->assertUnprocessable();

        $this->assertNull($fourthVideo->fresh()->pinned_at);
    }

    public function test_api_responses_include_security_headers(): void
    {
        $this->getJson('/api/videos')
            ->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    private function createVideo(User $user): Video
    {
        return $user->videos()->create([
            'description' => 'Vídeo de teste',
            'video_url' => 'https://example.com/video.mp4',
            'duration_seconds' => 30,
        ]);
    }
}
