import {Logger} from "@nestjs/common";
import {ScopedLogger} from "./logger";
import {LoggedParamReflectData} from "./reflected";
import {loggedParam, scopedLogger} from "./reflected";
import objectContainedLogged from "./functions";

function loggerInit(_target: any) {
    if (!Object.getOwnPropertyNames(_target).includes('logger')) {
        const newTargetLogger = new Logger(_target.constructor.name);
        newTargetLogger.log('Logger Initialized.');
        Object.defineProperty(_target, 'logger', {
            writable: false,
            enumerable: false,
            configurable: false,
            value: newTargetLogger,
        });
    }
}

export function LoggedFunction<F extends Array<any>, R>(
    _target: any,
    key: string,
    descriptor: TypedPropertyDescriptor<(...args: F) => Promise<R>>,
) {
    loggerInit(_target);

    const logger = _target.logger;

    const fn = descriptor.value;

    if (!fn) return;

    descriptor.value = async function (...args: F) {
        const scopedLoggerInjectableParam: number = Reflect.getOwnMetadata(
            scopedLogger,
            _target,
            key,
        );

        if (
            typeof scopedLoggerInjectableParam !== 'undefined' &&
            (args.length <= scopedLoggerInjectableParam ||
                !(args[scopedLoggerInjectableParam] instanceof ScopedLogger))
        ) {
            args[scopedLoggerInjectableParam] = new ScopedLogger(logger, key);
        } else if (typeof scopedLoggerInjectableParam !== 'undefined') {
            args[scopedLoggerInjectableParam] = new ScopedLogger(
                args[scopedLoggerInjectableParam],
                key,
            );
        }

        const injectedLogger=
            typeof scopedLoggerInjectableParam !== 'undefined'
                ? args[scopedLoggerInjectableParam]
                : logger;

        const loggedParams: LoggedParamReflectData[] = Reflect.getOwnMetadata(
            loggedParam,
            _target,
            key,
        )

        injectedLogger.log(
            `CALL ${key} ${
                loggedParams && loggedParams.length > 0
                    ? 'WITH ' +
                    (
                        await Promise.all(
                            loggedParams.map(
                                async ({ name, index, include, exclude }) =>
                                    name + '=' + (await objectContainedLogged(args[index], {
                                        include,
                                        exclude,
                                    })),
                            ),
                        )
                    ).join(', ')
                    : ''
            }`,
        );

        try {
            const r: R = await fn.call(this, ...args);
            injectedLogger.log(`RETURNED ${key}`);
            return r;
        } catch (e) {
            injectedLogger.error(`WHILE ${key} ERROR ${e}`);
            throw e;
        }
    };
}

export function LoggedRoute<F extends Array<any>, R>(route: string) {
    return (
        _target: any,
        key: string,
        descriptor: TypedPropertyDescriptor<(...args: F) => Promise<R>>,
    ) => {
        loggerInit(_target);

        const logger = _target.logger;

        const fullRoute = `${_target.constructor.name}/${route}`;
        const fn = descriptor.value;

        if (!fn) return;

        descriptor.value = async function (...args: F) {
            const scopedLoggerInjectableParam: number = Reflect.getOwnMetadata(
                scopedLogger,
                _target,
                key,
            );

            if (
                typeof scopedLoggerInjectableParam !== 'undefined' &&
                (args.length <= scopedLoggerInjectableParam ||
                    !(args[scopedLoggerInjectableParam] instanceof ScopedLogger))
            ) {
                args[scopedLoggerInjectableParam] = new ScopedLogger(logger, fullRoute);
            }

            const injectedLogger=
                typeof scopedLoggerInjectableParam !== 'undefined'
                    ? args[scopedLoggerInjectableParam]
                    : logger;

            const loggedParams: LoggedParamReflectData[] = Reflect.getOwnMetadata(
                loggedParam,
                _target,
                key,
            )

            injectedLogger.log(
                `HIT HTTP ${fullRoute} (${key}) ${
                    loggedParams && loggedParams.length > 0
                        ? 'WITH ' +
                        (
                            await Promise.all(
                                loggedParams.map(
                                    async ({ name, index, include, exclude }) =>
                                        name + '=' + (await objectContainedLogged(args[index], {
                                            include,
                                            exclude,
                                        })),
                                ),
                            )
                        ).join(', ')
                        : ''
                }`,
            );

            try {
                const r: R = await fn.call(this, ...args);
                injectedLogger.log(`RETURNED RESPONSE ${fullRoute} (${key})`);
                return r;
            } catch (e) {
                injectedLogger.error(`WHILE HTTP ${fullRoute} (${key}) ERROR ${e}`);
                throw e;
            }
        };
    }
}