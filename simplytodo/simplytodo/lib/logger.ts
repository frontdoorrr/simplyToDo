// 고급 로그 관리 시스템

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';
type LogCategory = 'general' | 'ai' | 'network' | 'db' | 'auth' | 'ui' | 'performance';

interface LogConfig {
  level: LogLevel;
  categories: Record<LogCategory, boolean>;
  includeTimestamp: boolean;
  includeStack: boolean;
}

const IS_DEV = __DEV__;
const IS_PRODUCTION = !__DEV__;

// 프로덕션/개발 환경별 로그 설정
const LOG_CONFIG: LogConfig = {
  level: IS_PRODUCTION ? 'warn' : 'debug',
  categories: {
    general: true,
    ai: IS_DEV,
    network: IS_DEV,
    db: IS_DEV,
    auth: true, // 보안상 중요한 인증 로그는 항상 기록
    ui: IS_DEV,
    performance: true, // 성능 로그는 항상 기록
  },
  includeTimestamp: IS_PRODUCTION,
  includeStack: IS_DEV,
};

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

class Logger {
  private shouldLog(level: LogLevel, category: LogCategory = 'general'): boolean {
    return (
      LOG_LEVELS[level] >= LOG_LEVELS[LOG_CONFIG.level] &&
      LOG_CONFIG.categories[category]
    );
  }

  private formatMessage(level: LogLevel, category: LogCategory, message: string): string {
    const timestamp = LOG_CONFIG.includeTimestamp ? new Date().toISOString() : '';
    const prefix = `[${level.toUpperCase()}]${category !== 'general' ? `[${category.toUpperCase()}]` : ''}`;
    
    return [timestamp, prefix, message].filter(Boolean).join(' ');
  }

  private log(level: LogLevel, category: LogCategory, ...args: any[]): void {
    if (!this.shouldLog(level, category)) return;

    const [message, ...rest] = args;
    const formattedMessage = typeof message === 'string' 
      ? this.formatMessage(level, category, message)
      : message;

    const consoleMethod = {
      debug: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      silent: undefined,
    }[level];

    if (LOG_CONFIG.includeStack && level === 'error') {
      console.trace(formattedMessage, ...rest);
    } else if (consoleMethod) {
      consoleMethod(formattedMessage, ...rest);
    }
  }

  // 기본 로그 레벨들
  debug(message: any, ...args: any[]): void {
    this.log('debug', 'general', message, ...args);
  }

  info(message: any, ...args: any[]): void {
    this.log('info', 'general', message, ...args);
  }

  warn(message: any, ...args: any[]): void {
    this.log('warn', 'general', message, ...args);
  }

  error(message: any, ...args: any[]): void {
    this.log('error', 'general', message, ...args);
  }

  // 카테고리별 로그들
  ai(message: any, ...args: any[]): void {
    this.log('info', 'ai', message, ...args);
  }

  network(message: any, ...args: any[]): void {
    this.log('debug', 'network', message, ...args);
  }

  db(message: any, ...args: any[]): void {
    this.log('debug', 'db', message, ...args);
  }

  auth(message: any, ...args: any[]): void {
    this.log('info', 'auth', message, ...args);
  }

  ui(message: any, ...args: any[]): void {
    this.log('debug', 'ui', message, ...args);
  }

  performance(message: any, ...args: any[]): void {
    this.log('info', 'performance', message, ...args);
  }

  // 성능 측정 유틸리티
  time(label: string): void {
    if (this.shouldLog('debug', 'performance')) {
      console.time(`[PERFORMANCE] ${label}`);
    }
  }

  timeEnd(label: string): void {
    if (this.shouldLog('debug', 'performance')) {
      console.timeEnd(`[PERFORMANCE] ${label}`);
    }
  }

  // 그룹 로그 (복잡한 객체 디버깅용)
  group(label: string, collapsed: boolean = false): void {
    if (this.shouldLog('debug', 'general')) {
      collapsed ? console.groupCollapsed(label) : console.group(label);
    }
  }

  groupEnd(): void {
    if (this.shouldLog('debug', 'general')) {
      console.groupEnd();
    }
  }
}

export const logger = new Logger();

// 레거시 지원 및 유틸리티 함수들
export const devLog = (...args: any[]) => {
  logger.debug(args.join(' '));
};

export const prodLog = (...args: any[]) => {
  if (IS_PRODUCTION) {
    logger.info(args.join(' '));
  }
};

// 에러 리포팅 (향후 원격 로그 수집 시스템 연동 가능)
export const reportError = (error: Error, context?: Record<string, any>) => {
  logger.error('Error reported:', error.message, { stack: error.stack, context });
  
  // 프로덕션에서는 향후 외부 서비스(Sentry 등)로 전송 가능
  if (IS_PRODUCTION) {
    // TODO: 외부 에러 리포팅 서비스 연동
  }
};

// 성능 측정 데코레이터 함수
export const withPerformanceLogging = <T extends (...args: any[]) => any>(
  fn: T,
  label: string
): T => {
  return ((...args: any[]) => {
    logger.time(label);
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result.finally(() => logger.timeEnd(label));
      }
      logger.timeEnd(label);
      return result;
    } catch (error) {
      logger.timeEnd(label);
      throw error;
    }
  }) as T;
};

// 개발 환경 전용 디버깅 헬퍼
export const debugObject = (obj: any, label?: string) => {
  if (IS_DEV) {
    logger.group(label || 'Debug Object', true);
    logger.debug(JSON.stringify(obj, null, 2));
    logger.groupEnd();
  }
};