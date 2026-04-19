/**
 * 高校竞赛中心数据中心 (College Competition Hub Data Center)
 * 包含 15+ 2026年真实竞赛数据及 5+ 卷王榜（名人堂）案例
 */

const competitions = [
  {
    id: '1',
    name: '2026 第十一届中国国际“互联网+”大学生创新创业大赛',
    level: '国家级',
    category: '创新创业',
    major: ['不限'],
    techStack: ['不限'],
    deadline: '2026-06-30T23:59:59',
    registrationUrl: 'https://cy.ncss.cn/',
    historicalAwardRatio: 0.05,
    description: '覆盖面最广、影响力最大的大学生竞赛之一。'
  },
  {
    id: '2',
    name: '2026 第十七届蓝桥杯全国软件和信息技术专业人才大赛',
    level: '国家级',
    category: '程序设计',
    major: ['计算机', '软件工程', '电子信息'],
    techStack: ['C/C++', 'Java', 'Python', '嵌入式'],
    deadline: '2026-03-15T23:59:59',
    registrationUrl: 'https://dasai.lanqiao.cn/',
    historicalAwardRatio: 0.15,
    description: '国内领先的软件和信息技术专业人才竞赛。'
  },
  {
    id: '3',
    name: '2026 第十九届全国大学生智能汽车竞赛',
    level: '国家级',
    category: '机器人/自动化',
    major: ['自动化', '机械', '电子', '计算机'],
    techStack: ['嵌入式', '控制算法', '机器视觉'],
    deadline: '2026-05-20T23:59:59',
    registrationUrl: 'https://smartcar.cdhu.edu.cn/',
    historicalAwardRatio: 0.12,
    description: '以智能汽车为研究对象的创意性科技竞赛。'
  },
  {
    id: '4',
    name: '2026 全国大学生数学建模竞赛 (CUMCM)',
    level: '国家级',
    category: '数学建模',
    major: ['数学', '统计', '计算机', '理工科'],
    techStack: ['MATLAB', 'Python', 'Lingo', 'LaTeX'],
    deadline: '2026-09-10T20:00:00',
    registrationUrl: 'http://www.mcm.edu.cn/',
    historicalAwardRatio: 0.10,
    description: '培养大学生创新意识及运用数学方法解决实际问题能力。'
  },
  {
    id: '5',
    name: '2026 第十五届“挑战杯”中国大学生创业计划竞赛',
    level: '国家级',
    category: '创新创业',
    major: ['不限'],
    techStack: ['商业计划书', '路演'],
    deadline: '2026-04-30T23:59:59',
    registrationUrl: 'http://www.tiaozhanbei.net/',
    historicalAwardRatio: 0.08,
    description: '中国大学生创业的“奥林匹克”。'
  },
  {
    id: '6',
    name: '2026 第九届全国大学生计算机设计大赛',
    level: '国家级',
    category: '计算机应用',
    major: ['计算机', '数字媒体', '设计'],
    techStack: ['Web', 'App', '游戏开发', '微电影'],
    deadline: '2026-04-15T23:59:59',
    registrationUrl: 'http://jsjds.blcu.edu.cn/',
    historicalAwardRatio: 0.18,
    description: '涵盖软件开发、数字媒体设计等多个领域。'
  },
  {
    id: '7',
    name: '2026 第七届全国大学生集成电路创新创业大赛',
    level: '国家级',
    category: '电子/芯片',
    major: ['微电子', '电子信息', '集成电路'],
    techStack: ['FPGA', 'IC设计', 'Verilog'],
    deadline: '2026-03-31T23:59:59',
    registrationUrl: 'http://univ.ciciec.com/',
    historicalAwardRatio: 0.14,
    description: '助力集成电路产业人才培养。'
  },
  {
    id: '8',
    name: '2026 第十二届全国大学生机械创新设计大赛',
    level: '国家级',
    category: '机械设计',
    major: ['机械', '工业设计'],
    techStack: ['SolidWorks', 'AutoCAD', '机械原理'],
    deadline: '2026-05-10T23:59:59',
    registrationUrl: 'http://umic.com.cn/',
    historicalAwardRatio: 0.11,
    description: '提升大学生机械设计能力。'
  },
  {
    id: '9',
    name: '2026 第十八届全国大学生机器人大赛 (ROBOCON)',
    level: '国家级',
    category: '机器人',
    major: ['机械', '电子', '计算机'],
    techStack: ['ROS', '嵌入式', '机械结构'],
    deadline: '2026-02-28T23:59:59',
    registrationUrl: 'http://www.robocon.com.cn/',
    historicalAwardRatio: 0.09,
    description: '极具挑战性的机器人竞技比赛。'
  },
  {
    id: '10',
    name: '2026 第九届全国大学生光电设计竞赛',
    level: '国家级',
    category: '光电技术',
    major: ['光电', '物理', '电子'],
    techStack: ['光学设计', '传感器'],
    deadline: '2026-06-15T23:59:59',
    registrationUrl: 'http://opt.zju.edu.cn/optcontest/',
    historicalAwardRatio: 0.13,
    description: '光电信息领域的顶级赛事。'
  },
  {
    id: '11',
    name: '2026 第十四届全国大学生电子设计竞赛 (TI杯)',
    level: '国家级',
    category: '电子工程',
    major: ['电子', '通信', '自动化'],
    techStack: ['电路设计', '单片机', '信号处理'],
    deadline: '2026-07-20T23:59:59',
    registrationUrl: 'http://nuedc.xjtu.edu.cn/',
    historicalAwardRatio: 0.12,
    description: '电子信息类学科竞赛的标杆。'
  },
  {
    id: '12',
    name: '2026 第十届全国大学生信息安全竞赛',
    level: '国家级',
    category: '网络安全',
    major: ['信息安全', '计算机', '网络工程'],
    techStack: ['CTF', '渗透测试', '加密算法'],
    deadline: '2026-05-15T23:59:59',
    registrationUrl: 'http://www.ciscn.cn/',
    historicalAwardRatio: 0.10,
    description: '培养网络空间安全人才。'
  },
  {
    id: '13',
    name: '2026 第八届全国大学生艺术展演活动',
    level: '国家级',
    category: '艺术设计',
    major: ['设计', '艺术', '音乐'],
    techStack: ['视觉设计', '舞台艺术'],
    deadline: '2026-08-30T23:59:59',
    registrationUrl: 'http://www.moe.gov.cn/',
    historicalAwardRatio: 0.15,
    description: '展示大学生艺术风采。'
  },
  {
    id: '14',
    name: '2026 第十一届全国大学生电子商务“三创赛”',
    level: '国家级',
    category: '电子商务',
    major: ['电商', '管理', '计算机'],
    techStack: ['商业模式', 'Web开发'],
    deadline: '2026-03-20T23:59:59',
    registrationUrl: 'http://www.3chuang.net/',
    historicalAwardRatio: 0.16,
    description: '创意、创新、创业。'
  },
  {
    id: '15',
    name: '2026 第九届全国大学生工程训练综合能力竞赛',
    level: '国家级',
    category: '工程训练',
    major: ['机械', '材料', '工业工程'],
    techStack: ['数控加工', '智能物流'],
    deadline: '2026-04-20T23:59:59',
    registrationUrl: 'http://www.gcxl.edu.cn/',
    historicalAwardRatio: 0.11,
    description: '强化工程实践能力。'
  }
];

