import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategorySchedule } from '@/types/Notification';

interface CategorySettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (settings: CategorySchedule) => void;
  categoryName: string;
  initialSettings: CategorySchedule;
}

const WEEKDAYS = [
  { id: 1, label: '월', name: '월요일' },
  { id: 2, label: '화', name: '화요일' },
  { id: 3, label: '수', name: '수요일' },
  { id: 4, label: '목', name: '목요일' },
  { id: 5, label: '금', name: '금요일' },
  { id: 6, label: '토', name: '토요일' },
  { id: 7, label: '일', name: '일요일' },
];

const PRESET_SCHEDULES = [
  { 
    name: '평일만 (9시-18시)', 
    allowedHours: ['09:00', '18:00'], 
    allowedDays: [1, 2, 3, 4, 5] 
  },
  { 
    name: '매일 (7시-22시)', 
    allowedHours: ['07:00', '22:00'], 
    allowedDays: [1, 2, 3, 4, 5, 6, 7] 
  },
  { 
    name: '집중 시간 (10시, 14시, 20시)', 
    allowedHours: ['10:00', '14:00', '20:00'], 
    allowedDays: [1, 2, 3, 4, 5, 6, 7] 
  },
  { 
    name: '아침/저녁 (7시, 18시)', 
    allowedHours: ['07:00', '18:00'], 
    allowedDays: [1, 2, 3, 4, 5, 6, 7] 
  },
];

export const CategorySettingsModal: React.FC<CategorySettingsModalProps> = ({
  visible,
  onClose,
  onSave,
  categoryName,
  initialSettings
}) => {
  const [settings, setSettings] = useState<CategorySchedule>(initialSettings);

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const toggleDay = (dayId: number) => {
    const allowedDays = settings.allowedDays.includes(dayId)
      ? settings.allowedDays.filter(d => d !== dayId)
      : [...settings.allowedDays, dayId].sort();
    
    setSettings({ ...settings, allowedDays });
  };

  const applyPreset = (preset: typeof PRESET_SCHEDULES[0]) => {
    setSettings({
      ...settings,
      allowedHours: [...preset.allowedHours],
      allowedDays: [...preset.allowedDays]
    });
  };

  const getScheduleSummary = () => {
    const days = settings.allowedDays.length === 7 ? '매일' : 
                 settings.allowedDays.length === 5 && 
                 settings.allowedDays.every(d => d <= 5) ? '평일' :
                 settings.allowedDays.map(d => WEEKDAYS.find(w => w.id === d)?.label).join(', ');
    
    const hours = settings.allowedHours.length === 2 && 
                  settings.allowedHours[0] < settings.allowedHours[1] ?
                  `${settings.allowedHours[0]}-${settings.allowedHours[1]}` :
                  settings.allowedHours.join(', ');
    
    return `${days} ${hours}`;
  };

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
          <Text style={styles.title}>{categoryName} 알림 설정</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>저장</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* 활성화 토글 */}
          <View style={styles.section}>
            <View style={styles.enabledContainer}>
              <View>
                <Text style={styles.enabledTitle}>알림 활성화</Text>
                <Text style={styles.enabledSubtitle}>
                  이 카테고리의 할 일에 대한 알림을 받습니다
                </Text>
              </View>
              <Switch
                value={settings.enabled}
                onValueChange={(enabled) => setSettings({ ...settings, enabled })}
                trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {settings.enabled && (
            <>
              {/* 현재 설정 요약 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>현재 설정</Text>
                <View style={styles.summaryContainer}>
                  <Ionicons name="time-outline" size={20} color="#4CAF50" />
                  <Text style={styles.summaryText}>{getScheduleSummary()}</Text>
                </View>
              </View>

              {/* 빠른 설정 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>빠른 설정</Text>
                {PRESET_SCHEDULES.map((preset, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.presetItem}
                    onPress={() => applyPreset(preset)}
                  >
                    <Text style={styles.presetTitle}>{preset.name}</Text>
                    <Text style={styles.presetSubtitle}>
                      {preset.allowedDays.length === 7 ? '매일' : 
                       preset.allowedDays.length === 5 ? '평일' :
                       preset.allowedDays.map(d => WEEKDAYS.find(w => w.id === d)?.label).join('')} • {preset.allowedHours.join(', ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 요일 선택 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>알림 받을 요일</Text>
                <View style={styles.weekdaysContainer}>
                  {WEEKDAYS.map((day) => (
                    <TouchableOpacity
                      key={day.id}
                      style={[
                        styles.weekdayButton,
                        settings.allowedDays.includes(day.id) && styles.selectedWeekdayButton
                      ]}
                      onPress={() => toggleDay(day.id)}
                    >
                      <Text
                        style={[
                          styles.weekdayText,
                          settings.allowedDays.includes(day.id) && styles.selectedWeekdayText
                        ]}
                      >
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 시간 설정 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>알림 시간</Text>
                <Text style={styles.sectionDescription}>
                  이 시간대에만 알림을 받습니다
                </Text>
                
                <View style={styles.hoursContainer}>
                  {settings.allowedHours.map((hour, index) => (
                    <View key={index} style={styles.hourItem}>
                      <Text style={styles.hourText}>{hour}</Text>
                      <TouchableOpacity
                        style={styles.removeHourButton}
                        onPress={() => {
                          const newHours = settings.allowedHours.filter((_, i) => i !== index);
                          setSettings({ ...settings, allowedHours: newHours });
                        }}
                      >
                        <Ionicons name="close-circle" size={20} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.addTimeButton}
                  onPress={() => {
                    // 향후 시간 선택 모달로 연결
                    const newHour = '12:00';
                    if (!settings.allowedHours.includes(newHour)) {
                      setSettings({
                        ...settings,
                        allowedHours: [...settings.allowedHours, newHour].sort()
                      });
                    }
                  }}
                >
                  <Ionicons name="add" size={20} color="#4CAF50" />
                  <Text style={styles.addTimeText}>시간 추가</Text>
                </TouchableOpacity>
              </View>

              {/* 커스텀 메시지 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>커스텀 메시지 (선택)</Text>
                <Text style={styles.sectionDescription}>
                  이 카테고리의 알림에 사용할 특별한 메시지
                </Text>
                <View style={styles.customMessageContainer}>
                  <Text style={styles.customMessagePlaceholder}>
                    {settings.customMessage || '기본 메시지 사용'}
                  </Text>
                  <TouchableOpacity>
                    <Ionicons name="create-outline" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {/* 하단 여백 */}
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
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  enabledContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  enabledTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  enabledSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  summaryText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
  },
  presetItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  presetTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  presetSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  weekdaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekdayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedWeekdayButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  weekdayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  selectedWeekdayText: {
    color: '#FFFFFF',
  },
  hoursContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  hourItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  hourText: {
    fontSize: 14,
    color: '#333',
    marginRight: 6,
  },
  removeHourButton: {
    marginLeft: 4,
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  addTimeText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 6,
  },
  customMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  customMessagePlaceholder: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});