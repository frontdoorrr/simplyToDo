import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Animated as RNAnimated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { TodoColors } from '@/constants/Colors';

interface TodoItemProps {
  id: string;
  text: string;
  completed: boolean;
  importance: number; // 1-5 importance level
  dueDate: number | null; // 마감일 추가
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({
  id,
  text,
  completed,
  importance,
  dueDate,
  onComplete,
  onDelete,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const swipeableRef = useRef<Swipeable>(null);
  
  // 애니메이션 스타일
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });
  
  // 삭제 애니메이션
  const animateAndDelete = (id: string) => {
    scale.value = withTiming(0.8, { duration: 100 });
    opacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(onDelete)(id);
    });
  };
  
  // 완료 애니메이션
  const animateAndComplete = (id: string) => {
    scale.value = withTiming(1.05, { duration: 100 }, () => {
      scale.value = withTiming(1, { duration: 100 }, () => {
        runOnJS(onComplete)(id);
      });
    });
  };
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

  // 중요도에 따른 왼쪽 테두리 색상 계산
  const getBorderColor = (importance: number) => {
    // 중요도에 따라 RGB 값을 선형 보간
    const baseRGB = TodoColors.importance.baseColor;
    const darkRGB = TodoColors.importance.darkColor;
    
    // 중요도에 따라 색상 계산 (1은 가장 연한 색, 5는 가장 진한 색)
    const ratio = (importance - 1) / 4; // 0~1 값으로 변환
    
    const r = Math.round(baseRGB[0] + (darkRGB[0] - baseRGB[0]) * ratio);
    const g = Math.round(baseRGB[1] + (darkRGB[1] - baseRGB[1]) * ratio);
    const b = Math.round(baseRGB[2] + (darkRGB[2] - baseRGB[2]) * ratio);
    
    return `rgb(${r}, ${g}, ${b})`;
  };
  
  // 마감일 형식화
  const formatDueDate = (timestamp: number | null): string => {
    if (!timestamp) return '';
    
    const dueDate = new Date(timestamp);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // 날짜 비교를 위해 시간 부분을 제거
    const isDueToday = dueDate.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0);
    const isDueTomorrow = dueDate.setHours(0, 0, 0, 0) === tomorrow.setHours(0, 0, 0, 0);
    
    if (isDueToday) {
      return '오늘 마감';
    } else if (isDueTomorrow) {
      return '내일 마감';
    } else {
      return dueDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) + ' 마감';
    }
  };
  
  // 마감일 상태 확인 (마감 임박, 마감 지남)
  const getDueDateStatus = (): { isOverdue: boolean; isUpcoming: boolean } => {
    if (!dueDate) return { isOverdue: false, isUpcoming: false };
    
    const now = new Date().getTime();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    
    // 마감 지남
    const isOverdue = dueDate < now;
    
    // 마감 임박 (24시간 이내)
    const isUpcoming = !isOverdue && (dueDate - now) < oneDayInMs;
    
    return { isOverdue, isUpcoming };
  };

  // Render right actions (delete)
  // 애니메이션을 위한 공유 값 정의
  const deleteScale = useSharedValue(1);
  const completeScale = useSharedValue(1);
  
  // 애니메이션 스타일 정의
  const deleteAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: deleteScale.value }],
    };
  });
  
  const completeAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: completeScale.value }],
    };
  });
  
  const renderRightActions = (progress: any, dragX: any) => {
    // React Native의 기본 Animated 사용
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        onPress={() => {
          deleteScale.value = withSpring(1.2, {}, () => {
            deleteScale.value = withSpring(1, {}, () => {
              runOnJS(animateAndDelete)(id);
            });
          });
        }}
        style={[styles.rightAction, { backgroundColor: TodoColors.delete }]}>
        <RNAnimated.View
          style={[
            styles.actionIcon,
            {
              transform: [{ translateX: trans }],
            },
          ]}>
          <MaterialIcons name="delete" size={24} color="white" />
        </RNAnimated.View>
      </TouchableOpacity>
    );
  };

  // Render left actions (complete)
  const renderLeftActions = (progress: any, dragX: any) => {
    // React Native의 기본 Animated 사용
    const trans = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [-100, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        onPress={() => {
          completeScale.value = withSpring(1.2, {}, () => {
            completeScale.value = withSpring(1, {}, () => {
              runOnJS(animateAndComplete)(id);
              if (swipeableRef.current) {
                swipeableRef.current.close();
              }
            });
          });
        }}
        style={[styles.leftAction, { backgroundColor: TodoColors.complete }]}>
        <RNAnimated.View
          style={[
            styles.actionIcon,
            {
              transform: [{ translateX: trans }],
            },
          ]}>
          <MaterialIcons name="check" size={24} color="white" />
        </RNAnimated.View>
      </TouchableOpacity>
    );
  };

  // 컴포넌트가 마운트될 때 애니메이션 효과
  useEffect(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 100 });
  }, []);

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      rightThreshold={40}
      leftThreshold={40}
      overshootRight={false}
      overshootLeft={false}
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}>
      <Animated.View
        style={[
          styles.container,
          { backgroundColor: completed ? TodoColors.completed.background : TodoColors.background.card },
          !completed && { borderLeftWidth: 9, borderLeftColor: getBorderColor(importance) },
          completed && styles.completedContainer,
          animatedStyle,
        ]}>
        <View style={styles.contentContainer}>
          <Text 
            style={[
              styles.text, 
              completed && styles.completedText
            ]}
            numberOfLines={2}
          >
            {text}
          </Text>
          
          {dueDate && (
            <View style={styles.dueDateContainer}>
              <Text 
                style={[
                  styles.dueDate,
                  getDueDateStatus().isOverdue && styles.overdueDueDate,
                  getDueDateStatus().isUpcoming && styles.upcomingDueDate,
                  completed && styles.completedDueDate
                ]}
              >
                {formatDueDate(dueDate)}
              </Text>
            </View>
          )}
        </View>
        {completed && (
          <MaterialIcons name="check" size={20} color={TodoColors.icon.check} style={styles.checkIcon} />
        )}
      </Animated.View>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  dueDateContainer: {
    marginTop: 4,
  },
  dueDate: {
    fontSize: 12,
    color: TodoColors.text.secondary,
  },
  overdueDueDate: {
    color: '#ff6b6b',
    fontWeight: '500',
  },
  upcomingDueDate: {
    color: '#ff9f43',
    fontWeight: '500',
  },
  completedDueDate: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
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
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    flex: 1,
  },
  leftAction: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    flex: 1,
  },
  actionIcon: {
    width: 30,
    marginHorizontal: 16,
    alignItems: 'center',
  },
});
