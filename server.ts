import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from './src/lib/db.ts';
import chatHandler from './api/chat.ts';
import { insertAiMemoryHandler, searchAiMemoryHandler } from './api/ai-memory.ts';
import mentorHandler from './api/mentor.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'geek_hub_secret_key_2026';

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: '未登录' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: '登录失效' });
    req.user = user;
    next();
  });
};

const COMPETITIONS_DATA = [
// ... (rest remains same)
  {
    "name": "中国国际“互联网+”大学生创新创业大赛",
    "level": "国家级",
    "category": "创新创业",
    "deadline": "2026-06-30T23:59:59",
    "registrationUrl": "https://cy.ncss.cn/",
    "description": "由教育部主办的覆盖面最广、影响力最大的大学生竞赛，强调商业逻辑与技术创新的闭环。",
    "major": ["不限"],
    "techStack": ["商业计划书", "路演", "产品原型"],
    "historicalAwardRatio": 0.05,
    "ai_suggestion": "项目应具有明确的社会价值或商业潜力，建议跨专业组队，吸纳财经类队员负责财务模型。"
  },
  {
    "name": "“挑战杯”全国大学生课外学术科技作品竞赛",
    "level": "国家级",
    "category": "综合",
    "deadline": "2026-04-15T23:59:59",
    "registrationUrl": "http://www.tiaozhanbei.net/",
    "description": "被誉为当代大学生科技创新的“奥林匹克”，侧重学术深度与科研成果转化。",
    "major": ["理工科", "人文社科"],
    "techStack": ["学术论文", "实验数据", "作品原型"],
    "historicalAwardRatio": 0.08,
    "ai_suggestion": "作品必须有支撑论文和实物模型，建议紧随国家重点科技发展方向进行选题。"
  },
  {
    "name": "ACM-ICPC 国际大学生程序设计竞赛",
    "level": "国家级",
    "category": "程序设计",
    "deadline": "2026-10-20T23:59:59",
    "registrationUrl": "https://icpc.global/",
    "description": "世界上规模最大、水平最高的程序设计竞赛，主要考察算法与数据结构应用技巧。",
    "major": ["计算机", "软件工程", "数学"],
    "techStack": ["C++", "算法", "数据结构"],
    "historicalAwardRatio": 0.05,
    "ai_suggestion": "三人组队需能力分工明确，分为：建模/模板手、主力代码手、纠错测试手。"
  },
  {
    "name": "全国大学生数学建模竞赛 (CUMCM)",
    "level": "国家级",
    "category": "数学建模",
    "deadline": "2026-09-10T20:00:00",
    "registrationUrl": "http://www.mcm.edu.cn/",
    "description": "培养大学生创新意识及运用数学方法解决实际问题能力的基础性竞赛。",
    "major": ["数学", "统计", "计算机"],
    "techStack": ["MATLAB", "Python", "Lingo", "LaTeX"],
    "historicalAwardRatio": 0.10,
    "ai_suggestion": "72小时全封闭备赛，论文质量是决定获奖等级的关键，注重可视化图表的呈现。"
  },
  {
    "name": "全国大学生电子设计竞赛 (NuEDC)",
    "level": "国家级",
    "category": "电子/芯片",
    "deadline": "2026-08-01T23:59:59",
    "registrationUrl": "http://nuedc.xjtu.edu.cn/",
    "description": "电子信息方向影响力最大的竞赛，考察电路设计、信号处理与单片机编程。",
    "major": ["电子信息", "自动化", "通信工程"],
    "techStack": ["电路设计", "FPGA", "STM32", "Altium Designer"],
    "historicalAwardRatio": 0.12,
    "ai_suggestion": "硬件模块化是制胜法宝，提前准备好电源、采样、稳压等标准化模块以节省时间。"
  },
  {
    "name": "蓝桥杯全国软件和信息技术专业人才大赛",
    "level": "国家级",
    "category": "程序设计",
    "deadline": "2026-03-20T23:59:59",
    "registrationUrl": "https://dasai.lanqiao.cn/",
    "description": "普及型最高的程序员大赛，赛道包含软件类、电子类、实战类等，企业认可度高。",
    "major": ["计算机", "电子", "软件"],
    "techStack": ["C++", "Java", "Python", "嵌入式"],
    "historicalAwardRatio": 0.15,
    "ai_suggestion": "难度较ACM低，适合零基础同学入门，重点刷往年省赛真题，利用好官方模拟环境。"
  },
  {
    "name": "中国大学生计算机设计大赛",
    "level": "国家级",
    "category": "程序设计",
    "deadline": "2026-05-15T23:59:59",
    "registrationUrl": "http://jsjds.blcu.edu.cn/",
    "description": "综合型计算机应用赛事，涵盖微电影、动漫游戏、软件应用、大数据等多个赛道。",
    "major": ["计算机", "数字媒体", "软件工程"],
    "techStack": ["Web", "GameDev", "Multimedia", "App"],
    "historicalAwardRatio": 0.18,
    "ai_suggestion": "作品完整性非常重要，建议结合文化创意或社会热点，UI/UX的设计也是评分重点。"
  },
  {
    "name": "全国大学生智能汽车竞赛",
    "level": "国家级",
    "category": "机器人",
    "deadline": "2026-07-20T23:59:59",
    "registrationUrl": "https://smartcar.cdhu.edu.cn/",
    "description": "考察学生在传感器感知、控制算法优化及执行器控制方面的综合设计能力。",
    "major": ["自动化", "电子信息", "机械工程"],
    "techStack": ["控制算法", "机器视觉", "嵌入式开发"],
    "historicalAwardRatio": 0.12,
    "ai_suggestion": "速度与稳定性缺一不可，PID算法的细致调优是核心，多参考卓晴老师的推文。"
  },
  {
    "name": "RoboMaster 机甲大师高校系列赛",
    "level": "国家级",
    "category": "机器人",
    "deadline": "2026-11-30T23:59:59",
    "registrationUrl": "https://www.robomaster.com/",
    "description": "大疆创新主办的明星级机器人对抗赛，涉及视觉识别、飞控算法与步兵系统设计。",
    "major": ["机械", "控制", "计算机", "电子"],
    "techStack": ["ROS", "机器视觉", "SolidWorks", "C++"],
    "historicalAwardRatio": 0.10,
    "ai_suggestion": "视觉手和嵌入式手必须有高默契，图像识别延迟要压至最低，抗干扰能力是决赛关键。"
  },
  {
    "name": "全国大学生信息安全竞赛 (CISCN)",
    "level": "国家级",
    "category": "程序设计",
    "deadline": "2026-05-10T23:59:59",
    "registrationUrl": "http://www.ciscn.cn/",
    "description": "网络安全领域最高级别竞赛，分为创新作品赛和网络安全挑战赛（CTF）。",
    "major": ["信息安全", "计算机", "网络工程"],
    "techStack": ["Web安全", "Pwn", "Reverse", "Crypto"],
    "historicalAwardRatio": 0.11,
    "ai_suggestion": "CTF赛道建议平时多刷 BuuCTF 上的题目，并沉淀一套属于自己战队的攻击脚本库。"
  },
  {
    "name": "美国大学生数学建模竞赛 (MCM/ICM)",
    "level": "国家级",
    "category": "数学建模",
    "deadline": "2026-02-01T23:59:59",
    "registrationUrl": "https://www.comap.com/",
    "description": "唯一的国际级数学建模竞赛，全英文论文形式，注重模型的新颖性与国际化视野。",
    "major": ["不限"],
    "techStack": ["Python", "LaTeX", "英语写作"],
    "historicalAwardRatio": 0.07,
    "ai_suggestion": "论文排版必须要精美，建议使用 Overleaf 协同编辑并采用一些美观的绘图配色库。"
  },
  {
    "name": "全国大学生机械创新设计大赛",
    "level": "国家级",
    "category": "机械设计",
    "deadline": "2026-05-10T23:59:59",
    "registrationUrl": "http://umic.com.cn/",
    "description": "主要考察机械原理应用、机构设计、三维建模与实物加工能力。",
    "major": ["机械工程", "工业设计"],
    "techStack": ["SolidWorks", "AutoCAD", "机械制图", "机电控制"],
    "historicalAwardRatio": 0.11,
    "ai_suggestion": "紧扣大赛双年主题，注重实物的精巧程度，复杂的机械连杆机构往往比电控更容易拿奖。"
  },
  {
    "name": "团体程序设计天梯赛 (GPLT)",
    "level": "国家级",
    "category": "程序设计",
    "deadline": "2026-04-01T23:59:59",
    "registrationUrl": "https://gplt.patest.cn/",
    "description": "强调团队协作的算法竞赛，高校计算能力的大练兵，10人一队通过总分评级。",
    "major": ["计算机", "软件", "信管"],
    "techStack": ["C/C++", "算法基础"],
    "historicalAwardRatio": 0.20,
    "ai_suggestion": "不要死磕高分难题，中低分题目的 AC 率决定了团队奖牌的底色，分秒必争。"
  },
  {
    "name": "全国大学生英语竞赛 (NECCS)",
    "level": "国家级",
    "category": "综合",
    "deadline": "2026-03-15T23:59:59",
    "registrationUrl": "http://www.chinaneccs.org/",
    "description": "全国规模最大的大学生英语单科竞赛，分为A/B/C/D四个类别。",
    "major": ["不限"],
    "techStack": ["英语笔试", "英语翻译"],
    "historicalAwardRatio": 0.15,
    "ai_suggestion": "题量极大，需要极高的阅读速度，建议针对性刷真题，特别是写作和智力题部分。"
  },
  {
    "name": "中国大学生程序设计竞赛 (CCPC)",
    "level": "国家级",
    "category": "程序设计",
    "deadline": "2026-09-20T23:59:59",
    "registrationUrl": "https://ccpc.io/",
    "description": "由中国计算机学会主办，旨在展示中国大学生的算法实力与解题技巧。",
    "major": ["计算机", "数据科学"],
    "techStack": ["算法", "数据结构", "复杂度分析"],
    "historicalAwardRatio": 0.06,
    "ai_suggestion": "相比ICPC，CCPC的题目风格更具中国特色，注重知识点的交叉运用，练习真题库是核心。"
  },
  {
    "name": "全国大学生机器人大赛 (ROBOCON)",
    "level": "国家级",
    "category": "机器人",
    "deadline": "2026-06-01T23:59:59",
    "registrationUrl": "http://www.robocon.org.cn/",
    "description": "国内技术挑战性最高的机器人赛事之一，要求极高的机械结构与电控算法配合。",
    "major": ["自动化", "机械电子"],
    "techStack": ["运动控制", "定位算法", "结构优化"],
    "historicalAwardRatio": 0.08,
    "ai_suggestion": "实测场地数据非常重要，光线、地面摩擦力都会干扰算法，要有一套鲁棒性极强的标定逻辑。"
  },
  {
    "name": "全国大学生工程训练综合能力竞赛",
    "level": "国家级",
    "category": "综合",
    "deadline": "2026-04-20T23:59:59",
    "registrationUrl": "http://www.gcxl.edu.cn/",
    "description": "涵盖智能物流搬运、水下竞赛、桥梁设计等多方面技能的工程类旗舰赛事。",
    "major": ["机械", "材料", "控制"],
    "techStack": ["智能小车", "水下机器人", "数字化协同"],
    "historicalAwardRatio": 0.11,
    "ai_suggestion": "注重工程工艺和制造精度，项目文档一定要规范，体现全生命周期的设计思路。"
  },
  {
    "name": "集成电路创新创业大赛",
    "level": "国家级",
    "category": "电子/芯片",
    "deadline": "2026-03-31T23:59:59",
    "registrationUrl": "http://univ.ciciec.com/",
    "description": "紧扣国家芯片战略，涵盖数字IC、模拟IC等设计与验证方向。",
    "major": ["微电子", "电子工程"],
    "techStack": ["Verilog", "Cadence", "VHDL"],
    "historicalAwardRatio": 0.14,
    "ai_suggestion": "建议联系有芯片流片背景的团队交流，掌握主流 EDA 工具的使用流程是入场的门票。"
  },
  {
    "name": "全国大学生集成电路创新创业大赛 (紫光杯)",
    "level": "国家级",
    "category": "电子/芯片",
    "deadline": "2026-04-30T23:59:59",
    "registrationUrl": "http://univ.ciciec.com/",
    "description": "旨在培养半导体产业紧缺人才，紧贴企业实际技术需求。",
    "major": ["电子类"],
    "techStack": ["逻辑综合", "PCB设计"],
    "historicalAwardRatio": 0.13,
    "ai_suggestion": "关注具体赛题下企业提供的 IP 核，充分利用企业资源包事半功倍。"
  },
  {
    "name": "全国大学生金相技能大赛",
    "level": "国家级",
    "category": "综合",
    "deadline": "2026-07-15T23:59:59",
    "registrationUrl": "http://www.jxjn.org.cn/",
    "description": "材料类专业的标志性实训竞赛，考察磨制、抛光技术与组织观察准确性。",
    "major": ["材料科学", "冶金"],
    "techStack": ["金相制备", "显微分析"],
    "historicalAwardRatio": 0.25,
    "ai_suggestion": "细节决定胜负，练习抛光的力度与角度，练出‘手感’是拿到金奖的唯一捷径。"
  },
  {
    "name": "中国好创意 (全国数字艺术设计大赛)",
    "level": "国家级",
    "category": "综合",
    "deadline": "2026-06-15T23:59:59",
    "registrationUrl": "https://www.cdec.org.cn/",
    "description": "数字媒体、视觉传达、工业设计等艺术类专业的核心赛事。",
    "major": ["设计", "传媒"],
    "techStack": ["C4D", "UE5", "PS", "AE"],
    "historicalAwardRatio": 0.16,
    "ai_suggestion": "故事性比单纯的效果更吸引评委，建议结合非遗文化或数字孪生技术进行创作。"
  },
  {
    "name": "“西门子杯”中国智能制造挑战赛",
    "level": "国家级",
    "category": "综合",
    "deadline": "2026-05-30T23:59:59",
    "registrationUrl": "https://www.siemenscup-smchallenge.com/",
    "description": "模拟真实工业逻辑，涉及离散行业、过程、信息化等多个技术赛项。",
    "major": ["自动化", "控制工程"],
    "techStack": ["PLC编程", "WINCC", "运动控制"],
    "historicalAwardRatio": 0.12,
    "ai_suggestion": "标准化编程风格是得分点，建议多学习 S7-1500 系统知识和博途博图的使用。"
  },
  {
    "name": "全国大学生生命科学竞赛",
    "level": "国家级",
    "category": "综合",
    "deadline": "2026-04-30T23:59:59",
    "registrationUrl": "http://www.culsc.cn/",
    "description": "生命科学领域的权威赛事，注重实验技术与创新思维的结合。",
    "major": ["生物", "医学"],
    "techStack": ["实验报告", "论文撰写"],
    "historicalAwardRatio": 0.09,
    "ai_suggestion": "实验记录本的规范程度往往也是考察点，确保数据逻辑严密且具有统计学意义。"
  },
  {
    "name": "全国大学心地图制图大赛",
    "level": "国家级",
    "category": "综合",
    "deadline": "2026-05-20T23:59:59",
    "registrationUrl": "http://www.giscontest.com.cn/",
    "description": "展示空间地理信息处理、GIS开发与地图设计能力的旗舰舞台。",
    "major": ["测绘", "GIS", "城规"],
    "techStack": ["ArcGIS", "QGIS", "SuperMap"],
    "historicalAwardRatio": 0.14,
    "ai_suggestion": "制图要符合地图美学，开发组建议集成一些 WebGL 效果展示酷炫的专题图。"
  },
  {
    "name": "全国大学生节能减排社会实践与科技竞赛",
    "level": "国家级",
    "category": "综合",
    "deadline": "2026-05-31T23:59:59",
    "registrationUrl": "http://www.jienengjianpai.org/",
    "description": "旨在培养大学生节能减排意识及创新设计能力，具有广泛的社会影响力。",
    "major": ["能源", "动力", "机械"],
    "techStack": ["热力计算", "流体分析", "低碳技术"],
    "historicalAwardRatio": 0.10,
    "ai_suggestion": "选题要贴近当前‘双碳’政策，有明确的节能指标计算或环保效益评估数据支持。"
  },
  {
    "name": "CCF 中国计算机系统与程序设计竞赛 (CCSP)",
    "level": "国家级",
    "category": "程序设计",
    "deadline": "2026-10-15T23:59:59",
    "registrationUrl": "https://ccsp.ccf.org.cn/",
    "description": "唯一考察计算系统能力的专业竞赛，侧重底层系统优化与并行计算。",
    "major": ["计算机", "计科"],
    "techStack": ["C++", "OS优化", "分布式系统"],
    "historicalAwardRatio": 0.12,
    "ai_suggestion": "这是硬核高手的舞台，除了算法，还要深入钻研计算机体系结构、缓存一致性等底层原理。"
  },
  {
    "name": "全国大学生电子商务“三创赛”",
    "level": "国家级",
    "category": "综合",
    "deadline": "2026-03-20T23:59:59",
    "registrationUrl": "http://www.3chuang.net/",
    "description": "最具人气的经管兼职计算机应用赛事，强调创意、创新、创业整合能力。",
    "major": ["管理", "电商", "不限"],
    "techStack": ["Web应用", "商业模式"],
    "historicalAwardRatio": 0.16,
    "ai_suggestion": "技术难度通常不高，但商业落地的可行性是夺冠关键，PPT和现场演讲非常有决定权。"
  },
  {
    "name": "全国大学生地质技能竞赛",
    "level": "国家级",
    "category": "综合",
    "deadline": "2026-05-25T23:59:59",
    "registrationUrl": "http://www.cdut.edu.cn/",
    "description": "地质学子最高水平竞技平台，涵盖野外地质调查与地质绘图技巧。",
    "major": ["地质", "资源勘查"],
    "techStack": ["三维地质建模", "地层分析"],
    "historicalAwardRatio": 0.11,
    "ai_suggestion": "关注岩矿鉴定部分，这部分最容易拉开分差，基本功要扎实。"
  },
  {
    "name": "全国大学生结构设计竞赛",
    "level": "国家级",
    "category": "综合",
    "deadline": "2026-08-30T23:59:59",
    "registrationUrl": "http://www.struct.com.cn/",
    "description": "土木工程学科含金量最高的‘竞赛之冠’，手工制作木模加载实验极其硬核。",
    "major": ["土木", "水利", "工程力学"],
    "techStack": ["力学模型", "结构设计"],
    "historicalAwardRatio": 0.08,
    "ai_suggestion": "控制重量是核心，利用好竹材的受拉性能，结构体系要具备极强的耗能能力。"
  },
  {
    "name": "全球校园人工智能算法精英赛",
    "level": "国家级",
    "category": "综合",
    "deadline": "2026-10-30T23:59:59",
    "registrationUrl": "http://www.digix-contest.com/",
    "description": "头部厂商支持的 AI 算法盛宴，涵盖 CV、NLP、推荐系统等多种经典场景。",
    "major": ["AI", "计算机"],
    "techStack": ["PyTorch", "TensorFlow", "特征工程"],
    "historicalAwardRatio": 0.10,
    "ai_suggestion": "模型融合和细致的特征工程是提升排名的不二法门，关注各个赛题的 Baseline 优化。"
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors({
    origin: true,
    credentials: true
  }));
  app.use(express.json());
  app.use(cookieParser());

  // Simple Request Logger
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // AI Chat/Extract route
  app.post('/api/chat', async (req, res) => {
    try {
      await chatHandler(req as any, res as any);
    } catch (error) {
      console.error('API Bridge Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/api/ai/memory', (req, res) => void insertAiMemoryHandler(req, res));
  app.post('/api/ai/memory/search', (req, res) => void searchAiMemoryHandler(req, res));
  app.post('/api/mentor', (req, res) => void mentorHandler(req as any, res as any));

  // --- Auth Routes ---
  app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = uuidv4();
      
      db.prepare('INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)').run(
        userId, username, email, hashedPassword
      );
      
      const token = jwt.sign({ id: userId, username, email }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('auth_token', token, { 
        httpOnly: true, 
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'none',
        secure: true
      });
      res.status(201).json({ user: { id: userId, username, email } });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        return res.status(400).json({ error: '该邮箱已被注册' });
      }
      res.status(500).json({ error: '注册失败' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: '邮箱或密码错误' });
      }

      const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('auth_token', token, { 
        httpOnly: true, 
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'none',
        secure: true
      });
      res.json({ user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
      res.status(500).json({ error: '登录失败' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({ message: '已退出登录' });
  });

  app.get('/api/auth/me', (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ error: '未登录' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      res.json({ user: decoded });
    } catch (error) {
      res.status(401).json({ error: '无效 Token' });
    }
  });

  // --- Profile Routes ---
  app.get('/api/profile', authenticateToken, (req: any, res) => {
    try {
      const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.user.id);
      const awards = db.prepare('SELECT * FROM user_awards WHERE user_id = ?').all(req.user.id);
      res.json({ profile, awards });
    } catch (error) {
      console.error('Fetch Profile Error:', error);
      res.status(500).json({ error: '获取资料失败' });
    }
  });

  app.post('/api/profile', authenticateToken, (req: any, res) => {
    const { full_name, major, bio, skills, github_url } = req.body;
    try {
      db.prepare(`
        INSERT INTO profiles (id, full_name, major, bio, skills, github_url, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          full_name=excluded.full_name,
          major=excluded.major,
          bio=excluded.bio,
          skills=excluded.skills,
          github_url=excluded.github_url,
          updated_at=CURRENT_TIMESTAMP
      `).run(req.user.id, full_name, major, bio, JSON.stringify(skills), github_url);
      res.json({ message: '保存成功' });
    } catch (error) {
      res.status(500).json({ error: '保存失败' });
    }
  });

  app.post('/api/profile/awards', authenticateToken, (req: any, res) => {
    const { competition_name, award_level, date } = req.body;
    try {
      const awardId = uuidv4();
      db.prepare('INSERT INTO user_awards (id, user_id, competition_name, award_level, date) VALUES (?, ?, ?, ?, ?)').run(
        awardId, req.user.id, competition_name, award_level, date
      );
      res.json({ id: awardId });
    } catch (error) {
      res.status(500).json({ error: '添加获奖记录失败' });
    }
  });

  // --- Subscription Routes ---
  app.get('/api/subscriptions', authenticateToken, (req: any, res) => {
    try {
      const subs = db.prepare(`
        SELECT s.*, c.name, c.deadline, c.level, c.category
        FROM subscriptions s
        JOIN competitions c ON s.competition_id = c.id
        WHERE s.user_id = ?
      `).all(req.user.id);
      res.json(subs);
    } catch (error) {
      res.status(500).json({ error: '获取订阅列表失败' });
    }
  });

  app.post('/api/competitions/:id/subscribe', authenticateToken, (req: any, res) => {
    const competitionId = req.params.id;
    try {
      const existing = db.prepare('SELECT id FROM subscriptions WHERE user_id = ? AND competition_id = ?')
        .get(req.user.id, competitionId);

      if (existing) {
        db.prepare('DELETE FROM subscriptions WHERE user_id = ? AND competition_id = ?')
          .run(req.user.id, competitionId);
        res.json({ subscribed: false, message: '已取消订阅' });
      } else {
        db.prepare('INSERT INTO subscriptions (id, user_id, competition_id) VALUES (?, ?, ?)')
          .run(uuidv4(), req.user.id, competitionId);
        res.json({ subscribed: true, message: '订阅成功' });
      }
    } catch (error) {
      res.status(500).json({ error: '订阅操作失败' });
    }
  });

  // --- Notification Routes ---
  app.get('/api/notifications', authenticateToken, (req: any, res) => {
    try {
      const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC')
        .all(req.user.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: '获取通知失败' });
    }
  });

  app.patch('/api/notifications/:id/read', authenticateToken, (req: any, res) => {
    try {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
        .run(req.params.id, req.user.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: '更新通知状态失败' });
    }
  });

  app.delete('/api/profile/awards/:id', authenticateToken, (req: any, res) => {
    try {
      db.prepare('DELETE FROM user_awards WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
      res.json({ message: '删除成功' });
    } catch (error) {
      res.status(500).json({ error: '删除失败' });
    }
  });

  // GET: Fetch all competitions
  app.get('/api/competitions', async (req, res) => {
    try {
      const rows = db.prepare('SELECT * FROM competitions ORDER BY created_at DESC').all();
      const data = rows.map((r: any) => ({
        ...r,
        major: JSON.parse(r.major || '[]'),
        techStack: JSON.parse(r.techStack || '[]')
      }));
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ error: '获取赛事失败' });
    }
  });

  // Seed competitions
  app.post('/api/sync-competitions', async (req, res) => {
    try {
      const insert = db.prepare(`
        INSERT INTO competitions (id, name, level, category, deadline, registrationUrl, description, major, techStack, historicalAwardRatio, ai_suggestion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(name) DO UPDATE SET
          level=excluded.level,
          category=excluded.category,
          deadline=excluded.deadline,
          registrationUrl=excluded.registrationUrl,
          description=excluded.description,
          major=excluded.major,
          techStack=excluded.techStack,
          historicalAwardRatio=excluded.historicalAwardRatio,
          ai_suggestion=excluded.ai_suggestion
      `);
      
      const transaction = db.transaction((comps) => {
        for (const comp of comps) {
          insert.run(
            uuidv4(), comp.name, comp.level, comp.category, comp.deadline,
            comp.registrationUrl, comp.description, JSON.stringify(comp.major),
            JSON.stringify(comp.techStack), comp.historicalAwardRatio, comp.ai_suggestion
          );
        }
      });
      
      transaction(COMPETITIONS_DATA);
      res.status(200).json({ message: '同步成功！', count: COMPETITIONS_DATA.length });
    } catch (error) {
      res.status(500).json({ error: '同步失败' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // --- Background Deadline Checker ---
  const checkDeadlines = () => {
    console.log('[Background] Checking competition deadlines...');
    try {
      const now = new Date();
      const threeDaysLater = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
      
      // Get competitions closing in next 3 days
      const nearDeadlines = db.prepare(`
        SELECT id, name, deadline FROM competitions 
        WHERE deadline >= ? AND deadline <= ?
      `).all(now.toISOString(), threeDaysLater.toISOString());

      for (const comp of (nearDeadlines as any[])) {
        // Find subscribers who haven't been notified for this comp's specific deadline yet
        // For simplicity, we check if a notification with this title exists for the user
        const subscribers = db.prepare('SELECT user_id FROM subscriptions WHERE competition_id = ?').all(comp.id);
        
        for (const sub of (subscribers as any[])) {
          const title = `🚨 截止预警：${comp.name}`;
          const existing = db.prepare('SELECT id FROM notifications WHERE user_id = ? AND title = ?').get(sub.user_id, title);
          
          if (!existing) {
            db.prepare(`
              INSERT INTO notifications (id, user_id, title, message, type)
              VALUES (?, ?, ?, ?, 'deadline')
            `).run(
              uuidv4(), 
              sub.user_id, 
              title, 
              `你订阅的竞赛《${comp.name}》即将在 ${comp.deadline.split('T')[0]} 截止报名，请尽快完善作品！`
            );
          }
        }
      }
    } catch (error) {
      console.error('Deadline Checker Error:', error);
    }
  };

  // Run on start and every 12 hours
  checkDeadlines();
  setInterval(checkDeadlines, 12 * 60 * 60 * 1000);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
