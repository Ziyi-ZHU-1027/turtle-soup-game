# 海龟汤 - 情境猜谜游戏

一个基于AI的海龟汤（Lateral Thinking Puzzle）Web游戏，玩家通过提问是/否问题来推理谜底，AI作为主持人回答问题。

## 功能特性

- 🎭 **神秘谜题库** - 动态数据库存储海龟汤谜题（汤面+汤底）
- 🤖 **AI主持人** - DeepSeek AI智能回答是/否/无关问题
- 💡 **智能提示系统** - 根据对话进度提供上下文提示
- 🔐 **用户系统** - Supabase认证，支持登录/注册/游客模式
- 📊 **管理员后台** - 谜题管理、数据统计、对话分析
- 💬 **实时聊天** - 流式AI回复，打字动画指示器
- 📱 **响应式设计** - 移动端优先，可折叠谜题库，紧凑操作栏
- 🎨 **回复类型标签** - 是/不是/无关等彩色标签，一目了然

## 技术栈

### 后端 (Node.js + Express)
- **运行时**: Node.js (>=18.0.0)
- **框架**: Express.js
- **数据库**: Supabase (PostgreSQL)
- **AI服务**: DeepSeek API (OpenAI兼容)
- **部署**: Vercel (推荐)

### 前端 (Vue.js 3)
- **框架**: Vue.js 3 + Composition API
- **状态管理**: Pinia
- **路由**: Vue Router
- **HTTP客户端**: Axios
- **UI库**: 自定义CSS (暗色主题)
- **构建工具**: Vite

## 快速开始

### 1. 环境准备

确保已安装:
- Node.js (>=18.0.0)
- npm 或 yarn
- Git

### 2. 克隆项目
```bash
git clone <repository-url>
cd 海龟汤
```

### 3. 设置Supabase

