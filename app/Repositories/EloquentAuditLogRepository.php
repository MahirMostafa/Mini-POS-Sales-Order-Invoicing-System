<?php

namespace App\Repositories;

use App\Contracts\Repositories\AuditLogRepositoryInterface;
use App\Models\AuditLog;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentAuditLogRepository implements AuditLogRepositoryInterface
{
    public function log(array $data): AuditLog
    {
        return AuditLog::create($data);
    }

    public function paginate(int $perPage = 20, array $filters = []): LengthAwarePaginator
    {
        $query = AuditLog::with('user');

        if (!empty($filters['event'])) {
            $query->where('event', $filters['event']);
        }

        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (!empty($filters['auditable_type'])) {
            $query->where('auditable_type', 'like', "%{$filters['auditable_type']}%");
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('event', 'like', "%{$search}%")
                  ->orWhere('auditable_type', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        return $query->latest('id')->paginate($perPage);
    }
}
