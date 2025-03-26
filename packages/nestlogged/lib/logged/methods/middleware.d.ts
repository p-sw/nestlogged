import { OverrideBuildOptions } from '../utils';
export declare function LoggedMiddleware<F extends Array<any>, R>(options?: Partial<OverrideBuildOptions>): (_target: any, key: string, descriptor: TypedPropertyDescriptor<(...args: F) => R>) => void;
