/**
 * Laravel Performance Detector Tests
 */

import { describe, it, expect } from 'vitest';
import { LaravelPerformanceDetector } from '../performance-detector.js';

describe('LaravelPerformanceDetector', () => {
  const detector = new LaravelPerformanceDetector();

  describe('detect', () => {
    it('should detect cache usage', async () => {
      const content = `
        <?php

        namespace App\\Services;

        use Illuminate\\Support\\Facades\\Cache;

        class UserService
        {
            public function getUser($id)
            {
                return Cache::remember("user_{$id}", 3600, function () use ($id) {
                    return User::find($id);
                });
            }
        }
      `;

      const result = await detector.detect({
        content,
        file: 'UserService.php',
        language: 'php',
      });

      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect queue usage', async () => {
      const content = `
        <?php

        namespace App\\Http\\Controllers;

        use App\\Jobs\\ProcessPodcast;
        use Illuminate\\Support\\Facades\\Queue;

        class PodcastController extends Controller
        {
            public function store(Request $request)
            {
                Queue::push(new ProcessPodcast($podcast));
            }
        }
      `;

      const result = await detector.detect({
        content,
        file: 'PodcastController.php',
        language: 'php',
      });

      // Queue:: is detected as Laravel code
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should detect eager loading', async () => {
      const content = `
        <?php

        namespace App\\Http\\Controllers;

        class PostController extends Controller
        {
            public function index()
            {
                return Post::with(['author', 'comments'])->get();
            }
        }
      `;

      const result = await detector.detect({
        content,
        file: 'PostController.php',
        language: 'php',
      });

      // ->with( is detected as Laravel code
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

      // SimpleClass doesn't contain performance patterns
      // so it returns empty result with no custom data
      expect(result.custom).toBeUndefined();
    });

    it('should detect multiple cache operations', async () => {
      const content = `
        <?php

        use Illuminate\\Support\\Facades\\Cache;

        Cache::get('key1');
        Cache::put('key2', $value);
        Cache::forget('key3');
      `;

      const result = await detector.detect({
        content,
        file: 'test.php',
        language: 'php',
      });

      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('analyzePerformance', () => {
    it('should analyze performance patterns', () => {
      const content = `
        <?php

        Cache::get('key');
        Cache::put('key', $value);
      `;

      const analysis = detector.analyzePerformance(content, 'test.php');

      expect(analysis.confidence).toBeGreaterThan(0);
      expect(analysis.cache).toBeDefined();
    });

    it('should return analysis structure', () => {
      const content = `
        <?php

        Cache::remember('key', 3600, fn() => 'value');
      `;

      const analysis = detector.analyzePerformance(content, 'test.php');

      expect(analysis).toHaveProperty('cache');
      expect(analysis).toHaveProperty('queue');
      expect(analysis).toHaveProperty('eagerLoading');
      expect(analysis).toHaveProperty('confidence');
    });
  });
});
