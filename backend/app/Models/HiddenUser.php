<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'hidden_user_id'])]
class HiddenUser extends Model
{
    public function hiddenUser() { return $this->belongsTo(User::class, 'hidden_user_id'); }
}
