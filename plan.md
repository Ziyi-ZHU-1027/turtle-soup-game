海龟汤 - 全栈情境猜谜 Web 游戏
Context
用户有大量海龟汤数据，需要动态数据库来更新维护。需要一个完整的后端服务来处理AI调用、数据存储和提示系统。核心需求：

动态数据库：支持网页表单添加新的海龟汤
后端服务：保护API Key，管理游戏会话，存储对话历史
AI提示系统：根据当前对话给出主持人提示（如连续多个"不是"时）
管理员界面：管理谜题的添加/编辑
部署：Vercel（支持Node.js后端+静态前端）
技术栈
前端：Vue.js 3（轻量，数据绑定能力强）
后端：Node.js + Express
数据库：Supabase（PostgreSQL，自带认证）
AI服务：DeepSeek API（OpenAI兼容格式）
部署：Vercel
解决 AI 上下文丢失的核心策略
每次 API 调用都带完整 system prompt（含汤底），AI 永远不会"忘记"答案
动态提示系统：分析当前对话（如连续5个"不是"），在system prompt中增加提示语
对话历史存储：Supabase存储所有Q&A，用于分析和提示
数据库设计（Supabase）

-- puzzles表：存储海龟汤数据
id (uuid), title (text), description (汤面), solution (汤底),
difficulty (int 1-5), tags (text[]), created_at, updated_at

-- game_sessions表：游戏会话
id (uuid), puzzle_id, user_id (nullable), status, start_time, end_time,
consecutive_no_count (int) -- 连续"不是"计数，用于提示

-- conversations表：对话记录
id (uuid), session_id, role (user/assistant), content, timestamp

-- users表：Supabase Auth自带
后端 API 端点（Express）

POST   /api/auth/login           # Supabase认证
GET    /api/puzzles              # 获取谜题列表
POST   /api/puzzles              # 创建新谜题（管理员）
GET    /api/puzzles/:id          # 获取单个谜题
POST   /api/game/start           # 开始新游戏
POST   /api/game/:id/chat        # 发送问题，获取AI回答
GET    /api/game/:id/messages    # 获取历史对话
POST   /api/game/:id/reveal      # 查看汤底
AI 集成与提示系统
System Prompt 模板：


你是海龟汤主持人。
汤底（绝密）：{solution}
规则：只能回答"是"/"不是"/"无关"/"部分正确"。

{动态提示}
- 如果连续5个"不是"：添加"玩家可能在角色关系上困惑，可适当引导"
- 如果对话超过10轮无进展：添加"玩家可能需要考虑时间/空间因素"
AI服务流程：

从数据库获取汤底
获取当前会话历史（最近20轮）
分析对话模式（连续"不是"计数，问题类型）
构建动态提示
调用DeepSeek API（streaming）
存储回复，更新连续计数
返回流式响应到前端
前端架构（Vue.js）

frontend/
├── src/
│   ├── views/
│   │   ├── HomeView.vue        # 主页（谜题列表）
│   │   ├── GameView.vue        # 游戏页（聊天界面）
│   │   ├── AdminView.vue       # 管理员界面
│   │   └── LoginView.vue       # 登录页
│   ├── components/
│   │   ├── PuzzleCard.vue      # 谜题卡片
│   │   ├── ChatInterface.vue   # 聊天组件
│   │   ├── PuzzleForm.vue      # 谜题表单（管理员）
│   │   └── HintDisplay.vue     # 提示显示
│   ├── stores/
│   │   ├── auth.js             # 认证状态
│   │   ├── game.js             # 游戏状态
│   │   └── puzzles.js          # 谜题数据
│   ├── services/
│   │   ├── api.js              # API调用封装
│   │   ├── supabase.js         # Supabase客户端
│   │   └── ai.js               # AI服务前端调用
│   └── router/
实施步骤
Step 1: 项目初始化和Supabase设置（2天）
创建Supabase项目，设置数据库表
初始化后端Express项目（e:/海龟汤/backend/）
初始化前端Vue项目（e:/海龟汤/frontend/）
配置Vercel部署环境（vercel.json）
Step 2: 后端核心API（3天）
设置Express基础结构、中间件、路由
实现Supabase连接和基础CRUD
实现认证中间件（Supabase Auth JWT验证）
创建谜题管理API（GET/POST puzzles）
实现游戏会话API（start, get, end）
Step 3: AI集成与对话系统（3天）
实现AI服务模块（调用DeepSeek API）
实现system prompt构建器（含动态提示）
实现对话历史存储和连续计数逻辑
实现流式响应处理（SSE）
集成到游戏聊天API
Step 4: 前端基础界面（3天）
Vue项目搭建，路由配置
实现主页（谜题列表展示）
实现登录/注册页面（Supabase Auth）
实现游戏页面框架（汤面展示 + 聊天区域）
集成API调用服务
Step 5: 聊天界面与实时交互（2天）
实现ChatInterface组件（消息列表，滚动）
实现输入框和发送逻辑
集成AI流式响应（打字机效果）
实现提示系统显示（当有提示时展示）
Step 6: 管理员功能（2天）
管理员认证和权限检查
实现PuzzleForm组件（添加/编辑谜题）
实现谜题列表管理界面
添加数据验证和错误处理
Step 7: 测试与部署（2天）
本地完整功能测试
配置Vercel环境变量（API Keys）
部署到Vercel
生产环境测试和调试
关键文件
后端核心：

backend/src/services/aiService.js - AI集成，动态提示生成
backend/src/utils/promptBuilder.js - system prompt构建
backend/src/controllers/gameController.js - 游戏会话逻辑
backend/src/routes/puzzles.js - 谜题管理API
前端核心：

frontend/src/views/GameView.vue - 主游戏界面
frontend/src/components/ChatInterface.vue - 聊天组件
frontend/src/stores/game.js - 游戏状态管理
frontend/src/services/api.js - API调用封装
数据库：

supabase/migrations/001_initial.sql - 数据库表结构
验证方式
本地开发：前后端分别启动，测试完整流程
数据库验证：通过Supabase Dashboard确认数据正确存储
AI功能：测试长对话中AI是否记住汤底，提示系统是否触发
管理员功能：登录后能否添加新谜题
Vercel部署：生产环境全功能测试