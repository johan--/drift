/**
 * Laravel Policy Extractor Tests
 */

import { describe, it, expect } from 'vitest';
import { PolicyExtractor } from '../extractors/policy-extractor.js';

describe('PolicyExtractor', () => {
  const extractor = new PolicyExtractor();

  describe('extract', () => {
    it('should extract policy class', () => {
      const content = `
        class PostPolicy
        {
            public function view(User $user, Post $post): bool
            {
                return true;
            }
        }
      `;

      const result = extractor.extract(content, 'PostPolicy.php');

      expect(result.policies).toHaveLength(1);
      expect(result.policies[0].name).toBe('PostPolicy');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should extract policy methods', () => {
      const content = `
        class PostPolicy
        {
            public function viewAny(User $user): bool { return true; }
            public function view(User $user, Post $post): bool { return true; }
            public function create(User $user): bool { return true; }
            public function update(User $user, Post $post): bool { return $user->id === $post->user_id; }
            public function delete(User $user, Post $post): bool { return $user->id === $post->user_id; }
        }
      `;

      const result = extractor.extract(content, 'PostPolicy.php');

      expect(result.policies).toHaveLength(1);
      expect(result.policies[0].methods.map(m => m.name)).toContain('viewAny');
      expect(result.policies[0].methods.map(m => m.name)).toContain('view');
      expect(result.policies[0].methods.map(m => m.name)).toContain('create');
      expect(result.policies[0].methods.map(m => m.name)).toContain('update');
      expect(result.policies[0].methods.map(m => m.name)).toContain('delete');
    });

    it('should extract authorize call', () => {
      const content = `
        public function update(Request $request, Post $post)
        {
            $this->authorize('update', $post);
            // Update logic
        }
      `;

      const result = extractor.extract(content, 'PostController.php');

      expect(result.authorizeCalls).toHaveLength(1);
      expect(result.authorizeCalls[0].ability).toBe('update');
    });

    it('should extract can middleware', () => {
      const content = `
        Route::put('/posts/{post}', [PostController::class, 'update'])
            ->can('update', 'post');
      `;

      const result = extractor.extract(content, 'web.php');

      expect(result.canMiddleware).toHaveLength(1);
      expect(result.canMiddleware[0].ability).toBe('update');
    });

    it('should return empty for non-policy content', () => {
      const content = `
        class User extends Model
        {
            protected $fillable = ['name'];
        }
      `;

      const result = extractor.extract(content, 'User.php');

      expect(result.policies).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });
  });

  describe('hasPolicies', () => {
    it('should return true when Policy class exists', () => {
      const content = `class PostPolicy`;
      expect(extractor.hasPolicies(content)).toBe(true);
    });

    it('should return true when authorize exists', () => {
      const content = `$this->authorize('update', $post);`;
      expect(extractor.hasPolicies(content)).toBe(true);
    });

    it('should return false when no policies', () => {
      const content = `return User::all();`;
      expect(extractor.hasPolicies(content)).toBe(false);
    });
  });
});
