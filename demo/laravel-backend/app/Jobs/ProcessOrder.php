<?php

namespace App\Jobs;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessOrder implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(
        public readonly Order $order
    ) {}

    public function handle(): void
    {
        Log::info('Processing order', ['order_id' => $this->order->id]);

        // Process payment
        // Update inventory
        // Create shipping label

        $this->order->update(['status' => 'processing']);

        Log::info('Order processed', ['order_id' => $this->order->id]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('Order processing failed', [
            'order_id' => $this->order->id,
            'error' => $exception->getMessage(),
        ]);

        $this->order->update(['status' => 'failed']);
    }
}
