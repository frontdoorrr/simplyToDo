import { logger } from './logger';

// 소셜 인증 에러 타입
export enum SocialAuthErrorType {
  // 일반 에러
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  
  // Google 관련 에러
  GOOGLE_SIGNIN_CANCELLED = 'GOOGLE_SIGNIN_CANCELLED',
  GOOGLE_SIGNIN_IN_PROGRESS = 'GOOGLE_SIGNIN_IN_PROGRESS',
  GOOGLE_PLAY_SERVICES_NOT_AVAILABLE = 'GOOGLE_PLAY_SERVICES_NOT_AVAILABLE',
  GOOGLE_TOKEN_ERROR = 'GOOGLE_TOKEN_ERROR',
  
  // Apple 관련 에러
  APPLE_SIGNIN_NOT_AVAILABLE = 'APPLE_SIGNIN_NOT_AVAILABLE',
  APPLE_SIGNIN_CANCELLED = 'APPLE_SIGNIN_CANCELLED',
  APPLE_TOKEN_ERROR = 'APPLE_TOKEN_ERROR',
  APPLE_PLATFORM_NOT_SUPPORTED = 'APPLE_PLATFORM_NOT_SUPPORTED',
  
  // Supabase 관련 에러
  SUPABASE_AUTH_ERROR = 'SUPABASE_AUTH_ERROR',
  SUPABASE_NETWORK_ERROR = 'SUPABASE_NETWORK_ERROR',
  
  // 토큰 관련 에러
  TOKEN_STORAGE_ERROR = 'TOKEN_STORAGE_ERROR',
  TOKEN_RETRIEVAL_ERROR = 'TOKEN_RETRIEVAL_ERROR',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // 계정 관리 에러
  ACCOUNT_LINKING_ERROR = 'ACCOUNT_LINKING_ERROR',
  ACCOUNT_UNLINKING_ERROR = 'ACCOUNT_UNLINKING_ERROR',
  ACCOUNT_MERGE_ERROR = 'ACCOUNT_MERGE_ERROR',
}

// 소셜 인증 에러 클래스
export class SocialAuthError extends Error {
  public readonly type: SocialAuthErrorType;
  public readonly userMessage: string;
  public readonly technicalDetails?: any;
  public readonly timestamp: Date;

  constructor(
    type: SocialAuthErrorType,
    userMessage: string,
    technicalMessage?: string,
    technicalDetails?: any
  ) {
    super(technicalMessage || userMessage);
    this.name = 'SocialAuthError';
    this.type = type;
    this.userMessage = userMessage;
    this.technicalDetails = technicalDetails;
    this.timestamp = new Date();

    // 로그에 에러 기록
    logger.error(`SocialAuthError [${type}]:`, {
      userMessage,
      technicalMessage: technicalMessage || userMessage,
      technicalDetails,
    });
  }

  // 사용자에게 표시할 친화적인 메시지 반환
  getUserMessage(): string {
    return this.userMessage;
  }

  // 기술적 세부사항 반환 (디버깅용)
  getTechnicalDetails(): any {
    return {
      type: this.type,
      message: this.message,
      details: this.technicalDetails,
      timestamp: this.timestamp,
    };
  }
}

// 에러 팩토리 함수들
export class SocialAuthErrorFactory {
  // Google 에러 생성
  static createGoogleError(originalError: any): SocialAuthError {
    const errorCode = originalError?.code;
    
    switch (errorCode) {
      case '12501': // SIGN_IN_CANCELLED
        return new SocialAuthError(
          SocialAuthErrorType.GOOGLE_SIGNIN_CANCELLED,
          '로그인이 취소되었습니다.',
          'Google sign-in was cancelled by user',
          originalError
        );
        
      case '12502': // SIGN_IN_IN_PROGRESS
        return new SocialAuthError(
          SocialAuthErrorType.GOOGLE_SIGNIN_IN_PROGRESS,
          '로그인이 진행 중입니다. 잠시 후 다시 시도해주세요.',
          'Google sign-in is already in progress',
          originalError
        );
        
      case '2': // PLAY_SERVICES_NOT_AVAILABLE
        return new SocialAuthError(
          SocialAuthErrorType.GOOGLE_PLAY_SERVICES_NOT_AVAILABLE,
          'Google Play Services를 사용할 수 없습니다. 앱을 업데이트하거나 기기 설정을 확인해주세요.',
          'Google Play Services not available',
          originalError
        );
        
      default:
        return new SocialAuthError(
          SocialAuthErrorType.GOOGLE_TOKEN_ERROR,
          'Google 로그인에 실패했습니다. 네트워크 연결을 확인하고 다시 시도해주세요.',
          `Google authentication failed: ${originalError?.message}`,
          originalError
        );
    }
  }

