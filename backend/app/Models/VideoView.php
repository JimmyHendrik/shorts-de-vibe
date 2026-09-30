<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'video_id', 'watched_seconds', 'viewed_at'])]
class VideoView extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return ['watched_seconds' => 'integer', 'viewed_at' => 'datetime'];
    }

    public function video() { return $this->belongsTo(Video::class); }
    public function user() { return $this->belongsTo(User::class); }
}
