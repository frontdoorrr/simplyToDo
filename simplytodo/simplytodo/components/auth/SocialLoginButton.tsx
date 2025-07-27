import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View, ActivityIndicator, Platform } from 'react-native';
import { TodoColors } from '@/constants/Colors';

export type SocialProvider = 'google' | 'apple';

interface SocialLoginButtonProps {
  provider: SocialProvider;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({
  provider,
  onPress,
  loading = false,
  disabled = false,
}) => {
  const getButtonConfig = () => {
    switch (provider) {
      case 'google':
        return {
          text: 'Google로 계속하기',
          icon: '🔴', // 실제로는 Google 아이콘 사용
          backgroundColor: '#ffffff',
          textColor: '#1f1f1f',
          borderColor: '#dadce0',
        };
      case 'apple':
        return {
          text: 'Apple로 계속하기',
          icon: '🍎', // 실제로는 Apple 아이콘 사용
          backgroundColor: '#000000',
          textColor: '#ffffff',
          borderColor: '#000000',
        };
      default:
        return {
          text: '로그인',
          icon: '',
          backgroundColor: '#ffffff',
          textColor: '#000000',
          borderColor: '#dadce0',
        };
    }
  };

  const config = getButtonConfig();
  const isApple = provider === 'apple';
  const isDisabled = disabled || loading || (isApple && Platform.OS !== 'ios');

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
        isDisabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={config.textColor} 
            style={styles.icon}
          />
        ) : (
          <Text style={[styles.icon, { color: config.textColor }]}>
            {config.icon}
          </Text>
        )}
        
        <Text style={[styles.buttonText, { color: config.textColor }]}>
          {loading ? '로그인 중...' : config.text}
        </Text>
      </View>
      
      {isApple && Platform.OS !== 'ios' && (
        <Text style={styles.disabledText}>iOS에서만 사용 가능</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
    marginRight: 12,
    width: 20,
    textAlign: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default SocialLoginButton;