<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Video */
class VideoResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'description' => $this->description,
            'location' => $this->location,
            // Entrega um formato H.264/AAC otimizado para reprodução progressiva
            // em navegadores, inclusive para vídeos cortados que chegam em WebM.
            'video_url' => $this->optimizedPlaybackUrl($this->video_url),
            'thumbnail_url' => $this->thumbnail_url,
            'duration_seconds' => $this->duration_seconds,
            'visibility' => $this->visibility,
            'pinned_at' => $this->pinned_at,
            'allow_comments' => $this->allow_comments,
            'scheduled_at' => $this->scheduled_at,
            'allow_reuse' => (bool) $this->allow_reuse,
            'is_ai_generated' => (bool) $this->is_ai_generated,
            'age_restricted' => (bool) $this->age_restricted,
            'high_quality' => (bool) $this->high_quality,
            'view_count' => $this->view_count ?? 0,
            'shares_count' => $this->shares_count ?? 0,
            'likes_count' => $this->likes_count ?? 0,
            'liked_by_current_user' => (bool) ($this->liked_by_current_user ?? false),
            'comments_count' => $this->comments_count ?? 0,
            'favorites_count' => $this->favorites_count ?? 0,
            'favorited_by_current_user' => (bool) ($this->favorited_by_current_user ?? false),
            'author' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'username' => $this->user->username,
                'avatar_url' => $this->user->avatar_url,
                'is_following' => $this->followingStatus($request),
            ],
            'created_at' => $this->created_at,
        ];
    }

    private function optimizedPlaybackUrl(?string $url): ?string
    {
        if (! $url || ! str_contains($url, 'res.cloudinary.com') || ! str_contains($url, '/video/upload/')) {
            return $url;
        }

        if (str_contains($url, 'f_mp4') || str_contains($url, 'vc_h264')) {
            return $url;
        }

        return str_replace(
            '/video/upload/',
            '/video/upload/f_mp4,vc_h264,ac_aac,q_auto/',
            $url,
        );
    }

    private function followingStatus(Request $request): bool
    {
        $viewer = $request->user('sanctum');
        if (! $viewer || $viewer->id === $this->user->id) {
            return false;
        }

        $followingIds = $request->attributes->get('following_user_ids');
        if (is_array($followingIds)) {
            return isset($followingIds[$this->user->id]);
        }

        return $viewer->following()->whereKey($this->user->id)->exists();
    }
}
