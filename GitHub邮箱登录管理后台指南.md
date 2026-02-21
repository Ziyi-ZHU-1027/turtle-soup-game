# GitHub邮箱登录管理后台指南

由于您使用GitHub登录Supabase，而当前系统使用的是邮箱/密码登录方式，您需要为GitHub关联的邮箱设置密码才能登录管理后台。

## 📋 前提条件

### 1. 确认管理员邮箱
您的管理员邮箱已在环境变量中配置为：
```
ziyi.zhu1027@gmail.com
```

请确保这个邮箱与您的GitHub账户关联的邮箱一致。

### 2. 检查邮箱一致性
1. 访问 [GitHub Settings → Emails](https://github.com/settings/emails)
2. 确认 `ziyi.zhu1027@gmail.com` 是您的GitHub关联邮箱
3. 如果不是，您需要：
   - 在Supabase中修改用户邮箱，或
   - 更新环境变量中的管理员邮箱

## 🛠️ 设置密码步骤

### 步骤1：登录Supabase Dashboard
1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 选择您的项目：`wtvuohafjgdkffxnriyq`

### 步骤2：进入用户管理
1. 左侧菜单选择 **Authentication**
2. 选择 **Users** 标签页
3. 在用户列表中找到您的邮箱 `ziyi.zhu1027@gmail.com`

> **注意**：如果看不到用户，可能需要：
> - 检查邮箱是否正确
> - 确保您已通过GitHub登录过该Supabase项目

### 步骤3：设置密码
1. 点击用户行右侧的 **...** 按钮
2. 选择 **Reset password** 或 **Update password**
3. 按照提示设置新密码
4. 保存更改

### 步骤4：验证密码设置
1. 尝试使用邮箱和新密码登录
2. 访问：`http://localhost:5173/login`
3. 使用：
   - **邮箱**：`ziyi.zhu1027@gmail.com`
   - **密码**：您刚刚设置的新密码

## 🔐 登录测试

### 测试流程：
```bash
# 1. 启动后端服务
cd backend
npm run dev

# 2. 启动前端服务
cd frontend
npm run dev

# 3. 访问登录页
# 打开浏览器访问：http://localhost:5173/login

# 4. 使用管理员邮箱登录
邮箱：ziyi.zhu1027@gmail.com
密码：您设置的新密码
```

### 预期结果：
1. ✅ 登录成功，没有错误提示
2. ✅ 自动跳转到管理后台 (`/admin`)
3. ✅ 管理界面显示谜题列表
4. ✅ 可以添加新谜题

## 🔧 故障排除

### 问题1：找不到用户
**症状**：在Supabase Users列表中看不到您的邮箱
**解决**：
1. 使用GitHub OAuth重新登录一次Supabase项目
2. 访问您的应用，使用"游客继续"进入
3. 检查Supabase Authentication → Users是否出现新用户
4. 或者联系Supabase支持

### 问题2：密码设置无效
**症状**：设置了密码但仍无法登录
**解决**：
1. 在Supabase中尝试"Send invite"而不是"Reset password"
2. 检查用户状态是否为"Active"
3. 确认邮箱已验证（GitHub邮箱通常已自动验证）

### 问题3：权限错误
**症状**：登录成功但无法访问`/admin`
**解决**：
```bash
# 检查环境变量
cat backend/.env | grep ADMIN_EMAILS
cat frontend/.env | grep VITE_ADMIN_EMAILS

# 确保前后端配置的邮箱完全一致
# 包括大小写和空格
```

### 问题4：其他认证错误
**症状**：登录时显示各种错误
**解决**：
1. 检查浏览器控制台错误
2. 检查网络请求状态
3. 尝试清除浏览器缓存和Cookie
4. 使用隐私模式测试

## 📝 环境变量配置参考

### 前端配置 (`frontend/.env`)：
```env
VITE_ADMIN_EMAILS=ziyi.zhu1027@gmail.com
VITE_SUPABASE_URL=https://wtvuohafjgdkffxnriyq.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_Hoe2LBekEWxAHSkNSFUC2w_Ig3tdWe1
```

### 后端配置 (`backend/.env`)：
```env
ADMIN_EMAILS=ziyi.zhu1027@gmail.com
SUPABASE_URL=https://wtvuohafjgdkffxnriyq.supabase.co
SUPABASE_ANON_KEY=sb_publishable_Hoe2LBekEWxAHSkNSFUC2w_Ig3tdWe1
SUPABASE_SERVICE_ROLE_KEY=sb_secret_3i4icKleYlEptizaOODyaw_s1DRS2GU
```

## 🔄 备选方案：添加GitHub OAuth

如果您希望使用GitHub直接登录（无需设置密码），我们可以：

1. **在Supabase中配置GitHub OAuth**：
   - 获取GitHub OAuth App的Client ID和Secret
   - 在Supabase Authentication → Providers中配置

2. **在前端添加GitHub登录按钮**：
   ```javascript
   // 在LoginView.vue中添加
   const loginWithGitHub = async () => {
     const { error } = await supabase.auth.signInWithOAuth({
       provider: 'github',
       options: {
         redirectTo: 'http://localhost:5173/auth/callback'
       }
     })
   }
   ```

3. **处理OAuth回调**：
   - 添加回调路由
   - 验证用户权限
   - 跳转到管理后台

## 🆘 快速帮助

### 需要立即测试？
```bash
# 快速测试API连接
curl -X POST "https://wtvuohafjgdkffxnriyq.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: sb_publishable_Hoe2LBekEWxAHSkNSFUC2w_Ig3tdWe1" \
  -H "Content-Type: application/json" \
  -d '{"email": "ziyi.zhu1027@gmail.com", "password": "您的密码"}'
```

### 联系支持：
- **Supabase支持**：Dashboard中的Help按钮
- **项目文档**：[README.md](README.md)
- **代码问题**：检查GitHub仓库的Issues

## ✅ 验证清单

完成以下步骤后，您应该能够成功登录：

- [ ] GitHub邮箱与管理员邮箱一致
- [ ] 在Supabase Users中看到您的用户
- [ ] 成功设置了密码
- [ ] 环境变量配置正确
- [ ] 前后端服务正常运行
- [ ] 可以访问登录页面
- [ ] 使用邮箱/密码登录成功
- [ ] 自动跳转到管理后台
- [ ] 可以查看和添加谜题

## 📞 需要进一步帮助？

如果按照本指南操作后仍无法登录，请提供：

1. **错误截图**：登录时的错误信息
2. **控制台输出**：浏览器开发者工具中的错误
3. **步骤描述**：您具体做了哪些操作
4. **环境信息**：操作系统、浏览器版本

我会帮助您解决具体问题。

---

*最后更新：2026年2月21日*
*祝您登录顺利！*