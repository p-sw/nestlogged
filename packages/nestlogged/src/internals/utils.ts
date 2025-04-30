import { Logger } from '@nestjs/common';

export const notIncludedSymbol = Symbol('notIncluded');

export function includeObjectSync(
  ocv: any,
  opt: {
    paths: string[];
  },
) {
  let current = Array.isArray(ocv) ? [] : typeof ocv === 'object' ? {} : ocv;
  opt.paths.forEach((dotpath) => {
    let query = ocv;
    let objRef = current;
    const path = dotpath.split('.');
    for (const [index, key] of Object.entries(path)) {
      query = query[key];
      if (query !== undefined && objRef[key] === undefined) {
        if (typeof query === 'object') {
          if (Array.isArray(query)) {
            objRef[key] = [];
          } else {
            objRef[key] = {};
          }
        }
      }
      if (typeof query !== 'object' || index === (path.length - 1).toString()) {
        objRef[key] = query;
        break;
      }
      objRef = objRef[key];
    }
  });
  return current;
}

export function excludeObjectSync(
  ocv: any,
  opt: {
    paths: string[];
  },
) {
  const copied =
    typeof ocv === 'object'
      ? Array.isArray(ocv)
        ? [...ocv]
        : { ...ocv }
      : ocv;
  opt.paths.forEach((dotpath) => {
    let objRef = copied;
    const path = dotpath.split('.');
    const lastIndex = (path.length - 1).toString();
    for (const [index, key] of Object.entries(path)) {
      if (index === lastIndex) {
        delete objRef[key];
        break;
      }
      objRef = objRef[key];
      if (typeof objRef !== 'object') {
        break;
      }
    }
  });

  return copied;
}

export function objectContainedLogSync(
  ocv: any,
  options?: {
    include?: string[];
    exclude?: string[];
  },
): string {
  const copied =
    typeof ocv === 'object' && ocv !== null
      ? Array.isArray(ocv)
        ? [...ocv]
        : { ...ocv }
      : ocv;
  if (options && typeof ocv === 'object' && ocv !== null) {
    if (options.include && options.include.length > 0) {
      return JSON.stringify(
        includeObjectSync(copied, { paths: options.include }),
      );
    }
    if (options.exclude && options.exclude.length > 0) {
      return JSON.stringify(
        excludeObjectSync(copied, { paths: options.exclude }),
      );
    }
  }

  if (typeof ocv === 'object' && ocv !== null) {
    return JSON.stringify(copied);
  } else {
    return `${copied}`;
  }
}

export function getItemByPathSync(obj: object, path: string | string[]) {
  const paths = Array.isArray(path) ? path : path.split('.');

  return Object.keys(obj).includes(paths[0])
    ? typeof obj[paths[0]] === 'object'
      ? getItemByPathSync(obj[paths[0]], paths.slice(1))
      : obj[paths[0]]
    : undefined;
}

export const logger = new Logger('NestLogged');
