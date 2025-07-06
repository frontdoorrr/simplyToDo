// React Native에서 URL 및 URLSearchParams 지원을 위한 polyfill
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { RecurringRule } from '@/types/RecurringRule';

// 플랫폼에 따라 다른 저장소 사용
let storage;

// React Native용 저장소
const AsyncStorage = require('@react-native-async-storage/async-storage').default;

// 가상 저장소 - SSR이나 테스트 환경에서 사용
// localStorage가 없는 서버사이드 렌더링 환경에서 동작하기 위함
const memoryStorage = {
  storage: {} as Record<string, string>,
  async getItem(key: string) {
    return this.storage[key] || null;
  },
  async setItem(key: string, value: string) {
    this.storage[key] = value;
  },
  async removeItem(key: string) {
    delete this.storage[key];
  }
};

// 웹 환경에서 localStorage 존재 확인
if (Platform.OS === 'web') {
  // 웹 환경에서 localStorage가 존재하는지 확인 (서버사이드에서는 없음)
  const hasLocalStorage = typeof window !== 'undefined' && window.localStorage !== undefined;
  if (hasLocalStorage) {
    // 브라우저 환경 - localStorage 사용
    storage = {
      async getItem(key: string) {
        return localStorage.getItem(key);
      },
      async setItem(key: string, value: string) {
        return localStorage.setItem(key, value);
      },
      async removeItem(key: string) {
        return localStorage.removeItem(key);
      }
    };
  } else {
    // 서버사이드 렌더링 - 가상 메모리 저장소 사용
    console.log('서버사이드 환경에서 memoryStorage 사용');
    storage = memoryStorage;
  }
} else {
  // React Native 환경 - AsyncStorage 사용
  storage = AsyncStorage;
}

// Supabase 프로젝트 URL 및 익명 키 - HTTPS 사용 확인
const supabaseUrl = 'https://sfrgigqeydzmdyyucmfl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmcmdpZ3FleWR6bWR5eXVjbWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExOTM4ODMsImV4cCI6MjA2Njc2OTg4M30.zykBzW2xhlJr_5BtTifztDqMIN9jGQted-F9MRBLw04';

// iOS용 고급 fetch 래퍼 함수
const customFetch = async (url: RequestInfo | URL, options: RequestInit = {}) => {
  let urlString = typeof url === 'string' ? url : url.toString();
  
  // localhost 참조를 Mac 장치의 IP로 변경 (실제 기기에서 테스트할 때 필요)
  if (urlString.includes('localhost') && Platform.OS === 'ios') {
    const EXPO_IP = '172.30.107.16'; // 실제 Expo 서버 IP
    urlString = urlString.replace('localhost', EXPO_IP);
  }
  
  // iOS의 경우 추가 헤더 설정
  const mergedHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Pragma': 'no-cache',
    ...(
      options.headers && typeof (options.headers as any).get === 'function'
        ? Object.fromEntries(
            (Array.from((options.headers as any).entries()) as [string, any][]).filter(
              ([key, _value]) => key.toLowerCase() !== 'content-type'
            )
          )
        : Object.fromEntries(
            (Object.entries(options.headers || {}) as [string, any][]).filter(
              ([key, _value]) => key.toLowerCase() !== 'content-type'
            )
          )
    ),
  };
  
  // 타임아웃 처리를 위한 AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 60000); // 60초로 연장
  
  // 최대 1회 재시도
  let attempts = 0;
  const maxAttempts = 1;
  let lastError;

  while (attempts < maxAttempts) {
    try {
      console.log(`[customFetch] fetch 요청:`, { urlString, options });
      const response = await fetch(urlString, {
        ...options,
        headers: mergedHeaders,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      let responseBody;
      try {
        responseBody = await response.clone().json();
      } catch (jsonErr) {
        try {
          responseBody = await response.clone().text();
        } catch (textErr) {
          // 파싱 실패 시 별도 로그 남기지 않음
        }
      }
      if (!response.ok) {
        console.error(`[customFetch] 응답 실패:`, { status: response.status, responseBody });
        throw new Error(responseBody ? JSON.stringify(responseBody) : '응답 실패');
      }
      return response;
    } catch (error) {
      lastError = error;
      console.error(`[customFetch] 네트워크 에러:`, error);
      attempts++;
      if (attempts >= maxAttempts) {
        clearTimeout(timeoutId);
        console.error('[customFetch] 모든 재시도 실패. 마지막 에러:', lastError);
        break;
      }
      // 재시도 전 대기 (로그 생략)
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw lastError;
};

// 기본 옵션으로 Supabase 클라이언트 생성 - 과도한 처리로 인한 문제 방지를 위해 최소한의 필요 설정만 유지
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  global: {
    fetch: customFetch
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

export const recurringRulesApi = {
  async getRecurringRules(userId: string): Promise<RecurringRule[]> {
    return withRetry(async () => {
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
    });
  },

  async addRecurringRule(rule: Omit<RecurringRule, 'id' | 'created_at' | 'updated_at'>): Promise<RecurringRule> {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('recurring_rules')
        .insert([rule])
        .select();
      if (error) {
        console.error('반복 규칙 추가 오류:', error);
        throw error;
      }
      return data?.[0];
    });
  },

  async updateRecurringRule(id: string, updates: Partial<RecurringRule>): Promise<RecurringRule> {
    return withRetry(async () => {
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
    });
  },

  async deleteRecurringRule(id: string): Promise<boolean> {
    return withRetry(async () => {
      const { error } = await supabase
        .from('recurring_rules')
        .delete()
        .eq('id', id);
      if (error) {
        console.error('반복 규칙 삭제 오류:', error);
        throw error;
      }
      return true;
    });
  }
};
