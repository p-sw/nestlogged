import { OverrideBuildOptions } from '../utils';
import { LoggedMetadata } from '../metadata';
import {
  scopedLoggerKey,
  IfReturnsReflectData,
  ifReturnsKey,
  ifThrowsKey,
  IfThrowsReflectData,
  returnsKey,
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
export function LoggedExceptionFilter(
  oB: typeof overrideBuild = overrideBuild,
) {
  return function LoggedExceptionFilter<F extends Array<any>, R>(
    options?: Partial<OverrideBuildOptions>,
  ) {
    return (
      _target: any,
      key: string,
      descriptor: TypedPropertyDescriptor<(...args: F) => R>,
    ) => {
      const fn = descriptor.value;

      if (!isFunctionWithWarn('LoggedExceptionFilter', fn, key)) return;

      const newMetadata = LoggedMetadata.fromReflect(_target, key, options);
      if (!newMetadata) return;

      const all = backupMetadata(fn);

      const scopedLoggerInjectableParam: number = Reflect.getOwnMetadata(
        scopedLoggerKey,
        _target,
        key,
      );

      const ifReturnsData: IfReturnsReflectData[] =
        Reflect.getOwnMetadata(ifReturnsKey, _target, key) ?? [];

      const returnsFallback: boolean =
        Reflect.getOwnMetadata(returnsKey, fn) ?? false;

      const ifThrowsData: IfThrowsReflectData[] =
        Reflect.getOwnMetadata(ifThrowsKey, _target, key) ?? [];

      const overrideFunction = oB(
        'exception',
        fn,
        _target,
        {
          scopedLoggerInjectableParam,
          loggedParams: [],
        },
        _target.constructor.name,
        ifReturnsData,
        returnsFallback,
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
