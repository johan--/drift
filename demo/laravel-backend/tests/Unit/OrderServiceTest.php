<?php

namespace Tests\Unit;

use App\Exceptions\InsufficientStockException;
use App\Exceptions\OrderCancellationException;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderServiceTest extends TestCase
{
    use RefreshDatabase;

    private OrderService $orderService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->orderService = new OrderService();
    }

    public function test_creates_order_with_correct_totals(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['price' => 100, 'stock' => 10]);

        $order = $this->orderService->createOrder($user, [
            'items' => [
                ['product_id' => $product->id, 'quantity' => 2],
            ],
            'shipping_address_id' => 1,
        ]);

        $this->assertEquals(200, $order->subtotal);
        $this->assertEquals(20, $order->tax); // 10%
        $this->assertEquals(10, $order->shipping_cost);
        $this->assertEquals(230, $order->total);
    }

    public function test_decrements_product_stock(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['stock' => 10]);

        $this->orderService->createOrder($user, [
            'items' => [
                ['product_id' => $product->id, 'quantity' => 3],
            ],
            'shipping_address_id' => 1,
        ]);

        $this->assertEquals(7, $product->fresh()->stock);
    }

    public function test_throws_exception_for_insufficient_stock(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['stock' => 2]);

        $this->expectException(InsufficientStockException::class);

        $this->orderService->createOrder($user, [
            'items' => [
                ['product_id' => $product->id, 'quantity' => 5],
            ],
            'shipping_address_id' => 1,
        ]);
    }

    public function test_cancels_pending_order(): void
    {
        $order = Order::factory()->create(['status' => 'pending']);

        $cancelled = $this->orderService->cancelOrder($order);

        $this->assertEquals('cancelled', $cancelled->status);
    }

    public function test_cannot_cancel_shipped_order(): void
    {
        $order = Order::factory()->create(['status' => 'shipped']);

        $this->expectException(OrderCancellationException::class);

        $this->orderService->cancelOrder($order);
    }
}
