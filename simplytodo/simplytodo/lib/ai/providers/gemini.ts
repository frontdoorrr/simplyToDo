import { BaseAIProvider } from './base';
import { AIRequest, AIResponse, AIFeature } from '../../../types/AI';
import { logger } from '@/lib/logger';

export class GeminiProvider extends BaseAIProvider {
  readonly name = 'gemini';
  readonly supportedFeatures: AIFeature[] = ['subtask_generation', 'task_analysis', 'category_suggestion'];

  private get apiUrl(): string {
    return this.baseUrl || 'https://generativelanguage.googleapis.com/v1beta/models';
  }

  async generateSubtasks(request: AIRequest): Promise<AIResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const systemPrompt = this.createSystemPrompt(request);
      const url = `${this.apiUrl}/${this.model}:generateContent?key=${this.apiKey}`;

      // 새로운 프롬프트 시스템 지원을 위한 텍스트 구성
      const promptText = typeof systemPrompt === 'string' 
        ? `${systemPrompt}\n\n메인 태스크: "${request.mainTask}"`
        : `${systemPrompt}\n\n메인 태스크: "${request.mainTask}"`;

      logger.ai('Sending prompt to Gemini:', promptText);

      const response = await this.makeHttpRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: promptText
            }]
          }],
          generationConfig: {
            temperature: this.temperature,
            maxOutputTokens: this.maxTokens,
            topP: 0.8,
            topK: 40
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      logger.ai('Gemini raw response:', data);
      
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        logger.error('Invalid Gemini response structure:', data);
        throw new Error('Invalid response format from Gemini');
      }

      const responseText = data.candidates[0].content.parts[0].text;
      logger.ai('Gemini response text:', responseText);
      
      const analysisResult = this.parseAIResponse(responseText);

      return {
        success: true,
        data: analysisResult,
        usage: {
          tokensUsed: data.usageMetadata?.totalTokenCount || 0,
          cost: this.calculateCost(data.usageMetadata?.totalTokenCount || 0)
        }
      };

    } catch (error) {
      logger.error('Gemini API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async suggestCategories(taskText: string): Promise<string[]> {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const prompt = `다음 할 일에 적합한 카테고리를 3개 이하로 추천해주세요. 카테고리명만 JSON 배열로 응답하세요.

할 일: "${taskText}"

예시 응답: ["업무", "개인", "건강"]`;

      const url = `${this.apiUrl}/${this.model}:generateContent?key=${this.apiKey}`;

      const response = await this.makeHttpRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 100
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.candidates[0].content.parts[0].text;
      
      // JSON 배열 추출
      const arrayMatch = responseText.match(/\[.*\]/);
      if (arrayMatch) {
        return JSON.parse(arrayMatch[0]);
      }
      
      return [];
    } catch (error) {
      logger.ai('Category suggestion error:', error);
      return [];
    }
  }

  private calculateCost(tokens: number): number {
    // Gemini Pro 기준 대략적인 비용 계산 (실제 요금은 Google Cloud 정책에 따라 다를 수 있음)
    const costPerToken = 0.000001; // 예시 비용
    return tokens * costPerToken;
  }
}