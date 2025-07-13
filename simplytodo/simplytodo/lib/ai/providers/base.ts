import { AIProvider, AIRequest, AIResponse, AITaskAnalysis, AIFeature } from '../../../types/AI';

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
    this.timeout = config.timeout || 30000;
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
    const maxSubtasks = context?.userPreferences?.maxSubtasks || 5;
    const complexity = context?.userPreferences?.preferredComplexity || 'detailed';
    
    return `당신은 생산성 및 할 일 관리 전문가입니다. 주어진 메인 태스크를 간단하고 명확한 단일 액션으로 분해해주세요.

핵심 원칙:
1. 각 세부 태스크는 하나의 명확한 액션이어야 함 (ONE ACTION RULE)
2. 15분~1시간 내에 완료 가능한 작은 단위로 분해
3. 즉시 시작할 수 있고 완료 여부를 명확히 판단할 수 있어야 함
4. 간결하고 동사로 시작하는 명령문 형태
5. 복합적인 작업은 여러 개의 단순 액션으로 분리

좋은 예시:
- "헬스장에서 인바디 측정하기"
- "YouTube에서 홈트레이닝 영상 3개 찾기"
- "운동 계획 템플릿 다운로드하기"
- "1주차 운동 스케줄 달력에 표시하기"

나쁜 예시:
- "운동 계획 수립 및 일정표 작성하고 운동법 조사하기" (여러 액션이 혼재)
- "근력 운동 계획 수립: 목표 근육량 증가를 위한 운동 루틴 작성 및 일정표 작성" (너무 복잡)

분해 방식:
- 조사/수집 → 계획/설계 → 실행/진행 → 점검/완료
- 각 단계를 작은 액션 단위로 세분화
- 도구나 장소를 구체적으로 명시

분해 규칙:
- 최대 ${maxSubtasks}개의 단순 액션으로 분해
- 각 액션은 한 문장으로 표현
- 중요도는 1-5 스케일 (5가 가장 중요)
- 예상 소요시간을 현실적으로 책정
- 복잡도: ${complexity}
- JSON 형식으로만 응답

메인 태스크: "${mainTask}"

응답 형식:
{
  "mainTask": "${mainTask}",
  "suggestedSubtasks": [
    {
      "text": "간결한 단일 액션 (예: '헬스장 3곳 전화번호 검색하기')",
      "importance": 3,
      "estimatedDuration": "20분",
      "suggestedOrder": 1
    }
  ],
  "suggestedImportance": 3,
  "suggestedCategory": "건강",
  "estimatedTotalTime": "2시간",
  "complexity": "medium"
}`;
  }

  protected parseAIResponse(responseText: string): AITaskAnalysis {
    try {
      // JSON 추출 (마크다운 코드 블록 제거)
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || 
                       responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      
      // 응답 검증 및 정규화
      return this.validateAndNormalizeResponse(parsed);
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateAndNormalizeResponse(data: any): AITaskAnalysis {
    if (!data.mainTask || !Array.isArray(data.suggestedSubtasks)) {
      throw new Error('Invalid response format');
    }

    return {
      mainTask: data.mainTask,
      suggestedSubtasks: data.suggestedSubtasks.map((subtask: any, index: number) => ({
        text: subtask.text || `서브태스크 ${index + 1}`,
        importance: Math.min(Math.max(subtask.importance || 3, 1), 5),
        estimatedDuration: subtask.estimatedDuration || '미정',
        suggestedOrder: subtask.suggestedOrder || index + 1
      })),
      suggestedImportance: Math.min(Math.max(data.suggestedImportance || 3, 1), 5),
      suggestedCategory: data.suggestedCategory || undefined,
      estimatedTotalTime: data.estimatedTotalTime || '미정',
      complexity: ['low', 'medium', 'high'].includes(data.complexity) ? data.complexity : 'medium'
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
      throw error;
    }
  }
}