export type Path = string | string[];
export type Paths = Path[];

export interface IncludeExcludePath {
  includePath?: Paths;
  excludePath?: Paths;
}

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

export interface ReturnsReflectData {
  name: string;
  path: string;
}

export const scopedLogger = Symbol("nlogdec-scopedLogger");
export const loggedParam = Symbol("nlogdec-loggedParam");
export const scopeKey = Symbol("nlogdec-scopeKey");
export const forceScopeKey = Symbol("nlogdec-forceScopeKey");
export const returns = Symbol("nlogdec-returns");

export function InjectLogger(
  target: any,
  propertyKey: string | symbol,
  parameterIndex: number
) {
  Reflect.defineMetadata(scopedLogger, parameterIndex, target, propertyKey);
}

export function LoggedParam(name: string, options?: IncludeExcludePath) {
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
  options?: { path?: Path; priority?: number }
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

export function Returns<F extends Array<any>, R>(namePaths?: {
  [name: string]: string;
}) {
  return (
    _target: any,
    _key: string | symbol,
    descriptor: TypedPropertyDescriptor<(...args: F) => Promise<R>>
  ) => {
    Reflect.defineMetadata(
      returns,
      namePaths
        ? Object.entries(namePaths).reduce<ReturnsReflectData[]>(
            (prev, curr) => [...prev, { name: curr[0], path: curr[1] }],
            []
          )
        : true,
      descriptor.value
    );
  };
}

export function ShouldScoped(
  _target: any,
  _key: string,
  descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>
) {
  Reflect.defineMetadata(forceScopeKey, true, descriptor.value);
}
