// 메인 프롬프트 관리 진입점
export { PromptBuilder } from './utils/promptBuilder';
export { BASE_SYSTEM_PROMPT, RESPONSE_CONSTRAINTS } from './base/system';
export { WORK_PROMPTS } from './categories/work';
export { PERSONAL_PROMPTS } from './categories/personal';
export { STUDY_PROMPTS } from './categories/study';
export { HEALTH_PROMPTS } from './categories/health';
export { CREATIVE_PROMPTS } from './categories/creative';
export type { CategoryPrompt, PromptContext, BuiltPrompt, PromptExample } from './types';

// 프롬프트 관리 클래스
export class PromptManager {
  /**
   * 카테고리 ID와 메인 태스크로 맞춤형 프롬프트 생성
   */
  static createPrompt(mainTask: string, categoryId?: string, userPreferences?: any) {
    return PromptBuilder.buildPrompt(mainTask, {
      categoryId,
      userPreferences
    });
  }

  /**
   * 태스크 내용 분석하여 적절한 카테고리 추천
   */
  static recommendCategory(mainTask: string) {
    return PromptBuilder.suggestCategory(mainTask);
  }

  /**
   * 사용 가능한 카테고리 목록 반환
   */
  static getCategories() {
    return PromptBuilder.getAvailableCategories();
  }
}

// 편의를 위한 기본 내보내기
export default PromptManager;