1. 访问 [Supabase](https://supabase.com) 创建新项目
2. 获取项目URL和anon key
3. 运行数据库迁移：
   - 在Supabase控制台的SQL编辑器中运行 `supabase/migrations/001_initial_schema.sql`

### 4. 配置环境变量

#### 后端配置 (`backend/.env`)
```bash
# 复制示例文件
cp backend/.env.example backend/.env

# 编辑 .env 文件
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Supabase配置
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret_key_here

# DeepSeek AI配置
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# 管理员配置
ADMIN_EMAILS=admin@example.com
```

#### 前端配置 (`frontend/.env`)
```bash
# 创建 .env 文件
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_EMAILS=admin@example.com
```

### 5. 安装依赖

#### 后端
```bash
cd backend
npm install
```

#### 前端
```bash
cd frontend
npm install
```

### 6. 运行开发服务器

#### 启动后端 (端口3001)
```bash
cd backend
npm run dev
```

#### 启动前端 (端口5173)
```bash
cd frontend
npm run dev
```

### 7. 访问应用
- 前端: http://localhost:5173
- 后端API: http://localhost:3001
- 健康检查: http://localhost:3001/api/health

## 项目结构

```
海龟汤/
├── backend/                    # Node.js后端
│   ├── src/
│   │   ├── controllers/       # 控制器
│   │   ├── routes/           # 路由定义
│   │   ├── services/         # 业务逻辑
│   │   │   ├── aiService.js  # AI集成核心
│   │   │   └── supabaseService.js # 数据库操作
│   │   ├── utils/            # 工具函数
│   │   └── index.js          # 入口文件
│   ├── .env.example          # 环境变量示例
│   └── package.json
│
├── frontend/                  # Vue.js前端
│   ├── src/
│   │   ├── components/       # 可复用组件
│   │   ├── views/           # 页面视图
│   │   ├── stores/          # Pinia状态管理
│   │   ├── services/        # API服务
│   │   ├── router/          # 路由配置
│   │   ├── assets/          # 静态资源
│   │   ├── App.vue          # 根组件
│   │   └── main.js          # 入口文件
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── supabase/                  # 数据库迁移
│   └── migrations/
│       └── 001_initial_schema.sql
│
├── README.md                  # 本文档
└── .gitignore
```

## API文档

### 认证相关
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/validate` - 验证token有效性

### 谜题管理
- `GET /api/puzzles` - 获取谜题列表（分页、筛选）
- `GET /api/puzzles/:id` - 获取单个谜题（普通用户看不到汤底）
- `POST /api/puzzles` - 创建新谜题（管理员）
- `PUT /api/puzzles/:id` - 更新谜题（管理员）
- `DELETE /api/puzzles/:id` - 删除谜题（管理员）

### 游戏相关
- `POST /api/game/start` - 开始新游戏
- `GET /api/game/session/:id` - 获取游戏会话详情
- `POST /api/game/:id/chat` - 发送问题（流式响应）
- `GET /api/game/:id/messages` - 获取对话历史
- `POST /api/game/:id/reveal` - 查看汤底
- `POST /api/game/:id/surrender` - 放弃游戏

## AI集成

### 系统提示设计
AI主持人的system prompt包含：
1. 谜题汤面（description）
2. 谜题汤底（solution）- 始终保密
3. 回答规则（是/不是/无关/部分正确）
4. 动态提示（基于对话分析）

### 防止上下文丢失
- 每次API调用都包含完整的system prompt
- 对话历史超过20轮时进行压缩
- 低temperature (0.3) 确保回答一致性

### 智能提示系统
- **连续"不是"检测**: 连续5次"不是"后触发提示
- **对话分析**: 分析问题类型和进展
- **时间触发**: 长时间无进展时提供引导

## 部署指南

### Vercel部署（推荐）

#### 后端部署
1. 连接GitHub仓库到Vercel
2. 配置环境变量（同backend/.env）
3. 构建命令: `npm install`
4. 输出目录: `backend` (设置根目录为backend)
5. 部署

#### 前端部署
1. 创建新项目连接前端
2. 配置环境变量（同frontend/.env）
3. 构建命令: `npm install && npm run build`
4. 输出目录: `frontend/dist`
5. 部署

### 自定义部署
也可部署到其他平台：
- **后端**: Railway, Render, AWS, GCP, Azure
- **前端**: Netlify, GitHub Pages, Cloudflare Pages
- **数据库**: Supabase (云服务) 或自建PostgreSQL

## 开发指南

### 添加新谜题
1. 注册管理员账号（邮箱在ADMIN_EMAILS中）
2. 登录后访问 `/admin` 页面
3. 点击"添加新谜题"填写表单
4. 或直接通过API添加

### 自定义样式
- 主样式文件: `frontend/src/assets/main.css`
- 颜色变量在 `:root` 中定义
- 组件样式使用scoped CSS

### 扩展功能
- 添加谜题分类和标签系统
- 实现成就和排行榜
- 添加多人游戏模式
- 集成更多AI模型（OpenAI, Claude等）

## 故障排除

### 常见问题

#### 1. 后端启动失败
- 检查环境变量配置
- 确认端口3001未被占用
- 查看Node.js版本(>=18)

#### 2. 数据库连接失败
- 确认Supabase URL和Key正确
- 检查网络连接
- 验证数据库表已创建

#### 3. AI服务不可用
- 检查DeepSeek API Key
- 确认API Key有足够额度
- 查看网络连接

#### 4. 前端无法连接后端
- 确认后端正在运行
- 检查CORS配置
- 查看Vite代理配置

### 日志查看
```bash
# 后端日志
cd backend && npm run dev

# 前端日志
cd frontend && npm run dev

# 浏览器控制台
F12 -> Console
```

## 贡献指南

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 许可证

MIT License - 详见LICENSE文件

## 联系方式

如有问题或建议，请通过以下方式联系：
- 创建GitHub Issue
- 提交Pull Request

---

**开始你的海龟汤推理之旅吧！** 🐢
## Vercel Deployment Notes (Monorepo, Updated 2026-02-20)

This repository deploys **frontend static files + backend serverless API** in one Vercel project.

### Required `vercel.json`

```json
{
  "version": 2,
  "name": "turtle-soup-game",
  "buildCommand": "cd frontend && npm install && npm run build && cd ../backend && npm install",
  "outputDirectory": "frontend/dist",
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/index.js" },
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### Required Environment Variables (Vercel -> Project -> Settings -> Environment Variables)

Frontend (public, bundled into browser):
- `VITE_API_URL` = `/api`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Backend (secret, server-only):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEEPSEEK_API_KEY`
- `ADMIN_EMAILS` (optional)

After adding or changing variables, you must **Redeploy**.

### Important Security Rule

- Any variable prefixed with `VITE_` is exposed to all browser users.
- Never put secret keys (e.g. `SUPABASE_SERVICE_ROLE_KEY`, `DEEPSEEK_API_KEY`) into `VITE_*` variables.

### Quick Troubleshooting

- `supabaseUrl is required` (frontend console): missing `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY`.
- `FUNCTION_INVOCATION_FAILED` (Vercel): backend function crashed, usually missing backend deps/env.
- `/api/puzzles` returns 500 while `/api/health` is 200: check Supabase project/key mismatch or missing `puzzles` table.

## 更新日志

### 2026-02-21
- **增强认证系统**: 实现完整的用户登录/注册流程，集成Supabase Auth
- **路由守卫**: 添加认证检查，保护需要登录和管理员权限的路由
- **管理员后台**: 实现完整的谜题管理界面，支持添加/编辑/删除谜题
- **表单验证**: 为登录、注册和谜题添加表单添加客户端验证
- **数据导入工具**: 添加JSON数据导入脚本和示例谜题数据
- **文档更新**: 添加GitHub登录管理指南和数据导入说明

### 2026-02-20
- **Vercel部署**: 添加monorepo部署配置和部署指南
- **环境变量安全**: 明确区分前端(VITE_)和后端环境变量

### 早期版本
- **初始版本**: 基础海龟汤游戏功能，AI集成，响应式设计
