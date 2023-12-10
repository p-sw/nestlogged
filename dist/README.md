# NestLoggedDecorators

This package provides some decorations to make NestJS logging simpler.  
It only uses Logger provided by @nestjs/common package and some dependencies required for nestjs.

## How to use

### Route Logging

```ts
import { Controller, Get } from "@nestjs/common";
import { LoggedRoute } from "nlogdec";

@Controller('whatever')
export class WhateverController {
    constructor() {}

    @Get('/you/like')
    @LoggedRoute('/you/like')  // Add this!
    public async whateverYouLikeImpl() {
        return 'Whatever You Like';
    }
}
```

```md
[Nest] 000000  - 00/00/0000, 00:00:00 AM     LOG [WhateverController] HIT HTTP WhateverController//you/like (whateverYouLikeImpl)
[Nest] 000000  - 00/00/0000, 00:00:00 AM     LOG [WhateverController] RETURNED RESPONSE WhateverController//you/like (whateverYouLikeImpl)
```

It will automatically log the call and response.

If function throws any exception, it will also catch exception, log that, and throw it again.

```ts
import { BadRequestException, Controller, Get } from "@nestjs/common";
import { LoggedRoute } from "nlogdec";

@Controller('whatever')
export class WhateverController {
    constructor() {}

    @Get('/you/like')
    @LoggedRoute()
    public async whateverYouLikeImpl() {
        throw new BadRequestException("I don't like this") // Throwing HTTP exception here
    }
}
```

```md
[Nest] 000000  - 00/00/0000, 00:00:00 AM     LOG [WhateverController] HIT HTTP WhateverController//you/like (whateverYouLikeImpl)
[Nest] 000000  - 00/00/0000, 00:00:00 AM     LOG [WhateverController] WHILE HTTP WhateverController//you/like (whateverYouLikeImpl) ERROR BadRequestException: I don't like this
```

Not only HTTP exception, it will also catch all exceptions and log it.

If you want to provide another route instead of path you provided to method decorators like Get, Post, you can give a string to LoggedRoute decorator to replace it.

```ts
import { BadRequestException, Controller, Get } from "@nestjs/common";
import { LoggedRoute } from "nlogdec";

@Controller('whatever')
export class WhateverController {
    constructor() {}

    @Get('/you/like')
    @LoggedRoute('you/like')
    public async whateverYouLikeImpl() {
        throw new BadRequestException("I don't like this") // Throwing HTTP exception here
    }
}
```

```md
[Nest] 000000  - 00/00/0000, 00:00:00 AM     LOG [WhateverController] HIT HTTP WhateverController/you/like (whateverYouLikeImpl)
[Nest] 000000  - 00/00/0000, 00:00:00 AM     LOG [WhateverController] WHILE HTTP WhateverController/you/like (whateverYouLikeImpl) ERROR BadRequestException: I don't like this
```

You feel the change?

Logged path is slightly changed from `WhateverController//you/like` to `WhateverController/you/like`.

### Function Logging

```ts
import { LoggedFunction } from "nlogdec";

@LoggedFunction // This decorator will do the magic for you
export async function doILikeThis(stuff: "apple" | "banana"): "yes" | "no" {
    return stuff === "apple" ? "yes" : "no"
}
```

LoggedFunction decorator will log function calls and returns for you.

> Note: This decorator is expected to be used with a class method. You can't use this outside of class

Like `LoggedRoute` decorator, it will automatically catch all exceptions, log it, and throw it again.

### Parameter Logging

```ts
import { LoggedParam, LoggedFunction } from "nlogdec";

@LoggedFunction
export async function doILikeThis(
    @LoggedParam("stuff") // It will add logs for parameter
    stuff: "apple" | "banana"
): "yes" | "no" {
    return stuff === "apple" ? "yes" : "no"
}

doILikeThis("apple")
```

```md
HIT HTTP WhateverController//you/like (whateverYouLikeImpl) WITH stuff="apple"
```

It will add `WITH {param}={value}, {param2}={value2}` in log.  
The name of parameter is decided by the first parameter of LoggedParam decorator.

This decorator also can be used with `LoggedRoute`.

### Class Logging

You can make all method in injectable classes to logged function.

```ts
import { LoggedInjectable } from "nlogdec";

@LoggedInjectable()
export class InjectableService {
  constructor() {}

  public async getHello(@LoggedParam('name') name: string = 'world'): Promise<string> {
    return `Hello, ${name}!`;
  }
}
```

It will make all methods to logged function, so it internally uses LoggedFunction decorator.

You can do same thing with controller.

```ts
import { Get, Query } from "@nestjs/common";
import { LoggedController } from "nlogdec";

@LoggedController('path')
export class Controller {
  constructor(private injectableService: InjectableService) {}
  
  @Get('/hello')
  public async getHello(@LoggedParam('name') @Query() query: { name: string }): Promise<string> {
    return await this.injectableService.getHello(query.name);
  }
}
```

It is exactly same using LoggedFunction and LoggedRoute, but it is much simpler because you don't have to write decorator to every method.

But still, if you don't want to log every method, you can use LoggedFunction and LoggedRoute decorator.

### Scoped Logging

You can do scoped logging with `InjectLogger` decorator.

Like tracebacks, it will add a scope and call stacks in log, so you can easily follow logs.

```ts
import {
    LoggedFunction, 
    LoggedParam, 
    InjectLogger, 
    ScopedLogger
} from "nlogdec";

@LoggedFunction
export async function doILikeThis(
    @LoggedParam("stuff") stuff: string,
    @InjectLogger logger: ScopedLogger // First of all, add this.
    // Note: If this is planned to be called outside of controller route function, 
    // this can be optional. like: (@InjectLogger logger?: ScopedLogger)
): "yes" | "no" {
    logger.log(`YAY we got ${stuff}`)
    return stuff === "apple" ? "yes" : "no"
}
```

Then, in controller:

```ts
import { BadRequestException, Controller, Get, Param } from "@nestjs/common";
import {
    LoggedRoute,
    InjectLogger, 
    LoggedParam, 
    ScopedLogger
} from "./logged";

@Controller('you')
export class WhateverController {
    constructor() {
    }

    @Get('/like/:thing')
    @LoggedRoute('/like/{thing}')
    public async like(
        @LoggedParam('thing') @Param('thing') thing: string,
        @InjectLogger logger: ScopedLogger,
        // When NestJS calls this function, decorator will automatically fills this logger parameter.
    ) {
        const likeThing = doILikeThis(thing, logger) === "yes"
        if (!likeThing) throw BadRequestException("I don't like this")
    }
}
```

The `@LoggedFunction` decorator that applied to `doILikeThis` function will intercept given logger, and make it scoped.
