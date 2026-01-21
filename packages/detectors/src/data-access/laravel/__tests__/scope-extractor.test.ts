/**
 * Laravel Scope Extractor Tests
 */

import { describe, it, expect } from 'vitest';
import { ScopeExtractor } from '../extractors/scope-extractor.js';

describe('ScopeExtractor', () => {
  const extractor = new ScopeExtractor();

  describe('extract', () => {
    it('should extract local scope', () => {
      const content = `
        class Post extends Model
        {
            public function scopePublished($query)
            {
                return $query->whereNotNull('published_at');
            }
        }
      `;

      const result = extractor.extract(content, 'Post.php');

      expect(result.localScopes).toHaveLength(1);
      expect(result.localScopes[0].name).toBe('published');
      expect(result.localScopes[0].parameters).toHaveLength(0);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should extract scope with parameters', () => {
      const content = `
        class Post extends Model
        {
            public function scopeOfType($query, $type)
            {
                return $query->where('type', $type);
            }
        }
      `;

      const result = extractor.extract(content, 'Post.php');

      expect(result.localScopes).toHaveLength(1);
      expect(result.localScopes[0].name).toBe('ofType');
      expect(result.localScopes[0].parameters).toContain('type');
    });

    it('should extract multiple scopes', () => {
      const content = `
        class Post extends Model
        {
            public function scopePublished($query)
            {
                return $query->whereNotNull('published_at');
            }

            public function scopeDraft($query)
            {
                return $query->whereNull('published_at');
            }

            public function scopeRecent($query, $days = 7)
            {
                return $query->where('created_at', '>=', now()->subDays($days));
            }
        }
      `;

      const result = extractor.extract(content, 'Post.php');

      expect(result.localScopes).toHaveLength(3);
      expect(result.localScopes.map(s => s.name)).toEqual(['published', 'draft', 'recent']);
    });

    it('should extract global scope registration', () => {
      const content = `
        class Post extends Model
        {
            protected static function booted()
            {
                static::addGlobalScope('active', function ($query) {
                    $query->where('is_active', true);
                });
            }
        }
      `;

      const result = extractor.extract(content, 'Post.php');

      expect(result.globalScopes).toHaveLength(1);
      expect(result.globalScopes[0].name).toBe('active');
      expect(result.globalScopes[0].isClass).toBe(false);
    });

    it('should extract class-based global scope', () => {
      const content = `
        class Post extends Model
        {
            protected static function booted()
            {
                static::addGlobalScope(new ActiveScope);
            }
        }
      `;

      const result = extractor.extract(content, 'Post.php');

      expect(result.globalScopes).toHaveLength(1);
      expect(result.globalScopes[0].name).toBe('ActiveScope');
      expect(result.globalScopes[0].isClass).toBe(true);
    });

    it('should return empty for non-model content', () => {
      const content = `
        class UserController extends Controller
        {
            public function index()
            {
                return User::all();
            }
        }
      `;

      const result = extractor.extract(content, 'UserController.php');

      expect(result.localScopes).toHaveLength(0);
      expect(result.globalScopes).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });
  });

  describe('hasScopes', () => {
    it('should return true when local scopes exist', () => {
      const content = `public function scopeActive($query)`;
      expect(extractor.hasScopes(content)).toBe(true);
    });

    it('should return true when global scopes exist', () => {
      const content = `static::addGlobalScope('active', fn($q) => $q->where('active', true));`;
      expect(extractor.hasScopes(content)).toBe(true);
    });

    it('should return false when no scopes', () => {
      const content = `return User::all();`;
      expect(extractor.hasScopes(content)).toBe(false);
    });
  });
});
