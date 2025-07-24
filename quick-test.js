// 快速测试转发功能的脚本
const fetch = require('node-fetch');

async function testForwarding() {
    console.log('🧪 开始测试LibreChat转发功能...\n');

    // 1. 首先设置用户认证
    console.log('1️⃣ 设置外部用户认证...');
    const userData = {
        email: "test-forwarding@company.com",
        name: "转发测试用户",
        username: "forwardtest",
        role: "USER"
    };

    try {
        const authResponse = await fetch('http://localhost:3080/api/auth/external-auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        if (!authResponse.ok) {
            console.error('❌ 用户认证失败:', authResponse.status);
            return;
        }

        const authData = await authResponse.json();
        console.log('✅ 用户认证成功:', authData.user.name);

        // 获取认证cookie
        const cookies = authResponse.headers.get('set-cookie');
        console.log('🍪 获取到认证cookie');

        // 2. 发送聊天请求
        console.log('\n2️⃣ 发送聊天请求到OpenAI端点...');
        
        const chatPayload = {
            text: "Hello, this is a test message to verify API forwarding. Please respond with a simple greeting.",
            parentMessageId: "test-" + Date.now(),
            conversationId: null,
            model: "gpt-3.5-turbo",
            endpoint: "openAI",
            endpointType: "openAI"
        };

        console.log('📤 请求负载:', JSON.stringify(chatPayload, null, 2));
        console.log('\n🔍 现在请查看服务器日志，应该能看到详细的转发日志...\n');

        const chatResponse = await fetch('http://localhost:3080/api/ask/openAI', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookies || ''
            },
            body: JSON.stringify(chatPayload),
        });

        console.log('📊 响应状态:', chatResponse.status);
        console.log('📊 响应头:', Object.fromEntries(chatResponse.headers.entries()));

        if (chatResponse.ok) {
            console.log('✅ 聊天请求发送成功!');
            console.log('🎯 请检查服务器日志中的转发信息');
            
            // 尝试读取响应内容
            const responseText = await chatResponse.text();
            console.log('📝 响应内容长度:', responseText.length);
            if (responseText.length < 500) {
                console.log('📝 响应内容预览:', responseText.substring(0, 200) + '...');
            }
        } else {
            console.error('❌ 聊天请求失败:', chatResponse.status);
            const errorText = await chatResponse.text();
            console.error('❌ 错误详情:', errorText);
        }

    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
    }

    console.log('\n📋 预期的转发日志类型:');
    console.log('🚀 [OpenAI转发配置] 初始化客户端');
    console.log('📤 [OpenAI转发配置] 客户端选项');
    console.log('🎯 [OpenAI转发验证] 关键配置确认');
    console.log('🌐 [OpenAI请求转发] 准备发送请求');
    console.log('💬 [OpenAI请求转发] 消息内容');
    console.log('🔧 [OpenAI客户端创建] 配置参数');
    console.log('📡 [OpenAI请求发送] 即将发送到上游服务');
    console.log('✅ [OpenAI响应接收] 收到上游服务响应');

    console.log('\n🎯 关键验证点:');
    console.log('• targetURL 应该是: https://api-dev.718ai.cn/v1/chat/completions');
    console.log('• apiKey 应该显示: ak_e8244e228c99...（脱敏）');
    console.log('• isCorrectURL 应该是: true');

    console.log('\n✨ 测试完成！请查看上面的服务器日志输出。');
}

// 运行测试
testForwarding().catch(console.error);
