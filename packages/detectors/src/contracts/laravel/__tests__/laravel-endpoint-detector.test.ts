/**
 * Laravel Endpoint Detector Tests
 */

import { describe, it, expect } from 'vitest';
import { LaravelEndpointDetector } from '../laravel-endpoint-detector.js';

describe('LaravelEndpointDetector', () => {
  const detector = new LaravelEndpointDetector();

  describe('detect', () => {
    it('should detect Laravel routes', async () => {
      const content = `
        use Illuminate\\Support\\Facades\\Route;

        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{user}', [UserController::class, 'show']);
      `;

      const result = await detector.detect({
        content,
        file: 'routes/api.php',
        language: 'php',
      });

      // Route detection should work
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect Laravel controller', async () => {
      const content = `
        namespace App\\Http\\Controllers;

        use App\\Models\\User;
        use Illuminate\\Http\\Request;

        class UserController extends Controller
        {
            public function index()
            {
                return User::all();
            }

            public function store(StoreUserRequest $request): UserResource
            {
                $user = User::create($request->validated());
                return new UserResource($user);
            }
        }
      `;

      const result = await detector.detect({
        content,
        file: 'app/Http/Controllers/UserController.php',
        language: 'php',
      });

      // Controller detection should work
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should return empty for non-Laravel code', async () => {
      const content = `
        class User
        {
            public string $name;
        }
      `;

      const result = await detector.detect({
        content,
        file: 'User.php',
        language: 'php',
      });

      expect(result.patterns).toHaveLength(0);
    });
  });

  describe('extractEndpoints', () => {
    it('should extract endpoints from routes', () => {
      const content = `
        use Illuminate\\Support\\Facades\\Route;

        Route::get('/api/users', [UserController::class, 'index']);
        Route::post('/api/users', [UserController::class, 'store']);
      `;

      const result = detector.extractEndpoints(content, 'routes/api.php');

      expect(result.endpoints.length).toBeGreaterThan(0);
      expect(result.framework).toBe('laravel');
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('metadata', () => {
    it('should have correct detector metadata', () => {
      expect(detector.id).toBe('contracts/laravel-endpoints');
      expect(detector.category).toBe('api');
      expect(detector.supportedLanguages).toContain('php');
    });
  });
});
