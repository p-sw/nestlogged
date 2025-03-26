import { OverrideBuildOptions } from 'nestlogged/lib/logged/utils';
import { ExecutionContext } from '@nestjs/common';
import { LoggedMetadata, nestLoggedMetadata } from 'nestlogged/lib/logged/metadata';
import { scopedLogger, returns, ReturnsReflectData } from 'nestlogged/lib/reflected';
import { overrideBuild } from '../override';

export function LoggedInterceptor<F extends Array<any>, R>(
  options?: Partial<OverrideBuildOptions>,
) {
  return (
    _target: any,
    key: string,
    descriptor: TypedPropertyDescriptor<
      (context: ExecutionContext, ...args: F) => R
    >,
  ) => {
    const fn = descriptor.value;

    if (!fn || typeof fn !== 'function') {
      console.warn(
        `LoggedInterceptor decorator applied to non-function property: ${key}`,
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

    const scopedLoggerInjectableParam: number = Reflect.getOwnMetadata(
      scopedLogger,
      _target,
      key,
    );

    const returnsData: ReturnsReflectData[] | true = Reflect.getOwnMetadata(
      returns,
      fn,
    );

    const overrideFunction = overrideBuild(
      'interceptor',
      fn,
      _target,
      {
        scopedLoggerInjectableParam,
        loggedParams: [],
      },
      _target.constructor.name,
      returnsData,
      newMetadata,
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
