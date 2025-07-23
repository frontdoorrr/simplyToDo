// 마감일 통계 타입 정의

export interface DueDateStatistics {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  totalTasks: number;
  completedTasks: number;
  dueTodayTasks: number;
  dueTodayCompleted: number;
  overdueTasks: number;
  avgCompletionTime: number; // minutes
  createdAt: Date;
}

export interface CategoryStatistics {
  categoryId: string;
  categoryName: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  avgDuration: number;
  color: string;
}

export interface WeeklyTrend {
  date: string;
  completionRate: number;
  totalTasks: number;
  completedTasks: number;
  overdueCount: number;
}

export interface ProductivityInsight {
  id: string;
  type: 'strength' | 'weakness' | 'suggestion' | 'achievement';
  title: string;
  message: string;
  actionable: boolean;
  actionText?: string;
  actionType?: 'navigate' | 'modal' | 'function';
  priority: 'high' | 'medium' | 'low';
  generatedAt: Date;
}

export interface TodayStatistics {
  total: number;
  completed: number;
  due: number;
  dueCompleted: number;
  overdue: number;
  completionRate: number;
}

export interface UpcomingStatistics {
  tomorrow: number;
  thisWeek: number;
  nextWeek: number;
  thisMonth: number;
}

export interface OverdueItem {
  id: string;
  title: string;
  dueDate: number;
  daysOverdue: number;
  importance: number;
  categoryId: string;
  categoryName: string;
}

export interface OverdueStatistics {
  yesterday: number;
  lastWeek: number;
  total: number;
  items: OverdueItem[];
}

export interface StatisticsSummary {
  today: TodayStatistics;
  upcoming: UpcomingStatistics;
  overdue: OverdueStatistics;
  trends: {
    daily: WeeklyTrend[];
    weekly: WeeklyTrend[];
    monthly: WeeklyTrend[];
  };
  categories: CategoryStatistics[];
  insights: ProductivityInsight[];
  lastUpdated: Date;
}

export interface ProductivityPattern {
  timeOfDay: string; // "morning" | "afternoon" | "evening" | "night"
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  completionRate: number;
  avgTasksCompleted: number;
  mostProductiveHour: number; // 0-23
}

// 통계 필터 및 옵션
export interface StatisticsFilter {
  dateRange: {
    start: Date;
    end: Date;
  };
  categories?: string[];
  importance?: number[];
  completed?: boolean;
}

export interface StatisticsOptions {
  includeOverdue: boolean;
  includeCompleted: boolean;
  groupByCategory: boolean;
  calculateTrends: boolean;
}

// 차트 데이터 인터페이스
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  percentage?: number;
}

export interface TrendChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color: string;
  }>;
}

// 기본값 상수
export const DEFAULT_STATISTICS_FILTER: StatisticsFilter = {
  dateRange: {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7일 전
    end: new Date()
  }
};

export const DEFAULT_STATISTICS_OPTIONS: StatisticsOptions = {
  includeOverdue: true,
  includeCompleted: true,
  groupByCategory: true,
  calculateTrends: true
};

// 통계 캐시 키
export const STATISTICS_CACHE_KEYS = {
  TODAY_STATS: 'statistics_today',
  WEEKLY_TRENDS: 'statistics_weekly_trends',
  MONTHLY_TRENDS: 'statistics_monthly_trends',
  CATEGORY_STATS: 'statistics_categories',
  INSIGHTS: 'statistics_insights'
} as const;

// 통계 카테고리 색상 매핑
export const CATEGORY_COLORS = {
  work: '#2196F3',
  personal: '#4CAF50',
  health: '#FF5722',
  study: '#9C27B0',
  creative: '#FF9800',
  default: '#757575'
} as const;