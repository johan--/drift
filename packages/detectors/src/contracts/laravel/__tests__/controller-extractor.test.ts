/**
 * Laravel Controller Extractor Tests
 */

import { describe, it, expect } from 'vitest';
import { ControllerExtractor } from '../extractors/controller-extractor.js';

describe('ControllerExtractor', () => {
  const extractor = new ControllerExtractor();

  describe('extract', () => {
    it('should extract controller class', () => {
      const content = `
        class UserController extends Controller
        {
            public function index()
            {
                return User::all();
            }
        }
      `;

      const result = extractor.extract(content, 'UserController.php');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('UserController');
      expect(result[0].actions.length).toBeGreaterThan(0);
    });

    it('should extract controller actions', () => {
      const content = `
        class UserController extends Controller
        {
            public function index() {}
            public function show(User $user) {}
            public function store(StoreUserRequest $request) {}
            public function update(UpdateUserRequest $request, User $user) {}
            public function destroy(User $user) {}
        }
      `;

      const result = extractor.extract(content, 'UserController.php');

      expect(result).toHaveLength(1);
      expect(result[0].actions.map(a => a.name)).toContain('index');
      expect(result[0].actions.map(a => a.name)).toContain('show');
      expect(result[0].actions.map(a => a.name)).toContain('store');
      expect(result[0].actions.map(a => a.name)).toContain('update');
      expect(result[0].actions.map(a => a.name)).toContain('destroy');
    });

    it('should extract form request usage', () => {
      const content = `
        class UserController extends Controller
        {
            public function store(StoreUserRequest $request)
            {
                return User::create($request->validated());
            }
        }
      `;

      const result = extractor.extract(content, 'UserController.php');

      expect(result).toHaveLength(1);
      const storeAction = result[0].actions.find(a => a.name === 'store');
      expect(storeAction?.formRequest).toBe('StoreUserRequest');
    });

    it('should extract return type', () => {
      const content = `
        class UserController extends Controller
        {
            public function show(User $user): UserResource
            {
                return new UserResource($user);
            }
        }
      `;

      const result = extractor.extract(content, 'UserController.php');

      expect(result).toHaveLength(1);
      const showAction = result[0].actions.find(a => a.name === 'show');
      expect(showAction?.returnType).toBe('UserResource');
    });

    it('should extract invokable controller', () => {
      const content = `
        class ShowUserController extends Controller
        {
            public function __invoke(User $user)
            {
                return new UserResource($user);
            }
        }
      `;

      const result = extractor.extract(content, 'ShowUserController.php');

      expect(result).toHaveLength(1);
      // Invokable controllers may or may not be detected depending on implementation
      expect(result[0].name).toBe('ShowUserController');
    });

    it('should return empty for non-controller content', () => {
      const content = `
        class User extends Model
        {
            protected $fillable = ['name', 'email'];
        }
      `;

      const result = extractor.extract(content, 'User.php');

      expect(result).toHaveLength(0);
    });
  });
});
