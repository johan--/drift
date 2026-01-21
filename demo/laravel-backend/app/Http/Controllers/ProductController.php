<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductService $productService
    ) {}

    /**
     * List all products with caching
     */
    public function index(): AnonymousResourceCollection
    {
        $products = Cache::remember('products.all', 3600, function () {
            return Product::with('category')->active()->get();
        });

        return ProductResource::collection($products);
    }

    /**
     * Show a single product
     */
    public function show(Product $product): ProductResource
    {
        return new ProductResource($product->load(['category', 'reviews']));
    }

    /**
     * Store a new product
     */
    public function store(StoreProductRequest $request): ProductResource
    {
        $this->authorize('create', Product::class);

        $product = $this->productService->createProduct($request->validated());

        Log::info('Product created', ['product_id' => $product->id]);

        Cache::forget('products.all');

        return new ProductResource($product);
    }

    /**
     * Update a product
     */
    public function update(UpdateProductRequest $request, Product $product): ProductResource
    {
        $this->authorize('update', $product);

        $product = $this->productService->updateProduct($product, $request->validated());

        Cache::forget('products.all');

        return new ProductResource($product);
    }

    /**
     * Delete a product
     */
    public function destroy(Product $product): \Illuminate\Http\JsonResponse
    {
        $this->authorize('delete', $product);

        $this->productService->deleteProduct($product);

        Cache::forget('products.all');

        return response()->json(['message' => 'Product deleted']);
    }
}
