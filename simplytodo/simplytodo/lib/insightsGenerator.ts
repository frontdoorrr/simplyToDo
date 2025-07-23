import {
  StatisticsSummary,
  ProductivityInsight,
  WeeklyTrend,
  CategoryStatistics,
  TodayStatistics,
  OverdueStatistics
} from '@/types/Statistics';
import { Todo } from '@/types/Todo';
import { logger } from '@/lib/logger';

class InsightsGenerator {
  private static instance: InsightsGenerator;

  private constructor() {}

  public static getInstance(): InsightsGenerator {
    if (!InsightsGenerator.instance) {
      InsightsGenerator.instance = new InsightsGenerator();
    }
    return InsightsGenerator.instance;
  }

  /**
   * 전체 인사이트 생성
   */
  public async generateInsights(stats: StatisticsSummary, todos: Todo[]): Promise<ProductivityInsight[]> {
    try {
      const insights: ProductivityInsight[] = [];

      // 다양한 분석 실행
      insights.push(...this.analyzeCompletionPatterns(stats.trends.daily));
      insights.push(...this.analyzeTodayPerformance(stats.today));
      insights.push(...this.analyzeOverduePatterns(stats.overdue));
      insights.push(...this.analyzeCategoryPerformance(stats.categories));
      insights.push(...this.generateMotivationalInsights(stats, todos));

      // 우선순위 정렬
      const sortedInsights = insights.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      // 최대 5개만 반환
      return sortedInsights.slice(0, 5);

    } catch (error) {
      logger.error('인사이트 생성 실패:', error);
      return [];
    }
  }

  /**
   * 완료 패턴 분석
   */
  private analyzeCompletionPatterns(dailyTrends: WeeklyTrend[]): ProductivityInsight[] {
    const insights: ProductivityInsight[] = [];

    if (dailyTrends.length === 0) return insights;

    // 평균 완료율 계산
    const avgCompletionRate = dailyTrends.reduce((sum, trend) => sum + trend.completionRate, 0) / dailyTrends.length;

    // 최근 트렌드 분석 (최근 3일 vs 이전 3일)
    if (dailyTrends.length >= 6) {
      const recentAvg = dailyTrends.slice(-3).reduce((sum, trend) => sum + trend.completionRate, 0) / 3;
      const previousAvg = dailyTrends.slice(-6, -3).reduce((sum, trend) => sum + trend.completionRate, 0) / 3;
      
      if (recentAvg > previousAvg + 10) {
        insights.push({
          id: `trend_improving_${Date.now()}`,
          type: 'achievement',
          title: '생산성 향상 중! 🚀',
          message: `최근 3일간 완료율이 ${Math.round(recentAvg - previousAvg)}% 향상되었습니다. 이 페이스를 유지해보세요!`,
          actionable: false,
          priority: 'high',
          generatedAt: new Date()
        });
      } else if (recentAvg < previousAvg - 10) {
        insights.push({
          id: `trend_declining_${Date.now()}`,
          type: 'weakness',
          title: '완료율 하락 주의 ⚠️',
          message: `최근 완료율이 ${Math.round(previousAvg - recentAvg)}% 하락했습니다. 목표를 다시 점검해보세요.`,
          actionable: true,
          actionText: '목표 재설정',
          actionType: 'modal',
          priority: 'high',
          generatedAt: new Date()
        });
      }
    }

    // 일관성 분석
    const variance = this.calculateVariance(dailyTrends.map(t => t.completionRate));
    if (variance < 100) { // 낮은 분산 = 일관된 성과
      insights.push({
        id: `consistency_good_${Date.now()}`,
        type: 'strength',
        title: '꾸준한 성과! 👏',
        message: '일주일간 일관되게 좋은 완료율을 유지하고 있습니다. 안정적인 루틴이 만들어졌네요!',
        actionable: false,
        priority: 'medium',
        generatedAt: new Date()
      });
    }

    return insights;
  }

  /**
   * 오늘 성과 분석
   */
  private analyzeTodayPerformance(todayStats: TodayStatistics): ProductivityInsight[] {
    const insights: ProductivityInsight[] = [];

    if (todayStats.completionRate >= 80) {
      insights.push({
        id: `today_excellent_${Date.now()}`,
        type: 'achievement',
        title: '오늘 목표 달성! 🎯',
        message: `오늘 ${Math.round(todayStats.completionRate)}% 완료율을 기록했습니다. 훌륭한 하루였네요!`,
        actionable: false,
        priority: 'high',
        generatedAt: new Date()
      });
    } else if (todayStats.completionRate < 30 && todayStats.due > 0) {
      insights.push({
        id: `today_low_${Date.now()}`,
        type: 'suggestion',
        title: '오늘 목표 재점검 💪',
        message: `아직 ${todayStats.due - todayStats.dueCompleted}개의 할 일이 남았습니다. 중요한 것부터 처리해보세요.`,
        actionable: true,
        actionText: '우선순위 확인',
        actionType: 'navigate',
        priority: 'medium',
        generatedAt: new Date()
      });
    }

    return insights;
  }

