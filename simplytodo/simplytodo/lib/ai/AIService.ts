import { AIService, AIProvider, AIProviderConfig, AIRequest, AIResponse } from '../../types/AI';
import { GeminiProvider } from './providers/gemini';
import { OpenAIProvider } from './providers/openai';

class AIServiceImpl implements AIService {
  private currentProvider: AIProvider | null = null;
  private config: AIProviderConfig | null = null;

  async initialize(config: AIProviderConfig): Promise<void> {
    this.config = config;
    await this.createProvider(config);
  }

  async changeProvider(config: AIProviderConfig): Promise<void> {
    this.config = config;
    await this.createProvider(config);
  }

  async generateSubtasks(request: AIRequest): Promise<AIResponse> {
    if (!this.currentProvider) {
      return {
        success: false,
        error: 'AI service not initialized. Please call initialize() first.'
      };
    }

    try {
      return await this.currentProvider.generateSubtasks(request);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  getCurrentProvider(): string {
    return this.currentProvider?.name || 'none';
  }

  isReady(): boolean {
    return this.currentProvider !== null;
  }

  private async createProvider(config: AIProviderConfig): Promise<void> {
    const providerConfig = {
      apiKey: config.apiKey,
      model: config.model,
      baseUrl: config.baseUrl,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      timeout: config.timeout,
    };

    switch (config.provider) {
      case 'gemini':
        this.currentProvider = new GeminiProvider(providerConfig);
        break;
      
      case 'openai':
        this.currentProvider = new OpenAIProvider(providerConfig);
        break;
      
      case 'claude':
        // Claude provider는 나중에 구현
        throw new Error('Claude provider not implemented yet');
      
      case 'custom':
        throw new Error('Custom provider not implemented yet');
      
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }

  // 편의 메서드들
  async suggestCategories(taskText: string): Promise<string[]> {
    if (!this.currentProvider || !this.currentProvider.suggestCategories) {
      return [];
    }

    try {
      return await this.currentProvider.suggestCategories(taskText);
    } catch (error) {
      console.error('Category suggestion failed:', error);
      return [];
    }
  }

  // AI 제공자 정보 조회
  getSupportedFeatures(): string[] {
    return this.currentProvider?.supportedFeatures || [];
  }

  getProviderInfo(): { name: string; model: string; features: string[] } | null {
    if (!this.currentProvider || !this.config) {
      return null;
    }

    return {
      name: this.currentProvider.name,
      model: this.config.model,
      features: this.currentProvider.supportedFeatures
    };
  }
}

// 싱글톤 인스턴스
export const aiService = new AIServiceImpl();

// 기본 설정들
export const DEFAULT_AI_CONFIGS: Record<string, AIProviderConfig> = {
  gemini: {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    maxTokens: 1000,
    temperature: 0.7,
    timeout: 30000
  },
  openai: {
    provider: 'openai',
    model: 'gpt-4o-mini',
    maxTokens: 1000,
    temperature: 0.7,
    timeout: 30000
  }
};

// 설정 헬퍼 함수들
export function createGeminiConfig(apiKey: string, overrides?: Partial<AIProviderConfig>): AIProviderConfig {
  return {
    ...DEFAULT_AI_CONFIGS.gemini,
    apiKey,
    ...overrides
  };
}

export function createOpenAIConfig(apiKey: string, overrides?: Partial<AIProviderConfig>): AIProviderConfig {
  return {
    ...DEFAULT_AI_CONFIGS.openai,
    apiKey,
    ...overrides
  };
}