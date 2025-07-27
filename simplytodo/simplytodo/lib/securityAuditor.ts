import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { tokenManager } from './tokenManager';
import { sessionManager } from './sessionManager';
import { logger } from './logger';

// 보안 감사 결과 타입
export interface SecurityAuditResult {
  score: number; // 0-100 점수
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SECURE';
  issues: SecurityIssue[];
  recommendations: string[];
  timestamp: Date;
}

// 보안 이슈 타입
export interface SecurityIssue {
  category: SecurityCategory;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  impact: string;
  solution: string;
  detected: boolean;
}

// 보안 카테고리
export enum SecurityCategory {
  TOKEN_SECURITY = 'TOKEN_SECURITY',
  SESSION_MANAGEMENT = 'SESSION_MANAGEMENT',
  DATA_STORAGE = 'DATA_STORAGE',
  NETWORK_SECURITY = 'NETWORK_SECURITY',
  APP_CONFIGURATION = 'APP_CONFIGURATION',
  AUTHENTICATION = 'AUTHENTICATION',
  PRIVACY = 'PRIVACY',
}

// 보안 설정 상수
const SECURITY_STANDARDS = {
  MIN_TOKEN_LENGTH: 32,
  MAX_SESSION_DURATION_HOURS: 24,
  MAX_INACTIVITY_MINUTES: 60,
  REQUIRED_SECURE_STORAGE: Platform.OS !== 'web',
  HTTPS_REQUIRED: true,
} as const;

export class SecurityAuditor {
  private static instance: SecurityAuditor;

  private constructor() {}

  static getInstance(): SecurityAuditor {
    if (!SecurityAuditor.instance) {
      SecurityAuditor.instance = new SecurityAuditor();
    }
    return SecurityAuditor.instance;
  }

  // 종합 보안 감사 실행
  async performFullAudit(): Promise<SecurityAuditResult> {
    logger.auth('Starting comprehensive security audit');

    const issues: SecurityIssue[] = [];
    
    // 각 카테고리별 보안 점검
    issues.push(...await this.auditTokenSecurity());
    issues.push(...await this.auditSessionManagement());
    issues.push(...await this.auditDataStorage());
    issues.push(...await this.auditNetworkSecurity());
    issues.push(...await this.auditAppConfiguration());
    issues.push(...await this.auditAuthentication());
    issues.push(...await this.auditPrivacyCompliance());

    // 점수 계산
    const score = this.calculateSecurityScore(issues);
    const level = this.determineSecurityLevel(score);
    const recommendations = this.generateRecommendations(issues);

    const result: SecurityAuditResult = {
      score,
      level,
      issues: issues.filter(issue => issue.detected),
      recommendations,
      timestamp: new Date(),
    };

    logger.auth(`Security audit completed. Score: ${score}/100, Level: ${level}`);
    return result;
  }

  // 토큰 보안 점검
  private async auditTokenSecurity(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    try {
      const securityStatus = await tokenManager.getSecurityStatus();

      // 토큰 존재 및 유효성 검사
      issues.push({
        category: SecurityCategory.TOKEN_SECURITY,
        severity: 'CRITICAL',
        title: 'Missing Authentication Tokens',
        description: 'No valid authentication tokens found',
        impact: 'User cannot access authenticated features',
        solution: 'Re-authenticate user and store valid tokens',
        detected: !securityStatus.hasTokens
      });

      issues.push({
        category: SecurityCategory.TOKEN_SECURITY,
        severity: 'HIGH',
        title: 'Invalid/Expired Tokens',
        description: 'Authentication tokens are invalid or expired',
        impact: 'Authentication failures and potential security risks',
        solution: 'Refresh tokens or re-authenticate user',
        detected: securityStatus.hasTokens && !securityStatus.isValid
      });

      // 토큰 보안 저장소 검사
      issues.push({
        category: SecurityCategory.TOKEN_SECURITY,
        severity: 'HIGH',
        title: 'Insecure Token Storage',
        description: 'Tokens are not stored in secure storage (Keychain/Android Keystore)',
        impact: 'Tokens could be accessed by other apps or malicious code',
        solution: 'Use SecureStore for token storage on native platforms',
        detected: !securityStatus.isSecurelyStored
      });

      // 토큰 갱신 필요성 검사
      issues.push({
        category: SecurityCategory.TOKEN_SECURITY,
        severity: 'MEDIUM',
        title: 'Token Refresh Required',
        description: 'Authentication tokens need refresh soon',
        impact: 'Potential service interruption',
        solution: 'Implement proactive token refresh',
        detected: securityStatus.needsRefresh
      });

    } catch (error) {
      logger.error('Token security audit failed:', error);
      issues.push({
        category: SecurityCategory.TOKEN_SECURITY,
        severity: 'CRITICAL',
        title: 'Token Security Audit Failed',
        description: 'Unable to assess token security status',
        impact: 'Unknown security risks in token management',
        solution: 'Review token management implementation',
        detected: true
      });
    }

    return issues;
  }

