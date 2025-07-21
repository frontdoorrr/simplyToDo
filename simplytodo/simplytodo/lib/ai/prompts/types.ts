export interface PromptExample {
  input: string;
  output: string[];
  importance?: number;
  estimatedDuration?: string;
}

export interface CategoryPrompt {
  systemPrompt: string;
  examples: PromptExample[];
  keywords: string[];
  specialRules?: string[];
  focusAreas: string[];
}

export interface PromptContext {
  userPreferences?: {
    maxSubtasks?: number;
    preferredComplexity?: 'simple' | 'detailed' | 'comprehensive';
    timeConstraints?: string;
  };
  categoryId?: string;
  mainTask?: string;
}

export interface BuiltPrompt {
  system: string;
  user: string;
  examples: PromptExample[];
}