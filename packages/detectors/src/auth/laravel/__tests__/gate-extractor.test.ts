/**
 * Laravel Gate Extractor Tests
 */

import { describe, it, expect } from 'vitest';
import { GateExtractor } from '../extractors/gate-extractor.js';

describe('GateExtractor', () => {
  const extractor = new GateExtractor();

  describe('extract', () => {
    it('should extract Gate::define', () => {
      const content = `
        Gate::define('update-post', function (User $user, Post $post) {
            return $user->id === $post->user_id;
        });
      `;

      const result = extractor.extract(content, 'AuthServiceProvider.php');

      expect(result.definitions).toHaveLength(1);
      expect(result.definitions[0].name).toBe('update-post');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should extract multiple gate definitions', () => {
      const content = `
        Gate::define('view-post', fn($user, $post) => true);
        Gate::define('update-post', fn($user, $post) => $user->id === $post->user_id);
        Gate::define('delete-post', fn($user, $post) => $user->isAdmin());
      `;

      const result = extractor.extract(content, 'AuthServiceProvider.php');

      expect(result.definitions).toHaveLength(3);
      expect(result.definitions.map(d => d.name)).toContain('view-post');
      expect(result.definitions.map(d => d.name)).toContain('update-post');
      expect(result.definitions.map(d => d.name)).toContain('delete-post');
    });

    it('should extract Gate::allows check', () => {
      const content = `
        if (Gate::allows('update-post', $post)) {
            // Update the post
        }
      `;

      const result = extractor.extract(content, 'PostController.php');

      expect(result.checks).toHaveLength(1);
      expect(result.checks[0].ability).toBe('update-post');
      expect(result.checks[0].type).toBe('allows');
    });

    it('should extract Gate::denies check', () => {
      const content = `
        if (Gate::denies('update-post', $post)) {
            abort(403);
        }
      `;

      const result = extractor.extract(content, 'PostController.php');

      expect(result.checks).toHaveLength(1);
      expect(result.checks[0].ability).toBe('update-post');
      expect(result.checks[0].type).toBe('denies');
    });

    it('should extract Gate::check', () => {
      const content = `
        if (Gate::check('update-post', $post)) {
            // Update
        }
      `;

      const result = extractor.extract(content, 'PostController.php');

      expect(result.checks).toHaveLength(1);
      expect(result.checks[0].type).toBe('check');
    });

    it('should extract Gate::before', () => {
      const content = `
        Gate::before(function ($user, $ability) {
            if ($user->isAdmin()) {
                return true;
            }
        });
      `;

      const result = extractor.extract(content, 'AuthServiceProvider.php');

      expect(result.hooks.before).toHaveLength(1);
    });

    it('should return empty for non-gate content', () => {
      const content = `
        class UserController extends Controller
        {
            public function index() {}
        }
      `;

      const result = extractor.extract(content, 'UserController.php');

      expect(result.definitions).toHaveLength(0);
      expect(result.checks).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });
  });

  describe('hasGates', () => {
    it('should return true when Gate::define exists', () => {
      const content = `Gate::define('update-post', fn() => true);`;
      expect(extractor.hasGates(content)).toBe(true);
    });

    it('should return true when Gate::allows exists', () => {
      const content = `Gate::allows('update-post', $post)`;
      expect(extractor.hasGates(content)).toBe(true);
    });

    it('should return false when no gates', () => {
      const content = `return User::all();`;
      expect(extractor.hasGates(content)).toBe(false);
    });
  });
});
