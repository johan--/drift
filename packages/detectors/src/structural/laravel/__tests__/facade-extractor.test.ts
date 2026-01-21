/**
 * Laravel Facade Extractor Tests
 */

import { describe, it, expect } from 'vitest';
import { FacadeExtractor } from '../extractors/facade-extractor.js';

describe('FacadeExtractor', () => {
  const extractor = new FacadeExtractor();

  describe('extract', () => {
    it('should extract custom facade', () => {
      const content = `
        class Payment extends Facade
        {
            protected static function getFacadeAccessor(): string
            {
                return 'payment';
            }
        }
      `;

      const result = extractor.extract(content, 'Payment.php');

      expect(result.facades).toHaveLength(1);
      expect(result.facades[0].name).toBe('Payment');
      expect(result.facades[0].accessor).toBe('payment');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should extract facade usages', () => {
      const content = `
        Cache::put('key', 'value', 3600);
        Log::info('Message');
        DB::table('users')->get();
      `;

      const result = extractor.extract(content, 'UserService.php');

      expect(result.usages.length).toBeGreaterThanOrEqual(3);
      expect(result.usages.map(u => u.facade)).toContain('Cache');
      expect(result.usages.map(u => u.facade)).toContain('Log');
      expect(result.usages.map(u => u.facade)).toContain('DB');
    });

    it('should identify built-in facades', () => {
      const content = `
        Auth::user();
        Route::get('/test', fn() => 'test');
      `;

      const result = extractor.extract(content, 'web.php');

      expect(result.usages.every(u => u.isBuiltIn)).toBe(true);
    });

    it('should return empty for non-facade content', () => {
      const content = `
        class User extends Model
        {
            protected $fillable = ['name'];
        }
      `;

      const result = extractor.extract(content, 'User.php');

      expect(result.facades).toHaveLength(0);
    });
  });

  describe('hasFacades', () => {
    it('should return true when facade class exists', () => {
      const content = `class Payment extends Facade`;
      expect(extractor.hasFacades(content)).toBe(true);
    });

    it('should return true when built-in facade used', () => {
      const content = `Cache::get('key');`;
      expect(extractor.hasFacades(content)).toBe(true);
    });

    it('should return false when no facades', () => {
      const content = `return $user->name;`;
      expect(extractor.hasFacades(content)).toBe(false);
    });
  });
});
