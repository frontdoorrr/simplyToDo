import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();

  const navigateToStatistics = () => {
    router.push('/statistics');
  };

  const navigateToNotifications = () => {
    router.push('/notification-settings');
  };

  const navigateToAccountManagement = () => {
    router.push('/account-management');
  };

  const showComingSoon = (feature: string) => {
    Alert.alert('준비 중', `${feature} 기능은 곧 추가될 예정입니다.`);
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true,
    iconColor = '#666'
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
    iconColor?: string;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
          <Ionicons name={icon as any} size={20} color={iconColor} />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color="#CCC" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>설정</Text>
        <Text style={styles.headerSubtitle}>앱 설정 및 기능 관리</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 분석 및 통계 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 분석 및 통계</Text>
          
          <SettingItem
            icon="bar-chart-outline"
            title="생산성 통계"
            subtitle="할 일 완료 패턴 및 인사이트 확인"
            onPress={navigateToStatistics}
            iconColor="#FF9800"
          />
        </View>

        {/* 알림 설정 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 알림 설정</Text>
          
          <SettingItem
            icon="notifications-outline"
            title="알림 설정"
            subtitle="마감일, 리마인더 알림 관리"
            onPress={navigateToNotifications}
            iconColor="#4CAF50"
          />
        </View>

        {/* 개인화 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 개인화</Text>
          
          <SettingItem
            icon="color-palette-outline"
            title="테마 설정"
            subtitle="다크 모드, 색상 테마 변경"
            onPress={() => showComingSoon('테마 설정')}
            iconColor="#9C27B0"
          />
          
          <SettingItem
            icon="language-outline"
            title="언어 설정"
            subtitle="앱 언어 변경"
            onPress={() => showComingSoon('언어 설정')}
            iconColor="#2196F3"
          />
        </View>

        {/* 데이터 관리 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💾 데이터 관리</Text>
          
          <SettingItem
            icon="cloud-upload-outline"
            title="데이터 백업"
            subtitle="클라우드에 데이터 백업"
            onPress={() => showComingSoon('데이터 백업')}
            iconColor="#00BCD4"
          />
          
          <SettingItem
            icon="download-outline"
            title="데이터 내보내기"
            subtitle="CSV, JSON 형식으로 내보내기"
            onPress={() => showComingSoon('데이터 내보내기')}
            iconColor="#607D8B"
          />
        </View>

        {/* 계정 및 동기화 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 계정 및 동기화</Text>
          
          <SettingItem
            icon="person-outline"
            title="계정 관리"
            subtitle="프로필, 소셜 계정 연결 관리"
            onPress={navigateToAccountManagement}
            iconColor="#FF5722"
          />
          
          <SettingItem
            icon="sync-outline"
            title="동기화 설정"
            subtitle="기기 간 데이터 동기화 관리"
            onPress={() => showComingSoon('동기화 설정')}
            iconColor="#795548"
          />
        </View>

        {/* 고급 설정 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ 고급 설정</Text>
          
          <SettingItem
            icon="speedometer-outline"
            title="성능 설정"
            subtitle="캐시, 성능 최적화 설정"
            onPress={() => showComingSoon('성능 설정')}
            iconColor="#FF9800"
          />
          
          <SettingItem
            icon="bug-outline"
            title="디버그 모드"
            subtitle="개발자 옵션 및 로그 확인"
            onPress={() => showComingSoon('디버그 모드')}
            iconColor="#9E9E9E"
          />
        </View>

        {/* 정보 및 지원 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ 정보 및 지원</Text>
          
          <SettingItem
            icon="help-circle-outline"
            title="도움말"
            subtitle="앱 사용법 및 FAQ"
            onPress={() => showComingSoon('도움말')}
            iconColor="#2196F3"
          />
          
          <SettingItem
            icon="mail-outline"
            title="피드백 보내기"
            subtitle="개선 사항 및 버그 신고"
            onPress={() => showComingSoon('피드백')}
            iconColor="#4CAF50"
          />
          
          <SettingItem
            icon="information-circle-outline"
            title="앱 정보"
            subtitle="버전 1.0.0"
            onPress={() => showComingSoon('앱 정보')}
            iconColor="#666"
            showArrow={false}
          />
        </View>

        {/* 하단 여백 */}
        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
});