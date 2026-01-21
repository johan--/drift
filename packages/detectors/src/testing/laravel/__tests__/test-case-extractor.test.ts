/**
 * Laravel Test Case Extractor Tests
 */

import { describe, it, expect } from 'vitest';
import { TestCaseExtractor } from '../extractors/test-case-extractor.js';

describe('TestCaseExtractor', () => {
  const extractor = new TestCaseExtractor();

  describe('extract', () => {
    it('should extract basic test case', () => {
      const content = `
        <?php

        namespace Tests\\Unit;

        use Tests\\TestCase;

        class UserTest extends TestCase
        {
            public function testUserCanBeCreated()
            {
                $this->assertTrue(true);
            }
        }
      `;

      const result = extractor.extract(content, 'tests/Unit/UserTest.php');

      expect(result.testCases).toHaveLength(1);
      expect(result.testCases[0].name).toBe('UserTest');
      expect(result.testCases[0].type).toBe('unit');
      expect(result.testCases[0].methods.length).toBeGreaterThanOrEqual(1);
    });

    it('should extract feature test', () => {
      const content = `
        <?php

        namespace Tests\\Feature;

        use Tests\\TestCase;

        class UserApiTest extends TestCase
        {
            public function testUserCanLogin()
            {
                $this->post('/login', ['email' => 'test@example.com'])
                    ->assertStatus(200);
            }
        }
      `;

      const result = extractor.extract(content, 'tests/Feature/UserApiTest.php');

      expect(result.testCases).toHaveLength(1);
      expect(result.testCases[0].type).toBe('feature');
    });

    it('should extract test methods with assertions', () => {
      const content = `
        <?php

        namespace Tests\\Unit;

        use Tests\\TestCase;

        class CalculatorTest extends TestCase
        {
            public function testAddition()
            {
                $this->assertEquals(4, 2 + 2);
                $this->assertNotEquals(5, 2 + 2);
            }

            public function testSubtraction()
            {
                $this->assertTrue(5 - 3 === 2);
            }
        }
      `;

      const result = extractor.extract(content, 'tests/Unit/CalculatorTest.php');

      expect(result.testCases).toHaveLength(1);
      expect(result.testCases[0].methods.length).toBeGreaterThanOrEqual(2);
      
      const additionTest = result.testCases[0].methods.find(m => m.name === 'testAddition');
      expect(additionTest?.assertions).toContain('assertEquals');
    });

    it('should detect data providers', () => {
      const content = `
        <?php

        namespace Tests\\Unit;

        use Tests\\TestCase;

        class MathTest extends TestCase
        {
            /**
             * @dataProvider additionProvider
             */
            public function testAddition($a, $b, $expected)
            {
                $this->assertEquals($expected, $a + $b);
            }

            public function additionProvider()
            {
                return [
                    [1, 1, 2],
                    [2, 3, 5],
                ];
            }
        }
      `;

      const result = extractor.extract(content, 'tests/Unit/MathTest.php');

      expect(result.testCases).toHaveLength(1);
      const testMethod = result.testCases[0].methods.find(m => m.name === 'testAddition');
      expect(testMethod?.hasDataProvider).toBe(true);
      expect(testMethod?.dataProvider).toBe('additionProvider');
    });

    it('should extract traits used in test', () => {
      const content = `
        <?php

        namespace Tests\\Feature;

        use Tests\\TestCase;
        use Illuminate\\Foundation\\Testing\\RefreshDatabase;
        use Illuminate\\Foundation\\Testing\\WithFaker;

        class UserTest extends TestCase
        {
            use RefreshDatabase, WithFaker;

            public function testUserCreation()
            {
                $this->assertTrue(true);
            }
        }
      `;

      const result = extractor.extract(content, 'tests/Feature/UserTest.php');

      expect(result.testCases).toHaveLength(1);
      expect(result.testCases[0].traits).toContain('RefreshDatabase');
      expect(result.testCases[0].traits).toContain('WithFaker');
    });

    it('should detect browser/Dusk tests', () => {
      const content = `
        <?php

        namespace Tests\\Browser;

        use Laravel\\Dusk\\Browser;
        use Tests\\DuskTestCase;

        class LoginTest extends DuskTestCase
        {
            public function testUserCanLogin()
            {
                $this->browse(function (Browser $browser) {
                    $browser->visit('/login')
                        ->type('email', 'test@example.com')
                        ->press('Login')
                        ->assertPathIs('/dashboard');
                });
            }
        }
      `;

      const result = extractor.extract(content, 'tests/Browser/LoginTest.php');

      expect(result.testCases).toHaveLength(1);
      expect(result.testCases[0].type).toBe('browser');
    });

    it('should extract namespace and FQN', () => {
      const content = `
        <?php

        namespace Tests\\Unit\\Services;

        use Tests\\TestCase;

        class PaymentServiceTest extends TestCase
        {
            public function testPayment()
            {
                $this->assertTrue(true);
            }
        }
      `;

      const result = extractor.extract(content, 'tests/Unit/Services/PaymentServiceTest.php');

      expect(result.testCases).toHaveLength(1);
      expect(result.testCases[0].namespace).toBe('Tests\\Unit\\Services');
      expect(result.testCases[0].fqn).toBe('Tests\\Unit\\Services\\PaymentServiceTest');
    });

    it('should return empty for non-test content', () => {
      const content = `
        <?php

        namespace App\\Services;

        class UserService
        {
            public function createUser() {}
        }
      `;

      const result = extractor.extract(content, 'app/Services/UserService.php');

      expect(result.testCases).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });

    it('should detect tests via hasTests', () => {
      const testContent = `extends TestCase`;
      const nonTestContent = `class UserService {}`;

      expect(extractor.hasTests(testContent)).toBe(true);
      expect(extractor.hasTests(nonTestContent)).toBe(false);
    });

    it('should have high confidence when tests found', () => {
      const content = `
        <?php

        class SomeTest extends TestCase
        {
            public function testSomething()
            {
                $this->assertTrue(true);
            }
        }
      `;

      const result = extractor.extract(content, 'SomeTest.php');

      expect(result.confidence).toBeGreaterThan(0);
    });
  });
});
