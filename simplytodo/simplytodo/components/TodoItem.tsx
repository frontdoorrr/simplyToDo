import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import { TodoColors } from '@/constants/Colors';
import { Category, DefaultCategories } from '@/types/Todo';
import { categoriesApi } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface TodoItemProps {
  id: string;
  text: string;
  completed: boolean;
  importance: number; // 1-5 importance level
  dueDate: number | null; // 마감일 추가
  categoryId?: string | null; // 카테고리 ID 사용
  category?: Category; // 직접 카테고리 객체를 전달받는 경우 (옵셔널)
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({
  id,
  text,
  completed,
  importance,
  dueDate,
  categoryId,
  category,
  onComplete,
  onDelete,
}) => {
  const swipeableRef = useRef<Swipeable>(null);
  const [resolvedCategory, setResolvedCategory] = useState<Category | undefined>(category);
  
  const { user } = useAuth();
  
  // CategoryId를 사용해서 카테고리를 로드하는 기능
  useEffect(() => {
    // 이미 category 객체가 전달되었으면 그것을 사용
    if (category) {
      setResolvedCategory(category);
      return;
    }
    
    // categoryId가 있으면 해당 ID로 카테고리 찾기
    if (categoryId && user) {
      const loadCategory = async () => {
        try {
          // Supabase에서 모든 카테고리 가져오기
          const categories = await categoriesApi.getCategories(user.id);
          
          // 형식 변환
          const formattedCategories = categories.map(category => ({
            id: category.id,
            name: category.name,
            color: category.color
          }));
          
          // 해당 ID 찾기
          const found = formattedCategories.find(c => c.id === categoryId);
          setResolvedCategory(found || undefined);
          
          // 찾지 못한 경우 기본 카테고리에서 찾기
          if (!found) {
            const defaultCategory = DefaultCategories.find(c => c.id === categoryId);
            setResolvedCategory(defaultCategory || undefined);
          }
        } catch (error) {
          console.error('카테고리 로드 오류:', error);
          
          // 실패 시 기본 카테고리에서 찾기
          const defaultCategory = DefaultCategories.find(c => c.id === categoryId);
          setResolvedCategory(defaultCategory || undefined);
        }
      };
      
      loadCategory();
    } else {
      setResolvedCategory(undefined);
    }
  }, [categoryId, category, user]);
  
  // 완료 처리 함수
  const handleComplete = () => {
    try {
      onComplete(id);
    } catch (error) {
      console.error('할 일 완료 처리 오류:', error);
      Alert.alert('오류', '할 일 상태를 변경하는데 실패했습니다.');
    }
  };
  
  // 삭제 처리 함수
  const handleDelete = () => {
    try {
      if (swipeableRef.current) {
        swipeableRef.current.close();
      }
      onDelete(id);
    } catch (error) {
      console.error('할 일 삭제 오류:', error);
      Alert.alert('오류', '할 일을 삭제하는데 실패했습니다.');
    }
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
  
  // 마감일 표시 형식 처리 - 메모리 사용량 최소화
  const formatDueDate = () => {
    if (!dueDate) return null;
    
    // 현재 날짜와 마감일의 시간부분을 0으로 만들기 위한 계산
    const now = new Date();
    const nowMs = now.getTime();
    const todayMs = nowMs - (now.getHours() * 3600000 + now.getMinutes() * 60000 + now.getSeconds() * 1000 + now.getMilliseconds());
    const tomorrowMs = todayMs + 86400000; // 24시간을 밀리초로 계산
    
    // 마감일의 시간부분을 0으로 만들기 위한 계산
    const due = new Date(dueDate);
    const dueDayMs = dueDate - (due.getHours() * 3600000 + due.getMinutes() * 60000 + due.getSeconds() * 1000 + due.getMilliseconds());
    
    // 마감일 상태 확인 (지남, 오늘, 내일)
    const isPast = dueDayMs < todayMs;
    const isToday = dueDayMs === todayMs;
    const isTomorrow = dueDayMs === tomorrowMs;
    
    // 마감 임박 (오늘 마감이거나 지난 마감)
    const isUrgent = isToday || isPast;
    
    // 마감일 텍스트 표시
    let dueDateText = '';
    if (isToday) {
      dueDateText = '오늘 마감';
    } else if (isTomorrow) {
      dueDateText = '내일 마감';
    } else {
      // 일반 날짜 형식
      dueDateText = `${due.getMonth() + 1}월 ${due.getDate()}일 마감`;
    }
    
    return {
      text: dueDateText,
      isPast,
      isToday,
      isUrgent
    };
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
  const renderRightActions = () => {
    return (
      <TouchableOpacity 
        style={[styles.actionButton, { backgroundColor: TodoColors.delete }]} 
        onPress={handleDelete}
      >
        <MaterialIcons name="delete" size={24} color="white" />
      </TouchableOpacity>
    );
  };

  // Render left actions (complete)
  const renderLeftActions = () => {
    return (
      <TouchableOpacity 
        style={[styles.actionButton, { backgroundColor: TodoColors.complete }]} 
        onPress={handleComplete}
      >
        <MaterialIcons name="check" size={24} color="white" />
      </TouchableOpacity>
    );
  };

  const formattedDueDate = formatDueDate();

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
      <View
        style={[
          styles.container,
          { backgroundColor: completed ? TodoColors.completed.background : TodoColors.background.card },
          !completed && { borderLeftWidth: 9, borderLeftColor: getBorderColor(importance) },
          completed && styles.completedContainer,
        ]}>
        <View style={styles.contentContainer}>
          <Text style={[styles.text, completed && styles.completedText]}>{text}</Text>
          
          <View style={styles.metaContainer}>
            {/* 카테고리 표시 */}
            {resolvedCategory && (
              <View style={[styles.categoryTag, { backgroundColor: resolvedCategory.color + '20', borderColor: resolvedCategory.color }]}>
                <View style={[styles.categoryDot, { backgroundColor: resolvedCategory.color }]} />
                <Text style={[styles.categoryText, { color: resolvedCategory.color }]}>
                  {resolvedCategory.name}
                </Text>
              </View>
            )}
            
            {/* 마감일 표시 */}
            {dueDate && formattedDueDate && (
              <Text 
                style={[
                  styles.dueDate, 
                  formattedDueDate.isPast && styles.pastDueDate,
                  formattedDueDate.isToday && styles.todayDueDate,
                  completed && styles.completedDueDate
                ]}
              >
                {formattedDueDate.text}
              </Text>
            )}
          </View>
        </View>
        {completed && (
          <MaterialIcons name="check" size={20} color={TodoColors.icon.check} style={styles.checkIcon} />
        )}
      </View>
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
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
  },
  dueDate: {
    fontSize: 12,
    color: TodoColors.text.secondary,
  },
  pastDueDate: {
    color: '#ff6b6b', // 지난 마감일은 빨간색으로 표시
  },
  todayDueDate: {
    color: '#ff9800', // 오늘 마감일은 주황색으로 표시
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
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: '100%',
  },
});
