import {
  getItemByPathSync,
  objectContainedLogSync,
} from '../internals/object-util';
import {
  IfReturnsReflectData,
  IfThrowsReflectData,
  LoggedParamReflectData,
} from '../reflected';
import { isEach } from '../utils';
import { copy } from './utils';

export function formatLoggedParam(args: any[], data: LoggedParamReflectData) {
  if (isEach(data.name)) {
    return Object.entries(data.name)
      .map(([name, path]) => [name, getItemByPathSync(args[data.index], path)])
      .filter((item) => item !== undefined)
      .map(([name, value]) => `${name}=${value}`)
      .join(', ');
  }
  if ('includePathTree' in data || 'excludePathTree' in data) {
    return `${data.name}=${objectContainedLogSync(args[data.index], { includePathTree: data.includePathTree, excludePathTree: data.excludePathTree })}`;
  }
  return `${data.name}=${objectContainedLogSync(args[data.index])}`;
}

export function formatReturnsData(
  returned: unknown,
  data: IfReturnsReflectData[],
  fallback: boolean,
) {
  if (data.length === 0) return '';
  for (const item of data) {
    if (item.ifReturns(returned)) {
      const result = item.transformer(copy(returned)); // each
      return (
        'WITH ' +
        Object.entries(result)
          .filter(([_, value]) => value !== undefined)
          .map(([name, value]) => `${name}=${value}`)
          .join(', ')
      );
    }
  }
  if (fallback) {
    return 'WITH ' + objectContainedLogSync(returned);
  }
  return '';
}

export function formatThrowsData(e: unknown, data: IfThrowsReflectData[]) {
  for (const item of data) {
    if (typeof item.error === 'function' && e instanceof item.error) {
      const result = item.transformer(e); // string | each
      return (
        'WITH ' +
        (typeof result === 'string'
          ? result
          : Object.entries(result)
              .filter(([_, value]) => value !== undefined)
              .map(([name, value]) => `${name}=${value}`)
              .join(', '))
      );
    }
  }
  // if doesn't match, try with default Error message
  if (e instanceof Error) {
    return 'WITH ' + e.message;
  }
  return '';
}
