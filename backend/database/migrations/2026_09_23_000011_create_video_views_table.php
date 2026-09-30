<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('video_views', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('video_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('watched_seconds')->default(0);
            $table->timestamp('viewed_at');
            $table->index(['user_id', 'viewed_at']);
            $table->index(['video_id', 'viewed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('video_views');
    }
};
