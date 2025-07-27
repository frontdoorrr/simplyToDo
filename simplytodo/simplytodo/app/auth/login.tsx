import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { supabase, categoriesApi } from '@/lib/supabase';
import { router } from 'expo-router';
import { DefaultCategories } from '@/types/Todo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TodoColors } from '@/constants/Colors';
import { logger } from '@/lib/logger';
import { socialAuthService } from '@/lib/socialAuthService';
import SocialLoginButton from '@/components/auth/SocialLoginButton';
import { getSupportedProviders } from '@/lib/platformUtils';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [signUpMode, setSignUpMode] = useState(false);
  const [socialLoading, setSocialLoading] = useState<{
    google: boolean;
    apple: boolean;
  }>({
    google: false,
    apple: false,
  });
  const [supportedProviders, setSupportedProviders] = useState<('google' | 'apple')[]>([]);

  // 지원되는 소셜 로그인 프로바이더 확인
  useEffect(() => {
    const providers = getSupportedProviders();
    setSupportedProviders(providers);
    logger.debug('Supported social providers:', providers);
  }, []);

  // 기본 카테고리를 생성하는 함수
  const createDefaultCategories = async (userId: string) => {
    try {
      // 기본 카테고리 생성
      const promises = DefaultCategories.map(category => {
        return categoriesApi.addCategory({
          name: category.name,
          color: category.color,
          user_id: userId
        });
      });
      
      await Promise.all(promises);
      logger.auth('기본 카테고리 생성 완료');
    } catch (error) {
      logger.error('기본 카테고리 생성 오류:', error);
    }
  };
  
  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      if (signUpMode) {
        // 회원가입
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) throw error;
        
        // 사용자가 생성되었으면 기본 카테고리 생성
        if (data?.user?.id) {
          await createDefaultCategories(data.user.id);
        }
        
        Alert.alert('가입 성공', '이메일을 확인해주세요. 확인 링크를 클릭하여 가입을 완료해주세요.');
        setSignUpMode(false);
      } else {
        // 로그인
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        // AuthContext가 자동으로 상태를 업데이트하여 라우팅 처리됨
      }
    } catch (error: any) {
      if (
        error?.message &&
        error.message.toLowerCase().includes('invalid login credentials')
      ) {
        Alert.alert('로그인 실패', '아이디와 비밀번호를 확인해주세요.');
      } else {
        Alert.alert('오류', error.message || '인증 과정에서 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 비밀번호 재설정 메일 전송
  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('오류', '비밀번호를 재설정할 이메일을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) throw error;
      Alert.alert('성공', '비밀번호 재설정 링크가 이메일로 전송되었습니다.');
    } catch (error: any) {
      Alert.alert('오류', error.message || '비밀번호 재설정 메일 발송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Google 로그인 처리
  const handleGoogleSignIn = async () => {
    try {
      setSocialLoading(prev => ({ ...prev, google: true }));
      
      const result = await socialAuthService.signInWithGoogle();
      
      if (result.success && result.user) {
        // 신규 사용자인 경우 기본 카테고리 생성
        if (result.user.id) {
          await createDefaultCategories(result.user.id);
        }
        
        logger.auth('Google social login successful');
        // AuthContext가 자동으로 상태를 업데이트하여 라우팅 처리됨
      } else {
        Alert.alert('Google 로그인 실패', result.error || '알 수 없는 오류가 발생했습니다.');
      }
    } catch (error: any) {
      logger.error('Google social login error:', error);
      Alert.alert('Google 로그인 오류', error.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setSocialLoading(prev => ({ ...prev, google: false }));
    }
  };

  // Apple 로그인 처리
  const handleAppleSignIn = async () => {
    try {
      setSocialLoading(prev => ({ ...prev, apple: true }));
      
      const result = await socialAuthService.signInWithApple();
      
      if (result.success && result.user) {
        // 신규 사용자인 경우 기본 카테고리 생성
        if (result.user.id) {
          await createDefaultCategories(result.user.id);
        }
        
        logger.auth('Apple social login successful');
        // AuthContext가 자동으로 상태를 업데이트하여 라우팅 처리됨
      } else {
        Alert.alert('Apple 로그인 실패', result.error || '알 수 없는 오류가 발생했습니다.');
      }
    } catch (error: any) {
      logger.error('Apple social login error:', error);
      Alert.alert('Apple 로그인 오류', error.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setSocialLoading(prev => ({ ...prev, apple: false }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Simply ToDo</Text>
        <Text style={styles.subtitle}>
          {signUpMode ? '새 계정 만들기' : '로그인'}
        </Text>

        {/* 소셜 로그인 버튼들 - 플랫폼별 지원 */}
        {supportedProviders.length > 0 && (
          <View style={styles.socialButtonsContainer}>
            {supportedProviders.includes('google') && (
              <SocialLoginButton
                provider="google"
                onPress={handleGoogleSignIn}
                loading={socialLoading.google}
                disabled={loading || socialLoading.apple}
              />
            )}
            
            {supportedProviders.includes('apple') && (
              <SocialLoginButton
                provider="apple"
                onPress={handleAppleSignIn}
                loading={socialLoading.apple}
                disabled={loading || socialLoading.google}
              />
            )}
          </View>
        )}

        {/* 구분선 */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>또는</Text>
          <View style={styles.dividerLine} />
        </View>

        <TextInput
          style={styles.input}
          placeholder="이메일"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleAuth}
          disabled={loading || socialLoading.google || socialLoading.apple}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {signUpMode ? '가입하기' : '로그인'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setSignUpMode(!signUpMode)}
          disabled={loading || socialLoading.google || socialLoading.apple}
        >
          <Text style={styles.secondaryButtonText}>
            {signUpMode ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 가입하기'}
          </Text>
        </TouchableOpacity>

        {!signUpMode && (
          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={handleForgotPassword}
            disabled={loading || socialLoading.google || socialLoading.apple}
          >
            <Text style={styles.forgotPasswordText}>비밀번호를 잊으셨나요?</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TodoColors.background.app,
  },
  formContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: TodoColors.primary,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: TodoColors.text.secondary,
  },
  socialButtonsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 14,
    color: TodoColors.text.secondary,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  button: {
    backgroundColor: TodoColors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    padding: 15,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: TodoColors.primary,
    fontSize: 14,
  },
  forgotPasswordButton: {
    padding: 15,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: TodoColors.text.secondary,
    fontSize: 14,
  },
});
