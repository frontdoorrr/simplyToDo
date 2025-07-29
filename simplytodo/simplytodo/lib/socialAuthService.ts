import { logger } from './logger';
import { PlatformUtils } from './platformUtils';

// 소셜 인증 결과 타입
export interface SocialAuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
    provider: 'google' | 'apple';
  };
  session?: any;
  error?: string;
}

// 소셜 프로바이더 정보 타입
export interface SocialProvider {
  provider: 'google' | 'apple';
  provider_id: string;
  provider_email?: string;
  connected_at: Date;
  last_used_at: Date;
  is_active: boolean;
}

export class SocialAuthService {
  private static instance: SocialAuthService;

  private constructor() {
    // 개발 환경에서는 소셜 로그인 초기화 비활성화
    logger.debug('SocialAuthService initialized in development mode (social login disabled)');
    
    // 플랫폼 지원 상태 로그
    PlatformUtils.logPlatformCapabilities();
  }

  static getInstance(): SocialAuthService {
    if (!SocialAuthService.instance) {
      SocialAuthService.instance = new SocialAuthService();
    }
    return SocialAuthService.instance;
  }

  // Google 로그인 (개발 환경에서 비활성화)
  async signInWithGoogle(): Promise<SocialAuthResult> {
    logger.debug('Google Sign-In disabled in development environment');
    return {
      success: false,
      error: 'Google Sign-In이 개발 환경에서 비활성화되었습니다. 나중에 API 키를 설정한 후 사용하세요.'
    };
  }

  // Apple 로그인 (개발 환경에서 비활성화)
  async signInWithApple(): Promise<SocialAuthResult> {
    logger.debug('Apple Sign-In disabled in development environment');
    return {
      success: false,
      error: 'Apple Sign-In이 개발 환경에서 비활성화되었습니다. 나중에 API 키를 설정한 후 사용하세요.'
    };
  }

  // Google 계정 연결 (개발 환경에서 비활성화)
  async linkGoogleAccount(_userId: string): Promise<void> {
    logger.debug('Google account linking disabled in development environment');
    throw new Error('Google 계정 연결이 개발 환경에서 비활성화되었습니다.');
  }

  // Apple 계정 연결 (개발 환경에서 비활성화)
  async linkAppleAccount(_userId: string): Promise<void> {
    logger.debug('Apple account linking disabled in development environment');
    throw new Error('Apple 계정 연결이 개발 환경에서 비활성화되었습니다.');
  }

  // Google 계정 연결 해제 (개발 환경에서 비활성화)
  async unlinkGoogleAccount(_userId: string): Promise<void> {
    logger.debug('Google account unlinking disabled in development environment');
    throw new Error('Google 계정 연결 해제가 개발 환경에서 비활성화되었습니다.');
  }

  // Apple 계정 연결 해제 (개발 환경에서 비활성화)
  async unlinkAppleAccount(_userId: string): Promise<void> {
    logger.debug('Apple account unlinking disabled in development environment');
    throw new Error('Apple 계정 연결 해제가 개발 환경에서 비활성화되었습니다.');
  }

  // 연결된 계정 목록 조회 (개발 환경에서 빈 배열 반환)
  async getConnectedAccounts(_userId: string): Promise<SocialProvider[]> {
    logger.debug('Connected accounts query disabled in development environment');
    return [];
  }

  // 소셜 계정 보안 위험 처리 (개발 환경에서 비활성화)
  async handleSocialAccountSecurityRisk(
    provider: 'google' | 'apple',
    riskType: 'COMPROMISE' | 'DEACTIVATION' | 'POLICY_VIOLATION'
  ): Promise<void> {
    logger.debug(`Social account security risk handling disabled in development environment: ${provider} - ${riskType}`);
  }

  // 현재 사용자 ID 가져오기 (개발 환경에서 비활성화)
  private async _getCurrentUserId(): Promise<string> {
    throw new Error('User ID query disabled in development environment');
  }
}

// 전역 인스턴스 생성
export const socialAuthService = SocialAuthService.getInstance();