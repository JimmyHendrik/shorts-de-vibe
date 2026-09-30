<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Video;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function store(Request $request, Video $video): JsonResponse
    {
        abort_unless($video->isVisibleTo($request->user('sanctum')), 404);
        $video->favorites()->firstOrCreate(['user_id' => $request->user()->id]);

        return response()->json(['data' => ['favorited' => true, 'favorites_count' => $video->favorites()->count()]]);
    }

    public function destroy(Request $request, Video $video): JsonResponse
    {
        abort_unless($video->isVisibleTo($request->user('sanctum')), 404);
        $video->favorites()->where('user_id', $request->user()->id)->delete();

        return response()->json(['data' => ['favorited' => false, 'favorites_count' => $video->favorites()->count()]]);
    }
}
