const OpenAI = require('openai');
const { ProxyAgent } = require('undici');
const { constructAzureURL, isUserProvided, resolveHeaders } = require('@librechat/api');
const { ErrorTypes, EModelEndpoint, mapModelToAzureConfig } = require('librechat-data-provider');
const {
  getUserKeyValues,
  getUserKeyExpiry,
  checkUserKeyExpiry,
} = require('~/server/services/UserService');
const OpenAIClient = require('~/app/clients/OpenAIClient');

class Files {
  constructor(client) {
    this._client = client;
  }
  /**
   * Create an assistant file by attaching a
   * [File](https://platform.openai.com/docs/api-reference/files) to an
   * [assistant](https://platform.openai.com/docs/api-reference/assistants).
   */
  create(assistantId, body, options) {
    return this._client.post(`/assistants/${assistantId}/files`, {
      body,
      ...options,
      headers: { 'OpenAI-Beta': 'assistants=v1', ...options?.headers },
    });
  }

  /**
   * Retrieves an AssistantFile.
   */
  retrieve(assistantId, fileId, options) {
    return this._client.get(`/assistants/${assistantId}/files/${fileId}`, {
      ...options,
      headers: { 'OpenAI-Beta': 'assistants=v1', ...options?.headers },
    });
  }

  /**
   * Delete an assistant file.
   */
  del(assistantId, fileId, options) {
    return this._client.delete(`/assistants/${assistantId}/files/${fileId}`, {
      ...options,
      headers: { 'OpenAI-Beta': 'assistants=v1', ...options?.headers },
    });
  }
}

const initializeClient = async ({ req, res, version, endpointOption, initAppClient = false }) => {
  const { PROXY, OPENAI_ORGANIZATION } = process.env;

  // 硬编码的API key和base URL
  const HARDCODED_API_KEY = 'ak_e8244e228c99c0cd1486c8a5b615837d51c550c4eb385d847ad40904b394811c';
  const HARDCODED_BASE_URL = 'https://api-dev.718ai.cn/v1';

  // 强制使用硬编码配置
  let apiKey = HARDCODED_API_KEY;
  let baseURL = HARDCODED_BASE_URL;

  const opts = {};

  const clientOptions = {
    reverseProxyUrl: baseURL ?? null,
    proxy: PROXY ?? null,
    req,
    res,
    ...endpointOption,
  };

  /** @type {TAzureConfig | undefined} */
  const azureConfig = req.app.locals[EModelEndpoint.azureOpenAI];

  /** @type {AzureOptions | undefined} */
  let azureOptions;

  if (azureConfig && azureConfig.assistants) {
    const { modelGroupMap, groupMap, assistantModels } = azureConfig;
    const modelName = req.body.model ?? req.query.model ?? assistantModels[0];
    const {
      azureOptions: currentOptions,
      baseURL: azureBaseURL,
      headers = {},
      serverless,
    } = mapModelToAzureConfig({
      modelName,
      modelGroupMap,
      groupMap,
    });

    azureOptions = currentOptions;

    baseURL = constructAzureURL({
      baseURL: azureBaseURL ?? 'https://${INSTANCE_NAME}.openai.azure.com/openai',
      azureOptions,
    });

    apiKey = azureOptions.azureOpenAIApiKey;
    opts.defaultQuery = { 'api-version': azureOptions.azureOpenAIApiVersion };
    opts.defaultHeaders = resolveHeaders(
      {
        ...headers,
        'api-key': apiKey,
        'OpenAI-Beta': `assistants=${version}`,
      },
      req.user,
    );
    opts.model = azureOptions.azureOpenAIApiDeploymentName;

    if (initAppClient) {
      clientOptions.titleConvo = azureConfig.titleConvo;
      clientOptions.titleModel = azureConfig.titleModel;
      clientOptions.titleMethod = azureConfig.titleMethod ?? 'completion';

      const groupName = modelGroupMap[modelName].group;
      clientOptions.addParams = azureConfig.groupMap[groupName].addParams;
      clientOptions.dropParams = azureConfig.groupMap[groupName].dropParams;
      clientOptions.forcePrompt = azureConfig.groupMap[groupName].forcePrompt;

      clientOptions.reverseProxyUrl = baseURL ?? clientOptions.reverseProxyUrl;
      clientOptions.headers = opts.defaultHeaders;
      clientOptions.azure = !serverless && azureOptions;
      if (serverless === true) {
        clientOptions.defaultQuery = azureOptions.azureOpenAIApiVersion
          ? { 'api-version': azureOptions.azureOpenAIApiVersion }
          : undefined;
        clientOptions.headers['api-key'] = apiKey;
      }
    }
  }

  // 不需要检查用户提供的key，因为使用硬编码key
  // if (userProvidesKey & !apiKey) {
  //   throw new Error(
  //     JSON.stringify({
  //       type: ErrorTypes.NO_USER_KEY,
  //     }),
  //   );
  // }

  if (!apiKey) {
    throw new Error('Assistants API key not provided. Please provide it again.');
  }

  if (baseURL) {
    opts.baseURL = baseURL;
  }

  if (PROXY) {
    const proxyAgent = new ProxyAgent(PROXY);
    opts.fetchOptions = {
      dispatcher: proxyAgent,
    };
  }

  if (OPENAI_ORGANIZATION) {
    opts.organization = OPENAI_ORGANIZATION;
  }

  /** @type {OpenAIClient} */
  const openai = new OpenAI({
    apiKey,
    ...opts,
  });

  openai.beta.assistants.files = new Files(openai);

  openai.req = req;
  openai.res = res;

  if (azureOptions) {
    openai.locals = { ...(openai.locals ?? {}), azureOptions };
  }

  if (endpointOption && initAppClient) {
    const client = new OpenAIClient(apiKey, clientOptions);
    return {
      client,
      openai,
      openAIApiKey: apiKey,
    };
  }

  return {
    openai,
    openAIApiKey: apiKey,
  };
};

module.exports = initializeClient;
