<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('comments', function (Blueprint $table): void {
            $table->timestamp('pinned_at')->nullable()->index();
        });

        Schema::table('video_reports', function (Blueprint $table): void {
            $table->foreignId('comment_id')->nullable()->after('video_id')->constrained()->cascadeOnDelete();
            $table->unique(['user_id', 'comment_id']);
        });
    }

    public function down(): void
    {
        Schema::table('video_reports', function (Blueprint $table): void {
            $table->dropUnique(['user_id', 'comment_id']);
            $table->dropConstrainedForeignId('comment_id');
        });

        Schema::table('comments', function (Blueprint $table): void {
            $table->dropIndex(['pinned_at']);
            $table->dropColumn('pinned_at');
        });
    }
};
