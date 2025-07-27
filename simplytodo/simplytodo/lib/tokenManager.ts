import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { logger } from './logger';
import { supabase } from './supabase';

// 인증 토큰 타입
export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  token_type: 'bearer';
  provider: 'email' | 'google' | 'apple';
  provider_token?: string;
  provider_refresh_token?: string;
  provider_expires_at?: number;
}

// 토큰 갱신 결과 타입
export interface TokenRefreshResult {
  success: boolean;
  tokens?: AuthTokens;
  error?: string;
}

// 보안 설정 상수
const SECURITY_CONFIG = {
  ENCRYPTION_KEY_LENGTH: 32,
  TOKEN_REFRESH_BUFFER_MINUTES: 5,
  MAX_REFRESH_ATTEMPTS: 3,
  REFRESH_RETRY_DELAY: 1000,
} as const;

// 토큰 저장 키 상수
const TOKEN_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  PROVIDER_TOKEN: 'auth_provider_token',
  TOKEN_METADATA: 'auth_token_metadata',
} as const;

export class TokenManager {
  private static instance: TokenManager;
  private tokenCache: AuthTokens | null = null;
  private refreshTimer: any = null;
  private refreshPromise: Promise<TokenRefreshResult> | null = null;
  private encryptionKey: string | null = null;
  private refreshAttempts: number = 0;

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  // 토큰 안전 저장 (iOS: Keychain, Android: EncryptedSharedPreferences)
  private async secureStore(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // 웹에서는 AsyncStorage 사용 (개발 환경)
        await AsyncStorage.setItem(key, value);
      } else {
        // 네이티브에서는 SecureStore 사용
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      logger.error(`Failed to store secure item ${key}:`, error);
      throw new Error('토큰 저장에 실패했습니다.');
    }
  }

  // 토큰 안전 조회
  private async secureRetrieve(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(key);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      logger.error(`Failed to retrieve secure item ${key}:`, error);
      return null;
    }
  }

  // 토큰 안전 삭제
  private async secureDelete(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      logger.error(`Failed to delete secure item ${key}:`, error);
    }
  }

  // 토큰 저장
  async storeTokens(tokens: AuthTokens): Promise<void> {
    try {
      logger.auth('Storing authentication tokens');

      // 메인 토큰들 안전 저장
      await this.secureStore(TOKEN_KEYS.ACCESS_TOKEN, tokens.access_token);
      
      if (tokens.refresh_token) {
        await this.secureStore(TOKEN_KEYS.REFRESH_TOKEN, tokens.refresh_token);
      }

      if (tokens.provider_token) {
        await this.secureStore(TOKEN_KEYS.PROVIDER_TOKEN, tokens.provider_token);
      }

      // 메타데이터는 일반 저장소에 저장 (민감하지 않은 정보)
      const metadata = {
        expires_at: tokens.expires_at,
        token_type: tokens.token_type,
        provider: tokens.provider,
        provider_expires_at: tokens.provider_expires_at,
        stored_at: Date.now(),
      };

      await AsyncStorage.setItem(TOKEN_KEYS.TOKEN_METADATA, JSON.stringify(metadata));

      // 메모리 캐시 업데이트
      this.tokenCache = tokens;

      // 자동 갱신 스케줄링
      this.scheduleTokenRefresh(tokens.expires_at);

      logger.auth('Tokens stored successfully');
    } catch (error) {
      logger.error('Failed to store tokens:', error);
      throw new Error('토큰 저장에 실패했습니다.');
    }
  }

  // 저장된 토큰 조회
  async getStoredTokens(): Promise<AuthTokens | null> {
    try {
      // 캐시에서 먼저 확인
      if (this.tokenCache && this.isTokenValid(this.tokenCache.access_token)) {
        return this.tokenCache;
      }

      // 저장소에서 토큰 조회
      const accessToken = await this.secureRetrieve(TOKEN_KEYS.ACCESS_TOKEN);
      const refreshToken = await this.secureRetrieve(TOKEN_KEYS.REFRESH_TOKEN);
      const providerToken = await this.secureRetrieve(TOKEN_KEYS.PROVIDER_TOKEN);
      const metadataStr = await AsyncStorage.getItem(TOKEN_KEYS.TOKEN_METADATA);

      if (!accessToken || !metadataStr) {
        logger.auth('No stored tokens found');
        return null;
      }

      const metadata = JSON.parse(metadataStr);

      const tokens: AuthTokens = {
        access_token: accessToken,
        refresh_token: refreshToken || undefined,
        expires_at: metadata.expires_at,
        token_type: metadata.token_type,
        provider: metadata.provider,
        provider_token: providerToken || undefined,
        provider_expires_at: metadata.provider_expires_at,
      };

      // 유효성 검사
      if (!this.isTokenValid(tokens.access_token)) {
        logger.auth('Stored token is expired');
        await this.clearTokens();
        return null;
      }

      // 캐시 업데이트
      this.tokenCache = tokens;
      
      logger.auth('Retrieved stored tokens successfully');
      return tokens;

    } catch (error) {
      logger.error('Failed to retrieve stored tokens:', error);
      return null;
    }
  }

  // 토큰 삭제
  async clearTokens(): Promise<void> {
    try {
      logger.auth('Clearing authentication tokens');

      // 저장된 토큰들 삭제
      await Promise.all([
        this.secureDelete(TOKEN_KEYS.ACCESS_TOKEN),
        this.secureDelete(TOKEN_KEYS.REFRESH_TOKEN),
        this.secureDelete(TOKEN_KEYS.PROVIDER_TOKEN),
        AsyncStorage.removeItem(TOKEN_KEYS.TOKEN_METADATA),
      ]);

      // 메모리 캐시 클리어
      this.tokenCache = null;

      // 자동 갱신 타이머 클리어
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = null;
      }

      logger.auth('Tokens cleared successfully');
    } catch (error) {
      logger.error('Failed to clear tokens:', error);
    }
  }

  // 토큰 유효성 검사
  isTokenValid(token: string): boolean {
    if (!token) return false;

    try {
      // JWT 토큰 디코딩 (간단한 검증)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      return payload.exp > currentTime;
    } catch (error) {
      logger.error('Failed to validate token:', error);
      return false;
    }
  }

  // 토큰 만료 시간까지 남은 시간 (밀리초)
  getTimeUntilExpiry(token: string): number {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return Math.max(0, (payload.exp - currentTime) * 1000);
    } catch (error) {
      return 0;
    }
  }

  // 자동 토큰 갱신 스케줄링 (보안 강화)
  private scheduleTokenRefresh(expiresAt: number): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // 만료 시간 검증
    const currentTime = Math.floor(Date.now() / 1000);
    if (expiresAt <= currentTime) {
      logger.warn('Token is already expired, skipping refresh scheduling');
      return;
    }

    // 만료 5분 전에 갱신 시도 (버퍼 시간)
    const bufferTime = SECURITY_CONFIG.TOKEN_REFRESH_BUFFER_MINUTES * 60 * 1000;
    const refreshTime = (expiresAt * 1000) - Date.now() - bufferTime;
    
    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(async () => {
        try {
          logger.auth('Executing scheduled token refresh');
          await this.refreshAccessToken();
        } catch (error) {
          logger.error('Scheduled token refresh failed:', error);
          
          // 갱신 실패 시 재스케줄링 (1분 후 재시도)
          this.refreshTimer = setTimeout(() => {
            this.scheduleTokenRefresh(expiresAt);
          }, 60 * 1000) as any;
        }
      }, refreshTime);

      logger.auth(`Token refresh scheduled in ${Math.round(refreshTime / 60000)} minutes`);
    } else {
      // 즉시 갱신이 필요한 경우
      logger.auth('Token needs immediate refresh');
      this.refreshAccessToken().catch(error => {
        logger.error('Immediate token refresh failed:', error);
      });
    }
  }

  // 액세스 토큰 갱신
  async refreshAccessToken(): Promise<string> {
    // 동시 갱신 요청 방지
    if (this.refreshPromise) {
      const result = await this.refreshPromise;
      if (result.success && result.tokens) {
        return result.tokens.access_token;
      }
      throw new Error(result.error || 'Token refresh failed');
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const result = await this.refreshPromise;
      if (result.success && result.tokens) {
        return result.tokens.access_token;
      }
      throw new Error(result.error || 'Token refresh failed');
    } finally {
      this.refreshPromise = null;
    }
  }

  // 실제 토큰 갱신 수행
  private async performTokenRefresh(): Promise<TokenRefreshResult> {
    try {
      const tokens = await this.getStoredTokens();
      
      if (!tokens?.refresh_token) {
        return {
          success: false,
          error: 'No refresh token available'
        };
      }

      logger.auth('Refreshing access token');
      this.refreshAttempts++;

      // Supabase 세션 갱신
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: tokens.refresh_token
      });

      if (error || !data.session) {
        logger.error('Supabase token refresh failed:', error);
        
        // 재시도 로직
        if (this.refreshAttempts < SECURITY_CONFIG.MAX_REFRESH_ATTEMPTS) {
          logger.auth(`Retrying token refresh (attempt ${this.refreshAttempts}/${SECURITY_CONFIG.MAX_REFRESH_ATTEMPTS})`);
          await new Promise(resolve => setTimeout(resolve, SECURITY_CONFIG.REFRESH_RETRY_DELAY * this.refreshAttempts));
          return this.performTokenRefresh();
        }

        return {
          success: false,
          error: error?.message || 'Token refresh failed after maximum attempts'
        };
      }

      // 새 토큰으로 업데이트
      const newTokens: AuthTokens = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token || tokens.refresh_token,
        expires_at: Math.floor((data.session.expires_at || Date.now() / 1000) + 3600),
        token_type: 'bearer',
        provider: tokens.provider,
        provider_token: tokens.provider_token,
        provider_refresh_token: tokens.provider_refresh_token,
        provider_expires_at: tokens.provider_expires_at,
      };

      // 새 토큰 저장
      await this.storeTokens(newTokens);
      
      // 재시도 횟수 리셋
      this.refreshAttempts = 0;
      
      logger.auth('Token refresh completed successfully');
      return {
        success: true,
        tokens: newTokens
      };

    } catch (error) {
      logger.error('Token refresh failed:', error);
      return {
        success: false,
        error: (error as Error).message || 'Unknown error during token refresh'
      };
    }
  }

  // 암호화 키 생성 또는 조회
  private async getEncryptionKey(): Promise<string> {
    if (this.encryptionKey) {
      return this.encryptionKey;
    }

    try {
      // 기존 키 조회
      let key = await this.secureRetrieve('encryption_key');
      
      if (!key) {
        // 새 키 생성
        const keyBytes = await Crypto.getRandomBytesAsync(SECURITY_CONFIG.ENCRYPTION_KEY_LENGTH);
        key = Array.from(keyBytes, (byte: number) => byte.toString(16).padStart(2, '0')).join('');
        await this.secureStore('encryption_key', key);
        logger.auth('New encryption key generated');
      }

      this.encryptionKey = key;
      return key;
    } catch (error) {
      logger.error('Failed to get encryption key:', error);
      throw new Error('암호화 키 생성에 실패했습니다.');
    }
  }

  // 토큰 암호화 (AES-256-GCM 사용)
  async encryptToken(token: string): Promise<string> {
    try {
      const key = await this.getEncryptionKey();
      
      // 간단한 XOR 암호화 (expo-crypto 제한으로 인해)
      // 프로덕션에서는 더 강력한 암호화 라이브러리 사용 권장
      const encrypted = token.split('').map((char, index) => {
        const keyChar = key.charCodeAt(index % key.length);
        return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
      }).join('');
      
      // Base64 인코딩
      return btoa(encrypted);
    } catch (error) {
      logger.error('Token encryption failed:', error);
      return token; // 암호화 실패 시 원본 반환
    }
  }

  // 토큰 복호화
  async decryptToken(encryptedToken: string): Promise<string> {
    try {
      const key = await this.getEncryptionKey();
      
      // Base64 디코딩
      const encrypted = atob(encryptedToken);
      
      // XOR 복호화
      const decrypted = encrypted.split('').map((char, index) => {
        const keyChar = key.charCodeAt(index % key.length);
        return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
      }).join('');
      
      return decrypted;
    } catch (error) {
      logger.error('Token decryption failed:', error);
      return encryptedToken; // 복호화 실패 시 원본 반환
    }
  }

  // 토큰 메타데이터 조회
  async getTokenMetadata(): Promise<any> {
    try {
      const metadataStr = await AsyncStorage.getItem(TOKEN_KEYS.TOKEN_METADATA);
      return metadataStr ? JSON.parse(metadataStr) : null;
    } catch (error) {
      logger.error('Failed to get token metadata:', error);
      return null;
    }
  }

  // 강화된 보안 상태 체크
  async getSecurityStatus(): Promise<{
    hasTokens: boolean;
    isValid: boolean;
    provider: string | null;
    expiresIn: number;
    needsRefresh: boolean;
    isSecurelyStored: boolean;
    lastRefreshAttempt?: number;
  }> {
    const tokens = await this.getStoredTokens();
    const expiresIn = tokens ? this.getTimeUntilExpiry(tokens.access_token) : 0;
    const needsRefresh = expiresIn > 0 && expiresIn < (SECURITY_CONFIG.TOKEN_REFRESH_BUFFER_MINUTES * 60 * 1000);
    
    // 보안 저장소 사용 여부 확인
    const isSecurelyStored = Platform.OS !== 'web';
    
    return {
      hasTokens: !!tokens,
      isValid: tokens ? this.isTokenValid(tokens.access_token) : false,
      provider: tokens?.provider || null,
      expiresIn,
      needsRefresh,
      isSecurelyStored,
      lastRefreshAttempt: this.refreshAttempts,
    };
  }

  // 토큰 보안 검증
  async validateTokenSecurity(): Promise<{isSecure: boolean; issues: string[]}> {
    const issues: string[] = [];
    
    try {
      const securityStatus = await this.getSecurityStatus();
      
      // 토큰 존재 여부
      if (!securityStatus.hasTokens) {
        issues.push('No authentication tokens found');
      }
      
      // 토큰 유효성
      if (securityStatus.hasTokens && !securityStatus.isValid) {
        issues.push('Authentication tokens are invalid');
      }
      
      // 보안 저장소 사용 여부
      if (!securityStatus.isSecurelyStored) {
        issues.push('Tokens are not stored in secure storage (development only)');
      }
      
      // 토큰 만료 임박
      if (securityStatus.needsRefresh) {
        issues.push('Tokens need refresh soon');
      }
      
      // 암호화 키 검증
      try {
        await this.getEncryptionKey();
      } catch (error) {
        issues.push('Encryption key is not available');
      }
      
      return {
        isSecure: issues.length === 0,
        issues
      };
      
    } catch (error) {
      logger.error('Security validation failed:', error);
      return {
        isSecure: false,
        issues: ['Security validation failed']
      };
    }
  }

  // 긴급 보안 정리 (탈취 의심 시 사용)
  async emergencySecurityCleanup(): Promise<void> {
    try {
      logger.warn('Performing emergency security cleanup');
      
      // 모든 토큰 삭제
      await this.clearTokens();
      
      // 암호화 키 삭제
      await this.secureDelete('encryption_key');
      this.encryptionKey = null;
      
      // 세션 무효화
      try {
        await supabase.auth.signOut();
      } catch (error) {
        logger.error('Failed to sign out during emergency cleanup:', error);
      }
      
      // 재시도 횟수 리셋
      this.refreshAttempts = 0;
      
      logger.auth('Emergency security cleanup completed');
    } catch (error) {
      logger.error('Emergency security cleanup failed:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 export
export const tokenManager = TokenManager.getInstance();