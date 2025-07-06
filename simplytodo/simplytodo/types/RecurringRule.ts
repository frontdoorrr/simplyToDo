export interface RecurringRule {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_date: string; // ISO date string
  end_date?: string;  // ISO date string or undefined
  recurring_type: string; // 'daily', 'weekly', 'monthly', 'custom'
  interval: number;
  days_of_week?: string[]; // 예: ['mon', 'wed', 'fri']
  day_of_month?: number;
  time_of_day?: string; // 'HH:mm:ss' 형식
  timezone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
} 