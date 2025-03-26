import { OverrideBuildOptions } from './utils';
export declare const nestLoggedMetadata: unique symbol;
export declare class LoggedMetadata {
    options: OverrideBuildOptions;
    constructor(options?: Partial<OverrideBuildOptions>);
    updateOption(options: Partial<OverrideBuildOptions>): void;
}
