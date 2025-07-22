import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { notificationSettingsService } from '@/lib/notificationSettings';
import { NotificationSettings, CategorySchedule, MessageTemplate, QuietHours } from '@/types/Notification';
import { logger } from '@/lib/logger';
import { TimePickerModal } from '@/components/TimePickerModal';
import { CategorySettingsModal } from '@/components/CategorySettingsModal';
import { MessageTemplateModal } from '@/components/MessageTemplateModal';
import { QuietHoursModal } from '@/components/QuietHoursModal';
import { NotificationPreviewModal } from '@/components/NotificationPreviewModal';
import { ResetSettingsModal } from '@/components/ResetSettingsModal';

// Debounce utility function
function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number): T {
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      callback(...args);
    }, delay) as NodeJS.Timeout;

    setDebounceTimer(timer);
  }, [callback, delay, debounceTimer]) as T;

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return debouncedCallback;
}

export default function NotificationSettingsScreen() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 시간 선택 모달 상태
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [timePickerConfig, setTimePickerConfig] = useState<{
    title: string;
    initialTime: string;
    onSave: (time: string) => void;
  } | null>(null);

  // 카테고리 설정 모달 상태
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categoryModalConfig, setCategoryModalConfig] = useState<{
    categoryId: string;
    categoryName: string;
    settings: CategorySchedule;
  } | null>(null);

  // 메시지 템플릿 모달 상태
  const [messageTemplateVisible, setMessageTemplateVisible] = useState(false);

  // 방해 금지 시간 모달 상태
  const [quietHoursVisible, setQuietHoursVisible] = useState(false);

  // 알림 미리보기 모달 상태
  const [previewVisible, setPreviewVisible] = useState(false);

  // 설정 초기화 모달 상태
  const [resetModalVisible, setResetModalVisible] = useState(false);

  useEffect(() => {
    loadSettings();
    
    // 컴포넌트 언마운트 시 debounce 타이머 정리
    return () => {
      // cleanup handled by useDebounce hook
    };
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const currentSettings = await notificationSettingsService.getSettings();
      setSettings(currentSettings);
    } catch (error) {
      logger.error('알림 설정 로드 실패:', error);
      Alert.alert(
        '설정 로드 실패', 
        '알림 설정을 불러올 수 없습니다. 기본 설정으로 시작하시겠습니까?',
        [
          { text: '재시도', onPress: loadSettings },
          { 
            text: '기본 설정 사용', 
            onPress: async () => {
              try {
                const defaultSettings = await notificationSettingsService.resetToDefaults();
                setSettings(defaultSettings);
              } catch (resetError) {
                logger.error('기본 설정 생성 실패:', resetError);
                Alert.alert('오류', '설정을 초기화할 수 없습니다.');
              }
            }
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced update function for better performance
  const updateSettingsImmediate = useCallback(async (updates: Partial<NotificationSettings>) => {
    if (!settings) return;

    try {
      await notificationSettingsService.updateSettings(updates);
      setSettings(prev => prev ? { ...prev, ...updates } : null);
      logger.ui('알림 설정 업데이트됨');
    } catch (error) {
      logger.error('알림 설정 업데이트 실패:', error);
      Alert.alert('오류', '설정을 저장할 수 없습니다.');
    }
  }, [settings]);

  const updateSettings = useDebounce(updateSettingsImmediate, 300);

  const handleMasterSwitchToggle = useCallback((value: boolean) => {
    updateSettings({
      globalSettings: {
        ...settings!.globalSettings,
        masterSwitch: value
      }
    });
  }, [settings, updateSettings]);

  const handleTestNotification = async () => {
    Alert.alert(
      '테스트 알림 선택',
      '어떤 종류의 알림을 테스트하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '기본 테스트', 
          onPress: async () => {
            try {
              await notificationSettingsService.testNotification('basic');
              Alert.alert('테스트 완료', '기본 테스트 알림이 2초 후 발송됩니다.');
            } catch (error) {
              logger.error('테스트 알림 발송 실패:', error);
              Alert.alert('오류', '테스트 알림을 발송할 수 없습니다.');
            }
          }
        },
        { 
          text: '카테고리 테스트', 
          onPress: async () => {
            try {
              await notificationSettingsService.testNotification('category', 'work');
              Alert.alert('테스트 완료', '업무 카테고리 테스트 알림이 2초 후 발송됩니다.');
            } catch (error) {
              logger.error('테스트 알림 발송 실패:', error);
              Alert.alert('오류', '테스트 알림을 발송할 수 없습니다.');
            }
          }
        },
        { 
          text: '모든 시나리오', 
          onPress: async () => {
            try {
              await notificationSettingsService.testAllScenarios();
              Alert.alert('테스트 완료', '모든 시나리오 테스트 알림이 5초 간격으로 발송됩니다.\n총 4개의 테스트 알림을 받게 됩니다.');
            } catch (error) {
              logger.error('시나리오 테스트 실패:', error);
              Alert.alert('오류', '시나리오 테스트를 시작할 수 없습니다.');
            }
          }
        }
      ]
    );
  };

  const handleResetConfirm = async (resetOptions: any) => {
    try {
      const defaultSettings = await notificationSettingsService.resetToDefaults(resetOptions);
      setSettings(defaultSettings);
      
      const resetCount = Object.values(resetOptions).filter(Boolean).length;
      Alert.alert('완료', `선택한 ${resetCount}개 설정이 기본값으로 초기화되었습니다.`);
    } catch (error) {
      logger.error('설정 초기화 실패:', error);
      Alert.alert('오류', '설정을 초기화할 수 없습니다.');
    }
  };

  const openTimePicker = (title: string, initialTime: string, onSave: (time: string) => void) => {
    setTimePickerConfig({ title, initialTime, onSave });
    setTimePickerVisible(true);
  };

  const handleDueDateTimeChange = (time: string) => {
    if (!settings) return;
    updateSettings({
      defaultReminders: {
        ...settings.defaultReminders,
        dueDateReminders: {
          ...settings.defaultReminders.dueDateReminders,
          onDueDate: {
            ...settings.defaultReminders.dueDateReminders.onDueDate,
            time
          }
        }
      }
    });
  };

  const openCategorySettings = (categoryId: string, categoryName: string) => {
    if (!settings) return;
    
    const categorySettings = settings.categorySettings[categoryId] || {
      enabled: true,
      allowedHours: ['09:00', '18:00'],
      allowedDays: [1, 2, 3, 4, 5]
    };

    setCategoryModalConfig({
      categoryId,
      categoryName,
      settings: categorySettings
    });
    setCategoryModalVisible(true);
  };

  const handleCategorySettingsSave = (categorySettings: CategorySchedule) => {
    if (!settings || !categoryModalConfig) return;

    updateSettings({
      categorySettings: {
        ...settings.categorySettings,
        [categoryModalConfig.categoryId]: categorySettings
      }
    });
  };

  const handleMessageTemplateSave = (messageTemplate: MessageTemplate) => {
    if (!settings) return;

    updateSettings({
      messageTemplate: messageTemplate
    });
  };

  const handleQuietHoursSave = (quietHours: QuietHours) => {
    if (!settings) return;

    updateSettings({
      globalSettings: {
        ...settings.globalSettings,
        quietHours: quietHours
      }
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>알림 설정</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text>설정을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!settings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>알림 설정</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text>설정을 불러올 수 없습니다.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadSettings}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림 설정</Text>
        <Switch
          value={settings.globalSettings.masterSwitch}
          onValueChange={handleMasterSwitchToggle}
          trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
          thumbColor="#FFFFFF"
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 기본 알림 설정 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.sectionTitle}>기본 알림 설정</Text>
          </View>

          <SettingItem
            title="마감일 알림"
            subtitle={`당일 ${settings.defaultReminders.dueDateReminders.onDueDate.time}, 1일 전 오후 6시`}
            enabled={settings.defaultReminders.dueDateReminders.onDueDate.enabled}
            onToggle={(value) => updateSettings({
              defaultReminders: {
                ...settings.defaultReminders,
                dueDateReminders: {
                  ...settings.defaultReminders.dueDateReminders,
                  onDueDate: {
                    ...settings.defaultReminders.dueDateReminders.onDueDate,
                    enabled: value
                  }
                }
              }
            })}
            onPress={() => openTimePicker(
              '마감일 당일 알림 시간',
              settings.defaultReminders.dueDateReminders.onDueDate.time,
              handleDueDateTimeChange
            )}
          />

          <SettingItem
            title="반복 작업 알림"
            subtitle="시작 시간 알림, 미완료 리마인더"
            enabled={settings.defaultReminders.recurringReminders.enabled}
            onToggle={(value) => updateSettings({
              defaultReminders: {
                ...settings.defaultReminders,
                recurringReminders: {
                  ...settings.defaultReminders.recurringReminders,
                  enabled: value
                }
              }
            })}
            onPress={() => {/* 향후 상세 설정 모달 */}}
          />

          <SettingItem
            title="중요도 기반 알림"
            subtitle="중요한 작업은 더 일찍 알림"
            enabled={settings.defaultReminders.importanceBased.enabled}
            onToggle={(value) => updateSettings({
              defaultReminders: {
                ...settings.defaultReminders,
                importanceBased: {
                  ...settings.defaultReminders.importanceBased,
                  enabled: value
                }
              }
            })}
            onPress={() => {/* 향후 상세 설정 모달 */}}
          />
        </View>

        {/* 카테고리별 설정 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pricetag-outline" size={20} color="#666" />
            <Text style={styles.sectionTitle}>카테고리별 설정</Text>
          </View>

          <SettingItem
            title="업무"
            subtitle="평일 09:00-18:00"
            enabled={settings.categorySettings.work?.enabled || false}
            onToggle={(value) => updateSettings({
              categorySettings: {
                ...settings.categorySettings,
                work: {
                  ...settings.categorySettings.work,
                  enabled: value
                }
              }
            })}
            onPress={() => openCategorySettings('work', '업무')}
          />

          <SettingItem
            title="개인"
            subtitle="매일 07:00-22:00"
            enabled={settings.categorySettings.personal?.enabled || false}
            onToggle={(value) => updateSettings({
              categorySettings: {
                ...settings.categorySettings,
                personal: {
                  ...settings.categorySettings.personal,
                  enabled: value
                }
              }
            })}
            onPress={() => openCategorySettings('personal', '개인')}
          />

          <SettingItem
            title="건강"
            subtitle="매일 07:00, 18:00"
            enabled={settings.categorySettings.health?.enabled || false}
            onToggle={(value) => updateSettings({
              categorySettings: {
                ...settings.categorySettings,
                health: {
                  ...settings.categorySettings.health,
                  enabled: value
                }
              }
            })}
            onPress={() => openCategorySettings('health', '건강')}
          />

          <SettingItem
            title="학습"
            subtitle="매일 10:00, 14:00, 20:00"
            enabled={settings.categorySettings.study?.enabled || false}
            onToggle={(value) => updateSettings({
              categorySettings: {
                ...settings.categorySettings,
                study: {
                  ...settings.categorySettings.study,
                  enabled: value
                }
              }
            })}
            onPress={() => openCategorySettings('study', '학습')}
          />
        </View>

        {/* 알림 스타일 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="musical-notes-outline" size={20} color="#666" />
            <Text style={styles.sectionTitle}>알림 스타일</Text>
          </View>

          <SettingItem
            title="알림 톤"
            subtitle={getSoundProfileLabel(settings.globalSettings.soundProfile)}
            showToggle={false}
            onPress={() => {/* 향후 사운드 선택 모달 */}}
          />

          <SettingItem
            title="진동 패턴"
            subtitle={getVibrationPatternLabel(settings.globalSettings.vibrationPattern)}
            showToggle={false}
            onPress={() => {/* 향후 진동 패턴 선택 모달 */}}
          />

          <SettingItem
            title="메시지 스타일"
            subtitle={getMessageTemplateSubtitle(settings.messageTemplate)}
            showToggle={false}
            onPress={() => setMessageTemplateVisible(true)}
          />

          <SettingItem
            title="방해 금지 시간"
            subtitle={settings.globalSettings.quietHours.enabled ? 
              `${settings.globalSettings.quietHours.start}-${settings.globalSettings.quietHours.end}` :
              '비활성화'
            }
            showToggle={false}
            onPress={() => setQuietHoursVisible(true)}
          />
        </View>

        {/* 테스트 및 관리 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings-outline" size={20} color="#666" />
            <Text style={styles.sectionTitle}>테스트 및 관리</Text>
          </View>

          <TouchableOpacity style={styles.actionButton} onPress={handleTestNotification}>
            <Text style={styles.actionButtonText}>테스트 알림 보내기</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => setPreviewVisible(true)}>
            <Text style={styles.actionButtonText}>설정 미리보기</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetButton} onPress={() => setResetModalVisible(true)}>
            <Text style={styles.resetButtonText}>기본값으로 초기화</Text>
          </TouchableOpacity>
        </View>

        {/* 하단 여백 */}
        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Time Picker Modal */}
      {timePickerConfig && (
        <TimePickerModal
          visible={timePickerVisible}
          onClose={() => setTimePickerVisible(false)}
          title={timePickerConfig.title}
          initialTime={timePickerConfig.initialTime}
          onSave={timePickerConfig.onSave}
        />
      )}

      {/* Category Settings Modal */}
      {categoryModalConfig && (
        <CategorySettingsModal
          visible={categoryModalVisible}
          onClose={() => setCategoryModalVisible(false)}
          categoryName={categoryModalConfig.categoryName}
          initialSettings={categoryModalConfig.settings}
          onSave={handleCategorySettingsSave}
        />
      )}

      {/* Message Template Modal */}
      <MessageTemplateModal
        visible={messageTemplateVisible}
        onClose={() => setMessageTemplateVisible(false)}
        initialTemplate={settings?.messageTemplate || { type: 'motivational', includeEmoji: true }}
        onSave={handleMessageTemplateSave}
      />

      {/* Quiet Hours Modal */}
      <QuietHoursModal
        visible={quietHoursVisible}
        onClose={() => setQuietHoursVisible(false)}
        initialQuietHours={settings?.globalSettings.quietHours || { enabled: false, start: '22:00', end: '07:00' }}
        onSave={handleQuietHoursSave}
      />

      {/* Notification Preview Modal */}
      {settings && (
        <NotificationPreviewModal
          visible={previewVisible}
          onClose={() => setPreviewVisible(false)}
          settings={settings}
        />
      )}

      {/* Reset Settings Modal */}
      {settings && (
        <ResetSettingsModal
          visible={resetModalVisible}
          onClose={() => setResetModalVisible(false)}
          onConfirm={handleResetConfirm}
          currentSettings={settings}
        />
      )}
    </SafeAreaView>
  );
}

