/**
 * Laravel CSRF Extractor Tests
 */

import { describe, it, expect } from 'vitest';
import { CSRFExtractor } from '../extractors/csrf-extractor.js';

describe('CSRFExtractor', () => {
  const extractor = new CSRFExtractor();

  describe('extract', () => {
    it('should extract csrf_token() calls', () => {
      const content = `
        <?php

        $token = csrf_token();
        echo csrf_token();
      `;

      const result = extractor.extract(content, 'test.php');

      expect(result.usages.length).toBeGreaterThanOrEqual(2);
      expect(result.usages.every(u => u.type === 'token')).toBe(true);
    });

    it('should extract @csrf directive', () => {
      const content = `
        <form method="POST" action="/profile">
            @csrf
            <input type="text" name="name">
            <button type="submit">Update</button>
        </form>
      `;

      const result = extractor.extract(content, 'form.blade.php');

      expect(result.usages.length).toBeGreaterThanOrEqual(1);
      const csrfDirective = result.usages.find(u => u.type === 'token');
      expect(csrfDirective).toBeDefined();
    });

    it('should extract csrf_field() calls', () => {
      const content = `
        <form method="POST">
            <?php echo csrf_field(); ?>
            <input type="text" name="email">
        </form>
      `;

      const result = extractor.extract(content, 'form.php');

      expect(result.usages.length).toBeGreaterThanOrEqual(1);
      const fieldUsage = result.usages.find(u => u.type === 'field');
      expect(fieldUsage).toBeDefined();
    });

    it('should extract VerifyCsrfToken middleware', () => {
      const content = `
        <?php

        namespace App\\Http\\Middleware;

        use Illuminate\\Foundation\\Http\\Middleware\\VerifyCsrfToken as Middleware;

        class VerifyCsrfToken extends Middleware
        {
            protected $except = [
                'api/*',
                'webhook/*',
            ];
        }
      `;

      const result = extractor.extract(content, 'VerifyCsrfToken.php');

      expect(result.usages.length).toBeGreaterThanOrEqual(1);
      const middlewareUsage = result.usages.find(u => u.type === 'middleware');
      expect(middlewareUsage).toBeDefined();
    });

    it('should extract $except property', () => {
      const content = `
        <?php

        namespace App\\Http\\Middleware;

        class VerifyCsrfToken extends Middleware
        {
            protected $except = [
                'stripe/*',
                'api/webhooks/*',
            ];
        }
      `;

      const result = extractor.extract(content, 'VerifyCsrfToken.php');

      const exceptUsage = result.usages.find(u => u.type === 'except');
      expect(exceptUsage).toBeDefined();
    });

    it('should track line numbers', () => {
      const content = `<?php
csrf_token();
csrf_token();`;

      const result = extractor.extract(content, 'test.php');

      expect(result.usages.length).toBe(2);
      expect(result.usages[0].line).toBe(2);
      expect(result.usages[1].line).toBe(3);
    });

    it('should return empty for content without CSRF', () => {
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

    it('should have high confidence when CSRF found', () => {
      const content = `
        <?php

        $token = csrf_token();
      `;

      const result = extractor.extract(content, 'test.php');

      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should extract multiple CSRF usages in same file', () => {
      const content = `
        <form method="POST">
            @csrf
            <input type="hidden" value="{{ csrf_token() }}">
        </form>
        <script>
            var token = '{{ csrf_token() }}';
        </script>
      `;

      const result = extractor.extract(content, 'form.blade.php');

      expect(result.usages.length).toBeGreaterThanOrEqual(2);
    });
  });
});
