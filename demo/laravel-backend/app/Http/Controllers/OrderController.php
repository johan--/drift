<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Jobs\ProcessOrder;
use App\Jobs\SendOrderConfirmation;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderService $orderService
    ) {}

    /**
     * List user's orders
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $orders = $request->user()
            ->orders()
            ->with(['items.product', 'shipping'])
            ->latest()
            ->paginate(10);

        return OrderResource::collection($orders);
    }

    /**
     * Show a single order
     */
    public function show(Order $order): OrderResource
    {
        $this->authorize('view', $order);

        return new OrderResource($order->load(['items.product', 'shipping', 'payment']));
    }

    /**
     * Create a new order
     */
    public function store(StoreOrderRequest $request): OrderResource
    {
        $order = $this->orderService->createOrder(
            $request->user(),
            $request->validated()
        );

        // Dispatch jobs in a chain
        Bus::chain([
            new ProcessOrder($order),
            new SendOrderConfirmation($order),
        ])->dispatch();

        Log::info('Order created', [
            'order_id' => $order->id,
            'user_id' => $request->user()->id,
            'total' => $order->total,
        ]);

        return new OrderResource($order);
    }

    /**
     * Cancel an order
     */
    public function destroy(Order $order): \Illuminate\Http\JsonResponse
    {
        $this->authorize('cancel', $order);

        $this->orderService->cancelOrder($order);

        Log::warning('Order cancelled', ['order_id' => $order->id]);

        return response()->json(['message' => 'Order cancelled']);
    }
}
