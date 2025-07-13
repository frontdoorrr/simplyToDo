// 디버그 로그 관리 시스템

const IS_DEV = __DEV__;
const IS_PRODUCTION = !__DEV__;

export const logger = {
  // 개발 환경에서만 표시되는 디버그 로그
  debug: (...args: any[]) => {
    if (IS_DEV) {
      console.log('[DEBUG]', ...args);
    }
  },

  // 개발 환경에서만 표시되는 정보 로그
  info: (...args: any[]) => {
    if (IS_DEV) {
      console.info('[INFO]', ...args);
    }
  },

  // 항상 표시되는 경고 (사용자에게 중요한 정보)
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },

  // 항상 표시되는 에러 (사용자에게 중요한 정보)
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },

  // AI 관련 로그 (개발 환경에서만)
  ai: (...args: any[]) => {
    if (IS_DEV) {
      console.log('[AI]', ...args);
    }
  },

  // 네트워크 관련 로그 (개발 환경에서만)
  network: (...args: any[]) => {
    if (IS_DEV) {
      console.log('[NETWORK]', ...args);
    }
  },

  // 데이터베이스 관련 로그 (개발 환경에서만)
  db: (...args: any[]) => {
    if (IS_DEV) {
      console.log('[DB]', ...args);
    }
  }
};

// 레거시 console.log를 대체하는 헬퍼
export const devLog = (...args: any[]) => {
  if (IS_DEV) {
    console.log(...args);
  }
};

export const prodLog = (...args: any[]) => {
  if (IS_PRODUCTION) {
    console.log(...args);
  }
};