// SettingItem 컴포넌트 (React.memo로 최적화)
interface SettingItemProps {
  title: string;
  subtitle: string;
  enabled?: boolean;
  showToggle?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
}

const SettingItem = React.memo<SettingItemProps>(({ 
  title, 
  subtitle, 
  enabled = false, 
  showToggle = true, 
  onToggle, 
  onPress 
}) => {
  return (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingItemContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      {showToggle ? (
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
          thumbColor="#FFFFFF"
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#666" />
      )}
    </TouchableOpacity>
  );
});

// 헬퍼 함수들 (최적화됨)
const SOUND_PROFILE_LABELS = {
  default: '기본',
  important: '중요',
  urgent: '긴급',
  gentle: '부드러운'
} as const;

const VIBRATION_PATTERN_LABELS = {
  short: '짧게',
  long: '길게',
  pattern: '패턴',
  none: '없음'
} as const;

const MESSAGE_TEMPLATE_LABELS = {
  motivational: '동기부여형',
  formal: '정중형',
  simple: '간단형',
  custom: '사용자 정의'
} as const;

function getSoundProfileLabel(profile: string): string {
  return SOUND_PROFILE_LABELS[profile as keyof typeof SOUND_PROFILE_LABELS] || '기본';
}

function getVibrationPatternLabel(pattern: string): string {
  return VIBRATION_PATTERN_LABELS[pattern as keyof typeof VIBRATION_PATTERN_LABELS] || '짧게';
}

function getMessageTemplateLabel(template: string): string {
  return MESSAGE_TEMPLATE_LABELS[template as keyof typeof MESSAGE_TEMPLATE_LABELS] || '동기부여형';
}

function getMessageTemplateSubtitle(messageTemplate: MessageTemplate): string {
  let subtitle = getMessageTemplateLabel(messageTemplate.type);
  
  const options = [];
  if (messageTemplate.includeEmoji) options.push('이모지');
  if (messageTemplate.includeDueTime) options.push('마감시간');
  if (messageTemplate.includeCategory) options.push('카테고리');
  
  if (options.length > 0) {
    subtitle += ` • ${options.join(', ')}`;
  }
  
  return subtitle;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 8,
  },
  settingItemContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  resetButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFE4E1',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#D32F2F',
  },
});