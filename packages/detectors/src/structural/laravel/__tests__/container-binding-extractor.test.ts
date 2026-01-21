/**
 * Laravel Container Binding Extractor Tests
 */

import { describe, it, expect } from 'vitest';
import { ContainerBindingExtractor } from '../extractors/container-binding-extractor.js';

describe('ContainerBindingExtractor', () => {
  const extractor = new ContainerBindingExtractor();

  describe('extract', () => {
    it('should extract bind() calls', () => {
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
        }
      `;

      const result = extractor.extract(content, 'AppServiceProvider.php');

      expect(result.bindings.length).toBeGreaterThanOrEqual(1);
      const binding = result.bindings.find(b => b.abstract.includes('PaymentGateway'));
      expect(binding?.type).toBe('bind');
    });

    it('should extract singleton() calls', () => {
      const content = `
        <?php

        namespace App\\Providers;

        use Illuminate\\Support\\ServiceProvider;

        class AppServiceProvider extends ServiceProvider
        {
            public function register(): void
            {
                $this->app->singleton(CacheManager::class, function ($app) {
                    return new RedisCacheManager($app['config']['cache']);
                });
            }
        }
      `;

      const result = extractor.extract(content, 'AppServiceProvider.php');

      expect(result.bindings.length).toBeGreaterThanOrEqual(1);
      const binding = result.bindings.find(b => b.abstract.includes('CacheManager'));
      expect(binding?.type).toBe('singleton');
    });

    it('should extract scoped() calls', () => {
      const content = `
        <?php

        namespace App\\Providers;

        use Illuminate\\Support\\ServiceProvider;

        class AppServiceProvider extends ServiceProvider
        {
            public function register(): void
            {
                $this->app->scoped(RequestContext::class, function ($app) {
                    return new RequestContext($app['request']);
                });
            }
        }
      `;

      const result = extractor.extract(content, 'AppServiceProvider.php');

      expect(result.bindings.length).toBeGreaterThanOrEqual(1);
      const binding = result.bindings.find(b => b.abstract.includes('RequestContext'));
      expect(binding?.type).toBe('scoped');
    });

    it('should extract instance() calls', () => {
      const content = `
        <?php

        namespace App\\Providers;

        use Illuminate\\Support\\ServiceProvider;

        class AppServiceProvider extends ServiceProvider
        {
            public function register(): void
            {
                $this->app->instance('config.custom', $customConfig);
            }
        }
      `;

      const result = extractor.extract(content, 'AppServiceProvider.php');

      expect(result.bindings.length).toBeGreaterThanOrEqual(1);
      const binding = result.bindings.find(b => b.abstract === 'config.custom');
      expect(binding?.type).toBe('instance');
    });

    it('should extract contextual bindings', () => {
      const content = `
        <?php

        namespace App\\Providers;

        use Illuminate\\Support\\ServiceProvider;

        class AppServiceProvider extends ServiceProvider
        {
            public function register(): void
            {
                $this->app->when(PhotoController::class)
                    ->needs(Filesystem::class)
                    ->give(LocalFilesystem::class);
            }
        }
      `;

      const result = extractor.extract(content, 'AppServiceProvider.php');

      expect(result.contextualBindings.length).toBeGreaterThanOrEqual(1);
      const contextual = result.contextualBindings[0];
      expect(contextual.consumer).toContain('PhotoController');
      expect(contextual.needs).toContain('Filesystem');
      expect(contextual.gives).toContain('LocalFilesystem');
    });

    it('should extract tags', () => {
      const content = `
        <?php

        namespace App\\Providers;

        use Illuminate\\Support\\ServiceProvider;

        class AppServiceProvider extends ServiceProvider
        {
            public function register(): void
            {
                $this->app->tag([SpeedReport::class, MemoryReport::class], 'reports');
            }
        }
      `;

      const result = extractor.extract(content, 'AppServiceProvider.php');

      expect(result.tags.length).toBeGreaterThanOrEqual(1);
      const tag = result.tags.find(t => t.name === 'reports');
      expect(tag?.services).toContain('SpeedReport');
      expect(tag?.services).toContain('MemoryReport');
    });

    it('should extract multiple bindings', () => {
      const content = `
        <?php

        namespace App\\Providers;

        use Illuminate\\Support\\ServiceProvider;

        class AppServiceProvider extends ServiceProvider
        {
            public function register(): void
            {
                $this->app->bind(UserRepository::class, EloquentUserRepository::class);
                $this->app->singleton(Logger::class, FileLogger::class);
                $this->app->bind(Mailer::class, SmtpMailer::class);
            }
        }
      `;

      const result = extractor.extract(content, 'AppServiceProvider.php');

      expect(result.bindings.length).toBeGreaterThanOrEqual(3);
    });

    it('should return empty for non-binding content', () => {
      const content = `
        <?php

        namespace App\\Services;

        class UserService
        {
            public function createUser() {}
        }
      `;

      const result = extractor.extract(content, 'UserService.php');

      expect(result.bindings).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });

    it('should detect bindings via hasBindings', () => {
      const bindingContent = `$this->app->bind(`;
      const nonBindingContent = `class UserService {}`;

      expect(extractor.hasBindings(bindingContent)).toBe(true);
      expect(extractor.hasBindings(nonBindingContent)).toBe(false);
    });

    it('should have high confidence when bindings found', () => {
      const content = `
        <?php

        $this->app->bind(Interface::class, Implementation::class);
      `;

      const result = extractor.extract(content, 'test.php');

      expect(result.confidence).toBeGreaterThan(0);
    });
  });
});
