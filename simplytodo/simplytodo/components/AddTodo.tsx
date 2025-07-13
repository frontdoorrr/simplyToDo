import React, { useState } from 'react';
import { StyleSheet, TextInput, View, TouchableOpacity, Text, Platform, Modal, ScrollView, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TodoColors } from '@/constants/Colors';
import { CategoryManager } from './CategoryManager';
import { Todo } from '@/types/Todo';
import * as Notifications from 'expo-notifications';

interface AddTodoProps {
  onAddTodo: (text: string, importance: number, dueDate: number | null, categoryId: string | null) => void;
  onAddSubtask?: (parentId: string, text: string, importance: number, dueDate: number | null, categoryId: string | null) => void;
  mainTodos?: Todo[]; // 서브태스크를 위한 메인 할 일 목록
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

export const AddTodo: React.FC<AddTodoProps> = ({ onAddTodo, onAddSubtask, mainTodos = [] }) => {
  const [text, setText] = useState('');
  const [importance, setImportance] = useState(3); // Default importance level (1-5)
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  // 서브태스크 모드 상태
  const [isSubtaskMode, setIsSubtaskMode] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [showParentSelector, setShowParentSelector] = useState(false);

  const handleAddTodo = () => {
    if (text.trim()) {
      if (isSubtaskMode && selectedParentId && onAddSubtask) {
        // 서브태스크 추가
        onAddSubtask(selectedParentId, text.trim(), importance, dueDate ? dueDate.getTime() : null, selectedCategoryId);
      } else {
        // 메인 할 일 추가
        onAddTodo(text.trim(), importance, dueDate ? dueDate.getTime() : null, selectedCategoryId);
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
      alert('서브태스크를 추가하려면 먼저 메인 할 일을 생성하세요.');
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

  return (
    <View style={styles.container}>
      {/* 서브태스크 모드 상태 표시 */}
      {isSubtaskMode && (
        <View style={styles.subtaskModeHeader}>
          <MaterialIcons name="subdirectory-arrow-right" size={16} color={TodoColors.primary} />
          <Text style={styles.subtaskModeText}>서브태스크 모드</Text>
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
        
        {/* 서브태스크 모드 토글 버튼 */}
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
        <Text style={styles.importanceLabel}>Priority:</Text>
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
    marginBottom: 8,
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
});
