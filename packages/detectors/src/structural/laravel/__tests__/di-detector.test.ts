/**
 * Laravel DI Detector Tests
 */

import { describe, it, expect } from 'vitest';
import { LaravelDIDetector } from '../di-detector.js';

describe('LaravelDIDetector', () => {
  const detector = new LaravelDIDetector();

  describe('detect', () => {
    it('should detect service provider', async () => {
      const content = `
        <?php

        namespace App\\Providers;

        use Illuminate\\Support\\ServiceProvider;

        class AppServiceProvider extends ServiceProvider
        {
            public function register(): void
            {
                $this->app->bind(PaymentGateway::class, StripeGateway::class);
            }

            public function boot(): void
            {
                //
            }
        }
      `;

      const result = await detector.detect({
        content,
        file: 'AppServiceProvider.php',
        language: 'php',
      });

      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect container bindings', async () => {
      const content = `
        <?php

        namespace App\\Providers;

        use Illuminate\\Support\\ServiceProvider;

        class RepositoryServiceProvider extends ServiceProvider
        {
            public function register(): void
            {
                $this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class);
                $this->app->singleton(CacheManager::class, RedisCacheManager::class);
            }
        }
      `;

      const result = await detector.detect({
        content,
        file: 'RepositoryServiceProvider.php',
        language: 'php',
      });

      expect(result.confidence).toBeGreaterThan(0);
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

      // SimpleClass doesn't contain ServiceProvider or $this->app-> patterns
      // so it returns empty result with no custom data
      expect(result.custom).toBeUndefined();
    });

    it('should detect deferred providers', async () => {
      const content = `
        <?php

        namespace App\\Providers;

        use Illuminate\\Support\\ServiceProvider;
        use Illuminate\\Contracts\\Support\\DeferrableProvider;

        class HeavyServiceProvider extends ServiceProvider
        {
            protected $defer = true;

            public function register(): void
            {
                $this->app->singleton(HeavyService::class, function ($app) {
                    return new HeavyService();
                });
            }

            public function provides(): array
            {
                return [HeavyService::class];
            }
        }
      `;

      const result = await detector.detect({
        content,
        file: 'HeavyServiceProvider.php',
        language: 'php',
      });

      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('analyzeStructure', () => {
    it('should analyze structural patterns', () => {
      const content = `
        <?php

        namespace App\\Providers;

        use Illuminate\\Support\\ServiceProvider;

        class TestServiceProvider extends ServiceProvider
        {
            public function register(): void
            {
                $this->app->bind('test', TestClass::class);
            }
        }
      `;

      const analysis = detector.analyzeStructure(content, 'TestServiceProvider.php');

      expect(analysis.confidence).toBeGreaterThan(0);
      expect(analysis.providers).toBeDefined();
    });
  });
});
