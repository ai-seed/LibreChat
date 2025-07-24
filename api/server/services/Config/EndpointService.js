const { isUserProvided } = require('@librechat/api');
const { EModelEndpoint } = require('librechat-data-provider');
const { generateConfig } = require('~/server/utils/handleText');

// 硬编码的API配置 - 所有模型使用相同的API key和base URL
const HARDCODED_API_KEY = 'ak_e8244e228c99c0cd1486c8a5b615837d51c550c4eb385d847ad40904b394811c';
const HARDCODED_BASE_URL = 'https://api-dev.718ai.cn/v1';

const {
  OPENAI_API_KEY: openAIApiKey,
  AZURE_ASSISTANTS_API_KEY: azureAssistantsApiKey,
  ASSISTANTS_API_KEY: assistantsApiKey,
  AZURE_API_KEY: azureOpenAIApiKey,
  ANTHROPIC_API_KEY: anthropicApiKey,
  CHATGPT_TOKEN: chatGPTToken,
  PLUGINS_USE_AZURE,
  GOOGLE_KEY: googleKey,
  OPENAI_REVERSE_PROXY,
  AZURE_OPENAI_BASEURL,
  ASSISTANTS_BASE_URL,
  AZURE_ASSISTANTS_BASE_URL,
} = process.env ?? {};

const useAzurePlugins = !!PLUGINS_USE_AZURE;

// 强制设置为false，不允许用户提供API key
const userProvidedOpenAI = false;

module.exports = {
  config: {
    openAIApiKey: HARDCODED_API_KEY,
    azureOpenAIApiKey: HARDCODED_API_KEY,
    useAzurePlugins,
    userProvidedOpenAI,
    googleKey: HARDCODED_API_KEY,
    [EModelEndpoint.anthropic]: generateConfig(HARDCODED_API_KEY, HARDCODED_BASE_URL),
    [EModelEndpoint.chatGPTBrowser]: generateConfig(chatGPTToken),
    [EModelEndpoint.openAI]: generateConfig(HARDCODED_API_KEY, HARDCODED_BASE_URL),
    [EModelEndpoint.azureOpenAI]: generateConfig(HARDCODED_API_KEY, HARDCODED_BASE_URL),
    [EModelEndpoint.assistants]: generateConfig(
      HARDCODED_API_KEY,
      HARDCODED_BASE_URL,
      EModelEndpoint.assistants,
    ),
    [EModelEndpoint.azureAssistants]: generateConfig(
      HARDCODED_API_KEY,
      HARDCODED_BASE_URL,
      EModelEndpoint.azureAssistants,
    ),
    [EModelEndpoint.bedrock]: generateConfig(
      process.env.BEDROCK_AWS_SECRET_ACCESS_KEY ?? process.env.BEDROCK_AWS_DEFAULT_REGION,
    ),
    /* key will be part of separate config */
    [EModelEndpoint.agents]: generateConfig('true', undefined, EModelEndpoint.agents),
  },
};
