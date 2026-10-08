<?php

namespace App\Contracts\Services;

interface AuditServiceInterface
{
    /**
     * Dispatch an asynchronous audit logging job to the queue
     */
    public function log(
        string $event,
        string $auditableType,
        int $auditableId,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?int $userId = null,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): void;
}
