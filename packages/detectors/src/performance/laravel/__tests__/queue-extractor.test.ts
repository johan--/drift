/**
 * Laravel Queue Extractor Tests
 */

import { describe, it, expect } from 'vitest';
import { QueueExtractor } from '../extractors/queue-extractor.js';

describe('QueueExtractor', () => {
  const extractor = new QueueExtractor();

  describe('extract', () => {
    it('should extract job class', () => {
      const content = `
        class ProcessPodcast implements ShouldQueue
        {
            use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

            public $tries = 3;
            public $timeout = 120;

            public function handle()
            {
                // Process the podcast...
            }
        }
      `;

      const result = extractor.extract(content, 'ProcessPodcast.php');

      expect(result.jobs).toHaveLength(1);
      expect(result.jobs[0].name).toBe('ProcessPodcast');
      expect(result.jobs[0].tries).toBe(3);
      expect(result.jobs[0].timeout).toBe(120);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should extract dispatch helper usage', () => {
      const content = `
        public function store(Request $request)
        {
            dispatch(new ProcessPodcast($podcast));
        }
      `;

      const result = extractor.extract(content, 'PodcastController.php');

      expect(result.usages).toHaveLength(1);
      expect(result.usages[0].type).toBe('dispatch');
      expect(result.usages[0].job).toBe('ProcessPodcast');
    });

    it('should extract static dispatch', () => {
      const content = `
        public function store(Request $request)
        {
            ProcessPodcast::dispatch($podcast);
        }
      `;

      const result = extractor.extract(content, 'PodcastController.php');

      expect(result.usages).toHaveLength(1);
      expect(result.usages[0].type).toBe('dispatch');
      expect(result.usages[0].job).toBe('ProcessPodcast');
    });

    it('should extract Queue::push', () => {
      const content = `
        public function store(Request $request)
        {
            Queue::push(new ProcessPodcast($podcast));
        }
      `;

      const result = extractor.extract(content, 'PodcastController.php');

      expect(result.usages).toHaveLength(1);
      expect(result.usages[0].type).toBe('push');
      expect(result.usages[0].job).toBe('ProcessPodcast');
    });

    it('should extract Queue::later', () => {
      const content = `
        public function store(Request $request)
        {
            Queue::later(60, new ProcessPodcast($podcast));
        }
      `;

      const result = extractor.extract(content, 'PodcastController.php');

      expect(result.usages).toHaveLength(1);
      expect(result.usages[0].type).toBe('later');
      expect(result.usages[0].delay).toBe(60);
    });

    it('should extract job chain', () => {
      const content = `
        public function store(Request $request)
        {
            Bus::chain([
                new ProcessPodcast($podcast),
                new OptimizePodcast($podcast),
                new ReleasePodcast($podcast),
            ])->dispatch();
        }
      `;

      const result = extractor.extract(content, 'PodcastController.php');

      expect(result.usages.some(u => u.type === 'chain')).toBe(true);
    });

    it('should extract job batch', () => {
      const content = `
        public function store(Request $request)
        {
            Bus::batch([
                new ProcessPodcast($podcast1),
                new ProcessPodcast($podcast2),
            ])->dispatch();
        }
      `;

      const result = extractor.extract(content, 'PodcastController.php');

      expect(result.usages.some(u => u.type === 'batch')).toBe(true);
    });

    it('should extract unique job', () => {
      const content = `
        class ProcessPodcast implements ShouldQueue, ShouldBeUnique
        {
            public function handle()
            {
                // Process...
            }
        }
      `;

      const result = extractor.extract(content, 'ProcessPodcast.php');

      expect(result.jobs).toHaveLength(1);
      expect(result.jobs[0].isUnique).toBe(true);
    });

    it('should return empty for non-queue content', () => {
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

      expect(result.jobs).toHaveLength(0);
      expect(result.usages).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });
  });

  describe('hasQueuePatterns', () => {
    it('should return true when ShouldQueue exists', () => {
      const content = `class ProcessPodcast implements ShouldQueue`;
      expect(extractor.hasQueuePatterns(content)).toBe(true);
    });

    it('should return true when dispatch exists', () => {
      const content = `ProcessPodcast::dispatch($podcast);`;
      expect(extractor.hasQueuePatterns(content)).toBe(true);
    });

    it('should return false when no queue patterns', () => {
      const content = `return User::all();`;
      expect(extractor.hasQueuePatterns(content)).toBe(false);
    });
  });
});
