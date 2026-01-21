<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ProductService
{
    public function createProduct(array $data): Product
    {
        return DB::transaction(function () use ($data) {
            $data['slug'] = Str::slug($data['name']);
            
            $product = Product::create($data);
            
            Log::info('Product created via service', ['product_id' => $product->id]);
            
            return $product;
        });
    }

    public function updateProduct(Product $product, array $data): Product
    {
        return DB::transaction(function () use ($product, $data) {
            if (isset($data['name'])) {
                $data['slug'] = Str::slug($data['name']);
            }
            
            $product->update($data);
            
            return $product->fresh();
        });
    }

    public function deleteProduct(Product $product): bool
    {
        return DB::transaction(function () use ($product) {
            Log::info('Deleting product', ['product_id' => $product->id]);
            
            return $product->delete();
        });
    }

    public function getActiveProducts()
    {
        return Product::query()
            ->with('category')
            ->active()
            ->inStock()
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
