<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $video = $this->video;

        return [
            'id' => $this->id,
            'type' => $this->type,
            'data' => $this->data ?? [],
            'read_at' => $this->read_at,
            'actor' => $this->actor ? ['name' => $this->actor->name, 'username' => $this->actor->username, 'avatar_url' => $this->actor->avatar_url] : null,
            'video' => $video && $video->isVisibleTo($request->user('sanctum'))
                ? ['id' => $video->id, 'description' => $video->description, 'thumbnail_url' => $video->thumbnail_url]
                : null,
            'created_at' => $this->created_at,
        ];
    }
}
