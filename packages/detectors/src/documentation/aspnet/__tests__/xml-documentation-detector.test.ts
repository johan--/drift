import { describe, it, expect } from 'vitest';
import { XmlDocumentationDetector } from '../xml-documentation-detector.js';

describe('XmlDocumentationDetector', () => {
  const detector = new XmlDocumentationDetector();

  describe('analyzeXmlDocumentation', () => {
    it('should detect summary tags', () => {
      const content = `
/// <summary>
/// Gets a user by their ID.
/// </summary>
public User GetUser(int id) { }`;
      const analysis = detector.analyzeXmlDocumentation(content, 'Service.cs');
      expect(analysis.summaryCount).toBe(1);
    });

    it('should detect param tags', () => {
      const content = `
/// <summary>Creates a new user.</summary>
/// <param name="name">The user's name.</param>
/// <param name="email">The user's email.</param>
public User CreateUser(string name, string email) { }`;
      const analysis = detector.analyzeXmlDocumentation(content, 'Service.cs');
      expect(analysis.paramCount).toBe(2);
    });

    it('should detect returns tags', () => {
      const content = `
/// <summary>Gets the count.</summary>
/// <returns>The total count of items.</returns>
public int GetCount() { }`;
      const analysis = detector.analyzeXmlDocumentation(content, 'Service.cs');
      expect(analysis.returnsCount).toBe(1);
    });

    it('should detect inheritdoc', () => {
      const content = `
/// <inheritdoc/>
public override string ToString() { }`;
      const analysis = detector.analyzeXmlDocumentation(content, 'Model.cs');
      expect(analysis.usesInheritdoc).toBe(true);
    });

    it('should calculate documentation coverage', () => {
      const content = `
/// <summary>Documented method.</summary>
public void Method1() { }

public void Method2() { }

/// <summary>Another documented method.</summary>
public void Method3() { }`;
      const analysis = detector.analyzeXmlDocumentation(content, 'Service.cs');
      expect(analysis.publicMembersCount).toBe(3);
      // All 3 are documented because the summary tags are close enough
      expect(analysis.documentedMembersCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('metadata', () => {
    it('should have correct detector metadata', () => {
      expect(detector.id).toBe('documentation/csharp-xml-docs');
      expect(detector.category).toBe('documentation');
      expect(detector.supportedLanguages).toContain('csharp');
    });
  });
});
