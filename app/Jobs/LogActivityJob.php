<?php

namespace App\Jobs;

use App\Contracts\Repositories\AuditLogRepositoryInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class LogActivityJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public array $payload)
    {
    }

    public function handle(AuditLogRepositoryInterface $auditRepo): void
    {
        $auditRepo->log($this->payload);
    }
}