  /**
   * 지연 패턴 분석
   */
  private analyzeOverduePatterns(overdueStats: OverdueStatistics): ProductivityInsight[] {
    const insights: ProductivityInsight[] = [];

    if (overdueStats.total === 0) {
      insights.push({
        id: `no_overdue_${Date.now()}`,
        type: 'achievement',
        title: '완벽한 시간 관리! ⏰',
        message: '지연된 항목이 하나도 없습니다. 훌륭한 시간 관리 능력이네요!',
        actionable: false,
        priority: 'medium',
        generatedAt: new Date()
      });
    } else if (overdueStats.total > 5) {
      insights.push({
        id: `many_overdue_${Date.now()}`,
        type: 'weakness',
        title: '지연 항목 정리 필요 📋',
        message: `${overdueStats.total}개의 지연된 항목이 있습니다. 마감일을 재조정하거나 우선순위를 정리해보세요.`,
        actionable: true,
        actionText: '지연 항목 정리',
        actionType: 'navigate',
        priority: 'high',
        generatedAt: new Date()
      });
    }

    return insights;
  }

  /**
   * 카테고리 성과 분석
   */
  private analyzeCategoryPerformance(categories: CategoryStatistics[]): ProductivityInsight[] {
    const insights: ProductivityInsight[] = [];

    if (categories.length === 0) return insights;

    // 가장 성과가 좋은 카테고리
    const bestCategory = categories.reduce((best, current) => 
      current.completionRate > best.completionRate ? current : best
    );

    // 가장 성과가 낮은 카테고리
    const worstCategory = categories.reduce((worst, current) => 
      current.completionRate < worst.completionRate ? current : worst
    );

    if (bestCategory.completionRate >= 80) {
      insights.push({
        id: `category_best_${Date.now()}`,
        type: 'strength',
        title: `${bestCategory.categoryName} 영역 우수! ⭐`,
        message: `${bestCategory.categoryName} 카테고리에서 ${Math.round(bestCategory.completionRate)}% 완료율을 달성했습니다.`,
        actionable: false,
        priority: 'medium',
        generatedAt: new Date()
      });
    }

    if (worstCategory.completionRate < 50 && worstCategory.totalTasks > 2) {
      insights.push({
        id: `category_worst_${Date.now()}`,
        type: 'suggestion',
        title: `${worstCategory.categoryName} 영역 개선 🔧`,
        message: `${worstCategory.categoryName} 카테고리 완료율이 ${Math.round(worstCategory.completionRate)}%입니다. 목표를 작게 나누어 보세요.`,
        actionable: true,
        actionText: '세부 계획 세우기',
        actionType: 'modal',
        priority: 'medium',
        generatedAt: new Date()
      });
    }

    return insights;
  }

  /**
   * 동기부여 인사이트 생성
   */
  private generateMotivationalInsights(stats: StatisticsSummary, todos: Todo[]): ProductivityInsight[] {
    const insights: ProductivityInsight[] = [];

    // 완료된 총 할 일 수
    const completedCount = todos.filter(todo => todo.completed).length;

    if (completedCount > 0) {
      if (completedCount >= 50) {
        insights.push({
          id: `milestone_50_${Date.now()}`,
          type: 'achievement',
          title: '생산성 마스터! 🏆',
          message: `총 ${completedCount}개의 할 일을 완료했습니다. 정말 대단한 성취입니다!`,
          actionable: false,
          priority: 'high',
          generatedAt: new Date()
        });
      } else if (completedCount >= 20) {
        insights.push({
          id: `milestone_20_${Date.now()}`,
          type: 'achievement',
          title: '꾸준한 실행력! 💪',
          message: `${completedCount}개의 할 일을 완료했습니다. 이 페이스로 계속 진행해보세요!`,
          actionable: false,
          priority: 'medium',
          generatedAt: new Date()
        });
      }
    }

    return insights;
  }

  /**
   * 분산 계산 헬퍼 함수
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  /**
   * 요일별 패턴 분석
   */
  public analyzeDayOfWeekPatterns(dailyTrends: WeeklyTrend[]): ProductivityInsight[] {
    const insights: ProductivityInsight[] = [];

    if (dailyTrends.length < 7) return insights;

    // 요일별 평균 완료율 계산
    const dayOfWeekStats = new Map<number, number[]>();
    
    dailyTrends.forEach(trend => {
      const dayOfWeek = new Date(trend.date).getDay(); // 0 = Sunday
      if (!dayOfWeekStats.has(dayOfWeek)) {
        dayOfWeekStats.set(dayOfWeek, []);
      }
      dayOfWeekStats.get(dayOfWeek)!.push(trend.completionRate);
    });

    // 평균 계산 및 분석
    const dayAverages: Array<{ day: number; avg: number; name: string }> = [];
    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

    dayOfWeekStats.forEach((rates, day) => {
      const avg = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
      dayAverages.push({ day, avg, name: dayNames[day] });
    });

    // 최고/최저 요일 찾기
    if (dayAverages.length > 0) {
      const bestDay = dayAverages.reduce((best, current) => 
        current.avg > best.avg ? current : best
      );
      
      const worstDay = dayAverages.reduce((worst, current) => 
        current.avg < worst.avg ? current : worst
      );

      if (bestDay.avg - worstDay.avg > 20) {
        insights.push({
          id: `day_pattern_${Date.now()}`,
          type: 'suggestion',
          title: '요일별 패턴 발견! 📅',
          message: `${bestDay.name}에 가장 생산적이고, ${worstDay.name}에 다소 부진합니다. 중요한 일은 ${bestDay.name}에 배치해보세요.`,
          actionable: true,
          actionText: '일정 최적화',
          actionType: 'modal',
          priority: 'medium',
          generatedAt: new Date()
        });
      }
    }

    return insights;
  }
}

// 싱글톤 인스턴스 export
export const insightsGenerator = InsightsGenerator.getInstance();