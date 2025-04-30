import { OverrideBuildOptions, defaultOverrideBuildOptions } from './utils';

export const nestLoggedMetadata = Symbol('nlogdec-metadata');

export class LoggedMetadata {
  options: OverrideBuildOptions;

  constructor(options?: Partial<OverrideBuildOptions>) {
    this.options = {
      ...defaultOverrideBuildOptions,
      ...(options ?? {}),
    };
  }

  updateOption(options: Partial<OverrideBuildOptions>) {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  save(target: any, key: string) {
    Reflect.defineMetadata(nestLoggedMetadata, this, target, key);
  }

  static fromReflect(
    target: any,
    key: string,
    options?: Partial<OverrideBuildOptions>,
  ) {
    const metadata = Reflect.getOwnMetadata(nestLoggedMetadata, target, key);
    if (metadata) {
      // already applied, override instead
      metadata.updateOption(options);
      return null;
    }
    return new LoggedMetadata(options);
  }
}
