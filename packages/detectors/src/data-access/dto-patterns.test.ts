/**
 * DTO Patterns Detector Tests
 *
 * Tests for Data Transfer Object pattern detection.
 *
 * @requirements 13.5 - DTO pattern detection
 */

import { describe, it, expect } from 'vitest';
import {
  DTOPatternsDetector,
  createDTOPatternsDetector,
  detectDTOClasses,
  detectDTOInterfaces,
  detectDTOTypes,
  detectMapperFunctions,
  detectTransformerClasses,
  detectSerializers,
  detectEntityExposureViolations,
  analyzeDTOPatterns,
  shouldExcludeFile,
} from './dto-patterns.js';
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
    expect(shouldExcludeFile('dto.test.ts')).toBe(true);
    expect(shouldExcludeFile('dto.spec.ts')).toBe(true);
  });

  it('should exclude __tests__ directory', () => {
    expect(shouldExcludeFile('__tests__/dto.ts')).toBe(true);
  });

  it('should exclude type definition files', () => {
    expect(shouldExcludeFile('types.d.ts')).toBe(true);
  });

  it('should exclude node_modules', () => {
    expect(shouldExcludeFile('node_modules/class-transformer/index.js')).toBe(true);
  });

  it('should not exclude regular source files', () => {
    expect(shouldExcludeFile('src/dto/user.ts')).toBe(false);
    expect(shouldExcludeFile('lib/UserDTO.ts')).toBe(false);
  });
});

// ============================================================================
// DTO Class Detection Tests
// ============================================================================

