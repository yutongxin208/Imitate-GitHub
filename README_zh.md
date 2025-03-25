# GitHub 个人作品集

[English](README.md) | [中文](README_zh.md)

一个美观现代的 GitHub 个人作品集网站，用于展示你的 GitHub 项目、贡献和技能。本项目提供了一个清晰专业的界面，帮助你展示作品并与他人建立联系。
## 前言

仅供个人学习交流使用，请勿商用

## 特性

- 🌓 深色/浅色主题切换
- 📊 GitHub 贡献图表
- 📱 响应式设计
- 🔄 实时 GitHub 数据集成
- 📝 项目展示与详细信息
- ⭐ 星标仓库展示
- 💬 社交媒体集成
- 📱 微信和 QQ 二维码支持

## 预览

[在此添加预览图片]

## 开始使用

### 前置要求

- GitHub 账号
- HTML、CSS 和 JavaScript 基础知识
- 用于托管文件的 Web 服务器

### 安装

1. 克隆仓库：
```bash
git clone https://github.com/yourusername/github-profile-portfolio.git
cd github-profile-portfolio
```

2. 下载必要的依赖文件：
   - [github.min.css](https://github.com/sindresorhus/github-markdown-css)
   - [github-dark.min.css](https://github.com/sindresorhus/github-markdown-css)
   - [highlight.min.js](https://highlightjs.org/)
   - [marked.min.js](https://marked.js.org/)

3. 将这些文件放在项目根目录中。

### 配置

1. 更新 `index.html`：
   - 修改标题
   - 更新个人资料信息
   - 添加社交媒体链接
   - 更新页脚信息

2. 更新 `main.js`：
   - 设置你的 GitHub 用户名：
   ```javascript
   const GITHUB_USERNAME = 'yourusername';
   ```
   - 添加你的 GitHub Token（可选，但建议添加以提高 API 限制）：
   ```javascript
   const GITHUB_TOKEN = 'your_github_token';
   ```
   - 更新微信和 QQ 二维码路径：
   ```javascript
   function showWechat(event) {
       showQRCode('WeChat', 'path/to/your/wechat-qr.png', '扫描添加微信');
   }
   
   function showQQ(event) {
       showQRCode('QQ', 'path/to/your/qq-qr.png', '扫描添加QQ');
   }
   ```

3. 在 `renderOverview` 函数中自定义技术栈：
```javascript
[
    "HTML", "CSS", "JavaScript", "React", "Node.js",
    "Git", "Vue", "TypeScript", "MongoDB", "PHP",
    "Python", "MySQL", "Linux"
]
```

### GitHub Token 设置

1. 访问 GitHub 设置 > 开发者设置 > 个人访问令牌
2. 生成新令牌，需要以下权限：
   - `repo`（私有仓库的完全控制）
   - `user`（读取用户信息）
3. 复制令牌并粘贴到 `main.js` 中

## 自定义

### 主题颜色

项目使用 CSS 变量进行主题设置。你可以通过修改 `css.css` 中的变量来自定义颜色：

```css
:root {
    --color-bg-primary: #ffffff;
    --color-bg-secondary: #f6f8fa;
    --color-text-primary: #24292e;
    --color-text-secondary: #57606a;
    /* 根据需要添加更多颜色变量 */
}

[data-theme="dark"] {
    --color-bg-primary: #0d1117;
    --color-bg-secondary: #161b22;
    --color-text-primary: #c9d1d9;
    --color-text-secondary: #8b949e;
    /* 添加更多深色主题颜色变量 */
}
```

### 项目卡片

你可以通过修改 `main.js` 中的 `renderProjectCard` 函数来自定义项目卡片布局。当前实现包括：
- 项目名称
- 描述
- 语言标签
- 星标和分支数量
- 最后更新日期

### 贡献图表

贡献图表根据你的 GitHub 活动自动生成。你可以通过修改 `css.css` 中的 CSS 类来自定义其外观。

## 部署

1. 选择托管服务（GitHub Pages、Netlify、Vercel 等）
2. 将文件上传到托管服务
3. 配置域名（如果使用自定义域名）

### GitHub Pages 部署

1. 进入仓库设置
2. 导航到 "Pages"
3. 选择分支和文件夹
4. 保存设置

## 贡献

欢迎贡献！请随时提交 Pull Request。

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 致谢

- [GitHub Markdown CSS](https://github.com/sindresorhus/github-markdown-css)
- [Highlight.js](https://highlightjs.org/)
- [Marked](https://marked.js.org/)

## 支持

如果你遇到任何问题或有疑问，请在 GitHub 仓库中提出 issue。 
