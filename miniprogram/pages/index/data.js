const competitions = [
  {
    id: 1,
    name: "第十八届“挑战杯”全国大学生课外学术科技作品竞赛",
    level: "国家级",
    category: "综合",
    techStack: ["学术论文", "社会调研", "科技发明"],
    deadline: "2026-05-20T23:59:59",
    description: "“挑战杯”被誉为中国大学生科技创新创业的“奥林匹克”盛会。",
    targetGoal: "保研"
  },
  {
    id: 2,
    name: "2026年全国大学生数学建模竞赛 (CUMCM)",
    level: "国家级",
    category: "理工",
    techStack: ["MATLAB", "Python", "LaTeX"],
    deadline: "2026-09-10T20:00:00",
    description: "全国大学生数学建模竞赛是首批列入“高校竞赛排行榜”的竞赛之一。",
    targetGoal: "保研"
  },
  {
    id: 3,
    name: "第十七届蓝桥杯全国软件和信息技术专业人才大赛",
    level: "国家级",
    category: "IT/软件",
    techStack: ["C/C++", "Java", "Python"],
    deadline: "2026-03-15T23:59:59",
    description: "蓝桥杯大赛是由工业和信息化部人才交流中心主办的全国性专业赛事。",
    targetGoal: "就业"
  }
];

const hallOfFame = [
  {
    id: 1,
    projectName: "基于深度学习的校园智能导览系统",
    awardLevel: "挑战杯全国一等奖",
    teamIntro: "由5名大三学生组成的跨学科团队，历时8个月开发。"
  }
];

module.exports = {
  competitions,
  hallOfFame
};
