<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\Video;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class CommentController extends Controller
{
    public function index(Request $request, Video $video): AnonymousResourceCollection
    {
        $this->ensureVideoVisibleTo($request, $video);

        $perPage = min(max($request->integer('per_page', 20), 1), 50);
        $comments = $video->comments()
            ->whereNull('parent_id')
            ->with('user')
            ->withCount('replies')
            ->latest()
            ->cursorPaginate($perPage);

        return CommentResource::collection($comments)->withQuery(['per_page' => $perPage]);
    }

    public function replies(Request $request, Comment $comment): AnonymousResourceCollection
    {
        $comment->load('video');
        $this->ensureVideoVisibleTo($request, $comment->video);

        return CommentResource::collection(
            $comment->replies()->with('user')->latest()->limit(50)->get(),
        );
    }

    public function store(Request $request, Video $video): JsonResponse
    {
        $this->ensureVideoVisibleTo($request, $video);
        abort_unless($video->allow_comments, 403, 'Comentários estão desativados para este vídeo.');

        $data = $request->validate([
            'body' => ['required', 'string', 'max:1000'],
            'parent_id' => ['nullable', 'integer', Rule::exists('comments', 'id')],
        ]);

        $data['body'] = $this->validateCommentBody($data['body']);

        if (isset($data['parent_id'])) {
            abort_unless(
                $video->comments()->whereKey($data['parent_id'])->exists(),
                422,
                'O comentário respondido não pertence a este vídeo.',
            );
        }

        $comment = new Comment([
            'body' => $data['body'],
            'parent_id' => $data['parent_id'] ?? null,
        ]);
        $comment->user()->associate($request->user());
        $video->comments()->save($comment);

        if ($video->user_id !== $request->user()->id) {
            Notification::create(['user_id' => $video->user_id, 'actor_id' => $request->user()->id, 'video_id' => $video->id, 'type' => $comment->parent_id ? 'reply' : 'comment']);
        }

        preg_match_all('/(?<![\p{L}\p{N}_])@([A-Za-z0-9_]+)/u', $comment->body, $matches);
        $mentionedUsers = User::whereIn('username', array_unique($matches[1] ?? []))->get();
        foreach ($mentionedUsers as $mentionedUser) {
            if ($mentionedUser->id === $request->user()->id || $mentionedUser->id === $video->user_id) continue;
            Notification::create([
                'user_id' => $mentionedUser->id,
                'actor_id' => $request->user()->id,
                'video_id' => $video->id,
                'type' => 'mention',
            ]);
        }

        $comment->load('user')->loadCount('replies');

        return (new CommentResource($comment))->response()->setStatusCode(201);
    }

    public function update(Request $request, Comment $comment): CommentResource
    {
        $comment->load('video');
        $this->ensureVideoVisibleTo($request, $comment->video);
        abort_unless(
            $comment->user_id === $request->user()->id,
            403,
            'Você só pode editar seus próprios comentários.',
        );

        $data = $request->validate([
            'body' => ['required', 'string', 'max:1000'],
        ]);

        $body = $this->validateCommentBody($data['body']);
        $comment->update(['body' => $body]);
        $comment->load('user')->loadCount('replies');

        return new CommentResource($comment);
    }

    public function destroy(Request $request, Comment $comment): JsonResponse
    {
        $comment->load('video');
        $this->ensureVideoVisibleTo($request, $comment->video);
        abort_unless(
            $comment->user_id === $request->user()->id
                || $comment->video->user_id === $request->user()->id,
            403,
            'Você só pode excluir seus comentários ou comentários dos seus vídeos.',
        );

        $comment->delete();

        return response()->json(null, 204);
    }

    private function ensureVideoVisibleTo(Request $request, Video $video): void
    {
        abort_unless($video->isVisibleTo($request->user('sanctum')), 404);
    }

    private function validateCommentBody(string $body): string
    {
        $body = trim($body);
        $linkCount = preg_match_all('/https?:\/\/|www\./i', $body);

        if ($body === '' || $linkCount > 2 || preg_match('/(.)\1{8,}/u', $body) || substr_count($body, '@') > 10) {
            throw ValidationException::withMessages([
                'body' => $body === ''
                    ? 'O comentário não pode ficar vazio.'
                    : 'Este comentário parece spam. Revise o texto e tente novamente.',
            ]);
        }

        return $body;
    }
}
