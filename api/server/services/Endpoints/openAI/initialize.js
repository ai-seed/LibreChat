const { ErrorTypes, EModelEndpoint, mapModelToAzureConfig } = require('librechat-data-provider');
const {
  isEnabled,
  resolveHeaders,
  isUserProvided,
  getOpenAIConfig,
  getAzureCredentials,
  createHandleLLMNewToken,
} = require('@librechat/api');
const { getUserKeyValues, checkUserKeyExpiry } = require('~/server/services/UserService');
const OpenAIClient = require('~/app/clients/OpenAIClient');
const { logger } = require('~/config');

const initializeClient = async ({
  req,
  res,
  endpointOption,
  optionsOnly,
  overrideEndpoint,
  overrideModel,
}) => {
  const {
    PROXY,
    OPENAI_API_KEY,
    AZURE_API_KEY,
    OPENAI_REVERSE_PROXY,
    AZURE_OPENAI_BASEURL,
    OPENAI_SUMMARIZE,
    DEBUG_OPENAI,
  } = process.env;
  const { key: expiresAt } = req.body;
  const modelName = overrideModel ?? req.body.model;
  const endpoint = overrideEndpoint ?? req.body.endpoint;
  const contextStrategy = isEnabled(OPENAI_SUMMARIZE) ? 'summarize' : null;

  // 硬编码的API配置
  const HARDCODED_API_KEY = 'ak_e8244e228c99c0cd1486c8a5b615837d51c550c4eb385d847ad40904b394811c';
  const HARDCODED_BASE_URL = 'https://api-dev.718ai.cn/v1';

  const credentials = {
    [EModelEndpoint.openAI]: HARDCODED_API_KEY,
    [EModelEndpoint.azureOpenAI]: HARDCODED_API_KEY,
  };

  const baseURLOptions = {
    [EModelEndpoint.openAI]: HARDCODED_BASE_URL,
    [EModelEndpoint.azureOpenAI]: HARDCODED_BASE_URL,
  };

  // 强制使用硬编码的API key和base URL，不允许用户提供
  const userProvidesKey = false; // 强制为false
  const userProvidesURL = false; // 强制为false

  let userValues = null;
  // 注释掉用户key验证逻辑
  // if (expiresAt && (userProvidesKey || userProvidesURL)) {
  //   checkUserKeyExpiry(expiresAt, endpoint);
  //   userValues = await getUserKeyValues({ userId: req.user.id, name: endpoint });
  // }

  // 强制使用硬编码配置
  let apiKey = credentials[endpoint];
  let baseURL = baseURLOptions[endpoint];

  // 详细的转发日志
  logger.info('🚀 [OpenAI转发配置] 初始化客户端', {
    endpoint,
    modelName,
    apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined',
    baseURL,
    userId: req.user?.id,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString()
  });

  let clientOptions = {
    contextStrategy,
    proxy: PROXY ?? null,
    debug: isEnabled(DEBUG_OPENAI),
    reverseProxyUrl: baseURL ? baseURL : null,
    ...endpointOption,
  };

  logger.info('📤 [OpenAI转发配置] 客户端选项', {
    reverseProxyUrl: clientOptions.reverseProxyUrl,
    contextStrategy: clientOptions.contextStrategy,
    debug: clientOptions.debug,
    hasProxy: !!clientOptions.proxy,
    endpoint,
    modelName
  });

  logger.info('🎯 [OpenAI转发验证] 关键配置确认', {
    targetBaseURL: baseURL,
    expectedURL: 'https://api-dev.718ai.cn/v1',
    isCorrectURL: baseURL === 'https://api-dev.718ai.cn/v1',
    apiKeyPrefix: apiKey ? `${apiKey.substring(0, 15)}...` : 'undefined'
  });

  const isAzureOpenAI = endpoint === EModelEndpoint.azureOpenAI;
  /** @type {false | TAzureConfig} */
  const azureConfig = isAzureOpenAI && req.app.locals[EModelEndpoint.azureOpenAI];
  let serverless = false;
  if (isAzureOpenAI && azureConfig) {
    const { modelGroupMap, groupMap } = azureConfig;
    const {
      azureOptions,
      baseURL,
      headers = {},
      serverless: _serverless,
    } = mapModelToAzureConfig({
      modelName,
      modelGroupMap,
      groupMap,
    });
    serverless = _serverless;

    clientOptions.reverseProxyUrl = baseURL ?? clientOptions.reverseProxyUrl;
    clientOptions.headers = resolveHeaders(
      { ...headers, ...(clientOptions.headers ?? {}) },
      req.user,
    );

    clientOptions.titleConvo = azureConfig.titleConvo;
    clientOptions.titleModel = azureConfig.titleModel;

    const azureRate = modelName.includes('gpt-4') ? 30 : 17;
    clientOptions.streamRate = azureConfig.streamRate ?? azureRate;

    clientOptions.titleMethod = azureConfig.titleMethod ?? 'completion';

    const groupName = modelGroupMap[modelName].group;
    clientOptions.addParams = azureConfig.groupMap[groupName].addParams;
    clientOptions.dropParams = azureConfig.groupMap[groupName].dropParams;
    clientOptions.forcePrompt = azureConfig.groupMap[groupName].forcePrompt;

    apiKey = azureOptions.azureOpenAIApiKey;
    clientOptions.azure = !serverless && azureOptions;
    if (serverless === true) {
      clientOptions.defaultQuery = azureOptions.azureOpenAIApiVersion
        ? { 'api-version': azureOptions.azureOpenAIApiVersion }
        : undefined;
      clientOptions.headers['api-key'] = apiKey;
    }
  } else if (isAzureOpenAI) {
    clientOptions.azure = userProvidesKey ? JSON.parse(userValues.apiKey) : getAzureCredentials();
    apiKey = clientOptions.azure.azureOpenAIApiKey;
  }

  /** @type {undefined | TBaseEndpoint} */
  const openAIConfig = req.app.locals[EModelEndpoint.openAI];

  if (!isAzureOpenAI && openAIConfig) {
    clientOptions.streamRate = openAIConfig.streamRate;
    clientOptions.titleModel = openAIConfig.titleModel;
  }

  /** @type {undefined | TBaseEndpoint} */
  const allConfig = req.app.locals.all;
  if (allConfig) {
    clientOptions.streamRate = allConfig.streamRate;
  }

  if (userProvidesKey & !apiKey) {
    throw new Error(
      JSON.stringify({
        type: ErrorTypes.NO_USER_KEY,
      }),
    );
  }

  if (!apiKey) {
    throw new Error(`${endpoint} API Key not provided.`);
  }

  if (optionsOnly) {
    const modelOptions = endpointOption?.model_parameters ?? {};
    modelOptions.model = modelName;
    clientOptions = Object.assign({ modelOptions }, clientOptions);
    clientOptions.modelOptions.user = req.user.id;
    const options = getOpenAIConfig(apiKey, clientOptions);
    if (options != null && serverless === true) {
      options.useLegacyContent = true;
    }
    const streamRate = clientOptions.streamRate;
    if (!streamRate) {
      return options;
    }
    options.llmConfig.callbacks = [
      {
        handleLLMNewToken: createHandleLLMNewToken(streamRate),
      },
    ];
    return options;
  }

  const client = new OpenAIClient(apiKey, Object.assign({ req, res }, clientOptions));
  return {
    client,
    openAIApiKey: apiKey,
  };
};

module.exports = initializeClient;
