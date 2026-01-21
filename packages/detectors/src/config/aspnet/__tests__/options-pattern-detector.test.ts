import { describe, it, expect } from 'vitest';
import { OptionsPatternDetector } from '../options-pattern-detector.js';

describe('OptionsPatternDetector', () => {
  const detector = new OptionsPatternDetector();

  describe('analyzeOptionsPattern', () => {
    it('should detect IOptions<T> injection', () => {
      const content = `
public class EmailService
{
    private readonly EmailSettings _settings;
    public EmailService(IOptions<EmailSettings> options)
    {
        _settings = options.Value;
    }
}`;
      const analysis = detector.analyzeOptionsPattern(content, 'EmailService.cs');
      expect(analysis.optionsTypes).toContain('EmailSettings');
      expect(analysis.patterns.some(p => p.type === 'options')).toBe(true);
    });

    it('should detect IOptionsSnapshot<T>', () => {
      const content = `
public class ConfigService
{
    public ConfigService(IOptionsSnapshot<AppSettings> options) { }
}`;
      const analysis = detector.analyzeOptionsPattern(content, 'ConfigService.cs');
      expect(analysis.usesSnapshot).toBe(true);
    });

    it('should detect IOptionsMonitor<T>', () => {
      const content = `
public class MonitorService
{
    public MonitorService(IOptionsMonitor<FeatureFlags> options)
    {
        options.OnChange(flags => Console.WriteLine("Changed"));
    }
}`;
      const analysis = detector.analyzeOptionsPattern(content, 'MonitorService.cs');
      expect(analysis.usesMonitor).toBe(true);
    });

    it('should detect Configure<T> registration', () => {
      const content = `
services.Configure<EmailSettings>(Configuration.GetSection("Email"));
services.Configure<DatabaseSettings>(Configuration.GetSection("Database"));`;
      const analysis = detector.analyzeOptionsPattern(content, 'Startup.cs');
      expect(analysis.optionsTypes).toContain('EmailSettings');
      expect(analysis.optionsTypes).toContain('DatabaseSettings');
    });

    it('should detect options validation', () => {
      const content = `
services.AddOptions<EmailSettings>()
    .Bind(Configuration.GetSection("Email"))
    .ValidateDataAnnotations()
    .ValidateOnStart();`;
      const analysis = detector.analyzeOptionsPattern(content, 'Startup.cs');
      expect(analysis.usesValidation).toBe(true);
    });
  });

  describe('metadata', () => {
    it('should have correct detector metadata', () => {
      expect(detector.id).toBe('config/aspnet-options-pattern');
      expect(detector.category).toBe('config');
      expect(detector.supportedLanguages).toContain('csharp');
    });
  });
});
