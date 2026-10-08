<?php

namespace App\Services;

use App\Contracts\Services\AuditServiceInterface;
use App\Jobs\LogActivityJob;

class AuditService implements AuditServiceInterface
{
    public function log(
        string $event,
        string $auditableType,
        int $auditableId,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?int $userId = null,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): void {
        $payload = [
            'user_id' => $userId ?? auth()->id(),
            'event' => $event,
            'auditable_type' => $auditableType,
            'auditable_id' => $auditableId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => $ipAddress ?? request()->ip(),
            'user_agent' => $userAgent ?? request()->userAgent(),
        ];

        // Asynchronously dispatch to queue worker for zero-latency execution
        LogActivityJob::dispatch($payload);
    }
}
