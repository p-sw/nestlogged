import { Logger } from '@nestjs/common';
import type { PathTree } from '../reflected';

export const notIncludedSymbol = Symbol('notIncluded');

export function includeObjectSync(
  ocv: any,
  opt: {
    pathTree: PathTree;
  },
) {
  let current = Array.isArray(ocv) ? [] : typeof ocv === 'object' ? {} : ocv;

  function processPathTree(tree: PathTree, sourceObj: any, targetObj: any) {
    for (const [key, value] of Object.entries(tree)) {
      if (sourceObj && typeof sourceObj === 'object' && key in sourceObj) {
        if (value === null) {
          targetObj[key] = sourceObj[key];
        } else {
          if (targetObj[key] === undefined) {
            if (typeof sourceObj[key] === 'object') {
              if (Array.isArray(sourceObj[key])) {
                targetObj[key] = [];
              } else {
                targetObj[key] = {};
              }
            }
          }
          if (typeof sourceObj[key] === 'object') {
            processPathTree(value, sourceObj[key], targetObj[key]);
          }
        }
      }
    }
  }

  processPathTree(opt.pathTree, ocv, current);
  return current;
}

export function excludeObjectSync(
  ocv: any,
  opt: {
    pathTree: PathTree;
  },
) {
  const copied =
    typeof ocv === 'object'
      ? Array.isArray(ocv)
        ? [...ocv]
        : { ...ocv }
      : ocv;

  function processExcludePathTree(tree: PathTree, targetObj: any) {
    for (const [key, value] of Object.entries(tree)) {
      if (targetObj && typeof targetObj === 'object' && key in targetObj) {
        if (value === null) {
          delete targetObj[key];
        } else {
          if (typeof targetObj[key] === 'object') {
            processExcludePathTree(value, targetObj[key]);
          }
        }
      }
    }
  }

  processExcludePathTree(opt.pathTree, copied);
  return copied;
}

export function objectContainedLogSync(
  ocv: any,
  options?: {
    includePathTree?: PathTree;
    excludePathTree?: PathTree;
  },
): string {
  const copied =
    typeof ocv === 'object' && ocv !== null
      ? Array.isArray(ocv)
        ? [...ocv]
        : { ...ocv }
      : ocv;
  if (options && typeof ocv === 'object' && ocv !== null) {
    if (options.includePathTree) {
      return JSON.stringify(
        includeObjectSync(copied, { pathTree: options.includePathTree }),
      );
    }
    if (options.excludePathTree) {
      return JSON.stringify(
        excludeObjectSync(copied, { pathTree: options.excludePathTree }),
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
  if (obj === undefined || obj === null) {
    return undefined;
  }

  const paths = Array.isArray(path) ? path : path.split('.');
  if (paths.length === 0) return obj;

  return Object.keys(obj).includes(paths[0])
    ? getItemByPathSync(obj[paths[0]], paths.slice(1))
    : undefined;
}

export const logger = new Logger('NestLogged');
