import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationSettings } from '@/types/Notification';
import { notificationSettingsService } from '@/lib/notificationSettings';

interface NotificationPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  settings: NotificationSettings;
}

interface PreviewNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  category: string;
  categoryColor: string;
  importance: number;
  scenario: string;
}

export const NotificationPreviewModal: React.FC<NotificationPreviewModalProps> = ({
  visible,
  onClose,
  settings
}) => {
  const [previewNotifications, setPreviewNotifications] = useState<PreviewNotification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      generatePreviews();
    }
  }, [visible, settings]);

  const generatePreviews = async () => {
    setLoading(true);
    try {
      const previews: PreviewNotification[] = [];

      // 다양한 시나리오 생성
      const scenarios = [
        {
          todo: {
            id: 'preview-1',
            text: '프로젝트 보고서 완성하기',
            categoryId: 'work',
            dueDate: Date.now() + 2 * 60 * 60 * 1000, // 2시간 후
            importance: 3,
            completed: false,
            createdAt: Date.now(),
            parentId: null,
            grade: 0,
            completedAt: null
          },
          scenario: '중요한 업무 - 마감 2시간 전'
        },
        {
          todo: {
            id: 'preview-2',
            text: '운동하기',
            categoryId: 'health',
            dueDate: Date.now() + 24 * 60 * 60 * 1000, // 내일
            importance: 2,
            completed: false,
            createdAt: Date.now(),
            parentId: null,
            grade: 0,
            completedAt: null
          },
          scenario: '건강 관리 - 하루 전 알림'
        },
        {
          todo: {
            id: 'preview-3',
            text: '영어 공부 30분',
            categoryId: 'study',
            dueDate: Date.now() + 60 * 60 * 1000, // 1시간 후
            importance: 2,
            completed: false,
            createdAt: Date.now(),
            parentId: null,
            grade: 0,
            completedAt: null
          },
          scenario: '학습 - 반복 작업'
        },
        {
          todo: {
            id: 'preview-4',
            text: '친구와 저녁 약속',
            categoryId: 'personal',
            dueDate: Date.now() + 4 * 60 * 60 * 1000, // 4시간 후
            importance: 1,
            completed: false,
            createdAt: Date.now(),
            parentId: null,
            grade: 0,
            completedAt: null
          },
          scenario: '개인 일정 - 당일 알림'
        }
      ];

      for (const { todo, scenario } of scenarios) {
        try {
          const content = await notificationSettingsService.previewNotificationContent(todo);
          
          const preview: PreviewNotification = {
            id: todo.id,
            title: content.title,
            body: content.body,
            time: formatTimeFromNow(todo.dueDate),
            category: getCategoryName(todo.categoryId),
            categoryColor: getCategoryColor(todo.categoryId),
            importance: todo.importance,
            scenario
          };

          previews.push(preview);
        } catch (error) {
          console.warn('Preview generation failed for todo:', todo.id, error);
        }
      }

      setPreviewNotifications(previews);
    } catch (error) {
      console.error('Failed to generate previews:', error);
      Alert.alert('오류', '미리보기를 생성할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId: string): string => {
    const names: { [key: string]: string } = {
      work: '업무',
      personal: '개인',
      health: '건강',
      study: '학습',
      creative: '창작'
    };
    return names[categoryId] || '개인';
  };

  const getCategoryColor = (categoryId: string): string => {
    const colors: { [key: string]: string } = {
      work: '#2196F3',
      personal: '#4CAF50',
      health: '#FF5722',
      study: '#9C27B0',
      creative: '#FF9800'
    };
    return colors[categoryId] || '#4CAF50';
  };

  const formatTimeFromNow = (timestamp: number): string => {
    const diffMs = timestamp - Date.now();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      return `${diffMinutes}분 후`;
    } else if (diffHours < 24) {
      return `${diffHours}시간 후`;
    } else {
      const diffDays = Math.round(diffHours / 24);
      return `${diffDays}일 후`;
    }
  };

  const getImportanceIcon = (importance: number): string => {
    switch (importance) {
      case 3: return 'warning';
      case 2: return 'information-circle';
      default: return 'checkmark-circle';
    }
  };

  const getImportanceColor = (importance: number): string => {
    switch (importance) {
      case 3: return '#FF5722';
      case 2: return '#FF9800';
      default: return '#4CAF50';
    }
  };

  const handleSendPreview = async (preview: PreviewNotification) => {
    try {
      // 선택한 미리보기를 실제 테스트 알림으로 발송
      const testTodo = {
        id: preview.id,
        text: preview.body.split('"')[1] || 'Test',
        categoryId: Object.keys({
          work: '업무',
          personal: '개인',
          health: '건강',
          study: '학습',
          creative: '창작'
        }).find(key => getCategoryName(key) === preview.category) || 'personal',
        dueDate: Date.now() + 60 * 1000,
        importance: preview.importance,
        completed: false,
        createdAt: Date.now(),
        parentId: null,
        grade: 0,
        completedAt: null
      };

      await notificationSettingsService.testNotification('basic');
      Alert.alert('테스트 발송', '선택한 알림이 2초 후 발송됩니다.');
    } catch (error) {
      console.error('Preview test failed:', error);
      Alert.alert('오류', '테스트 알림을 발송할 수 없습니다.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>닫기</Text>
          </TouchableOpacity>
          <Text style={styles.title}>알림 미리보기</Text>
          <TouchableOpacity onPress={generatePreviews}>
            <Ionicons name="refresh" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>

        {/* Settings Summary */}
        <View style={styles.settingsSummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>메시지 스타일:</Text>
            <Text style={styles.summaryValue}>
              {settings.messageTemplate.type === 'motivational' ? '동기부여형' :
               settings.messageTemplate.type === 'formal' ? '정중형' :
               settings.messageTemplate.type === 'simple' ? '간단형' : '사용자 정의'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>이모지 사용:</Text>
            <Text style={styles.summaryValue}>
              {settings.messageTemplate.includeEmoji ? '사용' : '미사용'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>알림 톤:</Text>
            <Text style={styles.summaryValue}>
              {settings.globalSettings.soundProfile === 'default' ? '기본' :
               settings.globalSettings.soundProfile === 'important' ? '중요' :
               settings.globalSettings.soundProfile === 'urgent' ? '긴급' : '부드러운'}
            </Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>미리보기 생성 중...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>다양한 시나리오별 알림 예시</Text>
              {previewNotifications.map((preview, index) => (
                <View key={preview.id} style={styles.previewCard}>
                  <View style={styles.previewHeader}>
                    <View style={styles.previewMeta}>
                      <View style={[styles.categoryDot, { backgroundColor: preview.categoryColor }]} />
                      <Text style={styles.categoryText}>{preview.category}</Text>
                      <Text style={styles.timeText}>{preview.time}</Text>
                    </View>
                    <View style={styles.importanceContainer}>
                      <Ionicons 
                        name={getImportanceIcon(preview.importance)} 
                        size={16} 
                        color={getImportanceColor(preview.importance)} 
                      />
                      <Text style={[styles.importanceText, { color: getImportanceColor(preview.importance) }]}>
                        {preview.importance === 3 ? '높음' : preview.importance === 2 ? '보통' : '낮음'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.notificationPreview}>
                    <Text style={styles.previewTitle}>{preview.title}</Text>
                    <Text style={styles.previewBody}>{preview.body}</Text>
                  </View>

                  <View style={styles.previewFooter}>
                    <Text style={styles.scenarioText}>{preview.scenario}</Text>
                    <TouchableOpacity
                      style={styles.testButton}
                      onPress={() => handleSendPreview(preview)}
                    >
                      <Ionicons name="send" size={16} color="#4CAF50" />
                      <Text style={styles.testButtonText}>테스트</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {previewNotifications.length === 0 && !loading && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="notifications-off" size={48} color="#CCC" />
                  <Text style={styles.emptyText}>미리보기를 생성할 수 없습니다</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={generatePreviews}>
                    <Text style={styles.retryButtonText}>다시 시도</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Info Section */}
              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>💡 미리보기 정보</Text>
                <Text style={styles.infoText}>
                  • 실제 알림은 설정된 시간에 맞춰 발송됩니다{'\n'}
                  • 방해 금지 시간에는 알림이 차단될 수 있습니다{'\n'}
                  • 카테고리별 설정에 따라 알림 시간이 조정됩니다{'\n'}
                  • 테스트 버튼을 눌러 실제 알림을 확인해보세요
                </Text>
              </View>

              {/* Bottom Spacing */}
              <View style={{ height: 50 }} />
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  settingsSummary: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    margin: 20,
    marginBottom: 16,
  },
  previewCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    marginRight: 12,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  importanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  importanceText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  notificationPreview: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  previewBody: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scenarioText: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    flex: 1,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F1F8E9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  testButtonText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  infoSection: {
    margin: 20,
    padding: 16,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD54F',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57F17',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#F57F17',
    lineHeight: 16,
  },
});