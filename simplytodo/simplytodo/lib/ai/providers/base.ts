import { AIProvider, AIRequest, AIResponse, AITaskAnalysis, AIFeature } from '../../../types/AI';
import { logger } from '@/lib/logger';

// 모든 AI 제공자가 상속받을 추상 클래스
export abstract class BaseAIProvider implements AIProvider {
  abstract readonly name: string;
  abstract readonly supportedFeatures: AIFeature[];
  
  protected apiKey?: string;
  protected model: string;
  protected baseUrl?: string;
  protected maxTokens: number;
  protected temperature: number;
  protected timeout: number;

  constructor(config: {
    apiKey?: string;
    model: string;
    baseUrl?: string;
    maxTokens?: number;
    temperature?: number;
    timeout?: number;
  }) {
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.baseUrl = config.baseUrl;
    this.maxTokens = config.maxTokens || 1000;
    this.temperature = config.temperature || 0.7;
    this.timeout = config.timeout || 60000; // 60초로 증가
  }

  // 모든 제공자가 구현해야 하는 메서드
  abstract generateSubtasks(request: AIRequest): Promise<AIResponse>;

  // 선택적 구현 메서드들
  async analyzeTask?(mainTask: string): Promise<AITaskAnalysis> {
    throw new Error(`analyzeTask not implemented by ${this.name}`);
  }

  async suggestCategories?(taskText: string): Promise<string[]> {
    throw new Error(`suggestCategories not implemented by ${this.name}`);
  }

  // 공통 유틸리티 메서드들
  protected createSystemPrompt(request: AIRequest): string {
    const { mainTask, context } = request;
    
    try {
      // 동적 import로 순환 참조 방지
      const { PromptBuilder } = require('../prompts/utils/promptBuilder');
      
      const builtPrompt = PromptBuilder.buildPrompt(mainTask, {
        categoryId: context?.categoryId,
        userPreferences: context?.userPreferences
      });
      
      return builtPrompt.system;
    } catch (error) {
      logger.ai('PromptBuilder loading error:', error);
      // 폴백으로 기본 프롬프트 사용
      return this.getFallbackPrompt(request);
    }
  }

  private getFallbackPrompt(request: AIRequest): string {
    const { mainTask, context } = request;
    const maxSubtasks = context?.userPreferences?.maxSubtasks || 5;
    const complexity = context?.userPreferences?.preferredComplexity || 'detailed';
    
    return `당신은 할 일 관리 전문가입니다. 주어진 메인 태스크를 실행 가능한 세부 서브태스크들로 나누어 주세요.

핵심 원칙:
- 각 서브태스크는 하나의 구체적인 행동이어야 합니다
- 각 작업은 15-60분 내에 완료 가능해야 합니다
- 명확하고 실행 가능한 동사로 시작해야 합니다
- 최대 ${maxSubtasks}개의 서브태스크로 분해
- 복잡도: ${complexity}

메인 태스크: "${mainTask}"

응답 형식:
{
  "suggestedSubtasks": [
    {
      "text": "구체적인 행동 설명",
      "importance": 3,
      "estimatedDuration": "30분"
    }
  ],
  "suggestedImportance": 3
}`;
  }

  protected parseAIResponse(responseText: string): AITaskAnalysis {
    try {
      logger.debug('Raw AI response:', responseText);
      
      // JSON 추출 (마크다운 코드 블록 제거)
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || 
                       responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        logger.error('No JSON found in response:', responseText);
        throw new Error('No JSON found in response');
      }

      const jsonString = jsonMatch[1] || jsonMatch[0];
      logger.debug('Extracted JSON string:', jsonString);
      
      const parsed = JSON.parse(jsonString);
      logger.debug('Parsed JSON:', parsed);
      
      // 응답 검증 및 정규화
      return this.validateAndNormalizeResponse(parsed);
    } catch (error) {
      logger.error('Parse error:', error);
      logger.error('Original response:', responseText);
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateAndNormalizeResponse(data: any): AITaskAnalysis {
    if (!Array.isArray(data.suggestedSubtasks)) {
      throw new Error('Invalid response format: suggestedSubtasks must be an array');
    }

    return {
      mainTask: data.mainTask || '', // mainTask는 선택적으로 처리
      suggestedSubtasks: data.suggestedSubtasks.map((subtask: any, index: number) => ({
        text: subtask.text || `SubTask ${index + 1}`,
        importance: Math.min(Math.max(subtask.importance || 3, 1), 5),
        estimatedDuration: subtask.estimatedDuration || '미정',
        suggestedOrder: subtask.suggestedOrder || index + 1,
        isRecurring: subtask.isRecurring || false,
        recurrenceType: subtask.recurrenceType || undefined,
        recurrenceInterval: subtask.recurrenceInterval || undefined,
        recurrenceDays: subtask.recurrenceDays || undefined
      })),
      suggestedImportance: Math.min(Math.max(data.suggestedImportance || 3, 1), 5),
      suggestedCategory: data.suggestedCategory || undefined,
      estimatedTotalTime: data.estimatedTotalTime || '미정',
      complexity: ['low', 'medium', 'high'].includes(data.complexity) ? data.complexity : 'medium',
      hasRecurringTasks: data.hasRecurringTasks || false,
      suggestedSchedule: data.suggestedSchedule || undefined
    };
  }

  protected async makeHttpRequest(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // 에러 타입별 구체적인 메시지 제공
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`AI 서버 응답 시간 초과 (${this.timeout/1000}초). 잠시 후 다시 시도해주세요.`);
        }
        if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
          throw new Error('AI 서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
        }
        if (error.message.includes('TypeError')) {
          throw new Error('AI 서버 연결 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }
      }
      
      throw error;
    }
  }
}