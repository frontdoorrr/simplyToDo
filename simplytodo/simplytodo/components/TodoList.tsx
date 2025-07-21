import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, ViewToken } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { TodoItem } from './TodoItem';
import { TodoColors } from '@/constants/Colors';
import { Todo, Category, findCategoryById } from '@/types/Todo';
import { subtaskUtils } from '@/lib/supabase';

interface TodoListProps {
  todos: Todo[];
  categories: Category[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddSubtask?: (parentId: string, text: string, importance: number, dueDate: number | null, categoryId: string | null) => void;
  showSubtasks?: boolean;
  showCompletedDate?: boolean;
  showAllTodos?: boolean; // 모든 할 일 표시 여부 (메인 + SubTask)
}

export const TodoList: React.FC<TodoListProps> = ({ 
  todos, 
  categories,
  onToggle, 
  onDelete,
  onAddSubtask,
  showSubtasks = true,
  showCompletedDate = false,
  showAllTodos = false
}) => {
  if (todos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No tasks yet. Add a new task above!</Text>
      </View>
    );
  }

  // Subtask를 포함한 트리 구조로 변환 - showAllTodos가 true면 모든 할 일, 아니면 메인 todos만
  const filteredTodos = showAllTodos ? todos : todos.filter(todo => !todo.parentId);
  
  return (
    <Animated.FlatList
      data={filteredTodos}
      keyExtractor={(item) => item.id}
      // 메모리 사용량 최적화 및 렌더링 성능 개선 옵션
      removeClippedSubviews={true}
      maxToRenderPerBatch={5}
      windowSize={5}
      initialNumToRender={5}
      updateCellsBatchingPeriod={100}
      renderItem={({ item }) => {
        // 이미 완료된 할 일은 애니메이션 감소
        const animProps = !item.completed ? {
          entering: FadeIn.duration(200),
          // exiting 애니메이션은 제거 - 영향이 크게 없고 메모리 사용량 줄임
          // layout도 제거 - springify()가 메모리 사용량 높음
        } : {};
        
        return (
          <Animated.View {...animProps}>
            <TodoItem
              id={item.id}
              text={item.text}
              completed={item.completed}
              importance={item.importance}
              dueDate={item.dueDate}
              categoryId={item.categoryId}
              parentId={item.parentId}
              grade={item.grade}
              completedAt={item.completedAt}
              subtasks={item.subtasks}
              categories={categories}
              showCompletedDate={showCompletedDate}
              onComplete={onToggle}
              onDelete={onDelete}
              onToggleSubtask={onToggle}
              onDeleteSubtask={onDelete}
              onAddSubtask={onAddSubtask}
            />
          </Animated.View>
        );
      }}
      style={styles.list}
      // Layout animation 제거 - 메모리 오버헤드와 크래시 방지
    />
  );
};

const styles = StyleSheet.create({
  list: {
    width: '100%',
    backgroundColor: TodoColors.background.app,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: TodoColors.background.app,
  },
  emptyText: {
    fontSize: 16,
    color: TodoColors.text.secondary,
    textAlign: 'center',
  },
});
