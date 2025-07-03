import React, { useState } from 'react';
import { StyleSheet, TextInput, View, TouchableOpacity, Text, Platform, Modal, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TodoColors } from '@/constants/Colors';
import { CategoryManager } from './CategoryManager';
import * as Notifications from 'expo-notifications';

interface AddTodoProps {
  onAddTodo: (text: string, importance: number, dueDate: number | null, categoryId: string | null) => void;
}

// 할 일 마감 알림 예약 함수
async function scheduleTodoNotification(title: string, dueDate: Date) {
  const now = new Date();
  const seconds = Math.max(1, Math.floor((dueDate.getTime() - now.getTime()) / 1000));
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '할 일 마감 알림',
      body: `"${title}" 마감 시간이 다가왔어요!`,
    },
    trigger: { seconds, repeats: false },
  });
}

export const AddTodo: React.FC<AddTodoProps> = ({ onAddTodo }) => {
  const [text, setText] = useState('');
  const [importance, setImportance] = useState(3); // Default importance level (1-5)
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const handleAddTodo = () => {
    if (text.trim()) {
      onAddTodo(text.trim(), importance, dueDate ? dueDate.getTime() : null, selectedCategoryId);
      // 마감일이 있으면 알림 예약
      if (dueDate) {
        scheduleTodoNotification(text.trim(), dueDate);
      }
      setText('');
      setDueDate(null);
      setSelectedCategoryId(null);
    }
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
      <TextInput
        style={styles.input}
        placeholder="Add a task"
        placeholderTextColor="#999999"
        value={text}
        onChangeText={setText}
        onSubmitEditing={handleAddTodo}
        returnKeyType="done"
      />
      
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
    borderRadius: 0,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
