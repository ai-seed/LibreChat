const OpenAI = require('openai');
const { ProxyAgent } = require('undici');
const { ErrorTypes, EModelEndpoint } = require('librechat-data-provider');
const {
  getUserKeyValues,
  getUserKeyExpiry,
  checkUserKeyExpiry,
} = require('~/server/services/UserService');
const OpenAIClient = require('~/app/clients/OpenAIClient');
const { isUserProvided } = require('~/server/utils');

const initializeClient = async ({ req, res, endpointOption, version, initAppClient = false }) => {
  const { PROXY, OPENAI_ORGANIZATION, ASSISTANTS_API_KEY, ASSISTANTS_BASE_URL } = process.env;

  // 硬编码的API配置
  const HARDCODED_API_KEY = 'ak_e8244e228c99c0cd1486c8a5b615837d51c550c4eb385d847ad40904b394811c';
  const HARDCODED_BASE_URL = 'https://api-dev.718ai.cn/v1';

  // 强制使用硬编码配置，不允许用户提供key
  const userProvidesKey = false;
  const userProvidesURL = false;

  let userValues = null;
  // 注释掉用户key验证逻辑
  // if (userProvidesKey || userProvidesURL) {
  //   const expiresAt = await getUserKeyExpiry({
  //     userId: req.user.id,
  //     name: EModelEndpoint.assistants,
  //   });
  //   checkUserKeyExpiry(expiresAt, EModelEndpoint.assistants);
  //   userValues = await getUserKeyValues({ userId: req.user.id, name: EModelEndpoint.assistants });
  // }

  // 强制使用硬编码配置
  let apiKey = HARDCODED_API_KEY;
  let baseURL = HARDCODED_BASE_URL;

  const opts = {
    defaultHeaders: {
      'OpenAI-Beta': `assistants=${version}`,
    },
  };

  const clientOptions = {
    reverseProxyUrl: baseURL ?? null,
    proxy: PROXY ?? null,
    req,
    res,
    ...endpointOption,
  };

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

  openai.req = req;
  openai.res = res;

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
