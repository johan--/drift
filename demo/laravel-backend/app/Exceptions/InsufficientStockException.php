<?php

namespace App\Exceptions;

use App\Models\Product;
use Exception;

class InsufficientStockException extends Exception
{
    public function __construct(
        private readonly Product $product
    ) {
        parent::__construct("Insufficient stock for product: {$product->name}");
    }

    public function getProduct(): Product
    {
        return $this->product;
    }

    public function report(): void
    {
        \Log::warning('Insufficient stock', [
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'available_stock' => $this->product->stock,
        ]);
    }
}
