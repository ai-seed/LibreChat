import Anthropic from '@anthropic-ai/sdk';
import type * as a from '@anthropic-ai/sdk';
import { parseParamFromPrompt, genTranslationPrompt } from '~/app/clients/prompts/titlePrompts';

/**
 * Get the initialized Anthropic client.
 * @returns {Anthropic} The Anthropic client instance.
 */
export function getClient() {
  // 硬编码的API配置
  const HARDCODED_API_KEY = 'ak_e8244e228c99c0cd1486c8a5b615837d51c550c4eb385d847ad40904b394811c';
  const HARDCODED_BASE_URL = 'https://api-dev.718ai.cn/v1';

  /** @type {Anthropic.default.RequestOptions} */
  const options = {
    apiKey: HARDCODED_API_KEY,
    baseURL: HARDCODED_BASE_URL,
    defaultHeaders: {
      'anthropic-beta': 'prompt-caching-2024-07-31',
    },
  };

  return new Anthropic(options);
}

/**
 * This function capitlizes on [Anthropic's function calling training](https://docs.anthropic.com/claude/docs/functions-external-tools).
 *
 * @param {Object} params - The parameters for the generation.
 * @param {string} params.key
 * @param {string} params.baselineTranslation
 * @param {string} params.translationPrompt
 * @param {Array<{ pageContent: string }>} params.context
 *
 * @returns {Promise<string | 'New Chat'>} A promise that resolves to the generated conversation title.
 *                            In case of failure, it will return the default title, "New Chat".
 */
export async function translateKeyPhrase({ key, baselineTranslation, translationPrompt, context }) {
  let translation: string | undefined;
  const model = 'claude-3-5-sonnet-20241022';
  const prompt = genTranslationPrompt(translationPrompt);
  const system = prompt;

  const translateCompletion = async () => {
    const text = `Current key: \`${key}\`

    Baseline translation: ${baselineTranslation}
    
    Please generate a translation for the key in the target language as described by the function.
    
    Similar key and phrases: ${context.map((c) => c.pageContent).join(', ')}
    
    Remember to invoke the tool with proper tool invocation; e.g.:
    
    <invoke>\n<tool_name>submit_translation</tool_name>\n<parameters>\n<translation>Your Translation Here</translation>\n</parameters>\n</invoke>`;

    const message: a.Anthropic.MessageParam = {
      role: 'user',
      content: [
        {
          type: 'text',
          text,
          /* @ts-ignore */
          cache_control: { type: 'ephemeral' },
        },
      ],
    };
    const requestOptions: a.Anthropic.MessageCreateParamsNonStreaming = {
      model,
      temperature: 0.3,
      max_tokens: 1024,
      system,
      stop_sequences: ['\n\nHuman:', '\n\nAssistant', '</function_calls>'],
      messages: [message],
      stream: false,
    };

    try {
      const client = getClient();
      const response = await client.messages.create(requestOptions);
      const text = response.content[0].text;
      translation = parseParamFromPrompt(text, 'translation');
    } catch (e) {
      console.error('[AnthropicClient] There was an issue generating the translation', e);
    }
  };

  await translateCompletion();
  return translation;
}
