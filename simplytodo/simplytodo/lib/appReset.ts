import { supabase } from './supabase';
import { Platform } from 'react-native';

/**
 * 앱 상태를 완전히 초기화하는 유틸리티 함수
 */
export const resetApp = async (): Promise<void> => {
  console.log('앱 상태 초기화 시작...');
  
  try {
    // 1. Supabase 세션 완전 제거
    console.log('Supabase 세션 제거 중...');
    await supabase.auth.signOut({ scope: 'global' });
    
    // 2. 플랫폼별 스토리지 정리
    console.log('로컬 스토리지 정리 중...');
    
    if (Platform.OS === 'web') {
      // 웹에서는 localStorage 정리
      if (typeof window !== 'undefined') {
        const keysToRemove = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && (
            key.includes('supabase') || 
            key.includes('auth') || 
            key.includes('session') ||
            key.includes('refresh') ||
            key.includes('token')
          )) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => window.localStorage.removeItem(key));
        console.log(`${keysToRemove.length}개의 인증 관련 키 삭제됨`);
      }
    } else {
      // React Native에서는 AsyncStorage 정리
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const keys = await AsyncStorage.getAllKeys();
      const supabaseKeys = keys.filter(key => 
        key.includes('supabase') || 
        key.includes('auth') || 
        key.includes('session') ||
        key.includes('refresh') ||
        key.includes('token')
      );
      
      if (supabaseKeys.length > 0) {
        await AsyncStorage.multiRemove(supabaseKeys);
        console.log(`${supabaseKeys.length}개의 인증 관련 키 삭제됨`);
      }
    }
    
    // 3. 메모리 정리를 위한 약간의 대기
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('앱 상태 초기화 완료');
    return Promise.resolve();
    
  } catch (error) {
    console.error('앱 상태 초기화 실패:', error);
    throw error;
  }
};


/**
 * Supabase 연결 상태 확인 함수
 */
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.getSession();
    if (error) {
      console.log('Supabase 연결 오류:', error);
      return false;
    }
    console.log('Supabase 연결 정상');
    return true;
  } catch (error) {
    console.log('Supabase 연결 실패:', error);
    return false;
  }
};