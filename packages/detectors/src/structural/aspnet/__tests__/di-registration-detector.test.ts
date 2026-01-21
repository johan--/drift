import { describe, it, expect } from 'vitest';
import { DIRegistrationDetector } from '../di-registration-detector.js';

describe('DIRegistrationDetector', () => {
  const detector = new DIRegistrationDetector();

  describe('analyzeDIRegistration', () => {
    it('should detect AddScoped registrations', () => {
      const content = `
services.AddScoped<IUserService, UserService>();
services.AddScoped<IOrderService, OrderService>();`;
      const analysis = detector.analyzeDIRegistration(content, 'Startup.cs');
      expect(analysis.scopedCount).toBe(2);
    });

    it('should detect AddTransient registrations', () => {
      const content = `
services.AddTransient<IEmailSender, EmailSender>();
services.AddTransient<IValidator>();`;
      const analysis = detector.analyzeDIRegistration(content, 'Startup.cs');
      expect(analysis.transientCount).toBe(2);
    });

    it('should detect AddSingleton registrations', () => {
      const content = `
services.AddSingleton<ICache, MemoryCache>();
services.AddSingleton<IConfiguration>(config);`;
      const analysis = detector.analyzeDIRegistration(content, 'Startup.cs');
      expect(analysis.singletonCount).toBe(2);
    });

    it('should detect extension method patterns', () => {
      const content = `
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IUserService, UserService>();
        return services;
    }
}`;
      const analysis = detector.analyzeDIRegistration(content, 'Extensions.cs');
      expect(analysis.usesExtensionMethods).toBe(true);
    });

    it('should detect keyed services', () => {
      const content = `
services.AddKeyedScoped<ICache, RedisCache>("redis");
services.AddKeyedSingleton<ICache, MemoryCache>("memory");`;
      const analysis = detector.analyzeDIRegistration(content, 'Startup.cs');
      expect(analysis.usesKeyedServices).toBe(true);
    });

    it('should detect factory registrations', () => {
      const content = `
services.AddScoped<IDbConnection>(sp => new SqlConnection(connectionString));
services.AddTransient(sp => new MyService());`;
      const analysis = detector.analyzeDIRegistration(content, 'Startup.cs');
      expect(analysis.patterns.some(p => p.type === 'factory')).toBe(true);
    });
  });

  describe('metadata', () => {
    it('should have correct detector metadata', () => {
      expect(detector.id).toBe('structural/aspnet-di-registration');
      expect(detector.category).toBe('structural');
      expect(detector.supportedLanguages).toContain('csharp');
    });
  });
});
