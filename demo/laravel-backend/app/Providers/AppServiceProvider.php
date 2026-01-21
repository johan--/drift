<?php

namespace App\Providers;

use App\Services\OrderService;
use App\Services\ProductService;
use App\Services\UserService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(UserService::class);
        $this->app->singleton(ProductService::class);
        $this->app->singleton(OrderService::class);
    }

    public function boot(): void
    {
        //
    }
}
