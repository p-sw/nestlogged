import { RequestMethod } from '@nestjs/common';
import { OverrideBuildOptions, loggerInit, RevRequestMethod } from 'nestlogged/lib/logged/utils';
import { LoggedMetadata, nestLoggedMetadata } from 'nestlogged/lib/logged/metadata';
import {
  loggedParam,
  scopedLogger,
  returns,
  ReturnsReflectData,
  LoggedParamReflectData,
} from 'nestlogged/lib/reflected';
import { overrideBuild } from '../override';
import { createRouteParamDecorator } from 'nestlogged/lib/internals/nest';

export function LoggedRoute<F extends Array<any>, R>(
  route?: string,
  options?: Partial<OverrideBuildOptions>,
) {
  return (
    _target: any,
    key: string,
    descriptor: TypedPropertyDescriptor<(...args: F) => R>,
  ) => {
    loggerInit(_target);

    const logger = _target.logger;

    const fn = descriptor.value;

    if (!fn || typeof fn !== 'function') {
      logger.warn(
        `LoggedRoute decorator applied to non-function property: ${key}`,
      );
      return;
    }

    const logMetadata: LoggedMetadata | undefined = Reflect.getOwnMetadata(
      nestLoggedMetadata,
      _target,
      key,
    );
    if (logMetadata) {
      // already applied, override instead
      logMetadata.updateOption(options);
      return;
    }
    const newMetadata = new LoggedMetadata(options);

    const all = Reflect.getMetadataKeys(fn).map((k) => [
      k,
      Reflect.getMetadata(k, fn),
    ]);

    const httpPath: string = Reflect.getMetadata('path', fn);
    const httpMethod: RequestMethod = Reflect.getMetadata('method', fn);

    const fullRoute = `${_target.constructor.name}::${route ?? httpPath}[${
      RevRequestMethod[httpMethod]
    }]`;

    const scopedLoggerInjectableParam: number = Reflect.getOwnMetadata(
      scopedLogger,
      _target,
      key,
    );
    // if @InjectLogger exists, fake nestjs as it is @Req()
    if (scopedLoggerInjectableParam !== undefined) {
      createRouteParamDecorator(0)()(_target, key, scopedLoggerInjectableParam);
    }

    const loggedParams: LoggedParamReflectData[] = Reflect.getOwnMetadata(
      loggedParam,
      _target,
      key,
    );

    const returnsData: ReturnsReflectData[] | true = Reflect.getOwnMetadata(
      returns,
      fn,
    );

    const overrideFunction = overrideBuild(
      'route',
      fn,
      logger,
      {
        scopedLoggerInjectableParam,
        loggedParams,
      },
      key,
      returnsData,
      newMetadata,
      fullRoute,
    );

    _target[key] = overrideFunction;
    descriptor.value = overrideFunction;

    Reflect.defineMetadata(nestLoggedMetadata, newMetadata, _target, key);
    all.forEach(([k, v]) => {
      Reflect.defineMetadata(k, v, _target[key]);
      Reflect.defineMetadata(k, v, descriptor.value);
    });
  };
}
