import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import { TodoColors } from '@/constants/Colors';

interface TodoItemProps {
  id: string;
  text: string;
  completed: boolean;
  importance: number; // 1-5 importance level
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({
  id,
  text,
  completed,
  importance,
  onComplete,
  onDelete,
}) => {
  // Get color based on importance level (1-5)
  const getImportanceColor = () => {
    const baseColor = TodoColors.importance.baseColor;
    const darkColor = TodoColors.importance.darkColor;
    
    // Calculate color based on importance (1-5)
    const factor = (importance - 1) / 4; // 0 to 1
    
    const r = Math.round(baseColor[0] + factor * (darkColor[0] - baseColor[0]));
    const g = Math.round(baseColor[1] + factor * (darkColor[1] - baseColor[1]));
    const b = Math.round(baseColor[2] + factor * (darkColor[2] - baseColor[2]));
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Render right actions (delete)
  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        style={[styles.rightAction, { backgroundColor: TodoColors.delete }]}
        onPress={() => onDelete(id)}>
        <Animated.View
          style={[
            styles.actionIcon,
            {
              transform: [{ translateX: trans }],
            },
          ]}>
          <MaterialIcons name="delete" size={24} color="white" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // Render left actions (complete)
  const renderLeftActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const trans = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [-100, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        style={[styles.leftAction, { backgroundColor: TodoColors.complete }]}
        onPress={() => onComplete(id)}>
        <Animated.View
          style={[
            styles.actionIcon,
            {
              transform: [{ translateX: trans }],
            },
          ]}>
          <MaterialIcons name="check" size={24} color="white" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}>
      <View
        style={[
          styles.container,
          { backgroundColor: completed ? TodoColors.completed.background : TodoColors.background.card },
          !completed && { borderLeftWidth: 9, borderLeftColor: getImportanceColor() },
          completed && styles.completedContainer,
        ]}>
        <Text style={[styles.text, completed && styles.completedText]}>{text}</Text>
        {completed && (
          <MaterialIcons name="check" size={20} color={TodoColors.icon.check} style={styles.checkIcon} />
        )}
      </View>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 0,
    marginVertical: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  text: {
    fontSize: 16,
    color: TodoColors.text.primary,
    flex: 1,
  },
  completedContainer: {
    backgroundColor: TodoColors.completed.background,
    opacity: TodoColors.completed.opacity,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: TodoColors.text.secondary,
  },
  checkIcon: {
    marginLeft: 8,
  },
  rightAction: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    marginVertical: 8,
    flex: 1,
  },
  leftAction: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    marginVertical: 8,
    flex: 1,
  },
  actionIcon: {
    width: 30,
    marginHorizontal: 16,
    alignItems: 'center',
  },
});
