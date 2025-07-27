import { Platform } from 'react-native';
import { logger } from './logger';

// 플랫폼별 네이티브 모듈 로더
export class PlatformUtils {

  // Apple Authentication 모듈 안전 로드 (현재 비활성화)
  static loadAppleAuth(): { 
    AppleAuth: any; 
    AppleAuthRequestOperation: any; 
    AppleAuthRequestScope: any; 
  } | null {
    // 개발 환경에서는 Apple Sign-In 비활성화
    logger.debug('Apple Authentication disabled in development environment');
    return null;
  }

  // Apple Authentication 사용 가능 여부 확인
  static isAppleAuthAvailable(): boolean {
    const modules = this.loadAppleAuth();
    if (!modules) {
      return false;
    }

    try {
      return modules.AppleAuth?.isSupported === true;
    } catch (error) {
      logger.warn('Error checking Apple Auth availability:', error);
      return false;
    }
  }

  // Google Sign-In 사용 가능 여부 확인
  static isGoogleSignInAvailable(): boolean {
    try {
      // Google Sign-In 모듈 확인
      require('@react-native-google-signin/google-signin');
      
      // 환경 변수 확인 (최소 하나는 있어야 함)
      const hasGoogleConfig = !!(
        process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 
        process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
        process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
      );
      
      if (!hasGoogleConfig) {
        logger.debug('Google Sign-In configuration not found in environment variables');
        return false;
      }
      
      return true;
    } catch (error) {
      logger.warn('Google Sign-In module not available:', error);
      return false;
    }
  }

  // 플랫폼별 지원 기능 확인
  static getSupportedSocialProviders(): ('google' | 'apple')[] {
    const supported: ('google' | 'apple')[] = [];

    if (this.isGoogleSignInAvailable()) {
      supported.push('google');
    }

    if (this.isAppleAuthAvailable()) {
      supported.push('apple');
    }

    return supported;
  }

  // 플랫폼 정보 반환
  static getPlatformInfo(): {
    os: string;
    version?: string;
    isWeb: boolean;
    isNative: boolean;
  } {
    return {
      os: Platform.OS,
      version: Platform.Version?.toString(),
      isWeb: Platform.OS === 'web',
      isNative: Platform.OS !== 'web',
    };
  }

  // 보안 저장소 사용 가능 여부
  static isSecureStorageAvailable(): boolean {
    try {
      require('expo-secure-store');
      return Platform.OS !== 'web';
    } catch (error) {
      logger.warn('Secure storage not available:', error);
      return false;
    }
  }

  // 디버그 정보 로그
  static logPlatformCapabilities(): void {
    const info = this.getPlatformInfo();
    const socialProviders = this.getSupportedSocialProviders();
    const secureStorage = this.isSecureStorageAvailable();

    logger.debug('Platform capabilities:', {
      platform: info,
      socialProviders,
      secureStorage,
    });
  }
}

// 편의 함수들
export const isAppleAuthSupported = () => PlatformUtils.isAppleAuthAvailable();
export const isGoogleSignInSupported = () => PlatformUtils.isGoogleSignInAvailable();
export const getSupportedProviders = () => PlatformUtils.getSupportedSocialProviders();
export const isPlatformNative = () => Platform.OS !== 'web';
export const isPlatformWeb = () => Platform.OS === 'web';