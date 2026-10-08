<?php

namespace App\Contracts\Repositories;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface UserRepositoryInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator;
    public function all(): Collection;
    public function findById(int $id): ?User;
    public function create(array $data, string $role): User;
    public function update(User $user, array $data, ?string $role = null): bool;
    public function delete(User $user): bool;
}
