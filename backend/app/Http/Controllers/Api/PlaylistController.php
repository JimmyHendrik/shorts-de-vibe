<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Playlist;
use App\Http\Resources\VideoResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlaylistController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(['data' => $request->user()->playlists()->withCount('videos')->latest()->get()]);
    }

    public function show(Request $request, Playlist $playlist): JsonResponse
    {
        abort_unless($playlist->user_id === $request->user()->id, 403);

        $videos = $playlist->videos()
            ->visibleTo($request->user())
            ->with('user')
            ->withCount(['likes', 'comments', 'favorites'])
            ->get();

        return response()->json([
            'data' => $playlist,
            'videos' => VideoResource::collection($videos)->resolve(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:100'], 'description' => ['nullable', 'string', 'max:500']]);
        $playlist = $request->user()->playlists()->create($data);
        return response()->json(['data' => $playlist], 201);
    }

    public function destroy(Request $request, Playlist $playlist): JsonResponse
    {
        abort_unless($playlist->user_id === $request->user()->id, 403);
        $playlist->delete();
        return response()->json(status: 204);
    }

    public function addVideo(Request $request, Playlist $playlist, \App\Models\Video $video): JsonResponse
    {
        abort_unless($playlist->user_id === $request->user()->id, 403);
        abort_unless($video->isVisibleTo($request->user()), 404);
        DB::transaction(function () use ($playlist, $video): void {
            $lockedPlaylist = Playlist::query()->whereKey($playlist->id)->lockForUpdate()->firstOrFail();

            if ($lockedPlaylist->videos()->whereKey($video->id)->exists()) {
                return;
            }

            $nextPosition = ((int) $lockedPlaylist->videos()->max('position')) + 1;
            $lockedPlaylist->videos()->attach($video->id, ['position' => $nextPosition]);
        });
        return response()->json(['data' => ['added' => true]]);
    }

    public function removeVideo(Request $request, Playlist $playlist, \App\Models\Video $video): JsonResponse
    {
        abort_unless($playlist->user_id === $request->user()->id, 403);
        $playlist->videos()->detach($video->id);
        return response()->json(['data' => ['added' => false]]);
    }
}
