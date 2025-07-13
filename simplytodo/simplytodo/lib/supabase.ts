import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { RecurringRule } from '@/types/RecurringRule';

const supabaseUrl = 'https://sfrgigqeydzmdyyucmfl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmcmdpZ3FleWR6bWR5eXVjbWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExOTM4ODMsImV4cCI6MjA2Njc2OTg4M30.zykBzW2xhlJr_5BtTifztDqMIN9jGQted-F9MRBLw04';

// 플랫폼별 스토리지 설정
const getStorage = () => {
  if (Platform.OS === 'web') {
    // 웹 환경에서는 localStorage 사용
    return {
      getItem: (key: string) => {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(key);
        }
        return null;
      },
      setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value);
        }
      },
      removeItem: (key: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
      },
    };
  } else {
    // React Native 환경에서는 AsyncStorage 사용
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return AsyncStorage;
  }
};

// 표준 Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// 타입 정의
export interface TodoData {
  id?: string;
  text: string;
  completed: boolean;
  importance: number;
  due_date: string | null;
  category_id: string | null;
  parent_id: string | null;  // 부모 todo ID (subtask system)
  grade: number;             // 계층 레벨 (0: 메인, 1: 서브태스크, 2: 서브-서브태스크)
  user_id?: string;
  created_at?: string;
}

export interface CategoryData {
  id?: string;
  name: string;
  color: string;
  user_id?: string;
}

// 할 일 관련 API 함수
export const todosApi = {
  async getTodos(userId: string) {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .order('grade', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('할 일 가져오기 오류:', error);
      return [];
    }
  },

  async getSubtasks(userId: string, parentId: string) {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .eq('parent_id', parentId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('서브태스크 가져오기 오류:', error);
      return [];
    }
  },

  async getMainTodos(userId: string) {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .eq('grade', 0)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('메인 할 일 가져오기 오류:', error);
      return [];
    }
  },
  
  async addTodo(todo: TodoData) {
    const { data, error } = await supabase
      .from('todos')
      .insert([todo])
      .select();
    
    if (error) {
      console.error('할 일 추가 오류:', error);
      throw error;
    }
    return data?.[0];
  },
  
  async updateTodo(id: string, updates: Partial<TodoData>) {
    const { data, error } = await supabase
      .from('todos')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('할 일 업데이트 오류:', error);
      throw error;
    }
    return data?.[0];
  },
  
  async deleteTodo(id: string) {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('할 일 삭제 오류:', error);
      throw error;
    }
    return true;
  },

  async addSubtask(parentId: string, subtaskData: Omit<TodoData, 'parent_id' | 'grade'>) {
    // 부모의 grade 확인
    const { data: parentData, error: parentError } = await supabase
      .from('todos')
      .select('grade')
      .eq('id', parentId)
      .single();
    
    if (parentError) {
      console.error('부모 태스크 확인 오류:', parentError);
      throw parentError;
    }
    
    const newGrade = parentData.grade + 1;
    if (newGrade > 2) {
      throw new Error('최대 계층 레벨(2)을 초과할 수 없습니다.');
    }
    
    const subtask: TodoData = {
      ...subtaskData,
      parent_id: parentId,
      grade: newGrade
    };
    
    const { data, error } = await supabase
      .from('todos')
      .insert([subtask])
      .select();
    
    if (error) {
      console.error('서브태스크 추가 오류:', error);
      throw error;
    }
    return data?.[0];
  },

  async deleteSubtasks(parentId: string) {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('parent_id', parentId);
    
    if (error) {
      console.error('서브태스크 삭제 오류:', error);
      throw error;
    }
    return true;
  },

  async updateSubtaskCompletion(parentId: string, completed: boolean) {
    const { error } = await supabase
      .from('todos')
      .update({ completed })
      .eq('parent_id', parentId);
    
    if (error) {
      console.error('서브태스크 완료 상태 업데이트 오류:', error);
      throw error;
    }
    return true;
  }
};

// 카테고리 관련 API 함수
export const categoriesApi = {
  async getCategories(userId: string) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('카테고리 가져오기 오류:', error);
      return [];
    }
  },
  
  async addCategory(category: CategoryData) {
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select();
    
    if (error) {
      console.error('카테고리 추가 오류:', error);
      throw error;
    }
    return data?.[0];
  },
  
  async updateCategory(id: string, updates: Partial<CategoryData>) {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('카테고리 업데이트 오류:', error);
      throw error;
    }
    return data?.[0];
  },
  
  async deleteCategory(id: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('카테고리 삭제 오류:', error);
      throw error;
    }
    return true;
  }
};

