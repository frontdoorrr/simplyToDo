// React Native에서 URL 및 URLSearchParams 지원을 위한 polyfill
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Alert } from 'react-native';

// Supabase 프로젝트 URL 및 익명 키
const supabaseUrl = 'https://sfrgigqeydzmdyyucmfl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmcmdpZ3FleWR6bWR5eXVjbWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExOTM4ODMsImV4cCI6MjA2Njc2OTg4M30.zykBzW2xhlJr_5BtTifztDqMIN9jGQted-F9MRBLw04';

// 기본 옵션으로 Supabase 클라이언트 생성 - 네트워크 오류 문제 해결을 위해 단순화
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  }
});

// 타입 정의
export interface TodoData {
  id?: string;
  text: string;
  completed: boolean;
  importance: number;
  due_date: string | null;
  category_id: string | null;
  user_id?: string;
}

export interface CategoryData {
  id?: string;
  name: string;
  color: string;
  user_id?: string;
}

import { withRetry } from './networkUtils';

// 할 일 관련 함수
export const todosApi = {
  async getTodos(userId: string) {
    return withRetry(async () => {
      try {
        const { data, error } = await supabase
          .from('todos')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('할 일 가져오기 오류:', error);
        // 오류에도 불구하고 작업을 계속할 수 있도록 빈 배열 반환
        return [];
      }
    });
  },
  
  async addTodo(todo: TodoData) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('todos')
        .insert([todo])
        .select();
      
      if (error) {
        console.error('할 일 추가 오류:', error);
        throw error;
      }
      return data?.[0];
    });
  },
  
  async updateTodo(id: string, updates: Partial<TodoData>) {
    return withRetry(async () => {
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
    });
  },
  
  async deleteTodo(id: string) {
    return withRetry(async () => {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('할 일 삭제 오류:', error);
        throw error;
      }
      return true;
    });
  }
};

// 카테고리 관련 함수
export const categoriesApi = {
  async getCategories(userId: string) {
    return withRetry(async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', userId);
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('카테고리 가져오기 오류:', error);
        // 오류에도 불구하고 작업을 계속할 수 있도록 빈 배열 반환
        return [];
      }
    });
  },
  
  async addCategory(category: CategoryData) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('categories')
        .insert([category])
        .select();
      
      if (error) {
        console.error('카테고리 추가 오류:', error);
        throw error;
      }
      return data?.[0];
    });
  },
  
  async updateCategory(id: string, updates: Partial<CategoryData>) {
    return withRetry(async () => {
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
    });
  },
  
  async deleteCategory(id: string) {
    return withRetry(async () => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('카테고리 삭제 오류:', error);
        throw error;
      }
      return true;
    });
  }
};
