/**
 * Laravel Cache Extractor Tests
 */

import { describe, it, expect } from 'vitest';
import { CacheExtractor } from '../extractors/cache-extractor.js';

describe('CacheExtractor', () => {
  const extractor = new CacheExtractor();

  describe('extract', () => {
    it('should extract Cache::get calls', () => {
      const content = `
        <?php

        $value = Cache::get('user_123');
        $settings = Cache::get('app_settings');
      `;

      const result = extractor.extract(content, 'test.php');

      expect(result.usages.length).toBeGreaterThanOrEqual(2);
      expect(result.usages.every(u => u.method === 'get')).toBe(true);
    });

    it('should extract Cache::put calls', () => {
      const content = `
        <?php

        Cache::put('user_123', $user, 3600);
        Cache::put('settings', $settings);
      `;

      const result = extractor.extract(content, 'test.php');

      expect(result.usages.length).toBeGreaterThanOrEqual(2);
      expect(result.usages.every(u => u.method === 'put')).toBe(true);
    });

    it('should extract Cache::remember calls', () => {
      const content = `
        <?php

        $users = Cache::remember('all_users', 3600, function () {
            return User::all();
        });
      `;

      const result = extractor.extract(content, 'test.php');

      expect(result.usages.length).toBeGreaterThanOrEqual(1);
      const rememberUsage = result.usages.find(u => u.method === 'remember');
      expect(rememberUsage).toBeDefined();
      expect(rememberUsage?.key).toBe('all_users');
    });

    it('should extract Cache::forever calls', () => {
      const content = `
        <?php

        Cache::forever('app_version', '1.0.0');
      `;

      const result = extractor.extract(content, 'test.php');

      expect(result.usages.length).toBeGreaterThanOrEqual(1);
      const foreverUsage = result.usages.find(u => u.method === 'forever');
      expect(foreverUsage).toBeDefined();
    });

    it('should extract Cache::forget calls', () => {
      const content = `
        <?php

        Cache::forget('user_123');
        Cache::forget('settings');
      `;

      const result = extractor.extract(content, 'test.php');

      expect(result.usages.length).toBeGreaterThanOrEqual(2);
      expect(result.usages.every(u => u.method === 'forget')).toBe(true);
    });

    it('should extract Cache::flush calls', () => {
      const content = `
        <?php

        Cache::flush('all');
      `;

      const result = extractor.extract(content, 'test.php');

      expect(result.usages.length).toBeGreaterThanOrEqual(1);
      const flushUsage = result.usages.find(u => u.method === 'flush');
      expect(flushUsage).toBeDefined();
    });

    it('should extract Cache::store calls with specific store', () => {
      const content = `
        <?php

        Cache::store('redis')->get('user_123');
        Cache::store('file')->put('settings', $data);
      `;

      const result = extractor.extract(content, 'test.php');

      expect(result.usages.length).toBeGreaterThanOrEqual(2);
      
      const redisUsage = result.usages.find(u => u.store === 'redis');
      expect(redisUsage).toBeDefined();
      
      const fileUsage = result.usages.find(u => u.store === 'file');
      expect(fileUsage).toBeDefined();
    });

    it('should track line numbers', () => {
      const content = `<?php
Cache::get('key1');
Cache::get('key2');
Cache::get('key3');`;

      const result = extractor.extract(content, 'test.php');

      expect(result.usages.length).toBe(3);
      expect(result.usages[0].line).toBe(2);
      expect(result.usages[1].line).toBe(3);
      expect(result.usages[2].line).toBe(4);
    });

    it('should return empty for content without cache', () => {
      const content = `
        <?php

        class SimpleClass
        {
            public function doSomething()
            {
                return 'hello';
            }
        }
      `;

      const result = extractor.extract(content, 'SimpleClass.php');

      expect(result.usages).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });

    it('should have high confidence when cache found', () => {
      const content = `
        <?php

        Cache::get('key');
      `;

      const result = extractor.extract(content, 'test.php');

      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should extract cache key from various formats', () => {
      const content = `
        <?php

        Cache::get('simple_key');
        Cache::get("double_quoted");
        Cache::get(user_cache_key);
      `;

      const result = extractor.extract(content, 'test.php');

      expect(result.usages.length).toBeGreaterThanOrEqual(3);
    });
  });
});
