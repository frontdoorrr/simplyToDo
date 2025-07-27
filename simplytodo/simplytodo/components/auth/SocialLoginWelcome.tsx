import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TodoColors } from '@/constants/Colors';

interface SocialLoginWelcomeProps {
  userName?: string;
  userEmail?: string;
  avatarUrl?: string;
  provider: 'google' | 'apple';
  onContinue: () => void;
  onCustomize?: () => void;
}

const SocialLoginWelcome: React.FC<SocialLoginWelcomeProps> = ({
  userName,
  userEmail,
  avatarUrl,
  provider,
  onContinue,
  onCustomize,
}) => {
  const getProviderInfo = () => {
    switch (provider) {
      case 'google':
        return {
          name: 'Google',
          icon: '🔴',
          color: '#4285f4',
        };
      case 'apple':
        return {
          name: 'Apple',
          icon: '🍎',
          color: '#000000',
        };
      default:
        return {
          name: '소셜',
          icon: '👤',
          color: TodoColors.primary,
        };
    }
  };

  const providerInfo = getProviderInfo();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>환영합니다!</Text>
        <Text style={styles.providerText}>
          {providerInfo.icon} {providerInfo.name} 계정으로 로그인되었습니다
        </Text>
      </View>

      <View style={styles.profileSection}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={40} color="#666" />
          </View>
        )}

        <View style={styles.profileInfo}>
          <Text style={styles.userName}>
            {userName || '이름 없음'}
          </Text>
          <Text style={styles.userEmail}>
            {userEmail || '이메일 없음'}
          </Text>
        </View>
      </View>

      <View style={styles.featuresSection}>
        <Text style={styles.featuresTitle}>SimplyToDo와 함께하세요</Text>
        
        <View style={styles.featureItem}>
          <Ionicons name="checkmark-circle" size={20} color={TodoColors.primary} />
          <Text style={styles.featureText}>할 일을 체계적으로 관리</Text>
        </View>
        
        <View style={styles.featureItem}>
          <Ionicons name="sync" size={20} color={TodoColors.primary} />
          <Text style={styles.featureText}>모든 기기에서 동기화</Text>
        </View>
        
        <View style={styles.featureItem}>
          <Ionicons name="analytics" size={20} color={TodoColors.primary} />
          <Text style={styles.featureText}>생산성 통계 확인</Text>
        </View>
        
        <View style={styles.featureItem}>
          <Ionicons name="notifications" size={20} color={TodoColors.primary} />
          <Text style={styles.featureText}>스마트 알림 기능</Text>
        </View>
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={onContinue}
        >
          <Text style={styles.continueButtonText}>시작하기</Text>
        </TouchableOpacity>

        {onCustomize && (
          <TouchableOpacity
            style={styles.customizeButton}
            onPress={onCustomize}
          >
            <Text style={styles.customizeButtonText}>프로필 설정하기</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.skipText}>
        언제든지 설정에서 프로필을 수정할 수 있습니다
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: TodoColors.text.primary,
    marginBottom: 10,
  },
  providerText: {
    fontSize: 16,
    color: TodoColors.text.secondary,
    textAlign: 'center',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: TodoColors.text.primary,
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: TodoColors.text.secondary,
  },
  featuresSection: {
    marginBottom: 40,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TodoColors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 16,
    color: TodoColors.text.primary,
  },
  buttonSection: {
    marginBottom: 20,
  },
  continueButton: {
    backgroundColor: TodoColors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  customizeButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: TodoColors.primary,
  },
  customizeButtonText: {
    color: TodoColors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  skipText: {
    fontSize: 14,
    color: TodoColors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SocialLoginWelcome;