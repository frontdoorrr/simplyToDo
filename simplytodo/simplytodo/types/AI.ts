// AI 서비스 추상화를 위한 타입 정의

export interface AIGeneratedSubtask {
  text: string;
  importance?: number;
  estimatedDuration?: string;
  suggestedOrder?: number;
  isRecurring?: boolean;
  recurrenceType?: 'daily' | 'weekly' | 'monthly' | 'custom';
  recurrenceInterval?: number;
  recurrenceDays?: number[];
}

export interface AITaskAnalysis {
  mainTask: string;
  suggestedSubtasks: AIGeneratedSubtask[];
  suggestedImportance?: number;
  suggestedCategory?: string;
  estimatedTotalTime?: string;
  complexity?: 'low' | 'medium' | 'high';
  hasRecurringTasks?: boolean;
  suggestedSchedule?: string;
}

export interface AIRequest {
  mainTask: string;
  context?: {
    categoryId?: string | null;
    existingCategories?: string[];
    userPreferences?: {
      maxSubtasks?: number;
      preferredComplexity?: 'simple' | 'detailed';
    };
  };
}

export interface AIResponse {
  success: boolean;
  data?: AITaskAnalysis;
  error?: string;
  usage?: {
    tokensUsed?: number;
    cost?: number;
  };
}

// AI 제공자 추상화 인터페이스
export interface AIProvider {
  readonly name: string;
  readonly supportedFeatures: AIFeature[];
  
  generateSubtasks(request: AIRequest): Promise<AIResponse>;
  analyzeTask?(mainTask: string): Promise<AITaskAnalysis>;
  suggestCategories?(taskText: string): Promise<string[]>;
}

export type AIFeature = 'subtask_generation' | 'task_analysis' | 'category_suggestion' | 'schedule_optimization';

// AI 제공자별 설정
export interface AIProviderConfig {
  provider: 'gemini' | 'openai' | 'claude' | 'custom';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

// AI 서비스 메인 인터페이스
export interface AIService {
  initialize(config: AIProviderConfig): Promise<void>;
  changeProvider(config: AIProviderConfig): Promise<void>;
  generateSubtasks(request: AIRequest): Promise<AIResponse>;
  getCurrentProvider(): string;
  isReady(): boolean;
}