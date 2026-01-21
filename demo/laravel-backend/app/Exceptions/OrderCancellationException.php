<?php

namespace App\Exceptions;

use App\Models\Order;
use Exception;

class OrderCancellationException extends Exception
{
    public function __construct(
        private readonly Order $order
    ) {
        parent::__construct("Order {$order->order_number} cannot be cancelled in status: {$order->status}");
    }

    public function getOrder(): Order
    {
        return $this->order;
    }

    public function render(): \Illuminate\Http\JsonResponse
    {
        return response()->json([
            'error' => 'Order cannot be cancelled',
            'message' => $this->getMessage(),
            'order_status' => $this->order->status,
        ], 400);
    }
}
