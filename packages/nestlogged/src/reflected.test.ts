import {
  InjectLogger,
  scopedLoggerKey,
  Logged,
  loggedParamKey,
  LoggedParam,
  LoggedQuery,
  LoggedBody,
  LoggedHeaders,
  IfReturns,
  ifReturnsKey,
  IfThrows,
  ifThrowsKey,
  pathsToPathTree,
  PathTree,
  Returns,
  returnsKey,
} from './reflected';
import 'reflect-metadata';

describe('pathsToPathTree', () => {
  it('should return empty object for empty array', () => {
    const result = pathsToPathTree([]);
    expect(result).toEqual({});
  });

  it('should create leaf node for single segment path', () => {
    const result = pathsToPathTree(['name']);
    const expected: PathTree = { name: null };
    expect(result).toEqual(expected);
  });

  it('should create nested structure for multi-segment path', () => {
    const result = pathsToPathTree(['user.profile.name']);
    const expected: PathTree = {
      user: {
        profile: {
          name: null,
        },
      },
    };
    expect(result).toEqual(expected);
  });

  it('should merge shared prefixes correctly', () => {
    const result = pathsToPathTree([
      'user.name',
      'user.email',
      'user.profile.avatar',
    ]);
    const expected: PathTree = {
      user: {
        name: null,
        email: null,
        profile: {
          avatar: null,
        },
      },
    };
    expect(result).toEqual(expected);
  });

  it('should handle multiple independent paths', () => {
    const result = pathsToPathTree(['name', 'email', 'address.street']);
    const expected: PathTree = {
      name: null,
      email: null,
      address: {
        street: null,
      },
    };
    expect(result).toEqual(expected);
  });

  it('should build complex nested structures correctly', () => {
    const result = pathsToPathTree([
      'user.profile.personal.name',
      'user.profile.personal.age',
      'user.profile.contact.email',
      'user.settings.theme',
      'metadata.created',
    ]);
    const expected: PathTree = {
      user: {
        profile: {
          personal: {
            name: null,
            age: null,
          },
          contact: {
            email: null,
          },
        },
        settings: {
          theme: null,
        },
      },
      metadata: {
        created: null,
      },
    };
    expect(result).toEqual(expected);
  });

  it('should merge overlapping structures correctly', () => {
    const result = pathsToPathTree(['a.b.c', 'a.b.d', 'a.e']);
    const expected: PathTree = {
      a: {
        b: {
          c: null,
          d: null,
        },
        e: null,
      },
    };
    expect(result).toEqual(expected);
  });

  it('should handle duplicate paths gracefully', () => {
    const result = pathsToPathTree(['user.name', 'user.name', 'user.email']);
    const expected: PathTree = {
      user: {
        name: null,
        email: null,
      },
    };
    expect(result).toEqual(expected);
  });

  it('should handle single character segments', () => {
    const result = pathsToPathTree(['a.b.c', 'x.y']);
    const expected: PathTree = {
      a: {
        b: {
          c: null,
        },
      },
      x: {
        y: null,
      },
    };
    expect(result).toEqual(expected);
  });

  it('should handle paths with numeric segments', () => {
    const result = pathsToPathTree(['items.0.name', 'items.1.name']);
    const expected: PathTree = {
      items: {
        '0': {
          name: null,
        },
        '1': {
          name: null,
        },
      },
    };
    expect(result).toEqual(expected);
  });
});

