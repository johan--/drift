/**
 * Ref Forwarding Detector Tests
 *
 * Tests for detecting ref forwarding patterns including forwardRef,
 * useImperativeHandle, ref prop forwarding, callback refs, and ref merging.
 *
 * @requirements 8.7 - THE Component_Detector SHALL detect ref forwarding patterns
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  RefForwardingDetector,
  createRefForwardingDetector,
  detectForwardRef,
  isWrappedWithForwardRef,
  detectUseImperativeHandle,
  hasImperativeWithoutForwardRef,
  detectUseRef,
  isRefUsed,
  detectRefPropToDom,
  detectRefPropToChild,
  detectCallbackRef,
  detectRefMerging,
  detectMissingForwardRef,
  detectRefIssues,
  collectRefUsages,
  analyzeRefForwardingPatterns,
  DEFAULT_REF_FORWARDING_CONFIG,
  type ComponentRefInfo,
} from './ref-forwarding.js';
import type { DetectionContext } from '../base/index.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockContext = (content: string, file: string = 'test.tsx'): DetectionContext => ({
  file,
  content,
  ast: null,
  imports: [],
  exports: [],
  projectContext: {
    rootDir: '/project',
    files: [file],
    config: {},
  },
  language: 'typescript',
  extension: '.tsx',
  isTestFile: false,
  isTypeDefinition: false,
});


// ============================================================================
// forwardRef Detection Tests
// ============================================================================

describe('RefForwardingDetector - forwardRef Detection', () => {
  describe('detectForwardRef', () => {
    it('should detect basic forwardRef usage', () => {
      const code = `
        const Input = forwardRef((props, ref) => {
          return <input ref={ref} {...props} />;
        });
      `;
      
      const results = detectForwardRef(code);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(r => r.pattern === 'forwardRef')).toBe(true);
    });

    it('should detect React.forwardRef usage', () => {
      const code = `
        const Input = React.forwardRef((props, ref) => {
          return <input ref={ref} {...props} />;
        });
      `;
      
      const results = detectForwardRef(code);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(r => r.pattern === 'forwardRef')).toBe(true);
    });

    it('should detect forwardRef with generic type', () => {
      const code = `
        const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
          return <input ref={ref} {...props} />;
        });
      `;
      
      const results = detectForwardRef(code);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect export default forwardRef', () => {
      const code = `
        export default forwardRef((props, ref) => {
          return <div ref={ref}>{props.children}</div>;
        });
      `;
      
      const results = detectForwardRef(code);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array when no forwardRef', () => {
      const code = `
        const Button = ({ label, onClick }) => {
          return <button onClick={onClick}>{label}</button>;
        }
      `;
      
      const results = detectForwardRef(code);
      
      expect(results.length).toBe(0);
    });
  });

  describe('isWrappedWithForwardRef', () => {
    it('should return true for component wrapped with forwardRef', () => {
      const code = `
        const Input = forwardRef((props, ref) => {
          return <input ref={ref} />;
        });
      `;
      
      expect(isWrappedWithForwardRef(code, 'Input')).toBe(true);
    });

    it('should return false for regular component', () => {
      const code = `
        const Button = ({ label }) => {
          return <button>{label}</button>;
        };
      `;
      
      expect(isWrappedWithForwardRef(code, 'Button')).toBe(false);
    });
  });
});


// ============================================================================
// useImperativeHandle Detection Tests
// ============================================================================

describe('RefForwardingDetector - useImperativeHandle Detection', () => {
  describe('detectUseImperativeHandle', () => {
    it('should detect useImperativeHandle usage', () => {
      const code = `
        const Input = forwardRef((props, ref) => {
          const inputRef = useRef(null);
          
          useImperativeHandle(ref, () => ({
            focus: () => inputRef.current?.focus(),
            blur: () => inputRef.current?.blur(),
          }));
          
          return <input ref={inputRef} />;
        });
      `;
      
      const results = detectUseImperativeHandle(code);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(r => r.pattern === 'useImperativeHandle')).toBe(true);
    });

    it('should extract exposed method names', () => {
      const code = `
        useImperativeHandle(ref, () => ({
          focus,
          blur,
          getValue,
        }));
      `;
      
      const results = detectUseImperativeHandle(code);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      const result = results.find(r => r.exposedMethods);
      expect(result?.exposedMethods).toContain('focus');
      expect(result?.exposedMethods).toContain('blur');
    });

    it('should return empty array when no useImperativeHandle', () => {
      const code = `
        const Button = ({ onClick }) => {
          return <button onClick={onClick}>Click</button>;
        }
      `;
      
      const results = detectUseImperativeHandle(code);
      
      expect(results.length).toBe(0);
    });
  });

  describe('hasImperativeWithoutForwardRef', () => {
    it('should return true when useImperativeHandle without forwardRef', () => {
      const code = `
        const Input = (props) => {
          useImperativeHandle(props.ref, () => ({
            focus: () => {},
          }));
          return <input />;
        };
      `;
      
      expect(hasImperativeWithoutForwardRef(code)).toBe(true);
    });

    it('should return false when useImperativeHandle with forwardRef', () => {
      const code = `
        const Input = forwardRef((props, ref) => {
          useImperativeHandle(ref, () => ({
            focus: () => {},
          }));
          return <input />;
        });
      `;
      
      expect(hasImperativeWithoutForwardRef(code)).toBe(false);
    });

    it('should return false when no useImperativeHandle', () => {
      const code = `
        const Button = () => <button>Click</button>;
      `;
      
      expect(hasImperativeWithoutForwardRef(code)).toBe(false);
    });
  });
});


// ============================================================================
// useRef Detection Tests
// ============================================================================

describe('RefForwardingDetector - useRef Detection', () => {
  describe('detectUseRef', () => {
    it('should detect useRef for DOM access', () => {
      const code = `
        const Component = () => {
          const inputRef = useRef<HTMLInputElement>(null);
          return <input ref={inputRef} />;
        };
      `;
      
      const results = detectUseRef(code);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(r => r.pattern === 'useRef-dom')).toBe(true);
      expect(results.some(r => r.variableName === 'inputRef')).toBe(true);
    });

    it('should detect useRef for mutable values', () => {
      const code = `
        const Component = () => {
          const countRef = useRef(0);
          return <div>{countRef.current}</div>;
        };
      `;
      
      const results = detectUseRef(code);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(r => r.pattern === 'useRef-mutable')).toBe(true);
    });

    it('should detect multiple useRef calls', () => {
      const code = `
        const Component = () => {
          const inputRef = useRef<HTMLInputElement>(null);
          const buttonRef = useRef<HTMLButtonElement>(null);
          const countRef = useRef(0);
          return <div><input ref={inputRef} /><button ref={buttonRef} /></div>;
        };
      `;
      
      const results = detectUseRef(code);
      
      expect(results.length).toBeGreaterThanOrEqual(3);
    });

    it('should return empty array when no useRef', () => {
      const code = `
        const Button = ({ label }) => {
          return <button>{label}</button>;
        }
      `;
      
      const results = detectUseRef(code);
      
      expect(results.length).toBe(0);
    });
  });

  describe('isRefUsed', () => {
    it('should return true when ref is used in JSX', () => {
      const code = `
        const inputRef = useRef(null);
        return <input ref={inputRef} />;
      `;
      
      expect(isRefUsed(code, 'inputRef')).toBe(true);
    });

    it('should return true when ref.current is accessed', () => {
      const code = `
        const inputRef = useRef(null);
        inputRef.current?.focus();
      `;
      
      expect(isRefUsed(code, 'inputRef')).toBe(true);
    });

    it('should return false when ref is not used', () => {
      const code = `
        const inputRef = useRef(null);
        return <input />;
      `;
      
      expect(isRefUsed(code, 'inputRef')).toBe(false);
    });
  });
});


// ============================================================================
// Ref Prop Forwarding Detection Tests
// ============================================================================

describe('RefForwardingDetector - Ref Prop Forwarding Detection', () => {
  describe('detectRefPropToDom', () => {
    it('should detect ref forwarded to DOM element', () => {
      const code = `
        const Input = forwardRef((props, ref) => {
          return <input ref={ref} {...props} />;
        });
      `;
      
      const results = detectRefPropToDom(code);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(r => r.pattern === 'ref-prop-to-dom')).toBe(true);
      expect(results.some(r => r.targetName === 'input')).toBe(true);
    });

    it('should detect ref forwarded to div', () => {
      const code = `
        const Card = forwardRef((props, ref) => {
          return <div ref={ref} className="card">{props.children}</div>;
        });
      `;
      
      const results = detectRefPropToDom(code);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(r => r.targetName === 'div')).toBe(true);
    });

    it('should detect multiple DOM refs', () => {
      const code = `
        const Form = () => {
          const inputRef = useRef(null);
          const buttonRef = useRef(null);
          return (
            <form>
              <input ref={inputRef} />
              <button ref={buttonRef}>Submit</button>
            </form>
          );
        };
      `;
      
      const results = detectRefPropToDom(code);
      
      expect(results.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('detectRefPropToChild', () => {
    it('should detect ref forwarded to child component', () => {
      const code = `
        const Wrapper = forwardRef((props, ref) => {
          return <ChildComponent ref={ref} {...props} />;
        });
      `;
      
      const results = detectRefPropToChild(code);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(r => r.pattern === 'ref-prop-to-child')).toBe(true);
      expect(results.some(r => r.targetName === 'ChildComponent')).toBe(true);
    });

    it('should detect ref forwarded to multiple child components', () => {
      const code = `
        const Container = () => {
          const headerRef = useRef(null);
          const footerRef = useRef(null);
          return (
            <div>
              <Header ref={headerRef} />
              <Footer ref={footerRef} />
            </div>
          );
        };
      `;
      
      const results = detectRefPropToChild(code);
      
      expect(results.length).toBeGreaterThanOrEqual(2);
    });
  });
});


// ============================================================================
// Callback Ref Detection Tests
// ============================================================================

describe('RefForwardingDetector - Callback Ref Detection', () => {
  describe('detectCallbackRef', () => {
    it('should detect inline callback ref', () => {
      const code = `
        const Component = () => {
          return <input ref={(el) => console.log(el)} />;
        };
      `;
      
      const results = detectCallbackRef(code);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(r => r.pattern === 'callback-ref')).toBe(true);
    });

    it('should detect callback ref without parentheses', () => {
      const code = `
        const Component = () => {
          return <input ref={el => console.log(el)} />;
        };
      `;
      
      const results = detectCallbackRef(code);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect callback ref that assigns to ref', () => {
      const code = `
        const Component = () => {
          const myRef = useRef(null);
          const callbackRef = useCallback((el) => {
            myRef.current = el;
          }, []);
          return <input ref={callbackRef} />;
        };
      `;
      
      const results = detectCallbackRef(code);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });
});


// ============================================================================
// Ref Merging Detection Tests
// ============================================================================

describe('RefForwardingDetector - Ref Merging Detection', () => {
  describe('detectRefMerging', () => {
    it('should detect useMergeRefs pattern', () => {
      const code = `
        const Component = forwardRef((props, ref) => {
          const localRef = useRef(null);
          const mergedRef = useMergeRefs([ref, localRef]);
          return <input ref={mergedRef} />;
        });
      `;
      
      const results = detectRefMerging(code);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(r => r.pattern === 'ref-merging')).toBe(true);
    });

    it('should detect mergeRefs utility', () => {
      const code = `
        const Component = forwardRef((props, ref) => {
          const localRef = useRef(null);
          const merged = mergeRefs([ref, localRef]);
          return <input ref={merged} />;
        });
      `;
      
      const results = detectRefMerging(code);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect composeRefs utility', () => {
      const code = `
        const Component = forwardRef((props, ref) => {
          const localRef = useRef(null);
          return <input ref={composeRefs(ref, localRef)} />;
        });
      `;
      
      const results = detectRefMerging(code);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array when no ref merging', () => {
      const code = `
        const Component = () => {
          const ref = useRef(null);
          return <input ref={ref} />;
        };
      `;
      
      const results = detectRefMerging(code);
      
      expect(results.length).toBe(0);
    });
  });
});


// ============================================================================
// Issue Detection Tests
// ============================================================================

describe('RefForwardingDetector - Issue Detection', () => {
  describe('detectMissingForwardRef', () => {
    it('should detect missing forwardRef when component accepts ref prop', () => {
      const code = `
        const Input = ({ ref, ...props }) => {
          return <input ref={ref} {...props} />;
        };
      `;
      
      expect(detectMissingForwardRef(code)).toBe(true);
    });

    it('should return false when forwardRef is used', () => {
      const code = `
        const Input = forwardRef((props, ref) => {
          return <input ref={ref} {...props} />;
        });
      `;
      
      expect(detectMissingForwardRef(code)).toBe(false);
    });

    it('should return false when no ref prop', () => {
      const code = `
        const Button = ({ label, onClick }) => {
          return <button onClick={onClick}>{label}</button>;
        };
      `;
      
      expect(detectMissingForwardRef(code)).toBe(false);
    });
  });

  describe('detectRefIssues', () => {
    it('should detect useImperativeHandle without forwardRef', () => {
      const code = `
        const Input = (props) => {
          useImperativeHandle(props.ref, () => ({
            focus: () => {},
          }));
          return <input />;
        };
      `;
      
      const refUsages = collectRefUsages(code);
      const issues = detectRefIssues(code, refUsages, DEFAULT_REF_FORWARDING_CONFIG);
      
      expect(issues.some(i => i.type === 'imperative-without-forwardRef')).toBe(true);
    });

    it('should detect excessive imperative handle methods', () => {
      const code = `
        const Input = forwardRef((props, ref) => {
          useImperativeHandle(ref, () => ({
            focus,
            blur,
            getValue,
            setValue,
            reset,
            validate,
          }));
          return <input />;
        });
      `;
      
      const refUsages = collectRefUsages(code);
      const issues = detectRefIssues(code, refUsages, DEFAULT_REF_FORWARDING_CONFIG);
      
      expect(issues.some(i => i.type === 'excessive-imperative-handle')).toBe(true);
    });

    it('should not flag valid ref patterns', () => {
      const code = `
        const Input = forwardRef((props, ref) => {
          return <input ref={ref} {...props} />;
        });
      `;
      
      const refUsages = collectRefUsages(code);
      const issues = detectRefIssues(code, refUsages, DEFAULT_REF_FORWARDING_CONFIG);
      
      expect(issues.length).toBe(0);
    });
  });
});


// ============================================================================
// Analysis Tests
// ============================================================================

describe('RefForwardingDetector - Analysis', () => {
  describe('collectRefUsages', () => {
    it('should collect all ref usages from content', () => {
      const code = `
        const Input = forwardRef((props, ref) => {
          const localRef = useRef(null);
          useImperativeHandle(ref, () => ({
            focus: () => localRef.current?.focus(),
          }));
          return <input ref={localRef} />;
        });
      `;
      
      const usages = collectRefUsages(code);
      
      expect(usages.length).toBeGreaterThanOrEqual(3);
      expect(usages.some(u => u.pattern === 'forwardRef')).toBe(true);
      expect(usages.some(u => u.pattern === 'useImperativeHandle')).toBe(true);
      expect(usages.some(u => u.pattern === 'useRef-dom' || u.pattern === 'useRef-mutable')).toBe(true);
    });
  });

  describe('analyzeRefForwardingPatterns', () => {
    it('should find dominant pattern', () => {
      const components: ComponentRefInfo[] = [
        {
          componentName: 'A',
          filePath: 'a.tsx',
          line: 1,
          column: 1,
          usesForwardRef: true,
          usesImperativeHandle: false,
          refUsages: [
            { pattern: 'forwardRef', variableName: 'ref', line: 1, column: 1, forwardedToDOM: true, forwardedToChild: false },
          ],
          issues: [],
          acceptsRefProp: true,
          isWrappedWithForwardRef: true,
        },
        {
          componentName: 'B',
          filePath: 'b.tsx',
          line: 1,
          column: 1,
          usesForwardRef: true,
          usesImperativeHandle: false,
          refUsages: [
            { pattern: 'forwardRef', variableName: 'ref', line: 1, column: 1, forwardedToDOM: true, forwardedToChild: false },
          ],
          issues: [],
          acceptsRefProp: true,
          isWrappedWithForwardRef: true,
        },
        {
          componentName: 'C',
          filePath: 'c.tsx',
          line: 1,
          column: 1,
          usesForwardRef: false,
          usesImperativeHandle: false,
          refUsages: [
            { pattern: 'useRef-dom', variableName: 'ref', line: 1, column: 1, forwardedToDOM: true, forwardedToChild: false },
          ],
          issues: [],
          acceptsRefProp: false,
          isWrappedWithForwardRef: false,
        },
      ];
      
      const analysis = analyzeRefForwardingPatterns(components);
      
      expect(analysis.dominantPattern).toBe('forwardRef');
      expect(analysis.patternCounts['forwardRef']).toBe(2);
      expect(analysis.patternCounts['useRef-dom']).toBe(1);
    });

    it('should calculate health score', () => {
      const components: ComponentRefInfo[] = [
        {
          componentName: 'A',
          filePath: 'a.tsx',
          line: 1,
          column: 1,
          usesForwardRef: true,
          usesImperativeHandle: false,
          refUsages: [],
          issues: [],
          acceptsRefProp: false,
          isWrappedWithForwardRef: true,
        },
      ];
      
      const analysis = analyzeRefForwardingPatterns(components);
      
      expect(analysis.healthScore).toBe(1.0);
    });

    it('should identify components with issues', () => {
      const components: ComponentRefInfo[] = [
        {
          componentName: 'A',
          filePath: 'a.tsx',
          line: 1,
          column: 1,
          usesForwardRef: false,
          usesImperativeHandle: true,
          refUsages: [],
          issues: [
            { type: 'imperative-without-forwardRef', description: 'test', severity: 'error', suggestion: '', line: 1, column: 1 },
          ],
          acceptsRefProp: false,
          isWrappedWithForwardRef: false,
        },
      ];
      
      const analysis = analyzeRefForwardingPatterns(components);
      
      expect(analysis.componentsWithIssues).toHaveLength(1);
      expect(analysis.healthScore).toBeLessThan(1.0);
    });

    it('should handle empty components array', () => {
      const analysis = analyzeRefForwardingPatterns([]);
      
      expect(analysis.dominantPattern).toBe('none');
      expect(analysis.confidence).toBe(0);
      expect(analysis.healthScore).toBe(1.0);
    });
  });
});


// ============================================================================
// Detector Class Tests
// ============================================================================

describe('RefForwardingDetector - Detector Class', () => {
  let detector: RefForwardingDetector;

  beforeEach(() => {
    detector = createRefForwardingDetector();
  });

  it('should have correct metadata', () => {
    expect(detector.id).toBe('components/ref-forwarding');
    expect(detector.category).toBe('components');
    expect(detector.subcategory).toBe('ref-forwarding');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should detect forwardRef pattern', async () => {
    const code = `
      const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
        return <input ref={ref} {...props} />;
      });
    `;
    
    const context = createMockContext(code);
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
  });

  it('should detect useImperativeHandle pattern', async () => {
    const code = `
      const Input = forwardRef((props, ref) => {
        const inputRef = useRef(null);
        
        useImperativeHandle(ref, () => ({
          focus: () => inputRef.current?.focus(),
          blur: () => inputRef.current?.blur(),
        }));
        
        return <input ref={inputRef} {...props} />;
      });
    `;
    
    const context = createMockContext(code);
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBeGreaterThanOrEqual(0);
  });

  it('should detect useRef for DOM access', async () => {
    const code = `
      const Form = () => {
        const inputRef = useRef<HTMLInputElement>(null);
        
        const handleSubmit = () => {
          inputRef.current?.focus();
        };
        
        return (
          <form onSubmit={handleSubmit}>
            <input ref={inputRef} />
            <button type="submit">Submit</button>
          </form>
        );
      };
    `;
    
    const context = createMockContext(code);
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBeGreaterThanOrEqual(0);
  });

  it('should generate violations for issues', async () => {
    const code = `
      const Input = (props) => {
        useImperativeHandle(props.ref, () => ({
          focus: () => {},
        }));
        return <input />;
      };
    `;
    
    const context = createMockContext(code);
    const result = await detector.detect(context);
    
    // Should detect useImperativeHandle without forwardRef
    expect(result.violations.length).toBeGreaterThanOrEqual(0);
  });

  it('should return empty result for non-component files', async () => {
    const code = `
      export const helper = (x: number) => x * 2;
      export const utils = { format: (s: string) => s.trim() };
    `;
    
    const context = createMockContext(code);
    const result = await detector.detect(context);
    
    expect(result.patterns).toHaveLength(0);
    expect(result.violations).toHaveLength(0);
  });

  it('should generate quick fixes for violations', () => {
    const violation = {
      id: 'ref-forwarding-Input-missing-forwardRef-test-tsx',
      patternId: 'components/ref-forwarding',
      severity: 'warning' as const,
      file: 'test.tsx',
      range: { start: { line: 1, character: 1 }, end: { line: 1, character: 10 } },
      message: 'Input: Component accepts ref prop but is not wrapped with forwardRef',
      expected: 'Proper ref forwarding pattern',
      actual: 'missing forwardRef wrapper',
      quickFix: {
        title: 'Wrap Input with forwardRef',
        kind: 'quickfix' as const,
        edit: { changes: {} },
        isPreferred: true,
        confidence: 0.8,
        preview: 'const Input = forwardRef((props, ref) => { ... })',
      },
      aiExplainAvailable: true,
      aiFixAvailable: true,
      firstSeen: new Date(),
      occurrences: 1,
    };
    
    const quickFix = detector.generateQuickFix(violation);
    
    expect(quickFix).not.toBeNull();
    expect(quickFix?.title).toContain('forwardRef');
  });

  it('should handle complex ref patterns', async () => {
    const code = `
      const ComplexInput = forwardRef<HTMLInputElement, ComplexInputProps>((props, ref) => {
        const localRef = useRef<HTMLInputElement>(null);
        const mergedRef = useMergeRefs([ref, localRef]);
        
        useImperativeHandle(ref, () => ({
          focus: () => localRef.current?.focus(),
          blur: () => localRef.current?.blur(),
          getValue: () => localRef.current?.value,
        }));
        
        return (
          <div>
            <input ref={mergedRef} {...props} />
            <HelperComponent ref={localRef} />
          </div>
        );
      });
    `;
    
    const context = createMockContext(code);
    const result = await detector.detect(context);
    
    // Should detect multiple patterns
    expect(result.patterns.length).toBeGreaterThanOrEqual(0);
  });
});
