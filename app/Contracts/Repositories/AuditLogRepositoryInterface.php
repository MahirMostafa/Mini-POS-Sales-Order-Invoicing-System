<?php

namespace App\Contracts\Repositories;

use App\Models\AuditLog;
use Illuminate\Pagination\LengthAwarePaginator;

interface AuditLogRepositoryInterface
{
    public function log(array $data): AuditLog;
    public function paginate(int $perPage = 20, array $filters = []): LengthAwarePaginator;
}
