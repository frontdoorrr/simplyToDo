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
import { QuietHours } from '@/types/Notification';

interface QuietHoursModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (quietHours: QuietHours) => void;
  initialQuietHours: QuietHours;
}

const PRESET_SCHEDULES = [
  {
    name: '일반적인 수면 시간',
    description: '밤 10시부터 아침 7시까지',
    start: '22:00',
    end: '07:00'
  },
  {
    name: '깊은 수면 시간',
    description: '밤 9시부터 아침 8시까지',
    start: '21:00',
    end: '08:00'
  },
  {
    name: '올빼미형',
    description: '새벽 1시부터 아침 9시까지',
    start: '01:00',
    end: '09:00'
  },
  {
    name: '이른 수면형',
    description: '밤 9시부터 아침 6시까지',
    start: '21:00',
    end: '06:00'
  },
  {
    name: '점심 시간 차단',
    description: '낮 12시부터 1시까지',
    start: '12:00',
    end: '13:00'
  },
  {
    name: '업무 집중 시간',
    description: '오전 9시부터 12시까지',
    start: '09:00',
    end: '12:00'
  }
];

const WEEKDAYS = [
  { id: 0, label: '일', name: '일요일' },
  { id: 1, label: '월', name: '월요일' },
  { id: 2, label: '화', name: '화요일' },
  { id: 3, label: '수', name: '수요일' },
  { id: 4, label: '목', name: '목요일' },
  { id: 5, label: '금', name: '금요일' },
  { id: 6, label: '토', name: '토요일' },
];

