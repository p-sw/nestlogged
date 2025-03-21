import { OverrideBuildOptions, defaultOverrideBuildOptions } from './utils';

export const nestLoggedMetadata = Symbol("nlogdec-metadata");

export class LoggedMetadata {
  options: OverrideBuildOptions

  constructor(options?: Partial<OverrideBuildOptions>) {
    this.options = {
      ...defaultOverrideBuildOptions,
      ...(options ?? {}),
    }
  }

  updateOption(options: Partial<OverrideBuildOptions>) {
    this.options = {
      ...this.options,
      ...options
    }
  }
}