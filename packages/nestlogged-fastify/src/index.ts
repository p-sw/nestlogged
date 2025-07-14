import {
  LoggedControllerBuild,
  LoggedInjectableBuild,
  LoggedExceptionFilterBuild,
  LoggedFunctionBuild,
  LoggedGuardBuild,
  LoggedInterceptorBuild,
  LoggedMiddlewareBuild,
  LoggedRouteBuild,
} from 'nestlogged/lib/builders';
import { fastifyOverrideBuild } from './logged/override';

const LoggedController = LoggedControllerBuild(fastifyOverrideBuild);
const LoggedInjectable = LoggedInjectableBuild(fastifyOverrideBuild);
const LoggedExceptionFilter = LoggedExceptionFilterBuild(fastifyOverrideBuild);
const LoggedFunction = LoggedFunctionBuild(fastifyOverrideBuild);
const LoggedGuard = LoggedGuardBuild(fastifyOverrideBuild);
const LoggedInterceptor = LoggedInterceptorBuild(fastifyOverrideBuild);
const LoggedMiddleware = LoggedMiddlewareBuild(fastifyOverrideBuild);
const LoggedRoute = LoggedRouteBuild(fastifyOverrideBuild);

export * from 'nestlogged';
export {
  LoggedController,
  LoggedInjectable,
  LoggedExceptionFilter,
  LoggedFunction,
  LoggedGuard,
  LoggedInterceptor,
  LoggedMiddleware,
  LoggedRoute,
};
