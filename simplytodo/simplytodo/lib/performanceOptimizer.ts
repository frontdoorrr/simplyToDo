import { logger } from './logger';

// 성능 메트릭 타입
export interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

// 성능 임계값 설정
const PERFORMANCE_THRESHOLDS = {
  SOCIAL_LOGIN_MAX_MS: 5000,      // 소셜 로그인 최대 허용 시간
  TOKEN_REFRESH_MAX_MS: 2000,     // 토큰 갱신 최대 허용 시간
  SESSION_VALIDATION_MAX_MS: 1000, // 세션 검증 최대 허용 시간
  NETWORK_REQUEST_MAX_MS: 3000,   // 네트워크 요청 최대 허용 시간
} as const;

// 캐시 설정
const CACHE_CONFIG = {
  USER_PROFILE_TTL_MS: 5 * 60 * 1000,      // 사용자 프로필 캐시 5분
  SOCIAL_PROVIDER_TTL_MS: 10 * 60 * 1000,  // 소셜 프로바이더 정보 캐시 10분
  SESSION_STATE_TTL_MS: 1 * 60 * 1000,     // 세션 상태 캐시 1분
} as const;

// 캐시 엔트리 타입
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private metricsHistory: PerformanceMetrics[] = [];
  private cache: Map<string, CacheEntry<any>> = new Map();
  private requestDeduplication: Map<string, Promise<any>> = new Map();

  private constructor() {
    // 정기적으로 캐시 정리
    setInterval(() => this.cleanupCache(), 60000); // 1분마다
  }

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // 성능 측정 데코레이터
  async measurePerformance<T>(
    operation: string,
    asyncOperation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    let success = true;
    let error: string | undefined;
    let result: T;

    try {
      logger.performance(`Starting operation: ${operation}`);
      result = await asyncOperation();
      return result;
    } catch (err) {
      success = false;
      error = (err as Error).message;
      throw err;
    } finally {
      const duration = performance.now() - startTime;
      
      // 메트릭 기록
      const metric: PerformanceMetrics = {
        operation,
        duration,
        timestamp: new Date(),
        success,
        error,
        metadata,
      };

      this.recordMetric(metric);
      
      // 성능 임계값 체크
      this.checkPerformanceThreshold(operation, duration);
      
      logger.performance(`Operation '${operation}' completed in ${duration.toFixed(2)}ms (${success ? 'success' : 'failed'})`);
    }
  }

  // 메트릭 기록
  private recordMetric(metric: PerformanceMetrics): void {
    this.metricsHistory.push(metric);
    
    // 메트릭 히스토리 크기 제한 (최근 1000개만 유지)
    if (this.metricsHistory.length > 1000) {
      this.metricsHistory = this.metricsHistory.slice(-1000);
    }
  }

  // 성능 임계값 체크
  private checkPerformanceThreshold(operation: string, duration: number): void {
    let threshold: number | undefined;

    // 오퍼레이션별 임계값 확인
    if (operation.includes('social_login') || operation.includes('signIn')) {
      threshold = PERFORMANCE_THRESHOLDS.SOCIAL_LOGIN_MAX_MS;
    } else if (operation.includes('token_refresh') || operation.includes('refresh')) {
      threshold = PERFORMANCE_THRESHOLDS.TOKEN_REFRESH_MAX_MS;
    } else if (operation.includes('session') || operation.includes('validate')) {
      threshold = PERFORMANCE_THRESHOLDS.SESSION_VALIDATION_MAX_MS;
    } else if (operation.includes('network') || operation.includes('api')) {
      threshold = PERFORMANCE_THRESHOLDS.NETWORK_REQUEST_MAX_MS;
    }

    if (threshold && duration > threshold) {
      logger.warn(`Performance threshold exceeded: ${operation} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
    }
  }

  // 캐시 저장
  setCache<T>(key: string, data: T, ttl: number = CACHE_CONFIG.USER_PROFILE_TTL_MS): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    
    this.cache.set(key, entry);
    logger.performance(`Cached data for key: ${key} (TTL: ${ttl}ms)`);
  }

  // 캐시 조회
  getCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // TTL 체크
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      logger.performance(`Cache expired for key: ${key}`);
      return null;
    }

    logger.performance(`Cache hit for key: ${key}`);
    return entry.data as T;
  }

  // 캐시 삭제
  invalidateCache(key: string): void {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.performance(`Cache invalidated for key: ${key}`);
    }
  }

  // 캐시 패턴 삭제 (예: user_profile_* 패턴 삭제)
  invalidateCachePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace('*', '.*'));
    let deletedCount = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      logger.performance(`Invalidated ${deletedCount} cache entries matching pattern: ${pattern}`);
    }
  }

  // 캐시 정리
  private cleanupCache(): void {
    const currentTime = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (currentTime - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.performance(`Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  // 요청 중복 제거
  async deduplicateRequest<T>(
    key: string,
    asyncOperation: () => Promise<T>
  ): Promise<T> {
    // 이미 진행 중인 요청이 있는지 확인
    const existingRequest = this.requestDeduplication.get(key);
    if (existingRequest) {
      logger.performance(`Request deduplication: Using existing request for ${key}`);
      return existingRequest as Promise<T>;
    }

    // 새 요청 생성 및 저장
    const newRequest = asyncOperation();
    this.requestDeduplication.set(key, newRequest);

    try {
      const result = await newRequest;
      return result;
    } finally {
      // 요청 완료 후 제거
      this.requestDeduplication.delete(key);
    }
  }

  // 배치 작업 최적화
  async batchOperation<T, R>(
    items: T[],
    batchSize: number,
    operation: (batch: T[]) => Promise<R[]>,
    delayMs: number = 0
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      if (i > 0 && delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

      const batchResults = await this.measurePerformance(
        `batch_operation_${Math.floor(i / batchSize)}`,
        () => operation(batch),
        { batchSize: batch.length, batchIndex: Math.floor(i / batchSize) }
      );

      results.push(...batchResults);
    }

    return results;
  }

  // 지수 백오프를 사용한 재시도
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 1000,
    maxDelayMs: number = 10000,
    operationName: string = 'retry_operation'
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.measurePerformance(
          `${operationName}_attempt_${attempt}`,
          operation,
          { attempt, maxRetries }
        );
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        // 지수 백오프 계산
        const delay = Math.min(
          baseDelayMs * Math.pow(2, attempt),
          maxDelayMs
        );

        logger.performance(`Operation '${operationName}' failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  // 성능 통계 조회
  getPerformanceStats(operation?: string): {
    totalOperations: number;
    averageDuration: number;
    successRate: number;
    slowestOperation?: PerformanceMetrics;
    fastestOperation?: PerformanceMetrics;
    recentFailures: PerformanceMetrics[];
  } {
    let filteredMetrics = this.metricsHistory;

    if (operation) {
      filteredMetrics = this.metricsHistory.filter(m => 
        m.operation.includes(operation)
      );
    }

    if (filteredMetrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        successRate: 0,
        recentFailures: [],
      };
    }

    const totalOperations = filteredMetrics.length;
    const successfulOperations = filteredMetrics.filter(m => m.success).length;
    const averageDuration = filteredMetrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations;
    const successRate = (successfulOperations / totalOperations) * 100;

    const sortedByDuration = [...filteredMetrics].sort((a, b) => a.duration - b.duration);
    const slowestOperation = sortedByDuration[sortedByDuration.length - 1];
    const fastestOperation = sortedByDuration[0];

    const recentFailures = filteredMetrics
      .filter(m => !m.success)
      .slice(-10); // 최근 10개 실패

    return {
      totalOperations,
      averageDuration,
      successRate,
      slowestOperation,
      fastestOperation,
      recentFailures,
    };
  }

  // 메모리 사용량 최적화
  optimizeMemoryUsage(): void {
    // 메트릭 히스토리 정리 (오래된 것부터)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.metricsHistory = this.metricsHistory.filter(
      metric => metric.timestamp.getTime() > oneHourAgo
    );

    // 캐시 강제 정리
    this.cleanupCache();

    // 진행 중인 요청 중 오래된 것 정리
    const thirtySecondsAgo = Date.now() - (30 * 1000);
    // Note: 실제로는 요청 시작 시간을 추적해야 하지만, 간단하게 구현

    logger.performance('Memory usage optimized');
  }

  // 성능 보고서 생성
  generatePerformanceReport(): string {
    const stats = this.getPerformanceStats();
    const cacheStats = {
      entries: this.cache.size,
      hitRate: 0, // 실제로는 캐시 히트율을 추적해야 함
    };

    const report = [
      '# 성능 분석 보고서',
      `**생성 시간**: ${new Date().toLocaleString()}`,
      '',
      '## 전체 성능 통계',
      `- 총 작업 수: ${stats.totalOperations}`,
      `- 평균 실행 시간: ${stats.averageDuration.toFixed(2)}ms`,
      `- 성공률: ${stats.successRate.toFixed(1)}%`,
      '',
      '## 캐시 통계',
      `- 캐시 엔트리 수: ${cacheStats.entries}`,
      '',
      '## 최근 실패 작업',
    ];

    if (stats.recentFailures.length === 0) {
      report.push('- 최근 실패한 작업이 없습니다.');
    } else {
      stats.recentFailures.forEach((failure, index) => {
        report.push(
          `${index + 1}. ${failure.operation} (${failure.duration.toFixed(2)}ms)`,
          `   오류: ${failure.error}`,
          `   시간: ${failure.timestamp.toLocaleString()}`
        );
      });
    }

    return report.join('\n');
  }

  // 리소스 정리
  dispose(): void {
    this.metricsHistory = [];
    this.cache.clear();
    this.requestDeduplication.clear();
    logger.performance('PerformanceOptimizer disposed');
  }
}

// 싱글톤 인스턴스 export
export const performanceOptimizer = PerformanceOptimizer.getInstance();