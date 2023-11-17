export interface LoggedParamReflectData {
    name: string;
    index: number;
    include?: string[];
    exclude?: string[];
}

export const scopedLogger = Symbol('scopedLogger');
export const loggedParam = Symbol('loggedParam');


export function InjectLogger(
    target: any,
    propertyKey: string | symbol,
    parameterIndex: number,
) {
    Reflect.defineMetadata(scopedLogger, parameterIndex, target, propertyKey);
}

export function LoggedParam(
    name: string,
    options?: {
        includePath?: (string | string[])[];
        excludePath?: (string | string[])[];
    },
) {
    return (
        target: any,
        propertyKey: string | symbol,
        parameterIndex: number,
    ) => {
        const existingLoggedParams: LoggedParamReflectData[] =
            Reflect.getOwnMetadata(loggedParam, target, propertyKey) || [];

        existingLoggedParams.push({
            name,
            index: parameterIndex,
            include:
                options &&
                options.includePath &&
                options.includePath.map((v) => (Array.isArray(v) ? v.join('.') : v)),
            exclude:
                options &&
                options.excludePath &&
                options.excludePath.map((v) => (Array.isArray(v) ? v.join('.') : v)),
        });

        Reflect.defineMetadata(
            loggedParam,
            existingLoggedParams,
            target,
            propertyKey
        );
    };
}