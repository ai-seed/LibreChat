#!/bin/bash

echo "🐳 LibreChat Docker 转发测试脚本"
echo "=================================="

# 检查Docker容器状态
echo "📋 检查容器状态..."
docker-compose -f deploy-compose.yml ps

echo ""
echo "🔍 检查容器中的环境变量..."
echo "OPENAI_API_KEY:"
docker exec LibreChat-API printenv OPENAI_API_KEY | head -c 20
echo "..."

echo ""
echo "OPENAI_REVERSE_PROXY:"
docker exec LibreChat-API printenv OPENAI_REVERSE_PROXY

echo ""
echo "DEBUG_CONSOLE:"
docker exec LibreChat-API printenv DEBUG_CONSOLE

echo ""
echo "🧪 发送测试请求..."

# 设置用户认证
echo "1️⃣ 设置外部用户认证..."
AUTH_RESPONSE=$(curl -s -X POST http://localhost:3080/api/auth/external-auth \
  -H "Content-Type: application/json" \
  -d '{
    "email": "docker-test@company.com",
    "name": "Docker测试用户",
    "username": "dockertest",
    "role": "USER"
  }' \
  -c cookies.txt)

if [[ $? -eq 0 ]]; then
    echo "✅ 用户认证成功"
else
    echo "❌ 用户认证失败"
    exit 1
fi

echo ""
echo "2️⃣ 发送聊天请求..."
echo "📤 请求负载: 测试消息到OpenAI端点"

# 发送聊天请求
CHAT_RESPONSE=$(curl -s -X POST http://localhost:3080/api/ask/openAI \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "text": "Hello, this is a Docker test message to verify API forwarding. Please respond briefly.",
    "parentMessageId": "docker-test-'$(date +%s)'",
    "conversationId": null,
    "model": "gpt-3.5-turbo",
    "endpoint": "openAI",
    "endpointType": "openAI"
  }')

echo "📊 聊天请求已发送"

echo ""
echo "🔍 查看最近的转发日志..."
echo "=================================="

# 查看最近的转发相关日志
docker logs --tail=50 LibreChat-API | grep -E "(转发|OpenAI|🚀|📡|🌐|🔧|✅|❌)" | tail -20

echo ""
echo "=================================="
echo "📋 完整的最近日志（最后20行）:"
docker logs --tail=20 LibreChat-API

echo ""
echo "🎯 如果没有看到转发日志，请检查："
echo "1. 容器是否正确重启: docker-compose -f deploy-compose.yml restart api"
echo "2. 环境变量是否正确: docker exec LibreChat-API printenv | grep DEBUG"
echo "3. 实时查看日志: docker logs -f LibreChat-API"

echo ""
echo "🔧 有用的调试命令:"
echo "• 查看实时日志: docker-compose -f deploy-compose.yml logs -f api"
echo "• 过滤转发日志: docker logs -f LibreChat-API | grep -E '(转发|🚀|📡)'"
echo "• 进入容器调试: docker exec -it LibreChat-API /bin/bash"
echo "• 重启API容器: docker-compose -f deploy-compose.yml restart api"

# 清理临时文件
rm -f cookies.txt

echo ""
echo "✨ 测试完成！"
