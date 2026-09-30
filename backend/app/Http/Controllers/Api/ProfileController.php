<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\VideoResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Services\CloudinaryImageUploader;
use App\Models\Comment;
use App\Models\Favorite;
use App\Models\Video;
use App\Models\VideoLike;
use RuntimeException;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return $this->profileResponse($request, $request->user(), true);
    }

    public function showUser(Request $request, \App\Models\User $user): JsonResponse
    {
        abort_unless(! $user->is_private || $request->user('sanctum')?->is($user), 404);
        return $this->profileResponse($request, $user, false);
    }

    public function recommended(Request $request): JsonResponse
    {
        $viewer = $request->user('sanctum');
        $followingIds = $viewer?->following()->pluck('users.id')->all() ?? [];
        $hiddenIds = $viewer?->hiddenUsers()->pluck('users.id')->all() ?? [];
        $followingSet = array_fill_keys(array_map('intval', $followingIds), true);
        $interestTerms = collect($viewer?->interests ?? [])
            ->map(fn ($interest) => mb_strtolower(trim((string) $interest)))
            ->filter()->unique()->values();

        $users = \App\Models\User::query()
            ->when($viewer, fn ($query) => $query->where('id', '<>', $viewer->id))
            ->whereNotIn('id', array_merge($followingIds, $hiddenIds))
            ->where('is_private', false)
            ->withCount(['videos', 'followers'])
            ->limit(60)
            ->get();

        $recommendations = $users->map(function ($user) use ($interestTerms): array {
            $userInterests = collect($user->interests ?? [])
                ->map(fn ($interest) => mb_strtolower(trim((string) $interest)));
            $shared = $interestTerms->intersect($userInterests)->values()->all();
            $user->setAttribute('recommendation_score', count($shared) * 10 + ($user->followers_count ?? 0) + ($user->videos_count ?? 0));
            return [
                'user' => $user,
                'shared_interests' => $shared,
            ];
        })->sortByDesc(fn ($item) => $item['user']->recommendation_score)->take(8)->values();

        return response()->json(['data' => $recommendations->map(function (array $item) use ($followingSet): array {
            $user = $item['user'];
            return [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'avatar_url' => $user->avatar_url,
                'videos_count' => $user->videos_count ?? 0,
                'followers_count' => $user->followers_count ?? 0,
                'is_following' => isset($followingSet[(int) $user->id]),
                'shared_interests' => $item['shared_interests'],
            ];
        })]);
    }

    private function profileResponse(Request $request, $user, bool $includePrivate): JsonResponse
    {
        $tab = $request->string('tab', 'videos')->toString();
        if (! $includePrivate) $tab = 'videos';
        $user->loadCount(['videos', 'followers', 'following']);
        $user->loadSum('videos', 'view_count');

        $videos = match ($tab) {
            'liked' => \App\Models\Video::whereHas('likes', fn ($query) => $query->where('user_id', $user->id)),
            'favorites' => \App\Models\Video::whereHas('favorites', fn ($query) => $query->where('user_id', $user->id)),
            default => $user->videos(),
        };
        $videos->visibleTo($request->user('sanctum'));
        $videos = $videos->orderByRaw('pinned_at IS NULL')->latest()->with('user')->withCount(['likes', 'comments', 'favorites'])->get();

        return response()->json([
            'user' => array_merge($this->userData($user, $includePrivate), [
                'is_following' => (bool) ($request->user('sanctum')?->following()->whereKey($user->id)->exists()),
            ]),
            'videos' => VideoResource::collection($videos)->resolve(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'username' => ['sometimes', 'string', 'min:3', 'max:30', 'alpha_dash', Rule::unique('users', 'username')->ignore($user)],
            'bio' => ['nullable', 'string', 'max:500'],
            'avatar_url' => ['nullable', 'url', 'max:2048', $this->cloudinaryUrlRule((int) $user->id)],
            'cover_url' => ['nullable', 'url', 'max:2048', $this->cloudinaryUrlRule((int) $user->id)],
            'is_private' => ['sometimes', 'boolean'],
            'show_liked_videos' => ['sometimes', 'boolean'],
            'allow_following' => ['sometimes', 'boolean'],
            'allow_comments' => ['sometimes', 'boolean'],
            'interests' => ['sometimes', 'array', 'max:100'],
            'interests.*' => ['string', 'max:40'],
            'onboarding_completed' => ['sometimes', 'boolean'],
        ]);

        $user->update($data);
        $user->loadCount(['videos', 'followers', 'following']);
        $user->loadSum('videos', 'view_count');

        return response()->json(['user' => $this->userData($user, true)]);
    }

    public function uploadImage(Request $request, CloudinaryImageUploader $uploader): JsonResponse
    {
        $data = $request->validate([
            'image' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'type' => ['required', Rule::in(['avatar', 'cover'])],
        ]);

        $user = $request->user();
        try {
            $url = $uploader->upload($data['image'], 'vibe-shorts/profiles/'.$user->id);
        } catch (RuntimeException $exception) {
            report($exception);
            return response()->json(['message' => 'Não foi possível enviar a imagem agora.'], 503);
        }

        $field = $data['type'] === 'cover' ? 'cover_url' : 'avatar_url';
        $user->update([$field => $url]);
        return response()->json(['user' => $this->userData($user, true)]);
    }

    private function userData($user, bool $includePrivate): array
    {
        $videoStats = Video::query()
            ->where('user_id', $user->id)
            ->selectRaw('COALESCE(SUM(view_count), 0) AS views')
            ->selectRaw('COALESCE(SUM(shares_count), 0) AS shares')
            ->selectRaw('COALESCE(MAX(view_count), 0) AS top_video_views')
            ->first();
        $stats = [
            'likes' => VideoLike::whereHas('video', fn ($query) => $query->where('user_id', $user->id))->count(),
            'comments' => Comment::whereHas('video', fn ($query) => $query->where('user_id', $user->id))->count(),
            'favorites' => Favorite::whereHas('video', fn ($query) => $query->where('user_id', $user->id))->count(),
            'shares' => (int) ($videoStats->shares ?? 0),
            'views' => (int) ($videoStats->views ?? 0),
            'top_video_views' => (int) ($videoStats->top_video_views ?? 0),
        ];
        $stats['average_views'] = ($user->videos_count ?? 0) > 0
            ? (int) round($stats['views'] / $user->videos_count)
            : 0;

        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            ...($includePrivate ? ['email' => $user->email] : []),
            'bio' => $user->bio,
            'avatar_url' => $user->avatar_url,
            'cover_url' => $user->cover_url,
            'is_private' => (bool) $user->is_private,
            'show_liked_videos' => (bool) $user->show_liked_videos,
            'allow_following' => (bool) $user->allow_following,
            'allow_comments' => (bool) $user->allow_comments,
            'interests' => $user->interests ?? [],
            'onboarding_completed' => (bool) $user->onboarding_completed,
            'videos_count' => $user->videos_count ?? 0,
            'views_count' => $user->videos_sum_view_count ?? 0,
            'followers_count' => $user->followers_count ?? 0,
            'following_count' => $user->following_count ?? 0,
            'stats' => $stats,
        ];
    }

    private function cloudinaryUrlRule(int $userId): \Closure
    {
        return function (string $attribute, mixed $value, \Closure $fail) use ($userId): void {
            if ($value === null || $value === '') {
                return;
            }

            $cloudName = (string) config('services.cloudinary.cloud_name');
            $parts = parse_url((string) $value);
            $ownerFolder = '/vibe-shorts/profiles/'.$userId.'/';

            if (
                ($parts['scheme'] ?? null) !== 'https'
                || ($parts['host'] ?? null) !== 'res.cloudinary.com'
                || $cloudName === ''
                || ! str_starts_with($parts['path'] ?? '', '/'.$cloudName.'/')
                || ! str_contains($parts['path'] ?? '', $ownerFolder)
            ) {
                $fail('A imagem deve estar hospedada na conta Cloudinary configurada.');
            }
        };
    }
}