  // Apple 에러 생성
  static createAppleError(originalError: any): SocialAuthError {
    const errorCode = originalError?.code;
    
    switch (errorCode) {
      case '1001': // ASAuthorizationErrorCanceled
        return new SocialAuthError(
          SocialAuthErrorType.APPLE_SIGNIN_CANCELLED,
          '로그인이 취소되었습니다.',
          'Apple sign-in was cancelled by user',
          originalError
        );
        
      case '1000': // ASAuthorizationErrorUnknown
        return new SocialAuthError(
          SocialAuthErrorType.APPLE_TOKEN_ERROR,
          'Apple 로그인에 실패했습니다. 다시 시도해주세요.',
          'Apple authentication failed with unknown error',
          originalError
        );
        
      default:
        if (originalError?.message?.includes('not available')) {
          return new SocialAuthError(
            SocialAuthErrorType.APPLE_SIGNIN_NOT_AVAILABLE,
            'Apple 로그인을 사용할 수 없습니다. iOS 13 이상에서만 지원됩니다.',
            'Apple Sign In not available on this device',
            originalError
          );
        }
        
        return new SocialAuthError(
          SocialAuthErrorType.APPLE_TOKEN_ERROR,
          'Apple 로그인에 실패했습니다. 다시 시도해주세요.',
          `Apple authentication failed: ${originalError?.message}`,
          originalError
        );
    }
  }

  // Supabase 에러 생성
  static createSupabaseError(originalError: any): SocialAuthError {
    const errorMessage = originalError?.message?.toLowerCase() || '';
    
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return new SocialAuthError(
        SocialAuthErrorType.SUPABASE_NETWORK_ERROR,
        '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인하고 다시 시도해주세요.',
        `Supabase network error: ${originalError?.message}`,
        originalError
      );
    }
    
    if (errorMessage.includes('invalid') || errorMessage.includes('token')) {
      return new SocialAuthError(
        SocialAuthErrorType.SUPABASE_AUTH_ERROR,
        '인증에 실패했습니다. 다시 로그인해주세요.',
        `Supabase auth error: ${originalError?.message}`,
        originalError
      );
    }
    
