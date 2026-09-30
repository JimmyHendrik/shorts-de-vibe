<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('videos', function (Blueprint $table): void {
            $table->timestamp('scheduled_at')->nullable()->after('visibility');
            $table->boolean('allow_reuse')->default(true)->after('allow_comments');
            $table->boolean('is_ai_generated')->default(false)->after('allow_reuse');
            $table->boolean('age_restricted')->default(false)->after('is_ai_generated');
            $table->boolean('high_quality')->default(true)->after('age_restricted');
        });
    }

    public function down(): void
    {
        Schema::table('videos', function (Blueprint $table): void {
            $table->dropColumn(['scheduled_at', 'allow_reuse', 'is_ai_generated', 'age_restricted', 'high_quality']);
        });
    }
};
