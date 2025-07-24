# 外部系统认证集成指南

本文档介绍如何将外部系统的用户认证集成到LibreChat中，实现无缝的单点登录体验。

## 功能特性

- **自动用户管理**：根据提供的用户信息自动创建或更新用户
- **无需注册**：用户无需在LibreChat中单独注册
- **信息同步**：支持用户信息的实时同步更新
- **安全认证**：生成标准的JWT token，完全兼容LibreChat的认证体系
- **角色管理**：支持用户角色的设置和管理

## 集成方式

### 方式一：URL参数传递（推荐）

从后台系统跳转到LibreChat时，将用户信息作为URL参数传递：

```
https://your-librechat-domain.com/external-auth?userData=%7B%22email%22%3A%22user%40example.com%22%2C%22name%22%3A%22John%20Doe%22%2C%22role%22%3A%22USER%22%7D
```

### 方式二：localStorage预设

在跳转前将用户信息存储到localStorage：

```javascript
// 在跳转前执行
localStorage.setItem('external_user_data', JSON.stringify({
  email: 'user@example.com',
  name: 'John Doe',
  username: 'johndoe',
  role: 'USER',
  avatar: 'https://example.com/avatar.jpg',
  externalId: 'ext_12345'
}));

// 然后跳转到
window.location.href = 'https://your-librechat-domain.com/external-auth';
```

## 用户数据格式

### 必需字段

```typescript
{
  email: string;    // 用户邮箱，作为唯一标识
  name: string;     // 用户姓名
}
```

### 可选字段

```typescript
{
  username?: string;   // 用户名，默认使用邮箱前缀
  role?: string;       // 用户角色：'USER' | 'ADMIN'，默认为'USER'
  avatar?: string;     // 头像URL
  externalId?: string; // 外部系统的用户ID
}
```

### 完整示例

```json
{
  "email": "john.doe@company.com",
  "name": "John Doe",
  "username": "johndoe",
  "role": "USER",
  "avatar": "https://company.com/avatars/johndoe.jpg",
  "externalId": "emp_12345"
}
```

## 认证流程

1. **用户信息获取**：从URL参数或localStorage获取用户数据
2. **数据验证**：验证必需字段是否存在
3. **后端认证**：调用`/api/auth/external-auth`接口
4. **用户处理**：
   - 如果用户存在：更新用户信息
   - 如果用户不存在：创建新用户
5. **Token生成**：生成JWT token和refresh token
6. **认证完成**：设置用户上下文，跳转到主界面

## API接口

### POST /api/auth/external-auth

**请求体：**
```json
{
  "email": "user@example.com",
  "name": "User Name",
  "username": "username",
  "role": "USER",
  "avatar": "https://example.com/avatar.jpg",
  "externalId": "ext_123"
}
```

**成功响应：**
```json
{
  "message": "Authentication successful",
  "user": {
    "_id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "username": "username",
    "role": "USER",
    "avatar": "https://example.com/avatar.jpg",
    "provider": "external",
    "emailVerified": true
  },
  "token": "jwt_token_here"
}
```

**错误响应：**
```json
{
  "message": "Error message"
}
```

## 前端集成示例

### React组件示例

```typescript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ExternalLoginHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 从后台系统获取用户信息
    const userData = {
      email: 'user@example.com',
      name: 'User Name',
      role: 'USER'
    };

    // 存储到localStorage
    localStorage.setItem('external_user_data', JSON.stringify(userData));
    
    // 跳转到外部认证页面
    navigate('/external-auth');
  }, [navigate]);

  return <div>Redirecting...</div>;
};
```

### JavaScript示例

```javascript
// 直接跳转方式
function redirectToLibreChat(userData) {
  const encodedData = encodeURIComponent(JSON.stringify(userData));
  window.location.href = `https://librechat.example.com/external-auth?userData=${encodedData}`;
}

// localStorage方式
function redirectWithStorage(userData) {
  localStorage.setItem('external_user_data', JSON.stringify(userData));
  window.location.href = 'https://librechat.example.com/external-auth';
}

// 使用示例
const user = {
  email: 'john@company.com',
  name: 'John Doe',
  role: 'USER'
};

redirectToLibreChat(user);
```

## 安全考虑

1. **数据验证**：后端会验证所有必需字段
2. **唯一性检查**：以email作为唯一标识，防止重复用户
3. **角色控制**：支持用户角色管理，防止权限提升
4. **数据清理**：认证完成后会清理URL中的敏感数据
5. **错误处理**：提供完整的错误处理和用户反馈

## 故障排除

### 常见问题

1. **认证失败**：检查用户数据格式是否正确
2. **用户创建失败**：检查邮箱格式和必需字段
3. **权限问题**：确认用户角色设置正确
4. **网络错误**：检查API接口是否可访问

### 调试方法

1. 打开浏览器开发者工具
2. 查看Console中的错误信息
3. 检查Network标签中的API请求
4. 验证localStorage中的数据格式

## 更新日志

- v1.0.0: 初始版本，支持基本的外部认证功能
- 支持URL参数和localStorage两种数据传递方式
- 自动用户创建和信息同步
- 完整的错误处理和用户反馈
