<?php

namespace App\Http\Middleware;

use App\Models\IdempotencyKey;
use Closure;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class Idempotency
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $key = trim((string) $request->header('Idempotency-Key'));

        if (! $user || $key === '') {
            return $next($request);
        }

        if (! preg_match('/^[A-Za-z0-9._-]{1,100}$/', $key)) {
            return response()->json(['message' => 'Idempotency-Key inválida.'], 422);
        }

        $attributes = ['user_id' => $user->id, 'key' => $key];
        $values = ['method' => $request->method(), 'path' => $request->path()];

        try {
            $record = IdempotencyKey::firstOrCreate($attributes, $values);
        } catch (QueryException $exception) {
            $record = IdempotencyKey::query()->where($attributes)->first();
            if (! $record) {
                throw $exception;
            }
        }

        if ($record->response !== null && $record->status !== null) {
            return response()->json($record->response, $record->status);
        }

        if (! $record->wasRecentlyCreated && $record->created_at?->lt(now()->subMinutes(10))) {
            $record->delete();
            $record = IdempotencyKey::create($attributes + $values);
        } elseif (! $record->wasRecentlyCreated) {
            return response()->json(['message' => 'Esta ação já está em processamento.'], 409);
        }

        try {
            $response = $next($request);
        } catch (\Throwable $exception) {
            // Uma exceção não deve deixar a ação bloqueada até expirar o TTL.
            $record->delete();
            throw $exception;
        }

        if ($response->isSuccessful()) {
            $payload = json_decode((string) $response->getContent(), true);
            $record->update([
                'status' => $response->getStatusCode(),
                'response' => is_array($payload) ? $payload : ['data' => null],
            ]);
        } else {
            $record->delete();
        }

        return $response;
    }
}
