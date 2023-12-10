export interface LoggedParamReflectData {
  name: string;
  index: number;
  include?: string[];
  exclude?: string[];
}

export interface ScopeKeyReflectData {
  name: string;
  index: number;
  path?: string[];
  priority?: number;
}

export const scopedLogger = Symbol("nlogdec-scopedLogger");
export const loggedParam = Symbol("nlogdec-loggedParam");
export const scopeKey = Symbol("nlogdec-scopeKey");
export const forceScopeKey = Symbol("nlogdec-forceScopeKey");

export function InjectLogger(
  target: any,
  propertyKey: string | symbol,
  parameterIndex: number
) {
  Reflect.defineMetadata(scopedLogger, parameterIndex, target, propertyKey);
}

export function LoggedParam(
  name: string,
  options?: {
    includePath?: (string | string[])[];
    excludePath?: (string | string[])[];
  }
) {
  return (
    target: any,
    propertyKey: string | symbol,
    parameterIndex: number
  ) => {
    const existingLoggedParams: LoggedParamReflectData[] =
      Reflect.getOwnMetadata(loggedParam, target, propertyKey) || [];

    existingLoggedParams.push({
      name,
      index: parameterIndex,
      // If path is provided in string[] type, convert it to string path because it is used in string type
      include:
        options &&
        options.includePath &&
        options.includePath.map((v) => (Array.isArray(v) ? v.join(".") : v)),
      exclude:
        options &&
        options.excludePath &&
        options.excludePath.map((v) => (Array.isArray(v) ? v.join(".") : v)),
    });

    Reflect.defineMetadata(
      loggedParam,
      existingLoggedParams,
      target,
      propertyKey
    );
  };
}

export function ScopeKey(
  name: string,
  options?: { path?: string | string[]; priority?: number }
) {
  return (
    target: any,
    propertyKey: string | symbol,
    parameterIndex: number
  ) => {
    const existingScopeKeys: ScopeKeyReflectData[] =
      Reflect.getOwnMetadata(scopeKey, target, propertyKey) || [];

    existingScopeKeys.push({
      name,
      index: parameterIndex,
      path: Array.isArray(options?.path)
        ? options.path
        : options?.path?.split("."),
      priority: options?.priority,
    });

    existingScopeKeys.sort((a, b) => (b.priority ?? 1) - (a.priority ?? 1));

    Reflect.defineMetadata(scopeKey, existingScopeKeys, target, propertyKey);
  };
}

export function ShouldScoped(
  _target: any,
  _key: string,
  descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>
) {
  Reflect.defineMetadata(forceScopeKey, true, descriptor.value);
}
