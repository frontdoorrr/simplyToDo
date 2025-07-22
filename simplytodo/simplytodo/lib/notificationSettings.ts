import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  NotificationSettings, 
  NotificationPreset, 
  DEFAULT_NOTIFICATION_SETTINGS, 
  DEFAULT_PRESETS,
  MESSAGE_TEMPLATES,
  MessageTemplateType
} from '@/types/Notification';
import { Todo } from '@/types/Todo';
import { logger } from './logger';
import * as Notifications from 'expo-notifications';

// AsyncStorage 키 상수
const STORAGE_KEYS = {
  NOTIFICATION_SETTINGS: 'notification_settings',
  NOTIFICATION_PRESETS: 'notification_presets_cache',
  LAST_SYNC: 'notifications_last_sync',
  CUSTOM_TEMPLATES: 'custom_message_templates'
};

export class NotificationSettingsService {
  private static instance: NotificationSettingsService;
  private settings: NotificationSettings | null = null;
  private presets: NotificationPreset[] = [];

  private constructor() {}

  public static getInstance(): NotificationSettingsService {
    if (!NotificationSettingsService.instance) {
      NotificationSettingsService.instance = new NotificationSettingsService();
    }
    return NotificationSettingsService.instance;
  }

  // ========================================
  // 설정 관리 메서드
  // ========================================

