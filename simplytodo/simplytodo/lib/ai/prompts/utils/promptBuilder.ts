import { CategoryPrompt, PromptContext, BuiltPrompt } from '../types';
import { BASE_SYSTEM_PROMPT, RESPONSE_CONSTRAINTS } from '../base/system';
import { WORK_PROMPTS } from '../categories/work';
import { PERSONAL_PROMPTS } from '../categories/personal';
import { STUDY_PROMPTS } from '../categories/study';
import { HEALTH_PROMPTS } from '../categories/health';
import { CREATIVE_PROMPTS } from '../categories/creative';

export class PromptBuilder {
  private static readonly CATEGORY_PROMPTS: Record<string, CategoryPrompt> = {
    '50ec9810-a80b-40fb-8af4-857c7ca2dbeb': WORK_PROMPTS,     // 업무
    'd6ed3190-59ac-4f85-b437-dd8181c25a6b': PERSONAL_PROMPTS, // 개인
    'e3a82072-4518-4d3a-b53d-1b83b31a7f06': STUDY_PROMPTS,    // 공부
    'b2421946-aba8-4514-b9cd-a91b7ec404a8': HEALTH_PROMPTS,   // 건강
    '0b998f10-d570-4361-b590-7ce82ee6d392': PERSONAL_PROMPTS, // 쇼핑 (개인으로 처리)
    'creative': CREATIVE_PROMPTS // 추가 창작 카테고리
  };

  /**
   * 카테고리 ID에 따른 맞춤형 프롬프트 생성
   */
  static buildPrompt(mainTask: string, context?: PromptContext): BuiltPrompt {
    const categoryId = context?.categoryId || 'personal';
    const categoryPrompt = this.getCategoryPrompt(categoryId);
    
    const systemPrompt = this.createSystemPrompt(categoryPrompt, context);
    const userPrompt = this.createUserPrompt(mainTask, context);
    
    return {
      system: systemPrompt,
      user: userPrompt,
      examples: categoryPrompt.examples
    };
  }

  /**
   * 카테고리별 프롬프트 가져오기
   */
  private static getCategoryPrompt(categoryId: string): CategoryPrompt {
    return this.CATEGORY_PROMPTS[categoryId] || this.CATEGORY_PROMPTS['d6ed3190-59ac-4f85-b437-dd8181c25a6b']; // 기본값: 개인
  }

  /**
   * 시스템 프롬프트 생성
   */
  private static createSystemPrompt(categoryPrompt: CategoryPrompt, context?: PromptContext): string {
    const maxSubtasks = context?.userPreferences?.maxSubtasks || RESPONSE_CONSTRAINTS.maxSubtasks;
    const complexity = context?.userPreferences?.preferredComplexity || 'detailed';
    
    return `${BASE_SYSTEM_PROMPT.core}

${categoryPrompt.systemPrompt}

**분해 규칙:**
${BASE_SYSTEM_PROMPT.rules.actionBased}
${BASE_SYSTEM_PROMPT.rules.timeEstimate}
${BASE_SYSTEM_PROMPT.rules.clarity}
${BASE_SYSTEM_PROMPT.rules.specificity}

**추가 규칙:**
${categoryPrompt.specialRules?.map(rule => `- ${rule}`).join('\n') || ''}

**분해 제약:**
- 최대 ${maxSubtasks}개의 서브태스크로 분해
- 각 서브태스크는 ${RESPONSE_CONSTRAINTS.minTextLength}-${RESPONSE_CONSTRAINTS.maxTextLength}자 이내
- 복잡도: ${complexity}
- 중요도는 1-5 스케일 (5가 가장 중요)

**좋은 예시:**
${BASE_SYSTEM_PROMPT.examples.good.map(example => `- ${example}`).join('\n')}

**나쁜 예시:**
${BASE_SYSTEM_PROMPT.examples.bad.map(example => `- ${example}`).join('\n')}

**카테고리별 예시:**
${categoryPrompt.examples.map(example => 
  `메인 태스크: "${example.input}"\n서브태스크: ${example.output.map(task => `"${task}"`).join(', ')}`
).join('\n\n')}

**운동/건강 태스크 특별 지침:**
- 운동 동작은 반드시 세트와 횟수를 포함하세요 (예: "푸쉬업 10개씩 3세트")
- 근력 운동은 주 3회 (월,수,금) 반복으로 설정
- 유산소/스트레칭은 매일 반복으로 설정
- 각 운동마다 isRecurring: true, recurrenceType: "weekly", recurrenceDays: [1,3,5] 설정

${BASE_SYSTEM_PROMPT.format}`;
  }

  /**
   * 사용자 프롬프트 생성
   */
  private static createUserPrompt(mainTask: string, context?: PromptContext): string {
    const timeConstraint = context?.userPreferences?.timeConstraints 
      ? `\n시간 제약: ${context.userPreferences.timeConstraints}` 
      : '';
    
    return `메인 태스크: "${mainTask}"${timeConstraint}

위 메인 태스크를 분석하여 실행 가능한 서브태스크들로 분해해주세요.`;
  }

  /**
   * 카테고리별 키워드 매칭을 통한 자동 카테고리 추천
   */
  static suggestCategory(mainTask: string): string {
    const taskLower = mainTask.toLowerCase();
    
    for (const [categoryId, prompt] of Object.entries(this.CATEGORY_PROMPTS)) {
      const matchingKeywords = prompt.keywords.filter(keyword => 
        taskLower.includes(keyword.toLowerCase())
      );
      
      if (matchingKeywords.length > 0) {
        return categoryId;
      }
    }
    
    return 'd6ed3190-59ac-4f85-b437-dd8181c25a6b'; // 기본값: 개인
  }

  /**
   * 사용 가능한 카테고리 목록 반환
   */
  static getAvailableCategories(): Array<{id: string, name: string, focusAreas: string[]}> {
    return Object.entries(this.CATEGORY_PROMPTS).map(([id, prompt]) => ({
      id,
      name: this.getCategoryName(id),
      focusAreas: prompt.focusAreas
    }));
  }

  private static getCategoryName(categoryId: string): string {
    const categoryNames: Record<string, string> = {
      '50ec9810-a80b-40fb-8af4-857c7ca2dbeb': '업무',
      'd6ed3190-59ac-4f85-b437-dd8181c25a6b': '개인',
      'e3a82072-4518-4d3a-b53d-1b83b31a7f06': '공부',
      'b2421946-aba8-4514-b9cd-a91b7ec404a8': '건강',
      '0b998f10-d570-4361-b590-7ce82ee6d392': '쇼핑',
      'creative': '창작'
    };
    
    return categoryNames[categoryId] || '개인';
  }
}