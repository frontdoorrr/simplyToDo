import React, { useState } from 'react';
import { StyleSheet, TextInput, View, TouchableOpacity, Text, Platform, Modal, ScrollView, FlatList, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TodoColors } from '@/constants/Colors';
import { CategoryManager } from './CategoryManager';
import { Todo } from '@/types/Todo';
import * as Notifications from 'expo-notifications';
import { aiService } from '@/lib/ai/AIService';
import { recurringRulesApi } from '@/lib/supabase';
import { CreateRecurringRuleRequest } from '@/types/RecurringRule';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

interface AddTodoProps {
  onAddTodo: (text: string, importance: number, dueDate: number | null, categoryId: string | null) => Promise<string>; // Promise<todoId> 반환
  onAddSubtask?: (parentId: string, text: string, importance: number, dueDate: number | null, categoryId: string | null) => void;
  onAddAISubtasks?: (parentId: string, aiSuggestions: any[]) => Promise<void>; // AI SubTask 추가 콜백
  mainTodos?: Todo[]; // Subtask를 위한 메인 할 일 목록
}

// 할 일 마감 알림 예약 함수
async function scheduleTodoNotification(title: string, dueDate: Date) {
  const now = new Date();
  const seconds = Math.max(1, Math.floor((dueDate.getTime() - now.getTime()) / 1000));
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '[SimplyTodo]할 일 마감 알림',
      body: `"${title}" 마감이 오늘이에요`,
    },
    trigger: { seconds, repeats: false },
  });
}

