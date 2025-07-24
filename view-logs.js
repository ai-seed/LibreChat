#!/usr/bin/env node

// 简单的日志查看脚本
const fs = require('fs');
const path = require('path');

console.log('🔍 LibreChat转发日志查看器\n');

// 检查是否有日志文件
const possibleLogPaths = [
    'logs/librechat.log',
    'api/logs/librechat.log',
    'server.log',
    'app.log'
];

let logFile = null;
for (const logPath of possibleLogPaths) {
    if (fs.existsSync(logPath)) {
        logFile = logPath;
        break;
    }
}

if (logFile) {
    console.log(`📄 找到日志文件: ${logFile}`);
    console.log('🔍 正在查找转发相关的日志...\n');
    
    try {
        const logContent = fs.readFileSync(logFile, 'utf8');
        const lines = logContent.split('\n');
        
        // 过滤转发相关的日志
        const forwardingLogs = lines.filter(line => 
            line.includes('转发配置') || 
            line.includes('请求转发') || 
            line.includes('请求发送') || 
            line.includes('响应接收') || 
            line.includes('请求失败') ||
            line.includes('流式请求') ||
            line.includes('客户端创建')
        );
        
        if (forwardingLogs.length > 0) {
            console.log(`✅ 找到 ${forwardingLogs.length} 条转发日志:\n`);
            forwardingLogs.slice(-20).forEach((log, index) => {
                console.log(`${index + 1}. ${log}`);
            });
        } else {
            console.log('❌ 未找到转发相关的日志');
            console.log('💡 请确保：');
            console.log('   1. LibreChat服务正在运行');
            console.log('   2. 已经发送过AI消息');
            console.log('   3. 日志级别设置为INFO或DEBUG');
        }
    } catch (error) {
        console.error('❌ 读取日志文件失败:', error.message);
    }
} else {
    console.log('❌ 未找到日志文件');
    console.log('\n💡 如何查看实时日志:');
    console.log('');
    console.log('🐳 Docker部署:');
    console.log('   docker logs -f librechat');
    console.log('');
    console.log('📦 PM2部署:');
    console.log('   pm2 logs librechat');
    console.log('');
    console.log('🔧 开发模式:');
    console.log('   查看 npm run dev 的控制台输出');
    console.log('');
    console.log('🖥️ 直接运行:');
    console.log('   查看启动LibreChat时的控制台输出');
}

console.log('\n📋 转发日志说明:');
console.log('🚀 [转发配置] - 客户端初始化配置');
console.log('🌐 [请求转发] - 准备发送请求');
console.log('🔧 [客户端创建] - OpenAI客户端创建');
console.log('📡 [请求发送] - 发送到上游服务');
console.log('🌊 [流式请求] - 流式请求处理');
console.log('✅ [响应接收] - 收到上游响应');
console.log('❌ [请求失败] - 请求失败信息');

console.log('\n🎯 关键信息:');
console.log('• 目标URL应该是: https://api-dev.718ai.cn/v1/...');
console.log('• API Key显示为: ak_e8244e22...（脱敏）');
console.log('• 响应时间和token使用情况');
console.log('• 错误信息（如果有）');

console.log('\n✨ 使用提示:');
console.log('1. 启动LibreChat服务');
console.log('2. 使用外部认证登录');
console.log('3. 发送AI消息');
console.log('4. 运行此脚本查看日志');
console.log('5. 或直接查看实时日志输出');
