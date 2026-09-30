<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\VideoLikeController;
use App\Http\Controllers\Api\VideoUploadController;
use App\Http\Controllers\Api\VideoController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\FollowController;
use App\Http\Controllers\Api\PlaylistController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\FeedSafetyController;
use App\Http\Controllers\Api\ModerationController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:auth-register');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth-login');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:auth-password-reset');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:auth-password-reset');
    Route::get('/reset-password/{token}', [AuthController::class, 'showResetForm'])->name('password.reset');
    Route::get('/verify-email/{id}/{hash}', [AuthController::class, 'verifyEmail'])
        ->middleware('signed')
        ->name('verification.verify');
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/email/verification-notification', [AuthController::class, 'sendVerification'])->middleware('throttle:auth-verification');
        Route::middleware('verified')->group(function () {
            Route::get('/profile', [ProfileController::class, 'show']);
            Route::patch('/profile', [ProfileController::class, 'update']);
            Route::post('/profile/image', [ProfileController::class, 'uploadImage'])->middleware('throttle:uploads');
        });
    });
});

Route::middleware('throttle:public-api')->group(function (): void {
    Route::get('/videos', [VideoController::class, 'index']);
    Route::get('/videos/{video}', [VideoController::class, 'show']);
    Route::post('/videos/{video}/view', [VideoController::class, 'registerView'])->middleware('throttle:metrics');
    Route::post('/videos/{video}/share', [VideoController::class, 'registerShare'])->middleware('throttle:metrics');
    Route::get('/videos/{video}/comments', [CommentController::class, 'index']);
    Route::get('/comments/{comment}/replies', [CommentController::class, 'replies']);
    Route::get('/users/recommended', [ProfileController::class, 'recommended']);
    Route::get('/users/{user}', [ProfileController::class, 'showUser']);
    Route::get('/users/{user}/followers', [FollowController::class, 'indexFollowers']);
    Route::get('/users/{user}/following', [FollowController::class, 'indexFollowing']);
});

Route::middleware(['auth:sanctum', 'verified', 'throttle:verified-actions'])->group(function () {
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read-all', [NotificationController::class, 'readAll']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::get('/history/videos', [VideoController::class, 'history']);
    Route::get('/moderation/reports', [ModerationController::class, 'index']);
    Route::patch('/moderation/reports/{report}', [ModerationController::class, 'update']);
    Route::post('/videos/{video}/hide', [FeedSafetyController::class, 'hideVideo']);
    Route::post('/users/{user}/hide', [FeedSafetyController::class, 'hideUser']);
    Route::delete('/users/{user}/hide', [FeedSafetyController::class, 'unhideUser']);
    Route::get('/hidden-users', [FeedSafetyController::class, 'hiddenUsers']);
    Route::post('/videos/{video}/report', [FeedSafetyController::class, 'reportVideo'])->middleware('throttle:reports');
    Route::put('/videos/{video}/like', [VideoLikeController::class, 'store'])->middleware('idempotency');
    Route::delete('/videos/{video}/like', [VideoLikeController::class, 'destroy'])->middleware('idempotency');
    Route::post('/videos/{video}/comments', [CommentController::class, 'store'])->middleware('throttle:comments');
    Route::patch('/comments/{comment}', [CommentController::class, 'update']);
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy']);
    Route::post('/videos/upload', [VideoUploadController::class, 'store'])->middleware('throttle:uploads');
    Route::delete('/videos/upload', [VideoUploadController::class, 'destroy'])->middleware('throttle:upload-cleanup');
    Route::post('/videos', [VideoController::class, 'store']);
    Route::patch('/videos/{video}', [VideoController::class, 'update']);
    Route::delete('/videos/{video}', [VideoController::class, 'destroy']);
    Route::patch('/videos/{video}/pin', [VideoController::class, 'togglePin']);
    Route::put('/videos/{video}/favorite', [FavoriteController::class, 'store'])->middleware('idempotency');
    Route::delete('/videos/{video}/favorite', [FavoriteController::class, 'destroy'])->middleware('idempotency');
    Route::put('/users/{user}/follow', [FollowController::class, 'store'])->middleware('idempotency');
    Route::delete('/users/{user}/follow', [FollowController::class, 'destroy'])->middleware('idempotency');
    Route::get('/playlists', [PlaylistController::class, 'index']);
    Route::get('/playlists/{playlist}', [PlaylistController::class, 'show']);
    Route::post('/playlists', [PlaylistController::class, 'store']);
    Route::delete('/playlists/{playlist}', [PlaylistController::class, 'destroy']);
    Route::put('/playlists/{playlist}/videos/{video}', [PlaylistController::class, 'addVideo']);
    Route::delete('/playlists/{playlist}/videos/{video}', [PlaylistController::class, 'removeVideo']);
});
