import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, SafeAreaView, View, Text, StatusBar, KeyboardAvoidingView, Platform, TouchableOpacity, Modal, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AddTodo } from '@/components/AddTodo';
import { TodoList } from '@/components/TodoList';
import { RecurringRuleManager } from '@/components/RecurringRuleManager';
import { Todo, createTodo, Category, DefaultCategories } from '@/types/Todo';
import { TodoColors } from '@/constants/Colors';
import { todosApi, categoriesApi, subtaskUtils } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { resetApp } from '@/lib/appReset';

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
  const [showRecurringManager, setShowRecurringManager] = useState(false);

  // Supabase로부터 데이터 로드
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // 할 일 목록과 카테고리를 병렬로 불러오기
        const [todos, categories] = await Promise.all([
          todosApi.getTodos(user.id),
          categoriesApi.getCategories(user.id)
        ]);
        
        // Supabase 데이터 형식을 앱 내부 형식으로 변환
        const formattedTodos = todos.map(todo => ({
          id: todo.id,
          text: todo.text,
          completed: todo.completed,
          importance: todo.importance,
          createdAt: new Date(todo.created_at || Date.now()).getTime(),
          dueDate: todo.due_date ? new Date(todo.due_date).getTime() : null,
          categoryId: todo.category_id,
          parentId: todo.parent_id, // Subtask 지원
          grade: todo.grade || 0     // 계층 레벨
        }));
        
        const formattedCategories = categories.map(category => ({
          id: category.id,
          name: category.name,
          color: category.color
        }));
        
        // Subtask 데이터 확인
        console.log('전체 todos 개수:', formattedTodos.length);
        console.log('메인 todos (grade=0):', formattedTodos.filter(t => t.grade === 0).length);
        console.log('Subtask (grade>0):', formattedTodos.filter(t => t.grade > 0).length);
        console.log('🔍 RAW 데이터에서 parent_id 있는 todos:', todos.filter(t => t.parent_id).length);
        console.log('🔍 변환된 데이터에서 parentId 있는 todos:', formattedTodos.filter(t => t.parentId).length);
        console.log('🔍 변환된 데이터 샘플:', formattedTodos.filter(t => t.parentId).slice(0, 2).map(t => ({ 
          id: t.id?.substring(0, 8), 
          parentId: t.parentId?.substring(0, 8), 
          grade: t.grade, 
          text: t.text?.substring(0, 30) 
        })));
        
        // subtaskUtils를 사용하여 트리 구조 구성
        const todoTree = subtaskUtils.buildTodoTree(formattedTodos);
        
        console.log('Subtask가 연결된 todos:', todoTree.map(t => ({ id: t.id, text: t.text, subtaskCount: t.subtasks?.length || 0 })));
        
        setTodos(todoTree);
        setCategories(formattedCategories.length > 0 ? formattedCategories : DefaultCategories);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
        Alert.alert('데이터 로드 오류', '데이터를 불러오는데 실패했습니다.');
        setTodos([]);
        setCategories(DefaultCategories);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user]);

  // 할 일 변경 시 디바운싱하여 데이터베이스에 저장
  // 단, Supabase 동기화는 개별 작업에서 직접 처리하므로 여기서는 생략

  // Add a new todo - Supabase와 동기화
  const handleAddTodo = useCallback(async (text: string, importance: number, dueDate: number | null, categoryId: string | null) => {
    if (!user) return;
    
    try {
      // Supabase에 추가
      const todoData = {
        text,
        importance,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        category_id: categoryId,
        completed: false,
        user_id: user.id,
        parent_id: null, // 메인 todo
        grade: 0         // 메인 레벨
      };
      
      const newTodo = await todosApi.addTodo(todoData);
      
      // 로컬 상태 업데이트
      setTodos(prevTodos => [...prevTodos, {
        id: newTodo.id,
        text: newTodo.text,
        completed: newTodo.completed,
        importance: newTodo.importance,
        createdAt: new Date(newTodo.created_at || Date.now()).getTime(),
        dueDate: newTodo.due_date ? new Date(newTodo.due_date).getTime() : null,
        categoryId: newTodo.category_id,
        parentId: newTodo.parent_id,
        grade: newTodo.grade || 0
      }]);
    } catch (error) {
      console.error('할 일 추가 오류:', error);
      Alert.alert('할 일 추가 오류', '할 일을 추가하는데 실패했습니다.');
    }
  }, [user]);

  // Add a subtask - Subtask 추가
  const handleAddSubtask = useCallback(async (parentId: string, text: string, importance: number, dueDate: number | null, categoryId: string | null) => {
    if (!user) return;

    try {
      const subtaskData = {
        text,
        completed: false,
        importance,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        category_id: categoryId,
        user_id: user.id
      };

      const newSubtask = await todosApi.addSubtask(parentId, subtaskData);
      
      if (newSubtask) {
        const formattedSubtask: Todo = {
          id: newSubtask.id!,
          text: newSubtask.text,
          completed: newSubtask.completed,
          importance: newSubtask.importance,
          createdAt: new Date(newSubtask.created_at || Date.now()).getTime(),
          dueDate: newSubtask.due_date ? new Date(newSubtask.due_date).getTime() : null,
          categoryId: newSubtask.category_id,
          parentId: newSubtask.parent_id,
          grade: newSubtask.grade || 1
        };
        
        // 새 Subtask를 추가하고 트리 구조 재구성
        setTodos(prev => {
          const flatTodos = subtaskUtils.flattenTodoTree(prev);
          const updatedTodos = [...flatTodos, formattedSubtask];
          return subtaskUtils.buildTodoTree(updatedTodos);
        });
      }
    } catch (error) {
      console.error('Subtask 추가 오류:', error);
      Alert.alert('Subtask 추가 오류', 'Subtask를 추가하는데 실패했습니다.');
    }
  }, [user]);

  // Toggle todo completion status - Supabase와 동기화
  const handleToggleTodo = useCallback(async (id: string) => {
    if (!user) return;
    
    try {
      // 로컬 상태 먼저 업데이트 (UI 반응성)
      let newCompletedState = false;
      
      setTodos(prevTodos => {
        const updateTodoRecursive = (todos: Todo[]): Todo[] => {
          return todos.map(todo => {
            if (todo.id === id) {
              newCompletedState = !todo.completed;
              // 완료 상태로 변경되는 경우 최근 완료 목록에 추가
              if (newCompletedState) {
                setRecentlyCompletedIds(prev => [...prev, id]);
              }
              return { ...todo, completed: newCompletedState };
            }
            // Subtask도 확인
            if (todo.subtasks && todo.subtasks.length > 0) {
              const updatedSubtasks = updateTodoRecursive(todo.subtasks);
              if (updatedSubtasks !== todo.subtasks) {
                return { ...todo, subtasks: updatedSubtasks };
              }
            }
            return todo;
          });
        };
        
        return updateTodoRecursive(prevTodos);
      });
      
      // Supabase 업데이트
      await todosApi.updateTodo(id, { completed: newCompletedState });
    } catch (error) {
      console.error('할 일 상태 변경 오류:', error);
      Alert.alert('할 일 상태 변경 오류', '할 일 상태를 변경하는데 실패했습니다.');
      
      // 실패 시 상태 롤백
      setTodos(prevTodos => {
        const rollbackTodoRecursive = (todos: Todo[]): Todo[] => {
          return todos.map(todo => {
            if (todo.id === id) {
              return { ...todo, completed: !todo.completed };
            }
            // Subtask도 확인
            if (todo.subtasks && todo.subtasks.length > 0) {
              const rolledBackSubtasks = rollbackTodoRecursive(todo.subtasks);
              if (rolledBackSubtasks !== todo.subtasks) {
                return { ...todo, subtasks: rolledBackSubtasks };
              }
            }
            return todo;
          });
        };
        
        return rollbackTodoRecursive(prevTodos);
      });
    }
  }, [user]);

  // 정렬 옵션 변경 처리 - useCallback으로 최적화
  const handleSortChange = useCallback((option: SortOption) => {
    setSortOption(option);
    setShowSortModal(false);
  }, []);

  // 필터 변경 처리 - useCallback으로 최적화 및 불필요한 상태 업데이트 방지
  const handleFilterChange = useCallback((option: FilterOption, categoryId: string | null = null) => {
    try {
      // 현재 상태와 동일한 경우 업데이트 방지
      if (filterState.option === option && 
          (option !== 'category' || filterState.categoryId === categoryId)) {
        return;
      }
      
      setFilterState({ option, categoryId });
      if (option !== 'category') {
        setShowFilterModal(false);
      }
    } catch (error) {
      console.error('Error changing filter:', error);
    }
  }, [filterState]);

  // 완료된 항목의 애니메이션을 위한 상태 추적
  const [recentlyCompletedIds, setRecentlyCompletedIds] = useState<string[]>([]);

  // 완료된 항목을 일정 시간 후에 필터링하는 로직
  useEffect(() => {
    if (recentlyCompletedIds.length > 0) {
      const timer = setTimeout(() => {
        setRecentlyCompletedIds([]);
      }, 500); // 애니메이션이 끝날 때까지 충분한 시간 (500ms)
      
      return () => clearTimeout(timer);
    }
  }, [recentlyCompletedIds]);

  // useMemo를 사용하여 필터링 및 정렬 로직 최적화
  const processedTodos = useMemo(() => {
    try {
      if (!Array.isArray(todos)) return [];

      // 1. 필터링 로직
      const filtered = todos.filter(todo => {
        // 최근에 완료된 항목은 애니메이션을 위해 계속 표시
        if (todo.completed && !recentlyCompletedIds.includes(todo.id)) {
          return false;
        }

        const { option, categoryId } = filterState;
        if (option === 'all') {
          return true;
        }
        if (option === 'category') {
          return todo.categoryId === categoryId;
        }

        if (!todo.dueDate) {
          return false;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTime = today.getTime();
        const dueTime = todo.dueDate;

        switch (option) {
          case 'today':
            return dueTime >= todayTime && dueTime < todayTime + 86400000;
          case 'tomorrow':
            return dueTime >= todayTime + 86400000 && dueTime < todayTime + 172800000;
          case 'upcoming':
            return dueTime >= todayTime && dueTime <= todayTime + 604800000;
          case 'overdue':
            return dueTime < todayTime;
          default:
            return true;
        }
      });

      // 2. 정렬 로직
      if (sortOption === 'none') {
        return filtered;
      }

      return filtered.sort((a, b) => {
        switch (sortOption) {
          case 'dueDate-asc':
            if (a.dueDate === null) return 1;
            if (b.dueDate === null) return -1;
            return a.dueDate - b.dueDate;
          case 'dueDate-desc':
            if (a.dueDate === null) return 1;
            if (b.dueDate === null) return -1;
            return b.dueDate - a.dueDate;
          case 'importance-asc':
            return a.importance - b.importance;
          case 'importance-desc':
            return b.importance - a.importance;
          default:
            return 0;
        }
      });
    } catch (error) {
      console.error('Error processing todos:', error);
      return [];
    }
  }, [todos, filterState, sortOption]);

  // Delete a todo - Supabase와 동기화
  const handleDeleteTodo = useCallback(async (id: string) => {
    if (!user) return;
    
    try {
      // 삭제될 todo를 찾아서 백업
      let deletedTodo: Todo | null = null;
      
      // 로컬 상태 먼저 업데이트 (UI 반응성)
      setTodos(prevTodos => {
        const deleteTodoRecursive = (todos: Todo[]): Todo[] => {
          return todos.filter(todo => {
            if (todo.id === id) {
              deletedTodo = todo;
              return false; // 이 todo를 필터링으로 제거
            }
            // Subtask에서도 확인
            if (todo.subtasks && todo.subtasks.length > 0) {
              const filteredSubtasks = deleteTodoRecursive(todo.subtasks);
              if (filteredSubtasks.length !== todo.subtasks.length) {
                return { ...todo, subtasks: filteredSubtasks };
              }
            }
            return todo;
          }).map(todo => {
            // Subtask가 변경된 경우 새 객체 반환
            if (todo.subtasks && todo.subtasks.length > 0) {
              const filteredSubtasks = deleteTodoRecursive(todo.subtasks);
              if (filteredSubtasks !== todo.subtasks) {
                return { ...todo, subtasks: filteredSubtasks };
              }
            }
            return todo;
          });
        };
        
        return deleteTodoRecursive(prevTodos);
      });
      
      // Supabase 업데이트
      await todosApi.deleteTodo(id);
    } catch (error) {
      console.error('할 일 삭제 오류:', error);
      Alert.alert('할 일 삭제 오류', '할 일을 삭제하는데 실패했습니다.');
      
      // 실패 시 상태 롤백 - 전체 데이터를 다시 로드
      if (!user) return;
      
      try {
        const [todos, categories] = await Promise.all([
          todosApi.getTodos(user.id),
          categoriesApi.getCategories(user.id)
        ]);
        
        const formattedTodos = todos.map(todo => ({
          id: todo.id,
          text: todo.text,
          completed: todo.completed,
          importance: todo.importance,
          createdAt: new Date(todo.created_at || Date.now()).getTime(),
          dueDate: todo.due_date ? new Date(todo.due_date).getTime() : null,
          categoryId: todo.category_id,
          parentId: todo.parent_id,
          grade: todo.grade || 0
        }));
        
        const todoTree = subtaskUtils.buildTodoTree(formattedTodos);
        
        setTodos(todoTree);
      } catch (reloadError) {
        console.error('데이터 재로드 실패:', reloadError);
      }
    }
  }, [user]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={TodoColors.background.app} />
      
      <View style={styles.header}>
        <Text style={styles.title}>My Tasks</Text>
        {user && (
          <View style={styles.headerActions}>
            {__DEV__ && (
              <TouchableOpacity 
                onPress={() => {
                  Alert.alert(
                    '네트워크 오류 해결',
                    '인증 데이터를 완전히 삭제하고 로그인을 다시 시도합니다.',
                    [
                      { text: '취소', style: 'cancel' },
                      { 
                        text: '삭제', 
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await resetApp();
                            Alert.alert('완료', '인증 데이터가 삭제되었습니다. 로그인 화면으로 돌아갑니다.');
                          } catch (error) {
                            console.error('인증 데이터 삭제 실패:', error);
                            Alert.alert('오류', '인증 데이터 삭제에 실패했습니다. 다시 시도하세요.');
                          }
                        }
                      }
                    ]
                  );
                }}
                style={styles.debugButton}
              >
                <MaterialIcons name="refresh" size={20} color={TodoColors.delete} />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={() => signOut()}
              style={styles.logoutButton}
            >
              <MaterialIcons name="logout" size={24} color={TodoColors.text.primary} />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => setShowRecurringManager(true)}
          >
            <MaterialIcons name="repeat" size={20} color={TodoColors.primary} />
            <Text style={styles.headerButtonText}>반복</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => setShowFilterModal(true)}
          >
            <MaterialIcons name="filter-list" size={20} color={TodoColors.text.primary} />
            <Text style={styles.headerButtonText}>필터</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => setShowSortModal(true)}
          >
            <MaterialIcons name="sort" size={20} color={TodoColors.text.primary} />
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
            
            {/* 카테고리 옵션이 선택된 경우 카테고리 목록 표시 - 메모리 최적화 */}
            {filterState.option === 'category' && categories.length > 0 && (
              <View style={styles.categoryList}>
                {categories.slice(0, 20).map(category => (
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
                {categories.length > 20 && (
                  <Text style={styles.moreCategories}>+ {categories.length - 20}개 더 있음</Text>
                )}
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
        <AddTodo 
          onAddTodo={handleAddTodo} 
          onAddSubtask={handleAddSubtask}
          mainTodos={processedTodos.filter(todo => !todo.completed && !todo.parentId)}
        />
        <View style={{ flex: 1, padding: 16 }}>
          <TodoList 
            todos={processedTodos.filter(todo => !todo.completed)} 
            onToggle={handleToggleTodo} 
            onDelete={handleDeleteTodo}
            categories={categories}
            onAddSubtask={handleAddSubtask}
          />
        </View>
      </KeyboardAvoidingView>

      {/* 반복 작업 관리 모달 */}
      <RecurringRuleManager
        visible={showRecurringManager}
        onClose={() => setShowRecurringManager(false)}
        categories={categories}
        onRuleCreated={(rule, instanceCount) => {
          // 새로운 반복 작업이 생성되면 todo 목록 새로고침
          if (user) {
            const loadData = async () => {
              try {
                const [todos, categories] = await Promise.all([
                  todosApi.getTodos(user.id),
                  categoriesApi.getCategories(user.id)
                ]);
                
                const formattedTodos = todos.map(todo => ({
                  id: todo.id,
                  text: todo.text,
                  completed: todo.completed,
                  importance: todo.importance,
                  createdAt: new Date(todo.created_at || Date.now()).getTime(),
                  dueDate: todo.due_date ? new Date(todo.due_date).getTime() : null,
                  categoryId: todo.category_id,
                  parentId: todo.parent_id,
                  grade: todo.grade || 0
                }));
                
                const todoTree = subtaskUtils.buildTodoTree(formattedTodos);
                
                setTodos(todoTree);
              } catch (error) {
                console.error('데이터 새로고침 실패:', error);
              }
            };
            loadData();
          }
        }}
      />
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    marginRight: 10,
  },
  debugButton: {
    padding: 6,
    marginRight: 8,
    backgroundColor: TodoColors.background.input,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: TodoColors.delete,
  },
  logoutButton: {
    padding: 8,
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
  moreCategories: {
    fontSize: 14,
    color: TodoColors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic'
  }
});
