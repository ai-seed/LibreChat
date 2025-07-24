import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '~/hooks/AuthContext';
import { useLocalize } from '~/hooks';

interface ExternalUserData {
  email: string;
  name: string;
  username?: string;
  role?: string;
  avatar?: string;
  externalId?: string;
}

const ExternalAuth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUserContext } = useAuthContext();
  const localize = useLocalize();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 从localStorage获取用户信息
  const getUserFromStorage = (): ExternalUserData | null => {
    try {
      const stored = localStorage.getItem('external_user_data');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to parse user data from localStorage:', error);
      return null;
    }
  };

  // 从URL参数获取用户信息
  const getUserFromParams = (): ExternalUserData | null => {
    try {
      const userDataParam = searchParams.get('userData');
      if (userDataParam) {
        return JSON.parse(decodeURIComponent(userDataParam));
      }
      return null;
    } catch (error) {
      console.error('Failed to parse user data from URL params:', error);
      return null;
    }
  };

  // 调用后端外部认证API
  const authenticateUser = async (userData: ExternalUserData) => {
    try {
      const response = await fetch('/api/auth/external-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 确保包含cookies
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        // 认证成功，设置用户上下文
        setUserContext({
          token: data.token,
          isAuthenticated: true,
          user: data.user,
          redirect: '/c/new'
        });

        // 保留localStorage中的用户数据，以便刷新时重新认证
        // localStorage.removeItem('external_user_data'); // 不删除，保持持久登录

        // 清除URL参数中的用户数据（安全考虑）
        if (searchParams.get('userData')) {
          navigate('/c/new', { replace: true });
        }
      } else {
        setError(data.message || 'Authentication failed');
        setLoading(false);
      }
    } catch (error) {
      console.error('External authentication error:', error);
      setError('Network error occurred');
      setLoading(false);
    }
  };

  useEffect(() => {
    const performAuthentication = async () => {
      // 优先从URL参数获取用户数据，其次从localStorage
      let userData = getUserFromParams();
      
      if (!userData) {
        userData = getUserFromStorage();
      }

      if (userData) {
        // 验证必需字段
        if (!userData.email || !userData.name) {
          setError('Invalid user data: email and name are required');
          setLoading(false);
          return;
        }

        // 如果从URL获取到数据，存储到localStorage以备后用
        if (searchParams.get('userData')) {
          localStorage.setItem('external_user_data', JSON.stringify(userData));
        }

        // 执行认证
        await authenticateUser(userData);
      } else {
        setError('No user data found');
        setLoading(false);
      }
    };

    performAuthentication();
  }, [searchParams]);

  // 重试认证
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    const userData = getUserFromStorage();
    if (userData) {
      authenticateUser(userData);
    } else {
      setError('No user data available for retry');
      setLoading(false);
    }
  };

  // 返回登录页
  const handleBackToLogin = () => {
    localStorage.removeItem('external_user_data');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
          <p className="text-gray-600 dark:text-gray-300">
            {localize('com_auth_authenticating') || 'Authenticating...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
          <div className="text-center">
            <div className="mb-4 text-red-500">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              {localize('com_auth_error') || 'Authentication Error'}
            </h2>
            <p className="mb-6 text-gray-600 dark:text-gray-300">{error}</p>
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {localize('com_auth_retry') || 'Retry'}
              </button>
              <button
                onClick={handleBackToLogin}
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {localize('com_auth_back_to_login') || 'Back to Login'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ExternalAuth;
