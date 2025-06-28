import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, View, Text, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { AddTodo } from '@/components/AddTodo';
import { TodoList } from '@/components/TodoList';
import { Todo, createTodo } from '@/types/Todo';
import { TodoColors } from '@/constants/Colors';

export default function HomeScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);

  // Load todos from AsyncStorage on component mount
  useEffect(() => {
    const loadTodos = async () => {
      try {
        const storedTodos = await AsyncStorage.getItem('todos');
        if (storedTodos) {
          setTodos(JSON.parse(storedTodos));
        }
      } catch (error) {
        console.error('Failed to load todos:', error);
      }
    };

    loadTodos();
  }, []);

  // Save todos to AsyncStorage whenever they change
  useEffect(() => {
    const saveTodos = async () => {
      try {
        await AsyncStorage.setItem('todos', JSON.stringify(todos));
      } catch (error) {
        console.error('Failed to save todos:', error);
      }
    };

    saveTodos();
  }, [todos]);

  // Add a new todo
  const handleAddTodo = (text: string, importance: number, dueDate: number | null) => {
    // createTodo 팩토리 함수 사용
    const newTodo = createTodo(text, importance, dueDate);
    setTodos([...todos, newTodo]);
  };

  // Mark a todo as completed
  const handleCompleteTodo = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  // Delete a todo
  const handleDeleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={TodoColors.background.app} />
      
      <View style={styles.header}>
        <Text style={styles.title}>My Tasks</Text>
        
      </View>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}>
        <AddTodo onAddTodo={handleAddTodo} />
        
        <TodoList
          todos={todos.filter(todo => !todo.completed)}
          onCompleteTodo={handleCompleteTodo}
          onDeleteTodo={handleDeleteTodo}
        />
      </KeyboardAvoidingView>
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
  addIcon: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
});
