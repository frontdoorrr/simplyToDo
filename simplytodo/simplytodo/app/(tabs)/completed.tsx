import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, View, Text, StatusBar, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TodoList } from '@/components/TodoList';
import { Todo, Category } from '@/types/Todo';
import { TodoColors } from '@/constants/Colors';
import { useIsFocused } from '@react-navigation/native';
import { todosApi, categoriesApi } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

export default function CompletedScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();
  const { user } = useAuth();
  
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (!isFocused || !user) return;
    const fetchCompletedTodos = async () => {
      const allTodos = await todosApi.getTodos(user.id);
      const formattedTodos = allTodos.map(todo => ({
        id: todo.id,
        text: todo.text,
        completed: todo.completed,
        importance: todo.importance,
        createdAt: new Date(todo.created_at || Date.now()).getTime(),
        dueDate: todo.due_date ? new Date(todo.due_date).getTime() : null,
        categoryId: todo.category_id,
        parentId: todo.parent_id,
        grade: todo.grade || 0,
        completedAt: todo.completed_at ? new Date(todo.completed_at).getTime() : null
      }));
      setTodos(formattedTodos.filter((todo: Todo) => todo.completed));
    };
    const fetchCategories = async () => {
      const cats = await categoriesApi.getCategories(user.id);
      setCategories(cats);
    };
    fetchCompletedTodos();
    fetchCategories();
  }, [isFocused, user]);

  // 페이지네이션 계산
  const totalPages = Math.ceil(todos.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTodos = todos.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // 새로운 데이터가 로드될 때 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [todos.length]);

  // Delete a todo
  const handleDelete = async (id: string) => {
    if (!user) return;
    
    try {
      // Supabase에서 삭제
      await todosApi.deleteTodo(id);
      
      // 로컬 상태 업데이트
      setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
    } catch (error) {
      logger.error('Failed to delete todo:', error);
    }
  };

  // Toggle todo completion status
  const handleComplete = async (id: string) => {
    if (!user) return;
    
    try {
      // 현재 todo 찾기
      const currentTodo = todos.find(todo => todo.id === id);
      if (!currentTodo) return;
      
      const newCompletedState = !currentTodo.completed;
      
      // Supabase 업데이트
      await todosApi.updateTodo(id, { 
        completed: newCompletedState,
        completed_at: newCompletedState ? new Date().toISOString() : null
      });
      
      // 로컬 상태 업데이트
      if (newCompletedState) {
        // 완료로 변경하는 경우는 그대로 유지
        setTodos(prevTodos => prevTodos.map(todo => 
          todo.id === id 
            ? { ...todo, completed: newCompletedState, completedAt: Date.now() }
            : todo
        ));
      } else {
        // 완료 해제하는 경우는 completed 탭에서 제거
        setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
      }
    } catch (error) {
      logger.error('Failed to toggle todo completion:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Completed Tasks</Text>
        {totalPages > 1 && (
          <Text style={styles.pageInfo}>
            {currentPage} / {totalPages}
          </Text>
        )}
      </View>
      
      <TodoList
        todos={currentTodos}
        categories={categories}
        onDelete={handleDelete}
        onToggle={handleComplete}
        showCompletedDate={true}
        showAllTodos={true}
      />
      
      {totalPages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity 
            style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
            onPress={handlePrevPage}
            disabled={currentPage === 1}
          >
            <MaterialIcons name="chevron-left" size={24} color={currentPage === 1 ? '#ccc' : TodoColors.primary} />
          </TouchableOpacity>
          
          <Text style={styles.pageText}>
            {startIndex + 1}-{Math.min(endIndex, todos.length)} of {todos.length}
          </Text>
          
          <TouchableOpacity 
            style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
            onPress={handleNextPage}
            disabled={currentPage === totalPages}
          >
            <MaterialIcons name="chevron-right" size={24} color={currentPage === totalPages ? '#ccc' : TodoColors.primary} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TodoColors.background.app,
  },
  header: {
    height: 60, // 고정 높이 설정
    paddingHorizontal: 16,
    backgroundColor: TodoColors.background.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: TodoColors.text.primary,
  },
  pageInfo: {
    fontSize: 14,
    color: TodoColors.text.secondary,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: TodoColors.background.card,
  },
  pageButton: {
    padding: 8,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  pageText: {
    fontSize: 14,
    color: TodoColors.text.secondary,
    marginHorizontal: 16,
    minWidth: 100,
    textAlign: 'center',
  },
});
