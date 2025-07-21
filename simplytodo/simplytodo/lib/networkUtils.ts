/**
 * 네트워크 연결 상태를 확인하고 오류를 처리하기 위한 유틸리티 함수
 */
import { Alert } from 'react-native';
import { logger } from '@/lib/logger';

// 네트워크 에러 타입 정의
export interface NetworkError {
  code: string;
  message: string;
  isRetryable: boolean;
}

// 에러 분석 함수
export function analyzeError(error: any): NetworkError {
  const errorMessage = error?.message || '알 수 없는 오류';
  
  // 인증 관련 에러
  if (errorMessage.includes('Authentication token expired') || 
      errorMessage.includes('JWT expired') ||
      errorMessage.includes('Auth session missing') ||
      error?.status === 401) {
    return {
      code: 'AUTH_EXPIRED',
      message: '인증이 만료되었습니다. 다시 로그인해주세요.',
      isRetryable: false
    };
  }
  
  // 네트워크 연결 에러
  if (errorMessage.includes('Network request failed') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('ERR_NETWORK')) {
    return {
      code: 'NETWORK_ERROR',
      message: '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.',
      isRetryable: true
    };
  }
  
  // 타임아웃 에러
  if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
    return {
      code: 'TIMEOUT_ERROR',
      message: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
      isRetryable: true
    };
  }
  
  // 서버 에러
  if (error?.status >= 500) {
    return {
      code: 'SERVER_ERROR',
      message: '서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.',
      isRetryable: true
    };
  }
  
  // 기타 에러
  return {
    code: 'UNKNOWN_ERROR',
    message: errorMessage,
    isRetryable: false
  };
}

// 네트워크 요청을 위한 재시도 래퍼 함수
export async function withRetry<T>(
  operation: () => Promise<T>, 
  maxRetries = 3, 
  retryDelay = 1000,
  showAlert = true
): Promise<T> {
  let retries = 0;
  
  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      const networkError = analyzeError(error);
      retries++;
      
      logger.network(`[withRetry] Attempt ${retries}/${maxRetries} failed:`, networkError);
      
      // 재시도 불가능한 에러거나 최대 재시도 횟수 도달
      if (!networkError.isRetryable || retries >= maxRetries) {
        logger.error(`Operation failed after ${retries} retries:`, error);
        
        // 사용자에게 알림 표시 (옵션)
        if (showAlert) {
          Alert.alert(
            '오류 발생',
            networkError.message,
            [
              { text: '확인', style: 'default' }
            ]
          );
        }
        
        throw error;
      }
      
      logger.network(`[withRetry] Retrying in ${retryDelay * Math.pow(2, retries - 1)}ms...`);
      // 지수 백오프를 사용하여 재시도 대기 시간 증가
      await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, retries - 1)));
    }
  }
}

// 네트워크 연결 상태 확인 함수
export async function checkNetworkConnection(): Promise<boolean> {
  try {
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch (error) {
    logger.network('네트워크 연결 확인 실패:', error);
    return false;
  }
}

// 오프라인 작업을 위한 캐시 함수 (추후 구현 가능)
export function setupOfflineSupport() {
  // TODO: AsyncStorage를 사용한 오프라인 지원 구현
}
