import { AppState, Platform } from 'react-native';
import { supabase } from './supabase';
import { tokenManager, AuthTokens } from './tokenManager';
import { logger } from './logger';

// 세션 상태 타입
export interface SessionState {
  isActive: boolean;
  userId?: string;
  email?: string;
  provider?: 'email' | 'google' | 'apple';
  lastActivity: number;
  backgroundTime?: number;
}

// 세션 설정 상수
const SESSION_CONFIG = {
  BACKGROUND_TIMEOUT_MINUTES: 15, // 백그라운드에서 15분 후 세션 검증
  INACTIVITY_TIMEOUT_MINUTES: 60, // 비활성 상태 60분 후 자동 로그아웃
  HEARTBEAT_INTERVAL_MINUTES: 5,  // 5분마다 세션 상태 확인
  MAX_BACKGROUND_DURATION_HOURS: 24, // 24시간 후 강제 재인증
} as const;

export class SessionManager {
  private static instance: SessionManager;
  private currentSession: SessionState | null = null;
  private heartbeatTimer: any = null;
  private appStateSubscription: any = null;
  private isInitialized = false;

  private constructor() {
    this.initializeAppStateHandler();
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // 앱 상태 변화 핸들러 초기화
  private initializeAppStateHandler(): void {
    if (this.isInitialized) return;

    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      this.handleAppStateChange(nextAppState);
    });

