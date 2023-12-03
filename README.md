# NestLoggedDecorators
This package provides some decorations to make NestJS logging simpler.  
It only uses Logger provided by @nestjs/common package and some dependencies required for nestjs.

## How to use

### Route Logging
```ts
import {Controller, Get} from "@nestjs/common";
import {LoggedRoute} from "nlogdec";

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

```
[Nest] 000000  - 00/00/0000, 00:00:00 AM     LOG [WhateverController] HIT HTTP WhateverController//you/like (whateverYouLikeImpl)
[Nest] 000000  - 00/00/0000, 00:00:00 AM     LOG [WhateverController] RETURNED RESPONSE WhateverController//you/like (whateverYouLikeImpl)
```

It will automatically log the call and response.

If function throws any exception, it will also catch exception, log that, and throw it again.

```ts
import {BadRequestException, Controller, Get} from "@nestjs/common";
import {LoggedRoute} from "nlogdec";

@Controller('whatever')
export class WhateverController {
    constructor() {}

    @Get('/you/like')
    @LoggedRoute('/you/like')
    public async whateverYouLikeImpl() {
        throw new BadRequestException("I don't like this") // Throwing HTTP exception here
    }
}
```

```
[Nest] 000000  - 00/00/0000, 00:00:00 AM     LOG [WhateverController] HIT HTTP WhateverController//you/like (whateverYouLikeImpl)
[Nest] 000000  - 00/00/0000, 00:00:00 AM     LOG [WhateverController] WHILE HTTP WhateverController//you/like (whateverYouLikeImpl) ERROR BadRequestException: I don't like this
```

Not only HTTP exception, it will also catch all exceptions and log it.

### Function Logging
```ts
import {LoggedFunction} from "nlogdec";

@LoggedFunction // This decorator will do the magic for you
export async function doILikeThis(stuff: "apple" | "banana"): "yes" | "no" {
    return stuff === "apple" ? "yes" : "no"
}
```

LoggedFunction decorator will log function calls and returns for you.

**Note: This decorator is expected to be used with a class method like Service. (we will upgrade that later, so you can use it without class)**

Like `LoggedRoute` decorator, it will automatically catch all exceptions, log it, and throw it again.

### Parameter Logging

```ts
import {LoggedParam, LoggedFunction} from "nlogdec";

@LoggedFunction
export async function doILikeThis(
    @LoggedParam("stuff") // It will add logs for parameter
    stuff: "apple" | "banana"
): "yes" | "no" {
    return stuff === "apple" ? "yes" : "no"
}

doILikeThis("apple")
```
```
HIT HTTP WhateverController//you/like (whateverYouLikeImpl) WITH stuff="apple"
```

It will add `WITH {param}={value}, {param2}={value2}` in log.  
The name of parameter is decided by the first parameter of LoggedParam decorator.

This decorator also can be used with `LoggedRoute`.

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
import {BadRequestException, Controller, Get, Param} from "@nestjs/common";
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
