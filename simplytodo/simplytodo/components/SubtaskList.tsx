import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TodoItem } from './TodoItem';
import { AddTodo } from './AddTodo';
import { TodoColors } from '@/constants/Colors';
import { Todo, Category } from '@/types/Todo';

interface SubtaskListProps {
  parentTodo: Todo & { subtasks?: Todo[] };
  categories: Category[];
  onToggleSubtask: (subtaskId: string) => void;
  onDeleteSubtask: (subtaskId: string) => void;
  onAddSubtask: (parentId: string, text: string, importance: number, dueDate: number | null, categoryId: string | null) => void;
}

export const SubtaskList: React.FC<SubtaskListProps> = ({
  parentTodo,
  categories,
  onToggleSubtask,
  onDeleteSubtask,
  onAddSubtask,
}) => {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showAddSubtask, setShowAddSubtask] = useState(false);

  const subtasks = parentTodo.subtasks || [];
  const completedSubtasks = subtasks.filter(subtask => subtask.completed).length;
  const totalSubtasks = subtasks.length;
  const progress = totalSubtasks > 0 ? completedSubtasks / totalSubtasks : 0;

  const handleAddSubtask = (text: string, importance: number, dueDate: number | null, categoryId: string | null) => {
    onAddSubtask(parentTodo.id, text, importance, dueDate, categoryId);
    setShowAddSubtask(false);
  };

  const canAddSubtask = () => {
    return parentTodo.grade < 2; // 최대 2레벨까지만 허용
  };

  const getIndentationStyle = (grade: number) => {
    return {
      marginLeft: grade * 20, // 각 레벨마다 20px 들여쓰기
    };
  };

  const getSubtaskGradeInfo = (grade: number) => {
    const gradeNames = {
      0: '메인',
      1: '서브',
      2: '서브-서브'
    };
    return gradeNames[grade as keyof typeof gradeNames] || '알 수 없음';
  };

  return (
    <View style={styles.container}>
      {/* 서브태스크 요약 헤더 */}
      {totalSubtasks > 0 && (
        <TouchableOpacity
          style={styles.summaryHeader}
          onPress={() => setShowSubtasks(!showSubtasks)}
        >
          <View style={styles.progressContainer}>
            <MaterialIcons 
              name={showSubtasks ? "expand-less" : "expand-more"} 
              size={20} 
              color={TodoColors.text.secondary} 
            />
            <Text style={styles.progressText}>
              서브태스크 {completedSubtasks}/{totalSubtasks}
            </Text>
            {progress > 0 && (
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${progress * 100}%` }
                  ]} 
                />
              </View>
            )}
          </View>
          <Text style={styles.gradeInfo}>
            {getSubtaskGradeInfo(parentTodo.grade)}
          </Text>
        </TouchableOpacity>
      )}

      {/* 서브태스크 목록 */}
      {showSubtasks && totalSubtasks > 0 && (
        <View style={[styles.subtaskContainer, getIndentationStyle(parentTodo.grade + 1)]}>
          <FlatList
            data={subtasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.subtaskItem}>
                <TodoItem
                  id={item.id}
                  text={item.text}
                  completed={item.completed}
                  importance={item.importance}
                  dueDate={item.dueDate}
                  categoryId={item.categoryId}
                  onComplete={onToggleSubtask}
                  onDelete={onDeleteSubtask}
                />
                {/* 재귀적으로 서브태스크 렌더링 (서브-서브태스크 지원) */}
                {item.subtasks && item.subtasks.length > 0 && (
                  <SubtaskList
                    parentTodo={item as Todo & { subtasks?: Todo[] }}
                    categories={categories}
                    onToggleSubtask={onToggleSubtask}
                    onDeleteSubtask={onDeleteSubtask}
                    onAddSubtask={onAddSubtask}
                  />
                )}
              </View>
            )}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* 서브태스크 추가 버튼 */}
      {/* {canAddSubtask() && (
        <View style={[styles.addButtonContainer, getIndentationStyle(parentTodo.grade + 1)]}>
          {!showAddSubtask ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddSubtask(true)}
            >
              <MaterialIcons name="add" size={16} color={TodoColors.primary} />
              <Text style={styles.addButtonText}>서브태스크 추가</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.addSubtaskForm}>
              <AddTodo
                onAdd={handleAddSubtask}
                categories={categories}
                placeholder={`${getSubtaskGradeInfo(parentTodo.grade + 1)}태스크 입력...`}
                buttonText="추가"
              />
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddSubtask(false)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )} */}

      {/* 최대 레벨 도달 메시지 */}
      {!canAddSubtask() && (
        <Text style={styles.maxLevelText}>
          최대 계층 레벨에 도달했습니다. 더 이상 서브태스크를 추가할 수 없습니다.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: TodoColors.background.card,
    borderRadius: 8,
    marginVertical: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressText: {
    fontSize: 14,
    color: TodoColors.text.secondary,
    marginLeft: 8,
    marginRight: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: TodoColors.background.app,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: TodoColors.primary,
    borderRadius: 2,
  },
  gradeInfo: {
    fontSize: 12,
    color: TodoColors.text.tertiary,
    fontWeight: '500',
  },
  subtaskContainer: {
    backgroundColor: TodoColors.background.subtask,
    borderRadius: 8,
    padding: 8,
    marginVertical: 4,
  },
  subtaskItem: {
    marginVertical: 2,
  },
  addButtonContainer: {
    marginVertical: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: TodoColors.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TodoColors.primary,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 14,
    color: TodoColors.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
  addSubtaskForm: {
    backgroundColor: TodoColors.background.card,
    borderRadius: 8,
    padding: 12,
  },
  cancelButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    color: TodoColors.text.secondary,
  },
  maxLevelText: {
    fontSize: 12,
    color: TodoColors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
});