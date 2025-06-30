// 카테고리 인터페이스 정의
export interface Category {
  id: string;
  name: string;
  color: string;
}

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
  { id: 'work', name: '업무', color: CategoryColors.blue },
  { id: 'personal', name: '개인', color: CategoryColors.green },
  { id: 'shopping', name: '쇼핑', color: CategoryColors.orange },
  { id: 'health', name: '건강', color: CategoryColors.red },
  { id: 'study', name: '공부', color: CategoryColors.purple },
];

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  importance: number;
  createdAt: number;
  dueDate: number | null; // 마감일 추가 (타임스탬프 또는 null)
  categoryId: string | null; // 카테고리 ID 추가
  // 추가할 수 있는 필드들
  // notes?: string;
}

// 할 일 생성을 위한 팩토리 함수
export const createTodo = (
  text: string, 
  dueDate: number | null = null,
  importance: number, 
  categoryId: string | null = null
): Todo => {
  const now = Date.now();
  return {
    id: now.toString(),
    text,
    completed: false,
    importance,
    createdAt: now,
    dueDate,
    categoryId: categoryId || 'default',  // null 대신 기본값 제공
  };
};

// 카테고리 생성을 위한 팩토리 함수
export const createCategory = (name: string, color: string): Category => {
  return {
    id: Date.now().toString(),
    name,
    color,
  };
};

// 카테고리 ID로 카테고리 찾기
export const findCategoryById = (categories: Category[] | undefined, id: string | null): Category | undefined => {
  if (!id || !categories || !Array.isArray(categories)) return undefined;
  return categories.find(category => category.id === id);
};
