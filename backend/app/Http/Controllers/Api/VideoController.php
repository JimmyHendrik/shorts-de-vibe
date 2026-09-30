<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\VideoResource;
use App\Models\User;
use App\Models\Video;
use App\Models\VideoView;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VideoController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = min(max($request->integer('per_page', 10), 1), 30);
        $viewerId = $request->user('sanctum')?->id;
        $viewer = $request->user('sanctum');
        if ($viewer) {
            $request->attributes->set(
                'following_user_ids',
                $viewer->following()->pluck('users.id')->flip()->all(),
            );
        }
        $search = trim($request->string('search')->toString());
        $feed = $request->string('feed', 'discover')->toString();
        $sort = $request->string('sort', 'relevance')->toString();
        $followedUserIds = $viewer
            ? $viewer->following()->pluck('users.id')->all()
            : [];
        $interestTerms = $viewer
            ? collect($viewer->interests ?? [])->map(fn ($interest) => trim((string) $interest))->filter()->unique()->take(12)->values()->all()
            : [];

        $videos = Video::query()
            ->visibleTo($viewer)
            ->where(function (Builder $query): void {
                $query->whereNull('scheduled_at')->orWhere('scheduled_at', '<=', now());
            })
            ->when($feed === 'following' && $viewerId, function (Builder $query) use ($request): void {
                $query->whereIn('user_id', $request->user('sanctum')->following()->select('users.id'));
            })
            ->when($viewerId, function (Builder $query) use ($viewerId): void {
                $query->whereNotIn('videos.id', function ($hidden) use ($viewerId): void {
                    $hidden->select('video_id')->from('hidden_videos')->where('user_id', $viewerId);
                })->whereNotIn('videos.user_id', function ($hidden) use ($viewerId): void {
                    $hidden->select('hidden_user_id')->from('hidden_users')->where('user_id', $viewerId);
                });
            })
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('description', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($query) use ($search) {
                            $query->where('username', 'like', "%{$search}%")
                                ->orWhere('name', 'like', "%{$search}%");
                        });
                });
            })
            ->with('user')
            ->withCount(['likes', 'comments', 'favorites'])
            ->withExists([
                'likes as liked_by_current_user' => fn ($query) => $query->where('user_id', $viewerId),
                'favorites as favorited_by_current_user' => fn ($query) => $query->where('user_id', $viewerId),
            ])
            ->when($sort === 'popular', fn (Builder $query) => $query->orderByDesc('view_count')->orderByDesc('likes_count')->latest())
            ->when($sort === 'recent', fn (Builder $query) => $query->latest())
            ->when($sort === 'longest', fn (Builder $query) => $query->orderByDesc('duration_seconds')->latest())
            ->when($sort === 'relevance' && $feed === 'discover', function (Builder $query) use ($viewerId, $followedUserIds, $interestTerms): void {
                if ($viewerId && $followedUserIds) {
                    $placeholders = implode(',', array_fill(0, count($followedUserIds), '?'));
                    $query->orderByRaw("CASE WHEN videos.user_id IN ({$placeholders}) THEN 30 ELSE 0 END DESC", $followedUserIds);
                }

                foreach ($interestTerms as $interest) {
                    $query->orderByRaw('CASE WHEN videos.description LIKE ? THEN 10 ELSE 0 END DESC', ["%{$interest}%"]);
                }

                $query->orderByDesc('likes_count')->latest();
            })
            ->when($sort === 'relevance' && $feed !== 'discover', fn (Builder $query) => $query->latest())
            ->cursorPaginate($perPage);

        return VideoResource::collection($videos)->withQuery(array_filter(['per_page' => $perPage, 'search' => $search ?: null, 'feed' => $feed !== 'discover' ? $feed : null, 'sort' => $sort !== 'relevance' ? $sort : null]));
    }

    public function show(Request $request, Video $video): VideoResource
    {
        $viewerId = $request->user('sanctum')?->id;
        abort_unless($video->isVisibleTo($request->user('sanctum')), 404);

        $video->load('user')->loadCount(['likes', 'comments', 'favorites']);
        $video->setAttribute(
            'liked_by_current_user',
            $viewerId && $video->likes()->where('user_id', $viewerId)->exists(),
        );
        $video->setAttribute(
            'favorited_by_current_user',
            $viewerId && $video->favorites()->where('user_id', $viewerId)->exists(),
        );

        return new VideoResource($video);
    }

    public function registerView(Request $request, Video $video): JsonResponse
    {
        abort_unless($video->isVisibleTo($request->user('sanctum')), 404);
        $viewer = $request->user('sanctum');
        if ($viewer) {
            DB::transaction(function () use ($video, $viewer): void {
                Video::query()->whereKey($video->id)->lockForUpdate()->firstOrFail();
                $recentView = VideoView::query()
                    ->where('user_id', $viewer->id)
                    ->where('video_id', $video->id)
                    ->where('viewed_at', '>=', now()->subMinutes(30))
                    ->exists();

                if (! $recentView) {
                    VideoView::create([
                        'user_id' => $viewer->id,
                        'video_id' => $video->id,
                        'viewed_at' => now(),
                    ]);
                    $video->increment('view_count');
                }
            });
        } else {
            $visitor = hash_hmac('sha256', (string) $request->ip(), (string) config('app.key'));
            $cacheKey = "video-view:{$video->id}:{$visitor}";

            if (Cache::add($cacheKey, true, now()->addMinutes(30))) {
                $video->increment('view_count');
            }
        }

        return response()->json(['data' => ['view_count' => $video->fresh()->view_count]]);
    }

    public function registerShare(Request $request, Video $video): JsonResponse
    {
        abort_unless($video->isVisibleTo($request->user('sanctum')), 404);
        $video->increment('shares_count');

        return response()->json(['data' => ['shares_count' => $video->fresh()->shares_count]]);
    }

    public function history(Request $request): AnonymousResourceCollection
    {
        $videos = VideoView::query()->where('user_id', $request->user()->id)
            ->whereHas('video', fn (Builder $query) => $query->visibleTo($request->user()))
            ->with('video.user')->latest('viewed_at')->paginate(20);
        $videos->setCollection($videos->getCollection()->map(fn (VideoView $view) => $view->video));
        return VideoResource::collection($videos);
    }

    public function store(Request $request): VideoResource
    {
        $video = $request->user()->videos()->create(
            $this->validatedData($request, isCreating: true),
        );

        $video->load('user')->loadCount(['likes', 'comments', 'favorites']);

        return new VideoResource($video);
    }

    public function update(Request $request, Video $video): VideoResource
    {
        $this->ensureOwner($request, $video);

        $video->update($this->validatedData($request, isCreating: false, video: $video));
        $video->load('user')->loadCount(['likes', 'comments', 'favorites']);

        return new VideoResource($video);
    }

    public function destroy(Request $request, Video $video): JsonResponse
    {
        $this->ensureOwner($request, $video);
        $video->delete();

        return response()->json(status: 204);
    }

    public function togglePin(Request $request, Video $video): JsonResponse
    {
        $pinned = DB::transaction(function () use ($request, $video): bool {
            $owner = User::query()->whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            $lockedVideo = Video::query()->whereKey($video->id)->lockForUpdate()->firstOrFail();
            $this->ensureOwner($request, $lockedVideo);

            if ($lockedVideo->pinned_at) {
                $lockedVideo->update(['pinned_at' => null]);
                return false;
            }

            if ($owner->videos()->whereNotNull('pinned_at')->count() >= 3) {
                abort(422, 'Você pode fixar no máximo três vídeos.');
            }

            $lockedVideo->update(['pinned_at' => now()]);
            return true;
        });

        return response()->json(['data' => ['pinned' => $pinned]]);
    }

    /** @return array<string, mixed> */
    private function validatedData(Request $request, bool $isCreating, ?Video $video = null): array
    {
        $cloudinaryPublicIdRule = Rule::unique('videos', 'cloudinary_public_id');

        if ($video) {
            $cloudinaryPublicIdRule->ignore($video);
        }

        $validated = $request->validate([
            'description' => ['nullable', 'string', 'max:1000'],
            'location' => ['nullable', 'string', 'max:120'],
            'video_url' => [$isCreating ? 'required' : 'sometimes', 'url', 'max:2048', $this->cloudinaryUrlRule((int) $request->user()->id)],
            'thumbnail_url' => ['nullable', 'url', 'max:2048', $this->cloudinaryUrlRule((int) $request->user()->id)],
            'cloudinary_public_id' => [$isCreating ? 'required' : 'sometimes', 'string', 'max:255', $cloudinaryPublicIdRule],
            'duration_seconds' => ['nullable', 'integer', 'min:1', 'max:36000'],
            'visibility' => ['sometimes', Rule::in(['public', 'followers', 'private'])],
            'allow_comments' => ['sometimes', 'boolean'],
            'scheduled_at' => ['nullable', 'date', 'after_or_equal:now'],
            'allow_reuse' => ['sometimes', 'boolean'],
            'is_ai_generated' => ['sometimes', 'boolean'],
            'age_restricted' => ['sometimes', 'boolean'],
            'high_quality' => ['sometimes', 'boolean'],
        ]);

        if (! empty($validated['cloudinary_public_id'])) {
            $expectedPrefix = 'vibe-shorts/videos/'.$request->user()->id.'/';
            if (! str_starts_with($validated['cloudinary_public_id'], $expectedPrefix)) {
                throw ValidationException::withMessages([
                    'cloudinary_public_id' => 'O vídeo enviado não pertence à sua conta.',
                ]);
            }

            $videoPath = parse_url($validated['video_url'] ?? '', PHP_URL_PATH);
            if (! is_string($videoPath) || ! str_contains($videoPath, '/'.$validated['cloudinary_public_id'].'.')) {
                throw ValidationException::withMessages([
                    'video_url' => 'A URL não corresponde ao arquivo de vídeo enviado.',
                ]);
            }
        }

        if (! empty($validated['description'])) {
            preg_match_all('/(^|\s)#([\p{L}\p{N}_]+)/u', $validated['description'], $matches);
            if (count($matches[0]) > 10) {
                throw ValidationException::withMessages([
                    'description' => 'A descrição pode conter no máximo 10 hashtags.',
                ]);
            }
        }

        return $validated;
    }

    private function cloudinaryUrlRule(int $userId): \Closure
    {
        return function (string $attribute, mixed $value, \Closure $fail) use ($userId): void {
            if ($value === null || $value === '') {
                return;
            }

            $cloudName = (string) config('services.cloudinary.cloud_name');
            $parts = parse_url((string) $value);
            $expectedPrefix = '/'.$cloudName.'/';
            $ownerFolder = '/vibe-shorts/videos/'.$userId.'/';

            if (
                ($parts['scheme'] ?? null) !== 'https'
                || ($parts['host'] ?? null) !== 'res.cloudinary.com'
                || $cloudName === ''
                || ! str_starts_with($parts['path'] ?? '', $expectedPrefix)
                || ! str_contains($parts['path'] ?? '', $ownerFolder)
            ) {
                $fail('A mídia deve estar hospedada na conta Cloudinary configurada.');
            }
        };
    }

    private function ensureOwner(Request $request, Video $video): void
    {
        abort_unless($request->user()->is($video->user), 403);
    }
}