    this.isInitialized = true;
    logger.auth('SessionManager initialized with app state handler');
  }

  // 앱 상태 변화 처리
  private handleAppStateChange(nextAppState: string): void {
    logger.auth(`App state changed to: ${nextAppState}`);

    switch (nextAppState) {
      case 'background':
        this.handleAppBackgrounded();
        break;
      case 'active':
        this.handleAppForegrounded();
        break;
      case 'inactive':
        // iOS에서 앱 전환 시 잠시 inactive 상태가 됨
        break;
    }
  }

  // 앱이 백그라운드로 이동할 때
  private handleAppBackgrounded(): void {
    if (this.currentSession) {
      this.currentSession.backgroundTime = Date.now();
      logger.auth('App backgrounded, session background time recorded');
    }

    // 하트비트 중지 (배터리 절약)
    this.stopHeartbeat();
  }

  // 앱이 포그라운드로 복귀할 때
  private async handleAppForegrounded(): Promise<void> {
    if (!this.currentSession) {
      logger.auth('App foregrounded but no active session');
      return;
    }

    const backgroundDuration = this.currentSession.backgroundTime 
      ? Date.now() - this.currentSession.backgroundTime 
      : 0;

    logger.auth(`App foregrounded after ${Math.round(backgroundDuration / 1000)}s in background`);

    // 백그라운드에서 너무 오래 있었으면 세션 검증
    if (backgroundDuration > SESSION_CONFIG.BACKGROUND_TIMEOUT_MINUTES * 60 * 1000) {
      logger.auth('App was in background too long, validating session');
      await this.validateSession();
    }

    // 24시간 이상 백그라운드에 있었으면 강제 재인증
    if (backgroundDuration > SESSION_CONFIG.MAX_BACKGROUND_DURATION_HOURS * 60 * 60 * 1000) {
      logger.auth('App was in background for over 24 hours, forcing re-authentication');
      await this.invalidateSession('Long background duration');
      return;
    }

    // 백그라운드 시간 클리어
    this.currentSession.backgroundTime = undefined;
    this.updateLastActivity();

    // 하트비트 재시작
    this.startHeartbeat();
  }

  // 세션 시작
  async startSession(tokens: AuthTokens): Promise<void> {
    try {
      logger.auth('Starting new session');

      // 기존 세션 정리
      await this.clearSession();

      // 사용자 정보 조회
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        throw new Error('Failed to get user information');
      }

      // 새 세션 생성
      this.currentSession = {
        isActive: true,
        userId: user.id,
        email: user.email || undefined,
        provider: tokens.provider,
        lastActivity: Date.now(),
      };

      // 하트비트 시작
      this.startHeartbeat();

      logger.auth(`Session started for user: ${user.email} (provider: ${tokens.provider})`);
    } catch (error) {
      logger.error('Failed to start session:', error);
      throw error;
    }
  }

  // 세션 종료
  async endSession(): Promise<void> {
    logger.auth('Ending current session');
    await this.clearSession();
  }

  // 세션 무효화 (강제 로그아웃)
  async invalidateSession(reason: string): Promise<void> {
    logger.warn(`Invalidating session: ${reason}`);
    
    try {
      // Supabase 세션 종료
      await supabase.auth.signOut();
      
      // 토큰 정리
      await tokenManager.clearTokens();
      
      // 세션 상태 정리
      await this.clearSession();
      
      logger.auth('Session invalidated successfully');
    } catch (error) {
      logger.error('Failed to invalidate session:', error);
      // 에러가 있어도 로컬 세션은 정리
      await this.clearSession();
    }
  }

  // 세션 상태 정리
  private async clearSession(): Promise<void> {
    this.stopHeartbeat();
    this.currentSession = null;
    logger.auth('Session cleared');
  }

  // 세션 유효성 검증
  async validateSession(): Promise<boolean> {
    try {
      if (!this.currentSession) {
        logger.auth('No active session to validate');
        return false;
      }

      // 토큰 보안 상태 확인
      const securityStatus = await tokenManager.getSecurityStatus();
      
      if (!securityStatus.hasTokens || !securityStatus.isValid) {
        logger.auth('Session validation failed: invalid tokens');
        await this.invalidateSession('Invalid tokens');
        return false;
      }

      // Supabase 세션 확인
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        logger.auth('Session validation failed: no Supabase session');
        await this.invalidateSession('No Supabase session');
        return false;
      }

      // 비활성 시간 체크
      const inactivityDuration = Date.now() - this.currentSession.lastActivity;
      const maxInactivity = SESSION_CONFIG.INACTIVITY_TIMEOUT_MINUTES * 60 * 1000;
      
      if (inactivityDuration > maxInactivity) {
        logger.auth(`Session validation failed: inactive for ${Math.round(inactivityDuration / 60000)} minutes`);
        await this.invalidateSession('Session inactive too long');
        return false;
      }

      logger.auth('Session validation successful');
      this.updateLastActivity();
      return true;

    } catch (error) {
      logger.error('Session validation error:', error);
      await this.invalidateSession('Validation error');
      return false;
    }
  }

  // 마지막 활동 시간 업데이트
  updateLastActivity(): void {
    if (this.currentSession) {
      this.currentSession.lastActivity = Date.now();
    }
  }

  // 현재 세션 상태 조회
  getCurrentSession(): SessionState | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  // 세션 활성 상태 확인
  isSessionActive(): boolean {
    return this.currentSession?.isActive || false;
  }

  // 하트비트 시작 (정기적인 세션 상태 확인)
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(async () => {
      logger.auth('Session heartbeat check');
      
      try {
        const isValid = await this.validateSession();
        
        if (!isValid) {
          logger.warn('Session heartbeat failed, stopping heartbeat');
          this.stopHeartbeat();
        }
      } catch (error) {
        logger.error('Session heartbeat error:', error);
        this.stopHeartbeat();
      }
    }, SESSION_CONFIG.HEARTBEAT_INTERVAL_MINUTES * 60 * 1000);

    logger.auth(`Session heartbeat started (${SESSION_CONFIG.HEARTBEAT_INTERVAL_MINUTES} min intervals)`);
  }

  // 하트비트 중지
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
      logger.auth('Session heartbeat stopped');
    }
  }

  // 세션 통계 조회
  getSessionStats(): {
    duration: number;
    inactivityDuration: number;
    backgroundDuration?: number;
    isHealthy: boolean;
  } {
    if (!this.currentSession) {
      return {
        duration: 0,
        inactivityDuration: 0,
        isHealthy: false,
      };
    }

    const now = Date.now();
    const duration = now - (now - this.currentSession.lastActivity); // 세션 시작 시간을 추정
    const inactivityDuration = now - this.currentSession.lastActivity;
    const backgroundDuration = this.currentSession.backgroundTime 
      ? now - this.currentSession.backgroundTime 
      : undefined;

    const isHealthy = this.currentSession.isActive && 
                     inactivityDuration < (SESSION_CONFIG.INACTIVITY_TIMEOUT_MINUTES * 60 * 1000);

    return {
      duration,
      inactivityDuration,
      backgroundDuration,
      isHealthy,
    };
  }

  // 리소스 정리 (앱 종료 시)
  dispose(): void {
    logger.auth('Disposing SessionManager');
    
    this.stopHeartbeat();
    
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    
    this.currentSession = null;
    this.isInitialized = false;
  }

  // 세션 복구 시도 (앱 시작 시)
  async restoreSession(): Promise<boolean> {
    try {
      logger.auth('Attempting to restore session');

      // 저장된 토큰 확인
      const tokens = await tokenManager.getStoredTokens();
      if (!tokens) {
        logger.auth('No stored tokens for session restore');
        return false;
      }

      // Supabase 세션 확인
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        logger.auth('No valid Supabase session for restore');
        return false;
      }

      // 세션 복구
      await this.startSession(tokens);
      logger.auth('Session restored successfully');
      return true;

    } catch (error) {
      logger.error('Session restore failed:', error);
      return false;
    }
  }
}

// 싱글톤 인스턴스 export
export const sessionManager = SessionManager.getInstance();