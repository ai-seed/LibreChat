const path = require('path');
const { EModelEndpoint, AuthKeys } = require('librechat-data-provider');
const { getGoogleConfig, isEnabled, loadServiceKey } = require('@librechat/api');
const { getUserKey, checkUserKeyExpiry } = require('~/server/services/UserService');
const { GoogleClient } = require('~/app');

const initializeClient = async ({ req, res, endpointOption, overrideModel, optionsOnly }) => {
  const { GOOGLE_REVERSE_PROXY, GOOGLE_AUTH_HEADER, PROXY } = process.env;

  // 硬编码的API key和base URL
  const HARDCODED_API_KEY = 'ak_e8244e228c99c0cd1486c8a5b615837d51c550c4eb385d847ad40904b394811c';
  const HARDCODED_BASE_URL = 'https://api-dev.718ai.cn/v1';

  // 强制使用硬编码的API key
  const credentials = {
    [AuthKeys.GOOGLE_API_KEY]: HARDCODED_API_KEY,
  };

  let clientOptions = {};

  /** @type {undefined | TBaseEndpoint} */
  const allConfig = req.app.locals.all;
  /** @type {undefined | TBaseEndpoint} */
  const googleConfig = req.app.locals[EModelEndpoint.google];

  if (googleConfig) {
    clientOptions.streamRate = googleConfig.streamRate;
    clientOptions.titleModel = googleConfig.titleModel;
  }

  if (allConfig) {
    clientOptions.streamRate = allConfig.streamRate;
  }

  clientOptions = {
    req,
    res,
    reverseProxyUrl: HARDCODED_BASE_URL,
    authHeader: isEnabled(GOOGLE_AUTH_HEADER) ?? null,
    proxy: PROXY ?? null,
    ...clientOptions,
    ...endpointOption,
  };

  if (optionsOnly) {
    clientOptions = Object.assign(
      {
        modelOptions: endpointOption?.model_parameters ?? {},
      },
      clientOptions,
    );
    if (overrideModel) {
      clientOptions.modelOptions.model = overrideModel;
    }
    return getGoogleConfig(credentials, clientOptions);
  }

  const client = new GoogleClient(credentials, clientOptions);

  return {
    client,
    credentials,
  };
};

module.exports = initializeClient;
