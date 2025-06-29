import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, View, Text, StatusBar, KeyboardAvoidingView, Platform, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { AddTodo } from '@/components/AddTodo';
import { TodoList } from '@/components/TodoList';
import { Todo, createTodo, Category, DefaultCategories } from '@/types/Todo';
import { TodoColors } from '@/constants/Colors';

// 정렬 옵션 타입 정의
type SortOption = 'none' | 'dueDate-asc' | 'dueDate-desc' | 'importance-asc' | 'importance-desc';

// 필터 옵션 타입 정의
type FilterOption = 'all' | 'today' | 'tomorrow' | 'upcoming' | 'overdue' | 'category';

// 필터 상태 인터페이스
interface FilterState {
  option: FilterOption;
  categoryId: string | null; // 카테고리별 필터링을 위한 카테고리 ID
}

export default function HomeScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [filterState, setFilterState] = useState<FilterState>({ option: 'all', categoryId: null });
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Load todos and categories from AsyncStorage on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // 할 일 목록 불러오기
        const storedTodos = await AsyncStorage.getItem('todos');
        if (storedTodos) {
          setTodos(JSON.parse(storedTodos));
        }
        
        // 카테고리 불러오기
        const storedCategories = await AsyncStorage.getItem('categories');
        if (storedCategories) {
          setCategories(JSON.parse(storedCategories));
        } else {
          // 저장된 카테고리가 없으면 기본 카테고리 사용
          setCategories(DefaultCategories);
          await AsyncStorage.setItem('categories', JSON.stringify(DefaultCategories));
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
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
  const handleAddTodo = (text: string, importance: number, dueDate: number | null, categoryId: string | null) => {
    // createTodo 팩토리 함수 사용
    const newTodo = createTodo(text, importance, dueDate, categoryId);
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
  
  // 정렬 옵션 변경 처리
  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
    setShowSortModal(false);
  };
  
  // 필터링 옵션 변경 처리
  const handleFilterChange = (option: FilterOption, categoryId: string | null = null) => {
    setFilterState({ option, categoryId });
    setShowFilterModal(false);
  };

  // 필터링된 할 일 목록 반환
  const getFilteredTodos = () => {
    const uncompletedTodos = todos.filter(todo => !todo.completed);
    
    switch (filterState.option) {
      case 'today': {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return uncompletedTodos.filter(todo => {
          if (!todo.dueDate) return false;
          const dueDate = new Date(todo.dueDate);
          return dueDate >= today && dueDate < tomorrow;
        });
      }
      case 'tomorrow': {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
        
        return uncompletedTodos.filter(todo => {
          if (!todo.dueDate) return false;
          const dueDate = new Date(todo.dueDate);
          return dueDate >= tomorrow && dueDate < dayAfterTomorrow;
        });
      }
      case 'upcoming': {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        return uncompletedTodos.filter(todo => {
          if (!todo.dueDate) return false;
          const dueDate = new Date(todo.dueDate);
          return dueDate >= today && dueDate <= nextWeek;
        });
      }
      case 'overdue': {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return uncompletedTodos.filter(todo => {
          if (!todo.dueDate) return false;
          const dueDate = new Date(todo.dueDate);
          return dueDate < today;
        });
      }
      case 'category':
        return uncompletedTodos.filter(todo => todo.categoryId === filterState.categoryId);
      default:
        return uncompletedTodos;
    }
  };

  // 정렬된 할 일 목록 반환
  const getSortedTodos = () => {
    const filteredTodos = getFilteredTodos();
    
    switch (sortOption) {
      case 'dueDate-asc':
        return [...filteredTodos].sort((a, b) => {
          // null 값은 가장 마지막에 정렬
          if (a.dueDate === null) return 1;
          if (b.dueDate === null) return -1;
          return a.dueDate - b.dueDate;
        });
      case 'dueDate-desc':
        return [...filteredTodos].sort((a, b) => {
          if (a.dueDate === null) return 1;
          if (b.dueDate === null) return -1;
          return b.dueDate - a.dueDate;
        });
      case 'importance-asc':
        return [...filteredTodos].sort((a, b) => a.importance - b.importance);
      case 'importance-desc':
        return [...filteredTodos].sort((a, b) => b.importance - a.importance);
      default:
        return filteredTodos;
    }
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
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => setShowFilterModal(true)}
          >
            <MaterialIcons name="filter-list" size={24} color={TodoColors.text.primary} />
            <Text style={styles.headerButtonText}>필터</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => setShowSortModal(true)}
          >
            <MaterialIcons name="sort" size={24} color={TodoColors.text.primary} />
            <Text style={styles.headerButtonText}>정렬</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* 정렬 옵션 모달 */}
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowSortModal(false)}
        >
          <View 
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.modalTitle}>정렬 옵션</Text>
            
            <TouchableOpacity 
              style={[styles.sortOption, sortOption === 'none' && styles.selectedOption]}
              onPress={() => handleSortChange('none')}
            >
              <Text style={styles.sortOptionText}>기본 정렬</Text>
              {sortOption === 'none' && (
                <MaterialIcons name="check" size={20} color={TodoColors.primary} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sortOption, sortOption === 'dueDate-asc' && styles.selectedOption]}
              onPress={() => handleSortChange('dueDate-asc')}
            >
              <Text style={styles.sortOptionText}>마감일 빠른순</Text>
              {sortOption === 'dueDate-asc' && (
                <MaterialIcons name="check" size={20} color={TodoColors.primary} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sortOption, sortOption === 'dueDate-desc' && styles.selectedOption]}
              onPress={() => handleSortChange('dueDate-desc')}
            >
              <Text style={styles.sortOptionText}>마감일 늦은순</Text>
              {sortOption === 'dueDate-desc' && (
                <MaterialIcons name="check" size={20} color={TodoColors.primary} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sortOption, sortOption === 'importance-desc' && styles.selectedOption]}
              onPress={() => handleSortChange('importance-desc')}
            >
              <Text style={styles.sortOptionText}>중요도 높은순</Text>
              {sortOption === 'importance-desc' && (
                <MaterialIcons name="check" size={20} color={TodoColors.primary} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sortOption, sortOption === 'importance-asc' && styles.selectedOption]}
              onPress={() => handleSortChange('importance-asc')}
            >
              <Text style={styles.sortOptionText}>중요도 낮은순</Text>
              {sortOption === 'importance-asc' && (
                <MaterialIcons name="check" size={20} color={TodoColors.primary} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowSortModal(false)}
            >
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
      
      {/* 필터링 모달 */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowFilterModal(false)}
        >
          <View 
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.modalTitle}>필터링 옵션</Text>
            
            <TouchableOpacity 
              style={[styles.sortOption, filterState.option === 'all' && styles.selectedOption]}
              onPress={() => handleFilterChange('all')}
            >
              <Text style={styles.sortOptionText}>모든 할 일</Text>
              {filterState.option === 'all' && (
                <MaterialIcons name="check" size={20} color={TodoColors.primary} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sortOption, filterState.option === 'today' && styles.selectedOption]}
              onPress={() => handleFilterChange('today')}
            >
              <Text style={styles.sortOptionText}>오늘</Text>
              {filterState.option === 'today' && (
                <MaterialIcons name="check" size={20} color={TodoColors.primary} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sortOption, filterState.option === 'tomorrow' && styles.selectedOption]}
              onPress={() => handleFilterChange('tomorrow')}
            >
              <Text style={styles.sortOptionText}>내일</Text>
              {filterState.option === 'tomorrow' && (
                <MaterialIcons name="check" size={20} color={TodoColors.primary} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sortOption, filterState.option === 'upcoming' && styles.selectedOption]}
              onPress={() => handleFilterChange('upcoming')}
            >
              <Text style={styles.sortOptionText}>다가오는 일</Text>
              {filterState.option === 'upcoming' && (
                <MaterialIcons name="check" size={20} color={TodoColors.primary} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sortOption, filterState.option === 'overdue' && styles.selectedOption]}
              onPress={() => handleFilterChange('overdue')}
            >
              <Text style={styles.sortOptionText}>지난 일</Text>
              {filterState.option === 'overdue' && (
                <MaterialIcons name="check" size={20} color={TodoColors.primary} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sortOption, filterState.option === 'category' && styles.selectedOption]}
              onPress={() => setFilterState(prev => ({ ...prev, option: 'category' }))}
            >
              <Text style={styles.sortOptionText}>카테고리</Text>
              {filterState.option === 'category' && (
                <MaterialIcons name="check" size={20} color={TodoColors.primary} />
              )}
            </TouchableOpacity>
            
            {/* 카테고리 옵션이 선택된 경우 카테고리 목록 표시 */}
            {filterState.option === 'category' && (
              <View style={styles.categoryList}>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={[styles.categoryItem, filterState.categoryId === category.id && styles.selectedOption]}
                    onPress={() => handleFilterChange('category', category.id)}
                  >
                    <View style={[styles.categoryColor, { backgroundColor: category.color }]} />
                    <Text style={styles.categoryName}>{category.name}</Text>
                    {filterState.categoryId === category.id && (
                      <MaterialIcons name="check" size={20} color={TodoColors.primary} style={{ marginLeft: 'auto' }} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}>
        <AddTodo onAddTodo={handleAddTodo} />
        <View style={{ flex: 1, padding: 16 }}>
          <TodoList
            todos={getSortedTodos()}
            categories={categories}
            onCompleteTodo={handleCompleteTodo}
            onDeleteTodo={handleDeleteTodo}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TodoColors.background.app,
  },
  content: {
    flex: 1,
  },
  header: {
    height: 60,
    paddingHorizontal: 20,
    backgroundColor: TodoColors.background.app,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: TodoColors.text.primary,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TodoColors.background.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  headerButtonText: {
    marginLeft: 4,
    color: TodoColors.text.primary,
    fontSize: 14,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TodoColors.background.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sortButtonText: {
    marginLeft: 4,
    color: TodoColors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: TodoColors.text.primary,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedOption: {
    backgroundColor: '#f0f8ff',
  },
  sortOptionText: {
    fontSize: 16,
    color: TodoColors.text.primary,
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: TodoColors.primary,
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addIcon: {
    marginRight: 8,
  },
  categoryList: {
    marginTop: 8,
    marginBottom: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 16,
    color: TodoColors.text.primary,
  },
});
