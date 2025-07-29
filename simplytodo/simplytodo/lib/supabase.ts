import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { RecurringRule, CreateRecurringRuleRequest, DeleteOption, RecurringTaskInstance, RecurringType } from '@/types/RecurringRule';
import { logger } from './logger';

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
    // 소셜 로그인 관련 설정
    flowType: 'pkce',
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
  grade: number;             // 계층 레벨 (0: 메인, 1: Subtask, 2: 서브-Subtask)
  user_id?: string;
  created_at?: string;
  completed_at?: string | null; // 완료 날짜 추가
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
      logger.error('할 일 가져오기 오류:', error);
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
      logger.error('Subtask 가져오기 오류:', error);
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
      logger.error('메인 할 일 가져오기 오류:', error);
      return [];
    }
  },
  
  async addTodo(todo: TodoData) {
    const { data, error } = await supabase
      .from('todos')
      .insert([todo])
      .select();
    
    if (error) {
      logger.error('할 일 추가 오류:', error);
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
      logger.error('할 일 업데이트 오류:', error);
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
      logger.error('할 일 삭제 오류:', error);
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
      logger.error('부모 태스크 확인 오류:', parentError);
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
      logger.error('Subtask 추가 오류:', error);
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
      logger.error('Subtask 삭제 오류:', error);
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
      logger.error('Subtask 완료 상태 업데이트 오류:', error);
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
      logger.error('카테고리 가져오기 오류:', error);
      return [];
    }
  },
  
  async addCategory(category: CategoryData) {
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select();
    
    if (error) {
      logger.error('카테고리 추가 오류:', error);
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
      logger.error('카테고리 업데이트 오류:', error);
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
      logger.error('카테고리 삭제 오류:', error);
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
      logger.error('반복 규칙 가져오기 오류:', error);
      return [];
    }
  },

  async createRecurringRuleWithInstances(
    userId: string, 
    request: CreateRecurringRuleRequest
  ): Promise<{ rule: RecurringRule; instances: TodoData[]; instanceCount: number }> {
    try {
      // 1. 반복 규칙 생성
      const ruleData: Omit<RecurringRule, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        name: request.name,
        description: request.description,
        template: request.template,
        start_date: request.start_date,
        end_date: request.end_date,
        recurring_type: request.recurring_type,
        interval: request.interval,
        days_of_week: request.days_of_week,
        day_of_month: request.day_of_month,
        time_of_day: request.time_of_day,
        is_active: true,
        max_instances: request.max_instances || 100,
        last_generated: new Date().toISOString()
      };

      logger.db('1. 반복 규칙 데이터:', ruleData);
      
      const { data: ruleResult, error: ruleError } = await supabase
        .from('recurring_rules')
        .insert([ruleData])
        .select();

      logger.db('2. 반복 규칙 생성 결과:', { ruleResult, ruleError });
      
      if (ruleError) {
        logger.error('반복 규칙 생성 실패:', ruleError);
        throw ruleError;
      }
      const newRule = ruleResult[0] as RecurringRule;

      // 2. 메인 Task 생성 (RecurringRule 대표 할 일)
      const mainTask: TodoData = {
        text: newRule.name,
        completed: false,
        importance: newRule.template.importance,
        due_date: null, // 메인 태스크는 특정 마감일 없음
        category_id: newRule.template.category_id,
        user_id: userId,
        parent_id: null,
        grade: 0
      };

      logger.db('3. 메인 Task 데이터:', mainTask);
      
      const { data: mainTaskResult, error: mainTaskError } = await supabase
        .from('todos')
        .insert([mainTask])
        .select();

      logger.db('4. 메인 Task 생성 결과:', { mainTaskResult, mainTaskError });
      
      if (mainTaskError) {
        logger.error('메인 Task 생성 실패:', mainTaskError);
        throw mainTaskError;
      }
      const createdMainTask = mainTaskResult[0];

      // 3. Subtask 인스턴스들 생성
      const instances = recurringUtils.generateTaskInstances(newRule, createdMainTask.id);
      
      logger.db('5. 생성된 인스턴스 개수:', instances.length);
      
      if (instances.length > 0) {
        logger.db('6. 첫 번째 인스턴스 샘플:', instances[0]);
      logger.db('6-1. parent_id 확인:', instances[0].parent_id);
        
        const { data: todoResults, error: todoError } = await supabase
          .from('todos')
          .insert(instances)
          .select();

        logger.db('7. Subtask 생성 결과:', { todoCount: todoResults?.length, todoError });
        logger.db('7-1. 생성된 Subtask parent_id 확인:', todoResults?.[0]?.parent_id);

        if (todoError) {
          logger.error('Subtask 생성 실패:', todoError);
          throw todoError;
        }

        // 4. 연결 테이블에 관계 저장 (테이블이 존재하는 경우에만)
        try {
          const connections = todoResults.map(todo => ({
            todo_id: todo.id,
            recurring_rule_id: newRule.id,
            scheduled_date: todo.due_date,
            is_generated: true
          }));

          const { error: connectionError } = await supabase
            .from('recurring_task_instances')
            .insert(connections);

          if (connectionError) {
            logger.warn('연결 테이블 저장 실패 (테이블이 없을 수 있음):', connectionError);
          }
        } catch (connectionErr) {
          logger.warn('연결 테이블 작업 건너뜀:', connectionErr);
        }

        return { 
          rule: newRule, 
          instances: [createdMainTask, ...todoResults], 
          instanceCount: todoResults.length 
        };
      }

      return { rule: newRule, instances: [createdMainTask], instanceCount: 0 };
    } catch (error) {
      logger.error('반복 규칙과 인스턴스 생성 오류:', error);
      logger.error('에러 상세:', JSON.stringify(error, null, 2));
      throw error;
    }
  },

  async deleteRecurringRule(id: string, option: DeleteOption): Promise<boolean> {
    try {
      if (option === 'rule_and_instances') {
        try {
          // 1. 연결된 모든 Todo 인스턴스 찾기
          const { data: connections, error: connectionError } = await supabase
            .from('recurring_task_instances')
            .select('todo_id')
            .eq('recurring_rule_id', id);

          if (connectionError) {
            logger.warn('연결 테이블 조회 실패, 직접 삭제 시도:', connectionError);
            // 연결 테이블 없으면 recurring_rules에 연결된 todos 찾기 (임시)
            // 현재는 parent_id로 찾을 수 없으므로 규칙만 삭제
          } else if (connections && connections.length > 0) {
            // 2. Todo 인스턴스들 삭제
            const todoIds = connections.map(conn => conn.todo_id);
            const { error: todosError } = await supabase
              .from('todos')
              .delete()
              .in('id', todoIds);

            if (todosError) throw todosError;

            // 3. 연결 레코드들 삭제
            const { error: connectionsError } = await supabase
              .from('recurring_task_instances')
              .delete()
              .eq('recurring_rule_id', id);

            if (connectionsError) logger.warn('연결 레코드 삭제 실패:', connectionsError);
          }
        } catch (err) {
          logger.warn('인스턴스 삭제 과정에서 오류, 규칙만 삭제:', err);
        }
      }

      // 4. 반복 규칙 삭제
      const { error } = await supabase
        .from('recurring_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('반복 규칙 삭제 오류:', error);
      throw error;
    }
  },

  async updateRecurringRule(id: string, updates: Partial<RecurringRule>): Promise<RecurringRule> {
    const { data, error } = await supabase
      .from('recurring_rules')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) {
      logger.error('반복 규칙 업데이트 오류:', error);
      throw error;
    }
    return data?.[0];
  },

  async getRecurringTaskInstances(ruleId: string): Promise<RecurringTaskInstance[]> {
    try {
      const { data, error } = await supabase
        .from('recurring_task_instances')
        .select('*')
        .eq('recurring_rule_id', ruleId)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('반복 작업 인스턴스 가져오기 오류:', error);
      return [];
    }
  }
};

