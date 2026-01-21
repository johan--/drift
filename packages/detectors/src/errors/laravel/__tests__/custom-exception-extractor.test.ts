/**
 * Laravel Custom Exception Extractor Tests
 */

import { describe, it, expect } from 'vitest';
import { CustomExceptionExtractor } from '../extractors/custom-exception-extractor.js';

describe('CustomExceptionExtractor', () => {
  const extractor = new CustomExceptionExtractor();

  describe('extract', () => {
    it('should extract custom exception class', () => {
      const content = `
        class InvalidOrderException extends Exception
        {
            public function __construct(string $message = 'Invalid order')
            {
                parent::__construct($message);
            }
        }
      `;

      const result = extractor.extract(content, 'InvalidOrderException.php');

      expect(result.exceptions).toHaveLength(1);
      expect(result.exceptions[0].name).toBe('InvalidOrderException');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should extract exception with render method', () => {
      const content = `
        class InvalidOrderException extends Exception
        {
            public function render(Request $request)
            {
                return response()->json([
                    'error' => 'Invalid order',
                ], 400);
            }
        }
      `;

      const result = extractor.extract(content, 'InvalidOrderException.php');

      expect(result.exceptions).toHaveLength(1);
      expect(result.exceptions[0].hasRender).toBe(true);
    });

    it('should extract exception with report method', () => {
      const content = `
        class InvalidOrderException extends Exception
        {
            public function report()
            {
                Log::error('Invalid order exception occurred');
            }
        }
      `;

      const result = extractor.extract(content, 'InvalidOrderException.php');

      expect(result.exceptions).toHaveLength(1);
      expect(result.exceptions[0].hasReport).toBe(true);
    });

    it('should extract exception with context method', () => {
      const content = `
        class InvalidOrderException extends Exception
        {
            public function context(): array
            {
                return ['order_id' => $this->orderId];
            }
        }
      `;

      const result = extractor.extract(content, 'InvalidOrderException.php');

      expect(result.exceptions).toHaveLength(1);
      // The extractor doesn't track context method, just verify exception is extracted
      expect(result.exceptions[0].name).toBe('InvalidOrderException');
    });

    it('should extract multiple exceptions', () => {
      const content = `
        class InvalidOrderException extends Exception {}
        class OrderNotFoundException extends Exception {}
        class PaymentFailedException extends Exception {}
      `;

      const result = extractor.extract(content, 'Exceptions.php');

      expect(result.exceptions).toHaveLength(3);
    });

    it('should return empty for non-exception content', () => {
      const content = `
        class UserController extends Controller
        {
            public function index() {}
        }
      `;

      const result = extractor.extract(content, 'UserController.php');

      expect(result.exceptions).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });
  });
});
