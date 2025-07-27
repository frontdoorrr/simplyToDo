import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { socialAuthService } from '@/lib/socialAuthService';
import { userProfileService } from '@/lib/userProfileService';
import { logger } from '@/lib/logger';
import { TodoColors } from '@/constants/Colors';

interface ConnectedAccount {
  provider: 'email' | 'google' | 'apple';
  email?: string;
  name?: string;
  avatarUrl?: string;
  isPrimary: boolean;
  connectedAt?: string;
}

export default function AccountManagementScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');

  useEffect(() => {
    loadConnectedAccounts();
  }, [user]);

  const loadConnectedAccounts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // 현재 사용자 정보를 기반으로 연결된 계정 정보 구성
      const connectedAccounts: ConnectedAccount[] = [];
      
      // 현재 계정 (기본 계정)
      const currentProvider = user.app_metadata?.provider || 'email';
      connectedAccounts.push({
        provider: currentProvider as 'email' | 'google' | 'apple',
        email: user.email || '',
        name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        avatarUrl: user.user_metadata?.avatar_url || null,
        isPrimary: true,
        connectedAt: user.created_at,
      });

      // 연결된 다른 소셜 계정들 확인
      if (user.identities && user.identities.length > 1) {
        user.identities.forEach(identity => {
          // 현재 기본 계정이 아닌 다른 연결된 계정들
          if (identity.provider !== currentProvider) {
            connectedAccounts.push({
              provider: identity.provider as 'email' | 'google' | 'apple',
              email: identity.identity_data?.email || '',
              name: identity.identity_data?.full_name || identity.identity_data?.name || '',
              avatarUrl: identity.identity_data?.avatar_url || null,
              isPrimary: false,
              connectedAt: identity.created_at,
            });
          }
        });
      }

      setAccounts(connectedAccounts);
      setProfileName(user.user_metadata?.full_name || user.user_metadata?.name || '');
      
    } catch (error) {
      logger.error('Failed to load connected accounts:', error);
      Alert.alert('오류', '연결된 계정 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAccount = async (provider: 'google' | 'apple') => {
    if (!user) return;

    try {
      setLoading(true);
      
      if (provider === 'google') {
        await socialAuthService.linkGoogleAccount(user.id);
      } else {
        await socialAuthService.linkAppleAccount(user.id);
      }
      
      Alert.alert('성공', `${provider === 'google' ? 'Google' : 'Apple'} 계정이 연결되었습니다.`);
      await loadConnectedAccounts();
      
    } catch (error: any) {
      logger.error(`Failed to link ${provider} account:`, error);
      Alert.alert('연결 실패', error.message || `${provider === 'google' ? 'Google' : 'Apple'} 계정 연결에 실패했습니다.`);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkAccount = async (provider: 'google' | 'apple') => {
    if (!user) return;

    Alert.alert(
      '계정 연결 해제',
      `${provider === 'google' ? 'Google' : 'Apple'} 계정 연결을 해제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '해제',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              if (provider === 'google') {
                await socialAuthService.unlinkGoogleAccount(user.id);
              } else {
                await socialAuthService.unlinkAppleAccount(user.id);
              }
              
              Alert.alert('성공', `${provider === 'google' ? 'Google' : 'Apple'} 계정 연결이 해제되었습니다.`);
              await loadConnectedAccounts();
              
            } catch (error: any) {
              logger.error(`Failed to unlink ${provider} account:`, error);
              Alert.alert('해제 실패', error.message || '계정 연결 해제에 실패했습니다.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // 프로필 데이터 유효성 검사
      const validation = userProfileService.validateProfileData({
        full_name: profileName.trim()
      });

      if (!validation.isValid) {
        Alert.alert('입력 오류', validation.errors.join('\n'));
        return;
      }

      // 프로필 업데이트
      await userProfileService.updateUserProfile({
        full_name: profileName.trim()
      });

      Alert.alert('성공', '프로필이 업데이트되었습니다.');
      setEditingProfile(false);
      
      // 계정 정보 다시 로드
      await loadConnectedAccounts();

    } catch (error: any) {
      logger.error('Failed to update profile:', error);
      Alert.alert('업데이트 실패', error.message || '프로필 업데이트에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/auth/login');
            } catch (error) {
              logger.error('Sign out failed:', error);
              Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return '🔴'; // 실제로는 Google 아이콘
      case 'apple':
        return '🍎'; // 실제로는 Apple 아이콘
      case 'email':
      default:
        return '📧';
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'Google';
      case 'apple':
        return 'Apple';
      case 'email':
      default:
        return '이메일';
    }
  };

  if (loading && accounts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={TodoColors.primary} />
          <Text style={styles.loadingText}>계정 정보를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={TodoColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>계정 관리</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 프로필 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>프로필</Text>
          
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              {user?.user_metadata?.avatar_url ? (
                <Image 
                  source={{ uri: user.user_metadata.avatar_url }} 
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={30} color="#666" />
                </View>
              )}
              
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {user?.user_metadata?.full_name || user?.user_metadata?.name || '이름 없음'}
                </Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => setEditingProfile(!editingProfile)}
              >
                <Ionicons name="pencil" size={16} color={TodoColors.primary} />
              </TouchableOpacity>
            </View>

            {editingProfile && (
              <View style={styles.editForm}>
                <TextInput
                  style={styles.input}
                  placeholder="이름"
                  value={profileName}
                  onChangeText={setProfileName}
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setEditingProfile(false)}
                  >
                    <Text style={styles.cancelButtonText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={handleUpdateProfile}
                  >
                    <Text style={styles.saveButtonText}>저장</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* 연결된 계정 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>연결된 계정</Text>
          
          {accounts.map((account, index) => (
            <View key={index} style={styles.accountCard}>
              <View style={styles.accountInfo}>
                <Text style={styles.providerIcon}>
                  {getProviderIcon(account.provider)}
                </Text>
                <View style={styles.accountDetails}>
                  <View style={styles.accountHeader}>
                    <Text style={styles.providerName}>
                      {getProviderName(account.provider)}
                    </Text>
                    {account.isPrimary && (
                      <View style={styles.primaryBadge}>
                        <Text style={styles.primaryBadgeText}>기본</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.accountEmail}>{account.email}</Text>
                  {account.name && (
                    <Text style={styles.accountName}>{account.name}</Text>
                  )}
                </View>
              </View>

              {!account.isPrimary && (
                <TouchableOpacity
                  style={styles.unlinkButton}
                  onPress={() => handleUnlinkAccount(account.provider as 'google' | 'apple')}
                  disabled={loading}
                >
                  <Text style={styles.unlinkButtonText}>연결 해제</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* 계정 연결 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정 연결</Text>
          
          {/* Google 계정 연결 - 이미 연결되지 않은 경우만 표시 */}
          {!accounts.some(account => account.provider === 'google') && (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => handleLinkAccount('google')}
              disabled={loading}
            >
              <Text style={styles.linkButtonIcon}>🔴</Text>
              <Text style={styles.linkButtonText}>Google 계정 연결</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          )}

          {/* Apple 계정 연결 - 이미 연결되지 않은 경우만 표시 */}
          {!accounts.some(account => account.provider === 'apple') && (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => handleLinkAccount('apple')}
              disabled={loading}
            >
              <Text style={styles.linkButtonIcon}>🍎</Text>
              <Text style={styles.linkButtonText}>Apple 계정 연결</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          )}

          {/* 모든 계정이 연결된 경우 메시지 표시 */}
          {accounts.some(account => account.provider === 'google') && 
           accounts.some(account => account.provider === 'apple') && (
            <View style={styles.allConnectedContainer}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={styles.allConnectedText}>
                모든 소셜 계정이 연결되었습니다
              </Text>
            </View>
          )}
        </View>

        {/* 계정 작업 섹션 */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            disabled={loading}
          >
            <Ionicons name="log-out-outline" size={20} color="#dc3545" />
            <Text style={styles.signOutButtonText}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={TodoColors.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TodoColors.text.primary,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TodoColors.text.primary,
    marginBottom: 15,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 15,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: TodoColors.text.primary,
  },
  profileEmail: {
    fontSize: 14,
    color: TodoColors.text.secondary,
    marginTop: 2,
  },
  editButton: {
    padding: 8,
  },
  editForm: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
  },
  cancelButtonText: {
    color: TodoColors.text.secondary,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: TodoColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  accountCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  providerIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  accountDetails: {
    flex: 1,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: TodoColors.text.primary,
  },
  primaryBadge: {
    backgroundColor: TodoColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  primaryBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  accountEmail: {
    fontSize: 14,
    color: TodoColors.text.secondary,
    marginTop: 2,
  },
  accountName: {
    fontSize: 13,
    color: TodoColors.text.secondary,
    marginTop: 1,
  },
  unlinkButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  unlinkButtonText: {
    color: '#dc3545',
    fontSize: 14,
    fontWeight: '500',
  },
  linkButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  linkButtonIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  linkButtonText: {
    flex: 1,
    fontSize: 16,
    color: TodoColors.text.primary,
  },
  signOutButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  signOutButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: TodoColors.text.secondary,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  allConnectedContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  allConnectedText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
});