    return new SocialAuthError(
      SocialAuthErrorType.SUPABASE_AUTH_ERROR,
      '서버 인증에 실패했습니다. 잠시 후 다시 시도해주세요.',
      `Supabase error: ${originalError?.message}`,
      originalError
    );
  }

  // 토큰 관련 에러 생성
  static createTokenError(type: SocialAuthErrorType, originalError?: any): SocialAuthError {
    const errorMessages: Record<SocialAuthErrorType, string> = {
      [SocialAuthErrorType.UNKNOWN_ERROR]: '알 수 없는 오류가 발생했습니다.',
      [SocialAuthErrorType.NETWORK_ERROR]: '네트워크 오류가 발생했습니다.',
      [SocialAuthErrorType.CONFIGURATION_ERROR]: '설정 오류가 발생했습니다.',
      [SocialAuthErrorType.GOOGLE_SIGNIN_CANCELLED]: 'Google 로그인이 취소되었습니다.',
      [SocialAuthErrorType.GOOGLE_SIGNIN_IN_PROGRESS]: 'Google 로그인이 진행 중입니다.',
      [SocialAuthErrorType.GOOGLE_PLAY_SERVICES_NOT_AVAILABLE]: 'Google Play Services를 사용할 수 없습니다.',
      [SocialAuthErrorType.GOOGLE_TOKEN_ERROR]: 'Google 토큰 오류가 발생했습니다.',
      [SocialAuthErrorType.APPLE_SIGNIN_NOT_AVAILABLE]: 'Apple Sign-In을 사용할 수 없습니다.',
      [SocialAuthErrorType.APPLE_SIGNIN_CANCELLED]: 'Apple 로그인이 취소되었습니다.',
      [SocialAuthErrorType.APPLE_TOKEN_ERROR]: 'Apple 토큰 오류가 발생했습니다.',
      [SocialAuthErrorType.APPLE_PLATFORM_NOT_SUPPORTED]: 'Apple Sign-In이 지원되지 않는 플랫폼입니다.',
      [SocialAuthErrorType.SUPABASE_AUTH_ERROR]: 'Supabase 인증 오류가 발생했습니다.',
      [SocialAuthErrorType.SUPABASE_NETWORK_ERROR]: 'Supabase 네트워크 오류가 발생했습니다.',
      [SocialAuthErrorType.TOKEN_STORAGE_ERROR]: '토큰 저장에 실패했습니다.',
      [SocialAuthErrorType.TOKEN_RETRIEVAL_ERROR]: '토큰 조회에 실패했습니다.',
      [SocialAuthErrorType.TOKEN_INVALID]: '인증 토큰이 유효하지 않습니다.',
      [SocialAuthErrorType.TOKEN_EXPIRED]: '인증 토큰이 만료되었습니다. 다시 로그인해주세요.',
      [SocialAuthErrorType.ACCOUNT_LINKING_ERROR]: '계정 연결 중 오류가 발생했습니다.',
      [SocialAuthErrorType.ACCOUNT_UNLINKING_ERROR]: '계정 연결 해제 중 오류가 발생했습니다.',
      [SocialAuthErrorType.ACCOUNT_MERGE_ERROR]: '계정 병합 중 오류가 발생했습니다.',
    };
    
    return new SocialAuthError(
      type,
      errorMessages[type] || '토큰 처리 중 오류가 발생했습니다.',
      originalError?.message,
      originalError
    );
  }

  // 일반 에러 생성
  static createGenericError(originalError: any, userMessage?: string): SocialAuthError {
    return new SocialAuthError(
      SocialAuthErrorType.UNKNOWN_ERROR,
      userMessage || '예상치 못한 오류가 발생했습니다. 다시 시도해주세요.',
      originalError?.message || 'Unknown error occurred',
      originalError
    );
  }
}

// 에러 리포팅 및 분석
export class SocialAuthErrorReporter {
  private static errorStats: Map<SocialAuthErrorType, number> = new Map();

  // 에러 통계 기록
  static recordError(error: SocialAuthError): void {
    const currentCount = this.errorStats.get(error.type) || 0;
    this.errorStats.set(error.type, currentCount + 1);
    
    // 심각한 에러는 즉시 리포팅
    if (this.isCriticalError(error.type)) {
      this.reportCriticalError(error);
    }
  }

  // 심각한 에러 판단
  private static isCriticalError(type: SocialAuthErrorType): boolean {
    return [
      SocialAuthErrorType.CONFIGURATION_ERROR,
      SocialAuthErrorType.TOKEN_STORAGE_ERROR,
      SocialAuthErrorType.ACCOUNT_MERGE_ERROR,
    ].includes(type);
  }

  // 심각한 에러 리포팅
  private static reportCriticalError(error: SocialAuthError): void {
    logger.error('CRITICAL SOCIAL AUTH ERROR:', {
      type: error.type,
      message: error.message,
      timestamp: error.timestamp,
      details: error.technicalDetails,
    });
    
    // 향후 원격 에러 리포팅 서비스 연동 (Sentry 등)
    // reportToSentry(error);
  }

  // 에러 통계 조회
  static getErrorStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.errorStats.forEach((count, type) => {
      stats[type] = count;
    });
    return stats;
  }

  // 에러 통계 초기화
  static clearStats(): void {
    this.errorStats.clear();
  }
}

// 편의 함수들
export const createGoogleError = SocialAuthErrorFactory.createGoogleError;
export const createAppleError = SocialAuthErrorFactory.createAppleError;
export const createSupabaseError = SocialAuthErrorFactory.createSupabaseError;
export const createTokenError = SocialAuthErrorFactory.createTokenError;
export const createGenericError = SocialAuthErrorFactory.createGenericError;