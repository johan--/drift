<?php

namespace App\Services;

use App\Exceptions\InsufficientStockException;
use App\Exceptions\OrderCancellationException;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class OrderService
{
    public function createOrder(User $user, array $data): Order
    {
        return DB::transaction(function () use ($user, $data) {
            // Calculate totals
            $subtotal = 0;
            $items = [];
            
            foreach ($data['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                
                if ($product->stock < $item['quantity']) {
                    throw new InsufficientStockException($product);
                }
                
                $itemTotal = $product->price * $item['quantity'];
                $subtotal += $itemTotal;
                
                $items[] = [
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'price' => $product->price,
                    'total' => $itemTotal,
                ];
                
                // Decrement stock
                $product->decrement('stock', $item['quantity']);
            }
            
            $tax = $subtotal * 0.1; // 10% tax
            $shippingCost = 10.00;
            $total = $subtotal + $tax + $shippingCost;
            
            // Create order
            $order = Order::create([
                'user_id' => $user->id,
                'order_number' => 'ORD-' . Str::upper(Str::random(8)),
                'status' => 'pending',
                'subtotal' => $subtotal,
                'tax' => $tax,
                'shipping_cost' => $shippingCost,
                'total' => $total,
                'shipping_address_id' => $data['shipping_address_id'],
                'notes' => $data['notes'] ?? null,
            ]);
            
            // Create order items
            $order->items()->createMany($items);
            
            Log::info('Order created', [
                'order_id' => $order->id,
                'user_id' => $user->id,
                'total' => $total,
            ]);
            
            return $order;
        });
    }

    public function cancelOrder(Order $order): Order
    {
        if (!$order->canBeCancelled()) {
            throw new OrderCancellationException($order);
        }
        
        return DB::transaction(function () use ($order) {
            // Restore stock
            foreach ($order->items as $item) {
                $item->product->increment('stock', $item->quantity);
            }
            
            $order->update(['status' => 'cancelled']);
            
            Log::warning('Order cancelled', ['order_id' => $order->id]);
            
            return $order;
        });
    }
}