  // 세션 관리 점검
  private async auditSessionManagement(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    try {
      const currentSession = sessionManager.getCurrentSession();
      
      if (!currentSession) {
        issues.push({
          category: SecurityCategory.SESSION_MANAGEMENT,
          severity: 'MEDIUM',
          title: 'No Active Session',
          description: 'No active user session found',
          impact: 'User experience and security monitoring limitations',
          solution: 'Implement proper session management',
          detected: true
        });
        return issues;
      }

      const sessionStats = sessionManager.getSessionStats();

      // 세션 지속 시간 검사
      const maxSessionDuration = SECURITY_STANDARDS.MAX_SESSION_DURATION_HOURS * 60 * 60 * 1000;
      issues.push({
        category: SecurityCategory.SESSION_MANAGEMENT,
        severity: 'MEDIUM',
        title: 'Long Session Duration',
        description: 'User session has been active for too long',
        impact: 'Increased risk of session hijacking',
        solution: 'Implement session timeout and re-authentication',
        detected: sessionStats.duration > maxSessionDuration
      });

      // 비활성 시간 검사
      const maxInactivity = SECURITY_STANDARDS.MAX_INACTIVITY_MINUTES * 60 * 1000;
      issues.push({
        category: SecurityCategory.SESSION_MANAGEMENT,
        severity: 'HIGH',
        title: 'Long Inactivity Period',
        description: 'User has been inactive for an extended period',
        impact: 'Risk of unauthorized access to open session',
        solution: 'Implement automatic logout after inactivity',
        detected: sessionStats.inactivityDuration > maxInactivity
      });

      // 세션 건강성 검사
      issues.push({
        category: SecurityCategory.SESSION_MANAGEMENT,
        severity: 'HIGH',
        title: 'Unhealthy Session State',
        description: 'Session is in an unhealthy state',
        impact: 'Potential security vulnerabilities in session management',
        solution: 'Review and fix session state management',
        detected: !sessionStats.isHealthy
      });

    } catch (error) {
      logger.error('Session management audit failed:', error);
      issues.push({
        category: SecurityCategory.SESSION_MANAGEMENT,
        severity: 'CRITICAL',
        title: 'Session Management Audit Failed',
        description: 'Unable to assess session management security',
        impact: 'Unknown session security risks',
        solution: 'Review session management implementation',
        detected: true
      });
    }

    return issues;
  }

  // 데이터 저장소 보안 점검
  private async auditDataStorage(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    try {
      // AsyncStorage에 민감한 데이터가 있는지 검사
      const asyncStorageKeys = await AsyncStorage.getAllKeys();
      const sensitivePatterns = [
        /password/i, /token/i, /secret/i, /key/i, 
        /auth/i, /credential/i, /session/i
      ];

      const sensitiveFindData = asyncStorageKeys.some(key => 
        sensitivePatterns.some(pattern => pattern.test(key))
      );

      issues.push({
        category: SecurityCategory.DATA_STORAGE,
        severity: 'HIGH',
        title: 'Sensitive Data in Insecure Storage',
        description: 'Potentially sensitive data found in AsyncStorage',
        impact: 'Sensitive data could be accessed by other apps',
        solution: 'Move sensitive data to SecureStore',
        detected: sensitiveFindData && Platform.OS !== 'web'
      });

      // SecureStore 사용 가능성 검사
      if (Platform.OS !== 'web') {
        try {
          await SecureStore.setItemAsync('security_test', 'test');
          await SecureStore.deleteItemAsync('security_test');
        } catch (error) {
          issues.push({
            category: SecurityCategory.DATA_STORAGE,
            severity: 'CRITICAL',
            title: 'SecureStore Not Available',
            description: 'SecureStore is not available for secure data storage',
            impact: 'Cannot securely store sensitive data',
            solution: 'Check device compatibility and app permissions',
            detected: true
          });
        }
      }

    } catch (error) {
      logger.error('Data storage audit failed:', error);
      issues.push({
        category: SecurityCategory.DATA_STORAGE,
        severity: 'MEDIUM',
        title: 'Data Storage Audit Failed',
        description: 'Unable to fully assess data storage security',
        impact: 'Unknown data storage risks',
        solution: 'Review data storage implementation',
        detected: true
      });
    }

    return issues;
  }

