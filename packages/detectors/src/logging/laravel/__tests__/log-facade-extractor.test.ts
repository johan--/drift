/**
 * Laravel Log Facade Extractor Tests
 */

import { describe, it, expect } from 'vitest';
import { LogFacadeExtractor } from '../extractors/log-facade-extractor.js';

describe('LogFacadeExtractor', () => {
  const extractor = new LogFacadeExtractor();

  describe('extract', () => {
    it('should extract Log::info call', () => {
      const content = `
        Log::info('User logged in', ['user_id' => $user->id]);
      `;

      const result = extractor.extract(content, 'AuthController.php');

      expect(result.usages).toHaveLength(1);
      expect(result.usages[0].level).toBe('info');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should extract all log levels', () => {
      const content = `
        Log::emergency('System is down');
        Log::alert('Action required');
        Log::critical('Critical error');
        Log::error('Error occurred');
        Log::warning('Warning message');
        Log::notice('Notice');
        Log::info('Info message');
        Log::debug('Debug info');
      `;

      const result = extractor.extract(content, 'LoggingService.php');

      expect(result.usages).toHaveLength(8);
      expect(result.usages.map(u => u.level)).toContain('emergency');
      expect(result.usages.map(u => u.level)).toContain('alert');
      expect(result.usages.map(u => u.level)).toContain('critical');
      expect(result.usages.map(u => u.level)).toContain('error');
      expect(result.usages.map(u => u.level)).toContain('warning');
      expect(result.usages.map(u => u.level)).toContain('notice');
      expect(result.usages.map(u => u.level)).toContain('info');
      expect(result.usages.map(u => u.level)).toContain('debug');
    });

    it('should extract Log::channel usage', () => {
      const content = `
        Log::channel('slack')->critical('Server is down!');
      `;

      const result = extractor.extract(content, 'AlertService.php');

      expect(result.usages.length).toBeGreaterThanOrEqual(1);
      const channelUsage = result.usages.find(u => u.channel === 'slack');
      expect(channelUsage).toBeDefined();
    });

    it('should extract logger() helper', () => {
      const content = `
        logger('User action');
        logger()->error('Error occurred');
      `;

      const result = extractor.extract(content, 'UserService.php');

      expect(result.usages.length).toBeGreaterThan(0);
    });

    it('should extract context data', () => {
      const content = `
        Log::info('Order created', [
            'order_id' => $order->id,
            'user_id' => $user->id,
            'total' => $order->total,
        ]);
      `;

      const result = extractor.extract(content, 'OrderService.php');

      expect(result.usages).toHaveLength(1);
      expect(result.usages[0].contextKeys.length).toBeGreaterThan(0);
    });

    it('should return empty for non-logging content', () => {
      const content = `
        class User extends Model
        {
            protected $fillable = ['name'];
        }
      `;

      const result = extractor.extract(content, 'User.php');

      expect(result.usages).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });
  });

  describe('hasLogs', () => {
    it('should return true when Log facade exists', () => {
      const content = `Log::info('message');`;
      expect(extractor.hasLogs(content)).toBe(true);
    });

    it('should return true when logger helper exists', () => {
      const content = `logger('message');`;
      expect(extractor.hasLogs(content)).toBe(true);
    });

    it('should return false when no logging', () => {
      const content = `return User::all();`;
      expect(extractor.hasLogs(content)).toBe(false);
    });
  });
});
