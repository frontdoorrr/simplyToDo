import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Alert } from 'react-native';

// 인증 컨텍스트의 타입 정의
interface AuthContextData {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

// 컨텍스트 생성
const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// 인증 상태 제공자 컴포넌트
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // 사용자 세션 로드 및 인증 상태 변경 감지
  useEffect(() => {
    // 현재 세션 가져오기
    const getInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);
      } catch (error) {
        console.error('세션 초기화 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // 인증 상태 변경 구독
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          Alert.alert('세션 만료', '로그인이 만료되었습니다. 다시 로그인 해주세요.');
          setUser(null);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // 클린업 함수
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // 로그아웃 함수
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error: any) {
      Alert.alert('로그아웃 오류', error.message);
    }
  };

  // 컨텍스트 값
  const value: AuthContextData = {
    user,
    session,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 인증 컨텍스트 사용을 위한 커스텀 훅
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.');
  }
  return context;
};
