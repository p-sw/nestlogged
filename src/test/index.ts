import { LoggedFunction, LoggedInjectable } from "../logged";
import { ScopedLogger } from "../logger";
import {
  InjectLogger,
  LoggedParam,
  ScopeKey,
  ShouldScoped,
} from "../reflected";

type TestObject = {
  a: string;
  b: { c: string; f: number };
  d: [number, string];
  e: { p: string; g: number };
};

const testObject: TestObject = {
  a: "asdf",
  b: { c: "zxcv", f: 1 },
  d: [2, "qwer"],
  e: { p: "uiop", g: 3 },
};

@LoggedInjectable()
class LoggedClass {
  async testParameterLoggingWithoutInjection(@LoggedParam("key") key: number) {
    console.log(key);
  }

  async testMultiParameterLoggingWithoutInjection(
    @LoggedParam("key") key: number,
    @LoggedParam("key2") key2: string
  ) {
    console.log(key, key2);
  }

  async testParameterLoggingWithInjection(
    @LoggedParam("key") key: number,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(key.toString());
  }

  async testMultiParameterLoggingWithInjection(
    @LoggedParam("key") key: number,
    @LoggedParam("key2") key2: string,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(key.toString() + key2);
  }

  async testObjectParameterLogging(
    @LoggedParam("key") key: TestObject,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  async testObjectParameterDotIncludeLogging(
    @LoggedParam("key", { includePath: ["a", "b.c", "d.0", "e"] })
    key: TestObject,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  async testObjectParameterArrayIncludeLogging(
    @LoggedParam("key", { includePath: [["a"], ["b", "c"], ["d", "0"], ["e"]] })
    key: TestObject,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  async testObjectParameterDotExcludeLogging(
    @LoggedParam("key", { excludePath: ["a", "b.c", "d.0", "e"] })
    key: TestObject,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  async testObjectParameterArrayExcludeLogging(
    @LoggedParam("key", { excludePath: [["a"], ["b", "c"], ["d", "0"], ["e"]] })
    key: TestObject,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  async testScopedLogging(
    @LoggedParam("key") @ScopeKey("scopekey") key: string,
    @LoggedParam("key2") key2: number,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(key + key2.toString());
  }

  async testPathScopedLogging(
    @LoggedParam("key") @ScopeKey("scopekey", { path: "b.c" }) key: TestObject,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  async testOrScopedLogging(
    @LoggedParam("key")
    @ScopeKey("scopekey-a", { path: "a" })
    @ScopeKey("scopekey-b", { path: "b" })
    key: { a: string } | { b: string },
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  async testPriorityScopedLogging(
    @LoggedParam("key")
    @ScopeKey("scopekey-a", { path: "a", priority: 0.5 })
    @ScopeKey("scopekey-b", { path: "b" }) // default 1
    key: { a?: string; b?: string },
    // if both a and b are undefined, set scope to nothing
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  async testOptionalScopedLogging(
    @LoggedParam("key")
    @ScopeKey("scopekey")
    key?: string,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(key);
  }

  @ShouldScoped // Warn if there is no valid scopekey
  async testShouldScopedLogging(
    @LoggedParam("key")
    @ScopeKey("scopekey")
    key?: string,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(key);
  }
}

class LoggedMethodsClass {
  @LoggedFunction
  async testParameterLoggingWithoutInjection(@LoggedParam("key") key: number) {
    console.log(key);
  }

  @LoggedFunction
  async testMultiParameterLoggingWithoutInjection(
    @LoggedParam("key") key: number,
    @LoggedParam("key2") key2: string
  ) {
    console.log(key, key2);
  }

  @LoggedFunction
  async testParameterLoggingWithInjection(
    @LoggedParam("key") key: number,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(key.toString());
  }

  @LoggedFunction
  async testMultiParameterLoggingWithInjection(
    @LoggedParam("key") key: number,
    @LoggedParam("key2") key2: string,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(key.toString() + key2);
  }

  @LoggedFunction
  async testObjectParameterLogging(
    @LoggedParam("key") key: TestObject,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  @LoggedFunction
  async testObjectParameterDotIncludeLogging(
    @LoggedParam("key", { includePath: ["a", "b.c", "d.0", "e"] })
    key: TestObject,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  @LoggedFunction
  async testObjectParameterArrayIncludeLogging(
    @LoggedParam("key", { includePath: [["a"], ["b", "c"], ["d", "0"], ["e"]] })
    key: TestObject,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  @LoggedFunction
  async testObjectParameterDotExcludeLogging(
    @LoggedParam("key", { excludePath: ["a", "b.c", "d.0", "e"] })
    key: TestObject,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  @LoggedFunction
  async testObjectParameterArrayExcludeLogging(
    @LoggedParam("key", { excludePath: [["a"], ["b", "c"], ["d", "0"], ["e"]] })
    key: TestObject,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  @LoggedFunction
  async testScopedLogging(
    @LoggedParam("key") @ScopeKey("scopekey") key: string,
    @LoggedParam("key2") key2: number,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(key + key2.toString());
  }

  @LoggedFunction
  async testPathScopedLogging(
    @LoggedParam("key") @ScopeKey("scopekey", { path: "b.c" }) key: TestObject,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  @LoggedFunction
  async testOrScopedLogging(
    @LoggedParam("key")
    @ScopeKey("scopekey-a", { path: "a" })
    @ScopeKey("scopekey-b", { path: "b" })
    key: { a: string } | { b: string },
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  @LoggedFunction
  async testPriorityScopedLogging(
    @LoggedParam("key")
    @ScopeKey("scopekey-a", { path: "a", priority: 0.5 })
    @ScopeKey("scopekey-b", { path: "b" }) // default 1
    key: { a?: string; b?: string },
    // if both a and b are undefined, set scope to nothing
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  @LoggedFunction
  async testOptionalScopedLogging(
    @LoggedParam("key")
    @ScopeKey("scopekey")
    key?: string,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(key);
  }

  @LoggedFunction
  @ShouldScoped // Warn if there is no valid scopekey
  async testShouldScopedLogging(
    @LoggedParam("key")
    @ScopeKey("scopekey")
    key?: string,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(key);
  }
}

/**
 * Choose Class to Test
 */
// const tester = new LoggedClass();
const tester = new LoggedMethodsClass();

/**
 * Choose Method to Test
 */
// tester.testParameterLoggingWithoutInjection(1);
// tester.testMultiParameterLoggingWithoutInjection(1, "asdf");
// tester.testParameterLoggingWithInjection(1);
// tester.testMultiParameterLoggingWithInjection(1, "asdf");
// tester.testObjectParameterLogging(testObject);
// tester.testObjectParameterDotIncludeLogging(testObject);
// tester.testObjectParameterArrayIncludeLogging(testObject);
// tester.testObjectParameterDotExcludeLogging(testObject);
// tester.testObjectParameterArrayExcludeLogging(testObject);
// tester.testScopedLogging("asdf", 2);
// tester.testPathScopedLogging(testObject);
// tester.testOrScopedLogging({ a: "asdf" });
// tester.testOrScopedLogging({ b: "qwer" });
// tester.testPriorityScopedLogging({ a: "asdf", b: "qwer" });
// tester.testPriorityScopedLogging({ a: "asdf" });
// tester.testPriorityScopedLogging({ b: "qwer" });
// tester.testPriorityScopedLogging({});
// tester.testOptionalScopedLogging("asdf");
// tester.testOptionalScopedLogging();
// tester.testShouldScopedLogging("asdf");
tester.testShouldScopedLogging();
