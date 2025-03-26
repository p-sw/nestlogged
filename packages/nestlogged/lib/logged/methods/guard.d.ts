import { ExecutionContext } from '@nestjs/common';
import { OverrideBuildOptions } from '../utils';
export declare function LoggedGuard<F extends Array<any>, R>(options?: Partial<OverrideBuildOptions>): (_target: any, key: string, descriptor: TypedPropertyDescriptor<(context: ExecutionContext, ...args: F) => R>) => void;
