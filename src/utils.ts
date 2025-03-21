import { Logger } from '@nestjs/common';
import { ScopedLogger } from './logger';
import { REQUEST_LOG_ID } from './logged/utils';

const logger = new Logger();

export function getRequestLogger(functionName: string, req: any): ScopedLogger {
  return new ScopedLogger(logger, [functionName], req[REQUEST_LOG_ID]);
}