// Subtask 관련 유틸리티 함수들
export const subtaskUtils = {
  // TodoData 배열을 트리 구조로 변환
  buildTodoTree(todos: TodoData[]): any[] {
    const todoMap = new Map<string, any>();
    const rootTodos: any[] = [];
    
    
    // 모든 todo를 맵에 저장하고 subtasks 배열 초기화
    todos.forEach(todo => {
      todoMap.set(todo.id!, { ...todo, subtasks: [] });
    });
    
    // 부모-자식 관계 구성
    todos.forEach(todo => {
      const todoWithSubtasks = todoMap.get(todo.id!)!;
      
      if ((todo as any).parentId) {
        const parent = todoMap.get((todo as any).parentId);
        if (parent) {
          parent.subtasks.push(todoWithSubtasks);
        }
      } else {
        rootTodos.push(todoWithSubtasks);
      }
    });
    
    // Subtask 정렬 (중요도 높은순 → 마감일 빠른순 → 생성일 최신순)
    const sortSubtasks = (subtasks: any[]): any[] => {
      return subtasks.sort((a, b) => {
        // 1. 완료 상태 (미완료가 먼저)
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        
        // 2. 중요도 (높은순)
        if (a.importance !== b.importance) {
          return b.importance - a.importance;
        }
        
        // 3. 마감일 (빠른순, null은 마지막)
        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        if (a.due_date && !b.due_date) return -1;
        if (!a.due_date && b.due_date) return 1;
        
        // 4. 생성일 (최신순)
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }).map(subtask => {
        // 재귀적으로 하위 subtask도 정렬
        if (subtask.subtasks && subtask.subtasks.length > 0) {
          subtask.subtasks = sortSubtasks(subtask.subtasks);
        }
        return subtask;
      });
    };
    
    // 모든 todo의 subtask 정렬
    rootTodos.forEach(todo => {
      if (todo.subtasks && todo.subtasks.length > 0) {
        todo.subtasks = sortSubtasks(todo.subtasks);
      }
    });
    
    return rootTodos;
  },

  // 할 일의 완료 상태 확인 (Subtask 포함)
  isFullyCompleted(todo: TodoData & { subtasks?: TodoData[] }): boolean {
    if (!todo.completed) return false;
    if (!todo.subtasks || todo.subtasks.length === 0) return true;
    return todo.subtasks.every(subtask => this.isFullyCompleted(subtask));
  },

  // 할 일의 진행률 계산 (Subtask 포함)
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

  // 할 일의 Subtask 개수 계산
  countSubtasks(todo: TodoData & { subtasks?: TodoData[] }): number {
    if (!todo.subtasks || todo.subtasks.length === 0) return 0;
    return todo.subtasks.length + todo.subtasks.reduce((sum, subtask) => sum + this.countSubtasks(subtask), 0);
  },

  // 할 일의 완료된 Subtask 개수 계산
  countCompletedSubtasks(todo: TodoData & { subtasks?: TodoData[] }): number {
    if (!todo.subtasks || todo.subtasks.length === 0) return 0;
    return todo.subtasks.filter(subtask => subtask.completed).length + 
           todo.subtasks.reduce((sum, subtask) => sum + this.countCompletedSubtasks(subtask), 0);
  }
};

