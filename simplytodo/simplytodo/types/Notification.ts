// 알림 설정 타입 정의

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';
export type NotificationCategory = 'general' | 'ai' | 'network' | 'db' | 'auth' | 'ui' | 'performance';

export type SoundProfile = 'default' | 'important' | 'urgent' | 'gentle';
export type VibrationPattern = 'short' | 'long' | 'pattern' | 'none';
export type MessageTemplateType = 'motivational' | 'formal' | 'simple' | 'custom';

export interface QuietHours {
  start: string; // "22:00" 형식
  end: string;   // "07:00" 형식
  enabled: boolean;
}

export interface GlobalNotificationSettings {
  masterSwitch: boolean;
  quietHours: QuietHours;
  soundProfile: SoundProfile;
  vibrationPattern: VibrationPattern;
}

export interface DueDateReminders {
  onDueDate: { 
    enabled: boolean; 
    time: string; // "09:00" 형식
  };
  beforeDue: Array<{ 
    enabled: boolean; 
    hours: number; // 1, 3, 24 등
  }>;
}

export interface RecurringReminders {
  enabled: boolean;
  maxDaily: number;
  startTimeReminder: boolean;
  incompleteReminder: boolean;
}

export interface DefaultReminders {
  dueDateReminders: DueDateReminders;
  recurringReminders: RecurringReminders;
  importanceBased: {
    enabled: boolean;
    highImportanceEarly: boolean; // 중요도 높은 작업은 더 일찍 알림
  };
}

export interface CategorySchedule {
  enabled: boolean;
  allowedHours: string[]; // ["09:00", "18:00"] 형태
  allowedDays: number[];  // [1,2,3,4,5] = 월-금
  customMessage?: string;
}

export interface CategorySettings {
  [categoryId: string]: CategorySchedule;
}

export interface MessageTemplate {
  type: MessageTemplateType;
  customMessage?: string;
  includeEmoji?: boolean;
  includeDueTime?: boolean;
  includeCategory?: boolean;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  isEnabled: boolean;
  globalSettings: GlobalNotificationSettings;
  categorySettings: CategorySettings;
  defaultReminders: DefaultReminders;
  messageTemplate: MessageTemplate;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreset {
  id: string;
  name: string;
  type: 'dueDate' | 'recurring' | 'custom';
  timingOptions: {
    beforeMinutes: number[];  // [60, 1440] (1시간 전, 1일 전)
    defaultTime: string;      // "09:00"
  };
  messageTemplate: MessageTemplate;
  isDefault: boolean;
}

// 기본값 정의
export const DEFAULT_NOTIFICATION_SETTINGS: Omit<NotificationSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  isEnabled: true,
  globalSettings: {
    masterSwitch: true,
    quietHours: {
      start: "22:00",
      end: "07:00", 
      enabled: true
    },
    soundProfile: 'default',
    vibrationPattern: 'short'
  },
  categorySettings: {
    // 기본 카테고리별 설정 - 실제 카테고리 ID는 런타임에 설정
    work: {
      enabled: true,
      allowedHours: ["09:00", "18:00"],
      allowedDays: [1, 2, 3, 4, 5], // 월-금
    },
    personal: {
      enabled: true,
      allowedHours: ["07:00", "22:00"],
      allowedDays: [1, 2, 3, 4, 5, 6, 7], // 매일
    },
    health: {
      enabled: true,
      allowedHours: ["07:00", "18:00"],
      allowedDays: [1, 2, 3, 4, 5, 6, 7], // 매일
    },
    study: {
      enabled: true,
      allowedHours: ["10:00", "14:00", "20:00"],
      allowedDays: [1, 2, 3, 4, 5, 6, 7], // 매일
    }
  },
  defaultReminders: {
    dueDateReminders: {
      onDueDate: {
        enabled: true,
        time: "09:00"
      },
      beforeDue: [
        { enabled: true, hours: 24 },   // 1일 전
        { enabled: false, hours: 3 },   // 3시간 전
        { enabled: false, hours: 1 },   // 1시간 전
      ]
    },
    recurringReminders: {
      enabled: true,
      maxDaily: 3,
      startTimeReminder: true,
      incompleteReminder: true
    },
    importanceBased: {
      enabled: false,
      highImportanceEarly: true
    }
  },
  messageTemplate: {
    type: 'motivational',
    includeEmoji: true,
    includeDueTime: false,
    includeCategory: false
  }
};

export const MESSAGE_TEMPLATES = {
  motivational: "🎯 목표 달성을 위한 한 걸음!",
  formal: "📋 확인해주세요",
  simple: "할 일 알림",
  custom: "" // 사용자 정의 메시지
};

export const DEFAULT_PRESETS: NotificationPreset[] = [
  {
    id: 'preset_duedate_standard',
    name: '기본 마감일 알림',
    type: 'dueDate',
    timingOptions: {
      beforeMinutes: [1440, 60], // 1일 전, 1시간 전
      defaultTime: "09:00"
    },
    messageTemplate: {
      type: 'motivational',
      includeEmoji: true,
      includeDueTime: false,
      includeCategory: false
    },
    isDefault: true
  },
  {
    id: 'preset_recurring_gentle',
    name: '부드러운 반복 알림',
    type: 'recurring',
    timingOptions: {
      beforeMinutes: [0], // 정시 알림
      defaultTime: "09:00"
    },
    messageTemplate: {
      type: 'formal',
      includeEmoji: false,
      includeDueTime: true,
      includeCategory: false
    },
    isDefault: true
  }
];