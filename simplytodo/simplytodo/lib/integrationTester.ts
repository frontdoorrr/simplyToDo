import { securityAuditor } from './securityAuditor';
import { performanceOptimizer } from './performanceOptimizer';
import { tokenManager } from './tokenManager';
import { sessionManager } from './sessionManager';
import { socialAuthService } from './socialAuthService';
import { userProfileService } from './userProfileService';
import { logger } from './logger';

// 테스트 결과 타입
export interface TestResult {
  testName: string;
  status: 'PASS' | 'FAIL' | 'SKIP' | 'WARNING';
  duration: number;
  details?: string;
  error?: string;
}

// 통합 테스트 결과
export interface IntegrationTestReport {
  timestamp: Date;
  overallStatus: 'PASS' | 'FAIL' | 'WARNING';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  warningTests: number;
  results: TestResult[];
  securityScore: number;
  performanceStats: any;
}

export class IntegrationTester {
  private static instance: IntegrationTester;

  private constructor() {}

  static getInstance(): IntegrationTester {
    if (!IntegrationTester.instance) {
      IntegrationTester.instance = new IntegrationTester();
    }
    return IntegrationTester.instance;
  }

  // 전체 시스템 통합 테스트 실행
  async runFullIntegrationTest(): Promise<IntegrationTestReport> {
    logger.auth('Starting full integration test suite');
    const startTime = Date.now();
    const results: TestResult[] = [];

    // 보안 시스템 테스트
    results.push(...await this.testSecuritySystems());
    
    // 인증 시스템 테스트
    results.push(...await this.testAuthenticationSystems());
    
    // 토큰 관리 시스템 테스트
    results.push(...await this.testTokenManagement());
    
    // 세션 관리 시스템 테스트
    results.push(...await this.testSessionManagement());
    
    // 성능 시스템 테스트
    results.push(...await this.testPerformanceSystems());
    
    // 사용자 프로필 시스템 테스트
    results.push(...await this.testUserProfileSystems());

    // 전체 결과 집계
    const totalTests = results.length;
    const passedTests = results.filter(r => r.status === 'PASS').length;
    const failedTests = results.filter(r => r.status === 'FAIL').length;
    const skippedTests = results.filter(r => r.status === 'SKIP').length;
    const warningTests = results.filter(r => r.status === 'WARNING').length;

    // 전체 상태 결정
    let overallStatus: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
    if (failedTests > 0) {
      overallStatus = 'FAIL';
    } else if (warningTests > 0) {
      overallStatus = 'WARNING';
    }

    // 보안 점수 및 성능 통계 조회
    const securityAudit = await securityAuditor.performQuickAudit();
    const performanceStats = performanceOptimizer.getPerformanceStats();

    const report: IntegrationTestReport = {
      timestamp: new Date(),
      overallStatus,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      warningTests,
      results,
      securityScore: securityAudit.score,
      performanceStats,
    };

    const duration = Date.now() - startTime;
    logger.auth(`Integration test completed in ${duration}ms. Status: ${overallStatus}`);
    
    return report;
  }

  // 보안 시스템 테스트
  private async testSecuritySystems(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // 보안 감사 테스트
    results.push(await this.runTest(
      'Security Audit',
      async () => {
        const audit = await securityAuditor.performQuickAudit();
        if (audit.criticalIssues > 0) {
          throw new Error(`Critical security issues found: ${audit.criticalIssues}`);
        }
        if (audit.score < 70) {
          return { status: 'WARNING' as const, details: `Security score: ${audit.score}/100` };
        }
        return { status: 'PASS' as const, details: `Security score: ${audit.score}/100` };
      }
    ));

    // 토큰 보안 검증
    results.push(await this.runTest(
      'Token Security Validation',
      async () => {
        const validation = await tokenManager.validateTokenSecurity();
        if (!validation.isSecure) {
          throw new Error(`Token security issues: ${validation.issues.join(', ')}`);
        }
        return { status: 'PASS' as const };
      }
    ));

    return results;
  }