const hallOfFame = [
  {
    id: 'h1',
    projectName: '基于深度学习的智慧农业病虫害监测系统',
    year: 2025,
    awardLevel: '“互联网+”金奖',
    teamIntro: '来自清华大学计算机系的5人团队，跨学科结合农学院专家指导。',
    keyToSuccess: '深入田间地头调研，积累了超过10万张真实病虫害图像，模型准确率达98%。',
    major: '计算机'
  },
  {
    id: 'h2',
    projectName: '柔性高精度压力传感器及其在康复医疗中的应用',
    year: 2024,
    awardLevel: '“挑战杯”特等奖',
    teamIntro: '浙江大学材料科学与工程学院博士生领衔，具备多项专利。',
    keyToSuccess: '突破了柔性材料的灵敏度瓶颈，实现了低成本量产方案。',
    major: '材料科学'
  },
  {
    id: 'h3',
    projectName: '分布式高性能图计算引擎',
    year: 2025,
    awardLevel: '蓝桥杯全国一等奖',
    teamIntro: '华中科技大学软件学院个人参赛选手，ACM校队成员。',
    keyToSuccess: '对底层内存管理进行了深度优化，比主流开源引擎快3倍。',
    major: '软件工程'
  },
  {
    id: 'h4',
    projectName: '面向视障人士的智能导盲避障机器人',
    year: 2024,
    awardLevel: '智能汽车竞赛全国一等奖',
    teamIntro: '上海交通大学电子信息与电气工程学院团队。',
    keyToSuccess: '融合了多传感器融合算法，解决了复杂室内环境下的定位难题。',
    major: '自动化'
  },
  {
    id: 'h5',
    projectName: '城市交通流预测与信号灯协同优化算法',
    year: 2025,
    awardLevel: '数学建模竞赛国一',
    teamIntro: '复旦大学数学科学学院与大数据学院联合组队。',
    keyToSuccess: '创新性地引入了时空图卷积网络，显著提升了高峰期通行效率。',
    major: '数学'
  }
];

module.exports = {
  competitions,
  hallOfFame
};
