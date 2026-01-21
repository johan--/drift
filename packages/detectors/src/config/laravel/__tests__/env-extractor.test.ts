/**
 * Laravel Env Extractor Tests
 */

import { describe, it, expect } from 'vitest';
import { EnvExtractor } from '../extractors/env-extractor.js';

describe('EnvExtractor', () => {
  const extractor = new EnvExtractor();

  describe('extract', () => {
    it('should extract env() calls', () => {
      const content = `
        <?php

        return [
            'name' => env('APP_NAME', 'Laravel'),
            'env' => env('APP_ENV', 'production'),
            'debug' => env('APP_DEBUG', false),
        ];
      `;

      const result = extractor.extract(content, 'app.php');

      expect(result.envUsages.length).toBeGreaterThanOrEqual(3);
      
      const appName = result.envUsages.find(e => e.key === 'APP_NAME');
      expect(appName).toBeDefined();
      expect(appName?.default).toContain('Laravel');
    });

    it('should extract env() without default', () => {
      const content = `
        <?php

        $apiKey = env('API_KEY');
        $secret = env('APP_SECRET');
      `;

      const result = extractor.extract(content, 'config.php');

      expect(result.envUsages.length).toBeGreaterThanOrEqual(2);
      
      const apiKey = result.envUsages.find(e => e.key === 'API_KEY');
      expect(apiKey?.default).toBeNull();
    });

    it('should extract config() calls', () => {
      const content = `
        <?php

        namespace App\\Services;

        class MailService
        {
            public function send()
            {
                $from = config('mail.from.address');
                $name = config('mail.from.name', 'Default');
            }
        }
      `;

      const result = extractor.extract(content, 'MailService.php');

      expect(result.configUsages.length).toBeGreaterThanOrEqual(2);
      
      const fromAddress = result.configUsages.find(c => c.key === 'mail.from.address');
      expect(fromAddress).toBeDefined();
    });

    it('should extract both env and config calls', () => {
      const content = `
        <?php

        return [
            'driver' => env('MAIL_DRIVER', 'smtp'),
            'host' => config('services.mailgun.domain'),
        ];
      `;

      const result = extractor.extract(content, 'mail.php');

      expect(result.envUsages.length).toBeGreaterThanOrEqual(1);
      expect(result.configUsages.length).toBeGreaterThanOrEqual(1);
    });

    it('should track line numbers', () => {
      const content = `<?php
env('LINE_TWO');
env('LINE_THREE');
env('LINE_FOUR');`;

      const result = extractor.extract(content, 'test.php');

      expect(result.envUsages.length).toBe(3);
      expect(result.envUsages[0].line).toBe(2);
      expect(result.envUsages[1].line).toBe(3);
      expect(result.envUsages[2].line).toBe(4);
    });

    it('should return empty for content without env/config', () => {
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

      expect(result.envUsages).toHaveLength(0);
      expect(result.configUsages).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });

    it('should have high confidence when usages found', () => {
      const content = `
        <?php

        $value = env('SOME_KEY');
      `;

      const result = extractor.extract(content, 'test.php');

      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle nested config keys', () => {
      const content = `
        <?php

        $value = config('database.connections.mysql.host');
        $port = config('database.connections.mysql.port', 3306);
      `;

      const result = extractor.extract(content, 'database.php');

      expect(result.configUsages.length).toBeGreaterThanOrEqual(2);
      
      const host = result.configUsages.find(c => c.key === 'database.connections.mysql.host');
      expect(host).toBeDefined();
    });
  });
});
