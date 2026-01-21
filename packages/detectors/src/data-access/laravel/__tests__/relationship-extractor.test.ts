/**
 * Laravel Relationship Extractor Tests
 */

import { describe, it, expect } from 'vitest';
import { RelationshipExtractor } from '../extractors/relationship-extractor.js';

describe('RelationshipExtractor', () => {
  const extractor = new RelationshipExtractor();

  describe('extract', () => {
    it('should extract hasOne relationship', () => {
      const content = `
        class User extends Model
        {
            public function profile(): HasOne
            {
                return $this->hasOne(Profile::class);
            }
        }
      `;

      const result = extractor.extract(content, 'User.php');

      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].name).toBe('profile');
      expect(result.relationships[0].type).toBe('hasOne');
      expect(result.relationships[0].relatedModel).toBe('Profile');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should extract hasMany relationship', () => {
      const content = `
        class User extends Model
        {
            public function posts(): HasMany
            {
                return $this->hasMany(Post::class);
            }
        }
      `;

      const result = extractor.extract(content, 'User.php');

      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].name).toBe('posts');
      expect(result.relationships[0].type).toBe('hasMany');
      expect(result.relationships[0].relatedModel).toBe('Post');
    });

    it('should extract belongsTo relationship', () => {
      const content = `
        class Post extends Model
        {
            public function user(): BelongsTo
            {
                return $this->belongsTo(User::class);
            }
        }
      `;

      const result = extractor.extract(content, 'Post.php');

      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].name).toBe('user');
      expect(result.relationships[0].type).toBe('belongsTo');
      expect(result.relationships[0].relatedModel).toBe('User');
    });

    it('should extract belongsToMany relationship', () => {
      const content = `
        class User extends Model
        {
            public function roles(): BelongsToMany
            {
                return $this->belongsToMany(Role::class);
            }
        }
      `;

      const result = extractor.extract(content, 'User.php');

      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].name).toBe('roles');
      expect(result.relationships[0].type).toBe('belongsToMany');
      expect(result.relationships[0].relatedModel).toBe('Role');
    });

    it('should extract morphTo relationship', () => {
      const content = `
        class Comment extends Model
        {
            public function commentable(): MorphTo
            {
                return $this->morphTo();
            }
        }
      `;

      const result = extractor.extract(content, 'Comment.php');

      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].name).toBe('commentable');
      expect(result.relationships[0].type).toBe('morphTo');
      expect(result.relationships[0].isMorph).toBe(true);
    });

    it('should extract multiple relationships', () => {
      const content = `
        class User extends Model
        {
            public function profile(): HasOne
            {
                return $this->hasOne(Profile::class);
            }

            public function posts(): HasMany
            {
                return $this->hasMany(Post::class);
            }

            public function roles(): BelongsToMany
            {
                return $this->belongsToMany(Role::class);
            }
        }
      `;

      const result = extractor.extract(content, 'User.php');

      expect(result.relationships).toHaveLength(3);
      expect(result.relationships.map(r => r.name)).toEqual(['profile', 'posts', 'roles']);
    });

    it('should extract relationship with foreign key', () => {
      const content = `
        class Post extends Model
        {
            public function author(): BelongsTo
            {
                return $this->belongsTo(User::class, 'author_id');
            }
        }
      `;

      const result = extractor.extract(content, 'Post.php');

      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].foreignKey).toBe('author_id');
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

      expect(result.relationships).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });
  });

  describe('hasRelationships', () => {
    it('should return true when relationships exist', () => {
      const content = `return $this->hasMany(Post::class);`;
      expect(extractor.hasRelationships(content)).toBe(true);
    });

    it('should return false when no relationships', () => {
      const content = `return User::all();`;
      expect(extractor.hasRelationships(content)).toBe(false);
    });
  });

  describe('getUsedRelationshipTypes', () => {
    it('should return used relationship types', () => {
      const content = `
        $this->hasOne(Profile::class);
        $this->hasMany(Post::class);
        $this->belongsTo(User::class);
      `;

      const types = extractor.getUsedRelationshipTypes(content);

      expect(types).toContain('hasOne');
      expect(types).toContain('hasMany');
      expect(types).toContain('belongsTo');
    });
  });
});
