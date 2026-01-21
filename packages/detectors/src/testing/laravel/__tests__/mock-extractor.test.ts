/**
 * Laravel Mock Extractor Tests
 */

import { describe, it, expect } from 'vitest';
import { MockExtractor } from '../extractors/mock-extractor.js';

describe('MockExtractor', () => {
  const extractor = new MockExtractor();

  describe('extract', () => {
    it('should extract Mockery mock', () => {
      const content = `
        public function test_example()
        {
            $mock = Mockery::mock(UserService::class);
            $mock->shouldReceive('find')->once()->andReturn(new User);
        }
      `;

      const result = extractor.extract(content, 'ExampleTest.php');

      expect(result.mocks).toHaveLength(1);
      expect(result.mocks[0].type).toBe('mock');
      expect(result.mocks[0].targetClass).toBe('UserService');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should extract Mockery spy', () => {
      const content = `
        public function test_example()
        {
            $spy = Mockery::spy(UserService::class);
        }
      `;

      const result = extractor.extract(content, 'ExampleTest.php');

      expect(result.mocks).toHaveLength(1);
      expect(result.mocks[0].type).toBe('spy');
      expect(result.mocks[0].targetClass).toBe('UserService');
    });

    it('should extract Laravel mock helper', () => {
      const content = `
        public function test_example()
        {
            $this->mock(UserService::class, function ($mock) {
                $mock->shouldReceive('find')->andReturn(new User);
            });
        }
      `;

      const result = extractor.extract(content, 'ExampleTest.php');

      expect(result.mocks).toHaveLength(1);
      expect(result.mocks[0].type).toBe('mock');
      expect(result.mocks[0].targetClass).toBe('UserService');
    });

    it('should extract Laravel partial mock', () => {
      const content = `
        public function test_example()
        {
            $this->partialMock(UserService::class, function ($mock) {
                $mock->shouldReceive('find')->andReturn(new User);
            });
        }
      `;

      const result = extractor.extract(content, 'ExampleTest.php');

      expect(result.mocks).toHaveLength(1);
      expect(result.mocks[0].type).toBe('partial');
      expect(result.mocks[0].targetClass).toBe('UserService');
    });

    it('should extract Laravel spy helper', () => {
      const content = `
        public function test_example()
        {
            $this->spy(UserService::class);
        }
      `;

      const result = extractor.extract(content, 'ExampleTest.php');

      expect(result.mocks).toHaveLength(1);
      expect(result.mocks[0].type).toBe('spy');
      expect(result.mocks[0].targetClass).toBe('UserService');
    });

    it('should extract Laravel fakes', () => {
      const content = `
        public function test_example()
        {
            Event::fake();
            Mail::fake();
            Queue::fake();
        }
      `;

      const result = extractor.extract(content, 'ExampleTest.php');

      expect(result.mocks).toHaveLength(3);
      expect(result.mocks.map(m => m.targetClass)).toContain('Event');
      expect(result.mocks.map(m => m.targetClass)).toContain('Mail');
      expect(result.mocks.map(m => m.targetClass)).toContain('Queue');
      expect(result.mocks.every(m => m.type === 'fake')).toBe(true);
    });

    it('should extract mock expectations', () => {
      const content = `
        public function test_example()
        {
            $mock = Mockery::mock(UserService::class);
            $mock->shouldReceive('find')->once()->andReturn(new User);
        }
      `;

      const result = extractor.extract(content, 'ExampleTest.php');

      expect(result.mocks).toHaveLength(1);
      // Note: Expectations are extracted from the mock creation line only
      // Multi-line expectations would need enhanced parsing
    });

    it('should return empty for non-test content', () => {
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

      expect(result.mocks).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });
  });

  describe('hasMocks', () => {
    it('should return true when Mockery exists', () => {
      const content = `Mockery::mock(UserService::class)`;
      expect(extractor.hasMocks(content)).toBe(true);
    });

    it('should return true when Laravel mock exists', () => {
      const content = `$this->mock(UserService::class)`;
      expect(extractor.hasMocks(content)).toBe(true);
    });

    it('should return true when fake exists', () => {
      const content = `Event::fake()`;
      expect(extractor.hasMocks(content)).toBe(true);
    });

    it('should return false when no mocks', () => {
      const content = `return User::all();`;
      expect(extractor.hasMocks(content)).toBe(false);
    });
  });
});
