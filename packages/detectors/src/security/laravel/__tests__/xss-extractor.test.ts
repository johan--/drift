/**
 * Laravel XSS Extractor Tests
 */

import { describe, it, expect } from 'vitest';
import { XSSExtractor } from '../extractors/xss-extractor.js';

describe('XSSExtractor', () => {
  const extractor = new XSSExtractor();

  describe('extract', () => {
    it('should extract escaped output', () => {
      const content = `
        <div>{{ $user->name }}</div>
        <span>{{ $post->title }}</span>
      `;

      const result = extractor.extract(content, 'view.blade.php');

      expect(result.usages.filter(u => u.type === 'escaped')).toHaveLength(2);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should extract unescaped output', () => {
      const content = `
        <div>{!! $post->content !!}</div>
      `;

      const result = extractor.extract(content, 'view.blade.php');

      expect(result.usages.filter(u => u.type === 'unescaped')).toHaveLength(1);
      expect(result.usages[0].context).toContain('$post->content');
    });

    it('should detect unescaped user input vulnerability', () => {
      const content = `
        <div>{!! $request->input('html') !!}</div>
      `;

      const result = extractor.extract(content, 'view.blade.php');

      expect(result.vulnerabilities).toHaveLength(1);
      expect(result.vulnerabilities[0].type).toBe('unescaped-user-input');
      expect(result.vulnerabilities[0].severity).toBe('high');
    });

    it('should flag unescaped output as potential risk', () => {
      const content = `
        <div>{!! $post->html_content !!}</div>
      `;

      const result = extractor.extract(content, 'view.blade.php');

      expect(result.vulnerabilities).toHaveLength(1);
      expect(result.vulnerabilities[0].type).toBe('raw-output');
      expect(result.vulnerabilities[0].severity).toBe('medium');
    });

    it('should extract raw directive', () => {
      const content = `
        @raw($htmlContent)
      `;

      const result = extractor.extract(content, 'view.blade.php');

      expect(result.usages.filter(u => u.type === 'raw')).toHaveLength(1);
    });

    it('should detect raw directive with user input', () => {
      const content = `
        @raw($request->get('content'))
      `;

      const result = extractor.extract(content, 'view.blade.php');

      expect(result.vulnerabilities).toHaveLength(1);
      expect(result.vulnerabilities[0].type).toBe('unescaped-user-input');
    });

    it('should return empty for safe templates', () => {
      const content = `
        <div>{{ $user->name }}</div>
        <span>{{ e($post->title) }}</span>
      `;

      const result = extractor.extract(content, 'view.blade.php');

      expect(result.vulnerabilities).toHaveLength(0);
    });
  });

  describe('hasXSSPatterns', () => {
    it('should return true when escaped output exists', () => {
      const content = `{{ $name }}`;
      expect(extractor.hasXSSPatterns(content)).toBe(true);
    });

    it('should return true when unescaped output exists', () => {
      const content = `{!! $html !!}`;
      expect(extractor.hasXSSPatterns(content)).toBe(true);
    });

    it('should return true when raw directive exists', () => {
      const content = `@raw($content)`;
      expect(extractor.hasXSSPatterns(content)).toBe(true);
    });

    it('should return false when no patterns', () => {
      const content = `<div>Static content</div>`;
      expect(extractor.hasXSSPatterns(content)).toBe(false);
    });
  });
});
