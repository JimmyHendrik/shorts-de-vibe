<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    private function isModerator(User $user): bool
    {
        return collect(config('services.vibe.moderator_emails', []))
            ->contains(strtolower($user->email));
    }

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'username' => ['required', 'string', 'min:3', 'max:30', 'alpha_dash', Rule::unique('users', 'username')],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'name.required' => 'O nome é obrigatório.',
            'name.max' => 'O nome não pode ter mais de :max caracteres.',
            'username.required' => 'O usuário é obrigatório.',
            'username.min' => 'O usuário deve ter pelo menos :min caracteres.',
            'username.max' => 'O usuário não pode ter mais de :max caracteres.',
            'username.alpha_dash' => 'O usuário deve conter apenas letras, números, hífen ou sublinhado.',
            'username.unique' => 'Este usuário já está em uso.',
            'email.required' => 'O e-mail é obrigatório.',
            'email.email' => 'Digite um e-mail válido.',
            'email.max' => 'O e-mail não pode ter mais de :max caracteres.',
            'email.unique' => 'Este e-mail já está cadastrado.',
            'password.required' => 'A senha é obrigatória.',
            'password.min' => 'A senha deve ter pelo menos :min caracteres.',
            'password.confirmed' => 'A confirmação da senha não confere.',
        ]);

        $user = User::create([
            'name' => $data['name'],
            'username' => $data['username'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        $user->sendEmailVerificationNotification();

        return response()->json([
            'user' => $user,
            'token' => $user->createToken('vibe-web')->plainTextToken,
            'email_verification_required' => true,
            'is_moderator' => $this->isModerator($user),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ], [
            'email.required' => 'O e-mail é obrigatório.',
            'email.email' => 'Digite um e-mail válido.',
            'password.required' => 'A senha é obrigatória.',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json([
                'message' => 'E-mail ou senha inválidos.',
            ], 422);
        }

        if (! $user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Confirme seu e-mail antes de entrar.',
                'email_verification_required' => true,
            ], 403);
        }

        // Revoga tokens antigos para reduzir o tempo de exposição de sessões
        // que possam ter sido copiadas do navegador.
        $user->tokens()->delete();

        return response()->json([
            'user' => $user,
            'token' => $user->createToken('vibe-web')->plainTextToken,
            'email_verified' => $user->hasVerifiedEmail(),
            'email_verification_required' => ! $user->hasVerifiedEmail(),
            'is_moderator' => $this->isModerator($user),
        ]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ], [
            'email.required' => 'O e-mail é obrigatório.',
            'email.email' => 'Digite um e-mail válido.',
        ]);

        Password::sendResetLink($data);

        return response()->json([
            'message' => 'Se o e-mail estiver cadastrado, enviaremos um link para redefinir sua senha.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'token.required' => 'O código de redefinição é obrigatório.',
            'email.required' => 'O e-mail é obrigatório.',
            'email.email' => 'Digite um e-mail válido.',
            'password.required' => 'A senha é obrigatória.',
            'password.min' => 'A senha deve ter pelo menos :min caracteres.',
            'password.confirmed' => 'A confirmação da senha não confere.',
        ]);

        $status = Password::reset($data, function (User $user, string $password): void {
            $user->forceFill([
                'password' => Hash::make($password),
                'remember_token' => Str::random(60),
            ])->save();
            $user->tokens()->delete();
        });

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json(['message' => 'O link de redefinição é inválido ou expirou.'], 422);
        }

        return response()->json(['message' => 'Senha redefinida com sucesso.']);
    }

    public function showResetForm(Request $request, string $token)
    {
        $frontend = rtrim((string) config('services.vibe.frontend_url'), '/');
        $query = http_build_query(['reset_token' => $token, 'reset_email' => $request->query('email')]);

        return redirect()->away($frontend . '/?' . $query);
    }

    public function sendVerification(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
        }

        return response()->json(['message' => 'Enviamos um novo link de confirmação para seu e-mail.']);
    }

    public function verifyEmail(Request $request, int $id, string $hash): JsonResponse
    {
        $user = User::findOrFail($id);
        abort_unless(hash_equals(sha1($user->getEmailForVerification()), $hash), 403, 'Link de confirmação inválido.');

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        return response()->json(['message' => 'E-mail confirmado com sucesso.']);
    }

    public function me(Request $request): User
    {
        $user = $request->user();
        $user->setAttribute('is_moderator', $this->isModerator($user));

        return $user;
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(status: 204);
    }
}
