<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('playlist_video')
            ->orderBy('playlist_id')
            ->orderBy('video_id')
            ->get()
            ->groupBy('playlist_id')
            ->each(function ($rows): void {
                foreach ($rows->values() as $position => $row) {
                    DB::table('playlist_video')
                        ->where('playlist_id', $row->playlist_id)
                        ->where('video_id', $row->video_id)
                        ->update(['position' => $position]);
                }
            });
    }

    public function down(): void
    {
        DB::table('playlist_video')->update(['position' => 0]);
    }
};
