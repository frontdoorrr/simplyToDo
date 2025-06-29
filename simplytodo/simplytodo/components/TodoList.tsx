import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, ViewToken } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { TodoItem } from './TodoItem';
import { TodoColors } from '@/constants/Colors';
import { Todo, Category, findCategoryById } from '@/types/Todo';

interface TodoListProps {
  todos: Todo[];
  categories: Category[];
  onCompleteTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
}

export const TodoList: React.FC<TodoListProps> = ({ 
  todos, 
  categories,
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
    <Animated.FlatList
      data={todos}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          layout={Layout.springify()}
        >
          <TodoItem
            id={item.id}
            text={item.text}
            completed={item.completed}
            importance={item.importance}
            dueDate={item.dueDate}
            category={findCategoryById(categories, item.categoryId)}
            onComplete={onCompleteTodo}
            onDelete={onDeleteTodo}
          />
        </Animated.View>
      )}
      style={styles.list}
      itemLayoutAnimation={Layout.springify()}
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
