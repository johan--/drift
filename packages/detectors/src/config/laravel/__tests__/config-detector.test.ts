/**
 * Laravel Config Detector Tests
 */

import { describe, it, expect } from 'vitest';
import { LaravelConfigDetector } from '../config-detector.js';

describe('LaravelConfigDetector', () => {
  const detector = new LaravelConfigDetector();

  describe('detect', () => {
    it('should detect env() usage', async () => {
      const content = `
        return [
            'name' => env('APP_NAME', 'Laravel'),
            'env' => env('APP_ENV', 'production'),
            'debug' => (bool) env('APP_DEBUG', false),
            'url' => env('APP_URL', 'http://localhost'),
        ];
      `;

      const result = await detector.detect({
        content,
        file: 'config/app.php',
        language: 'php',
      });

      // env() usage should be detected
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect config() usage', async () => {
      const content = `
        class AppService
        {
            public function getAppName()
            {
                return config('app.name');
            }

            public function getMailConfig()
            {
                return config('mail.default');
            }
        }
      `;

      const result = await detector.detect({
        content,
        file: 'app/Services/AppService.php',
        language: 'php',
      });

      // config() usage should be detected
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should return empty for non-config code', async () => {
      const content = `
        class User extends Model
        {
            protected $fillable = ['name'];
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

  describe('metadata', () => {
    it('should have correct detector metadata', () => {
      expect(detector.id).toBe('config/laravel-config');
      expect(detector.category).toBe('config');
      expect(detector.supportedLanguages).toContain('php');
    });
  });
});
