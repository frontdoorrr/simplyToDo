import { supabase } from './supabase';
import { logger } from './logger';
import { SocialAuthError, SocialAuthErrorType, SocialAuthErrorReporter } from './socialAuthErrors';

// 사용자 프로필 타입
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  provider: 'email' | 'google' | 'apple';
  primary_provider?: string;
  
  // 소셜 프로바이더 관련 정보
  google_id?: string;
  google_email?: string;
  apple_id?: string;
  apple_email?: string;
  apple_real_user_status?: string;
  
  // 계정 관리 정보
  merged_accounts?: string[];
  last_sign_in_at?: string;
  created_at: string;
  updated_at?: string;
}

// 프로필 업데이트 요청 타입
export interface ProfileUpdateRequest {
  full_name?: string;
  avatar_url?: string;
}

export class UserProfileService {
  private static instance: UserProfileService;

  private constructor() {}

  static getInstance(): UserProfileService {
    if (!UserProfileService.instance) {
      UserProfileService.instance = new UserProfileService();
    }
    return UserProfileService.instance;
  }

  // 현재 사용자 프로필 조회
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      return this.mapSupabaseUserToProfile(user);
    } catch (error) {
      logger.error('Failed to get current user profile:', error);
      return null;
    }
  }

  // 사용자 프로필 업데이트
  async updateUserProfile(updates: ProfileUpdateRequest): Promise<void> {
    try {
      logger.auth('Updating user profile:', updates);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new SocialAuthError(
          SocialAuthErrorType.ACCOUNT_LINKING_ERROR,
          '사용자 인증이 필요합니다.',
          'User not authenticated'
        );
      }

      // Supabase Auth의 user metadata 업데이트
      const { error } = await supabase.auth.updateUser({
        data: {
          ...updates,
          updated_at: new Date().toISOString(),
        }
      });

      if (error) {
        throw error;
      }

      logger.auth('User profile updated successfully');
    } catch (error) {
      logger.error('Failed to update user profile:', error);
      
      const authError = new SocialAuthError(
        SocialAuthErrorType.ACCOUNT_LINKING_ERROR,
        '프로필 업데이트에 실패했습니다.',
        (error as any)?.message || 'Unknown error occurred',
        error
      );
      SocialAuthErrorReporter.recordError(authError);
      throw authError;
    }
  }

  // 프로필 사진 업데이트 (URL 기반)
  async updateAvatarUrl(avatarUrl: string): Promise<void> {
    try {
      await this.updateUserProfile({ avatar_url: avatarUrl });
      logger.auth('Avatar URL updated successfully');
    } catch (error) {
      logger.error('Failed to update avatar URL:', error);
      throw error;
    }
  }

  // 소셜 프로바이더에서 프로필 정보 동기화
  async syncProfileFromProvider(provider: 'google' | 'apple'): Promise<void> {
    try {
      logger.auth('Syncing profile from provider:', provider);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new SocialAuthError(
          SocialAuthErrorType.ACCOUNT_LINKING_ERROR,
          '사용자 인증이 필요합니다.',
          'User not authenticated'
        );
      }

      // 프로바이더별 프로필 정보 동기화
      let updates: ProfileUpdateRequest = {};

      if (provider === 'google') {
        // Google 프로필 정보가 메타데이터에 있는 경우
        const googleName = user.user_metadata?.google_name || user.user_metadata?.full_name;
        const googleAvatar = user.user_metadata?.google_avatar || user.user_metadata?.avatar_url;

        if (googleName) updates.full_name = googleName;
        if (googleAvatar) updates.avatar_url = googleAvatar;

      } else if (provider === 'apple') {
        // Apple 프로필 정보는 이름만 제공됨 (프로필 사진 없음)
        const appleName = user.user_metadata?.apple_name || user.user_metadata?.full_name;
        
        if (appleName) updates.full_name = appleName;
        // Apple은 프로필 사진을 제공하지 않으므로 avatar_url은 null로 설정하지 않음
      }

      if (Object.keys(updates).length > 0) {
        await this.updateUserProfile(updates);
        logger.auth('Profile synced from provider successfully');
      } else {
        logger.auth('No profile updates needed from provider');
      }

    } catch (error) {
      logger.error('Failed to sync profile from provider:', error);
      throw error;
    }
  }

  // 계정 연결 시 프로필 정보 병합
  async mergeProfileData(primaryProfile: UserProfile, secondaryData: any): Promise<void> {
    try {
      logger.auth('Merging profile data');

      const updates: ProfileUpdateRequest = {};

      // 이름이 없는 경우 보조 계정의 이름 사용
      if (!primaryProfile.full_name && secondaryData.name) {
        updates.full_name = secondaryData.name;
      }

      // 프로필 사진이 없는 경우 보조 계정의 사진 사용
      if (!primaryProfile.avatar_url && secondaryData.avatar_url) {
        updates.avatar_url = secondaryData.avatar_url;
      }

      if (Object.keys(updates).length > 0) {
        await this.updateUserProfile(updates);
        logger.auth('Profile data merged successfully');
      }

    } catch (error) {
      logger.error('Failed to merge profile data:', error);
      throw error;
    }
  }

  // 프로필 정보 유효성 검사
  validateProfileData(data: ProfileUpdateRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 이름 유효성 검사
    if (data.full_name !== undefined) {
      if (typeof data.full_name !== 'string') {
        errors.push('이름은 문자열이어야 합니다.');
      } else if (data.full_name.trim().length === 0) {
        errors.push('이름은 비어있을 수 없습니다.');
      } else if (data.full_name.length > 100) {
        errors.push('이름은 100자를 초과할 수 없습니다.');
      }
    }

    // 아바타 URL 유효성 검사
    if (data.avatar_url !== undefined) {
      if (typeof data.avatar_url !== 'string') {
        errors.push('프로필 사진 URL은 문자열이어야 합니다.');
      } else if (data.avatar_url.length > 0) {
        // URL 형식 간단 검증
        try {
          new URL(data.avatar_url);
        } catch {
          errors.push('올바른 프로필 사진 URL이 아닙니다.');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Supabase User를 UserProfile로 변환
  private mapSupabaseUserToProfile(user: any): UserProfile {
    return {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || user.user_metadata?.name,
      avatar_url: user.user_metadata?.avatar_url,
      provider: (user.app_metadata?.provider || 'email') as 'email' | 'google' | 'apple',
      primary_provider: user.user_metadata?.primary_provider,
      
      // 소셜 프로바이더 정보
      google_id: user.user_metadata?.google_id || user.user_metadata?.provider_id,
      google_email: user.user_metadata?.google_email,
      apple_id: user.user_metadata?.apple_id || user.user_metadata?.provider_id,
      apple_email: user.user_metadata?.apple_email,
      apple_real_user_status: user.user_metadata?.apple_real_user_status,
      
      // 계정 관리 정보
      merged_accounts: user.user_metadata?.merged_accounts,
      last_sign_in_at: user.user_metadata?.last_sign_in_at || user.last_sign_in_at,
      created_at: user.created_at,
      updated_at: user.user_metadata?.updated_at || user.updated_at,
    };
  }

  // 프로필 정보 로깅 (민감한 정보 제외)
  logProfileInfo(profile: UserProfile): void {
    logger.auth('User profile info:', {
      id: profile.id,
      email: profile.email ? `${profile.email.substring(0, 3)}***` : 'none',
      hasName: !!profile.full_name,
      hasAvatar: !!profile.avatar_url,
      provider: profile.provider,
      primaryProvider: profile.primary_provider,
      createdAt: profile.created_at,
    });
  }
}

// 싱글톤 인스턴스 export
export const userProfileService = UserProfileService.getInstance();