import { LoggedFunction, LoggedInjectable } from "../logged";
import { ScopedLogger } from "../logger";
import {
  InjectLogger,
  Logged,
  Returns,
} from "../reflected";

type TestObject = {
  a: string;
  b: { c: string; f: number };
  d: [number, string];
  e: { p: string; g: number };
};

@LoggedInjectable()
class TestService {
  public async service(paramA: string, @InjectLogger logger: ScopedLogger) {
    logger.log(`received paramA ${paramA}`);
    return paramA
  }
}

@LoggedInjectable()
class LoggedClass {
  constructor(
    private service: TestService
  ) { }

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

  testSyncLoggerRootLogging2(@InjectLogger logger?: ScopedLogger) {
    logger.log('2')
    return 2
  }

  testSyncLoggerRootLogging(@InjectLogger logger?: ScopedLogger) {
    logger.log(this.testSyncLoggerRootLogging2(logger).toString())
  }

  testSyncLogging(@InjectLogger logger?: ScopedLogger) {
    logger.log("synced yay");
  }

  async testService(@InjectLogger logger?: ScopedLogger) {
    this.service.service('A', logger);
  }
}

class LoggedMethodsClass {
  constructor(
    private service: TestService
  ) { }

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
  testSyncLoggerRootLogging2(@InjectLogger logger?: ScopedLogger) {
    logger.log('2')
    return 2
  }

  @LoggedFunction
  testSyncLoggerRootLogging(@InjectLogger logger?: ScopedLogger) {
    logger.log(this.testSyncLoggerRootLogging2(logger).toString())
  }

  @LoggedFunction
  testSyncLogging(@InjectLogger logger?: ScopedLogger) {
    logger.log("synced yay");
  }

  @LoggedFunction
  async testService(@InjectLogger logger?: ScopedLogger) {
    this.service.service('A', logger);
  }
}



// const service = new TestService();

/**
 * Choose Class to Test
 */
// const tester = new LoggedClass(service);
// const tester = new LoggedMethodsClass(service);

/**
 * Choose Method to Test
 */
// void tester.testParameterLoggingWithoutInjection(1);
// void tester.testMultiParameterLoggingWithoutInjection(1, "asdf");
// void tester.testParameterLoggingWithInjection(1);
// void tester.testMultiParameterLoggingWithInjection(1, "asdf");
// void tester.testObjectParameterLogging(testObject);
// void tester.testObjectParameterDotIncludeLogging(testObject);
// void tester.testObjectParameterArrayIncludeLogging(testObject);
// void tester.testObjectParameterDotExcludeLogging(testObject);
// void tester.testObjectParameterArrayExcludeLogging(testObject);
// void tester.testReturnLogging("asdf");
// void tester.testMissingReturnLogging("asdf");
// void tester.testRawObjectReturnLogging("asdf");
// void tester.testRawValueReturnLogging("asdf");
// void tester.testLoggerRootLogging();
// tester.testSyncLoggerRootLogging();
// tester.testSyncLogging();
// void tester.testService();

/**
 * Then run `yarn test`
 */
