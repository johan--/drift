<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'price' => $this->price,
            'formatted_price' => '$' . number_format($this->price, 2),
            'sku' => $this->sku,
            'stock' => $this->stock,
            'is_active' => $this->is_active,
            'images' => $this->images,
            'category' => $this->whenLoaded('category', fn() => new CategoryResource($this->category)),
            'reviews' => $this->whenLoaded('reviews', fn() => ReviewResource::collection($this->reviews)),
            'average_rating' => $this->whenNotNull($this->average_rating),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
