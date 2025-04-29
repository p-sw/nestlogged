import { LoggedFunction as LoggedFunctionBuild } from './function';
import { LoggedRoute as LoggedRouteBuild } from './route';
import { LoggedGuard as LoggedGuardBuild } from './guard';
import { LoggedInterceptor as LoggedInterceptorBuild } from './interceptor';
import { LoggedMiddleware as LoggedMiddlewareBuild } from './middleware';
import { LoggedExceptionFilter as LoggedExceptionFilterBuild } from './exception';

const LoggedFunction = LoggedFunctionBuild();
const LoggedRoute = LoggedRouteBuild();
const LoggedGuard = LoggedGuardBuild();
const LoggedInterceptor = LoggedInterceptorBuild();
const LoggedMiddleware = LoggedMiddlewareBuild();
const LoggedExceptionFilter = LoggedExceptionFilterBuild();

export {
  LoggedFunction,
  LoggedRoute,
  LoggedGuard,
  LoggedInterceptor,
  LoggedMiddleware,
  LoggedExceptionFilter,
  //
  LoggedFunctionBuild,
  LoggedRouteBuild,
  LoggedGuardBuild,
  LoggedInterceptorBuild,
  LoggedMiddlewareBuild,
  LoggedExceptionFilterBuild,
};
