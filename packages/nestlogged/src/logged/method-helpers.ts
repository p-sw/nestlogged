export function isFunctionWithWarn(
  decorator: string,
  value: any,
  key: string,
): value is Function {
  const v = typeof value === 'function';
  if (!v) {
    console.warn(
      `${decorator} decorator applied to non-function property: ${key}`,
    );
  }
  return v;
}

export function backupMetadata(fn: Function) {
  return Reflect.getMetadataKeys(fn).map((k) => [
    k,
    Reflect.getMetadata(k, fn),
  ]);
}

export function restoreMetadata(
  target: any,
  key: string,
  descriptor: TypedPropertyDescriptor<Function>,
  metadata: any,
) {
  metadata.forEach(([k, v]) => {
    Reflect.defineMetadata(k, v, target[key]);
    Reflect.defineMetadata(k, v, descriptor.value);
  });
}
