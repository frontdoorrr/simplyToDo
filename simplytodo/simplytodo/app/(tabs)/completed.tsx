import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, View, Text, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TodoList } from '@/components/TodoList';
import { Todo, Category } from '@/types/Todo';
import { TodoColors } from '@/constants/Colors';
import { useIsFocused } from '@react-navigation/native';
import { todosApi, categoriesApi } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function CompletedScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const isFocused = useIsFocused();
  const { user } = useAuth();

  useEffect(() => {
    if (!isFocused || !user) return;
    const fetchCompletedTodos = async () => {
      const allTodos = await todosApi.getTodos(user.id);
      setTodos(allTodos.filter((todo: Todo) => todo.completed));
    };
    const fetchCategories = async () => {
      const cats = await categoriesApi.getCategories(user.id);
      setCategories(cats);
    };
    fetchCompletedTodos();
    fetchCategories();
  }, [isFocused, user]);

  // Delete a todo
  const handleDelete = async (id: string) => {
    try {
      // Get all todos first
      const storedTodos = await AsyncStorage.getItem('todos');
      if (storedTodos) {
        const parsedTodos = JSON.parse(storedTodos);
        // Remove the todo from all todos
        const updatedTodos = parsedTodos.filter((todo: Todo) => todo.id !== id);
        // Save updated todos
        await AsyncStorage.setItem('todos', JSON.stringify(updatedTodos));
        // Update state with filtered completed todos
        const updatedCompletedTodos = updatedTodos.filter((todo: Todo) => todo.completed);
        setTodos(updatedCompletedTodos);
      }
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  // Toggle todo completion status
  const handleComplete = async (id: string) => {
    try {
      // Get all todos first
      const storedTodos = await AsyncStorage.getItem('todos');
      if (storedTodos) {
        const parsedTodos = JSON.parse(storedTodos);
        // Toggle completion status
        const updatedTodos = parsedTodos.map((todo: Todo) => {
          if (todo.id === id) {
            return { ...todo, completed: !todo.completed };
          }
          return todo;
        });
        // Save updated todos
        await AsyncStorage.setItem('todos', JSON.stringify(updatedTodos));
        // Update state with filtered completed todos
        const updatedCompletedTodos = updatedTodos.filter((todo: Todo) => todo.completed);
        setTodos(updatedCompletedTodos);
      }
    } catch (error) {
      console.error('Failed to toggle todo completion:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Completed Tasks</Text>
      </View>
      <TodoList
        todos={todos}
        categories={categories}
        onDelete={handleDelete}
        onToggle={handleComplete}
      />
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
});
