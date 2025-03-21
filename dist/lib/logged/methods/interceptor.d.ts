import { OverrideBuildOptions } from '../utils';
import { ExecutionContext } from '@nestjs/common';
export declare function LoggedInterceptor<F extends Array<any>, R>(options?: Partial<OverrideBuildOptions>): (_target: any, key: string, descriptor: TypedPropertyDescriptor<(context: ExecutionContext, ...args: F) => R>) => void;
