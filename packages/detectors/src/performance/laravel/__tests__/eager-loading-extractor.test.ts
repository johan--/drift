/**
 * Laravel Eager Loading Extractor Tests
 */

import { describe, it, expect } from 'vitest';
import { EagerLoadingExtractor } from '../extractors/eager-loading-extractor.js';

describe('EagerLoadingExtractor', () => {
  const extractor = new EagerLoadingExtractor();

  describe('extract', () => {
    it('should extract with() eager loading', () => {
      const content = `
        public function index()
        {
            return User::with(['posts', 'profile'])->get();
        }
      `;

      const result = extractor.extract(content, 'UserController.php');

      expect(result.eagerLoads).toHaveLength(1);
      expect(result.eagerLoads[0].model).toBe('User');
      expect(result.eagerLoads[0].relations).toContain('posts');
      expect(result.eagerLoads[0].relations).toContain('profile');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should extract load() eager loading', () => {
      const content = `
        public function show(User $user)
        {
            $user->load(['posts', 'comments']);
            return $user;
        }
      `;

      const result = extractor.extract(content, 'UserController.php');

      expect(result.eagerLoads).toHaveLength(1);
      expect(result.eagerLoads[0].relations).toContain('posts');
      expect(result.eagerLoads[0].relations).toContain('comments');
    });

    it('should extract loadMissing() eager loading', () => {
      const content = `
        public function show(User $user)
        {
            $user->loadMissing('profile');
            return $user;
        }
      `;

      const result = extractor.extract(content, 'UserController.php');

      expect(result.eagerLoads).toHaveLength(1);
      expect(result.eagerLoads[0].relations).toContain('profile');
    });

    it('should detect N+1 query issue', () => {
      const content = `
        public function index()
        {
            foreach (User::all() as $user) {
                echo $user->posts->count();
            }
        }
      `;

      const result = extractor.extract(content, 'UserController.php');

      expect(result.nPlusOneIssues).toHaveLength(1);
      expect(result.nPlusOneIssues[0].model).toBe('User');
      expect(result.nPlusOneIssues[0].variable).toBe('user');
      expect(result.nPlusOneIssues[0].relationships).toContain('posts');
    });

    it('should detect N+1 with get()', () => {
      const content = `
        public function index()
        {
            foreach (Post::get() as $post) {
                echo $post->author->name;
            }
        }
      `;

      const result = extractor.extract(content, 'PostController.php');

      expect(result.nPlusOneIssues).toHaveLength(1);
      expect(result.nPlusOneIssues[0].model).toBe('Post');
      expect(result.nPlusOneIssues[0].relationships).toContain('author');
    });

    it('should extract model default eager loads', () => {
      const content = `
        class User extends Model
        {
            protected $with = ['profile', 'roles'];
            protected $withCount = ['posts'];
        }
      `;

      const result = extractor.extract(content, 'User.php');

      expect(result.modelDefaults).toHaveLength(1);
      expect(result.modelDefaults[0].model).toBe('User');
      expect(result.modelDefaults[0].with).toContain('profile');
      expect(result.modelDefaults[0].with).toContain('roles');
      expect(result.modelDefaults[0].withCount).toContain('posts');
    });

    it('should return empty for non-eloquent content', () => {
      const content = `
        class UserController extends Controller
        {
            public function index()
            {
                return view('users.index');
            }
        }
      `;

      const result = extractor.extract(content, 'UserController.php');

      expect(result.eagerLoads).toHaveLength(0);
      expect(result.nPlusOneIssues).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });
  });

  describe('hasEagerLoadingPatterns', () => {
    it('should return true when with() exists', () => {
      const content = `User::with('posts')->get();`;
      expect(extractor.hasEagerLoadingPatterns(content)).toBe(true);
    });

    it('should return true when load() exists', () => {
      const content = `$user->load('posts');`;
      expect(extractor.hasEagerLoadingPatterns(content)).toBe(true);
    });

    it('should return true when $with exists', () => {
      const content = `protected $with = ['posts'];`;
      expect(extractor.hasEagerLoadingPatterns(content)).toBe(true);
    });

    it('should return false when no patterns', () => {
      const content = `return User::find(1);`;
      expect(extractor.hasEagerLoadingPatterns(content)).toBe(false);
    });
  });
});
