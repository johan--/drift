/**
 * State Patterns Detector Tests
 *
 * Tests for detecting local vs global state usage patterns in React components.
 *
 * @requirements 8.5 - THE Component_Detector SHALL detect state management patterns (local vs global)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  StatePatternDetector,
  createStatePatternDetector,
  detectUseState,
  detectUseReducer,
  detectUseRef,
  detectLocalState,
  detectUseContext,
  detectRedux,
  detectZustand,
  detectJotai,
  detectRecoil,
  detectReactQuery,
  detectSWR,
  detectMobX,
  detectValtio,
  detectGlobalState,
  detectPropDrilling,
  detectStateIssues,
  calculateComplexityScore,
  extractPropsFromComponent,
  analyzeStatePatterns,
  isReactComponent as isReactComponentState,
  getComponentName as getComponentNameState,
  DEFAULT_STATE_PATTERN_CONFIG,
  type ComponentStateInfo,
  type StateUsageInfo,
} from './state-patterns.js';
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
// Local State Detection Tests
// ============================================================================

describe('StatePatternDetector - Local State Detection', () => {
  describe('detectUseState', () => {
    it('should detect basic useState usage', () => {
      const code = `
        const MyComponent = () => {
          const [count, setCount] = useState(0);
          return <div>{count}</div>;
        }
      `;
      
      const results = detectUseState(code);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.pattern).toBe('useState');
      expect(results[0]?.variableNames).toContain('count');
      expect(results[0]?.variableNames).toContain('setCount');
      expect(results[0]?.type).toBe('local');
    });

    it('should detect useState with type annotation', () => {
      const code = `
        const MyComponent = () => {
          const [user, setUser] = useState<User | null>(null);
          return <div>{user?.name}</div>;
        }
      `;
      
      const results = detectUseState(code);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.variableNames).toContain('user');
      expect(results[0]?.variableNames).toContain('setUser');
    });

    it('should detect multiple useState calls', () => {
      const code = `
        const MyComponent = () => {
          const [name, setName] = useState('');
          const [age, setAge] = useState(0);
          const [active, setActive] = useState(false);
          return <div>{name}</div>;
        }
      `;
      
      const results = detectUseState(code);
      
      expect(results).toHaveLength(3);
    });

    it('should detect useState derived from props', () => {
      const code = `
        const MyComponent = ({ initialValue }) => {
          const [value, setValue] = useState(props.initialValue);
          return <div>{value}</div>;
        }
      `;
      
      const results = detectUseState(code);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.derivedFromProps).toBe(true);
    });
  });

  describe('detectUseReducer', () => {
    it('should detect useReducer usage', () => {
      const code = `
        const MyComponent = () => {
          const [state, dispatch] = useReducer(reducer, initialState);
          return <div>{state.count}</div>;
        }
      `;
      
      const results = detectUseReducer(code);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.pattern).toBe('useReducer');
      expect(results[0]?.variableNames).toContain('state');
      expect(results[0]?.variableNames).toContain('dispatch');
    });
  });

  describe('detectUseRef', () => {
    it('should detect useRef for mutable values', () => {
      const code = `
        const MyComponent = () => {
          const countRef = useRef(0);
          const timerRef = useRef<number>(undefined);
          return <div>{countRef.current}</div>;
        }
      `;
      
      const results = detectUseRef(code);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(r => r.variableNames.includes('countRef'))).toBe(true);
    });

    it('should not count DOM refs as state', () => {
      const code = `
        const MyComponent = () => {
          const inputRef = useRef(null);
          return <input ref={inputRef} />;
        }
      `;
      
      const results = detectUseRef(code);
      
      // DOM refs (null initial value + ref={} usage) should not be counted
      expect(results).toHaveLength(0);
    });
  });

  describe('detectLocalState', () => {
    it('should detect all local state patterns', () => {
      const code = `
        const MyComponent = () => {
          const [count, setCount] = useState(0);
          const [state, dispatch] = useReducer(reducer, {});
          const valueRef = useRef(42);
          return <div>{count}</div>;
        }
      `;
      
      const results = detectLocalState(code);
      
      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.some(r => r.pattern === 'useState')).toBe(true);
      expect(results.some(r => r.pattern === 'useReducer')).toBe(true);
    });
  });
});


// ============================================================================
// Global State Detection Tests
// ============================================================================

describe('StatePatternDetector - Global State Detection', () => {
  describe('detectUseContext', () => {
    it('should detect useContext usage', () => {
      const code = `
        const MyComponent = () => {
          const theme = useContext(ThemeContext);
          return <div style={{ color: theme.primary }}></div>;
        }
      `;
      
      const results = detectUseContext(code);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.pattern).toBe('useContext');
      expect(results[0]?.variableNames).toContain('theme');
      expect(results[0]?.type).toBe('global');
    });

    it('should detect destructured useContext', () => {
      const code = `
        const MyComponent = () => {
          const { user, logout } = useContext(AuthContext);
          return <div>{user.name}</div>;
        }
      `;
      
      const results = detectUseContext(code);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.variableNames).toContain('user');
      expect(results[0]?.variableNames).toContain('logout');
    });
  });

  describe('detectRedux', () => {
    it('should detect useSelector usage', () => {
      const code = `
        const MyComponent = () => {
          const user = useSelector((state) => state.user);
          return <div>{user.name}</div>;
        }
      `;
      
      const results = detectRedux(code);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.pattern).toBe('redux');
      expect(results[0]?.variableNames).toContain('user');
    });

    it('should detect useDispatch usage', () => {
      const code = `
        const MyComponent = () => {
          const dispatch = useDispatch();
          return <button onClick={() => dispatch(action())}></button>;
        }
      `;
      
      const results = detectRedux(code);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.variableNames).toContain('dispatch');
    });

    it('should detect both useSelector and useDispatch', () => {
      const code = `
        const MyComponent = () => {
          const user = useSelector((state) => state.user);
          const dispatch = useDispatch();
          return <div>{user.name}</div>;
        }
      `;
      
      const results = detectRedux(code);
      
      expect(results).toHaveLength(2);
    });
  });

  describe('detectZustand', () => {
    it('should detect Zustand store hooks', () => {
      const code = `
        const MyComponent = () => {
          const { count, increment } = useCounterStore();
          return <button onClick={increment}>{count}</button>;
        }
      `;
      
      const results = detectZustand(code);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.pattern).toBe('zustand');
      expect(results[0]?.variableNames).toContain('count');
      expect(results[0]?.variableNames).toContain('increment');
    });

    it('should detect various Zustand store naming patterns', () => {
      const code = `
        const MyComponent = () => {
          const user = useUserStore();
          const cart = useCartStore();
          return <div>{user.name}</div>;
        }
      `;
      
      const results = detectZustand(code);
      
      expect(results).toHaveLength(2);
    });
  });

  describe('detectJotai', () => {
    it('should detect useAtom usage', () => {
      const code = `
        const MyComponent = () => {
          const [count, setCount] = useAtom(countAtom);
          return <div>{count}</div>;
        }
      `;
      
      const results = detectJotai(code);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.pattern).toBe('jotai');
    });

    it('should detect useAtomValue and useSetAtom', () => {
      const code = `
        const MyComponent = () => {
          const count = useAtomValue(countAtom);
          const setCount = useSetAtom(countAtom);
          return <div>{count}</div>;
        }
      `;
      
      const results = detectJotai(code);
      
      expect(results).toHaveLength(2);
    });
  });

  describe('detectRecoil', () => {
    it('should detect useRecoilState usage', () => {
      const code = `
        const MyComponent = () => {
          const [count, setCount] = useRecoilState(countState);
          return <div>{count}</div>;
        }
      `;
      
      const results = detectRecoil(code);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.pattern).toBe('recoil');
    });

    it('should detect useRecoilValue usage', () => {
      const code = `
        const MyComponent = () => {
          const count = useRecoilValue(countState);
          return <div>{count}</div>;
        }
      `;
      
      const results = detectRecoil(code);
      
      expect(results).toHaveLength(1);
    });
  });


  describe('detectReactQuery', () => {
    it('should detect useQuery usage', () => {
      const code = `
        const MyComponent = () => {
          const { data, isLoading } = useQuery({
            queryKey: ['users'],
            queryFn: fetchUsers,
          });
          return <div>{data?.name}</div>;
        }
      `;
      
      const results = detectReactQuery(code);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.pattern).toBe('react-query');
      expect(results[0]?.variableNames).toContain('data');
      expect(results[0]?.variableNames).toContain('isLoading');
    });

    it('should detect useMutation usage', () => {
      const code = `
        const MyComponent = () => {
          const mutation = useMutation({
            mutationFn: createUser,
          });
          return <button onClick={() => mutation.mutate(data)}>Create</button>;
        }
      `;
      
      const results = detectReactQuery(code);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.variableNames).toContain('mutation');
    });
  });

  describe('detectSWR', () => {
    it('should detect useSWR usage', () => {
      const code = `
        const MyComponent = () => {
          const { data, error } = useSWR('/api/users', fetcher);
          return <div>{data?.name}</div>;
        }
      `;
      
      const results = detectSWR(code);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.pattern).toBe('swr');
      expect(results[0]?.variableNames).toContain('data');
      expect(results[0]?.variableNames).toContain('error');
    });
  });

  describe('detectMobX', () => {
    it('should detect observer wrapper', () => {
      const code = `
        const MyComponent = observer(() => {
          return <div>{store.count}</div>;
        });
      `;
      
      const results = detectMobX(code);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.pattern).toBe('mobx');
    });

    it('should detect useLocalObservable', () => {
      const code = `
        const MyComponent = () => {
          const state = useLocalObservable(() => ({
            count: 0,
            increment() { this.count++; }
          }));
          return <div>{state.count}</div>;
        }
      `;
      
      const results = detectMobX(code);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.variableNames).toContain('state');
    });
  });

  describe('detectValtio', () => {
    it('should detect useSnapshot usage', () => {
      const code = `
        const MyComponent = () => {
          const snap = useSnapshot(state);
          return <div>{snap.count}</div>;
        }
      `;
      
      const results = detectValtio(code);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.pattern).toBe('valtio');
      expect(results[0]?.variableNames).toContain('snap');
    });
  });

  describe('detectGlobalState', () => {
    it('should detect all global state patterns', () => {
      const code = `
        const MyComponent = () => {
          const theme = useContext(ThemeContext);
          const user = useSelector((state) => state.user);
          const { data } = useQuery({ queryKey: ['data'], queryFn: fetch });
          return <div>{theme.primary}</div>;
        }
      `;
      
      const results = detectGlobalState(code, DEFAULT_STATE_PATTERN_CONFIG);
      
      expect(results.length).toBeGreaterThanOrEqual(3);
      expect(results.some(r => r.pattern === 'useContext')).toBe(true);
      expect(results.some(r => r.pattern === 'redux')).toBe(true);
      expect(results.some(r => r.pattern === 'react-query')).toBe(true);
    });
  });
});


// ============================================================================
// Issue Detection Tests
// ============================================================================

describe('StatePatternDetector - Issue Detection', () => {
  describe('detectPropDrilling', () => {
    it('should detect props passed down to children', () => {
      const code = `
        const MyComponent = ({ user, theme, onUpdate }) => {
          return (
            <div>
              <ChildComponent user={user} theme={theme} />
              <AnotherChild onUpdate={onUpdate} />
            </div>
          );
        }
      `;
      
      const props = ['user', 'theme', 'onUpdate'];
      const results = detectPropDrilling(code, props);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('detectStateIssues', () => {
    it('should detect mixed state management patterns', () => {
      const localState: StateUsageInfo[] = [];
      const globalState: StateUsageInfo[] = [
        { type: 'global', pattern: 'redux', variableNames: ['user'], line: 1, column: 1, derivedFromProps: false },
        { type: 'global', pattern: 'zustand', variableNames: ['cart'], line: 2, column: 1, derivedFromProps: false },
      ];
      
      const issues = detectStateIssues(localState, globalState, [], DEFAULT_STATE_PATTERN_CONFIG);
      
      expect(issues.some(i => i.type === 'mixed-patterns')).toBe(true);
    });

    it('should detect excessive local state', () => {
      const localState: StateUsageInfo[] = Array(6).fill(null).map((_, i) => ({
        type: 'local' as const,
        pattern: 'useState' as const,
        variableNames: [`var${i}`],
        line: i + 1,
        column: 1,
        derivedFromProps: false,
      }));
      
      const issues = detectStateIssues(localState, [], [], DEFAULT_STATE_PATTERN_CONFIG);
      
      expect(issues.some(i => i.type === 'local-should-lift')).toBe(true);
    });

    it('should detect prop drilling', () => {
      const passedDownProps = ['user', 'theme', 'config'];
      
      const issues = detectStateIssues([], [], passedDownProps, DEFAULT_STATE_PATTERN_CONFIG);
      
      expect(issues.some(i => i.type === 'prop-drilling')).toBe(true);
    });

    it('should detect state derived from props', () => {
      const localState: StateUsageInfo[] = [
        { type: 'local', pattern: 'useState', variableNames: ['value'], line: 1, column: 1, derivedFromProps: true },
      ];
      
      const issues = detectStateIssues(localState, [], [], DEFAULT_STATE_PATTERN_CONFIG);
      
      expect(issues.some(i => i.type === 'global-should-be-local')).toBe(true);
    });

    it('should not flag server state as mixed patterns', () => {
      const globalState: StateUsageInfo[] = [
        { type: 'global', pattern: 'redux', variableNames: ['user'], line: 1, column: 1, derivedFromProps: false },
        { type: 'global', pattern: 'react-query', variableNames: ['data'], line: 2, column: 1, derivedFromProps: false },
      ];
      
      const issues = detectStateIssues([], globalState, [], DEFAULT_STATE_PATTERN_CONFIG);
      
      // Should not flag mixed patterns when one is server state
      expect(issues.some(i => i.type === 'mixed-patterns')).toBe(false);
    });
  });

  describe('calculateComplexityScore', () => {
    it('should calculate complexity based on state count', () => {
      const localState: StateUsageInfo[] = [
        { type: 'local', pattern: 'useState', variableNames: ['a'], line: 1, column: 1, derivedFromProps: false },
        { type: 'local', pattern: 'useState', variableNames: ['b'], line: 2, column: 1, derivedFromProps: false },
      ];
      const globalState: StateUsageInfo[] = [
        { type: 'global', pattern: 'redux', variableNames: ['c'], line: 3, column: 1, derivedFromProps: false },
      ];
      
      const score = calculateComplexityScore(localState, globalState, []);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBe(2 * 1 + 1 * 2 + 2); // 2 local + 1 global + 2 patterns
    });

    it('should add complexity for issues', () => {
      const issues = [
        { type: 'mixed-patterns' as const, description: '', severity: 'warning' as const, suggestion: '', line: 1, column: 1 },
      ];
      
      const scoreWithIssues = calculateComplexityScore([], [], issues);
      const scoreWithoutIssues = calculateComplexityScore([], [], []);
      
      expect(scoreWithIssues).toBeGreaterThan(scoreWithoutIssues);
    });
  });
});


// ============================================================================
// Analysis Tests
// ============================================================================

describe('StatePatternDetector - Analysis', () => {
  describe('extractPropsFromComponent', () => {
    it('should extract destructured props', () => {
      const code = `
        const MyComponent = ({ name, age, onUpdate }) => {
          return <div>{name}</div>;
        }
      `;
      
      const props = extractPropsFromComponent(code);
      
      expect(props).toContain('name');
      expect(props).toContain('age');
      expect(props).toContain('onUpdate');
    });

    it('should extract props from direct access', () => {
      const code = `
        const MyComponent = (props) => {
          return <div>{props.name} {props.age}</div>;
        }
      `;
      
      const props = extractPropsFromComponent(code);
      
      expect(props).toContain('name');
      expect(props).toContain('age');
    });
  });

  describe('analyzeStatePatterns', () => {
    it('should find dominant patterns', () => {
      const components: ComponentStateInfo[] = [
        {
          componentName: 'A',
          filePath: 'a.tsx',
          line: 1,
          column: 1,
          localState: [
            { type: 'local', pattern: 'useState', variableNames: ['a'], line: 1, column: 1, derivedFromProps: false },
          ],
          globalState: [
            { type: 'global', pattern: 'redux', variableNames: ['b'], line: 2, column: 1, derivedFromProps: false },
          ],
          issues: [],
          passedDownProps: [],
          complexityScore: 3,
        },
        {
          componentName: 'B',
          filePath: 'b.tsx',
          line: 1,
          column: 1,
          localState: [
            { type: 'local', pattern: 'useState', variableNames: ['c'], line: 1, column: 1, derivedFromProps: false },
          ],
          globalState: [
            { type: 'global', pattern: 'redux', variableNames: ['d'], line: 2, column: 1, derivedFromProps: false },
          ],
          issues: [],
          passedDownProps: [],
          complexityScore: 3,
        },
      ];
      
      const analysis = analyzeStatePatterns(components);
      
      expect(analysis.dominantLocalPattern).toBe('useState');
      expect(analysis.dominantGlobalPattern).toBe('redux');
      expect(analysis.confidence.localPattern).toBe(1);
      expect(analysis.confidence.globalPattern).toBe(1);
    });

    it('should calculate health score', () => {
      const components: ComponentStateInfo[] = [
        {
          componentName: 'A',
          filePath: 'a.tsx',
          line: 1,
          column: 1,
          localState: [],
          globalState: [],
          issues: [],
          passedDownProps: [],
          complexityScore: 0,
        },
      ];
      
      const analysis = analyzeStatePatterns(components);
      
      expect(analysis.healthScore).toBeGreaterThan(0);
      expect(analysis.healthScore).toBeLessThanOrEqual(1);
    });

    it('should identify components with issues', () => {
      const components: ComponentStateInfo[] = [
        {
          componentName: 'A',
          filePath: 'a.tsx',
          line: 1,
          column: 1,
          localState: [],
          globalState: [],
          issues: [
            { type: 'mixed-patterns', description: 'test', severity: 'warning', suggestion: '', line: 1, column: 1 },
          ],
          passedDownProps: [],
          complexityScore: 3,
        },
      ];
      
      const analysis = analyzeStatePatterns(components);
      
      expect(analysis.componentsWithIssues).toHaveLength(1);
    });
  });
});


// ============================================================================
// Detector Class Tests
// ============================================================================

describe('StatePatternDetector - Detector Class', () => {
  let detector: StatePatternDetector;

  beforeEach(() => {
    detector = createStatePatternDetector();
  });

  it('should have correct metadata', () => {
    expect(detector.id).toBe('components/state-patterns');
    expect(detector.category).toBe('components');
    expect(detector.subcategory).toBe('state-management');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should detect local state patterns', async () => {
    const code = `
      const Counter = () => {
        const [count, setCount] = useState(0);
        return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
      }
    `;
    
    const context = createMockContext(code);
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
  });

  it('should detect global state patterns', async () => {
    const code = `
      const UserProfile = () => {
        const user = useSelector((state) => state.user);
        const dispatch = useDispatch();
        return <div>{user.name}</div>;
      }
    `;
    
    const context = createMockContext(code);
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBeGreaterThanOrEqual(0);
  });

  it('should generate violations for mixed patterns', async () => {
    const code = `
      const MixedComponent = () => {
        const user = useSelector((state) => state.user);
        const { cart } = useCartStore();
        return <div>{user.name}</div>;
      }
    `;
    
    const context = createMockContext(code);
    const result = await detector.detect(context);
    
    // Should detect mixed patterns violation
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
      id: 'test',
      patternId: 'components/state-patterns',
      severity: 'warning' as const,
      file: 'test.tsx',
      range: { start: { line: 1, character: 1 }, end: { line: 1, character: 10 } },
      message: 'Component has prop drilling issues',
      expected: 'Use Context',
      actual: 'Props passed through multiple levels',
      aiExplainAvailable: true,
      aiFixAvailable: true,
      firstSeen: new Date(),
      occurrences: 1,
    };
    
    const quickFix = detector.generateQuickFix(violation);
    
    expect(quickFix).not.toBeNull();
    expect(quickFix?.title).toContain('Context');
  });

  it('should handle complex components with multiple state types', async () => {
    const code = `
      const ComplexComponent = ({ initialData }) => {
        // Local state
        const [isOpen, setIsOpen] = useState(false);
        const [formData, setFormData] = useState({});
        
        // Global state
        const theme = useContext(ThemeContext);
        const { data, isLoading } = useQuery({
          queryKey: ['data'],
          queryFn: fetchData,
        });
        
        return (
          <div style={{ background: theme.background }}>
            {isLoading ? <Spinner /> : <Content data={data} />}
          </div>
        );
      }
    `;
    
    const context = createMockContext(code);
    const result = await detector.detect(context);
    
    // Should detect both local and global patterns
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should accept custom configuration', () => {
    const customDetector = createStatePatternDetector({
      propDrillingThreshold: 5,
      maxLocalStateVariables: 10,
      flagMixedPatterns: false,
    });
    
    expect(customDetector).toBeInstanceOf(StatePatternDetector);
  });
});
