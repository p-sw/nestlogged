import { OverrideBuildOptions } from '../utils';
import { LoggedMetadata, nestLoggedMetadata } from '../metadata';
import {
  loggedParam,
  scopedLogger,
  returns,
  ReturnsReflectData,
  LoggedParamReflectData,
} from '../../reflected';
import { overrideBuild } from '../override';

/**
 * @internal
 */
export function LoggedFunction(oB: typeof overrideBuild = overrideBuild) {
  return function LoggedFunction<F extends Array<any>, R>(
    options?: Partial<OverrideBuildOptions>,
  ) {
    return (
      _target: any,
      key: string,
      descriptor: TypedPropertyDescriptor<(...args: F) => R | Promise<R>>,
    ) => {
      const fn = descriptor.value;

      if (!fn || typeof fn !== 'function') {
        console.warn(
          `LoggedFunction decorator applied to non-function property: ${key}`,
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

      const loggedParams: LoggedParamReflectData[] = Reflect.getOwnMetadata(
        loggedParam,
        _target,
        key,
      );

      const returnsData: ReturnsReflectData[] | true = Reflect.getOwnMetadata(
        returns,
        fn,
      );

      const overrideFunction = oB(
        'function',
        fn,
        _target,
        {
          scopedLoggerInjectableParam,
          loggedParams,
        },
        key,
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
  };
}