export const QuietHoursModal: React.FC<QuietHoursModalProps> = ({
  visible,
  onClose,
  onSave,
  initialQuietHours
}) => {
  const [enabled, setEnabled] = useState(initialQuietHours.enabled);
  const [startTime, setStartTime] = useState(initialQuietHours.start);
  const [endTime, setEndTime] = useState(initialQuietHours.end);
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // 모든 요일 기본값
  const [allowUrgent, setAllowUrgent] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<'start' | 'end' | null>(null);

  const handleSave = () => {
    const quietHours: QuietHours = {
      enabled,
      start: startTime,
      end: endTime
    };

    onSave(quietHours);
    onClose();
  };

  const applyPreset = (preset: typeof PRESET_SCHEDULES[0]) => {
    setStartTime(preset.start);
    setEndTime(preset.end);
  };

  const toggleDay = (dayId: number) => {
    const newSelectedDays = selectedDays.includes(dayId)
      ? selectedDays.filter(d => d !== dayId)
      : [...selectedDays, dayId].sort();
    setSelectedDays(newSelectedDays);
  };

  const formatTimeRange = () => {
    return `${startTime} ~ ${endTime}`;
  };

  const getTimeDescription = () => {
    const start = parseInt(startTime.split(':')[0]);
    const end = parseInt(endTime.split(':')[0]);
    
    if (start > end || (start === end && startTime > endTime)) {
      // 다음날까지 이어지는 경우
      return '다음날까지 이어지는 시간대';
    } else if (start < 6) {
      return '새벽 시간대';
    } else if (start < 12) {
      return '오전 시간대';
    } else if (start < 18) {
      return '오후 시간대';
    } else {
      return '저녁/밤 시간대';
    }
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  };

  const TimeSelector = ({ 
    label, 
    value, 
    onSelect 
  }: { 
    label: string; 
    value: string; 
    onSelect: (time: string) => void;
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <View style={styles.timeSelector}>
        <TouchableOpacity 
          style={styles.timeSelectorButton}
          onPress={() => setIsOpen(!isOpen)}
        >
          <Text style={styles.timeSelectorLabel}>{label}</Text>
          <Text style={styles.timeSelectorValue}>{value}</Text>
          <Ionicons 
            name={isOpen ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#666" 
          />
        </TouchableOpacity>

        {isOpen && (
          <View style={styles.timeOptions}>
            <ScrollView style={styles.timeOptionsScroll} showsVerticalScrollIndicator={false}>
              {generateTimeOptions().map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeOption,
                    value === time && styles.selectedTimeOption
                  ]}
                  onPress={() => {
                    onSelect(time);
                    setIsOpen(false);
                  }}
                >
                  <Text style={[
                    styles.timeOptionText,
                    value === time && styles.selectedTimeOptionText
                  ]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
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
          <Text style={styles.title}>방해 금지 시간</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>저장</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* 활성화 토글 */}
          <View style={styles.section}>
            <View style={styles.enabledContainer}>
              <View>
                <Text style={styles.enabledTitle}>방해 금지 모드</Text>
                <Text style={styles.enabledSubtitle}>
                  설정한 시간대에는 알림을 받지 않습니다
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={setEnabled}
                trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {enabled && (
            <>
              {/* 현재 설정 요약 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>현재 설정</Text>
                <View style={styles.summaryContainer}>
                  <Ionicons name="moon-outline" size={20} color="#4CAF50" />
                  <View style={styles.summaryContent}>
                    <Text style={styles.summaryText}>{formatTimeRange()}</Text>
                    <Text style={styles.summaryDescription}>{getTimeDescription()}</Text>
                  </View>
                </View>
              </View>

              {/* 빠른 설정 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>빠른 설정</Text>
                <View style={styles.presetsContainer}>
                  {PRESET_SCHEDULES.map((preset, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.presetItem}
                      onPress={() => applyPreset(preset)}
                    >
                      <Text style={styles.presetTitle}>{preset.name}</Text>
                      <Text style={styles.presetSubtitle}>
                        {preset.description} ({preset.start} ~ {preset.end})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 시간 설정 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>시간 설정</Text>
                <Text style={styles.sectionDescription}>
                  방해 금지 시작 및 종료 시간을 설정하세요
                </Text>

                <TimeSelector
                  label="시작 시간"
                  value={startTime}
                  onSelect={setStartTime}
                />

                <TimeSelector
                  label="종료 시간"
                  value={endTime}
                  onSelect={setEndTime}
                />

                <View style={styles.timeHelpContainer}>
                  <Ionicons name="information-circle-outline" size={16} color="#666" />
                  <Text style={styles.timeHelpText}>
                    시작 시간이 종료 시간보다 늦으면 다음날까지 이어집니다
                  </Text>
                </View>
              </View>

              {/* 적용 요일 설정 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>적용 요일</Text>
                <Text style={styles.sectionDescription}>
                  방해 금지 시간을 적용할 요일을 선택하세요
                </Text>

                <View style={styles.weekdaysContainer}>
                  {WEEKDAYS.map((day) => (
                    <TouchableOpacity
                      key={day.id}
                      style={[
                        styles.weekdayButton,
                        selectedDays.includes(day.id) && styles.selectedWeekdayButton
                      ]}
                      onPress={() => toggleDay(day.id)}
                    >
                      <Text
                        style={[
                          styles.weekdayText,
                          selectedDays.includes(day.id) && styles.selectedWeekdayText
                        ]}
                      >
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.weekdaysSummary}>
                  <Text style={styles.weekdaysSummaryText}>
                    선택된 요일: {selectedDays.length === 7 ? '매일' : 
                                selectedDays.length === 5 && selectedDays.every(d => d >= 1 && d <= 5) ? '평일' :
                                selectedDays.length === 2 && selectedDays.includes(0) && selectedDays.includes(6) ? '주말' :
                                selectedDays.map(d => WEEKDAYS.find(w => w.id === d)?.label).join(', ')}
                  </Text>
                </View>
              </View>

              {/* 예외 설정 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>예외 설정</Text>
                
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => setAllowUrgent(!allowUrgent)}
                >
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>긴급 알림 허용</Text>
                    <Text style={styles.optionDescription}>
                      중요도가 높은 작업은 방해 금지 시간에도 알림을 받습니다
                    </Text>
                  </View>
                  <Switch
                    value={allowUrgent}
                    onValueChange={setAllowUrgent}
                    trackColor={{ false: '#E0E0E0', true: '#FF9800' }}
                    thumbColor="#FFFFFF"
                    style={styles.optionSwitch}
                  />
                </TouchableOpacity>
              </View>

              {/* 테스트 */}
              <View style={styles.section}>
                <TouchableOpacity
                  style={styles.testButton}
                  onPress={() => {
                    // 현재 시간이 방해 금지 시간에 해당하는지 확인하는 로직
                    const now = new Date();
                    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                    
                    let isInQuietHours = false;
                    const startHour = parseInt(startTime.split(':')[0]);
                    const endHour = parseInt(endTime.split(':')[0]);
                    const currentHour = now.getHours();

                    if (startHour > endHour) {
                      // 다음날까지 이어지는 경우 (예: 22:00 ~ 07:00)
                      isInQuietHours = currentHour >= startHour || currentHour < endHour;
                    } else {
                      // 같은 날 내 (예: 12:00 ~ 13:00)
                      isInQuietHours = currentHour >= startHour && currentHour < endHour;
                    }

                    alert(
                      isInQuietHours 
                        ? `현재 시간(${currentTime})은 방해 금지 시간입니다. 알림이 차단됩니다.`
                        : `현재 시간(${currentTime})은 방해 금지 시간이 아닙니다. 정상적으로 알림을 받습니다.`
                    );
                  }}
                >
                  <Ionicons name="time-outline" size={20} color="#4CAF50" />
                  <Text style={styles.testButtonText}>현재 시간으로 테스트</Text>
                </TouchableOpacity>
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
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  summaryContent: {
    marginLeft: 10,
  },
  summaryText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  summaryDescription: {
    fontSize: 14,
    color: '#666',
  },
  presetsContainer: {
    gap: 8,
  },
  presetItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
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
  timeSelector: {
    marginBottom: 16,
  },
  timeSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timeSelectorLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
    minWidth: 60,
  },
  timeSelectorValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    flex: 1,
  },
  timeOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timeOptionsScroll: {
    flex: 1,
  },
  timeOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  selectedTimeOption: {
    backgroundColor: '#F1F8E9',
  },
  timeOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedTimeOptionText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  timeHelpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  timeHelpText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    fontStyle: 'italic',
  },
  weekdaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  weekdaysSummary: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
  },
  weekdaysSummaryText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
    color: '#666',
  },
  optionSwitch: {
    marginLeft: 12,
  },
  testButton: {
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
  testButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 8,
  },
});