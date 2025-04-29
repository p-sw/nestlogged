import {
  LoggedController as LoggedControllerBuild,
  LoggedInjectable as LoggedInjectableBuild,
} from './class';

const LoggedController = LoggedControllerBuild();
const LoggedInjectable = LoggedInjectableBuild();

export * from './methods';
export {
  LoggedController,
  LoggedInjectable,
  LoggedControllerBuild,
  LoggedInjectableBuild,
};
