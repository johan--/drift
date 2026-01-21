import { describe, it, expect } from 'vitest';
import { AsyncPatternsDetector } from '../async-patterns-detector.js';

describe('AsyncPatternsDetector', () => {
  const detector = new AsyncPatternsDetector();

  describe('analyzeAsyncPatterns', () => {
    it('should detect async Task methods', () => {
      const content = `
public async Task<User> GetUserAsync(int id)
{
    return await _repository.GetByIdAsync(id);
}
public async Task ProcessAsync() { }`;
      const analysis = detector.analyzeAsyncPatterns(content, 'Service.cs');
      expect(analysis.asyncTaskCount).toBe(2);
    });

    it('should detect async ValueTask', () => {
      const content = `
public async ValueTask<int> GetCountAsync()
{
    if (_cached) return _count;
    return await ComputeCountAsync();
}`;
      const analysis = detector.analyzeAsyncPatterns(content, 'Service.cs');
      expect(analysis.asyncValueTaskCount).toBe(1);
    });

    it('should flag async void as issue', () => {
      const content = `
public async void HandleEvent(object sender, EventArgs e)
{
    await ProcessEventAsync();
}`;
      const analysis = detector.analyzeAsyncPatterns(content, 'Handler.cs');
      expect(analysis.asyncVoidCount).toBe(1);
      expect(analysis.issues.length).toBeGreaterThan(0);
    });

    it('should detect ConfigureAwait', () => {
      const content = `
var result = await GetDataAsync().ConfigureAwait(false);`;
      const analysis = detector.analyzeAsyncPatterns(content, 'Service.cs');
      expect(analysis.usesConfigureAwait).toBe(true);
    });

    it('should flag sync over async', () => {
      const content = `
var result = GetDataAsync().Result;
task.Wait();`;
      const analysis = detector.analyzeAsyncPatterns(content, 'Service.cs');
      expect(analysis.issues.some(i => i.includes('deadlock'))).toBe(true);
    });
  });

  describe('detect', () => {
    it('should create violations for async void', async () => {
      const context = {
        content: `public async void BadMethod() { }`,
        file: 'Bad.cs',
        language: 'csharp' as const,
        isTestFile: false,
        isTypeDefinition: false,
      };
      const result = await detector.detect(context);
      expect(result.violations.length).toBeGreaterThan(0);
    });
  });

  describe('metadata', () => {
    it('should have correct detector metadata', () => {
      expect(detector.id).toBe('performance/csharp-async-patterns');
      expect(detector.category).toBe('performance');
      expect(detector.supportedLanguages).toContain('csharp');
    });
  });
});
