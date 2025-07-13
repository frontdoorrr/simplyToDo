import { v4 as uuidv4 } from 'uuid';

// 카테고리 인터페이스 정의
export interface Category {
  id: string;
  name: string;
  color: string;
}

// Subtask 관련 상수
export const SUBTASK_CONSTANTS = {
  MAX_GRADE: 2,
  MAIN_TODO_GRADE: 0,
  SUBTASK_GRADE: 1,
  SUB_SUBTASK_GRADE: 2,
  GRADE_NAMES: {
    0: '메인 할 일',
    1: 'Subtask',
    2: '서브-Subtask'
  } as const
};

// 기본 카테고리 색상
export const CategoryColors = {
  blue: '#4285F4',
  red: '#EA4335',
  green: '#34A853',
  yellow: '#FBBC05',
  purple: '#9C27B0',
  teal: '#009688',
  pink: '#E91E63',
  orange: '#FF9800',
  brown: '#795548',
  gray: '#9E9E9E',
};

// 기본 카테고리 목록
export const DefaultCategories: Category[] = [
  { id: '50ec9810-a80b-40fb-8af4-857c7ca2dbeb', name: '업무', color: CategoryColors.blue },
  { id: 'd6ed3190-59ac-4f85-b437-dd8181c25a6b', name: '개인', color: CategoryColors.green },
  { id: '0b998f10-d570-4361-b590-7ce82ee6d392', name: '쇼핑', color: CategoryColors.orange },
  { id: 'b2421946-aba8-4514-b9cd-a91b7ec404a8', name: '건강', color: CategoryColors.red },
  { id: 'e3a82072-4518-4d3a-b53d-1b83b31a7f06', name: '공부', color: CategoryColors.purple },
];

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  importance: number;
  createdAt: number;
  dueDate: number | null; // 마감일 추가 (타임스탬프 또는 null)
  categoryId: string | null; // 카테고리 ID 추가
  parentId: string | null; // 부모 todo ID (subtask system)
  grade: number; // 계층 레벨 (0: 메인, 1: Subtask, 2: 서브-Subtask)
  subtasks?: Todo[]; // 하위 태스크 배열 (computed field, not stored)
  // 추가할 수 있는 필드들
  // notes?: string;
}

// 할 일 생성을 위한 팩토리 함수
export const createTodo = (
  text: string, 
  dueDate: number | null = null,
  importance: number, 
  categoryId: string | null = null,
  parentId: string | null = null,
  grade: number = 0
): Todo => {
  const now = Date.now();
  return {
    id: uuidv4(),
    text,
    completed: false,
    importance,
    createdAt: now,
    dueDate,
    categoryId: categoryId || 'default',  // null 대신 기본값 제공
    parentId,
    grade,
  };
};

// 카테고리 생성을 위한 팩토리 함수
export const createCategory = (name: string, color: string): Category => {
  return {
    id: uuidv4(),
    name,
    color,
  };
};

// 카테고리 ID로 카테고리 찾기
export const findCategoryById = (categories: Category[] | undefined, id: string | null): Category | undefined => {
  if (!id || !categories || !Array.isArray(categories)) return undefined;
  return categories.find(category => category.id === id);
};

// Subtask 관련 유틸리티 함수들
export const MAX_GRADE = 2; // 최대 계층 레벨

// Subtask 생성을 위한 팩토리 함수
export const createSubtask = (
  text: string,
  parentId: string,
  parentGrade: number,
  importance: number = 1,
  dueDate: number | null = null,
  categoryId: string | null = null
): Todo => {
  const grade = parentGrade + 1;
  if (grade > MAX_GRADE) {
    throw new Error(`최대 계층 레벨(${MAX_GRADE})을 초과할 수 없습니다.`);
  }
  
  return createTodo(text, dueDate, importance, categoryId, parentId, grade);
};

// 할 일 목록을 트리 구조로 변환
export const buildTodoTree = (todos: Todo[]): Todo[] => {
  const todoMap = new Map<string, Todo>();
  const rootTodos: Todo[] = [];
  
  // 모든 todo를 맵에 저장하고 subtasks 배열 초기화
  todos.forEach(todo => {
    todoMap.set(todo.id, { ...todo, subtasks: [] });
  });
  
  // 부모-자식 관계 구성
  todos.forEach(todo => {
    const todoWithSubtasks = todoMap.get(todo.id)!;
    
    if (todo.parentId) {
      const parent = todoMap.get(todo.parentId);
      if (parent) {
        parent.subtasks = parent.subtasks || [];
        parent.subtasks.push(todoWithSubtasks);
      }
    } else {
      rootTodos.push(todoWithSubtasks);
    }
  });
  
  return rootTodos;
};

// 할 일의 완료 상태 확인 (Subtask 포함)
export const isFullyCompleted = (todo: Todo): boolean => {
  if (!todo.completed) return false;
  if (!todo.subtasks || todo.subtasks.length === 0) return true;
  return todo.subtasks.every(subtask => isFullyCompleted(subtask));
};

// 할 일의 진행률 계산 (Subtask 포함)
export const calculateProgress = (todo: Todo): number => {
  if (!todo.subtasks || todo.subtasks.length === 0) {
    return todo.completed ? 1 : 0;
  }
  
  const totalSubtasks = todo.subtasks.length;
  const completedSubtasks = todo.subtasks.reduce((sum, subtask) => {
    return sum + calculateProgress(subtask);
  }, 0);
  
  return completedSubtasks / totalSubtasks;
};

// 할 일 트리를 평면 배열로 변환
export const flattenTodoTree = (todos: Todo[]): Todo[] => {
  const result: Todo[] = [];
  
  const flatten = (todoList: Todo[]) => {
    todoList.forEach(todo => {
      result.push(todo);
      if (todo.subtasks && todo.subtasks.length > 0) {
        flatten(todo.subtasks);
      }
    });
  };
  
  flatten(todos);
  return result;
};
