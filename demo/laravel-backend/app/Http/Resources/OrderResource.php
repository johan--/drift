<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'status' => $this->status,
            'subtotal' => $this->subtotal,
            'tax' => $this->tax,
            'shipping_cost' => $this->shipping_cost,
            'total' => $this->total,
            'notes' => $this->notes,
            'items' => $this->whenLoaded('items', fn() => OrderItemResource::collection($this->items)),
            'shipping' => $this->whenLoaded('shipping', fn() => new ShippingResource($this->shipping)),
            'payment' => $this->whenLoaded('payment', fn() => new PaymentResource($this->payment)),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
