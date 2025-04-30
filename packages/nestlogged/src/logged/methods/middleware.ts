import { OverrideBuildOptions } from '../utils';
import { LoggedMetadata, nestLoggedMetadata } from '../metadata';
import { scopedLogger, returns, ReturnsReflectData } from '../../reflected';
import { overrideBuild } from '../override';
import { backupMetadata, restoreMetadata } from '../method-helpers';
import { isFunctionWithWarn } from '../method-helpers';

/**
 * @internal
 */
export function LoggedMiddleware(oB: typeof overrideBuild = overrideBuild) {
  return function LoggedMiddleware<F extends Array<any>, R>(
    options?: Partial<OverrideBuildOptions>,
  ) {
    return (
      _target: any,
      key: string,
      descriptor: TypedPropertyDescriptor<(...args: F) => R>,
    ) => {
      const fn = descriptor.value;

      if (!isFunctionWithWarn('LoggedMiddleware', fn, key)) return;

      const newMetadata = LoggedMetadata.fromReflect(_target, key, options);
      if (!newMetadata) return;

      const all = backupMetadata(fn);

      const scopedLoggerInjectableParam: number = Reflect.getOwnMetadata(
        scopedLogger,
        _target,
        key,
      );

      const returnsData: ReturnsReflectData = Reflect.getOwnMetadata(
        returns,
        fn,
      );

      const overrideFunction = oB(
        'middleware',
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

      newMetadata.save(_target, key);
      restoreMetadata(_target, key, descriptor, all);
    };
  };
}
