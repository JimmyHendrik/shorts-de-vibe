<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'description',
    'location',
    'video_url',
    'thumbnail_url',
    'cloudinary_public_id',
    'duration_seconds',
    'visibility',
    'allow_comments',
    'scheduled_at',
    'allow_reuse',
    'is_ai_generated',
    'age_restricted',
    'high_quality',
    'shares_count',
    'pinned_at',
])]
class Video extends Model
{
    protected function casts(): array
    {
        return [
            'allow_comments' => 'boolean',
            'duration_seconds' => 'integer',
            'view_count' => 'integer',
            'shares_count' => 'integer',
            'pinned_at' => 'datetime',
            'scheduled_at' => 'datetime',
            'allow_reuse' => 'boolean',
            'is_ai_generated' => 'boolean',
            'age_restricted' => 'boolean',
            'high_quality' => 'boolean',
        ];
    }

    public function scopeVisibleTo(Builder $query, ?User $viewer): Builder
    {
        return $query->where(function (Builder $query) use ($viewer): void {
            $query->where(function (Builder $query) use ($viewer): void {
                $query->whereHas('user', fn (Builder $users) => $users->where('is_private', false))
                    ->where(function (Builder $query) use ($viewer): void {
                        $query->where('videos.visibility', 'public');

                        if ($viewer) {
                            $query->orWhere(function (Builder $query) use ($viewer): void {
                                $query->where('videos.visibility', 'followers')
                                    ->whereIn('videos.user_id', $viewer->following()->select('users.id'));
                            });
                        }
                    });
            });

            if ($viewer) {
                $query->orWhere('videos.user_id', $viewer->id);
            }
        })->where(function (Builder $query) use ($viewer): void {
            $query->whereNull('videos.scheduled_at')
                ->orWhere('videos.scheduled_at', '<=', now());

            if ($viewer) {
                $query->orWhere('videos.user_id', $viewer->id);
            }
        });
    }

    public function isVisibleTo(?User $viewer): bool
    {
        if ($viewer && (int) $this->user_id === (int) $viewer->id) {
            return true;
        }

        if ($this->user?->is_private) {
            return false;
        }

        if ($this->scheduled_at?->isFuture()) {
            return false;
        }

        if ($this->visibility === 'public') {
            return true;
        }

        if (! $viewer || $this->visibility !== 'followers') {
            return false;
        }

        return $viewer->following()->whereKey($this->user_id)->exists();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(VideoLike::class);
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }
}
