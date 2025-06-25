import React from 'react';
import { StyleSheet, FlatList, View, Text } from 'react-native';
import { TodoItem } from './TodoItem';
import { TodoColors } from '@/constants/Colors';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  importance: number; // 1-5
}

interface TodoListProps {
  todos: Todo[];
  onCompleteTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
}

export const TodoList: React.FC<TodoListProps> = ({ 
  todos, 
  onCompleteTodo, 
  onDeleteTodo 
}) => {
  if (todos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No tasks yet. Add a new task above!</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={todos}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TodoItem
          id={item.id}
          text={item.text}
          completed={item.completed}
          importance={item.importance}
          onComplete={onCompleteTodo}
          onDelete={onDeleteTodo}
        />
      )}
      style={styles.list}
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
