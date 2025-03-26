import { ControllerOptions, ScopeOptions } from '@nestjs/common';
export declare function LoggedInjectable(options?: ScopeOptions & {
    verbose?: boolean;
}): (target: any) => void;
export declare function LoggedController(): (target: any) => void;
export declare function LoggedController(prefix: string | string[]): (target: any) => void;
export declare function LoggedController(options: ControllerOptions & {
    verbose?: boolean;
}): (target: any) => void;
