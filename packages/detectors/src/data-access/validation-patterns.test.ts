/**
 * Validation Patterns Detector Tests
 *
 * Tests for input validation pattern detection.
 *
 * @requirements 13.4 - Validation pattern detection
 */

import { describe, it, expect } from 'vitest';
import {
  ValidationPatternsDetector,
  createValidationPatternsDetector,
  detectZodSchemas,
  detectYupSchemas,
  detectJoiSchemas,
  detectClassValidators,
  detectManualValidation,
  detectValidationMiddleware,
  analyzeValidationPatterns,
  shouldExcludeFile,
} from './validation-patterns.js';
import type { DetectionContext, ProjectContext } from '../base/index.js';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockContext(file: string, content: string = ''): DetectionContext {
  const projectContext: ProjectContext = {
    rootDir: '/project',
    files: [file],
    config: {},
  };

  return {
    file,
    content,
    ast: null,
    imports: [],
    exports: [],
    projectContext,
    language: 'typescript',
    extension: '.ts',
    isTestFile: file.includes('.test.') || file.includes('.spec.'),
    isTypeDefinition: file.endsWith('.d.ts'),
  };
}

// ============================================================================
// shouldExcludeFile Tests
// ============================================================================

describe('shouldExcludeFile', () => {
  it('should exclude test files', () => {
    expect(shouldExcludeFile('validation.test.ts')).toBe(true);
    expect(shouldExcludeFile('validation.spec.ts')).toBe(true);
  });

  it('should exclude __tests__ directory', () => {
    expect(shouldExcludeFile('__tests__/validation.ts')).toBe(true);
  });

  it('should exclude type definition files', () => {
    expect(shouldExcludeFile('types.d.ts')).toBe(true);
  });

  it('should exclude node_modules', () => {
    expect(shouldExcludeFile('node_modules/zod/index.js')).toBe(true);
  });

  it('should not exclude regular source files', () => {
    expect(shouldExcludeFile('src/schemas/user.ts')).toBe(false);
    expect(shouldExcludeFile('lib/validation.ts')).toBe(false);
  });
});

// ============================================================================
// Zod Schema Detection Tests
// ============================================================================