describe('Metadata Decorators', () => {
  describe('@InjectLogger', () => {
    it('should define metadata for logger injection', () => {
      class TestClass {
        testMethod(@InjectLogger _logger: any) {}
      }
      const metadata = Reflect.getMetadata(
        scopedLoggerKey,
        TestClass.prototype,
        'testMethod',
      );
      expect(metadata).toBe(0);
    });
  });

  describe('@Logged', () => {
    it('should define metadata with a simple name', () => {
      class TestClass {
        testMethod(@Logged('param1') _param: any) {}
      }
      const metadata = Reflect.getOwnMetadata(
        loggedParamKey,
        TestClass.prototype,
        'testMethod',
      );
      expect(metadata).toEqual([
        {
          index: 0,
          name: 'param1',
          includePathTree: undefined,
          excludePathTree: undefined,
        },
      ]);
    });

    it('should define metadata with include/exclude paths', () => {
      class TestClass {
        testMethod(
          @Logged('param1', { includePath: ['a.b'], excludePath: ['c.d'] })
          _param: any,
        ) {}
      }
      const metadata = Reflect.getOwnMetadata(
        loggedParamKey,
        TestClass.prototype,
        'testMethod',
      );
      expect(metadata).toEqual([
        {
          index: 0,
          name: 'param1',
          includePathTree: pathsToPathTree(['a.b']),
          excludePathTree: pathsToPathTree(['c.d']),
        },
      ]);
    });

    it('should define metadata with an Each object', () => {
      const eachObject = { each: 'item', each2: 'item2' };
      class TestClass {
        testMethod(@Logged(eachObject) _param: any) {}
      }
      const metadata = Reflect.getOwnMetadata(
        loggedParamKey,
        TestClass.prototype,
        'testMethod',
      );
      expect(metadata).toEqual([{ index: 0, name: eachObject }]);
    });

    it('should append metadata for multiple decorated parameters', () => {
      class TestClass {
        testMethod(@Logged('param1') _p1: any, @Logged('param2') _p2: any) {}
      }
      const metadata = Reflect.getOwnMetadata(
        loggedParamKey,
        TestClass.prototype,
        'testMethod',
      );
      expect(metadata).toEqual([
        {
          index: 1,
          name: 'param2',
          includePathTree: undefined,
          excludePathTree: undefined,
        },
        {
          index: 0,
          name: 'param1',
          includePathTree: undefined,
          excludePathTree: undefined,
        },
      ]);
    });
  });

  describe('@IfReturns', () => {
    const ifReturnsFn = (r: unknown): r is string => typeof r === 'string';
    const transformerFn = (r: string) => ({ message: r });

    it('should apply metadata to a method', () => {
      class TestClass {
        @IfReturns(ifReturnsFn, transformerFn)
        testMethod() {
          return 'hello';
        }
      }
      const metadata = Reflect.getOwnMetadata(
        ifReturnsKey,
        TestClass.prototype,
        'testMethod',
      );
      expect(metadata).toHaveLength(1);
      expect(metadata[0].ifReturns).toBe(ifReturnsFn);
      expect(metadata[0].transformer).toBe(transformerFn);
    });

    it('should apply metadata to all methods in a class', () => {
      @IfReturns(ifReturnsFn, transformerFn)
      class TestClass {
        method1() {}
        method2() {}
      }

      const metadata1 = Reflect.getOwnMetadata(
        ifReturnsKey,
        TestClass.prototype,
        'method1',
      );
      const metadata2 = Reflect.getOwnMetadata(
        ifReturnsKey,
        TestClass.prototype,
        'method2',
      );

      expect(metadata1).toHaveLength(1);
      expect(metadata1[0].ifReturns).toBe(ifReturnsFn);
      expect(metadata1[0].transformer).toBe(transformerFn);

      expect(metadata2).toHaveLength(1);
      expect(metadata2[0].ifReturns).toBe(ifReturnsFn);
      expect(metadata2[0].transformer).toBe(transformerFn);
    });

    it('should append metadata if used multiple times', () => {
      const ifReturnsFn2 = (r: unknown): r is number => typeof r === 'number';
      const transformerFn2 = (r: number) => ({ value: r });
      class TestClass {
        @IfReturns(ifReturnsFn, transformerFn)
        @IfReturns(ifReturnsFn2, transformerFn2)
        testMethod() {}
      }
      const metadata = Reflect.getOwnMetadata(
        ifReturnsKey,
        TestClass.prototype,
        'testMethod',
      );
      expect(metadata).toHaveLength(2);
      expect(metadata[0].ifReturns).toBe(ifReturnsFn2); // Decorators are applied bottom-up
      expect(metadata[1].ifReturns).toBe(ifReturnsFn);
    });

    it('should append metadata if used on both class and method', () => {
      const ifReturnsFn2 = (r: unknown): r is number => typeof r === 'number';
      const transformerFn2 = (r: number) => ({ value: r });

      @IfReturns(ifReturnsFn2, transformerFn2)
      class TestClass {
        @IfReturns(ifReturnsFn, transformerFn)
        testMethod() {}
      }

      const metadata = Reflect.getOwnMetadata(
        ifReturnsKey,
        TestClass.prototype,
        'testMethod',
      );
      expect(metadata).toHaveLength(2);
      expect(metadata[0].ifReturns).toBe(ifReturnsFn); // method decorator first
      expect(metadata[1].ifReturns).toBe(ifReturnsFn2);
    });
  });

  describe('@Returns', () => {
    it('should apply metadata to a method', () => {
      class TestClass {
        @Returns()
        testMethod() {
          return 'hello';
        }
      }
      const metadata = Reflect.getOwnMetadata(
        returnsKey,
        TestClass.prototype,
        'testMethod',
      );
      expect(metadata).toBe(true);
    });

    it('should apply metadata to all methods in a class', () => {
      @Returns()
      class TestClass {
        method1() {}
        method2() {}
      }

      const metadata1 = Reflect.getOwnMetadata(
        returnsKey,
        TestClass.prototype,
        'method1',
      );
      const metadata2 = Reflect.getOwnMetadata(
        returnsKey,
        TestClass.prototype,
        'method2',
      );

      expect(metadata1).toBe(true);
      expect(metadata2).toBe(true);
    });

    it('should be true if enableFallback is true', () => {
      @Returns(true)
      class TestClass {
        testMethod() {
          return 'hello';
        }
      }

      const metadata = Reflect.getOwnMetadata(
        returnsKey,
        TestClass.prototype,
        'testMethod',
      );
      expect(metadata).toBe(true);
    });

    it('should be false if enableFallback is false', () => {
      @Returns()
      class TestClass {
        @Returns(false)
        testMethod() {
          return 'hello';
        }
      }

      const metadata = Reflect.getOwnMetadata(
        returnsKey,
        TestClass.prototype,
        'testMethod',
      );
      expect(metadata).toBe(false);
    });
  });

  describe('@IfThrows', () => {
    class MyError extends Error {}
    const transformerFn = (e: MyError) => e.message;

    it('should apply metadata to a method', () => {
      class TestClass {
        @IfThrows(MyError, transformerFn)
        testMethod() {
          throw new MyError('test error');
        }
      }
      const metadata = Reflect.getOwnMetadata(
        ifThrowsKey,
        TestClass.prototype,
        'testMethod',
      );
      expect(metadata).toHaveLength(1);
      expect(metadata[0].error).toBe(MyError);
      expect(metadata[0].transformer).toBe(transformerFn);
    });

    it('should apply metadata to all methods in a class', () => {
      @IfThrows(MyError, transformerFn)
      class TestClass {
        method1() {}
        method2() {}
      }

      const metadata1 = Reflect.getOwnMetadata(
        ifThrowsKey,
        TestClass.prototype,
        'method1',
      );
      const metadata2 = Reflect.getOwnMetadata(
        ifThrowsKey,
        TestClass.prototype,
        'method2',
      );

      expect(metadata1).toHaveLength(1);
      expect(metadata1[0].error).toBe(MyError);
      expect(metadata1[0].transformer).toBe(transformerFn);

      expect(metadata2).toHaveLength(1);
      expect(metadata2[0].error).toBe(MyError);
      expect(metadata2[0].transformer).toBe(transformerFn);
    });

    it('should append metadata if used multiple times', () => {
      class AnotherError extends Error {}
      const transformerFn2 = (e: AnotherError) => ({ error: e.message });
      class TestClass {
        @IfThrows(MyError, transformerFn)
        @IfThrows(AnotherError, transformerFn2)
        testMethod() {}
      }
      const metadata = Reflect.getOwnMetadata(
        ifThrowsKey,
        TestClass.prototype,
        'testMethod',
      );
      expect(metadata).toHaveLength(2);
      expect(metadata[0].error).toBe(AnotherError); // Decorators are applied bottom-up
      expect(metadata[1].error).toBe(MyError);
    });

    it('should append metadata if used on both class and method', () => {
      class AnotherError extends Error {}
      const transformerFn2 = (e: AnotherError) => ({ error: e.message });

      @IfThrows(MyError, transformerFn)
      class TestClass {
        @IfThrows(AnotherError, transformerFn2)
        testMethod() {}
      }

      const metadata = Reflect.getOwnMetadata(
        ifThrowsKey,
        TestClass.prototype,
        'testMethod',
      );
      expect(metadata).toHaveLength(2);
      expect(metadata[0].error).toBe(AnotherError); // method decorator first
      expect(metadata[1].error).toBe(MyError);
    });
  });
});
