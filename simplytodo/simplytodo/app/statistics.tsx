import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { statisticsService } from '@/lib/statisticsService';
import { StatisticsSummary } from '@/types/Statistics';
import { Todo } from '@/types/Todo';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { DonutChart, ProgressBar, MiniChart } from '@/components/charts';

export default function StatisticsScreen() {
  const router = useRouter();
  const [statistics, setStatistics] = useState<StatisticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadTodos = useCallback(async (): Promise<Todo[]> => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('할 일 목록 조회 실패:', error);
        return [];
      }

      // Supabase 데이터를 Todo 타입으로 변환
      const transformedTodos: Todo[] = (data || []).map(todo => ({
        id: todo.id,
        text: todo.text,
        completed: todo.completed,
        importance: todo.importance,
        createdAt: new Date(todo.created_at).getTime(),
        dueDate: todo.due_date ? new Date(todo.due_date).getTime() : null,
        categoryId: todo.category_id,
        parentId: todo.parent_id,
        grade: todo.grade || 0,
        completedAt: todo.completed_at ? new Date(todo.completed_at).getTime() : null
      }));

      return transformedTodos;
    } catch (error) {
      logger.error('할 일 목록 로드 실패:', error);
      return [];
    }
  }, []);

  const loadStatistics = useCallback(async () => {
    try {
      setLoading(true);
      
      // 할 일 목록 로드
      const todosData = await loadTodos();
      setTodos(todosData);

      // 통계 계산
      const stats = await statisticsService.getStatisticsSummary(todosData);
      setStatistics(stats);

      logger.debug('통계 로드 완료', { todosCount: todosData.length });
    } catch (error) {
      logger.error('통계 로드 실패:', error);
      Alert.alert('오류', '통계를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [loadTodos]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    statisticsService.clearCache(); // 캐시 초기화
    await loadStatistics();
    setRefreshing(false);
  }, [loadStatistics]);

  const formatCompletionRate = useCallback((rate: number): string => {
    return `${Math.round(rate)}%`;
  }, []);

  const getInsightColor = useCallback((type: string): string => {
    switch (type) {
      case 'achievement': return '#4CAF50';
      case 'strength': return '#2196F3';
      case 'weakness': return '#FF5722';
      case 'suggestion': return '#FF9800';
      default: return '#9E9E9E';
    }
  }, []);

  const getPriorityColor = useCallback((priority: string): string => {
    switch (priority) {
      case 'high': return '#FF5722';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  }, []);

  // 차트 데이터 메모화
  const donutChartData = useMemo(() => {
    if (!statistics) return [];
    return [
      {
        name: '완료',
        value: statistics.today.dueCompleted,
        color: '#4CAF50'
      },
      {
        name: '미완료',
        value: statistics.today.due - statistics.today.dueCompleted,
        color: '#E0E0E0'
      }
    ];
  }, [statistics?.today.dueCompleted, statistics?.today.due]);

  // 트렌드 데이터 메모화
  const trendData = useMemo(() => {
    if (!statistics?.trends.daily.length) return { data: [], labels: [], average: 0 };
    
    const data = statistics.trends.daily.map(trend => trend.completionRate);
    const labels = statistics.trends.daily.map(trend => {
      const date = new Date(trend.date);
      return ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    });
    const average = Math.round(
      statistics.trends.daily.reduce((sum, trend) => sum + trend.completionRate, 0) / 
      statistics.trends.daily.length
    );

    return { data, labels, average };
  }, [statistics?.trends.daily]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>생산성 통계</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>통계를 계산하고 있습니다...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!statistics) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>생산성 통계</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="bar-chart-outline" size={48} color="#CCC" />
          <Text style={styles.errorText}>통계를 불러올 수 없습니다</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadStatistics}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>생산성 통계</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleRefresh}>
            <Ionicons name="refresh" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* 오늘 마감 현황 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={20} color="#4CAF50" />
            <Text style={styles.sectionTitle}>오늘 마감 현황</Text>
          </View>
          
          <View style={styles.todayStatsContainer}>
            {/* 완료율 도넛 차트 */}
            <View style={styles.completionRateCard}>
              <DonutChart
                data={donutChartData}
                centerText={formatCompletionRate(statistics.today.completionRate)}
                centerSubText="완료율"
                size={60}
              />
            </View>

            {/* 상세 통계 */}
            <View style={styles.todayDetailsContainer}>
              <View style={styles.todayDetailItem}>
                <Text style={styles.todayDetailNumber}>{statistics.today.dueCompleted}</Text>
                <Text style={styles.todayDetailLabel}>완료</Text>
              </View>
              <View style={styles.todayDetailItem}>
                <Text style={styles.todayDetailNumber}>
                  {statistics.today.due - statistics.today.dueCompleted}
                </Text>
                <Text style={styles.todayDetailLabel}>남은</Text>
              </View>
              <View style={styles.todayDetailItem}>
                <Text style={[styles.todayDetailNumber, { color: '#FF5722' }]}>
                  {statistics.today.overdue}
                </Text>
                <Text style={styles.todayDetailLabel}>지연</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 예정된 마감 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>예정된 마감</Text>
          </View>
          
          <View style={styles.upcomingGrid}>
            <View style={styles.upcomingItem}>
              <Text style={styles.upcomingNumber}>{statistics.upcoming.tomorrow}</Text>
              <Text style={styles.upcomingLabel}>내일</Text>
            </View>
            <View style={styles.upcomingItem}>
              <Text style={styles.upcomingNumber}>{statistics.upcoming.thisWeek}</Text>
              <Text style={styles.upcomingLabel}>이번 주</Text>
            </View>
            <View style={styles.upcomingItem}>
              <Text style={styles.upcomingNumber}>{statistics.upcoming.nextWeek}</Text>
              <Text style={styles.upcomingLabel}>다음 주</Text>
            </View>
            <View style={styles.upcomingItem}>
              <Text style={styles.upcomingNumber}>{statistics.upcoming.thisMonth}</Text>
              <Text style={styles.upcomingLabel}>월말까지</Text>
            </View>
          </View>
        </View>

        {/* 지연된 항목 */}
        {statistics.overdue.total > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="warning-outline" size={20} color="#FF5722" />
              <Text style={styles.sectionTitle}>지연된 항목 ({statistics.overdue.total}개)</Text>
            </View>
            
            {statistics.overdue.items.slice(0, 5).map((item) => (
              <View key={item.id} style={styles.overdueItem}>
                <View style={styles.overdueItemContent}>
                  <Text style={styles.overdueItemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.overdueItemInfo}>
                    {item.categoryName} • {item.daysOverdue}일 지연
                  </Text>
                </View>
                <View style={styles.overdueItemImportance}>
                  {Array.from({ length: item.importance }).map((_, i) => (
                    <Ionicons key={i} name="star" size={12} color="#FFD700" />
                  ))}
                </View>
              </View>
            ))}

            {statistics.overdue.total > 5 && (
              <TouchableOpacity style={styles.viewMoreButton}>
                <Text style={styles.viewMoreText}>
                  {statistics.overdue.total - 5}개 더 보기
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 주간 트렌드 */}
        {trendData.data.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trending-up-outline" size={20} color="#FF9800" />
              <Text style={styles.sectionTitle}>7일간 완료율 트렌드</Text>
            </View>
            
            <View style={styles.trendContainer}>
              <MiniChart
                data={trendData.data}
                labels={trendData.labels}
                color="#FF9800"
                height={50}
                width={300}
                showValues={false}
              />
              <View style={styles.trendLegend}>
                <Text style={styles.trendLegendText}>
                  평균 완료율: {trendData.average}%
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 카테고리별 통계 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pricetag-outline" size={20} color="#9C27B0" />
            <Text style={styles.sectionTitle}>카테고리별 현황</Text>
          </View>
          
          {statistics.categories.map((category) => (
            <View key={category.categoryId} style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryInfo}>
                  <View 
                    style={[styles.categoryDot, { backgroundColor: category.color }]} 
                  />
                  <Text style={styles.categoryName}>{category.categoryName}</Text>
                </View>
                <Text style={styles.categoryRate}>
                  {formatCompletionRate(category.completionRate)}
                </Text>
              </View>
              
              <ProgressBar
                progress={category.completionRate}
                color={category.color}
                showPercentage={false}
                height={6}
              />
              
              <Text style={styles.categoryDetails}>
                완료: {category.completedTasks}개 / 전체: {category.totalTasks}개
              </Text>
            </View>
          ))}
        </View>

        {/* 인사이트 및 추천 */}
        {statistics.insights.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bulb-outline" size={20} color="#FF9800" />
              <Text style={styles.sectionTitle}>인사이트 및 추천</Text>
            </View>
            
            {statistics.insights.map((insight) => (
              <View key={insight.id} style={[
                styles.insightCard,
                { borderLeftColor: getInsightColor(insight.type) }
              ]}>
                <View style={styles.insightHeader}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <View style={[
                    styles.priorityBadge,
                    { backgroundColor: getPriorityColor(insight.priority) }
                  ]}>
                    <Text style={styles.priorityText}>{insight.priority}</Text>
                  </View>
                </View>
                
                <Text style={styles.insightMessage}>
                  {insight.message}
                </Text>
                
                {insight.actionable && insight.actionText && (
                  <TouchableOpacity style={styles.insightAction}>
                    <Text style={styles.insightActionText}>
                      {insight.actionText}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#4CAF50" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* 통계 요약 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#666" />
            <Text style={styles.sectionTitle}>요약</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              총 {todos.length}개의 할 일 중 {todos.filter(t => t.completed).length}개를 완료했습니다.
            </Text>
            {statistics.today.overdue > 0 && (
              <Text style={styles.summaryWarning}>
                ⚠️ {statistics.today.overdue}개의 항목이 지연되었습니다.
              </Text>
            )}
            <Text style={styles.summaryUpdate}>
              마지막 업데이트: {statistics.lastUpdated.toLocaleTimeString()}
            </Text>
          </View>
        </View>

        {/* 하단 여백 */}
        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerLeft: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  todayStatsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  completionRateCard: {
    flex: 1,
    alignItems: 'center',
    paddingRight: 16,
  },
  completionRateNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4CAF50',
  },
  completionRateLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  completionRateBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginTop: 8,
  },
  completionRateProgress: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  todayDetailsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  todayDetailItem: {
    alignItems: 'center',
  },
  todayDetailNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  todayDetailLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  upcomingGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  upcomingItem: {
    alignItems: 'center',
    flex: 1,
  },
  upcomingNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2196F3',
  },
  upcomingLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  overdueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    marginBottom: 8,
  },
  overdueItemContent: {
    flex: 1,
  },
  overdueItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  overdueItemInfo: {
    fontSize: 12,
    color: '#666',
  },
  overdueItemImportance: {
    flexDirection: 'row',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    marginTop: 8,
  },
  viewMoreText: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  categoryItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  categoryRate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  categoryDetails: {
    fontSize: 12,
    color: '#666',
    marginLeft: 20,
  },
  summaryCard: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  summaryWarning: {
    fontSize: 14,
    color: '#FF5722',
    lineHeight: 20,
    marginBottom: 8,
  },
  summaryUpdate: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  trendContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  trendLegend: {
    marginTop: 8,
  },
  trendLegendText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  insightMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  insightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  insightActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
  },
});