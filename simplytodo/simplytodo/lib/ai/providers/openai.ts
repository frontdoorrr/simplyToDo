import { BaseAIProvider } from './base';
import { AIRequest, AIResponse, AIFeature } from '../../../types/AI';

export class OpenAIProvider extends BaseAIProvider {
  readonly name = 'openai';
  readonly supportedFeatures: AIFeature[] = ['subtask_generation', 'task_analysis', 'category_suggestion', 'schedule_optimization'];

  private get apiUrl(): string {
    return this.baseUrl || 'https://api.openai.com/v1';
  }

  async generateSubtasks(request: AIRequest): Promise<AIResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const systemPrompt = this.createSystemPrompt(request);
      const url = `${this.apiUrl}/chat/completions`;

      const response = await this.makeHttpRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `메인 태스크: "${request.mainTask}"`
            }
          ],
          temperature: this.temperature,
          max_tokens: this.maxTokens,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0]?.message?.content) {
        throw new Error('Invalid response format from OpenAI');
      }

      const responseText = data.choices[0].message.content;
      const analysisResult = this.parseAIResponse(responseText);

      return {
        success: true,
        data: analysisResult,
        usage: {
          tokensUsed: data.usage?.total_tokens || 0,
          cost: this.calculateCost(data.usage?.total_tokens || 0)
        }
      };

    } catch (error) {
      console.error('OpenAI API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async suggestCategories(taskText: string): Promise<string[]> {
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const url = `${this.apiUrl}/chat/completions`;

      const response = await this.makeHttpRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: '할 일에 적합한 카테고리를 3개 이하로 추천해주세요. JSON 배열 형식으로만 응답하세요.'
            },
            {
              role: 'user',
              content: `할 일: "${taskText}"`
            }
          ],
          temperature: 0.3,
          max_tokens: 100,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.choices[0].message.content;
      
      const parsed = JSON.parse(responseText);
      return Array.isArray(parsed.categories) ? parsed.categories : [];
      
    } catch (error) {
      console.error('Category suggestion error:', error);
      return [];
    }
  }

  private calculateCost(tokens: number): number {
    // GPT-4o mini 기준 비용 계산
    const costPerToken = 0.00000015; // $0.15 per 1M tokens (input)
    return tokens * costPerToken;
  }
}