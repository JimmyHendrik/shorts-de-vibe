<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('videos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('description', 2200)->nullable();
            $table->string('video_url');
            $table->string('thumbnail_url')->nullable();
            $table->string('cloudinary_public_id')->nullable()->unique();
            $table->unsignedSmallInteger('duration_seconds')->nullable();
            $table->string('visibility', 20)->default('public');
            $table->boolean('allow_comments')->default(true);
            $table->unsignedBigInteger('view_count')->default(0);
            $table->timestamps();

            $table->index(['user_id', 'visibility']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('videos');
    }
};
