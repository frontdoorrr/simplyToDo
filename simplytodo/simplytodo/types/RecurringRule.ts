export type RecurringType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface TodoTemplate {
  text: string;
  importance: number;
  category_id: string | null;
  due_time?: string; // 'HH:mm' 형식, 마감 시간
}

export interface RecurringRule {
  id: string;
  user_id: string;
  name: string;           // 반복 규칙 이름
  description?: string;
  
  // Todo 템플릿 정보
  template: TodoTemplate;
  
  // 반복 설정
  start_date: string;     // ISO date string
  end_date?: string;      // ISO date string or undefined
  recurring_type: RecurringType;
  interval: number;       // 매 N일/주/월
  days_of_week?: number[]; // 0-6 (일요일=0) 예: [1, 3, 5] = 월,수,금
  day_of_month?: number;  // 1-31, 월간 반복시 사용
  time_of_day?: string;   // 'HH:mm' 형식
  
  // 관리 설정
  is_active: boolean;
  max_instances?: number; // 최대 생성할 인스턴스 수 (기본: 100)
  last_generated?: string; // 마지막으로 생성된 날짜
  
  // 메타데이터
  created_at: string;
  updated_at: string;
}

// Task 인스턴스와 반복 규칙 연결을 위한 확장
export interface RecurringTaskInstance {
  todo_id: string;
  recurring_rule_id: string;
  scheduled_date: string; // ISO date string
  is_generated: boolean;  // 자동 생성된 인스턴스인지
  original_due_date?: string; // 원래 예정된 날짜 (사용자가 수정했을 경우)
}

// 삭제 옵션
export type DeleteOption = 'rule_only' | 'rule_and_instances';

// 반복 규칙 생성 요청
export interface CreateRecurringRuleRequest {
  name: string;
  description?: string;
  template: TodoTemplate;
  start_date: string;
  end_date?: string;
  recurring_type: RecurringType;
  interval: number;
  days_of_week?: number[];
  day_of_month?: number;
  time_of_day?: string;
  max_instances?: number;
} 