describe('detectDTOClasses', () => {
  it('should detect DTO class', () => {
    const content = `class UserDTO {
      name: string;
      email: string;
    }`;
    const results = detectDTOClasses(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('dto-class');
    expect(results[0]?.name).toBe('UserDTO');
  });

  it('should detect Dto class (lowercase)', () => {
    const content = `class UserDto {
      name: string;
    }`;
    const results = detectDTOClasses(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.name).toBe('UserDto');
  });

  it('should detect Request class', () => {
    const content = `class CreateUserRequest {
      name: string;
    }`;
    const results = detectDTOClasses(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.name).toBe('CreateUserRequest');
  });

  it('should detect Response class', () => {
    const content = `class UserResponse {
      id: string;
      name: string;
    }`;
    const results = detectDTOClasses(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.name).toBe('UserResponse');
  });

  it('should detect Input class', () => {
    const content = `class CreateUserInput {
      name: string;
    }`;
    const results = detectDTOClasses(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.name).toBe('CreateUserInput');
  });

  it('should detect Output class', () => {
    const content = `class UserOutput {
      id: string;
    }`;
    const results = detectDTOClasses(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.name).toBe('UserOutput');
  });

  it('should detect exported DTO class', () => {
    const content = `export class ProductDTO {
      id: string;
    }`;
    const results = detectDTOClasses(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.name).toBe('ProductDTO');
  });
});

// ============================================================================
// DTO Interface Detection Tests
// ============================================================================

describe('detectDTOInterfaces', () => {
  it('should detect DTO interface', () => {
    const content = `interface UserDTO {
      name: string;
    }`;
    const results = detectDTOInterfaces(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('dto-interface');
    expect(results[0]?.name).toBe('UserDTO');
  });

  it('should detect Request interface', () => {
    const content = `interface CreateUserRequest {
      name: string;
    }`;
    const results = detectDTOInterfaces(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect Response interface', () => {
    const content = `interface UserResponse {
      id: string;
    }`;
    const results = detectDTOInterfaces(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect exported DTO interface', () => {
    const content = `export interface ProductDTO {
      id: string;
    }`;
    const results = detectDTOInterfaces(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// DTO Type Detection Tests
// ============================================================================

describe('detectDTOTypes', () => {
  it('should detect DTO type alias', () => {
    const content = `type UserDTO = {
      name: string;
    };`;
    const results = detectDTOTypes(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('dto-type');
    expect(results[0]?.name).toBe('UserDTO');
  });

  it('should detect Request type alias', () => {
    const content = `type CreateUserRequest = {
      name: string;
    };`;
    const results = detectDTOTypes(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect Response type alias', () => {
    const content = `type UserResponse = {
      id: string;
    };`;
    const results = detectDTOTypes(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect exported DTO type', () => {
    const content = `export type ProductDTO = {
      id: string;
    };`;
    const results = detectDTOTypes(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Mapper Function Detection Tests
// ============================================================================

describe('detectMapperFunctions', () => {
  it('should detect toDTO function', () => {
    const content = `function toUserDTO(user: User): UserDTO {
      return { name: user.name };
    }`;
    const results = detectMapperFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('mapper-function');
  });

  it('should detect fromDTO function', () => {
    const content = `function fromUserDTO(dto: UserDTO): User {
      return new User(dto.name);
    }`;
    const results = detectMapperFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect mapUser function', () => {
    const content = `function mapUserToDTO(user: User): UserDTO {
      return { name: user.name };
    }`;
    const results = detectMapperFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect transform function', () => {
    const content = `function transformUser(user: User): UserDTO {
      return { name: user.name };
    }`;
    const results = detectMapperFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect arrow function mapper', () => {
    const content = `const toUserDTO = (user: User) => ({ name: user.name });`;
    const results = detectMapperFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect .toDTO() method call', () => {
    const content = `const dto = user.toDTO();`;
    const results = detectMapperFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect .fromDTO() method call', () => {
    const content = `const user = User.fromDTO(dto);`;
    const results = detectMapperFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Transformer Class Detection Tests
// ============================================================================

describe('detectTransformerClasses', () => {
  it('should detect Transformer class', () => {
    const content = `class UserTransformer {
      transform(user: User): UserDTO {}
    }`;
    const results = detectTransformerClasses(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('transformer-class');
    expect(results[0]?.name).toBe('UserTransformer');
  });

  it('should detect Mapper class', () => {
    const content = `class UserMapper {
      map(user: User): UserDTO {}
    }`;
    const results = detectTransformerClasses(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.name).toBe('UserMapper');
  });

  it('should detect Converter class', () => {
    const content = `class UserConverter {
      convert(user: User): UserDTO {}
    }`;
    const results = detectTransformerClasses(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.name).toBe('UserConverter');
  });

  it('should detect @Transform decorator', () => {
    const content = `@Transform(({ value }) => value.toUpperCase())
    name: string;`;
    const results = detectTransformerClasses(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect class-transformer import', () => {
    const content = `import { plainToClass } from 'class-transformer';`;
    const results = detectTransformerClasses(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Serializer Detection Tests
// ============================================================================

describe('detectSerializers', () => {
  it('should detect Serializer class', () => {
    const content = `class UserSerializer {
      serialize(user: User): string {}
    }`;
    const results = detectSerializers(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('serializer');
    expect(results[0]?.name).toBe('UserSerializer');
  });

  it('should detect .serialize() method', () => {
    const content = `const json = serializer.serialize(user);`;
    const results = detectSerializers(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect .deserialize() method', () => {
    const content = `const user = serializer.deserialize(json);`;
    const results = detectSerializers(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect JSON.stringify', () => {
    const content = `const json = JSON.stringify(user);`;
    const results = detectSerializers(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect JSON.parse', () => {
    const content = `const user = JSON.parse(json);`;
    const results = detectSerializers(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Entity Exposure Violation Tests
// ============================================================================

describe('detectEntityExposureViolations', () => {
  it('should detect direct prisma return', () => {
    const content = `return await prisma.user.findMany();`;
    const results = detectEntityExposureViolations(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('entity-exposure');
    expect(results[0]?.message).toContain('DTO');
  });

  it('should detect direct db return', () => {
    const content = `return await db.user.findFirst({ where: { id } });`;
    const results = detectEntityExposureViolations(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect res.json with direct db access', () => {
    const content = `res.json(await prisma.user.findMany());`;
    const results = detectEntityExposureViolations(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect res.send with direct db access', () => {
    const content = `res.send(await db.user.findFirst());`;
    const results = detectEntityExposureViolations(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Full Analysis Tests
// ============================================================================

describe('analyzeDTOPatterns', () => {
  it('should return empty analysis for excluded files', () => {
    const content = `class UserDTO { name: string; }`;
    const analysis = analyzeDTOPatterns(content, 'dto.test.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.violations.length).toBe(0);
    expect(analysis.hasDTOs).toBe(false);
  });

  it('should detect DTO usage', () => {
    const content = `
      class UserDTO {
        name: string;
        email: string;
      }
      
      function toUserDTO(user: User): UserDTO {
        return { name: user.name, email: user.email };
      }
    `;
    const analysis = analyzeDTOPatterns(content, 'dto.ts');
    
    expect(analysis.hasDTOs).toBe(true);
    expect(analysis.dtoCount).toBeGreaterThan(0);
  });

  it('should count DTO definitions', () => {
    const content = `
      class UserDTO {}
      interface ProductDTO {}
      type OrderDTO = {};
    `;
    const analysis = analyzeDTOPatterns(content, 'dto.ts');
    
    expect(analysis.dtoCount).toBe(3);
  });

  it('should detect entity exposure violations', () => {
    const content = `
      async function getUsers() {
        return await prisma.user.findMany();
      }
    `;
    const analysis = analyzeDTOPatterns(content, 'service.ts');
    
    expect(analysis.violations.some(v => v.type === 'entity-exposure')).toBe(true);
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('DTOPatternsDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createDTOPatternsDetector();
    
    expect(detector.id).toBe('data-access/dto-patterns');
    expect(detector.category).toBe('data-access');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should return empty result for unsupported languages', async () => {
    const detector = new DTOPatternsDetector();
    const context = createMockContext('styles.css', 'body { color: red; }');
    context.language = 'css';
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should detect patterns in TypeScript files', async () => {
    const detector = new DTOPatternsDetector();
    const content = `class UserDTO { name: string; }`;
    const context = createMockContext('dto.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should return empty result for files without DTOs', async () => {
    const detector = new DTOPatternsDetector();
    const content = `const x = 1 + 2;`;
    const context = createMockContext('utils.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
  });

  it('should have higher confidence when DTOs are found', async () => {
    const detector = new DTOPatternsDetector();
    const content = `class UserDTO { name: string; }`;
    const context = createMockContext('dto.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBe(0.9);
  });
});
