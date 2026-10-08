<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\AuditLogRepositoryInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function __construct(
        protected AuditLogRepositoryInterface $auditRepo
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $filters = [
            'event' => $request->get('event'),
            'user_id' => $request->get('user_id'),
            'auditable_type' => $request->get('auditable_type'),
            'search' => $request->get('search'),
        ];

        $logs = $this->auditRepo->paginate($request->integer('per_page', 20), $filters);

        return response()->json([
            'success' => true,
            'logs' => $logs,
        ]);
    }
}