// 반복 규칙 관련 유틸리티 함수들
export const recurringUtils = {
  // 반복 규칙에 따라 Task 인스턴스들 생성 (Subtask로)
  generateTaskInstances(rule: RecurringRule, parentTaskId: string): TodoData[] {
    const instances: TodoData[] = [];
    const startDate = new Date(rule.start_date);
    const endDate = rule.end_date ? new Date(rule.end_date) : this.getDefaultEndDate(startDate);
    const maxInstances = rule.max_instances || 100;

    let currentDate = new Date(startDate);
    let instanceCount = 0;

    while (currentDate <= endDate && instanceCount < maxInstances) {
      if (this.shouldCreateInstance(rule, currentDate)) {
        const dueDate = this.createDueDateWithTime(currentDate, rule.time_of_day);
        
        const instance: TodoData = {
          text: `${dueDate.toLocaleDateString('ko-KR')} ${rule.template.text}`,
          completed: false,
          importance: rule.template.importance,
          due_date: dueDate.toISOString(),
          category_id: rule.template.category_id,
          user_id: rule.user_id,
          parent_id: parentTaskId,
          grade: 1
        };

        instances.push(instance);
        instanceCount++;
      }

      currentDate = this.getNextDate(rule, currentDate);
    }

    return instances;
  },

  // 기본 종료일 계산 (시작일로부터 1년)
  getDefaultEndDate(startDate: Date): Date {
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    return endDate;
  },

  // 특정 날짜에 인스턴스를 생성해야 하는지 확인
  shouldCreateInstance(rule: RecurringRule, date: Date): boolean {
    switch (rule.recurring_type) {
      case 'daily':
        return true; // interval은 getNextDate에서 처리
      
      case 'weekly':
        if (rule.days_of_week && rule.days_of_week.length > 0) {
          return rule.days_of_week.includes(date.getDay());
        }
        return true;
      
      case 'monthly':
        if (rule.day_of_month) {
          return date.getDate() === rule.day_of_month;
        }
        return date.getDate() === new Date(rule.start_date).getDate();
      
      default:
        return true;
    }
  },

  // 다음 날짜 계산
  getNextDate(rule: RecurringRule, currentDate: Date): Date {
    const nextDate = new Date(currentDate);

    switch (rule.recurring_type) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + rule.interval);
        break;
      
      case 'weekly':
        if (rule.days_of_week && rule.days_of_week.length > 0) {
          // 다음 요일로 이동
          nextDate.setDate(nextDate.getDate() + 1);
          while (!rule.days_of_week.includes(nextDate.getDay())) {
            nextDate.setDate(nextDate.getDate() + 1);
          }
        } else {
          nextDate.setDate(nextDate.getDate() + (7 * rule.interval));
        }
        break;
      
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + rule.interval);
        
        // 월말 날짜 처리 (31일 → 28/29/30일)
        if (rule.day_of_month) {
          const lastDayOfMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
          nextDate.setDate(Math.min(rule.day_of_month, lastDayOfMonth));
        }
        break;
      
      default:
        nextDate.setDate(nextDate.getDate() + 1);
    }

    return nextDate;
  },

  // 날짜에 시간 추가
  createDueDateWithTime(date: Date, timeOfDay?: string): Date {
    const dueDate = new Date(date);
    
    if (timeOfDay) {
      const [hours, minutes] = timeOfDay.split(':').map(Number);
      dueDate.setHours(hours, minutes, 0, 0);
    } else {
      // 기본값: 오전 9시
      dueDate.setHours(9, 0, 0, 0);
    }

    return dueDate;
  },

  // 반복 패턴 설명 생성
  getRecurrenceDescription(rule: RecurringRule): string {
    const { recurring_type, interval, days_of_week, day_of_month, time_of_day } = rule;
    
    let description = '';

    switch (recurring_type) {
      case 'daily':
        description = interval === 1 ? '매일' : `${interval}일마다`;
        break;
      
      case 'weekly':
        if (days_of_week && days_of_week.length > 0) {
          const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
          const selectedDays = days_of_week.map(day => dayNames[day]).join(', ');
          description = interval === 1 ? `매주 ${selectedDays}요일` : `${interval}주마다 ${selectedDays}요일`;
        } else {
          description = interval === 1 ? '매주' : `${interval}주마다`;
        }
        break;
      
      case 'monthly':
        const dayText = day_of_month ? `${day_of_month}일` : '같은 날';
        description = interval === 1 ? `매월 ${dayText}` : `${interval}개월마다 ${dayText}`;
        break;
      
      default:
        description = '사용자 정의';
    }

    if (time_of_day) {
      description += ` ${time_of_day}`;
    }

    return description;
  },

  // 다음 실행 예정일 계산
  getNextScheduledDate(rule: RecurringRule): Date | null {
    if (!rule.is_active) return null;

    const now = new Date();
    const startDate = new Date(rule.start_date);
    const endDate = rule.end_date ? new Date(rule.end_date) : this.getDefaultEndDate(startDate);

    if (now > endDate) return null;

    let currentDate = new Date(Math.max(now.getTime(), startDate.getTime()));
    const maxIterations = 365; // 무한 루프 방지
    let iterations = 0;

    while (currentDate <= endDate && iterations < maxIterations) {
      if (this.shouldCreateInstance(rule, currentDate)) {
        return this.createDueDateWithTime(currentDate, rule.time_of_day);
      }
      
      currentDate = this.getNextDate(rule, currentDate);
      iterations++;
    }

    return null;
  }
};
