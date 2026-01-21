/**
 * Laravel Middleware Extractor Tests
 */

import { describe, it, expect } from 'vitest';
import { MiddlewareExtractor } from '../extractors/middleware-extractor.js';

describe('MiddlewareExtractor', () => {
  const extractor = new MiddlewareExtractor();

  describe('extract', () => {
    it('should extract middleware class', () => {
      const content = `
        class EnsureUserIsAdmin
        {
            public function handle(Request $request, Closure $next)
            {
                if (!$request->user()->isAdmin()) {
                    abort(403);
                }
                return $next($request);
            }
        }
      `;

      const result = extractor.extract(content, 'EnsureUserIsAdmin.php');

      expect(result.middlewares).toHaveLength(1);
      expect(result.middlewares[0].name).toBe('EnsureUserIsAdmin');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should extract middleware with terminate method', () => {
      const content = `
        class LogRequests
        {
            public function handle(Request $request, Closure $next)
            {
                return $next($request);
            }

            public function terminate(Request $request, Response $response)
            {
                Log::info('Request completed');
            }
        }
      `;

      const result = extractor.extract(content, 'LogRequests.php');

      expect(result.middlewares).toHaveLength(1);
      expect(result.middlewares[0].hasTerminate).toBe(true);
    });

    it('should extract route middleware registration', () => {
      const content = `
        protected $routeMiddleware = [
            'auth' => \\App\\Http\\Middleware\\Authenticate::class,
            'admin' => \\App\\Http\\Middleware\\EnsureUserIsAdmin::class,
        ];
      `;

      const result = extractor.extract(content, 'Kernel.php');

      expect(result.registrations).toHaveLength(2);
      expect(result.registrations.map(r => r.alias)).toContain('auth');
      expect(result.registrations.map(r => r.alias)).toContain('admin');
    });

    it('should extract middleware groups', () => {
      const content = `
        protected $middlewareGroups = [
            'web' => [
                \\App\\Http\\Middleware\\EncryptCookies::class,
                \\Illuminate\\Session\\Middleware\\StartSession::class,
            ],
            'api' => [
                'throttle:api',
                \\Illuminate\\Routing\\Middleware\\SubstituteBindings::class,
            ],
        ];
      `;

      const result = extractor.extract(content, 'Kernel.php');

      expect(result.groups).toHaveLength(2);
      expect(result.groups.map(g => g.name)).toContain('web');
      expect(result.groups.map(g => g.name)).toContain('api');
    });

    it('should extract middleware usage in routes', () => {
      const content = `
        Route::middleware(['auth', 'verified'])->group(function () {
            Route::get('/dashboard', [DashboardController::class, 'index']);
        });
      `;

      const result = extractor.extract(content, 'web.php');

      expect(result.usages).toHaveLength(1);
      expect(result.usages[0].middlewares).toContain('auth');
      expect(result.usages[0].middlewares).toContain('verified');
    });

    it('should return empty for non-middleware content', () => {
      const content = `
        class User extends Model
        {
            protected $fillable = ['name'];
        }
      `;

      const result = extractor.extract(content, 'User.php');

      expect(result.middlewares).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });
  });

  describe('hasMiddleware', () => {
    it('should return true when middleware class exists', () => {
      const content = `public function handle(Request $request, Closure $next)`;
      expect(extractor.hasMiddleware(content)).toBe(true);
    });

    it('should return true when routeMiddleware exists', () => {
      const content = `protected $routeMiddleware = [`;
      expect(extractor.hasMiddleware(content)).toBe(true);
    });

    it('should return false when no middleware', () => {
      const content = `return User::all();`;
      expect(extractor.hasMiddleware(content)).toBe(false);
    });
  });
});
