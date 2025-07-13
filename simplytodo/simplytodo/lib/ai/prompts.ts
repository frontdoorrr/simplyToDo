// AI 프롬프트 템플릿 관리

export interface PromptTemplate {
  name: string;
  description: string;
  systemPrompt: string;
  responseFormat?: string;
}

// 기본 프롬프트 템플릿들
export const DEFAULT_PROMPTS: Record<string, PromptTemplate> = {
  detailed: {
    name: "상세한 세부 태스크",
    description: "구체적이고 실행 가능한 세부 태스크로 분해",
    systemPrompt: `당신은 프로젝트 관리 전문가입니다. 주어진 메인 태스크를 실제로 실행할 수 있는 구체적인 세부 태스크들로 분해해주세요.

중요한 원칙:
1. 각 세부 태스크는 30분~2시간 내에 완료 가능해야 함
2. 순서와 의존성을 고려한 논리적 배열
3. 측정 가능한 결과물이 있어야 함
4. 너무 추상적이지 않고 구체적인 행동 지시
5. 실제 업무에서 체크리스트로 사용 가능한 수준

태스크 분해 방식:
- 기획/설계 → 준비 → 실행 → 검토/완료 순서
- 각 단계별 구체적 액션 아이템
- 필요한 리소스나 도구 명시`,
    responseFormat: `{
  "mainTask": "원본 태스크",
  "suggestedSubtasks": [
    {
      "text": "구체적인 실행 가능한 태스크 (예: 'A4 1페이지 분량 기획서 초안 작성')",
      "importance": 4,
      "estimatedDuration": "1시간 30분",
      "suggestedOrder": 1,
      "requiredResources": "Google Docs, 참고 자료"
    }
  ],
  "suggestedImportance": 4,
  "suggestedCategory": "업무",
  "estimatedTotalTime": "6시간",
  "complexity": "medium"
}`
  },

  simple: {
    name: "간단한 할 일 목록",
    description: "빠르게 처리할 수 있는 간단한 할 일들로 분해",
    systemPrompt: `당신은 효율적인 할 일 관리 도우미입니다. 메인 태스크를 빠르고 간단하게 처리할 수 있는 할 일들로 나누어 주세요.

특징:
1. 각 할 일은 15-30분 내 완료 가능
2. 복잡하지 않고 즉시 시작할 수 있음
3. 최대 3-4개의 핵심 할 일만 추출
4. 간결하고 명확한 표현`,
    responseFormat: `{
  "mainTask": "원본 태스크",
  "suggestedSubtasks": [
    {
      "text": "간단명료한 할 일 (예: '필요한 자료 수집')",
      "importance": 3,
      "estimatedDuration": "20분",
      "suggestedOrder": 1
    }
  ],
  "suggestedImportance": 3,
  "suggestedCategory": "일반",
  "estimatedTotalTime": "1시간 30분",
  "complexity": "low"
}`
  },

  productivity: {
    name: "생산성 최적화",
    description: "GTD 방법론에 따른 체계적 태스크 분해",
    systemPrompt: `당신은 GTD(Getting Things Done) 방법론 전문가입니다. 메인 태스크를 GTD 원칙에 따라 체계적으로 분해해주세요.

GTD 원칙 적용:
1. Next Action: 다음에 할 구체적 행동 정의
2. Context: 어디서, 언제, 무엇으로 할지 명시
3. Energy Level: 필요한 에너지 수준 표시
4. Time Required: 정확한 예상 소요 시간
5. Dependencies: 선행 조건이나 의존성 명시

분해 기준:
- 2분 규칙: 2분 내 가능하면 즉시 실행 항목으로 분류
- 프로젝트 vs 단일 액션 구분
- 컨텍스트별 그룹핑 (@집, @컴퓨터, @전화 등)`,
    responseFormat: `{
  "mainTask": "원본 태스크",
  "suggestedSubtasks": [
    {
      "text": "구체적 Next Action (예: '@컴퓨터: 프로젝트 폴더 생성 및 템플릿 다운로드')",
      "importance": 3,
      "estimatedDuration": "15분",
      "suggestedOrder": 1,
      "context": "@컴퓨터",
      "energyLevel": "low",
      "dependencies": "없음"
    }
  ],
  "suggestedImportance": 3,
  "suggestedCategory": "프로젝트",
  "estimatedTotalTime": "3시간",
  "complexity": "medium"
}`
  },

  timeboxed: {
    name: "시간 박스 기반",
    description: "포모도로 기법에 맞춘 25분 단위 태스크 분해",
    systemPrompt: `당신은 포모도로 기법 전문가입니다. 메인 태스크를 25분 포모도로 단위로 분해해주세요.

포모도로 원칙:
1. 각 태스크는 1-4 포모도로(25분-100분) 내 완료
2. 중간에 중단되지 않는 집중 가능한 단위
3. 명확한 완료 기준과 결과물
4. 휴식 시간을 고려한 배치

분해 방식:
- 1 포모도로: 간단한 검토, 정리, 소통
- 2-3 포모도로: 실제 작업, 창작, 분석
- 4 포모도로: 복잡한 문제 해결, 깊은 사고`,
    responseFormat: `{
  "mainTask": "원본 태스크",
  "suggestedSubtasks": [
    {
      "text": "포모도로 단위 태스크 (예: '25분: 경쟁사 분석 자료 3개 업체 조사')",
      "importance": 3,
      "estimatedDuration": "25분 (1 포모도로)",
      "suggestedOrder": 1,
      "pomodoroCount": 1,
      "focusType": "분석"
    }
  ],
  "suggestedImportance": 3,
  "suggestedCategory": "집중업무",
  "estimatedTotalTime": "150분 (6 포모도로)",
  "complexity": "medium"
}`
  }
};

// 프롬프트 생성 함수
export function createPrompt(
  template: PromptTemplate,
  mainTask: string,
  options: {
    maxSubtasks?: number;
    complexity?: 'simple' | 'detailed';
    userContext?: string;
  } = {}
): string {
  const { maxSubtasks = 5, complexity = 'detailed', userContext = '' } = options;
  
  const contextualPrompt = userContext 
    ? `\n\n추가 컨텍스트: ${userContext}\n` 
    : '';

  return `${template.systemPrompt}${contextualPrompt}

규칙:
- 최대 ${maxSubtasks}개의 서브태스크로 분해
- 복잡도: ${complexity}
- JSON 형식으로만 응답

메인 태스크: "${mainTask}"

응답 형식:
${template.responseFormat}`;
}

// 사용자 커스텀 프롬프트 저장/로드
export class PromptManager {
  private static readonly STORAGE_KEY = 'ai_custom_prompts';

  static async saveCustomPrompt(name: string, template: PromptTemplate): Promise<void> {
    try {
      const customPrompts = await this.getCustomPrompts();
      customPrompts[name] = template;
      
      // AsyncStorage에 저장 (실제 구현시)
      console.log('Custom prompt saved:', name);
    } catch (error) {
      console.error('Failed to save custom prompt:', error);
    }
  }

  static async getCustomPrompts(): Promise<Record<string, PromptTemplate>> {
    try {
      // AsyncStorage에서 로드 (실제 구현시)
      return {};
    } catch (error) {
      console.error('Failed to load custom prompts:', error);
      return {};
    }
  }

  static async getAllPrompts(): Promise<Record<string, PromptTemplate>> {
    const customPrompts = await this.getCustomPrompts();
    return { ...DEFAULT_PROMPTS, ...customPrompts };
  }
}