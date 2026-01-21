<?php

namespace App\Jobs;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendOrderConfirmation implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public readonly Order $order
    ) {}

    public function handle(): void
    {
        Log::info('Sending order confirmation', ['order_id' => $this->order->id]);

        // Send email notification
        // Mail::to($this->order->user)->send(new OrderConfirmationMail($this->order));

        Log::info('Order confirmation sent', ['order_id' => $this->order->id]);
    }
}
