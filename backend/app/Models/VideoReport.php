<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'video_id', 'reason', 'status'])]
class VideoReport extends Model
{
    public function video() { return $this->belongsTo(Video::class); }
    public function user() { return $this->belongsTo(User::class); }
}