export const AddTodo: React.FC<AddTodoProps> = ({ onAddTodo, onAddSubtask, onAddAISubtasks, mainTodos = [] }) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [importance, setImportance] = useState(3); // Default importance level (1-5)
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  // Subtask 모드 상태
  const [isSubtaskMode, setIsSubtaskMode] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [showParentSelector, setShowParentSelector] = useState(false);
  
  // AI 관련 상태
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  const handleAddTodo = async () => {
    if (text.trim()) {
      if (isSubtaskMode && selectedParentId && onAddSubtask) {
        // Subtask 추가
        onAddSubtask(selectedParentId, text.trim(), importance, dueDate ? dueDate.getTime() : null, selectedCategoryId);
      } else {
        // 메인 할 일 추가
        await onAddTodo(text.trim(), importance, dueDate ? dueDate.getTime() : null, selectedCategoryId);
      }
      
      // 마감일이 있으면 알림 예약
      if (dueDate) {
        scheduleTodoNotification(text.trim(), dueDate);
      }
      
      // 상태 초기화
      setText('');
      setDueDate(null);
      setSelectedCategoryId(null);
      setIsSubtaskMode(false);
      setSelectedParentId(null);
    }
  };
  
  const toggleSubtaskMode = () => {
    if (mainTodos.length === 0) {
      alert('Subtask를 추가하려면 먼저 메인 할 일을 생성하세요.');
      return;
    }
    
    setIsSubtaskMode(!isSubtaskMode);
    setSelectedParentId(null);
    setShowParentSelector(false);
  };
  
  const selectParent = (parentId: string) => {
    setSelectedParentId(parentId);
    setShowParentSelector(false);
  };
  
  const getSelectedParentName = () => {
    if (!selectedParentId) return '';
    const parent = mainTodos.find(todo => todo.id === selectedParentId);
    return parent ? parent.text : '';
  };
  
  const getImportanceColor = (importance: number) => {
    const baseRGB = [220, 237, 220]; // 연한 민트 그린
    const darkRGB = [76, 175, 80];   // 진한 민트 그린
    const ratio = (importance - 1) / 4;
    const r = Math.round(baseRGB[0] + (darkRGB[0] - baseRGB[0]) * ratio);
    const g = Math.round(baseRGB[1] + (darkRGB[1] - baseRGB[1]) * ratio);
    const b = Math.round(baseRGB[2] + (darkRGB[2] - baseRGB[2]) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  };
  
  const selectDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setDueDate(date);
    setShowDateModal(false);
  };
  
  const clearDueDate = () => {
    setDueDate(null);
    setShowDateModal(false);
  };
  
  const formatDate = (date: Date | null): string => {
    if (!date) return '마감일 없음';
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'short'
    });
  };

  const handleImportanceChange = (level: number) => {
    setImportance(level);
  };

  const handleAIGenerate = async () => {
    if (!text.trim()) {
      Alert.alert('알림', 'AI로 SubTask를 생성하려면 먼저 메인 태스크를 입력해주세요.');
      return;
    }

    if (!aiService.isReady()) {
      Alert.alert('오류', 'AI 서비스가 아직 초기화되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setIsAIGenerating(true);
    
    try {
      const response = await aiService.generateSubtasks({
        mainTask: text.trim(),
        context: {
          categoryId: selectedCategoryId,
          userPreferences: {
            maxSubtasks: 5,
            preferredComplexity: 'detailed'
          }
        }
      });

      if (response.success && response.data) {
        setAiSuggestions(response.data.suggestedSubtasks);
        setShowAIModal(true);
        
        // AI가 추천한 중요도와 카테고리 적용
        if (response.data.suggestedImportance) {
          setImportance(response.data.suggestedImportance);
        }
      } else {
        const errorMessage = response.error || 'AI SubTask 생성에 실패했습니다.';
        logger.ai('AI 서비스 에러:', errorMessage);
        Alert.alert('AI 서비스 오류', errorMessage);
      }
    } catch (error) {
      logger.error('AI 서비스 연결 오류:', error);
      const errorMessage = error instanceof Error ? error.message : 'AI 서비스 연결에 실패했습니다.';
      Alert.alert('연결 오류', errorMessage);
    } finally {
      setIsAIGenerating(false);
    }
  };

  const handleAcceptAISuggestions = async () => {
    logger.debug('=== AI 제안 적용 시작 ===');
    
    if (!text.trim() || !onAddAISubtasks || !user) {
      logger.debug('조건 체크 실패:', { text: text.trim(), onAddAISubtasks: !!onAddAISubtasks, user: !!user });
      return;
    }

    // 처리 중 상태 설정
    logger.debug('로딩 상태 설정 시작');
    setIsAIGenerating(true);
    logger.debug('로딩 상태 설정 완료');

    try {
      logger.ai('AI 제안 적용 시작:', {
        mainTask: text.trim(),
        suggestionsCount: aiSuggestions.length,
        userId: user.id
      });

      // 먼저 메인 태스크 추가하고 ID 받기
      logger.debug('메인 태스크 생성 시작');
      const parentId = await onAddTodo(text.trim(), importance, dueDate ? dueDate.getTime() : null, selectedCategoryId);
      logger.debug('메인 태스크 생성 완료:', parentId);
      
      if (!parentId) {
        logger.error('메인 태스크 생성 실패: parentId가 null');
        throw new Error('메인 태스크 생성에 실패했습니다.');
      }

      // 마감일이 있으면 알림 예약
      if (dueDate) {
        scheduleTodoNotification(text.trim(), dueDate);
      }

      // 반복 태스크와 일반 태스크 분리
      const regularTasks = aiSuggestions.filter(suggestion => !suggestion.isRecurring);
      const recurringTasks = aiSuggestions.filter(suggestion => suggestion.isRecurring);

      logger.debug('태스크 분리 완료:', {
        regularTasks: regularTasks.length,
        recurringTasks: recurringTasks.length
      });

      // 일반 AI 제안 SubTask들 추가
      if (regularTasks.length > 0) {
        logger.debug('일반 서브태스크 생성 시작, 개수:', regularTasks.length);
        logger.debug('일반 서브태스크 데이터:', regularTasks);
        
        logger.debug('onAddAISubtasks 함수 호출 시작');
        await onAddAISubtasks(parentId, regularTasks);
        logger.debug('onAddAISubtasks 함수 호출 완료');
        
        logger.debug('일반 서브태스크 생성 완료');
      } else {
        logger.debug('일반 서브태스크 없음');
      }

      // 반복 태스크들을 반복 규칙으로 생성 (임시로 비활성화)
      let recurringRulesCreated = 0;
      
      // 임시로 모든 반복 태스크를 일반 서브태스크로 처리
      logger.debug('임시로 반복 태스크를 일반 서브태스크로 처리, 개수:', recurringTasks.length);
      
      if (recurringTasks.length > 0) {
        logger.debug('반복 태스크 데이터:', recurringTasks);
        
        const allRecurringAsRegular = recurringTasks.map(task => ({
          ...task,
          isRecurring: false // 반복 플래그 제거
        }));
        
        logger.debug('변환된 반복 태스크:', allRecurringAsRegular);
        
        try {
          logger.debug('반복 태스크를 일반 서브태스크로 처리 시작');
          await onAddAISubtasks(parentId, allRecurringAsRegular);
          logger.debug('반복 태스크를 일반 서브태스크로 처리 완료');
        } catch (error) {
          logger.error('반복 태스크 처리 실패:', error);
        }
      } else {
        logger.debug('반복 태스크 없음');
      }
      
      // 원래 반복 규칙 생성 로직 (임시 비활성화)
      /*
      for (const suggestion of recurringTasks) {
        logger.ai('반복 태스크 처리:', suggestion);
        
        if (suggestion.recurrenceType && suggestion.recurrenceDays) {
          try {
            const recurringRequest: CreateRecurringRuleRequest = {
              name: `${suggestion.text} - 자동 생성`,
              description: `AI가 제안한 반복 태스크: ${text.trim()}`,
              template: {
                text: suggestion.text,
                importance: suggestion.importance || 3,
                category_id: selectedCategoryId,
                due_time: dueDate ? `${dueDate.getHours().toString().padStart(2, '0')}:${dueDate.getMinutes().toString().padStart(2, '0')}` : undefined
              },
              start_date: new Date().toISOString().split('T')[0],
              recurring_type: suggestion.recurrenceType,
              interval: suggestion.recurrenceInterval || 1,
              days_of_week: suggestion.recurrenceDays,
              max_instances: 5 // 인스턴스 수를 5개로 줄임
            };

            logger.debug('반복 규칙 생성 요청:', recurringRequest);
            await recurringRulesApi.createRecurringRuleWithInstances(user.id, recurringRequest);
            recurringRulesCreated++;
            logger.debug('반복 규칙 생성 완료');
          } catch (error) {
            logger.error('반복 태스크 생성 실패:', error);
            // 반복 태스크 생성 실패 시 일반 서브태스크로 폴백
            try {
              await onAddAISubtasks(parentId, [suggestion]);
              logger.debug('반복 태스크를 일반 서브태스크로 폴백 완료');
            } catch (fallbackError) {
              logger.error('폴백 서브태스크 생성도 실패:', fallbackError);
            }
          }
        } else {
          // 반복 정보가 불완전한 경우 일반 서브태스크로 처리
          logger.debug('반복 정보 불완전, 일반 서브태스크로 처리');
          try {
            await onAddAISubtasks(parentId, [suggestion]);
          } catch (fallbackError) {
            logger.error('폴백 서브태스크 생성 실패:', fallbackError);
          }
        }
      }
      */

      // 상태 초기화
      logger.debug('상태 초기화 시작');
      setText('');
      setDueDate(null);
      setSelectedCategoryId(null);
      setShowAIModal(false);
      setAiSuggestions([]);
      logger.debug('상태 초기화 완료');
      
      const totalTasks = regularTasks.length + recurringTasks.length;
      const message = recurringRulesCreated > 0 
        ? `메인 태스크와 ${regularTasks.length}개의 일반 SubTask, ${recurringRulesCreated}개의 반복 규칙이 생성되었습니다!`
        : `메인 태스크와 ${totalTasks}개의 AI SubTask가 추가되었습니다!`;
      
      logger.ai('AI 제안 적용 완료:', message);
      logger.debug('Alert 표시 시작');
      Alert.alert('완료', message);
      logger.debug('Alert 표시 완료');
    } catch (error) {
      logger.error('AI subtask creation error:', error);
      Alert.alert('오류', `AI SubTask 추가 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // 오류 시에도 모달 닫기
      setShowAIModal(false);
    } finally {
      // 처리 완료 후 로딩 상태 해제
      logger.debug('finally 블록 진입');
      setIsAIGenerating(false);
      logger.debug('로딩 상태 해제 완료');
      logger.debug('=== AI 제안 적용 종료 ===');
    }
  };

  return (
    <View style={styles.container}>
      {/* Subtask 모드 상태 표시 */}
      {isSubtaskMode && (
        <View style={styles.subtaskModeHeader}>
          <MaterialIcons name="subdirectory-arrow-right" size={16} color={TodoColors.primary} />
          <Text style={styles.subtaskModeText}>Subtask 모드</Text>
          {selectedParentId && (
            <Text style={styles.selectedParentText}>
              → {getSelectedParentName()}
            </Text>
          )}
        </View>
      )}
      
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, isSubtaskMode && styles.subtaskInput]}
          placeholder={isSubtaskMode ? "Add a subtask" : "Add a task"}
          placeholderTextColor="#999999"
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleAddTodo}
          returnKeyType="done"
        />
        
        {/* AI 생성 버튼 */}
        <TouchableOpacity
          style={[styles.aiButton, isAIGenerating && styles.aiButtonLoading]}
          onPress={handleAIGenerate}
          disabled={isAIGenerating || !text.trim()}
        >
          <MaterialIcons 
            name={isAIGenerating ? "hourglass-empty" : "auto-awesome"} 
            size={20} 
            color={isAIGenerating || !text.trim() ? TodoColors.text.secondary : TodoColors.primary} 
          />
        </TouchableOpacity>
        
        {/* Subtask 모드 토글 버튼 */}
        <TouchableOpacity
          style={[styles.subtaskToggle, isSubtaskMode && styles.subtaskToggleActive]}
          onPress={toggleSubtaskMode}
        >
          <MaterialIcons 
            name={isSubtaskMode ? "close" : "account-tree"} 
            size={20} 
            color={isSubtaskMode ? TodoColors.text.light : TodoColors.primary} 
          />
        </TouchableOpacity>
      </View>
      
      {/* 부모 태스크 선택 */}
      {isSubtaskMode && (
        <View style={styles.parentSelectorContainer}>
          <TouchableOpacity
            style={styles.parentSelector}
            onPress={() => setShowParentSelector(!showParentSelector)}
          >
            <Text style={styles.parentSelectorText}>
              {selectedParentId ? getSelectedParentName() : "부모 태스크 선택"}
            </Text>
            <MaterialIcons 
              name={showParentSelector ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
              size={20} 
              color={TodoColors.text.secondary} 
            />
          </TouchableOpacity>
          
          {showParentSelector && (
            <View style={styles.parentList}>
              {mainTodos.map((todo) => (
                <TouchableOpacity
                  key={todo.id}
                  style={[
                    styles.parentItem,
                    selectedParentId === todo.id && styles.selectedParentItem
                  ]}
                  onPress={() => selectParent(todo.id)}
                >
                  <Text style={[
                    styles.parentItemText,
                    selectedParentId === todo.id && styles.selectedParentItemText
                  ]}>
                    {todo.text}
                  </Text>
                  <View style={[styles.importanceDot, { backgroundColor: getImportanceColor(todo.importance) }]} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
      
      <View style={styles.importanceContainer}>
        <Text style={styles.importanceLabel}>Priority :</Text>
        <View style={styles.importanceLevelsWrapper}>
          <View style={styles.importanceLevels}>
            {[1, 2, 3, 4, 5].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.importanceButton,
                  importance === level && styles.selectedImportance,
                ]}
                onPress={() => handleImportanceChange(level)}>
                <Text 
                  style={[
                    styles.importanceText,
                    importance === level && styles.selectedImportanceText
                  ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
      
      <CategoryManager
        onCategorySelect={setSelectedCategoryId}
        selectedCategoryId={selectedCategoryId}
      />
      
      <TouchableOpacity 
        style={styles.dueDateButton}
        onPress={() => setShowDateModal(true)}>
        <MaterialIcons name="event" size={18} color={TodoColors.text.dark} />
        <Text style={styles.dueDateText}>
          {dueDate ? formatDate(dueDate) : '마감일 설정'}
        </Text>
      </TouchableOpacity>
      
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDateModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowDateModal(false)}
        >
          <View style={styles.datePickerContainer} onStartShouldSetResponder={() => true}>
            <Text style={styles.datePickerTitle}>마감일 선택</Text>
            
            <TouchableOpacity style={styles.dateOption} onPress={() => selectDate(0)}>
              <Text style={styles.dateOptionText}>오늘</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.dateOption} onPress={() => selectDate(1)}>
              <Text style={styles.dateOptionText}>내일</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.dateOption} onPress={() => selectDate(7)}>
              <Text style={styles.dateOptionText}>다음 주</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.dateOption} onPress={() => selectDate(30)}>
              <Text style={styles.dateOptionText}>한 달 후</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.dateOption, styles.clearOption]} onPress={clearDueDate}>
              <Text style={styles.clearOptionText}>마감일 없음</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowDateModal(false)}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* AI 제안 모달 */}
      <Modal
        visible={showAIModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAIModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowAIModal(false)}
        >
          <View style={styles.aiModalContainer} onStartShouldSetResponder={() => true}>
            <View style={styles.aiModalHeader}>
              <MaterialIcons name="auto-awesome" size={24} color={TodoColors.primary} />
              <Text style={styles.aiModalTitle}>AI SubTask 제안</Text>
              <TouchableOpacity onPress={() => setShowAIModal(false)}>
                <MaterialIcons name="close" size={24} color={TodoColors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.aiModalMainTask}>메인 태스크: {text}</Text>
            
            <ScrollView style={styles.aiSuggestionsList}>
              {aiSuggestions.map((suggestion, index) => (
                <View key={index} style={styles.aiSuggestionItem}>
                  <View style={styles.aiSuggestionHeader}>
                    <View style={styles.aiSuggestionTextContainer}>
                      <Text style={styles.aiSuggestionText}>{suggestion.text}</Text>
                      {suggestion.isRecurring && (
                        <View style={styles.recurringBadge}>
                          <MaterialIcons name="repeat" size={14} color="#fff" />
                          <Text style={styles.recurringText}>
                            {suggestion.recurrenceType === 'daily' ? '매일' : 
                             suggestion.recurrenceType === 'weekly' ? '매주' : '반복'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.aiSuggestionMeta}>
                      <Text style={styles.aiSuggestionImportance}>
                        중요도: {suggestion.importance || 3}
                      </Text>
                      {suggestion.estimatedDuration && (
                        <Text style={styles.aiSuggestionDuration}>
                          예상시간: {suggestion.estimatedDuration}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
            
            <View style={styles.aiModalActions}>
              <TouchableOpacity 
                style={styles.aiModalRejectButton}
                onPress={() => setShowAIModal(false)}
              >
                <Text style={styles.aiModalRejectText}>취소</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.aiModalAcceptButton, isAIGenerating && styles.aiModalAcceptButtonLoading]}
                onPress={handleAcceptAISuggestions}
                disabled={isAIGenerating}
              >
                <Text style={styles.aiModalAcceptText}>
                  {isAIGenerating ? '처리 중...' : '적용하기'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
      
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={handleAddTodo}
        disabled={!text.trim()}>
        <MaterialIcons name="add" size={24} color={TodoColors.text.light} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: TodoColors.background.app,
    marginBottom: 0,
  },
  subtaskModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: TodoColors.primary + '15',
    borderRadius: 6,
    marginBottom: 8,
  },
  subtaskModeText: {
    fontSize: 14,
    color: TodoColors.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
  selectedParentText: {
    fontSize: 14,
    color: TodoColors.text.secondary,
    marginLeft: 8,
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dueDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  dueDateText: {
    marginLeft: 8,
    color: TodoColors.text.dark,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    width: '80%',
    maxWidth: 300,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: TodoColors.text.primary,
  },
  dateOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dateOptionText: {
    fontSize: 16,
    color: TodoColors.text.primary,
  },
  clearOption: {
    marginTop: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 4,
  },
  clearOptionText: {
    color: '#ff6b6b',
    fontWeight: '500',
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: TodoColors.primary,
    borderRadius: 4,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    backgroundColor: TodoColors.background.input,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: TodoColors.text.secondary,
    flex: 1,
  },
  subtaskInput: {
    borderColor: TodoColors.primary,
    borderWidth: 2,
  },
  subtaskToggle: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: TodoColors.background.input,
    borderWidth: 1,
    borderColor: TodoColors.primary,
  },
  subtaskToggleActive: {
    backgroundColor: TodoColors.primary,
  },
  parentSelectorContainer: {
    marginTop: 8,
  },
  parentSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: TodoColors.background.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: TodoColors.text.secondary,
  },
  parentSelectorText: {
    fontSize: 14,
    color: TodoColors.text.primary,
    flex: 1,
  },
  parentList: {
    maxHeight: 150,
    backgroundColor: TodoColors.background.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: TodoColors.text.secondary,
    marginTop: 4,
  },
  parentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedParentItem: {
    backgroundColor: TodoColors.primary + '20',
  },
  parentItemText: {
    fontSize: 14,
    color: TodoColors.text.primary,
    flex: 1,
  },
  selectedParentItemText: {
    color: TodoColors.primary,
    fontWeight: '600',
  },
  importanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  importanceContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  importanceLabel: {
    fontSize: 14,
    marginRight: 10,
    color: '#555',
    width: '20%',
  },
  importanceLevelsWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importanceLevels: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  importanceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  selectedImportance: {
    backgroundColor: TodoColors.primary,
  },
  importanceText: {
    fontSize: 14,
    color: '#555',
  },
  selectedImportanceText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: TodoColors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  aiButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: TodoColors.background.input,
    borderWidth: 1,
    borderColor: TodoColors.primary,
    marginRight: 8,
  },
  aiButtonLoading: {
    opacity: 0.6,
  },
  aiModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  aiModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  aiModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: TodoColors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  aiModalMainTask: {
    fontSize: 16,
    color: TodoColors.text.primary,
    padding: 16,
    backgroundColor: TodoColors.background.card,
    margin: 16,
    borderRadius: 8,
    fontWeight: '500',
  },
  aiSuggestionsList: {
    maxHeight: 300,
    paddingHorizontal: 16,
  },
  aiSuggestionItem: {
    backgroundColor: TodoColors.background.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  aiSuggestionHeader: {
    flexDirection: 'column',
  },
  aiSuggestionTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiSuggestionText: {
    fontSize: 15,
    color: TodoColors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TodoColors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  recurringText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 2,
  },
  aiSuggestionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiSuggestionImportance: {
    fontSize: 12,
    color: TodoColors.primary,
    fontWeight: '600',
  },
  aiSuggestionDuration: {
    fontSize: 12,
    color: TodoColors.text.secondary,
  },
  aiModalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  aiModalRejectButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  aiModalRejectText: {
    color: TodoColors.text.secondary,
    fontWeight: '600',
  },
  aiModalAcceptButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: TodoColors.primary,
    alignItems: 'center',
  },
  aiModalAcceptButtonLoading: {
    backgroundColor: TodoColors.text.secondary,
    opacity: 0.7,
  },
  aiModalAcceptText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
