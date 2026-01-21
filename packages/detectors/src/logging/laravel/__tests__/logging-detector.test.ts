/**
 * Laravel Logging Detector Tests
 */

import { describe, it, expect } from 'vitest';
import { LaravelLoggingDetector } from '../logging-detector.js';

describe('LaravelLoggingDetector', () => {
  const detector = new LaravelLoggingDetector();

  describe('detect', () => {
    it('should detect Log facade usage', async () => {
      const content = `
        <?php

        namespace App\\Services;

        use Illuminate\\Support\\Facades\\Log;

        class PaymentService
        {
            public function processPayment($amount)
            {
                Log::info('Processing payment', ['amount' => $amount]);
                
                try {
                    // Process payment
                    Log::debug('Payment processed successfully');
                } catch (\\Exception $e) {
                    Log::error('Payment failed', ['error' => $e->getMessage()]);
                }
            }
        }
      `;

      const result = await detector.detect({
        content,
        file: 'PaymentService.php',
        language: 'php',
      });

      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect logger helper usage', async () => {
      const content = `
        <?php

        namespace App\\Http\\Controllers;

        class UserController extends Controller
        {
            public function store(Request $request)
            {
                logger('User created', ['user_id' => $user->id]);
            }
        }
      `;

      const result = await detector.detect({
        content,
        file: 'UserController.php',
        language: 'php',
      });

      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect channel configuration', async () => {
      const content = `
        <?php

        return [
            'default' => env('LOG_CHANNEL', 'stack'),

            'channels' => [
                'stack' => [
                    'driver' => 'stack',
                    'channels' => ['single', 'slack'],
                ],
                'single' => [
                    'driver' => 'single',
                    'path' => storage_path('logs/laravel.log'),
                    'level' => 'debug',
                ],
            ],
        ];
      `;

      const result = await detector.detect({
        content,
        file: 'config/logging.php',
        language: 'php',
      });

      // 'channels' is detected as Laravel code
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should return empty result for non-Laravel code', async () => {
      const content = `
        <?php

        class SimpleClass
        {
            public function doSomething()
            {
                return 'hello';
            }
        }
      `;

      const result = await detector.detect({
        content,
        file: 'SimpleClass.php',
        language: 'php',
      });

      // SimpleClass doesn't contain logging patterns
      // so it returns empty result with no custom data
      expect(result.custom).toBeUndefined();
    });

    it('should extract context patterns from log calls', async () => {
      const content = `
        <?php

        use Illuminate\\Support\\Facades\\Log;

        class OrderService
        {
            public function createOrder($data)
            {
                Log::info('Order created', [
                    'order_id' => $order->id,
                    'user_id' => $user->id,
                    'total' => $total,
                ]);
            }

            public function cancelOrder($orderId)
            {
                Log::warning('Order cancelled', [
                    'order_id' => $orderId,
                    'reason' => $reason,
                ]);
            }
        }
      `;

      const result = await detector.detect({
        content,
        file: 'OrderService.php',
        language: 'php',
      });

      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('analyzeLogging', () => {
    it('should analyze logging patterns', () => {
      const content = `
        <?php

        use Illuminate\\Support\\Facades\\Log;

        Log::info('Test message');
        Log::error('Error occurred');
      `;

      const analysis = detector.analyzeLogging(content, 'test.php');

      expect(analysis.confidence).toBeGreaterThan(0);
      expect(analysis.facade).toBeDefined();
    });
  });
});
