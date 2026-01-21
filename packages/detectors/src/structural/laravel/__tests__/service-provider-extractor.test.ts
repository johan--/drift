/**
 * Laravel Service Provider Extractor Tests
 */

import { describe, it, expect } from 'vitest';
import { ServiceProviderExtractor } from '../extractors/service-provider-extractor.js';

describe('ServiceProviderExtractor', () => {
  const extractor = new ServiceProviderExtractor();

  describe('extract', () => {
    it('should extract service provider class', () => {
      const content = `
        class AppServiceProvider extends ServiceProvider
        {
            public function register()
            {
                $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
            }

            public function boot()
            {
                //
            }
        }
      `;

      const result = extractor.extract(content, 'AppServiceProvider.php');

      expect(result.providers).toHaveLength(1);
      expect(result.providers[0].name).toBe('AppServiceProvider');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should extract bindings', () => {
      const content = `
        class RepositoryServiceProvider extends ServiceProvider
        {
            public function register()
            {
                $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
                $this->app->bind(OrderRepositoryInterface::class, OrderRepository::class);
            }
        }
      `;

      const result = extractor.extract(content, 'RepositoryServiceProvider.php');

      expect(result.providers).toHaveLength(1);
      expect(result.providers[0].bindings.length).toBeGreaterThanOrEqual(2);
    });

    it('should extract singletons', () => {
      const content = `
        class PaymentServiceProvider extends ServiceProvider
        {
            public function register()
            {
                $this->app->singleton(PaymentGateway::class, function ($app) {
                    return new StripeGateway(config('services.stripe.key'));
                });
            }
        }
      `;

      const result = extractor.extract(content, 'PaymentServiceProvider.php');

      expect(result.providers).toHaveLength(1);
      expect(result.providers[0].singletons.length).toBeGreaterThanOrEqual(1);
    });

    it('should extract deferred provider', () => {
      const content = `
        class ReportServiceProvider extends ServiceProvider
        {
            protected $defer = true;

            public function provides(): array
            {
                return [ReportGenerator::class];
            }
        }
      `;

      const result = extractor.extract(content, 'ReportServiceProvider.php');

      expect(result.providers).toHaveLength(1);
      expect(result.providers[0].deferred).toBe(true);
    });

    it('should return empty for non-provider content', () => {
      const content = `
        class User extends Model
        {
            protected $fillable = ['name'];
        }
      `;

      const result = extractor.extract(content, 'User.php');

      expect(result.providers).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });
  });
});
