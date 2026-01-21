/**
 * Laravel Mass Assignment Extractor Tests
 */

import { describe, it, expect } from 'vitest';
import { MassAssignmentExtractor } from '../extractors/mass-assignment-extractor.js';

describe('MassAssignmentExtractor', () => {
  const extractor = new MassAssignmentExtractor();

  describe('extract', () => {
    it('should extract fillable fields', () => {
      const content = `
        class User extends Model
        {
            protected $fillable = ['name', 'email', 'password'];
        }
      `;

      const result = extractor.extract(content, 'User.php');

      expect(result.models).toHaveLength(1);
      expect(result.models[0].model).toBe('User');
      expect(result.models[0].fillable).toEqual(['name', 'email', 'password']);
      expect(result.models[0].hasProtection).toBe(true);
    });

    it('should extract guarded fields', () => {
      const content = `
        class User extends Model
        {
            protected $guarded = ['id', 'is_admin'];
        }
      `;

      const result = extractor.extract(content, 'User.php');

      expect(result.models).toHaveLength(1);
      expect(result.models[0].guarded).toEqual(['id', 'is_admin']);
      expect(result.models[0].hasProtection).toBe(true);
    });

    it('should detect unprotected model', () => {
      const content = `
        class User extends Model
        {
            // No fillable or guarded
        }
      `;

      const result = extractor.extract(content, 'User.php');

      expect(result.models).toHaveLength(1);
      expect(result.models[0].hasProtection).toBe(false);
    });

    it('should detect request->all() vulnerability', () => {
      const content = `
        public function store(Request $request)
        {
            User::create($request->all());
        }
      `;

      const result = extractor.extract(content, 'UserController.php');

      expect(result.vulnerabilities).toHaveLength(1);
      expect(result.vulnerabilities[0].type).toBe('request-all');
      expect(result.vulnerabilities[0].severity).toBe('high');
    });

    it('should detect update with request->all()', () => {
      const content = `
        public function update(Request $request, User $user)
        {
            $user->update($request->all());
        }
      `;

      const result = extractor.extract(content, 'UserController.php');

      expect(result.vulnerabilities).toHaveLength(1);
      expect(result.vulnerabilities[0].type).toBe('request-all');
    });

    it('should detect forceCreate', () => {
      const content = `
        public function store(Request $request)
        {
            User::forceCreate($request->validated());
        }
      `;

      const result = extractor.extract(content, 'UserController.php');

      expect(result.vulnerabilities).toHaveLength(1);
      expect(result.vulnerabilities[0].type).toBe('force-fill');
      expect(result.vulnerabilities[0].severity).toBe('medium');
    });

    it('should detect forceFill', () => {
      const content = `
        public function update(Request $request, User $user)
        {
            $user->forceFill($request->validated())->save();
        }
      `;

      const result = extractor.extract(content, 'UserController.php');

      expect(result.vulnerabilities).toHaveLength(1);
      expect(result.vulnerabilities[0].type).toBe('force-fill');
    });

    it('should detect Model::unguard()', () => {
      const content = `
        public function seed()
        {
            Model::unguard();
            // Seeding...
        }
      `;

      const result = extractor.extract(content, 'DatabaseSeeder.php');

      expect(result.vulnerabilities).toHaveLength(1);
      expect(result.vulnerabilities[0].type).toBe('unguarded');
      expect(result.vulnerabilities[0].severity).toBe('high');
    });

    it('should return empty for safe code', () => {
      const content = `
        public function store(StoreUserRequest $request)
        {
            User::create($request->validated());
        }
      `;

      const result = extractor.extract(content, 'UserController.php');

      expect(result.vulnerabilities).toHaveLength(0);
    });
  });

  describe('hasMassAssignmentPatterns', () => {
    it('should return true when fillable exists', () => {
      const content = `protected $fillable = ['name'];`;
      expect(extractor.hasMassAssignmentPatterns(content)).toBe(true);
    });

    it('should return true when create exists', () => {
      const content = `User::create($data);`;
      expect(extractor.hasMassAssignmentPatterns(content)).toBe(true);
    });

    it('should return false when no patterns', () => {
      const content = `return User::find(1);`;
      expect(extractor.hasMassAssignmentPatterns(content)).toBe(false);
    });
  });
});
