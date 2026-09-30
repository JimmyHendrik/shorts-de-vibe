<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('cover_url')->nullable()->after('avatar_url');
            $table->boolean('show_liked_videos')->default(false)->after('is_private');
            $table->boolean('allow_following')->default(true)->after('show_liked_videos');
            $table->boolean('allow_comments')->default(true)->after('allow_following');
        });

        Schema::table('videos', function (Blueprint $table) {
            $table->timestamp('pinned_at')->nullable()->after('visibility');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['cover_url', 'show_liked_videos', 'allow_following', 'allow_comments']);
        });
        Schema::table('videos', fn (Blueprint $table) => $table->dropColumn('pinned_at'));
    }
};
