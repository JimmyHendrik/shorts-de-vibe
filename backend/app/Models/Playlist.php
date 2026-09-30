<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['user_id', 'name', 'description'])]
class Playlist extends Model
{
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function videos(): BelongsToMany { return $this->belongsToMany(Video::class)->withPivot('position')->orderBy('position'); }
}
