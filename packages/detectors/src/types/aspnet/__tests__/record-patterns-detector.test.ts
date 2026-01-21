import { describe, it, expect } from 'vitest';
import { RecordPatternsDetector } from '../record-patterns-detector.js';

describe('RecordPatternsDetector', () => {
  const detector = new RecordPatternsDetector();

  describe('analyzeRecordPatterns', () => {
    it('should detect positional records', () => {
      const content = `
public record UserDto(int Id, string Name, string Email);
public record OrderDto(int OrderId, DateTime CreatedAt, decimal Total);`;
      const analysis = detector.analyzeRecordPatterns(content, 'Dtos.cs');
      expect(analysis.recordCount).toBe(2);
      expect(analysis.usesPositionalRecords).toBe(true);
    });

    it('should detect record struct', () => {
      const content = `
public record struct Point(int X, int Y);
public record struct Color(byte R, byte G, byte B);`;
      const analysis = detector.analyzeRecordPatterns(content, 'ValueTypes.cs');
      expect(analysis.recordStructCount).toBe(2);
    });

    it('should detect record class', () => {
      const content = `
public record class Person(string FirstName, string LastName);`;
      const analysis = detector.analyzeRecordPatterns(content, 'Person.cs');
      expect(analysis.patterns.some(p => p.type === 'record-class')).toBe(true);
    });

    it('should detect with expression', () => {
      const content = `
var updated = original with { Name = "New Name" };
var copy = person with { Age = 30 };`;
      const analysis = detector.analyzeRecordPatterns(content, 'Service.cs');
      expect(analysis.usesWithExpression).toBe(true);
    });
  });

  describe('metadata', () => {
    it('should have correct detector metadata', () => {
      expect(detector.id).toBe('types/csharp-record-patterns');
      expect(detector.category).toBe('types');
      expect(detector.supportedLanguages).toContain('csharp');
    });
  });
});
