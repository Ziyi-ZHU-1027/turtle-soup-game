const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 安全中间件
app.use(helmet());
// CORS配置：开发环境下允许所有来源，生产环境下使用指定来源
const corsOptions = {
  credentials: true
};
if (process.env.NODE_ENV === 'production') {
  corsOptions.origin = process.env.FRONTEND_URL || 'http://localhost:5173';
} else {
  corsOptions.origin = true; // 允许所有来源（开发环境）
}
app.use(cors(corsOptions));

// 日志
app.use(morgan('combined'));

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP限制100个请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

// 健康检查路由
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 基础路由
app.get('/', (req, res) => {
  res.json({
    name: '海龟汤后端API',
    version: '1.0.0',
    docs: '/api/docs'
  });
});

// API路由
const authRoutes = require('./routes/auth');
const puzzleRoutes = require('./routes/puzzles');
const gameRoutes = require('./routes/game');

app.use('/api/auth', authRoutes);
app.use('/api/puzzles', puzzleRoutes);
app.use('/api/game', gameRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '路由不存在' });
});

// 启动服务器
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📁 环境: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;