import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { TodoColors } from '@/constants/Colors';
import { Category } from '@/types/Todo';
import {
  RecurringRule,
  CreateRecurringRuleRequest,
  RecurringType,
  DeleteOption
} from '@/types/RecurringRule';
import { recurringRulesApi, recurringUtils } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface RecurringRuleManagerProps {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  onRuleCreated?: (rule: RecurringRule, instanceCount: number) => void;
}

const RECURRING_TYPES: { value: RecurringType; label: string }[] = [
  { value: 'daily', label: '매일' },
  { value: 'weekly', label: '매주' },
  { value: 'monthly', label: '매월' }
];

const WEEKDAYS = [
  { value: 0, label: '일', short: '일' },
  { value: 1, label: '월', short: '월' },
  { value: 2, label: '화', short: '화' },
  { value: 3, label: '수', short: '수' },
  { value: 4, label: '목', short: '목' },
  { value: 5, label: '금', short: '금' },
  { value: 6, label: '토', short: '토' }
];

export const RecurringRuleManager: React.FC<RecurringRuleManagerProps> = ({
  visible,
  onClose,
  categories,
  onRuleCreated
}) => {
  const { user } = useAuth();
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState<CreateRecurringRuleRequest>({
    name: '',
    template: {
      text: '',
      importance: 3,
      category_id: null
    },
    start_date: new Date().toISOString().split('T')[0],
    recurring_type: 'daily',
    interval: 1
  });

  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);

  useEffect(() => {
    if (visible && user) {
      loadRules();
    }
  }, [visible, user]);

  const loadRules = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const rulesData = await recurringRulesApi.getRecurringRules(user.id);
      console.log('로드된 규칙들:', rulesData);
      setRules(rulesData);
    } catch (error) {
      console.error('반복 규칙 로드 오류:', error);
      Alert.alert('오류', '반복 규칙을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      template: {
        text: '',
        importance: 3,
        category_id: null
      },
      start_date: new Date().toISOString().split('T')[0],
      recurring_type: 'daily',
      interval: 1
    });
    setSelectedDays([]);
    setSelectedTime(null);
  };

  const handleCreateRule = async () => {
    if (!user) return;
    
    if (!formData.name.trim() || !formData.template.text.trim()) {
      Alert.alert('오류', '규칙 이름과 작업 내용을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      const request: CreateRecurringRuleRequest = {
        ...formData,
        days_of_week: formData.recurring_type === 'weekly' ? selectedDays : undefined,
        time_of_day: selectedTime ? 
          `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}` 
          : undefined
      };

      const result = await recurringRulesApi.createRecurringRuleWithInstances(user.id, request);
      
      Alert.alert(
        '성공', 
        `반복 규칙이 생성되었습니다!\n${result.instanceCount}개의 작업이 예약되었습니다.`
      );
      
      setRules(prev => [result.rule, ...prev]);
      setShowCreateForm(false);
      resetForm();
      
      // 규칙 목록 새로고침
      await loadRules();
      
      if (onRuleCreated) {
        onRuleCreated(result.rule, result.instanceCount);
      }
    } catch (error) {
      console.error('반복 규칙 생성 오류:', error);
      Alert.alert('오류', '반복 규칙을 생성하는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = (rule: RecurringRule) => {
    console.log('삭제 버튼 클릭됨:', rule);
    
    if (Platform.OS === 'web') {
      // 웹 환경에서는 confirm 사용
      const result = window.confirm('반복 규칙을 삭제하시겠습니까?\n\n확인: 규칙만 삭제\n취소: 아무것도 하지 않음');
      if (result) {
        deleteRule(rule.id, 'rule_only');
      }
    } else {
      Alert.alert(
        '반복 규칙 삭제',
        '어떻게 삭제하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '규칙만 삭제',
            onPress: () => deleteRule(rule.id, 'rule_only')
          },
          {
            text: '규칙과 모든 작업 삭제',
            style: 'destructive',
            onPress: () => deleteRule(rule.id, 'rule_and_instances')
          }
        ]
      );
    }
  };

  const deleteRule = async (ruleId: string, option: DeleteOption) => {
    try {
      setLoading(true);
      await recurringRulesApi.deleteRecurringRule(ruleId, option);
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
      
      const message = option === 'rule_only' 
        ? '반복 규칙만 삭제되었습니다. 기존 작업들은 유지됩니다.'
        : '반복 규칙과 모든 연관된 작업이 삭제되었습니다.';
      
      Alert.alert('삭제 완료', message);
    } catch (error) {
      console.error('반복 규칙 삭제 오류:', error);
      Alert.alert('오류', '반복 규칙을 삭제하는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const renderRuleItem = (rule: RecurringRule) => {
    const description = recurringUtils.getRecurrenceDescription(rule);
    const nextDate = recurringUtils.getNextScheduledDate(rule);
    
    return (
      <View key={rule.id} style={styles.ruleItem}>
        <View style={styles.ruleHeader}>
          <Text style={styles.ruleName}>{rule.name}</Text>
          <TouchableOpacity
            onPress={() => handleDeleteRule(rule)}
            style={styles.deleteButton}
          >
            <MaterialIcons name="delete" size={20} color={TodoColors.delete} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.ruleTask}>{rule.template?.text || '작업 내용 없음'}</Text>
        <Text style={styles.ruleDescription}>{description}</Text>
        
        {nextDate && (
          <Text style={styles.nextDate}>
            다음 실행: {nextDate.toLocaleDateString('ko-KR')} {nextDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
        
        <View style={styles.ruleStatus}>
          <Text style={[styles.statusText, rule.is_active ? styles.activeStatus : styles.inactiveStatus]}>
            {rule.is_active ? '활성' : '비활성'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color={TodoColors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>반복 작업 관리</Text>
          <TouchableOpacity 
            onPress={() => setShowCreateForm(true)}
            style={styles.addButton}
          >
            <MaterialIcons name="add" size={24} color={TodoColors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {rules.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="repeat" size={48} color={TodoColors.text.tertiary} />
              <Text style={styles.emptyText}>아직 반복 작업이 없습니다</Text>
              <Text style={styles.emptySubtext}>+ 버튼을 눌러 반복 작업을 만들어보세요</Text>
            </View>
          ) : (
            rules.map(renderRuleItem)
          )}
        </ScrollView>

        {/* 반복 규칙 생성 모달 */}
        <Modal
          visible={showCreateForm}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setShowCreateForm(false)}>
                <MaterialIcons name="close" size={24} color={TodoColors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.title}>반복 작업 만들기</Text>
              <TouchableOpacity 
                onPress={handleCreateRule}
                disabled={loading}
                style={[styles.saveButton, loading && styles.disabledButton]}
              >
                <Text style={styles.saveButtonText}>저장</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContent}>
              {/* 규칙 이름 */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>규칙 이름</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  placeholder="예: 매일 운동하기"
                  placeholderTextColor={TodoColors.text.tertiary}
                />
              </View>

              {/* 작업 내용 */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>작업 내용</Text>
                <TextInput
                  style={styles.input}
                  value={formData.template.text}
                  onChangeText={(text) => setFormData(prev => ({ 
                    ...prev, 
                    template: { ...prev.template, text } 
                  }))}
                  placeholder="할 일을 입력하세요"
                  placeholderTextColor={TodoColors.text.tertiary}
                />
              </View>

              {/* 중요도 */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>중요도: {formData.template.importance}</Text>
                <View style={styles.importanceContainer}>
                  {[1, 2, 3, 4, 5].map(level => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.importanceButton,
                        formData.template.importance >= level && styles.importanceButtonActive
                      ]}
                      onPress={() => setFormData(prev => ({
                        ...prev,
                        template: { ...prev.template, importance: level }
                      }))}
                    >
                      <MaterialIcons 
                        name="star" 
                        size={20} 
                        color={formData.template.importance >= level ? '#FFD700' : TodoColors.text.tertiary} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 카테고리 */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>카테고리</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.template.category_id}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      template: { ...prev.template, category_id: value }
                    }))}
                    style={styles.picker}
                  >
                    <Picker.Item label="카테고리 없음" value={null} />
                    {categories.map(category => (
                      <Picker.Item 
                        key={category.id} 
                        label={category.name} 
                        value={category.id} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* 반복 유형 */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>반복 유형</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.recurring_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, recurring_type: value }))}
                    style={styles.picker}
                  >
                    {RECURRING_TYPES.map(type => (
                      <Picker.Item key={type.value} label={type.label} value={type.value} />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* 간격 */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  {formData.recurring_type === 'daily' && '며칠마다'}
                  {formData.recurring_type === 'weekly' && '몇 주마다'}
                  {formData.recurring_type === 'monthly' && '몇 개월마다'}
                </Text>
                <TextInput
                  style={styles.numberInput}
                  value={formData.interval.toString()}
                  onChangeText={(text) => {
                    const num = parseInt(text) || 1;
                    setFormData(prev => ({ ...prev, interval: Math.max(1, num) }));
                  }}
                  keyboardType="numeric"
                />
              </View>

              {/* 요일 선택 (주간 반복시) */}
              {formData.recurring_type === 'weekly' && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>요일 선택</Text>
                  <View style={styles.weekdaysContainer}>
                    {WEEKDAYS.map(day => (
                      <TouchableOpacity
                        key={day.value}
                        style={[
                          styles.weekdayButton,
                          selectedDays.includes(day.value) && styles.weekdayButtonActive
                        ]}
                        onPress={() => toggleDay(day.value)}
                      >
                        <Text style={[
                          styles.weekdayText,
                          selectedDays.includes(day.value) && styles.weekdayTextActive
                        ]}>
                          {day.short}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* 시작일 */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>시작일</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {new Date(formData.start_date).toLocaleDateString('ko-KR')}
                  </Text>
                  <MaterialIcons name="calendar-today" size={20} color={TodoColors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* 종료일 */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>종료일 (선택사항)</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {formData.end_date ? new Date(formData.end_date).toLocaleDateString('ko-KR') : '설정하지 않음'}
                  </Text>
                  <MaterialIcons name="calendar-today" size={20} color={TodoColors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* 시간 */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>시간 (선택사항)</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {selectedTime ? 
                      selectedTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : 
                      '설정하지 않음'
                    }
                  </Text>
                  <MaterialIcons name="access-time" size={20} color={TodoColors.text.secondary} />
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Date Pickers */}
            {showStartDatePicker && (
              <Modal
                transparent={true}
                animationType="slide"
                visible={showStartDatePicker}
                onRequestClose={() => setShowStartDatePicker(false)}
              >
                <View style={styles.pickerModalOverlay}>
                  <View style={styles.pickerModalContent}>
                    <View style={styles.pickerHeader}>
                      <TouchableOpacity onPress={() => setShowStartDatePicker(false)}>
                        <Text style={styles.pickerHeaderButton}>취소</Text>
                      </TouchableOpacity>
                      <Text style={styles.pickerHeaderTitle}>시작일 선택</Text>
                      <TouchableOpacity onPress={() => setShowStartDatePicker(false)}>
                        <Text style={styles.pickerHeaderButton}>확인</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={new Date(formData.start_date)}
                      mode="date"
                      display="spinner"
                      onChange={(event, selectedDate) => {
                        if (selectedDate) {
                          setFormData(prev => ({ 
                            ...prev, 
                            start_date: selectedDate.toISOString().split('T')[0] 
                          }));
                        }
                      }}
                    />
                  </View>
                </View>
              </Modal>
            )}

            {showEndDatePicker && (
              <Modal
                transparent={true}
                animationType="slide"
                visible={showEndDatePicker}
                onRequestClose={() => setShowEndDatePicker(false)}
              >
                <View style={styles.pickerModalOverlay}>
                  <View style={styles.pickerModalContent}>
                    <View style={styles.pickerHeader}>
                      <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                        <Text style={styles.pickerHeaderButton}>취소</Text>
                      </TouchableOpacity>
                      <Text style={styles.pickerHeaderTitle}>종료일 선택</Text>
                      <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                        <Text style={styles.pickerHeaderButton}>확인</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={formData.end_date ? new Date(formData.end_date) : new Date()}
                      mode="date"
                      display="spinner"
                      onChange={(event, selectedDate) => {
                        if (selectedDate) {
                          setFormData(prev => ({ 
                            ...prev, 
                            end_date: selectedDate.toISOString().split('T')[0] 
                          }));
                        }
                      }}
                    />
                  </View>
                </View>
              </Modal>
            )}

            {showTimePicker && (
              <Modal
                transparent={true}
                animationType="slide"
                visible={showTimePicker}
                onRequestClose={() => setShowTimePicker(false)}
              >
                <View style={styles.pickerModalOverlay}>
                  <View style={styles.pickerModalContent}>
                    <View style={styles.pickerHeader}>
                      <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                        <Text style={styles.pickerHeaderButton}>취소</Text>
                      </TouchableOpacity>
                      <Text style={styles.pickerHeaderTitle}>시간 선택</Text>
                      <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                        <Text style={styles.pickerHeaderButton}>확인</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={selectedTime || new Date()}
                      mode="time"
                      display="spinner"
                      onChange={(event, selectedDate) => {
                        if (selectedDate) {
                          setSelectedTime(selectedDate);
                        }
                      }}
                    />
                  </View>
                </View>
              </Modal>
            )}
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TodoColors.background.app,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: TodoColors.text.primary,
  },
  addButton: {
    padding: 4,
  },
  saveButton: {
    backgroundColor: TodoColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formContent: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: TodoColors.text.secondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: TodoColors.text.tertiary,
    marginTop: 8,
    textAlign: 'center',
  },
  ruleItem: {
    backgroundColor: TodoColors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ruleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: TodoColors.text.primary,
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  ruleTask: {
    fontSize: 14,
    color: TodoColors.text.primary,
    marginBottom: 4,
  },
  ruleDescription: {
    fontSize: 13,
    color: TodoColors.text.secondary,
    marginBottom: 8,
  },
  nextDate: {
    fontSize: 12,
    color: TodoColors.primary,
    marginBottom: 8,
  },
  ruleStatus: {
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeStatus: {
    backgroundColor: '#e8f5e8',
    color: '#4caf50',
  },
  inactiveStatus: {
    backgroundColor: '#ffeaa7',
    color: '#f39c12',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: TodoColors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: TodoColors.background.input,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  numberInput: {
    backgroundColor: TodoColors.background.input,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: 80,
  },
  pickerContainer: {
    backgroundColor: TodoColors.background.input,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 50,
  },
  picker: {
    width: '100%',
  },
  importanceContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  importanceButton: {
    padding: 8,
  },
  importanceButtonActive: {
    backgroundColor: '#fff3cd',
    borderRadius: 4,
  },
  weekdaysContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  weekdayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: TodoColors.background.input,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  weekdayButtonActive: {
    backgroundColor: TodoColors.primary,
    borderColor: TodoColors.primary,
  },
  weekdayText: {
    fontSize: 14,
    color: TodoColors.text.secondary,
  },
  weekdayTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  dateButton: {
    backgroundColor: TodoColors.background.input,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateButtonText: {
    fontSize: 16,
    color: TodoColors.text.primary,
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pickerHeaderButton: {
    fontSize: 16,
    color: TodoColors.primary,
    fontWeight: '600',
  },
  pickerHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: TodoColors.text.primary,
  },
}); 