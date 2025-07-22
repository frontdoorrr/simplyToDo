import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationSettings, DEFAULT_NOTIFICATION_SETTINGS } from '@/types/Notification';

interface ResetSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (resetOptions: ResetOptions) => void;
  currentSettings: NotificationSettings;
}

interface ResetOptions {
  resetAll: boolean;
  resetGlobalSettings: boolean;
  resetCategorySettings: boolean;
  resetDefaultReminders: boolean;
  resetMessageTemplate: boolean;
}

interface SettingsDiff {
  section: string;
  icon: string;
  changes: Array<{
    setting: string;
    current: string;
    willBe: string;
  }>;
}

export const ResetSettingsModal: React.FC<ResetSettingsModalProps> = ({
  visible,
  onClose,
  onConfirm,
  currentSettings
}) => {
  const [resetOptions, setResetOptions] = useState<ResetOptions>({
    resetAll: false,
    resetGlobalSettings: false,
    resetCategorySettings: false,
    resetDefaultReminders: false,
    resetMessageTemplate: false
  });

  const handleResetAllToggle = (value: boolean) => {
    setResetOptions({
      resetAll: value,
      resetGlobalSettings: value,
      resetCategorySettings: value,
      resetDefaultReminders: value,
      resetMessageTemplate: value
    });
  };

  const handleIndividualToggle = (key: keyof ResetOptions, value: boolean) => {
    const newOptions = { ...resetOptions, [key]: value };
    
    // resetAll 상태 업데이트
    const allIndividualSelected = newOptions.resetGlobalSettings && 
                                 newOptions.resetCategorySettings && 
                                 newOptions.resetDefaultReminders && 
                                 newOptions.resetMessageTemplate;
    
    newOptions.resetAll = allIndividualSelected;
    
    setResetOptions(newOptions);
  };

  const getSettingsDiff = (): SettingsDiff[] => {
    const diff: SettingsDiff[] = [];
    const defaults = DEFAULT_NOTIFICATION_SETTINGS;

    if (resetOptions.resetGlobalSettings) {
      diff.push({
        section: '전체 설정',
        icon: 'settings-outline',
        changes: [
          {
            setting: '마스터 스위치',
            current: currentSettings.globalSettings.masterSwitch ? '켜짐' : '꺼짐',
            willBe: defaults.globalSettings.masterSwitch ? '켜짐' : '꺼짐'
          },
          {
            setting: '방해 금지 시간',
            current: currentSettings.globalSettings.quietHours.enabled 
              ? `${currentSettings.globalSettings.quietHours.start}-${currentSettings.globalSettings.quietHours.end}` 
              : '비활성화',
            willBe: defaults.globalSettings.quietHours.enabled 
              ? `${defaults.globalSettings.quietHours.start}-${defaults.globalSettings.quietHours.end}` 
              : '비활성화'
          },
          {
            setting: '알림 톤',
            current: getSoundProfileLabel(currentSettings.globalSettings.soundProfile),
            willBe: getSoundProfileLabel(defaults.globalSettings.soundProfile)
          },
          {
            setting: '진동 패턴',
            current: getVibrationPatternLabel(currentSettings.globalSettings.vibrationPattern),
            willBe: getVibrationPatternLabel(defaults.globalSettings.vibrationPattern)
          }
        ]
      });
    }

    if (resetOptions.resetCategorySettings) {
      const categoryChanges = Object.keys(defaults.categorySettings).map(categoryId => {
        const current = currentSettings.categorySettings[categoryId];
        const defaultSetting = defaults.categorySettings[categoryId];
        
        return {
          setting: `${getCategoryName(categoryId)} 카테고리`,
          current: current 
            ? `${current.enabled ? '활성화' : '비활성화'} • ${current.allowedHours.join(', ')}` 
            : '설정 없음',
          willBe: `${defaultSetting.enabled ? '활성화' : '비활성화'} • ${defaultSetting.allowedHours.join(', ')}`
        };
      });

      diff.push({
        section: '카테고리별 설정',
        icon: 'pricetag-outline',
        changes: categoryChanges
      });
    }

    if (resetOptions.resetDefaultReminders) {
      diff.push({
        section: '기본 알림 설정',
        icon: 'notifications-outline',
        changes: [
          {
            setting: '마감일 알림',
            current: currentSettings.defaultReminders.dueDateReminders.onDueDate.enabled 
              ? `활성화 (${currentSettings.defaultReminders.dueDateReminders.onDueDate.time})` 
              : '비활성화',
            willBe: defaults.defaultReminders.dueDateReminders.onDueDate.enabled 
              ? `활성화 (${defaults.defaultReminders.dueDateReminders.onDueDate.time})` 
              : '비활성화'
          },
          {
            setting: '반복 작업 알림',
            current: currentSettings.defaultReminders.recurringReminders.enabled 
              ? `활성화 (최대 ${currentSettings.defaultReminders.recurringReminders.maxDaily}회)` 
              : '비활성화',
            willBe: defaults.defaultReminders.recurringReminders.enabled 
              ? `활성화 (최대 ${defaults.defaultReminders.recurringReminders.maxDaily}회)` 
              : '비활성화'
          },
          {
            setting: '중요도 기반 알림',
            current: currentSettings.defaultReminders.importanceBased.enabled ? '활성화' : '비활성화',
            willBe: defaults.defaultReminders.importanceBased.enabled ? '활성화' : '비활성화'
          }
        ]
      });
    }

    if (resetOptions.resetMessageTemplate) {
      diff.push({
        section: '메시지 템플릿',
        icon: 'chatbubble-outline',
        changes: [
          {
            setting: '메시지 스타일',
            current: getMessageTemplateLabel(currentSettings.messageTemplate.type),
            willBe: getMessageTemplateLabel(defaults.messageTemplate.type)
          },
          {
            setting: '이모지 포함',
            current: currentSettings.messageTemplate.includeEmoji ? '사용' : '미사용',
            willBe: defaults.messageTemplate.includeEmoji ? '사용' : '미사용'
          },
          {
            setting: '마감시간 표시',
            current: currentSettings.messageTemplate.includeDueTime ? '사용' : '미사용',
            willBe: defaults.messageTemplate.includeDueTime ? '사용' : '미사용'
          },
          {
            setting: '카테고리 표시',
            current: currentSettings.messageTemplate.includeCategory ? '사용' : '미사용',
            willBe: defaults.messageTemplate.includeCategory ? '사용' : '미사용'
          }
        ]
      });
    }

    return diff;
  };

  const getSoundProfileLabel = (profile: string): string => {
    const labels: { [key: string]: string } = {
      default: '기본',
      important: '중요',
      urgent: '긴급',
      gentle: '부드러운'
    };
    return labels[profile] || '기본';
  };

  const getVibrationPatternLabel = (pattern: string): string => {
    const labels: { [key: string]: string } = {
      short: '짧게',
      long: '길게',
      pattern: '패턴',
      none: '없음'
    };
    return labels[pattern] || '짧게';
  };

  const getMessageTemplateLabel = (template: string): string => {
    const labels: { [key: string]: string } = {
      motivational: '동기부여형',
      formal: '정중형',
      simple: '간단형',
      custom: '사용자 정의'
    };
    return labels[template] || '동기부여형';
  };

  const getCategoryName = (categoryId: string): string => {
    const names: { [key: string]: string } = {
      work: '업무',
      personal: '개인',
      health: '건강',
      study: '학습',
      creative: '창작'
    };
    return names[categoryId] || '개인';
  };

  const handleConfirm = () => {
    const hasAnySelection = Object.values(resetOptions).some(value => value);
    
    if (!hasAnySelection) {
      Alert.alert('선택 필요', '초기화할 설정을 선택해주세요.');
      return;
    }

    const diffCount = getSettingsDiff().reduce((acc, section) => acc + section.changes.length, 0);
    
    Alert.alert(
      '설정 초기화 확인',
      `선택한 ${diffCount}개의 설정이 기본값으로 초기화됩니다.\n이 작업은 되돌릴 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '초기화', 
          style: 'destructive',
          onPress: () => {
            onConfirm(resetOptions);
            onClose();
          }
        }
      ]
    );
  };

  const settingsDiff = getSettingsDiff();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>취소</Text>
          </TouchableOpacity>
          <Text style={styles.title}>설정 초기화</Text>
          <TouchableOpacity onPress={handleConfirm}>
            <Text style={styles.confirmButton}>초기화</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Warning */}
          <View style={styles.warningContainer}>
            <Ionicons name="warning" size={24} color="#FF5722" />
            <Text style={styles.warningText}>
              선택한 설정들이 기본값으로 초기화됩니다.{'\n'}
              이 작업은 되돌릴 수 없으니 신중하게 선택하세요.
            </Text>
          </View>

          {/* Reset Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>초기화할 설정 선택</Text>
            
            <View style={styles.optionItem}>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>전체 설정</Text>
                <Text style={styles.optionDescription}>모든 설정을 기본값으로 초기화</Text>
              </View>
              <Switch
                value={resetOptions.resetAll}
                onValueChange={handleResetAllToggle}
                trackColor={{ false: '#E0E0E0', true: '#FF5722' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.optionItem}>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>전체 알림 설정</Text>
                <Text style={styles.optionDescription}>마스터 스위치, 방해 금지 시간, 소리/진동 설정</Text>
              </View>
              <Switch
                value={resetOptions.resetGlobalSettings}
                onValueChange={(value) => handleIndividualToggle('resetGlobalSettings', value)}
                trackColor={{ false: '#E0E0E0', true: '#FF5722' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.optionItem}>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>카테고리별 설정</Text>
                <Text style={styles.optionDescription}>업무, 개인, 건강, 학습 등 카테고리 알림 시간</Text>
              </View>
              <Switch
                value={resetOptions.resetCategorySettings}
                onValueChange={(value) => handleIndividualToggle('resetCategorySettings', value)}
                trackColor={{ false: '#E0E0E0', true: '#FF5722' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.optionItem}>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>기본 알림 설정</Text>
                <Text style={styles.optionDescription}>마감일, 반복 작업, 중요도 기반 알림</Text>
              </View>
              <Switch
                value={resetOptions.resetDefaultReminders}
                onValueChange={(value) => handleIndividualToggle('resetDefaultReminders', value)}
                trackColor={{ false: '#E0E0E0', true: '#FF5722' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.optionItem}>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>메시지 템플릿</Text>
                <Text style={styles.optionDescription}>메시지 스타일, 이모지, 추가 정보 표시</Text>
              </View>
              <Switch
                value={resetOptions.resetMessageTemplate}
                onValueChange={(value) => handleIndividualToggle('resetMessageTemplate', value)}
                trackColor={{ false: '#E0E0E0', true: '#FF5722' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Preview Changes */}
          {settingsDiff.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>변경될 설정 미리보기</Text>
              
              {settingsDiff.map((section, sectionIndex) => (
                <View key={sectionIndex} style={styles.diffSection}>
                  <View style={styles.diffSectionHeader}>
                    <Ionicons name={section.icon as any} size={20} color="#FF5722" />
                    <Text style={styles.diffSectionTitle}>{section.section}</Text>
                  </View>
                  
                  {section.changes.map((change, changeIndex) => (
                    <View key={changeIndex} style={styles.changeItem}>
                      <Text style={styles.changeSetting}>{change.setting}</Text>
                      <View style={styles.changeValues}>
                        <Text style={styles.currentValue}>현재: {change.current}</Text>
                        <Ionicons name="arrow-forward" size={16} color="#999" />
                        <Text style={styles.newValue}>변경: {change.willBe}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* Info */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>💡 참고사항</Text>
            <Text style={styles.infoText}>
              • 초기화 후에도 언제든지 다시 설정을 변경할 수 있습니다{'\n'}
              • 기본값은 일반적으로 가장 많이 사용되는 설정입니다{'\n'}
              • 특별한 요구사항이 있다면 초기화 후 개별 설정을 조정하세요
            </Text>
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: 50 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  confirmButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5722',
  },
  content: {
    flex: 1,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 20,
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#D32F2F',
    lineHeight: 20,
    marginLeft: 12,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  diffSection: {
    marginBottom: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFECB3',
  },
  diffSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  diffSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57F17',
    marginLeft: 8,
  },
  changeItem: {
    marginBottom: 12,
  },
  changeSetting: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  changeValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentValue: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  newValue: {
    fontSize: 12,
    color: '#FF5722',
    fontWeight: '500',
    marginLeft: 8,
  },
  infoSection: {
    margin: 20,
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#1976D2',
    lineHeight: 16,
  },
});