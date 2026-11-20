<?php

namespace Tests\Feature\Api;

use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    public function test_google_callback_reports_provider_exchange_failures(): void
    {
        $exception = new RuntimeException('Google token exchange failed.');
        $provider = Mockery::mock();
        $provider->shouldReceive('stateless')->once()->andReturnSelf();
        $provider->shouldReceive('user')->once()->andThrow($exception);

        Socialite::shouldReceive('driver')
            ->once()
            ->with('google')
            ->andReturn($provider);
        Log::shouldReceive('error')
            ->once()
            ->withArgs(fn (string $message, array $context): bool => $message === $exception->getMessage());

        $this->get('/api/auth/google/callback')
            ->assertRedirect('http://localhost:5500/?auth_error=Falha+ao+autenticar+com+o+Google.');
    }
}
