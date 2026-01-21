/**
 * Laravel Factory Extractor Tests
 */

import { describe, it, expect } from 'vitest';
import { FactoryExtractor } from '../extractors/factory-extractor.js';

describe('FactoryExtractor', () => {
  const extractor = new FactoryExtractor();

  describe('extract', () => {
    it('should extract factory class', () => {
      const content = `
        class UserFactory extends Factory
        {
            protected $model = User::class;

            public function definition()
            {
                return [
                    'name' => fake()->name(),
                    'email' => fake()->unique()->safeEmail(),
                ];
            }
        }
      `;

      const result = extractor.extract(content, 'UserFactory.php');

      expect(result.factories).toHaveLength(1);
      expect(result.factories[0].name).toBe('UserFactory');
      expect(result.factories[0].modelClass).toBe('User');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should extract factory states', () => {
      const content = `
        class UserFactory extends Factory
        {
            protected $model = User::class;

            public function definition()
            {
                return ['name' => fake()->name()];
            }

            public function admin(): static
            {
                return $this->state(fn (array $attributes) => [
                    'is_admin' => true,
                ]);
            }

            public function unverified(): static
            {
                return $this->state(fn (array $attributes) => [
                    'email_verified_at' => null,
                ]);
            }
        }
      `;

      const result = extractor.extract(content, 'UserFactory.php');

      expect(result.factories).toHaveLength(1);
      expect(result.factories[0].states).toHaveLength(2);
      expect(result.factories[0].states.map(s => s.name)).toContain('admin');
      expect(result.factories[0].states.map(s => s.name)).toContain('unverified');
    });

    it('should extract factory relationships', () => {
      const content = `
        class PostFactory extends Factory
        {
            protected $model = Post::class;

            public function definition()
            {
                return [
                    'title' => fake()->sentence(),
                ];
            }

            public function configure()
            {
                return $this->has(Comment::factory()->count(3));
            }
        }
      `;

      const result = extractor.extract(content, 'PostFactory.php');

      expect(result.factories).toHaveLength(1);
      expect(result.factories[0].relationships).toHaveLength(1);
      expect(result.factories[0].relationships[0].factory).toBe('Comment');
    });

    it('should extract for relationship', () => {
      const content = `
        class PostFactory extends Factory
        {
            protected $model = Post::class;

            public function definition()
            {
                return [
                    'title' => fake()->sentence(),
                ];
            }

            public function configure()
            {
                return $this->for(User::factory());
            }
        }
      `;

      const result = extractor.extract(content, 'PostFactory.php');

      expect(result.factories).toHaveLength(1);
      expect(result.factories[0].relationships).toHaveLength(1);
      expect(result.factories[0].relationships[0].factory).toBe('User');
    });

    it('should return empty for non-factory content', () => {
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

      expect(result.factories).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });
  });

  describe('hasFactories', () => {
    it('should return true when factory exists', () => {
      const content = `class UserFactory extends Factory`;
      expect(extractor.hasFactories(content)).toBe(true);
    });

    it('should return false when no factory', () => {
      const content = `class User extends Model`;
      expect(extractor.hasFactories(content)).toBe(false);
    });
  });
});