  /**
   * 알림 설정 조회 (캐시된 값 또는 AsyncStorage에서 로드)
   */
  public async getSettings(): Promise<NotificationSettings> {
    if (this.settings) {
      return this.settings;
    }

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
      
      if (stored) {
        this.settings = JSON.parse(stored);
        logger.debug('알림 설정 로드 완료:', this.settings?.id);
        return this.settings!;
      } else {
        // 기본 설정으로 초기화
        return await this.createDefaultSettings();
      }
    } catch (error) {
      logger.error('알림 설정 로드 실패:', error);
      return await this.createDefaultSettings();
    }
  }

  /**
   * 알림 설정 업데이트
   */
  public async updateSettings(updates: Partial<NotificationSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      
      this.settings = {
        ...currentSettings,
        ...updates,
        updatedAt: new Date()
      };

      await this.saveToLocal();
      logger.debug('알림 설정 업데이트 완료');

      // 설정 변경에 따라 기존 알림들을 업데이트
      await this.updateExistingNotifications();
      
    } catch (error) {
      logger.error('알림 설정 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 기본값으로 설정 초기화 (부분 초기화 지원)
   */
  public async resetToDefaults(resetOptions?: {
    resetAll?: boolean;
    resetGlobalSettings?: boolean;
    resetCategorySettings?: boolean;
    resetDefaultReminders?: boolean;
    resetMessageTemplate?: boolean;
  }): Promise<NotificationSettings> {
    try {
      const currentSettings = await this.getSettings();
      const defaultSettings = await this.createDefaultSettings();

      if (!resetOptions || resetOptions.resetAll) {
        // 전체 초기화
        this.settings = defaultSettings;
      } else {
        // 부분 초기화
        const newSettings = { ...currentSettings };

        if (resetOptions.resetGlobalSettings) {
          newSettings.globalSettings = defaultSettings.globalSettings;
        }

        if (resetOptions.resetCategorySettings) {
          newSettings.categorySettings = defaultSettings.categorySettings;
        }

        if (resetOptions.resetDefaultReminders) {
          newSettings.defaultReminders = defaultSettings.defaultReminders;
        }

        if (resetOptions.resetMessageTemplate) {
          newSettings.messageTemplate = defaultSettings.messageTemplate;
        }

        newSettings.updatedAt = new Date();
        this.settings = newSettings;
      }

      await this.saveToLocal();
      
      logger.debug('알림 설정 초기화 완료', { resetOptions });
      return this.settings;
    } catch (error) {
      logger.error('알림 설정 초기화 실패:', error);
      throw error;
    }
  }

  // ========================================
  // 프리셋 관리 메서드
  // ========================================

  /**
   * 알림 프리셋 조회
   */
  public async getPresets(): Promise<NotificationPreset[]> {
    if (this.presets.length > 0) {
      return this.presets;
    }

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_PRESETS);
      
      if (stored) {
        this.presets = JSON.parse(stored);
      } else {
        this.presets = DEFAULT_PRESETS;
        await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_PRESETS, JSON.stringify(this.presets));
      }
      
      return this.presets;
    } catch (error) {
      logger.error('알림 프리셋 로드 실패:', error);
      return DEFAULT_PRESETS;
    }
  }

  /**
   * 커스텀 프리셋 생성
   */
  public async createCustomPreset(preset: Omit<NotificationPreset, 'id'>): Promise<NotificationPreset> {
    try {
      const newPreset: NotificationPreset = {
        ...preset,
        id: `preset_custom_${Date.now()}`,
        isDefault: false
      };

      this.presets = await this.getPresets();
      this.presets.push(newPreset);
      
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_PRESETS, JSON.stringify(this.presets));
      
      logger.debug('커스텀 프리셋 생성 완료:', newPreset.id);
      return newPreset;
    } catch (error) {
      logger.error('커스텀 프리셋 생성 실패:', error);
      throw error;
    }
  }

  // ========================================
  // 알림 스케줄링 메서드 (기존 함수와 연동)
  // ========================================

  /**
   * 설정에 따라 Todo에 대한 알림 예약
   */
  public async scheduleNotificationWithSettings(todo: Todo): Promise<void> {
    try {
      const settings = await this.getSettings();
      
      // 마스터 스위치가 꺼져있으면 알림 안함
      if (!settings.isEnabled || !settings.globalSettings.masterSwitch) {
        logger.debug('알림이 비활성화되어 있어 스케줄링 안함');
        return;
      }

      // 방해 금지 시간 체크
      if (this.isInQuietHours(new Date(), settings.globalSettings.quietHours)) {
        logger.debug('방해 금지 시간으로 알림 스케줄링 건너뜀');
        return;
      }

      // 카테고리별 설정 확인
      const categoryId = todo.categoryId || 'personal';
      const categorySettings = settings.categorySettings[categoryId];
      
      if (categorySettings && !categorySettings.enabled) {
        logger.debug('카테고리 알림이 비활성화되어 있음:', categoryId);
        return;
      }

      // 마감일 알림 스케줄링
      if (todo.dueDate && settings.defaultReminders.dueDateReminders.onDueDate.enabled) {
        await this.scheduleDueDateNotification(todo, settings);
      }

      logger.debug('알림 스케줄링 완료:', todo.id);
      
    } catch (error) {
      logger.error('알림 스케줄링 실패:', error);
    }
  }

  /**
   * 기존 알림들을 현재 설정에 맞게 업데이트
   */
  public async updateExistingNotifications(): Promise<void> {
    try {
      // 기존에 예약된 모든 알림을 취소하고 새로운 설정으로 다시 예약
      // 실제로는 현재 활성화된 Todo들을 가져와서 다시 스케줄링해야 함
      logger.debug('기존 알림 업데이트 - 향후 Todo 서비스와 연동 필요');
      
    } catch (error) {
      logger.error('기존 알림 업데이트 실패:', error);
    }
  }

  // ========================================
  // 테스트 및 미리보기 메서드
  // ========================================

  /**
   * 테스트 알림 발송 (개선된 버전)
   */
  public async testNotification(testType: 'basic' | 'category' | 'dueDate' | 'recurring' = 'basic', categoryId?: string): Promise<void> {
    try {
      const settings = await this.getSettings();
      
      // 테스트 시나리오별 할 일 생성
      const testTodos = {
        basic: {
          id: 'test-basic',
          text: '기본 테스트 할 일',
          categoryId: 'personal',
          dueDate: Date.now() + 60 * 60 * 1000, // 1시간 후
          importance: 1
        },
        category: {
          id: 'test-category',
          text: `${this.getCategoryName(categoryId || 'work')} 카테고리 테스트`,
          categoryId: categoryId || 'work',
          dueDate: Date.now() + 2 * 60 * 60 * 1000, // 2시간 후
          importance: 2
        },
        dueDate: {
          id: 'test-duedate',
          text: '마감일이 임박한 중요한 작업',
          categoryId: 'work',
          dueDate: Date.now() + 30 * 60 * 1000, // 30분 후
          importance: 3
        },
        recurring: {
          id: 'test-recurring',
          text: '매일 하는 습관 형성 작업',
          categoryId: 'health',
          dueDate: Date.now() + 10 * 60 * 1000, // 10분 후
          importance: 2,
          isRecurring: true
        }
      };

      const testTodo = {
        ...testTodos[testType],
        completed: false,
        createdAt: Date.now(),
        parentId: null,
        grade: 0,
        completedAt: null
      } as Todo;
      const content = await this.previewNotificationContent(testTodo);
      
      // 실제 설정 반영
      const notificationConfig = {
        content: {
          title: content.title,
          body: content.body,
          sound: this.getSoundFile(settings.globalSettings.soundProfile),
          badge: 1,
          data: {
            todoId: testTodo.id,
            testType,
            categoryId: testTodo.categoryId
          }
        },
        trigger: { seconds: 2 } as any // 2초 후 발송
      };

      // 진동 패턴 적용 (Android)
      if (settings.globalSettings.vibrationPattern !== 'none') {
        (notificationConfig.content as any).vibrationPattern = this.getVibrationPattern(settings.globalSettings.vibrationPattern);
      }

      await Notifications.scheduleNotificationAsync(notificationConfig);

      logger.debug(`${testType} 테스트 알림 발송 완료`, { testTodo: testTodo.text });
      
    } catch (error) {
      logger.error('테스트 알림 발송 실패:', error);
      throw error;
    }
  }

  /**
   * 여러 시나리오 연속 테스트
   */
  public async testAllScenarios(): Promise<void> {
    try {
      const scenarios = ['basic', 'category', 'dueDate', 'recurring'] as const;
      
      for (let i = 0; i < scenarios.length; i++) {
        const scenario = scenarios[i];
        
        // 각 테스트 사이에 5초 간격
        setTimeout(async () => {
          await this.testNotification(scenario);
        }, i * 5000);
      }

      logger.debug('모든 시나리오 테스트 알림 예약 완료');
      
    } catch (error) {
      logger.error('시나리오 테스트 실패:', error);
      throw error;
    }
  }

  /**
   * 알림 내용 미리보기
   */
  public async previewNotificationContent(todo: Todo): Promise<{title: string, body: string}> {
    try {
      const settings = await this.getSettings();
      const template = settings.messageTemplate;
      
      let message = '';
      if (template.type === 'custom' && template.customMessage) {
        message = template.customMessage;
      } else {
        message = MESSAGE_TEMPLATES[template.type];
      }

      const emoji = template.includeEmoji ? this.getCategoryEmoji(todo.categoryId) : '';
      
      return {
        title: '[SimplyToDo] 할 일 알림',
        body: `${emoji} ${message}\n"${todo.text}"`
      };
      
    } catch (error) {
      logger.error('알림 미리보기 생성 실패:', error);
      return {
        title: '[SimplyToDo] 할 일 알림',
        body: `"${todo.text}"`
      };
    }
  }

  // ========================================
  // 동기화 및 저장 메서드
  // ========================================

  /**
   * 서버와 동기화 (향후 구현)
   */
  public async syncWithServer(): Promise<void> {
    try {
      // 향후 Supabase와 연동하여 설정 동기화
      logger.debug('서버 동기화 - 향후 구현 예정');
      
    } catch (error) {
      logger.error('서버 동기화 실패:', error);
    }
  }

  /**
   * 로컬 저장
   */
  public async saveToLocal(): Promise<void> {
    try {
      if (this.settings) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.NOTIFICATION_SETTINGS, 
          JSON.stringify(this.settings)
        );
        
        await AsyncStorage.setItem(
          STORAGE_KEYS.LAST_SYNC,
          new Date().toISOString()
        );
        
        logger.debug('알림 설정 로컬 저장 완료');
      }
    } catch (error) {
      logger.error('알림 설정 로컬 저장 실패:', error);
      throw error;
    }
  }

  // ========================================
  // 헬퍼 메서드
  // ========================================

  /**
   * 기본 설정 생성
   */
  private async createDefaultSettings(): Promise<NotificationSettings> {
    const defaultSettings: NotificationSettings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      id: `settings_${Date.now()}`,
      userId: 'current_user', // 향후 실제 유저 ID로 교체
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.settings = defaultSettings;
    await this.saveToLocal();
    
    logger.debug('기본 알림 설정 생성 완료');
    return defaultSettings;
  }

  /**
   * 방해 금지 시간 확인
   */
  private isInQuietHours(date: Date, quietHours: { start: string; end: string; enabled: boolean }): boolean {
    if (!quietHours.enabled) return false;

    const currentTime = date.getHours() * 60 + date.getMinutes();
    const [startHour, startMin] = quietHours.start.split(':').map(Number);
    const [endHour, endMin] = quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // 자정을 넘나드는 경우 처리
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }

  /**
   * 마감일 알림 스케줄링
   */
  private async scheduleDueDateNotification(todo: Todo, settings: NotificationSettings): Promise<void> {
    if (!todo.dueDate) return;

    const dueDate = new Date(todo.dueDate);
    const dueDateSettings = settings.defaultReminders.dueDateReminders;
    
    // 마감 당일 알림
    if (dueDateSettings.onDueDate.enabled) {
      const [hour, minute] = dueDateSettings.onDueDate.time.split(':').map(Number);
      const notificationDate = new Date(dueDate);
      notificationDate.setHours(hour, minute, 0, 0);

      if (notificationDate > new Date()) {
        const content = await this.previewNotificationContent(todo);
        const seconds = Math.floor((notificationDate.getTime() - Date.now()) / 1000);
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: content.title,
            body: content.body,
            sound: this.getSoundFile(settings.globalSettings.soundProfile),
          },
          trigger: { seconds } as any
        });
      }
    }

    // 사전 알림들
    for (const beforeReminder of dueDateSettings.beforeDue) {
      if (beforeReminder.enabled) {
        const reminderDate = new Date(dueDate.getTime() - (beforeReminder.hours * 60 * 60 * 1000));
        
        if (reminderDate > new Date()) {
          const content = await this.previewNotificationContent(todo);
          const seconds = Math.floor((reminderDate.getTime() - Date.now()) / 1000);
          
          await Notifications.scheduleNotificationAsync({
            content: {
              title: content.title,
              body: `${content.body} (${beforeReminder.hours}시간 전 알림)`,
              sound: this.getSoundFile(settings.globalSettings.soundProfile),
            },
            trigger: { seconds } as any
          });
        }
      }
    }
  }

  /**
   * 사운드 프로필에 따른 사운드 파일 반환
   */
  private getSoundFile(soundProfile: string): boolean | string {
    switch (soundProfile) {
      case 'important':
      case 'urgent':
        return true; // 시스템 기본 소리
      case 'gentle':
        return false; // 소리 없음
      default:
        return true;
    }
  }

  /**
   * 카테고리별 이모지 반환
   */
  private getCategoryEmoji(categoryId?: string | null): string {
    const emojiMap: { [key: string]: string } = {
      work: '💼',
      personal: '🏠',
      health: '💊',
      study: '📚',
      creative: '🎨'
    };

    return emojiMap[categoryId || 'personal'] || '📋';
  }

  /**
   * 카테고리별 이름 반환
   */
  private getCategoryName(categoryId?: string | null): string {
    const nameMap: { [key: string]: string } = {
      work: '업무',
      personal: '개인',
      health: '건강',
      study: '학습',
      creative: '창작'
    };

    return nameMap[categoryId || 'personal'] || '개인';
  }

  /**
   * 진동 패턴 반환
   */
  private getVibrationPattern(pattern: string): number[] {
    const patterns: { [key: string]: number[] } = {
      short: [0, 250],
      long: [0, 500],
      pattern: [0, 250, 250, 250],
      none: []
    };

    return patterns[pattern] || patterns.short;
  }
}

// 싱글톤 인스턴스 export
export const notificationSettingsService = NotificationSettingsService.getInstance();