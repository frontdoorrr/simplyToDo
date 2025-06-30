import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase, categoriesApi } from '@/lib/supabase';
import { router } from 'expo-router';
import { DefaultCategories } from '@/types/Todo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TodoColors } from '@/constants/Colors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [signUpMode, setSignUpMode] = useState(false);

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
      console.log('기본 카테고리 생성 완료');
    } catch (error) {
      console.error('기본 카테고리 생성 오류:', error);
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
        // 로그인 성공 시 메인 화면으로 이동
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('오류', error.message || '인증 과정에서 오류가 발생했습니다.');
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Simply ToDo</Text>
        <Text style={styles.subtitle}>
          {signUpMode ? '새 계정 만들기' : '로그인'}
        </Text>

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
          disabled={loading}
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
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>
            {signUpMode ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 가입하기'}
          </Text>
        </TouchableOpacity>

        {!signUpMode && (
          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={handleForgotPassword}
            disabled={loading}
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
    marginBottom: 30,
    textAlign: 'center',
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
