极客枢纽 (Geek Hub)
4C 大学生计算机设计大赛・参赛作品一个面向开发者与竞赛备赛者的一站式协作、学习、打卡工作台平台
🌟 项目介绍
极客枢纽（Geek Hub）是一款专为编程学习者、备赛学生打造的一体化工作台工具，提供AI 辅助对话、学习打卡、进度追踪、成果管理、数据安全隔离等核心能力，支持多终端访问，让学习与备赛更高效、更安全。
本项目已通过 PostgreSQL RLS 行级安全策略 实现用户数据零信任隔离，并使用 金融级 DOMPurify XSS 防护 确保内容安全，符合竞赛数据安全要求。
🚀 在线预览
部署后可访问https:// 你的用户名.github.io/geek-hub
🧱 技术栈
前端：HTML5 + CSS3 + JavaScript / TypeScript + 响应式布局
后端：Node.js + Express
数据库：PostgreSQL（RLS 行级安全）
AI 能力：DeepSeek Chat API
安全防护：DOMPurify + Zod 输入校验 + 会话验证
部署：GitHub Pages / Vercel
🔒 安全特性（竞赛亮点）
✅ 零信任架构・PostgreSQL RLS 行级数据隔离每个用户只能访问自己的数据，超级用户也受权限约束，彻底防止越权访问
✅ 金融级 XSS 防护使用 DOMPurify 严格清洗用户输入，支持多上下文安全编码，防御存储型 / 反射型 XSS
✅ 全链路输入校验使用 Zod 进行参数校验、长度限制、非法字符过滤
✅ 完整审计日志用户操作、AI 请求、数据清洗、权限验证全程可追溯
✅ 最小权限原则数据库账号、接口权限、前端渲染权限均严格限制
📦 本地运行
1. 环境要求
Node.js >= 18
PostgreSQL（可选，如使用本地数据库）
2. 安装依赖
bash
运行
npm install
3. 环境变量配置
创建 .env.local 文件并填入：
plaintext
DEEPSEEK_API_KEY=你的AI密钥
GEMINI_API_KEY=你的Gemini密钥
DATABASE_URL=postgresql://...
4. 启动项目
bash
运行
npm run dev
访问：https://www.comp-hub.fun/
📁 项目结构
plaintext
/
├── src/              前端源代码
├── server/           后端 API 服务
├── public/           静态资源
├── sql/              PostgreSQL RLS 安全策略
├── .env.local        环境变量
└── README.md         项目说明
✨ 核心功能
AI 编程助手：支持聊天、代码解释、备赛问答
学习打卡：自动生成心情、精力、收获、卡点总结
成果管理：安全提交、展示竞赛成果
用户隔离：零信任 RLS 数据权限控制
流式响应：AI 实时打字输出
全端适配：手机 / 平板 / PC 完美适配
🔐 安全说明
本项目为竞赛安全加固版本，已实现：
PostgreSQL 行级安全（RLS）策略
用户会话验证 + IP 校验
用户输入严格校验 + XSS 清洗
AI 响应内容二次清洗
接口限流、超时保护、异常捕获
📤 部署到 GitHub
Fork 本仓库
在 Settings → Pages 中启用 GitHub Pages
选择 main 分支 → /root
等待部署完成即可访问
📝 参赛说明
本项目为 4C 大学生计算机设计大赛 正式参赛作品项目名称：极客枢纽 (Geek Hub)安全架构：零信任 + PostgreSQL RLS + 金融级 XSS 防护
📄 许可证
MIT License
