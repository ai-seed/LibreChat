// 验证配置脚本
const fs = require('fs');
const path = require('path');

console.log('🔍 验证LibreChat配置...\n');

// 检查.env文件
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    console.log('✅ .env文件存在');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // 检查API key配置
    if (envContent.includes('ak_e8244e228c99c0cd1486c8a5b615837d51c550c4eb385d847ad40904b394811c')) {
        console.log('✅ API key已硬编码');
    } else {
        console.log('❌ API key未正确配置');
    }
    
    // 检查base URL配置
    if (envContent.includes('https://api-dev.718ai.cn/v1')) {
        console.log('✅ Base URL已硬编码');
    } else {
        console.log('❌ Base URL未正确配置');
    }
} else {
    console.log('❌ .env文件不存在');
}

// 检查初始化文件
const initFiles = [
    'api/server/services/Endpoints/openAI/initialize.js',
    'api/server/services/Endpoints/anthropic/initialize.js',
    'api/server/services/Endpoints/google/initialize.js',
    'packages/api/src/endpoints/openai/initialize.ts'
];

console.log('\n🔧 检查初始化文件...');
initFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('ak_e8244e228c99c0cd1486c8a5b615837d51c550c4eb385d847ad40904b394811c')) {
            console.log(`✅ ${file} - API key已硬编码`);
        } else {
            console.log(`❌ ${file} - API key未硬编码`);
        }
        
        if (content.includes('https://api-dev.718ai.cn/v1')) {
            console.log(`✅ ${file} - Base URL已硬编码`);
        } else {
            console.log(`❌ ${file} - Base URL未硬编码`);
        }
    } else {
        console.log(`❌ ${file} - 文件不存在`);
    }
});

// 检查EndpointService配置
const endpointServicePath = path.join(__dirname, 'api/server/services/Config/EndpointService.js');
if (fs.existsSync(endpointServicePath)) {
    const content = fs.readFileSync(endpointServicePath, 'utf8');
    if (content.includes('HARDCODED_API_KEY') && content.includes('HARDCODED_BASE_URL')) {
        console.log('✅ EndpointService.js - 硬编码配置已设置');
    } else {
        console.log('❌ EndpointService.js - 硬编码配置未设置');
    }
} else {
    console.log('❌ EndpointService.js - 文件不存在');
}

console.log('\n📋 配置摘要:');
console.log('API Key: ak_e8244e228c99c0cd1486c8a5b615837d51c550c4eb385d847ad40904b394811c');
console.log('Base URL: https://api-dev.718ai.cn/v1');
console.log('支持的端点: OpenAI, Anthropic, Google, Azure OpenAI, Assistants');

console.log('\n🚀 下一步:');
console.log('1. 重启LibreChat服务');
console.log('2. 使用外部认证登录');
console.log('3. 发送消息测试AI对话');
console.log('4. 在开发者工具中检查网络请求URL');

console.log('\n✨ 验证完成！');
