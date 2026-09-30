<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HiddenUser;
use App\Models\HiddenVideo;
use App\Models\User;
use App\Models\Video;
use App\Models\VideoReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FeedSafetyController extends Controller
{
    public function hideVideo(Request $request, Video $video): JsonResponse
    {
        HiddenVideo::firstOrCreate(['user_id' => $request->user()->id, 'video_id' => $video->id]);
        return response()->json(['message' => 'Vídeo ocultado do seu feed.']);
    }

    public function hideUser(Request $request, User $user): JsonResponse
    {
        abort_unless($user->id !== $request->user()->id, 422, 'Você não pode ocultar sua própria conta.');
        HiddenUser::firstOrCreate(['user_id' => $request->user()->id, 'hidden_user_id' => $user->id]);
        return response()->json(['message' => 'Os vídeos deste usuário foram ocultados.']);
    }

    public function unhideUser(Request $request, User $user): JsonResponse
    {
        HiddenUser::where('user_id', $request->user()->id)->where('hidden_user_id', $user->id)->delete();
        return response()->json(['message' => 'Os vídeos deste usuário voltarão ao seu feed.']);
    }

    public function hiddenUsers(Request $request): JsonResponse
    {
        $users = $request->user()->hiddenUsers()->select('users.id', 'users.name', 'users.username', 'users.avatar_url')->get();
        return response()->json(['data' => $users]);
    }

    public function reportVideo(Request $request, Video $video): JsonResponse
    {
        abort_unless($video->isVisibleTo($request->user()), 404);
        $data = $request->validate([
            'reason' => ['sometimes', Rule::in(['spam', 'hate', 'nudity', 'violence', 'copyright', 'other'])],
        ]);
        VideoReport::firstOrCreate(
            ['user_id' => $request->user()->id, 'video_id' => $video->id],
            ['reason' => $data['reason'] ?? 'other'],
        );
        $pendingReports = VideoReport::where('video_id', $video->id)->where('status', 'pending')->count();
        if ($pendingReports >= 3) {
            VideoReport::where('video_id', $video->id)->where('status', 'pending')->update(['status' => 'review']);
        }
        return response()->json(['message' => 'Denúncia enviada para análise.']);
    }
}
