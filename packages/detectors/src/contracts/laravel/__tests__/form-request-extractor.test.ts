/**
 * Laravel Form Request Extractor Tests
 */

import { describe, it, expect } from 'vitest';
import { FormRequestExtractor } from '../extractors/form-request-extractor.js';

describe('FormRequestExtractor', () => {
  const extractor = new FormRequestExtractor();

  describe('extract', () => {
    it('should extract basic form request with array rules', () => {
      const content = `
        <?php

        namespace App\\Http\\Requests;

        use Illuminate\\Foundation\\Http\\FormRequest;

        class StoreUserRequest extends FormRequest
        {
            public function rules(): array
            {
                return [
                    'name' => ['required', 'string', 'max:255'],
                    'email' => ['required', 'email', 'unique:users'],
                    'password' => ['required', 'min:8', 'confirmed'],
                ];
            }
        }
      `;

      const result = extractor.extract(content, 'StoreUserRequest.php');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('StoreUserRequest');
      expect(result[0].rules.length).toBeGreaterThanOrEqual(3);
      
      const nameRule = result[0].rules.find(r => r.field === 'name');
      expect(nameRule?.required).toBe(true);
      expect(nameRule?.rules).toContain('required');
    });

    it('should extract form request with pipe-separated rules', () => {
      const content = `
        <?php

        namespace App\\Http\\Requests;

        use Illuminate\\Foundation\\Http\\FormRequest;

        class UpdateUserRequest extends FormRequest
        {
            public function rules(): array
            {
                return [
                    'name' => 'required|string|max:255',
                    'email' => 'required|email',
                ];
            }
        }
      `;

      const result = extractor.extract(content, 'UpdateUserRequest.php');

      expect(result).toHaveLength(1);
      expect(result[0].rules.length).toBeGreaterThanOrEqual(2);
    });

    it('should detect nullable fields', () => {
      const content = `
        <?php

        namespace App\\Http\\Requests;

        use Illuminate\\Foundation\\Http\\FormRequest;

        class UpdateProfileRequest extends FormRequest
        {
            public function rules(): array
            {
                return [
                    'bio' => ['nullable', 'string', 'max:500'],
                    'avatar' => ['nullable', 'image'],
                ];
            }
        }
      `;

      const result = extractor.extract(content, 'UpdateProfileRequest.php');

      expect(result).toHaveLength(1);
      const bioRule = result[0].rules.find(r => r.field === 'bio');
      expect(bioRule?.nullable).toBe(true);
      expect(bioRule?.required).toBe(false);
    });

    it('should detect authorization method', () => {
      const content = `
        <?php

        namespace App\\Http\\Requests;

        use Illuminate\\Foundation\\Http\\FormRequest;

        class DeletePostRequest extends FormRequest
        {
            public function authorize(): bool
            {
                return $this->user()->can('delete', $this->post);
            }

            public function rules(): array
            {
                return [];
            }
        }
      `;

      const result = extractor.extract(content, 'DeletePostRequest.php');

      expect(result).toHaveLength(1);
      expect(result[0].hasAuthorization).toBe(true);
    });

    it('should detect custom messages method', () => {
      const content = `
        <?php

        namespace App\\Http\\Requests;

        use Illuminate\\Foundation\\Http\\FormRequest;

        class StorePostRequest extends FormRequest
        {
            public function rules(): array
            {
                return [
                    'title' => ['required', 'string'],
                ];
            }

            public function messages(): array
            {
                return [
                    'title.required' => 'Please provide a title.',
                ];
            }
        }
      `;

      const result = extractor.extract(content, 'StorePostRequest.php');

      expect(result).toHaveLength(1);
      expect(result[0].hasCustomMessages).toBe(true);
    });

    it('should detect prepareForValidation method', () => {
      const content = `
        <?php

        namespace App\\Http\\Requests;

        use Illuminate\\Foundation\\Http\\FormRequest;

        class StorePostRequest extends FormRequest
        {
            protected function prepareForValidation(): void
            {
                $this->merge([
                    'slug' => Str::slug($this->title),
                ]);
            }

            public function rules(): array
            {
                return [
                    'title' => ['required'],
                ];
            }
        }
      `;

      const result = extractor.extract(content, 'StorePostRequest.php');

      expect(result).toHaveLength(1);
      expect(result[0].hasPrepareForValidation).toBe(true);
    });

    it('should infer types from validation rules', () => {
      const content = `
        <?php

        namespace App\\Http\\Requests;

        use Illuminate\\Foundation\\Http\\FormRequest;

        class CreateProductRequest extends FormRequest
        {
            public function rules(): array
            {
                return [
                    'name' => ['required', 'string'],
                    'price' => ['required', 'numeric'],
                    'quantity' => ['required', 'integer'],
                    'is_active' => ['boolean'],
                    'tags' => ['array'],
                ];
            }
        }
      `;

      const result = extractor.extract(content, 'CreateProductRequest.php');

      expect(result).toHaveLength(1);
      
      const nameRule = result[0].rules.find(r => r.field === 'name');
      expect(nameRule?.inferredType).toBe('string');
      
      const priceRule = result[0].rules.find(r => r.field === 'price');
      expect(priceRule?.inferredType).toBe('number');
      
      const quantityRule = result[0].rules.find(r => r.field === 'quantity');
      expect(quantityRule?.inferredType).toBe('number');
    });

    it('should return empty for non-form-request content', () => {
      const content = `
        <?php

        namespace App\\Http\\Controllers;

        class UserController extends Controller
        {
            public function store(Request $request) {}
        }
      `;

      const result = extractor.extract(content, 'UserController.php');

      expect(result).toHaveLength(0);
    });

    it('should detect form requests via hasFormRequests', () => {
      const formRequestContent = `extends FormRequest`;
      const nonFormRequestContent = `class UserController extends Controller {}`;

      expect(extractor.hasFormRequests(formRequestContent)).toBe(true);
      expect(extractor.hasFormRequests(nonFormRequestContent)).toBe(false);
    });
  });
});
