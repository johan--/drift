/**
 * Laravel Exception Detector Tests
 */

import { describe, it, expect } from 'vitest';
import { LaravelExceptionDetector } from '../exception-detector.js';

describe('LaravelExceptionDetector', () => {
  const detector = new LaravelExceptionDetector();

  describe('detect', () => {
    it('should detect exception handler', async () => {
      const content = `
        <?php

        namespace App\\Exceptions;

        use Illuminate\\Foundation\\Exceptions\\Handler as ExceptionHandler;

        class Handler extends ExceptionHandler
        {
            protected $dontReport = [
                AuthenticationException::class,
            ];

            public function register(): void
            {
                $this->reportable(function (Throwable $e) {
                    //
                });
            }

            public function render($request, Throwable $e)
            {
                return parent::render($request, $e);
            }
        }
      `;

      const result = await detector.detect({
        content,
        file: 'Handler.php',
        language: 'php',
      });

      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect custom exceptions', async () => {
      const content = `
        <?php

        namespace App\\Exceptions;

        use Exception;

        class PaymentFailedException extends Exception
        {
            protected $message = 'Payment processing failed';

            public function report(): void
            {
                Log::error('Payment failed');
            }

            public function render($request)
            {
                return response()->json(['error' => $this->message], 422);
            }
        }
      `;

      const result = await detector.detect({
        content,
        file: 'PaymentFailedException.php',
        language: 'php',
      });

      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect abort() calls', async () => {
      const content = `
        <?php

        namespace App\\Http\\Controllers;

        use Illuminate\\Http\\Request;

        class PostController extends Controller
        {
            public function show($id)
            {
                $post = Post::find($id);
                
                if (!$post) {
                    abort(404, 'Post not found');
                }

                if (!$post->isPublished()) {
                    abort(403);
                }

                return view('posts.show', compact('post'));
            }
        }
      `;

      const result = await detector.detect({
        content,
        file: 'PostController.php',
        language: 'php',
      });

      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should return empty result for non-Laravel code', async () => {
      const content = `
        <?php

        class SimpleClass
        {
            public function doSomething()
            {
                return 'hello';
            }
        }
      `;

      const result = await detector.detect({
        content,
        file: 'SimpleClass.php',
        language: 'php',
      });

      // SimpleClass doesn't contain exception patterns
      // so it returns empty result with no custom data
      expect(result.custom).toBeUndefined();
    });
  });

  describe('analyzeErrors', () => {
    it('should analyze exception patterns', () => {
      const content = `
        <?php

        namespace App\\Exceptions;

        class CustomException extends Exception
        {
            public function render($request)
            {
                return response()->json(['error' => 'Custom error'], 500);
            }
        }
      `;

      const analysis = detector.analyzeErrors(content, 'CustomException.php');

      expect(analysis.confidence).toBeGreaterThan(0);
      expect(analysis.exceptions).toBeDefined();
    });

    it('should combine handler and exception analysis', () => {
      const content = `
        <?php

        namespace App\\Exceptions;

        use Illuminate\\Foundation\\Exceptions\\Handler as ExceptionHandler;

        class Handler extends ExceptionHandler
        {
            public function register(): void
            {
                $this->reportable(function (CustomException $e) {
                    Log::error($e->getMessage());
                });
            }
        }

        class CustomException extends Exception {}
      `;

      const analysis = detector.analyzeErrors(content, 'exceptions.php');

      expect(analysis.confidence).toBeGreaterThan(0);
    });
  });
});
