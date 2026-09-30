<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\Notification;

class FollowController extends Controller
{
    public function indexFollowers(Request $request, User $user): JsonResponse
    {
        $this->ensureProfileVisible($request, $user);
        return response()->json(['data' => $user->followers()->select('users.id', 'users.name', 'users.username', 'users.avatar_url')->get()]);
    }

    public function indexFollowing(Request $request, User $user): JsonResponse
    {
        $this->ensureProfileVisible($request, $user);
        return response()->json(['data' => $user->following()->select('users.id', 'users.name', 'users.username', 'users.avatar_url')->get()]);
    }

    public function store(Request $request, User $user): JsonResponse
    {
        abort_if($request->user()->is($user), 422, 'Você não pode seguir a si mesmo.');
        abort_unless($user->allow_following, 403, 'Este perfil não aceita novos seguidores.');
        $changes = $request->user()->following()->syncWithoutDetaching([$user->id]);
        if (in_array($user->id, $changes['attached'], true)) {
            Notification::create(['user_id' => $user->id, 'actor_id' => $request->user()->id, 'type' => 'follow']);
        }

        return response()->json(['data' => $this->status($request, $user, true)]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $request->user()->following()->detach($user->id);

        return response()->json(['data' => $this->status($request, $user, false)]);
    }

    private function status(Request $request, User $user, bool $following): array
    {
        return [
            'following' => $following,
            'followers_count' => $user->followers()->count(),
        ];
    }

    private function ensureProfileVisible(Request $request, User $user): void
    {
        abort_unless(! $user->is_private || $request->user('sanctum')?->is($user), 404);
    }
}
