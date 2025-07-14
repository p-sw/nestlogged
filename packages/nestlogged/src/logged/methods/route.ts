import { RequestMethod } from '@nestjs/common';
import { OverrideBuildOptions, RevRequestMethod } from '../utils';
import { LoggedMetadata } from '../metadata';
import {
  loggedParamKey,
  scopedLoggerKey,
  returnsKey,
  LoggedParamReflectData,
  IfReturnsReflectData,
  ifReturnsKey,
  IfThrowsReflectData,
  ifThrowsKey,
} from '../../reflected';
import { overrideBuild } from '../override';
import { createRouteParamDecorator } from '../../internals/nest';
import { backupMetadata, restoreMetadata } from '../method-helpers';
import { isFunctionWithWarn } from '../method-helpers';

/**
 * @internal
 */
export function LoggedRoute(oB: typeof overrideBuild = overrideBuild) {
  return function LoggedRoute<F extends Array<any>, R>(
    options?: Partial<OverrideBuildOptions>,
  ) {
    return (
      _target: any,
      key: string,
      descriptor: TypedPropertyDescriptor<(...args: F) => R>,
    ) => {
      const fn = descriptor.value;

      if (!isFunctionWithWarn('LoggedRoute', fn, key)) return;

      const newMetadata = LoggedMetadata.fromReflect(_target, key, options);
      if (!newMetadata) return;

      const all = backupMetadata(fn);

      const httpPath: string = Reflect.getMetadata('path', fn);
      const httpMethod: RequestMethod = Reflect.getMetadata('method', fn);

      const fullRoute = `${_target.constructor.name}::${httpPath}[${
        RevRequestMethod[httpMethod]
      }]`;

      const scopedLoggerInjectableParam: number = Reflect.getOwnMetadata(
        scopedLoggerKey,
        _target,
        key,
      );
      // if @InjectLogger exists, fake nestjs as it is @Req()
      if (scopedLoggerInjectableParam !== undefined) {
        createRouteParamDecorator(0)()(
          _target,
          key,
          scopedLoggerInjectableParam,
        );
      }

      const loggedParams: LoggedParamReflectData[] = Reflect.getOwnMetadata(
        loggedParamKey,
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
        'route',
        fn,
        _target,
        {
          scopedLoggerInjectableParam,
          loggedParams,
        },
        key,
        ifReturnsData,
        returnsFallback,
        ifThrowsData,
        newMetadata,
        fullRoute,
      );

      _target[key] = overrideFunction;
      descriptor.value = overrideFunction;

      newMetadata.save(_target, key);
      restoreMetadata(_target, key, descriptor, all);
    };
  };
}
