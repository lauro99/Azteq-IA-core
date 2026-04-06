/**
 * Logger utility para todas las APIs
 * Proporciona logs formateados con timestamp y nivel
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

function formatTimestamp(date: Date): string {
  return date.toISOString();
}

function formatLog(level: LogLevel, message: string, data?: any): string {
  const timestamp = formatTimestamp(new Date());
  const baseLog = `[${timestamp}] [${level}] ${message}`;

  if (data) {
    return `${baseLog} ${JSON.stringify(data)}`;
  }
  return baseLog;
}

export const logger = {
  debug: (message: string, data?: any) => {
    console.log(formatLog('DEBUG', message, data));
  },

  info: (message: string, data?: any) => {
    console.log(formatLog('INFO', message, data));
  },

  warn: (message: string, data?: any) => {
    console.warn(formatLog('WARN', message, data));
  },

  error: (message: string, data?: any) => {
    console.error(formatLog('ERROR', message, data));
  }
};
