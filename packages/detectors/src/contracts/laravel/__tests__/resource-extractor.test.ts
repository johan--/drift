/**
 * Laravel Resource Extractor Tests
 */

import { describe, it, expect } from 'vitest';
import { ResourceExtractor } from '../extractors/resource-extractor.js';

describe('ResourceExtractor', () => {
  const extractor = new ResourceExtractor();

  describe('extract', () => {
    it('should extract basic JsonResource', () => {
      const content = `
        <?php

        namespace App\\Http\\Resources;

        use Illuminate\\Http\\Resources\\Json\\JsonResource;

        class UserResource extends JsonResource
        {
            public function toArray($request): array
            {
                return [
                    'id' => $this->id,
                    'name' => $this->name,
                    'email' => $this->email,
                ];
            }
        }
      `;

      const result = extractor.extract(content, 'UserResource.php');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('UserResource');
      expect(result[0].isCollection).toBe(false);
      expect(result[0].fields.length).toBeGreaterThanOrEqual(3);
    });

    it('should extract ResourceCollection', () => {
      const content = `
        <?php

        namespace App\\Http\\Resources;

        use Illuminate\\Http\\Resources\\Json\\ResourceCollection;

        class UserCollection extends ResourceCollection
        {
            public function toArray($request): array
            {
                return [
                    'data' => $this->collection,
                ];
            }
        }
      `;

      const result = extractor.extract(content, 'UserCollection.php');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('UserCollection');
      expect(result[0].isCollection).toBe(true);
    });

    it('should extract whenLoaded conditional fields', () => {
      const content = `
        <?php

        namespace App\\Http\\Resources;

        use Illuminate\\Http\\Resources\\Json\\JsonResource;

        class PostResource extends JsonResource
        {
            public function toArray($request): array
            {
                return [
                    'id' => $this->id,
                    'title' => $this->title,
                    'author' => new UserResource($this->whenLoaded('user')),
                    'comments' => CommentResource::collection($this->whenLoaded('comments')),
                ];
            }
        }
      `;

      const result = extractor.extract(content, 'PostResource.php');

      expect(result).toHaveLength(1);
      expect(result[0].conditionalFields.length).toBeGreaterThanOrEqual(1);
      const authorField = result[0].conditionalFields.find(f => f.name === 'author');
      expect(authorField?.conditionType).toBe('whenLoaded');
    });

    it('should extract when conditional fields', () => {
      const content = `
        <?php

        namespace App\\Http\\Resources;

        use Illuminate\\Http\\Resources\\Json\\JsonResource;

        class UserResource extends JsonResource
        {
            public function toArray($request): array
            {
                return [
                    'id' => $this->id,
                    'email' => $this->when($request->user()->isAdmin(), $this->email),
                    'secret' => $this->when($this->is_admin, $this->secret_data),
                ];
            }
        }
      `;

      const result = extractor.extract(content, 'UserResource.php');

      expect(result).toHaveLength(1);
      const conditionalFields = result[0].conditionalFields.filter(f => f.conditionType === 'when');
      expect(conditionalFields.length).toBeGreaterThanOrEqual(1);
    });

    it('should extract whenNotNull conditional fields', () => {
      const content = `
        <?php

        namespace App\\Http\\Resources;

        use Illuminate\\Http\\Resources\\Json\\JsonResource;

        class UserResource extends JsonResource
        {
            public function toArray($request): array
            {
                return [
                    'id' => $this->id,
                    'phone' => $this->whenNotNull($this->phone_number),
                ];
            }
        }
      `;

      const result = extractor.extract(content, 'UserResource.php');

      expect(result).toHaveLength(1);
      const whenNotNullFields = result[0].conditionalFields.filter(f => f.conditionType === 'whenNotNull');
      expect(whenNotNullFields.length).toBeGreaterThanOrEqual(1);
    });

    it('should infer field types', () => {
      const content = `
        <?php

        namespace App\\Http\\Resources;

        use Illuminate\\Http\\Resources\\Json\\JsonResource;

        class UserResource extends JsonResource
        {
            public function toArray($request): array
            {
                return [
                    'id' => $this->id,
                    'user_id' => $this->user_id,
                    'created_at' => $this->created_at,
                    'is_active' => $this->is_active,
                    'email' => $this->email,
                    'price' => $this->price,
                ];
            }
        }
      `;

      const result = extractor.extract(content, 'UserResource.php');

      expect(result).toHaveLength(1);
      const fields = result[0].fields;
      
      const idField = fields.find(f => f.name === 'id');
      expect(idField?.type).toBe('number');
      
      const isActiveField = fields.find(f => f.name === 'is_active');
      expect(isActiveField?.type).toBe('boolean');
    });

    it('should return empty for non-resource content', () => {
      const content = `
        <?php

        namespace App\\Http\\Controllers;

        class UserController extends Controller
        {
            public function index() {}
        }
      `;

      const result = extractor.extract(content, 'UserController.php');

      expect(result).toHaveLength(0);
    });

    it('should detect resources via hasResources', () => {
      const resourceContent = `use Illuminate\\Http\\Resources\\Json\\JsonResource;`;
      const nonResourceContent = `class UserController extends Controller {}`;

      expect(extractor.hasResources(resourceContent)).toBe(true);
      expect(extractor.hasResources(nonResourceContent)).toBe(false);
    });
  });
});
