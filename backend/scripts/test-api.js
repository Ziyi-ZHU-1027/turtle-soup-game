#!/usr/bin/env node

/**
 * 测试后端API
 */

const http = require('http');

const PORT = process.env.PORT || 3001;
const BASE_URL = `http://localhost:${PORT}`;

// 首先尝试启动服务器
const { spawn } = require('child_process');
const path = require('path');

console.log('测试后端API...\n');

// 检查服务器是否已在运行
function testServer() {
  return new Promise((resolve, reject) => {
    const req = http.get(`${BASE_URL}/api/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ 后端服务器正在运行');
          console.log(`   响应: ${data}`);
          resolve(true);
        } else {
          console.log(`⚠️  服务器响应状态码: ${res.statusCode}`);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      // 服务器未运行
      console.log('❌ 后端服务器未运行');
      resolve(false);
    });

    req.setTimeout(3000, () => {
      req.destroy();
      console.log('⏱️  连接超时，服务器可能未启动');
      resolve(false);
    });
  });
}

async function runTests() {
  const isRunning = await testServer();

  if (!isRunning) {
    console.log('\n尝试启动后端服务器...');
    const serverProcess = spawn('node', [path.join(__dirname, '..', 'src', 'index.js')], {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe',
      env: { ...process.env, PORT }
    });

    let serverStarted = false;
    let output = '';

    serverProcess.stdout.on('data', (data) => {
      output += data.toString();
      if (data.toString().includes('服务器运行在')) {
        serverStarted = true;
        console.log('✅ 后端服务器启动成功');
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('服务器错误:', data.toString());
    });

    // 等待服务器启动
    await new Promise(resolve => setTimeout(resolve, 3000));

    if (!serverStarted) {
      console.log('❌ 服务器启动失败');
      console.log('输出:', output);
      serverProcess.kill();
      return;
    }

    // 测试健康端点
    console.log('\n测试API端点...');
    try {
      const healthReq = http.get(`${BASE_URL}/api/health`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log(`✅ GET /api/health - 状态: ${res.statusCode}`);
          console.log(`   响应: ${data}`);

          // 测试谜题列表端点
          const puzzlesReq = http.get(`${BASE_URL}/api/puzzles`, (puzzlesRes) => {
            let puzzlesData = '';
            puzzlesRes.on('data', chunk => puzzlesData += chunk);
            puzzlesRes.on('end', () => {
              console.log(`\n✅ GET /api/puzzles - 状态: ${puzzlesRes.statusCode}`);
              if (puzzlesRes.statusCode === 200) {
                try {
                  const parsed = JSON.parse(puzzlesData);
                  console.log(`   返回 ${parsed.data?.length || 0} 个谜题`);
                } catch (e) {
                  console.log('   响应数据:', puzzlesData.substring(0, 200));
                }
              } else {
                console.log('   错误响应:', puzzlesData);
              }

              // 杀死服务器进程
              serverProcess.kill();
              console.log('\n✅ 测试完成！');
              console.log('\n下一步:');
              console.log('1. 启动前端开发服务器: cd frontend && npm run dev');
              console.log('2. 访问 http://localhost:5173 测试完整应用');
            });
          });

          puzzlesReq.on('error', (err) => {
            console.log(`❌ GET /api/puzzles - 错误: ${err.message}`);
            serverProcess.kill();
          });
        });
      });

      healthReq.on('error', (err) => {
        console.log(`❌ GET /api/health - 错误: ${err.message}`);
        serverProcess.kill();
      });
    } catch (error) {
      console.log('测试失败:', error);
      serverProcess.kill();
    }
  } else {
    console.log('\n服务器已在运行，跳过启动测试。');
    console.log('\n前端开发服务器可以启动: cd frontend && npm run dev');
  }
}

runTests().catch(console.error);