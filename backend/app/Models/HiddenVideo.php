<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'video_id'])]
class HiddenVideo extends Model
{
    public function video() { return $this->belongsTo(Video::class); }
}
