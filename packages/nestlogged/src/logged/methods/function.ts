import { OverrideBuildOptions } from '../utils';
import { LoggedMetadata } from '../metadata';
import {
  loggedParam,
  scopedLogger,
  LoggedParamReflectData,
  ifReturns,
  IfReturnsReflectData,
  IfThrowsReflectData,
  ifThrows,
} from '../../reflected';
import { overrideBuild } from '../override';
import {
  backupMetadata,
  isFunctionWithWarn,
  restoreMetadata,
} from '../method-helpers';

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

      if (!isFunctionWithWarn('LoggedExceptionFilter', fn, key)) return;

      const newMetadata = LoggedMetadata.fromReflect(_target, key, options);
      if (!newMetadata) return;

      const all = backupMetadata(fn);

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

      const ifReturnsData: IfReturnsReflectData[] =
        Reflect.getOwnMetadata(ifReturns, fn) ?? [];

      const ifThrowsData: IfThrowsReflectData[] =
        Reflect.getOwnMetadata(ifThrows, fn) ?? [];

      const overrideFunction = oB(
        'function',
        fn,
        _target,
        {
          scopedLoggerInjectableParam,
          loggedParams,
        },
        key,
        ifReturnsData,
        ifThrowsData,
        newMetadata,
      );

      _target[key] = overrideFunction;
      descriptor.value = overrideFunction;

      newMetadata.save(_target, key);
      restoreMetadata(_target, key, descriptor, all);
    };
  };
}