  // 네트워크 보안 점검
  private async auditNetworkSecurity(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
      
      // HTTPS 사용 확인
      issues.push({
        category: SecurityCategory.NETWORK_SECURITY,
        severity: 'CRITICAL',
        title: 'Insecure HTTP Connection',
        description: 'API connections are not using HTTPS',
        impact: 'Data can be intercepted in transit',
        solution: 'Use HTTPS for all API communications',
        detected: supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')
      });

      // API 키 노출 검사
      const hasApiKeys = !!(
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
        process.env.EXPO_PUBLIC_GEMINI_API_KEY
      );

      issues.push({
        category: SecurityCategory.NETWORK_SECURITY,
        severity: 'LOW',
        title: 'API Keys in Environment',
        description: 'API keys are stored in environment variables',
        impact: 'Keys could be exposed in client-side code',
        solution: 'Review API key security and consider server-side proxy',
        detected: hasApiKeys
      });

    } catch (error) {
      logger.error('Network security audit failed:', error);
      issues.push({
        category: SecurityCategory.NETWORK_SECURITY,
        severity: 'MEDIUM',
        title: 'Network Security Audit Failed',
        description: 'Unable to assess network security configuration',
        impact: 'Unknown network security risks',
        solution: 'Review network security implementation',
        detected: true
      });
    }

