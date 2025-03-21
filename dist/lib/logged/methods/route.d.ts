import { OverrideBuildOptions } from '../utils';
export declare function LoggedRoute<F extends Array<any>, R>(route?: string, options?: Partial<OverrideBuildOptions>): (_target: any, key: string, descriptor: TypedPropertyDescriptor<(...args: F) => R>) => void;
