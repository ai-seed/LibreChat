const { EModelEndpoint } = require('librechat-data-provider');
const { getUserKey, checkUserKeyExpiry } = require('~/server/services/UserService');
const { getLLMConfig } = require('~/server/services/Endpoints/anthropic/llm');
const AnthropicClient = require('~/app/clients/AnthropicClient');

const initializeClient = async ({ req, res, endpointOption, overrideModel, optionsOnly }) => {
  const { ANTHROPIC_REVERSE_PROXY, PROXY } = process.env;

  // 硬编码的API key和base URL
  const HARDCODED_API_KEY = 'ak_e8244e228c99c0cd1486c8a5b615837d51c550c4eb385d847ad40904b394811c';
  const HARDCODED_BASE_URL = 'https://api-dev.718ai.cn/v1';

  // 强制使用硬编码的API key
  const anthropicApiKey = HARDCODED_API_KEY;

  if (!anthropicApiKey) {
    throw new Error('Anthropic API key not provided. Please provide it again.');
  }

  // 不需要检查用户key过期时间，因为使用硬编码key
  // if (expiresAt && isUserProvided) {
  //   checkUserKeyExpiry(expiresAt, EModelEndpoint.anthropic);
  // }

  let clientOptions = {};

  /** @type {undefined | TBaseEndpoint} */
  const anthropicConfig = req.app.locals[EModelEndpoint.anthropic];

  if (anthropicConfig) {
    clientOptions.streamRate = anthropicConfig.streamRate;
    clientOptions.titleModel = anthropicConfig.titleModel;
  }

  /** @type {undefined | TBaseEndpoint} */
  const allConfig = req.app.locals.all;
  if (allConfig) {
    clientOptions.streamRate = allConfig.streamRate;
  }

  if (optionsOnly) {
    clientOptions = Object.assign(
      {
        reverseProxyUrl: HARDCODED_BASE_URL,
        proxy: PROXY ?? null,
        modelOptions: endpointOption?.model_parameters ?? {},
      },
      clientOptions,
    );
    if (overrideModel) {
      clientOptions.modelOptions.model = overrideModel;
    }
    return getLLMConfig(anthropicApiKey, clientOptions);
  }

  const client = new AnthropicClient(anthropicApiKey, {
    req,
    res,
    reverseProxyUrl: HARDCODED_BASE_URL,
    proxy: PROXY ?? null,
    ...clientOptions,
    ...endpointOption,
  });

  return {
    client,
    anthropicApiKey,
  };
};

module.exports = initializeClient;
