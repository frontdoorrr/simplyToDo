export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  importance: number;
  createdAt: number;
  dueDate: number | null; // 마감일 추가 (타임스킬프 또는 null)
  // 추가할 수 있는 필드들
  // category?: string;
  // notes?: string;
}

// 할 일 생성을 위한 팩토리 함수
export const createTodo = (text: string, importance: number, dueDate: number | null = null): Todo => {
  return {
    id: Date.now().toString(),
    text,
    completed: false,
    importance,
    createdAt: Date.now(),
    dueDate,
  };
};
