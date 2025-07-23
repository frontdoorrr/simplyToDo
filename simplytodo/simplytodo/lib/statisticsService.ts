import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StatisticsSummary,
  TodayStatistics,
  UpcomingStatistics,
  OverdueStatistics,
  OverdueItem,
  CategoryStatistics,
  WeeklyTrend,
  ProductivityInsight,
  StatisticsFilter,
  StatisticsOptions,
  DEFAULT_STATISTICS_FILTER,
  DEFAULT_STATISTICS_OPTIONS,
  STATISTICS_CACHE_KEYS,
  CATEGORY_COLORS
} from '@/types/Statistics';
import { Todo } from '@/types/Todo';
import { logger } from '@/lib/logger';
import { insightsGenerator } from '@/lib/insightsGenerator';

class StatisticsService {
  private static instance: StatisticsService;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  private constructor() {}

  public static getInstance(): StatisticsService {
    if (!StatisticsService.instance) {
      StatisticsService.instance = new StatisticsService();
    }
    return StatisticsService.instance;
  }

  // ========================================
  // 메인 통계 조회 메서드
  // ========================================

  /**
   * 오늘 마감 관련 통계 조회
   */
  public async getTodayStatistics(todos: Todo[]): Promise<TodayStatistics> {
    try {
      const cacheKey = `${STATISTICS_CACHE_KEYS.TODAY_STATS}_${new Date().toDateString()}`;
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        logger.debug('오늘 통계 캐시에서 조회');
        return cached;
      }

      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const todayEnd = todayStart + 24 * 60 * 60 * 1000;

      // 오늘 마감인 항목들 필터링
      const dueTodayTasks = todos.filter(todo => {
        if (!todo.dueDate) return false;
        return todo.dueDate >= todayStart && todo.dueDate < todayEnd;
      });

      // 오늘 마감이면서 완료된 항목들
      const dueTodayCompleted = dueTodayTasks.filter(todo => todo.completed);

      // 지연된 항목들 (마감일이 오늘 이전이면서 미완료)
      const overdueTasks = todos.filter(todo => {
        if (!todo.dueDate || todo.completed) return false;
        return todo.dueDate < todayStart;
      });

      // 전체 완료된 항목들 (오늘 완료된 것들)
      const todayCompleted = todos.filter(todo => {
        if (!todo.completedAt) return false;
        const completedDate = new Date(todo.completedAt);
        return completedDate >= new Date(todayStart) && completedDate < new Date(todayEnd);
      });

      const stats: TodayStatistics = {
        total: todayCompleted.length + dueTodayTasks.filter(t => !t.completed).length,
        completed: todayCompleted.length,
        due: dueTodayTasks.length,
        dueCompleted: dueTodayCompleted.length,
        overdue: overdueTasks.length,
        completionRate: dueTodayTasks.length > 0 ? 
          (dueTodayCompleted.length / dueTodayTasks.length) * 100 : 0
      };

      // 캐시에 저장 (1시간 TTL)
      await this.setCache(cacheKey, stats, 60 * 60 * 1000);
      
      logger.debug('오늘 통계 계산 완료', stats);
      return stats;

    } catch (error) {
      logger.error('오늘 통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 예정된 마감 관련 통계 조회
   */
  public async getUpcomingStatistics(todos: Todo[]): Promise<UpcomingStatistics> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // 시간 범위 계산
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const tomorrowEnd = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
      
      const thisWeekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const nextWeekEnd = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
      
      const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      // 미완료 항목들만 필터링
      const incompleteTodos = todos.filter(todo => !todo.completed && todo.dueDate);

      const stats: UpcomingStatistics = {
        tomorrow: incompleteTodos.filter(todo => 
          todo.dueDate! >= tomorrow.getTime() && todo.dueDate! < tomorrowEnd.getTime()
        ).length,
        
        thisWeek: incompleteTodos.filter(todo => 
          todo.dueDate! >= now.getTime() && todo.dueDate! < thisWeekEnd.getTime()
        ).length,
        
        nextWeek: incompleteTodos.filter(todo => 
          todo.dueDate! >= thisWeekEnd.getTime() && todo.dueDate! < nextWeekEnd.getTime()
        ).length,
        
        thisMonth: incompleteTodos.filter(todo => 
          todo.dueDate! >= now.getTime() && todo.dueDate! < thisMonthEnd.getTime()
        ).length
      };

      logger.debug('예정된 마감 통계 계산 완료', stats);
      return stats;

    } catch (error) {
      logger.error('예정된 마감 통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 지연된 마감 관련 통계 조회
   */
  public async getOverdueStatistics(todos: Todo[]): Promise<OverdueStatistics> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      // 지연된 항목들 (마감일이 과거이면서 미완료)
      const overdueTodos = todos.filter(todo => {
        if (!todo.dueDate || todo.completed) return false;
        return todo.dueDate < today.getTime();
      });

      // 지연된 항목 상세 정보 생성
      const overdueItems: OverdueItem[] = overdueTodos.map(todo => {
        const daysOverdue = Math.floor((today.getTime() - todo.dueDate!) / (24 * 60 * 60 * 1000));
        
        return {
          id: todo.id,
          title: todo.text,
          dueDate: todo.dueDate!,
          daysOverdue,
          importance: todo.importance,
          categoryId: todo.categoryId || 'default',
          categoryName: this.getCategoryName(todo.categoryId)
        };
      }).sort((a, b) => b.daysOverdue - a.daysOverdue); // 지연일수 내림차순

      const stats: OverdueStatistics = {
        yesterday: overdueTodos.filter(todo => 
          todo.dueDate! >= yesterday.getTime() && todo.dueDate! < today.getTime()
        ).length,
        
        lastWeek: overdueTodos.filter(todo => 
          todo.dueDate! >= lastWeek.getTime() && todo.dueDate! < yesterday.getTime()
        ).length,
        
        total: overdueTodos.length,
        items: overdueItems.slice(0, 10) // 최대 10개만 표시
      };

      logger.debug('지연된 마감 통계 계산 완료', { totalOverdue: stats.total });
      return stats;

    } catch (error) {
      logger.error('지연된 마감 통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 카테고리별 통계 조회
   */
  public async getCategoryStatistics(todos: Todo[]): Promise<CategoryStatistics[]> {
    try {
      const categoryMap = new Map<string, { total: number; completed: number; durations: number[] }>();

      todos.forEach(todo => {
        const categoryId = todo.categoryId || 'default';
        
        if (!categoryMap.has(categoryId)) {
          categoryMap.set(categoryId, { total: 0, completed: 0, durations: [] });
        }

        const stats = categoryMap.get(categoryId)!;
        stats.total++;

        if (todo.completed && todo.completedAt) {
          stats.completed++;
          
          // 완료까지 걸린 시간 계산 (생성일부터 완료일까지)
          const duration = (todo.completedAt - todo.createdAt) / (1000 * 60); // 분 단위
          stats.durations.push(duration);
        }
      });

      const categoryStats: CategoryStatistics[] = Array.from(categoryMap.entries()).map(
        ([categoryId, stats]) => ({
          categoryId,
          categoryName: this.getCategoryName(categoryId),
          totalTasks: stats.total,
          completedTasks: stats.completed,
          completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
          avgDuration: stats.durations.length > 0 ? 
            stats.durations.reduce((sum, d) => sum + d, 0) / stats.durations.length : 0,
          color: CATEGORY_COLORS[categoryId as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.default
        })
      ).sort((a, b) => b.completionRate - a.completionRate);

      logger.debug('카테고리별 통계 계산 완료', { categories: categoryStats.length });
      return categoryStats;

    } catch (error) {
      logger.error('카테고리별 통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 일간 트렌드 조회 (최근 7일)
   */
  public async getDailyTrends(todos: Todo[], days: number = 7): Promise<WeeklyTrend[]> {
    try {
      const trends: WeeklyTrend[] = [];
      const today = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const targetDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;

        // 해당 날짜에 마감인 할 일들
        const dueTodos = todos.filter(todo => 
          todo.dueDate && todo.dueDate >= dayStart && todo.dueDate < dayEnd
        );

        // 해당 날짜에 완료된 할 일들  
        const completedTodos = dueTodos.filter(todo => todo.completed);

        // 해당 날짜에 지연된 할 일들
        const overdueTodos = todos.filter(todo => 
          todo.dueDate && todo.dueDate < dayStart && !todo.completed
        );

        trends.push({
          date: targetDate.toISOString().split('T')[0],
          completionRate: dueTodos.length > 0 ? (completedTodos.length / dueTodos.length) * 100 : 0,
          totalTasks: dueTodos.length,
          completedTasks: completedTodos.length,
          overdueCount: overdueTodos.length
        });
      }

      return trends;
    } catch (error) {
      logger.error('일간 트렌드 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 전체 통계 요약 조회
   */
  public async getStatisticsSummary(todos: Todo[]): Promise<StatisticsSummary> {
    try {
      const [today, upcoming, overdue, categories, dailyTrends] = await Promise.all([
        this.getTodayStatistics(todos),
        this.getUpcomingStatistics(todos),
        this.getOverdueStatistics(todos),
        this.getCategoryStatistics(todos),
        this.getDailyTrends(todos, 7)
      ]);

      // 기본 통계 요약 객체 생성
      const basicSummary: StatisticsSummary = {
        today,
        upcoming,
        overdue,
        trends: {
          daily: dailyTrends,
          weekly: [], // Phase 2에서 추가 구현
          monthly: [] // Phase 2에서 추가 구현
        },
        categories,
        insights: [],
        lastUpdated: new Date()
      };

      // 인사이트 생성
      const insights = await insightsGenerator.generateInsights(basicSummary, todos);
      
      const summary: StatisticsSummary = {
        ...basicSummary,
        insights
      };

      logger.debug('전체 통계 요약 조회 완료', { insightsCount: insights.length });
      return summary;

    } catch (error) {
      logger.error('전체 통계 요약 조회 실패:', error);
      throw error;
    }
  }

  // ========================================
  // 유틸리티 메서드
  // ========================================

  /**
   * 카테고리 이름 반환
   */
  private getCategoryName(categoryId?: string | null): string {
    const categoryNames: { [key: string]: string } = {
      work: '업무',
      personal: '개인',
      health: '건강',
      study: '학습',
      creative: '창작'
    };

    return categoryNames[categoryId || 'default'] || '기타';
  }

  /**
   * 캐시에서 데이터 조회 (AsyncStorage + 메모리 캐시)
   */
  private async getFromCache(key: string): Promise<any | null> {
    try {
      // 1. 메모리 캐시 먼저 확인
      const memoryCache = this.cache.get(key);
      if (memoryCache) {
        const now = Date.now();
        if (now - memoryCache.timestamp <= memoryCache.ttl) {
          logger.debug(`메모리 캐시 히트: ${key}`);
          return memoryCache.data;
        } else {
          this.cache.delete(key);
        }
      }

      // 2. AsyncStorage 캐시 확인
      const storageCache = await this.getStatisticsFromStorage(key);
      if (storageCache) {
        logger.debug(`스토리지 캐시 히트: ${key}`);
        // 메모리 캐시에도 저장 (기본 TTL: 5분)
        this.setCache(key, storageCache, 5 * 60 * 1000);
        return storageCache;
      }

      return null;
    } catch (error) {
      logger.error('캐시 조회 실패:', error);
      return null;
    }
  }

  /**
   * 캐시에 데이터 저장 (메모리 + AsyncStorage)
   */
  private async setCache(key: string, data: any, ttl: number): Promise<void> {
    try {
      // 1. 메모리 캐시에 저장
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      });

      // 2. AsyncStorage에도 저장 (긴 TTL)
      await this.saveStatisticsToStorage(key, data);
      
      logger.debug(`캐시 저장 완료: ${key}`);
    } catch (error) {
      logger.error('캐시 저장 실패:', error);
    }
  }

  /**
   * 캐시 초기화
   */
  public clearCache(): void {
    this.cache.clear();
    logger.debug('통계 캐시 초기화됨');
  }

  /**
   * 오프라인 모드에서 사용할 기본 통계 생성
   */
  public generateOfflineStatistics(todos: Todo[]): StatisticsSummary {
    try {
      // 캐시 없이 직접 계산 (동기 방식)
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const todayEnd = todayStart + 24 * 60 * 60 * 1000;

      // 간단한 오늘 통계
      const dueTodayTasks = todos.filter(todo => 
        todo.dueDate && todo.dueDate >= todayStart && todo.dueDate < todayEnd
      );
      const dueTodayCompleted = dueTodayTasks.filter(todo => todo.completed);

      const basicStatistics: StatisticsSummary = {
        today: {
          total: dueTodayTasks.length,
          completed: dueTodayCompleted.length,
          due: dueTodayTasks.length,
          dueCompleted: dueTodayCompleted.length,
          overdue: todos.filter(todo => 
            todo.dueDate && todo.dueDate < todayStart && !todo.completed
          ).length,
          completionRate: dueTodayTasks.length > 0 ? 
            (dueTodayCompleted.length / dueTodayTasks.length) * 100 : 0
        },
        upcoming: {
          tomorrow: 0,
          thisWeek: 0,
          nextWeek: 0,
          thisMonth: 0
        },
        overdue: {
          yesterday: 0,
          lastWeek: 0,
          total: todos.filter(todo => 
            todo.dueDate && todo.dueDate < todayStart && !todo.completed
          ).length,
          items: []
        },
        trends: {
          daily: [],
          weekly: [],
          monthly: []
        },
        categories: [],
        insights: [],
        lastUpdated: new Date()
      };

      logger.debug('오프라인 통계 생성 완료');
      return basicStatistics;

    } catch (error) {
      logger.error('오프라인 통계 생성 실패:', error);
      // 최소한의 기본값 반환
      return {
        today: { total: 0, completed: 0, due: 0, dueCompleted: 0, overdue: 0, completionRate: 0 },
        upcoming: { tomorrow: 0, thisWeek: 0, nextWeek: 0, thisMonth: 0 },
        overdue: { yesterday: 0, lastWeek: 0, total: 0, items: [] },
        trends: { daily: [], weekly: [], monthly: [] },
        categories: [],
        insights: [],
        lastUpdated: new Date()
      };
    }
  }

  /**
   * AsyncStorage에 통계 저장
   */
  public async saveStatisticsToStorage(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      logger.error('StatisticsService - 저장 실패:', error);
    }
  }

  /**
   * AsyncStorage에서 통계 조회
   */
  public async getStatisticsFromStorage(key: string, maxAge: number = 60 * 60 * 1000): Promise<any | null> {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return null;

      const { data, timestamp } = JSON.parse(stored);
      
      if (Date.now() - timestamp > maxAge) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('StatisticsService - 조회 실패:', error);
      return null;
    }
  }
}

// 싱글톤 인스턴스 export
export const statisticsService = StatisticsService.getInstance();