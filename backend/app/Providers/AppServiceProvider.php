<?php

namespace App\Providers;

use Illuminate\Support\Facades\Schema;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Compatibilidade com instalações MySQL que limitam índices utf8mb4
        // a 1000 bytes (255 caracteres excedem esse limite).
        Schema::defaultStringLength(191);

        RateLimiter::for('auth-login', function (Request $request): array {
            $email = Str::lower(trim((string) $request->input('email')));

            return [
                Limit::perMinute(5)->by('login-ip:'.$request->ip()),
                Limit::perMinute(5)->by('login-email:'.$email.'|'.$request->ip()),
            ];
        });
        RateLimiter::for('auth-register', fn (Request $request) => Limit::perHour(5)->by($request->ip()));
        RateLimiter::for('auth-password-reset', function (Request $request): array {
            $email = Str::lower(trim((string) $request->input('email')));

            return [
                Limit::perHour(5)->by('reset-ip:'.$request->ip()),
                Limit::perHour(3)->by('reset-email:'.$email),
            ];
        });
        RateLimiter::for('auth-verification', fn (Request $request) => Limit::perHour(3)->by((string) $request->user()->getAuthIdentifier()));
        RateLimiter::for('uploads', function (Request $request): array {
            $userId = (string) ($request->user()?->getAuthIdentifier() ?? $request->ip());

            return [
                Limit::perMinute(3)->by('upload-minute:'.$userId),
                Limit::perDay(20)->by('upload-day:'.$userId),
            ];
        });
        RateLimiter::for('upload-cleanup', fn (Request $request) => Limit::perMinute(10)->by((string) $request->user()->getAuthIdentifier()));
        RateLimiter::for('comments', fn (Request $request) => Limit::perMinute(10)->by((string) ($request->user()?->getAuthIdentifier() ?? $request->ip())));
        RateLimiter::for('reports', fn (Request $request) => Limit::perDay(10)->by((string) ($request->user()?->getAuthIdentifier() ?? $request->ip())));
        RateLimiter::for('metrics', fn (Request $request) => Limit::perMinute(30)->by($request->ip()));
        RateLimiter::for('verified-actions', fn (Request $request) => Limit::perMinute(120)->by((string) ($request->user()?->getAuthIdentifier() ?? $request->ip())));
        RateLimiter::for('public-api', fn (Request $request) => Limit::perMinute(120)->by($request->ip()));
    }
}
