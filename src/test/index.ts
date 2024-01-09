import { LoggedFunction, LoggedInjectable } from "../logged";
import { ScopedLogger } from "../logger";
import {
  InjectLogger,
  Logged,
  Returns,
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
  async testParameterLoggingWithoutInjection(@Logged("key") key: number) {
    console.log(key);
  }

  async testMultiParameterLoggingWithoutInjection(
    @Logged("key") key: number,
    @Logged("key2") key2: string
  ) {
    console.log(key, key2);
  }

  async testParameterLoggingWithInjection(
    @Logged("key") key: number,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(key.toString());
  }

  async testMultiParameterLoggingWithInjection(
    @Logged("key") key: number,
    @Logged("key2") key2: string,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(key.toString() + key2);
  }

  async testObjectParameterLogging(
    @Logged("key") key: TestObject,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  async testObjectParameterDotIncludeLogging(
    @Logged("key", { includePath: ["a", "b.c", "d.0", "e"] })
    key: TestObject,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  async testObjectParameterArrayIncludeLogging(
    @Logged("key", { includePath: [["a"], ["b", "c"], ["d", "0"], ["e"]] })
    key: TestObject,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  async testObjectParameterDotExcludeLogging(
    @Logged("key", { excludePath: ["a", "b.c", "d.0", "e"] })
    key: TestObject,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  async testObjectParameterArrayExcludeLogging(
    @Logged("key", { excludePath: [["a"], ["b", "c"], ["d", "0"], ["e"]] })
    key: TestObject,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  async testScopedLogging(
    @Logged("key") @ScopeKey("scopekey") key: string,
    @Logged("key2") key2: number,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(key + key2.toString());
  }

  async testPathScopedLogging(
    @Logged("key") @ScopeKey("scopekey", { path: "b.c" }) key: TestObject,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  async testOrScopedLogging(
    @Logged("key")
    @ScopeKey("scopekey-a", { path: "a" })
    @ScopeKey("scopekey-b", { path: "b" })
    key: { a: string } | { b: string },
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  async testPriorityScopedLogging(
    @Logged("key")
    @ScopeKey("scopekey-a", { path: "a", priority: 0.5 })
    @ScopeKey("scopekey-b", { path: "b" }) // default 1
    key: { a?: string; b?: string },
    // if both a and b are undefined, set scope to nothing
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  async testOptionalScopedLogging(
    @Logged("key")
    @ScopeKey("scopekey")
    key?: string,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(key);
  }

  @ShouldScoped // Warn if there is no valid scopekey
  async testShouldScopedLogging(
    @Logged("key")
    @ScopeKey("scopekey")
    key?: string,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(key);
  }

  @Returns({ result: "http.result", userId: "body.user.id" })
  async testReturnLogging(
    @Logged("userId")
    userId: string,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(userId);
    return {
      http: {
        result: "success",
        code: 200,
      },
      body: {
        user: {
          id: userId,
          name: "tester",
        },
        secret: "supersecret",
      },
    };
  }

  @Returns({ result: "http.result", userId: "body.user.id" })
  async testMissingReturnLogging(
    @Logged("userId")
    userId: string,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(userId);
    return {
      body: {
        user: {
          id: userId,
          name: "tester",
        },
        secret: "supersecret",
      },
    };
  }

  @Returns()
  async testRawObjectReturnLogging(
    @Logged("userId")
    userId: string,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(userId);
    return {
      body: {
        user: {
          id: userId,
          name: "tester",
        },
        secret: "supersecret",
      },
    };
  }

  @Returns()
  async testRawValueReturnLogging(
    @Logged("userId")
    userId: string,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(userId);
    return true;
  }

  async testLoggerRootLogging2(@InjectLogger logger?: ScopedLogger) {
    logger.log("2");
  }

  async testLoggerRootLogging(@InjectLogger logger?: ScopedLogger) {
    await this.testLoggerRootLogging2(logger);
  }

  testSyncLogging(@InjectLogger logger?: ScopedLogger) {
    logger.log("synced yay");
  }
}

class LoggedMethodsClass {
  @LoggedFunction
  async testParameterLoggingWithoutInjection(@Logged("key") key: number) {
    console.log(key);
  }

  @LoggedFunction
  async testMultiParameterLoggingWithoutInjection(
    @Logged("key") key: number,
    @Logged("key2") key2: string
  ) {
    console.log(key, key2);
  }

  @LoggedFunction
  async testParameterLoggingWithInjection(
    @Logged("key") key: number,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(key.toString());
  }

  @LoggedFunction
  async testMultiParameterLoggingWithInjection(
    @Logged("key") key: number,
    @Logged("key2") key2: string,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(key.toString() + key2);
  }

  @LoggedFunction
  async testObjectParameterLogging(
    @Logged("key") key: TestObject,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  @LoggedFunction
  async testObjectParameterDotIncludeLogging(
    @Logged("key", { includePath: ["a", "b.c", "d.0", "e"] })
    key: TestObject,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  @LoggedFunction
  async testObjectParameterArrayIncludeLogging(
    @Logged("key", { includePath: [["a"], ["b", "c"], ["d", "0"], ["e"]] })
    key: TestObject,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  @LoggedFunction
  async testObjectParameterDotExcludeLogging(
    @Logged("key", { excludePath: ["a", "b.c", "d.0", "e"] })
    key: TestObject,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  @LoggedFunction
  async testObjectParameterArrayExcludeLogging(
    @Logged("key", { excludePath: [["a"], ["b", "c"], ["d", "0"], ["e"]] })
    key: TestObject,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  @LoggedFunction
  async testScopedLogging(
    @Logged("key") @ScopeKey("scopekey") key: string,
    @Logged("key2") key2: number,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(key + key2.toString());
  }

  @LoggedFunction
  async testPathScopedLogging(
    @Logged("key") @ScopeKey("scopekey", { path: "b.c" }) key: TestObject,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  @LoggedFunction
  async testOrScopedLogging(
    @Logged("key")
    @ScopeKey("scopekey-a", { path: "a" })
    @ScopeKey("scopekey-b", { path: "b" })
    key: { a: string } | { b: string },
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(JSON.stringify(key));
  }

  @LoggedFunction
  async testPriorityScopedLogging(
    @Logged("key")
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
    @Logged("key")
    @ScopeKey("scopekey")
    key?: string,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(key);
  }

  @LoggedFunction
  @ShouldScoped // Warn if there is no valid scopekey
  async testShouldScopedLogging(
    @Logged("key")
    @ScopeKey("scopekey")
    key?: string,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(key);
  }

  @LoggedFunction
  @Returns({ result: "http.result", userId: "body.user.id" })
  async testReturnLogging(
    @Logged("userId")
    userId: string,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(userId);
    return {
      http: {
        result: "success",
        code: 200,
      },
      body: {
        user: {
          id: userId,
          name: "tester",
        },
        secret: "supersecret",
      },
    };
  }

  @LoggedFunction
  @Returns({ result: "http.result", userId: "body.user.id" })
  async testMissingReturnLogging(
    @Logged("userId")
    userId: string,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(userId);
    return {
      body: {
        user: {
          id: userId,
          name: "tester",
        },
        secret: "supersecret",
      },
    };
  }

  @LoggedFunction
  @Returns()
  async testRawObjectReturnLogging(
    @Logged("userId")
    userId: string,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(userId);
    return {
      body: {
        user: {
          id: userId,
          name: "tester",
        },
        secret: "supersecret",
      },
    };
  }

  @LoggedFunction
  @Returns()
  async testRawValueReturnLogging(
    @Logged("userId")
    userId: string,
    @InjectLogger logger?: ScopedLogger
  ) {
    logger.log(userId);
    return true;
  }

  @LoggedFunction
  async testLoggerRootLogging2(@InjectLogger logger?: ScopedLogger) {
    logger.log("2");
  }

  @LoggedFunction
  async testLoggerRootLogging(@InjectLogger logger?: ScopedLogger) {
    await this.testLoggerRootLogging2(logger);
  }

  @LoggedFunction
  testSyncLogging(@InjectLogger logger?: ScopedLogger) {
    logger.log("synced yay");
  }
}

/**
 * Choose Class to Test
 */
// const tester = new LoggedClass();
// const tester = new LoggedMethodsClass();

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
// tester.testShouldScopedLogging("asdf")
// tester.testShouldScopedLogging();
// tester.testReturnLogging("asdf");
// tester.testMissingReturnLogging("asdf");
// tester.testRawObjectReturnLogging("asdf");
// tester.testRawValueReturnLogging("asdf");
// tester.testLoggerRootLogging();
// tester.testSyncLogging();

/**
 * Then run `yarn test`
 */
