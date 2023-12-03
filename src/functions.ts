export const notIncludedSymbol = Symbol("notIncluded");

export async function includeOrExcludeObject(
  ocv: any,
  paths: string[],
  currentPath: string[] = [],
  include: boolean // or exclude
) {
  if (Array.isArray(ocv)) {
    return (
      await Promise.all(
        ocv.map(
          async (v, i) =>
            await includeOrExcludeObject(
              v,
              paths,
              [...currentPath, i.toString()],
              include
            )
        )
      )
    ).filter((e) => e !== notIncludedSymbol);
  }

  if (typeof ocv === "object") {
    return Object.fromEntries(
      (
        await Promise.all(
          Object.entries(ocv).map(async ([key, value]) => [
            key,
            await includeOrExcludeObject(
              value,
              paths,
              [...currentPath, key],
              include
            ),
          ])
        )
      ).filter((e) => e[1] !== notIncludedSymbol)
    );
  }

  const isIncluded = paths.includes(currentPath.join("."));

  return include
    ? isIncluded // include mode, path is in list
      ? ocv
      : notIncludedSymbol
    : isIncluded // exclude mode, path is in list
    ? notIncludedSymbol
    : ocv;
}

export default async function objectContainedLogged(
  ocv: any,
  options?: { include?: string[]; exclude: string[] }
): Promise<string> {
  if (options && typeof ocv === "object") {
    if (options.include && options.include.length > 0) {
      return JSON.stringify(
        await includeOrExcludeObject(ocv, options.include, [], true)
      );
    }
    if (options.exclude && options.exclude.length > 0) {
      return JSON.stringify(
        await includeOrExcludeObject(ocv, options.exclude, [], false)
      );
    }
  }

  if (typeof ocv === "object") {
    return JSON.stringify(ocv);
  } else {
    return `${ocv}`;
  }
}