  // 인증 시스템 테스트
  private async testAuthenticationSystems(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // 소셜 인증 설정 테스트
    results.push(await this.runTest(
      'Social Auth Configuration',
      async () => {
        const hasGoogleConfig = !!(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
        const hasSupabaseConfig = !!(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
        
        if (!hasSupabaseConfig) {
          throw new Error('Supabase configuration missing');
        }
        
        let details = 'Supabase configured';
        if (hasGoogleConfig) {
          details += ', Google OAuth configured';
        }
        
        return { status: 'PASS' as const, details };
      }
    ));

    // 소셜 계정 모니터링 테스트
    results.push(await this.runTest(
      'Social Account Monitoring',
      async () => {
        await socialAuthService.monitorSocialAccountStatus();
        return { status: 'PASS' as const };
      }
    ));

    return results;
  }

  // 토큰 관리 시스템 테스트
  private async testTokenManagement(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // 토큰 보안 상태 테스트
    results.push(await this.runTest(
      'Token Security Status',
      async () => {
        const status = await tokenManager.getSecurityStatus();
        let details = `Has tokens: ${status.hasTokens}, Valid: ${status.isValid}`;
        
        if (status.hasTokens && !status.isValid) {
          return { status: 'WARNING' as const, details: details + ' (Invalid tokens detected)' };
        }
        
        return { status: 'PASS' as const, details };
      }
    ));

    // 토큰 메타데이터 테스트
    results.push(await this.runTest(
      'Token Metadata',
      async () => {
        const metadata = await tokenManager.getTokenMetadata();
        if (metadata) {
          return { status: 'PASS' as const, details: `Provider: ${metadata.provider}` };
        }
        return { status: 'SKIP' as const, details: 'No token metadata found' };
      }
    ));

    return results;
  }

  // 세션 관리 시스템 테스트
  private async testSessionManagement(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // 현재 세션 상태 테스트
    results.push(await this.runTest(
      'Current Session State',
      async () => {
        const session = sessionManager.getCurrentSession();
        const isActive = sessionManager.isSessionActive();
        
        if (session) {
          const stats = sessionManager.getSessionStats();
          return { 
            status: stats.isHealthy ? 'PASS' as const : 'WARNING' as const,
            details: `Active: ${isActive}, Healthy: ${stats.isHealthy}, Inactivity: ${Math.round(stats.inactivityDuration / 1000)}s`
          };
        }
        
        return { status: 'SKIP' as const, details: 'No active session' };
      }
    ));

    // 세션 복구 테스트
    results.push(await this.runTest(
      'Session Restore Capability',
      async () => {
        // 실제 복구를 시도하지 않고 토큰 존재 여부만 확인
        const tokens = await tokenManager.getStoredTokens();
        if (tokens) {
          return { status: 'PASS' as const, details: 'Session restoration possible' };
        }
        return { status: 'SKIP' as const, details: 'No stored tokens for restoration' };
      }
    ));

    return results;
  }

  // 성능 시스템 테스트
  private async testPerformanceSystems(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // 성능 통계 테스트
    results.push(await this.runTest(
      'Performance Statistics',
      async () => {
        const stats = performanceOptimizer.getPerformanceStats();
        if (stats.totalOperations === 0) {
          return { status: 'SKIP' as const, details: 'No performance data available' };
        }
        
        const details = `Operations: ${stats.totalOperations}, Avg: ${stats.averageDuration.toFixed(2)}ms, Success: ${stats.successRate.toFixed(1)}%`;
        
        if (stats.successRate < 95) {
          return { status: 'WARNING' as const, details: details + ' (Low success rate)' };
        }
        
        return { status: 'PASS' as const, details };
      }
    ));

    // 캐시 시스템 테스트
    results.push(await this.runTest(
      'Cache System',
      async () => {
        // 캐시 테스트
        const testKey = 'integration_test_cache';
        const testData = { test: true, timestamp: Date.now() };
        
        performanceOptimizer.setCache(testKey, testData, 1000);
        const cachedData = performanceOptimizer.getCache(testKey);
        
        if (!cachedData || cachedData.test !== true) {
          throw new Error('Cache set/get operation failed');
        }
        
        performanceOptimizer.invalidateCache(testKey);
        const invalidatedData = performanceOptimizer.getCache(testKey);
        
        if (invalidatedData !== null) {
          throw new Error('Cache invalidation failed');
        }
        
        return { status: 'PASS' as const, details: 'Cache operations working correctly' };
      }
    ));

    return results;
  }

  // 사용자 프로필 시스템 테스트
  private async testUserProfileSystems(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // 프로필 데이터 검증 테스트
    results.push(await this.runTest(
      'Profile Data Validation',
      async () => {
        const validData = { full_name: 'Test User' };
        const invalidData = { full_name: '' };
        
        const validResult = userProfileService.validateProfileData(validData);
        const invalidResult = userProfileService.validateProfileData(invalidData);
        
        if (!validResult.isValid || invalidResult.isValid) {
          throw new Error('Profile validation logic failed');
        }
        
        return { status: 'PASS' as const, details: 'Profile validation working correctly' };
      }
    ));

    // 현재 사용자 프로필 조회 테스트
    results.push(await this.runTest(
      'Current User Profile',
      async () => {
        const profile = await userProfileService.getCurrentUserProfile();
        if (profile) {
          return { status: 'PASS' as const, details: `Profile found: ${profile.email}` };
        }
        return { status: 'SKIP' as const, details: 'No current user profile' };
      }
    ));

    return results;
  }

  // 개별 테스트 실행 헬퍼
  private async runTest(
    testName: string,
    testFunction: () => Promise<{ status: TestResult['status'], details?: string }>
  ): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      logger.debug(`Running test: ${testName}`);
      const result = await testFunction();
      const duration = performance.now() - startTime;
      
      return {
        testName,
        status: result.status,
        duration,
        details: result.details,
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      const errorMessage = (error as Error).message;
      
      logger.error(`Test failed: ${testName}`, error);
      
      return {
        testName,
        status: 'FAIL',
        duration,
        error: errorMessage,
      };
    }
  }

  // 테스트 보고서 생성
  generateTestReport(report: IntegrationTestReport): string {
    const lines = [
      '# 통합 테스트 보고서',
      `**실행 시간**: ${report.timestamp.toLocaleString()}`,
      `**전체 상태**: ${report.overallStatus}`,
      `**보안 점수**: ${report.securityScore}/100`,
      '',
      '## 테스트 결과 요약',
      `- 총 테스트: ${report.totalTests}`,
      `- 성공: ${report.passedTests}`,
      `- 실패: ${report.failedTests}`,
      `- 경고: ${report.warningTests}`,
      `- 스킵: ${report.skippedTests}`,
      '',
      '## 성능 통계',
      `- 총 작업 수: ${report.performanceStats.totalOperations}`,
      `- 평균 실행 시간: ${report.performanceStats.averageDuration?.toFixed(2) || 0}ms`,
      `- 성공률: ${report.performanceStats.successRate?.toFixed(1) || 0}%`,
      '',
      '## 상세 테스트 결과',
    ];

    report.results.forEach((result, index) => {
      const statusIcon = {
        'PASS': '✅',
        'FAIL': '❌',
        'WARNING': '⚠️',
        'SKIP': '⏭️'
      }[result.status];

      lines.push(
        `### ${index + 1}. ${result.testName} ${statusIcon}`,
        `**상태**: ${result.status}`,
        `**실행 시간**: ${result.duration.toFixed(2)}ms`
      );

      if (result.details) {
        lines.push(`**세부사항**: ${result.details}`);
      }

      if (result.error) {
        lines.push(`**오류**: ${result.error}`);
      }

      lines.push('');
    });

    return lines.join('\n');
  }

  // 빠른 상태 점검
  async quickHealthCheck(): Promise<{
    overall: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    security: number;
    performance: 'GOOD' | 'FAIR' | 'POOR';
    authentication: 'OK' | 'ISSUE';
  }> {
    try {
      const securityAudit = await securityAuditor.performQuickAudit();
      const performanceStats = performanceOptimizer.getPerformanceStats();
      const securityStatus = await tokenManager.getSecurityStatus();

      // 전체 상태 판단
      let overall: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
      if (securityAudit.criticalIssues > 0 || securityAudit.score < 50) {
        overall = 'CRITICAL';
      } else if (securityAudit.highIssues > 0 || securityAudit.score < 80) {
        overall = 'WARNING';
      }

      // 성능 상태 판단
      let performance: 'GOOD' | 'FAIR' | 'POOR' = 'GOOD';
      if (performanceStats.totalOperations > 0) {
        if (performanceStats.successRate < 95) {
          performance = 'POOR';
        } else if (performanceStats.averageDuration > 2000) {
          performance = 'FAIR';
        }
      }

      // 인증 상태 판단
      const authentication: 'OK' | 'ISSUE' = (securityStatus.hasTokens && securityStatus.isValid) ? 'OK' : 'ISSUE';

      return {
        overall,
        security: securityAudit.score,
        performance,
        authentication,
      };
    } catch (error) {
      logger.error('Quick health check failed:', error);
      return {
        overall: 'CRITICAL',
        security: 0,
        performance: 'POOR',
        authentication: 'ISSUE',
      };
    }
  }
}

// 싱글톤 인스턴스 export
export const integrationTester = IntegrationTester.getInstance();