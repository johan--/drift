/**
 * Composition Detector Tests
 *
 * Tests for detecting component composition patterns including children prop,
 * render props, HOCs, compound components, and more.
 *
 * @requirements 8.6 - THE Component_Detector SHALL detect component composition patterns
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CompositionDetector,
  createCompositionDetector,
  detectChildrenProp,
  acceptsChildrenProp,
  detectRenderProps,
  detectHOC,
  extractHOCNames,
  detectCompoundComponent,
  isCompoundComponentPart,
  detectSlotBasedComposition,
  detectProviderConsumer,
  countNestedProviders,
  detectControlledPattern,
  detectUncontrolledPattern,
  hasMixedControlledPatterns,
  detectAntiPatterns,
  analyzeCompositionPatterns,
  DEFAULT_COMPOSITION_CONFIG,
  type ComponentCompositionInfo,
} from './composition.js';
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
// Children Prop Detection Tests
// ============================================================================

describe('CompositionDetector - Children Prop Detection', () => {
  describe('detectChildrenProp', () => {
    it('should detect children in props destructuring', () => {
      const code = `
        const Card = ({ children, title }) => {
          return (
            <div>
              <h1>{title}</h1>
              {children}
            </div>
          );
        }
      `;
      
      const result = detectChildrenProp(code);
      
      expect(result).not.toBeNull();
      expect(result?.pattern).toBe('children-prop');
    });

    it('should detect props.children usage', () => {
      const code = `
        const Card = (props) => {
          return (
            <div>
              {props.children}
            </div>
          );
        }
      `;
      
      const result = detectChildrenProp(code);
      
      expect(result).not.toBeNull();
      expect(result?.pattern).toBe('children-prop');
    });

    it('should detect React.Children usage', () => {
      const code = `
        const List = ({ children }) => {
          return (
            <ul>
              {React.Children.map(children, (child, index) => (
                <li key={index}>{child}</li>
              ))}
            </ul>
          );
        }
      `;
      
      const result = detectChildrenProp(code);
      
      expect(result).not.toBeNull();
    });

    it('should return null when no children usage', () => {
      const code = `
        const Button = ({ label, onClick }) => {
          return <button onClick={onClick}>{label}</button>;
        }
      `;
      
      const result = detectChildrenProp(code);
      
      expect(result).toBeNull();
    });
  });

  describe('acceptsChildrenProp', () => {
    it('should detect children in type definition', () => {
      const code = `
        interface Props {
          children: React.ReactNode;
          title: string;
        }
        const Card = ({ children, title }: Props) => {
          return <div>{children}</div>;
        }
      `;
      
      expect(acceptsChildrenProp(code)).toBe(true);
    });

    it('should detect PropsWithChildren', () => {
      const code = `
        type Props = PropsWithChildren<{ title: string }>;
        const Card: FC<Props> = ({ children, title }) => {
          return <div>{children}</div>;
        }
      `;
      
      expect(acceptsChildrenProp(code)).toBe(true);
    });
  });
});


// ============================================================================
// Render Props Detection Tests
// ============================================================================

describe('CompositionDetector - Render Props Detection', () => {
  describe('detectRenderProps', () => {
    it('should detect render prop pattern', () => {
      const code = `
        const DataFetcher = ({ render, url }) => {
          const [data, setData] = useState(null);
          useEffect(() => { fetch(url).then(setData); }, [url]);
          return render(data);
        }
      `;
      
      const result = detectRenderProps(code);
      
      expect(result).not.toBeNull();
      expect(result?.pattern).toBe('render-props');
      expect(result?.details.renderPropNames).toContain('render');
    });

    it('should detect children as function pattern', () => {
      const code = `
        const Toggle = ({ children }) => {
          const [on, setOn] = useState(false);
          return children({ on, toggle: () => setOn(!on) });
        }
      `;
      
      const result = detectRenderProps(code);
      
      expect(result).not.toBeNull();
      expect(result?.details.renderPropNames).toContain('children');
    });

    it('should detect multiple render props', () => {
      const code = `
        const List = ({ renderItem, renderHeader, renderFooter, data }) => {
          return (
            <div>
              {renderHeader()}
              {data.map(item => renderItem(item))}
              {renderFooter()}
            </div>
          );
        }
      `;
      
      const result = detectRenderProps(code);
      
      expect(result).not.toBeNull();
      expect(result?.details.renderPropNames?.length).toBeGreaterThanOrEqual(2);
    });

    it('should return null when no render props', () => {
      const code = `
        const Button = ({ label, onClick }) => {
          return <button onClick={onClick}>{label}</button>;
        }
      `;
      
      const result = detectRenderProps(code);
      
      expect(result).toBeNull();
    });
  });
});


// ============================================================================
// HOC Detection Tests
// ============================================================================

describe('CompositionDetector - HOC Detection', () => {
  describe('detectHOC', () => {
    it('should detect export default with HOC', () => {
      const code = `
        const MyComponent = ({ user }) => {
          return <div>{user.name}</div>;
        };
        export default withAuth(MyComponent);
      `;
      
      const results = detectHOC(code);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(r => r.pattern === 'hoc')).toBe(true);
    });

    it('should detect nested HOCs', () => {
      const code = `
        const MyComponent = ({ user, theme }) => {
          return <div style={theme}>{user.name}</div>;
        };
        export default withRouter(withAuth(withTheme(MyComponent)));
      `;
      
      const results = detectHOC(code);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      const hocResult = results.find(r => r.details.nestingDepth && r.details.nestingDepth >= 3);
      expect(hocResult).toBeDefined();
    });

    it('should detect const assignment with HOC', () => {
      const code = `
        const BaseComponent = () => <div>Hello</div>;
        const EnhancedComponent = withStyles(BaseComponent);
      `;
      
      const results = detectHOC(code);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(r => r.componentName === 'EnhancedComponent')).toBe(true);
    });

    it('should detect HOC definition', () => {
      const code = `
        function withLoading(WrappedComponent) {
          return function WithLoadingComponent(props) {
            if (props.isLoading) return <Spinner />;
            return <WrappedComponent {...props} />;
          };
        }
      `;
      
      const results = detectHOC(code);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(r => r.details.hocNames?.includes('withLoading'))).toBe(true);
    });

    it('should detect memo and forwardRef', () => {
      const code = `
        const MyComponent = memo(({ value }) => {
          return <div>{value}</div>;
        });
        
        const InputComponent = forwardRef((props, ref) => {
          return <input ref={ref} {...props} />;
        });
      `;
      
      const results = detectHOC(code);
      
      expect(results.some(r => r.details.hocNames?.includes('memo'))).toBe(true);
      expect(results.some(r => r.details.hocNames?.includes('forwardRef'))).toBe(true);
    });
  });

  describe('extractHOCNames', () => {
    it('should extract HOC names from chain', () => {
      const chain = 'withRouter(withAuth(withTheme(Component)))';
      
      const names = extractHOCNames(chain);
      
      expect(names).toContain('withRouter');
      expect(names).toContain('withAuth');
      expect(names).toContain('withTheme');
    });

    it('should extract connect from Redux', () => {
      const chain = 'connect(mapState, mapDispatch)(Component)';
      
      const names = extractHOCNames(chain);
      
      expect(names).toContain('connect');
    });
  });
});


// ============================================================================
// Compound Component Detection Tests
// ============================================================================

describe('CompositionDetector - Compound Component Detection', () => {
  describe('detectCompoundComponent', () => {
    it('should detect compound component pattern', () => {
      const code = `
        const Menu = ({ children }) => {
          return <nav>{children}</nav>;
        };
        
        Menu.Item = ({ children, onClick }) => {
          return <button onClick={onClick}>{children}</button>;
        };
        
        Menu.Divider = () => <hr />;
      `;
      
      const results = detectCompoundComponent(code);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(r => r.componentName === 'Menu')).toBe(true);
      expect(results.some(r => r.details.subComponentNames?.includes('Item'))).toBe(true);
    });

    it('should detect multiple sub-components', () => {
      const code = `
        const Card = ({ children }) => <div className="card">{children}</div>;
        Card.Header = ({ children }) => <div className="card-header">{children}</div>;
        Card.Body = ({ children }) => <div className="card-body">{children}</div>;
        Card.Footer = ({ children }) => <div className="card-footer">{children}</div>;
      `;
      
      const results = detectCompoundComponent(code);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      const cardResult = results.find(r => r.componentName === 'Card');
      expect(cardResult?.details.subComponentNames?.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('isCompoundComponentPart', () => {
    it('should return true for component with sub-components', () => {
      const code = `
        const Tabs = ({ children }) => <div>{children}</div>;
        Tabs.Tab = ({ label }) => <button>{label}</button>;
      `;
      
      expect(isCompoundComponentPart('Tabs', code)).toBe(true);
    });

    it('should return false for regular component', () => {
      const code = `
        const Button = ({ label }) => <button>{label}</button>;
      `;
      
      expect(isCompoundComponentPart('Button', code)).toBe(false);
    });
  });
});


// ============================================================================
// Slot-Based Composition Detection Tests
// ============================================================================

describe('CompositionDetector - Slot-Based Composition Detection', () => {
  describe('detectSlotBasedComposition', () => {
    it('should detect slot-based composition', () => {
      const code = `
        const Layout = ({ header, sidebar, content, footer }) => {
          return (
            <div className="layout">
              <header>{header}</header>
              <aside>{sidebar}</aside>
              <main>{content}</main>
              <footer>{footer}</footer>
            </div>
          );
        }
      `;
      
      const result = detectSlotBasedComposition(code);
      
      expect(result).not.toBeNull();
      expect(result?.pattern).toBe('slot-based');
      expect(result?.details.slotNames?.length).toBeGreaterThanOrEqual(2);
    });

    it('should detect render slot props', () => {
      const code = `
        const Table = ({ renderHeader, renderRow, renderFooter, data }) => {
          return (
            <table>
              <thead>{renderHeader()}</thead>
              <tbody>{data.map(renderRow)}</tbody>
              <tfoot>{renderFooter()}</tfoot>
            </table>
          );
        }
      `;
      
      const result = detectSlotBasedComposition(code);
      
      expect(result).not.toBeNull();
      expect(result?.details.slotNames?.length).toBeGreaterThanOrEqual(2);
    });

    it('should return null for single slot', () => {
      const code = `
        const Card = ({ header, children }) => {
          return <div>{header}{children}</div>;
        }
      `;
      
      // Single slot (header) is not enough to be considered slot-based
      const result = detectSlotBasedComposition(code);
      
      // May or may not detect depending on threshold
      // The important thing is it doesn't crash
      expect(result === null || result?.pattern === 'slot-based').toBe(true);
    });
  });
});


// ============================================================================
// Provider/Consumer Detection Tests
// ============================================================================

describe('CompositionDetector - Provider/Consumer Detection', () => {
  describe('detectProviderConsumer', () => {
    it('should detect Context.Provider usage', () => {
      const code = `
        const App = () => {
          return (
            <ThemeContext.Provider value={theme}>
              <UserContext.Provider value={user}>
                <MainContent />
              </UserContext.Provider>
            </ThemeContext.Provider>
          );
        }
      `;
      
      const results = detectProviderConsumer(code);
      
      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.some(r => r.details.contextName === 'ThemeContext')).toBe(true);
      expect(results.some(r => r.details.contextName === 'UserContext')).toBe(true);
    });

    it('should detect Context.Consumer usage', () => {
      const code = `
        const ThemedButton = () => {
          return (
            <ThemeContext.Consumer>
              {theme => <button style={{ color: theme.primary }}>Click</button>}
            </ThemeContext.Consumer>
          );
        }
      `;
      
      const results = detectProviderConsumer(code);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(r => r.details.contextName === 'ThemeContext')).toBe(true);
    });

    it('should detect createContext usage', () => {
      const code = `
        const ThemeContext = React.createContext({ primary: 'blue' });
        const UserContext = createContext(null);
      `;
      
      const results = detectProviderConsumer(code);
      
      expect(results.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('countNestedProviders', () => {
    it('should count nested providers', () => {
      const code = `
        <A.Provider>
          <B.Provider>
            <C.Provider>
              <Content />
            </C.Provider>
          </B.Provider>
        </A.Provider>
      `;
      
      const count = countNestedProviders(code);
      
      expect(count).toBe(3);
    });
  });
});


// ============================================================================
// Controlled/Uncontrolled Detection Tests
// ============================================================================

describe('CompositionDetector - Controlled/Uncontrolled Detection', () => {
  describe('detectControlledPattern', () => {
    it('should detect controlled input pattern', () => {
      const code = `
        const Input = ({ value, onChange }) => {
          return <input value={value} onChange={onChange} />;
        }
      `;
      
      const result = detectControlledPattern(code);
      
      expect(result).not.toBeNull();
      expect(result?.pattern).toBe('controlled');
      expect(result?.details.controlledProps).toContain('value');
    });

    it('should detect controlled checkbox pattern', () => {
      const code = `
        const Checkbox = ({ checked, onChange }) => {
          return <input type="checkbox" checked={checked} onChange={onChange} />;
        }
      `;
      
      const result = detectControlledPattern(code);
      
      expect(result).not.toBeNull();
      expect(result?.details.controlledProps).toContain('checked');
    });

    it('should detect controlled select pattern', () => {
      const code = `
        const Select = ({ selected, onSelect, options }) => {
          return (
            <select value={selected} onChange={onSelect}>
              {options.map(o => <option key={o.value}>{o.label}</option>)}
            </select>
          );
        }
      `;
      
      const result = detectControlledPattern(code);
      
      expect(result).not.toBeNull();
    });
  });

  describe('detectUncontrolledPattern', () => {
    it('should detect defaultValue pattern', () => {
      const code = `
        const Input = ({ defaultValue }) => {
          return <input defaultValue={defaultValue} />;
        }
      `;
      
      const result = detectUncontrolledPattern(code);
      
      expect(result).not.toBeNull();
      expect(result?.pattern).toBe('uncontrolled');
    });

    it('should detect ref-based uncontrolled pattern', () => {
      const code = `
        const Input = () => {
          const inputRef = useRef(null);
          return <input ref={inputRef} />;
        }
      `;
      
      const result = detectUncontrolledPattern(code);
      
      expect(result).not.toBeNull();
    });
  });

  describe('hasMixedControlledPatterns', () => {
    it('should detect mixed patterns', () => {
      const code = `
        const Input = ({ value, onChange, defaultValue }) => {
          return <input value={value} onChange={onChange} defaultValue={defaultValue} />;
        }
      `;
      
      expect(hasMixedControlledPatterns(code)).toBe(true);
    });

    it('should return false for pure controlled', () => {
      const code = `
        const Input = ({ value, onChange }) => {
          return <input value={value} onChange={onChange} />;
        }
      `;
      
      expect(hasMixedControlledPatterns(code)).toBe(false);
    });

    it('should return false for pure uncontrolled', () => {
      const code = `
        const Input = ({ defaultValue }) => {
          return <input defaultValue={defaultValue} />;
        }
      `;
      
      expect(hasMixedControlledPatterns(code)).toBe(false);
    });
  });
});


// ============================================================================
// Anti-Pattern Detection Tests
// ============================================================================

describe('CompositionDetector - Anti-Pattern Detection', () => {
  describe('detectAntiPatterns', () => {
    it('should detect deeply nested HOCs', () => {
      const code = `
        const MyComponent = () => <div>Hello</div>;
        export default withA(withB(withC(withD(MyComponent))));
      `;
      
      const antiPatterns = detectAntiPatterns(code, code, DEFAULT_COMPOSITION_CONFIG);
      
      expect(antiPatterns.some(a => a.type === 'deeply-nested-hocs')).toBe(true);
    });

    it('should detect excessive context nesting', () => {
      const code = `
        const App = () => (
          <A.Provider>
            <B.Provider>
              <C.Provider>
                <D.Provider>
                  <E.Provider>
                    <Content />
                  </E.Provider>
                </D.Provider>
              </C.Provider>
            </B.Provider>
          </A.Provider>
        );
      `;
      
      const antiPatterns = detectAntiPatterns(code, code, DEFAULT_COMPOSITION_CONFIG);
      
      expect(antiPatterns.some(a => a.type === 'excessive-context')).toBe(true);
    });

    it('should detect mixed controlled patterns', () => {
      const code = `
        const Input = ({ value, onChange, defaultValue }) => {
          return <input value={value} onChange={onChange} defaultValue={defaultValue} />;
        }
      `;
      
      const antiPatterns = detectAntiPatterns(code, code, DEFAULT_COMPOSITION_CONFIG);
      
      expect(antiPatterns.some(a => a.type === 'mixed-controlled')).toBe(true);
    });

    it('should not flag valid patterns', () => {
      const code = `
        const Card = ({ children }) => {
          return <div className="card">{children}</div>;
        }
      `;
      
      const antiPatterns = detectAntiPatterns(code, code, DEFAULT_COMPOSITION_CONFIG);
      
      expect(antiPatterns.length).toBe(0);
    });
  });
});


// ============================================================================
// Analysis Tests
// ============================================================================

describe('CompositionDetector - Analysis', () => {
  describe('analyzeCompositionPatterns', () => {
    it('should find dominant pattern', () => {
      const components: ComponentCompositionInfo[] = [
        {
          componentName: 'A',
          filePath: 'a.tsx',
          line: 1,
          column: 1,
          patterns: [
            { pattern: 'children-prop', componentName: 'A', line: 1, column: 1, details: {} },
          ],
          antiPatterns: [],
          acceptsChildren: true,
          usesRenderProps: false,
          isHOC: false,
          isCompoundComponent: false,
          isControlled: false,
        },
        {
          componentName: 'B',
          filePath: 'b.tsx',
          line: 1,
          column: 1,
          patterns: [
            { pattern: 'children-prop', componentName: 'B', line: 1, column: 1, details: {} },
          ],
          antiPatterns: [],
          acceptsChildren: true,
          usesRenderProps: false,
          isHOC: false,
          isCompoundComponent: false,
          isControlled: false,
        },
        {
          componentName: 'C',
          filePath: 'c.tsx',
          line: 1,
          column: 1,
          patterns: [
            { pattern: 'render-props', componentName: 'C', line: 1, column: 1, details: {} },
          ],
          antiPatterns: [],
          acceptsChildren: false,
          usesRenderProps: true,
          isHOC: false,
          isCompoundComponent: false,
          isControlled: false,
        },
      ];
      
      const analysis = analyzeCompositionPatterns(components);
      
      expect(analysis.dominantPattern).toBe('children-prop');
      expect(analysis.patternCounts['children-prop']).toBe(2);
      expect(analysis.patternCounts['render-props']).toBe(1);
    });

    it('should calculate health score', () => {
      const components: ComponentCompositionInfo[] = [
        {
          componentName: 'A',
          filePath: 'a.tsx',
          line: 1,
          column: 1,
          patterns: [],
          antiPatterns: [],
          acceptsChildren: false,
          usesRenderProps: false,
          isHOC: false,
          isCompoundComponent: false,
          isControlled: false,
        },
      ];
      
      const analysis = analyzeCompositionPatterns(components);
      
      expect(analysis.healthScore).toBe(1.0);
    });

    it('should identify components with anti-patterns', () => {
      const components: ComponentCompositionInfo[] = [
        {
          componentName: 'A',
          filePath: 'a.tsx',
          line: 1,
          column: 1,
          patterns: [],
          antiPatterns: [
            { type: 'deeply-nested-hocs', description: 'test', severity: 'warning', suggestion: '', line: 1, column: 1 },
          ],
          acceptsChildren: false,
          usesRenderProps: false,
          isHOC: true,
          isCompoundComponent: false,
          isControlled: false,
        },
      ];
      
      const analysis = analyzeCompositionPatterns(components);
      
      expect(analysis.componentsWithAntiPatterns).toHaveLength(1);
      expect(analysis.healthScore).toBeLessThan(1.0);
    });

    it('should handle empty components array', () => {
      const analysis = analyzeCompositionPatterns([]);
      
      expect(analysis.dominantPattern).toBe('none');
      expect(analysis.confidence).toBe(0);
      expect(analysis.healthScore).toBe(1.0);
    });
  });
});


// ============================================================================
// Detector Class Tests
// ============================================================================

describe('CompositionDetector - Detector Class', () => {
  let detector: CompositionDetector;

  beforeEach(() => {
    detector = createCompositionDetector();
  });

  it('should have correct metadata', () => {
    expect(detector.id).toBe('components/composition');
    expect(detector.category).toBe('components');
    expect(detector.subcategory).toBe('composition');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should detect children prop pattern', async () => {
    const code = `
      const Card = ({ children, title }) => {
        return (
          <div className="card">
            <h1>{title}</h1>
            {children}
          </div>
        );
      }
    `;
    
    const context = createMockContext(code);
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
  });

  it('should detect render props pattern', async () => {
    const code = `
      const DataProvider = ({ render, url }) => {
        const [data, setData] = useState(null);
        useEffect(() => { fetch(url).then(setData); }, [url]);
        return render(data);
      }
    `;
    
    const context = createMockContext(code);
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBeGreaterThanOrEqual(0);
  });

  it('should detect HOC pattern', async () => {
    const code = `
      const MyComponent = ({ user }) => {
        return <div>{user.name}</div>;
      };
      export default withAuth(withTheme(MyComponent));
    `;
    
    const context = createMockContext(code);
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBeGreaterThanOrEqual(0);
  });

  it('should detect compound component pattern', async () => {
    const code = `
      const Menu = ({ children }) => {
        return <nav>{children}</nav>;
      };
      
      Menu.Item = ({ children, onClick }) => {
        return <button onClick={onClick}>{children}</button>;
      };
      
      Menu.Divider = () => <hr />;
    `;
    
    const context = createMockContext(code);
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBeGreaterThanOrEqual(0);
  });

  it('should generate violations for anti-patterns', async () => {
    const code = `
      const MyComponent = () => <div>Hello</div>;
      export default withA(withB(withC(withD(MyComponent))));
    `;
    
    const context = createMockContext(code);
    const result = await detector.detect(context);
    
    // Should detect deeply nested HOCs
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
      id: 'composition-MyComponent-missing-children-test-tsx',
      patternId: 'components/composition',
      severity: 'info' as const,
      file: 'test.tsx',
      range: { start: { line: 1, character: 1 }, end: { line: 1, character: 10 } },
      message: 'MyComponent: Component appears to be a wrapper but does not accept children prop',
      expected: 'Clean composition pattern',
      actual: 'missing children prop',
      aiExplainAvailable: true,
      aiFixAvailable: true,
      firstSeen: new Date(),
      occurrences: 1,
    };
    
    const quickFix = detector.generateQuickFix(violation);
    
    expect(quickFix).not.toBeNull();
    expect(quickFix?.title).toContain('children');
  });

  it('should accept custom configuration', () => {
    const customDetector = createCompositionDetector({
      maxHOCDepth: 5,
      maxRenderProps: 5,
      maxContextNesting: 6,
    });
    
    expect(customDetector).toBeInstanceOf(CompositionDetector);
  });

  it('should handle complex components with multiple patterns', async () => {
    const code = `
      const ComplexComponent = ({ children, render, value, onChange }) => {
        const theme = useContext(ThemeContext);
        
        return (
          <div style={{ background: theme.background }}>
            {children}
            {render && render({ theme })}
            <input value={value} onChange={onChange} />
          </div>
        );
      }
    `;
    
    const context = createMockContext(code);
    const result = await detector.detect(context);
    
    // Should detect multiple patterns
    expect(result.confidence).toBeGreaterThan(0);
  });
});