    return issues;
  }

  // 앱 설정 보안 점검
  private async auditAppConfiguration(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    // 개발 모드 검사
    issues.push({
      category: SecurityCategory.APP_CONFIGURATION,
      severity: 'HIGH',
      title: 'Development Mode in Production',
      description: 'App is running in development mode',
      impact: 'Debug information and logs may be exposed',
      solution: 'Build app in production mode for release',
      detected: __DEV__
    });

    // 디버그 로그 활성화 검사
    const hasDebugLogs = console.log !== undefined;
    issues.push({
      category: SecurityCategory.APP_CONFIGURATION,
      severity: 'MEDIUM',
      title: 'Debug Logs Enabled',
      description: 'Debug console logging is enabled',
      impact: 'Sensitive information may be logged',
      solution: 'Disable debug logs in production builds',
      detected: hasDebugLogs && !__DEV__
    });

    return issues;
  }

  // 인증 시스템 점검
  private async auditAuthentication(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    try {
      // Supabase 연결 상태 확인
      const { data, error } = await supabase.auth.getSession();
      
      issues.push({
        category: SecurityCategory.AUTHENTICATION,
        severity: 'HIGH',
        title: 'Authentication Service Unavailable',
        description: 'Cannot connect to authentication service',
        impact: 'Users cannot authenticate',
        solution: 'Check Supabase configuration and network connectivity',
        detected: !!error && !data
      });

      // 인증 설정 검사
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      issues.push({
        category: SecurityCategory.AUTHENTICATION,
        severity: 'CRITICAL',
        title: 'Missing Authentication Configuration',
        description: 'Required authentication configuration is missing',
        impact: 'Authentication system cannot function',
        solution: 'Configure Supabase URL and anonymous key',
        detected: !supabaseUrl || !supabaseKey
      });

    } catch (error) {
      logger.error('Authentication audit failed:', error);
      issues.push({
        category: SecurityCategory.AUTHENTICATION,
        severity: 'HIGH',
        title: 'Authentication Audit Failed',
        description: 'Unable to assess authentication system security',
        impact: 'Unknown authentication security risks',
        solution: 'Review authentication implementation',
        detected: true
      });
    }

    return issues;
  }

  // 개인정보 보호 컴플라이언스 점검
  private async auditPrivacyCompliance(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    // 사용자 동의 관련 검사
    issues.push({
      category: SecurityCategory.PRIVACY,
      severity: 'MEDIUM',
      title: 'Privacy Policy Compliance',
      description: 'Privacy policy and user consent mechanisms need review',
      impact: 'Potential privacy regulation violations',
      solution: 'Implement proper privacy policy and consent flows',
      detected: false // 이는 수동 검토가 필요
    });

    // 데이터 최소화 원칙 검사
    issues.push({
      category: SecurityCategory.PRIVACY,
      severity: 'LOW',
      title: 'Data Minimization Review',
      description: 'Review data collection to ensure minimal necessary data',
      impact: 'Collecting unnecessary personal data',
      solution: 'Audit and minimize data collection',
      detected: false // 이는 수동 검토가 필요
    });

    return issues;
  }

  // 보안 점수 계산
  private calculateSecurityScore(issues: SecurityIssue[]): number {
    let totalDeductions = 0;
    const severityWeights = {
      CRITICAL: 25,
      HIGH: 15,
      MEDIUM: 8,
      LOW: 3,
    };

    issues.forEach(issue => {
      if (issue.detected) {
        totalDeductions += severityWeights[issue.severity];
      }
    });

    return Math.max(0, 100 - totalDeductions);
  }

  // 보안 수준 결정
  private determineSecurityLevel(score: number): SecurityAuditResult['level'] {
    if (score >= 90) return 'SECURE';
    if (score >= 70) return 'LOW';
    if (score >= 50) return 'MEDIUM';
    if (score >= 30) return 'HIGH';
    return 'CRITICAL';
  }

  // 권장사항 생성
  private generateRecommendations(issues: SecurityIssue[]): string[] {
    const recommendations: string[] = [];
    const detectedIssues = issues.filter(issue => issue.detected);

    // 우선순위별 권장사항
    const criticalIssues = detectedIssues.filter(issue => issue.severity === 'CRITICAL');
    if (criticalIssues.length > 0) {
      recommendations.push('🚨 즉시 조치 필요: 심각한 보안 취약점이 발견되었습니다.');
      criticalIssues.forEach(issue => {
        recommendations.push(`• ${issue.solution}`);
      });
    }

    const highIssues = detectedIssues.filter(issue => issue.severity === 'HIGH');
    if (highIssues.length > 0) {
      recommendations.push('⚠️ 우선 조치: 높은 위험도의 보안 이슈가 있습니다.');
      highIssues.forEach(issue => {
        recommendations.push(`• ${issue.solution}`);
      });
    }

    // 일반적인 보안 권장사항
    if (detectedIssues.length > 0) {
      recommendations.push(
        '🔒 정기적인 보안 감사를 수행하세요.',
        '📱 앱 업데이트 시 보안 검토를 포함하세요.',
        '👥 개발팀 보안 교육을 실시하세요.'
      );
    }

    return recommendations;
  }

  // 빠른 보안 점검 (성능 최적화된 버전)
  async performQuickAudit(): Promise<{ score: number; criticalIssues: number; highIssues: number }> {
    const issues: SecurityIssue[] = [];
    
    // 필수 보안 항목만 점검
    issues.push(...await this.auditTokenSecurity());
    issues.push(...await this.auditAuthentication());

    const detectedIssues = issues.filter(issue => issue.detected);
    const criticalIssues = detectedIssues.filter(issue => issue.severity === 'CRITICAL').length;
    const highIssues = detectedIssues.filter(issue => issue.severity === 'HIGH').length;
    const score = this.calculateSecurityScore(issues);

    return { score, criticalIssues, highIssues };
  }

  // 보안 감사 보고서 생성
  generateAuditReport(auditResult: SecurityAuditResult): string {
    const report = [
      '# 보안 감사 보고서',
      `**실행 시간**: ${auditResult.timestamp.toLocaleString()}`,
      `**보안 점수**: ${auditResult.score}/100`,
      `**보안 수준**: ${auditResult.level}`,
      '',
      '## 발견된 보안 이슈',
    ];

    if (auditResult.issues.length === 0) {
      report.push('✅ 심각한 보안 이슈가 발견되지 않았습니다.');
    } else {
      auditResult.issues.forEach((issue, index) => {
        report.push(
          `### ${index + 1}. ${issue.title} (${issue.severity})`,
          `**카테고리**: ${issue.category}`,
          `**설명**: ${issue.description}`,
          `**영향**: ${issue.impact}`,
          `**해결방안**: ${issue.solution}`,
          ''
        );
      });
    }

    report.push(
      '## 권장사항',
      ...auditResult.recommendations.map(rec => `- ${rec}`),
      '',
      '---',
      '*이 보고서는 자동화된 보안 감사 도구에 의해 생성되었습니다.*'
    );

    return report.join('\n');
  }
}

// 싱글톤 인스턴스 export
export const securityAuditor = SecurityAuditor.getInstance();