export const recurringRulesApi = {
  async getRecurringRules(userId: string): Promise<RecurringRule[]> {
    try {
      const { data, error } = await supabase
        .from('recurring_rules')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('반복 규칙 가져오기 오류:', error);
      return [];
    }
  },

  async addRecurringRule(rule: Omit<RecurringRule, 'id' | 'created_at' | 'updated_at'>): Promise<RecurringRule> {
    const { data, error } = await supabase
      .from('recurring_rules')
      .insert([rule])
      .select();
    if (error) {
      console.error('반복 규칙 추가 오류:', error);
      throw error;
    }
    return data?.[0];
  },

  async updateRecurringRule(id: string, updates: Partial<RecurringRule>): Promise<RecurringRule> {
    const { data, error } = await supabase
      .from('recurring_rules')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) {
      console.error('반복 규칙 업데이트 오류:', error);
      throw error;
    }
    return data?.[0];
  },

  async deleteRecurringRule(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('recurring_rules')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('반복 규칙 삭제 오류:', error);
      throw error;
    }
    return true;
  }
};

// 서브태스크 관련 유틸리티 함수들
export const subtaskUtils = {
  // TodoData 배열을 트리 구조로 변환
  buildTodoTree(todos: TodoData[]): TodoData[] {
    const todoMap = new Map<string, TodoData & { subtasks: TodoData[] }>();
    const rootTodos: (TodoData & { subtasks: TodoData[] })[] = [];
    
    // 모든 todo를 맵에 저장하고 subtasks 배열 초기화
    todos.forEach(todo => {
      todoMap.set(todo.id!, { ...todo, subtasks: [] });
    });
    
    // 부모-자식 관계 구성
    todos.forEach(todo => {
      const todoWithSubtasks = todoMap.get(todo.id!)!;
      
      if (todo.parent_id) {
        const parent = todoMap.get(todo.parent_id);
        if (parent) {
          parent.subtasks.push(todoWithSubtasks);
        }
      } else {
        rootTodos.push(todoWithSubtasks);
      }
    });
    
    return rootTodos;
  },

  // 할 일의 완료 상태 확인 (서브태스크 포함)
  isFullyCompleted(todo: TodoData & { subtasks?: TodoData[] }): boolean {
    if (!todo.completed) return false;
    if (!todo.subtasks || todo.subtasks.length === 0) return true;
    return todo.subtasks.every(subtask => this.isFullyCompleted(subtask));
  },

  // 할 일의 진행률 계산 (서브태스크 포함)
  calculateProgress(todo: TodoData & { subtasks?: TodoData[] }): number {
    if (!todo.subtasks || todo.subtasks.length === 0) {
      return todo.completed ? 1 : 0;
    }
    
    const totalSubtasks = todo.subtasks.length;
    const completedSubtasks = todo.subtasks.reduce((sum, subtask) => {
      return sum + this.calculateProgress(subtask);
    }, 0);
    
    return completedSubtasks / totalSubtasks;
  },

  // 할 일 트리를 평면 배열로 변환
  flattenTodoTree(todos: (TodoData & { subtasks?: TodoData[] })[]): TodoData[] {
    const result: TodoData[] = [];
    
    const flatten = (todoList: (TodoData & { subtasks?: TodoData[] })[]) => {
      todoList.forEach(todo => {
        const { subtasks, ...todoData } = todo;
        result.push(todoData);
        if (subtasks && subtasks.length > 0) {
          flatten(subtasks);
        }
      });
    };
    
    flatten(todos);
    return result;
  },

  // 할 일의 서브태스크 개수 계산
  countSubtasks(todo: TodoData & { subtasks?: TodoData[] }): number {
    if (!todo.subtasks || todo.subtasks.length === 0) return 0;
    return todo.subtasks.length + todo.subtasks.reduce((sum, subtask) => sum + this.countSubtasks(subtask), 0);
  },

  // 할 일의 완료된 서브태스크 개수 계산
  countCompletedSubtasks(todo: TodoData & { subtasks?: TodoData[] }): number {
    if (!todo.subtasks || todo.subtasks.length === 0) return 0;
    return todo.subtasks.filter(subtask => subtask.completed).length + 
           todo.subtasks.reduce((sum, subtask) => sum + this.countCompletedSubtasks(subtask), 0);
  }
};
