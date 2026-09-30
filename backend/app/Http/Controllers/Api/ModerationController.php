<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VideoReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ModerationController extends Controller
{
    private function ensureModerator(Request $request): void
    {
        $emails = collect(config('services.vibe.moderator_emails', []));
        abort_unless($emails->contains(strtolower((string) $request->user()->email)), 403, 'Acesso restrito à moderação.');
    }

    public function index(Request $request): JsonResponse
    {
        $this->ensureModerator($request);
        return response()->json(['data' => VideoReport::with(['video.user', 'user'])->whereIn('status', ['pending', 'review'])->latest()->paginate(30)]);
    }

    public function update(Request $request, VideoReport $report): JsonResponse
    {
        $this->ensureModerator($request);
        $data = $request->validate(['status' => ['required', 'in:pending,review,resolved,dismissed']]);
        $report->update(['status' => $data['status']]);
        return response()->json(['data' => ['status' => $report->status]]);
    }
}
