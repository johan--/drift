<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            Log::error('Exception occurred', [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
        });

        $this->renderable(function (NotFoundHttpException $e) {
            return response()->json([
                'error' => 'Resource not found',
                'message' => $e->getMessage(),
            ], 404);
        });

        $this->renderable(function (AuthenticationException $e) {
            return response()->json([
                'error' => 'Unauthenticated',
                'message' => 'You must be logged in to access this resource',
            ], 401);
        });

        $this->renderable(function (ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'message' => 'The given data was invalid',
                'errors' => $e->errors(),
            ], 422);
        });

        $this->renderable(function (InsufficientStockException $e) {
            return response()->json([
                'error' => 'Insufficient stock',
                'message' => $e->getMessage(),
                'product_id' => $e->getProduct()->id,
            ], 400);
        });
    }
}
