/**
 * 네트워크 연결 상태를 확인하고 오류를 처리하기 위한 유틸리티 함수
 */
import { Alert } from 'react-native';

// 네트워크 요청을 위한 재시도 래퍼 함수
export async function withRetry<T>(
  operation: () => Promise<T>, 
  maxRetries = 3, 
  retryDelay = 1000
): Promise<T> {
  let retries = 0;
  
  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      retries++;
      
      if (retries >= maxRetries) {
        console.error(`Operation failed after ${maxRetries} retries:`, error);
        
        // 오류 메시지 사용자에게 표시
        const errorMessage = error?.message || '네트워크 요청 실패';
        Alert.alert('네트워크 오류', `${errorMessage}\n\n인터넷 연결을 확인하고 다시 시도해주세요.`);
        
        throw error;
      }
      
      console.log(`Retry attempt ${retries}/${maxRetries}...`);
      // 지수 백오프를 사용하여 재시도 대기 시간 증가
      await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, retries - 1)));
    }
  }
}

// 오프라인 작업을 위한 캐시 함수 (추후 구현 가능)
export function setupOfflineSupport() {
  // TODO: AsyncStorage를 사용한 오프라인 지원 구현
}