describe('detectZodSchemas', () => {
  it('should detect z.object schema', () => {
    const content = `const userSchema = z.object({
      name: z.string(),
      email: z.string().email()
    });`;
    const results = detectZodSchemas(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('zod-schema');
    expect(results[0]?.library).toBe('zod');
  });

  it('should detect z.string()', () => {
    const content = `const nameSchema = z.string();`;
    const results = detectZodSchemas(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect z.number()', () => {
    const content = `const ageSchema = z.number();`;
    const results = detectZodSchemas(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect z.array()', () => {
    const content = `const tagsSchema = z.array(z.string());`;
    const results = detectZodSchemas(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect z.enum()', () => {
    const content = `const statusSchema = z.enum(['active', 'inactive']);`;
    const results = detectZodSchemas(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect .parse() method', () => {
    const content = `const user = userSchema.parse(data);`;
    const results = detectZodSchemas(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect .safeParse() method', () => {
    const content = `const result = userSchema.safeParse(data);`;
    const results = detectZodSchemas(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Yup Schema Detection Tests
// ============================================================================

describe('detectYupSchemas', () => {
  it('should detect yup.object schema', () => {
    const content = `const userSchema = yup.object({
      name: yup.string().required()
    });`;
    const results = detectYupSchemas(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('yup-schema');
    expect(results[0]?.library).toBe('yup');
  });

  it('should detect yup.string()', () => {
    const content = `const nameSchema = yup.string();`;
    const results = detectYupSchemas(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect yup.number()', () => {
    const content = `const ageSchema = yup.number();`;
    const results = detectYupSchemas(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect .validate() method', () => {
    const content = `const user = await userSchema.validate(data);`;
    const results = detectYupSchemas(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect .validateSync() method', () => {
    const content = `const user = userSchema.validateSync(data);`;
    const results = detectYupSchemas(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Joi Schema Detection Tests
// ============================================================================

describe('detectJoiSchemas', () => {
  it('should detect Joi.object schema', () => {
    const content = `const userSchema = Joi.object({
      name: Joi.string().required()
    });`;
    const results = detectJoiSchemas(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('joi-schema');
    expect(results[0]?.library).toBe('joi');
  });

  it('should detect Joi.string()', () => {
    const content = `const nameSchema = Joi.string();`;
    const results = detectJoiSchemas(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect Joi.number()', () => {
    const content = `const ageSchema = Joi.number();`;
    const results = detectJoiSchemas(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Class Validator Detection Tests
// ============================================================================

describe('detectClassValidators', () => {
  it('should detect @IsString decorator', () => {
    const content = `@IsString()
    name: string;`;
    const results = detectClassValidators(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('class-validator');
    expect(results[0]?.library).toBe('class-validator');
  });

  it('should detect @IsNumber decorator', () => {
    const content = `@IsNumber()
    age: number;`;
    const results = detectClassValidators(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect @IsEmail decorator', () => {
    const content = `@IsEmail()
    email: string;`;
    const results = detectClassValidators(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect @IsNotEmpty decorator', () => {
    const content = `@IsNotEmpty()
    name: string;`;
    const results = detectClassValidators(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect @ValidateNested decorator', () => {
    const content = `@ValidateNested()
    address: Address;`;
    const results = detectClassValidators(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect @IsOptional decorator', () => {
    const content = `@IsOptional()
    nickname: string;`;
    const results = detectClassValidators(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect @Min decorator', () => {
    const content = `@Min(0)
    age: number;`;
    const results = detectClassValidators(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect @Max decorator', () => {
    const content = `@Max(120)
    age: number;`;
    const results = detectClassValidators(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Manual Validation Detection Tests
// ============================================================================

describe('detectManualValidation', () => {
  it('should detect null check', () => {
    const content = `if (value === null) throw new Error();`;
    const results = detectManualValidation(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('manual-validation');
  });

  it('should detect undefined check', () => {
    const content = `if (value === undefined) throw new Error();`;
    const results = detectManualValidation(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect typeof check', () => {
    const content = `if (typeof value === 'string') {}`;
    const results = detectManualValidation(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect Array.isArray check', () => {
    const content = `if (Array.isArray(items)) {}`;
    const results = detectManualValidation(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect Number.isNaN check', () => {
    const content = `if (Number.isNaN(value)) {}`;
    const results = detectManualValidation(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect Number.isFinite check', () => {
    const content = `if (Number.isFinite(value)) {}`;
    const results = detectManualValidation(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Validation Middleware Detection Tests
// ============================================================================

describe('detectValidationMiddleware', () => {
  it('should detect validateRequest middleware', () => {
    const content = `app.use(validateRequest(schema));`;
    const results = detectValidationMiddleware(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('validation-middleware');
  });

  it('should detect validateBody middleware', () => {
    const content = `router.post('/', validateBody(userSchema), handler);`;
    const results = detectValidationMiddleware(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect validateQuery middleware', () => {
    const content = `router.get('/', validateQuery(querySchema), handler);`;
    const results = detectValidationMiddleware(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect validateParams middleware', () => {
    const content = `router.get('/:id', validateParams(paramsSchema), handler);`;
    const results = detectValidationMiddleware(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect express-validator import', () => {
    const content = `import { body, validationResult } from 'express-validator';`;
    const results = detectValidationMiddleware(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Full Analysis Tests
// ============================================================================

describe('analyzeValidationPatterns', () => {
  it('should return empty analysis for excluded files', () => {
    const content = `const schema = z.object({ name: z.string() });`;
    const analysis = analyzeValidationPatterns(content, 'validation.test.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.violations.length).toBe(0);
    expect(analysis.hasValidation).toBe(false);
  });

  it('should detect validation usage', () => {
    const content = `
      const userSchema = z.object({
        name: z.string(),
        email: z.string().email()
      });
    `;
    const analysis = analyzeValidationPatterns(content, 'schema.ts');
    
    expect(analysis.hasValidation).toBe(true);
    expect(analysis.dominantLibrary).toBe('zod');
  });

  it('should detect inconsistent validation libraries', () => {
    const content = `
      const zodSchema = z.object({ name: z.string() });
      const yupSchema = yup.object({ email: yup.string() });
    `;
    const analysis = analyzeValidationPatterns(content, 'schema.ts');
    
    expect(analysis.violations.some(v => v.type === 'inconsistent-validation')).toBe(true);
  });

  it('should identify dominant library', () => {
    const content = `
      const schema1 = z.object({});
      const schema2 = z.string();
      const schema3 = z.number();
    `;
    const analysis = analyzeValidationPatterns(content, 'schema.ts');
    
    expect(analysis.dominantLibrary).toBe('zod');
  });

  it('should not flag single library usage', () => {
    const content = `
      const schema1 = z.object({});
      const schema2 = z.string();
    `;
    const analysis = analyzeValidationPatterns(content, 'schema.ts');
    
    expect(analysis.violations.some(v => v.type === 'inconsistent-validation')).toBe(false);
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('ValidationPatternsDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createValidationPatternsDetector();
    
    expect(detector.id).toBe('data-access/validation-patterns');
    expect(detector.category).toBe('data-access');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should return empty result for unsupported languages', async () => {
    const detector = new ValidationPatternsDetector();
    const context = createMockContext('styles.css', 'body { color: red; }');
    context.language = 'css';
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should detect patterns in TypeScript files', async () => {
    const detector = new ValidationPatternsDetector();
    const content = `const schema = z.object({ name: z.string() });`;
    const context = createMockContext('schema.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should return empty result for files without validation', async () => {
    const detector = new ValidationPatternsDetector();
    const content = `const x = 1 + 2;`;
    const context = createMockContext('utils.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
  });

  it('should have higher confidence when validation is found', async () => {
    const detector = new ValidationPatternsDetector();
    const content = `const schema = z.object({ name: z.string() });`;
    const context = createMockContext('schema.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBe(0.9);
  });
});
