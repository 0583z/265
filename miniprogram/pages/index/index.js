const { competitions, hallOfFame } = require('./data.js');

Page({
  data: {
    activeTab: 'home', 
    allCompetitions: [],
    filteredCompetitions: [],
    suggestions: [], 
    showSuggestions: false, 
    hallOfFame: hallOfFame,
    showEditModal: false,
    showOnboarding: false, 
    
    // 陪伴功能状态
    showCompanion: false,
    companionMessage: '',
    checkInDays: 0,
    isCheckedInToday: false,
    companionX: 300,
    companionY: 500,
    
    userName: '赵',
    userMajor: '设计',
    userGrade: '大三',
    userGoal: '就业',
    
    tempName: '',
    tempGrade: '',
    
    onboardMajor: '设计',
    onboardGoal: '就业',
    
    followedIds: [1],
    registeredIds: [2],
    searchQuery: '',
    
    // 证书与项目、海报状态
    certificates: [
      { id: '1', name: '第十四届蓝桥杯全国软件和信息技术专业人才大赛', date: '2023-06', level: '国家级二等奖' },
      { id: '2', name: '2023年全国大学生数学建模竞赛', date: '2023-09', level: '省级一等奖' }
    ],
    projects: [],
    showCertModal: false,
    showPosterModal: false,
    showAddCertForm: false,
    showAddProjectForm: false,
    showPortfolioModal: false,
    pendingCertId: '',
    newCert: { name: '', level: '国家级一等奖', date: '2024-04' },
    newProject: { name: '', s: '', t: '', a: '', r: '', skills: '' },

    // Echarts 延迟加载配置（为 echarts-for-weixin 库准备）
    ec: {
      lazyLoad: true
    }
  },

  onLoad() {
    const hasOnboarded = wx.getStorageSync('hasOnboarded');
    const savedMajor = wx.getStorageSync('userMajor') || '设计';
    const savedGoal = wx.getStorageSync('userGoal') || '就业';
    const storedCerts = wx.getStorageSync('user_certs');
    const storedProjects = wx.getStorageSync('user_projects');

    if (storedCerts) this.setData({ certificates: storedCerts });
    if (storedProjects) this.setData({ projects: storedProjects });

    // 打卡逻辑初始化
    const todayStr = new Date().toDateString();
    const lastCheckIn = wx.getStorageSync('lastCheckInDate');
    let days = wx.getStorageSync('checkInDays') || 0;
    let isCheckedIn = false;

    if (lastCheckIn === todayStr) {
      isCheckedIn = true;
    } else if (lastCheckIn) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      // 如果昨天没打卡，断签重置
      if (lastCheckIn !== yesterday.toDateString()) {
        days = 0;
      }
    }
    wx.setStorageSync('checkInDays', days); // 同步可能被重置的断签数据

    // 初始化小狐狸悬浮位置
    const sysInfo = wx.getSystemInfoSync();
    const initX = sysInfo.windowWidth - 30; // 稍微隐藏一半
    const initY = sysInfo.windowHeight - 160; // 靠下，避开底部导航和发布按钮

    const processed = this.processCompetitions(competitions);
    this.setData({
      allCompetitions: processed,
      filteredCompetitions: this.filterByGoal(processed, savedGoal, savedMajor),
      userMajor: savedMajor,
      userGoal: savedGoal,
      onboardMajor: savedMajor,
      onboardGoal: savedGoal,
      showOnboarding: !hasOnboarded,
      checkInDays: days,
      isCheckedInToday: isCheckedIn,
      companionX: initX,
      companionY: initY,
      isFoxExpanded: false
    });
  },

  processCompetitions(list) {
    if (!list) return [];
    const now = new Date();
    return list.map(comp => {
      const diff = new Date(comp.deadline).getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return { ...comp, daysLeft: days > 0 ? days : 0 };
    });
  },

  // 获取能力雷达图的 Echarts 基础配置项（模拟基于专业和获奖的基础分数）
  getRadarOption() {
    let stats = { alg: 60, ui: 60, eng: 60, doc: 60, team: 60 };
    const major = this.data.userMajor;
    if (major === '计算机' || major === '自动化' || major === '电子' || major === '理学') {
      stats.alg += 25; stats.eng += 20;
    } else if (major === '设计') {
      stats.ui += 35; stats.doc += 10;
    } else if (major === '金融' || major === '管理') {
      stats.doc += 20; stats.team += 20;
    } else {
      stats.doc += 15; stats.team += 15;
    }

    // 假设每个奖项按含金量加分
    const bonus = 2 * 5 + this.data.registeredIds.length * 2; 
    
    return {
      backgroundColor: "#f8f9fb",
      radar: {
        indicator: [
          { name: '逻辑/算法', max: 100 },
          { name: '工程开发', max: 100 },
          { name: '设计/视觉', max: 100 },
          { name: '文案/文档', max: 100 },
          { name: '团队协同', max: 100 }
        ],
        center: ['50%', '50%'],
        radius: 60,
        axisName: { color: '#666', fontSize: 10 },
        splitArea: { show: false },
        axisLine: { show: false }
      },
      series: [{
        name: '能力值',
        type: 'radar',
        data: [{
          value: [
            Math.min(100, stats.alg + bonus),
            Math.min(100, stats.eng + bonus),
            Math.min(100, stats.ui + bonus),
            Math.min(100, stats.doc + bonus),
            Math.min(100, stats.team + bonus)
          ],
          name: '能力',
          itemStyle: { color: '#003366' },
          areaStyle: { color: 'rgba(0, 51, 102, 0.2)' }
        }]
      }]
    };
  },

  filterByGoal(list, goal, major) {
    if (!list) return [];
    
    // 生成带推荐权重分数的列表
    const scoredList = list.map(comp => {
      let score = 0;
      
      // 1. 专业匹配度 (极高权重)
      const isMajorMatch = comp.major.includes(major);
      const isMajorUnlimited = comp.major.includes('不限');
      if (isMajorMatch) score += 50; 
      else if (isMajorUnlimited) score += 20;

      // 2. 目标匹配度 (高权重)
      if (comp.targetGoal === goal) score += 30;
      else if (comp.targetGoal === '通用') score += 15;

      // 3. 级别权重
      if (comp.level === '国家级') score += 10;
      else if (comp.level === '省级') score += 5;

      // 4. 计算当前与截止时间的差值（天）
      let diffDays = comp.daysLeft;
      
      if (diffDays === '已截止' || diffDays <= 0) {
        // 已截止，扣除大量分数，并特殊标记
        score -= 100; 
        diffDays = Infinity;
      } else if (diffDays <= 7) {
        // 临近截止（一周内），增加紧迫感分
        score += 20;
      } else if (diffDays <= 30) {
        score += 10;
      }

      return { ...comp, _score: score, _diffDays: diffDays };
    });

    // 智能排序：优先比较权重分数降序，其次比较剩余时间升序
    return (scoredList || [])
      .sort((a, b) => {
        if (b._score !== a._score) {
          return b._score - a._score;
        }
        return a._diffDays - b._diffDays;
      })
      .slice(0, 8); // 取最贴合的前 8 名展示
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
  },

  onSearch(e) {
    const query = e.detail.value;
    if (!query) {
      this.setData({ searchQuery: '', filteredCompetitions: this.data.allCompetitions, suggestions: [], showSuggestions: false });
      return;
    }

    const suggested = (this.data.allCompetitions || [])
      .filter(comp => comp.name && comp.name.toLowerCase().includes(query.toLowerCase()))
      .map(comp => comp.name)
      .slice(0, 5); 

    const filtered = (this.data.allCompetitions || []).filter(comp => 
      comp.name && comp.name.toLowerCase().includes(query.toLowerCase())
    );

    this.setData({ 
      searchQuery: query, 
      filteredCompetitions: filtered,
      suggestions: suggested,
      showSuggestions: suggested.length > 0
    });
  },

  selectSuggestion(e) {
    const name = e.currentTarget.dataset.name;
    const filtered = this.data.allCompetitions.filter(comp => comp.name === name);
    this.setData({ searchQuery: name, filteredCompetitions: filtered, showSuggestions: false });
  },

  hideSuggestions() {
    setTimeout(() => { this.setData({ showSuggestions: false }); }, 200); 
  },

  openEditModal() {
    this.setData({ showEditModal: true, tempName: this.data.userName, tempGrade: this.data.userGrade });
  },

  closeEditModal() {
    this.setData({ showEditModal: false });
  },

  onNameInput(e) { this.setData({ tempName: e.detail.value }); },

  onGradeChange(e) {
    const grades = ['大一', '大二', '大三', '大四', '研一', '研二', '研三'];
    this.setData({ tempGrade: grades[e.detail.value] });
  },

  saveProfile() {
    this.setData({ userName: this.data.tempName, userGrade: this.data.tempGrade, showEditModal: false });
    wx.showToast({ title: '已保存' });
  },

  changeGoal(e) { 
    const goal = e.currentTarget.dataset.goal;
    this.setData({ 
      userGoal: goal,
      filteredCompetitions: this.filterByGoal(this.data.allCompetitions, goal, this.data.userMajor)
    }); 
    wx.setStorageSync('userGoal', goal);
  },

  /* --- 新手引导方法 --- */
  onboardMajorChange(e) {
    const majors = ['设计', '计算机', '金融', '机械', '医学', '理学', '文学'];
    this.setData({ onboardMajor: majors[e.detail.value] });
  },

  selectOnboardGoal(e) {
    this.setData({ onboardGoal: e.currentTarget.dataset.goal });
  },

  completeOnboarding() {
    wx.setStorageSync('hasOnboarded', true);
    wx.setStorageSync('userMajor', this.data.onboardMajor);
    wx.setStorageSync('userGoal', this.data.onboardGoal);
    
    this.setData({
      showOnboarding: false,
      userMajor: this.data.onboardMajor,
      userGoal: this.data.onboardGoal,
      filteredCompetitions: this.filterByGoal(this.data.allCompetitions, this.data.onboardGoal, this.data.onboardMajor)
    });
    wx.showToast({ title: '已为您定制推荐', icon: 'none' });
  },

  /* --- 陪伴与打卡功能 --- */
  onFoxTap() {
    if (!this.data.isFoxExpanded) {
      // 展开并居于屏幕内侧
      this.setData({ 
        isFoxExpanded: true,
        companionX: wx.getSystemInfoSync().windowWidth - 70 
      });
      this.resetFoxTimer();
    } else {
      this.openCompanion();
    }
  },

  onFoxDragEnd(e) {
    this.setData({ isFoxExpanded: true });
    this.resetFoxTimer();
  },

  resetFoxTimer() {
    if (this.data.foxTimer) clearTimeout(this.data.foxTimer);
    const timer = setTimeout(() => {
      if (!this.data.showCompanion) {
        this.setData({ 
          isFoxExpanded: false, 
          companionX: wx.getSystemInfoSync().windowWidth - 30 
        });
      }
    }, 5000);
    this.setData({ foxTimer: timer });
  },

  openCompanion() {
    const hour = new Date().getHours();
    let timeStr = '你好';
    if (hour < 9) timeStr = '早安';
    else if (hour < 12) timeStr = '上午好';
    else if (hour < 18) timeStr = '下午好';
    else if (hour < 23) timeStr = '晚上好';
    else timeStr = '夜深了';

    const goal = this.data.userGoal;
    const isCheckedIn = this.data.isCheckedInToday;
    
    // 生成动态对话文本
    let msg = '';
    if (!isCheckedIn) {
      msg = `${timeStr}！今天还没打卡哦，想要实现【${goal}】的目标，贵在坚持，快来记录今天的努力吧！`;
    } else {
      const messages = [
        `休息一下眼睛吧，为了【${goal}】奋斗固然重要，但身体是革命的本钱哦。`,
        `真棒！你已经连续学习坚持了 ${this.data.checkInDays} 天啦，胜利就在前方！`,
        `我会一直在这里陪着你的，遇到困难的竞赛随时来查资料哦。`
      ];
      msg = messages[Math.floor(Math.random() * messages.length)];
    }

    this.setData({ showCompanion: true, companionMessage: msg });
  },

  closeCompanion() {
    this.setData({ showCompanion: false });
    this.resetFoxTimer();
  },

  doCheckIn() {
    if (this.data.isCheckedInToday) return;
    const days = this.data.checkInDays + 1;
    const todayStr = new Date().toDateString();
    
    wx.setStorageSync('checkInDays', days);
    wx.setStorageSync('lastCheckInDate', todayStr);
    
    this.setData({ 
      checkInDays: days, 
      isCheckedInToday: true,
      companionMessage: `太棒了！打卡成功 🎉！你已经连续坚持了 ${days} 天，我在未来的顶峰等你！`
    });
    
    wx.showToast({ title: '打卡成功！', icon: 'success' });
  },

  viewCertificates() {
    this.setData({ showCertModal: true });
  },

  closeCertModal() {
    this.setData({ showCertModal: false });
  },

  closePosterModal() {
    this.setData({ showPosterModal: false });
  },

  generatePoster(e) {
    const certId = e.currentTarget.dataset.id;
    const cert = this.data.certificates.find(c => c.id === certId);
    if (!cert) return;

    this.setData({ showCertModal: false, showPosterModal: true });
    
    // 短暂延迟确保 canvas 容器已渲染
    setTimeout(() => {
      this.drawCanvasPoster(cert);
    }, 200);
  },

  generateAllPoster() {
    this.setData({ showCertModal: false, showPosterModal: true });
    
    // 短暂延迟确保 canvas 容器已渲染
    setTimeout(() => {
      this.drawAllCanvasPoster();
    }, 200);
  },

  drawAllCanvasPoster() {
    const query = wx.createSelectorQuery();
    query.select('#posterCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);
        
        // 绘制深蓝渐变背景
        const grd = ctx.createLinearGradient(0, 0, 0, res[0].height);
        grd.addColorStop(0, '#001a33');
        grd.addColorStop(1, '#004080');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, res[0].width, res[0].height);

        // 绘制卡片框
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(20, 20, res[0].width - 40, res[0].height - 70);
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(25, 25, res[0].width - 50, res[0].height - 80);

        // 绘制用户头像和名字
        ctx.fillStyle = '#D4AF37';
        ctx.beginPath();
        ctx.arc(res[0].width / 2, 60, 25, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#001a33';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.data.userName.charAt(0), res[0].width / 2, 68);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(this.data.userName, res[0].width / 2, 110);
        ctx.fillStyle = '#D4AF37';
        ctx.font = '14px sans-serif';
        ctx.fillText(`累计荣获 ${this.data.certificates.length} 项荣誉`, res[0].width / 2, 135);

        // 绘制奖项列表
        let startY = 180;
        const maxDisplay = 4;
        const certs = this.data.certificates;
        
        for (let i = 0; i < Math.min(certs.length, maxDisplay); i++) {
          const cert = certs[i];
          ctx.fillStyle = 'rgba(255,255,255,0.05)';
          ctx.fillRect(35, startY - 20, res[0].width - 70, 55);
          
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'left';
          let drawName = cert.name;
          if (drawName.length > 15) drawName = drawName.substring(0, 14) + '...';
          ctx.fillText(drawName, 45, startY);
          
          ctx.fillStyle = '#D4AF37';
          ctx.font = '10px sans-serif';
          ctx.fillText(cert.level, 45, startY + 20);
          
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.textAlign = 'right';
          ctx.fillText(cert.date, res[0].width - 45, startY + 20);
          
          startY += 70;
        }

        if (certs.length > maxDisplay) {
          ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.font = '12px sans-serif';
          ctx.fillText(`...还有 ${certs.length - maxDisplay} 项成就被折叠...`, res[0].width / 2, startY);
        }

        // 绘制底部拉新文案
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '11px sans-serif';
        ctx.fillText('高校竞赛中心 · 记录你的每一次闪耀', res[0].width / 2, res[0].height - 25);
      });
  },

  drawCanvasPoster(cert) {
    const query = wx.createSelectorQuery();
    query.select('#posterCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        
        // 缩放画布，处理模糊问题（Canvas 2D 原生适配）
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);
        
        // 绘制深蓝渐变背景
        const grd = ctx.createLinearGradient(0, 0, 0, res[0].height);
        grd.addColorStop(0, '#001a33');
        grd.addColorStop(1, '#004080');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, res[0].width, res[0].height);

        // 绘制卡片框
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(20, 30, res[0].width - 40, res[0].height - 100);
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(25, 35, res[0].width - 50, res[0].height - 110);

        // 绘制用户头像和名字
        ctx.fillStyle = '#D4AF37';
        ctx.beginPath();
        ctx.arc(res[0].width / 2, 80, 30, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#001a33';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.data.userName.charAt(0), res[0].width / 2, 88);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(this.data.userName, res[0].width / 2, 140);
        ctx.fillStyle = '#D4AF37';
        ctx.font = '16px sans-serif';
        ctx.fillText('成就达成', res[0].width / 2, 170);

        // 绘制奖项信息
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px sans-serif';
        // 简易文字换行
        const words = cert.name;
        let line = '';
        let y = 230;
        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i];
          const metrics = ctx.measureText(testLine);
          if (metrics.width > (res[0].width - 100) && i > 0) {
            ctx.fillText(line, res[0].width / 2, y);
            line = words[i];
            y += 30;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, res[0].width / 2, y);

        // 绘制颁发时间和级别
        const badgeY = y + 50;
        ctx.fillStyle = '#D4AF37';
        ctx.fillRect(res[0].width / 2 - 80, badgeY, 160, 30);
        ctx.fillStyle = '#001a33';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(cert.level, res[0].width / 2, badgeY + 20);

        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '14px sans-serif';
        ctx.fillText(`荣获于 ${cert.date}`, res[0].width / 2, badgeY + 60);

        // 绘制底部拉新文案
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '12px sans-serif';
        ctx.fillText('高校竞赛中心 · 记录你的每一次闪耀', res[0].width / 2, res[0].height - 30);
      });
  },

  savePosterToPhotos() {
    const query = wx.createSelectorQuery();
    query.select('#posterCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) return;
        const canvas = res[0].node;
        wx.canvasToTempFilePath({
          canvas: canvas,
          success: (res2) => {
            wx.saveImageToPhotosAlbum({
              filePath: res2.tempFilePath,
              success: () => {
                wx.showToast({ title: '已保存至相册', icon: 'success' });
                this.closePosterModal();
              },
              fail: () => {
                wx.showToast({ title: '保存失败/取消', icon: 'none' });
              }
            });
          }
        });
      });
  },

  viewDetail(e) {
    const id = e.currentTarget.dataset.id;
    const comp = this.data.allCompetitions.find(c => c.id === id);
    if (comp) wx.showModal({ title: comp.name, content: comp.description, confirmText: '去报名' });
  },

  /* ===== 项目与作品集业务闭环 ===== */
  openAddCert() {
    this.setData({ showAddCertForm: true, showCertModal: false });
  },
  
  closeAddCert() {
    this.setData({ showAddCertForm: false, showCertModal: true });
  },

  onNewCertInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`newCert.${field}`]: e.detail.value });
  },

  submitAddCert() {
    if (!this.data.newCert.name) return wx.showToast({ title: '请输入名称', icon: 'none' });
    const cert = {
      id: Date.now().toString(),
      name: this.data.newCert.name,
      level: this.data.newCert.level,
      date: this.data.newCert.date
    };
    const newCerts = [cert, ...this.data.certificates];
    wx.setStorageSync('user_certs', newCerts);
    this.setData({ 
      certificates: newCerts, 
      showAddCertForm: false, 
      pendingCertId: cert.id,
      newCert: { name: '', level: '国家级一等奖', date: '2024-04' } // reset
    });

    // 产品驱动引导录入项目
    wx.showModal({
      title: '太棒了 🎉',
      content: '这个成就背后一定有个厉害的项目吧？要不要通过 STAR 法则记录一下实战经历，写进你的作品集里？',
      confirmText: '去记录项目',
      cancelText: '只保存奖项',
      success: (res) => {
        if (res.confirm) {
          this.setData({ showAddProjectForm: true });
        } else {
          this.setData({ showCertModal: true });
          wx.showToast({ title: '记录成功', icon: 'success' });
        }
      }
    });
  },

  closeAddProject() {
    this.setData({ showAddProjectForm: false, showCertModal: true });
  },

  onNewProjectInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`newProject.${field}`]: e.detail.value });
  },

  submitAddProject() {
    if (!this.data.newProject.name) return wx.showToast({ title: '请输入项目名称', icon: 'none' });
    const proj = {
      id: Date.now().toString(),
      certId: this.data.pendingCertId,
      name: this.data.newProject.name,
      s: this.data.newProject.s,
      t: this.data.newProject.t,
      a: this.data.newProject.a,
      r: this.data.newProject.r,
      skills: this.data.newProject.skills.split(/[,，、]+/).map(s => s.trim()).filter(Boolean)
    };
    const newProjs = [proj, ...this.data.projects];
    wx.setStorageSync('user_projects', newProjs);
    
    this.setData({ 
      projects: newProjs, 
      showAddProjectForm: false, 
      showCertModal: true,
      newProject: { name: '', s: '', t: '', a: '', r: '', skills: '' } // reset
    });
    wx.showToast({ title: '项目与能力已入库沉淀', icon: 'success' });
  },

  openPortfolio() {
    this.setData({ showPortfolioModal: true });
  },

  closePortfolio() {
    this.setData({ showPortfolioModal: false });
  },

  copyMarkdown() {
    let md = `# ${this.data.userName} 的竞赛与项目作品集\n\n`;
    md += `> "从竞赛到职场的实力沉淀"\n\n`;

    md += `## 🌟 核心技能矩阵\n`;
    const allSkills = [];
    this.data.projects.forEach(p => allSkills.push(...p.skills));
    const uniqueSkills = Array.from(new Set(allSkills));
    if (uniqueSkills.length > 0) {
      md += uniqueSkills.map(s => `\`#${s}\``).join(' ') + '\n';
    } else {
      md += `暂无项目技能标签\n`;
    }

    md += `\n## 🏆 荣誉殿堂\n`;
    if (this.data.certificates.length > 0) {
      this.data.certificates.forEach(c => {
        md += `- **${c.name}** | ${c.level} | *${c.date}*\n`;
      });
    } else {
      md += `暂无获奖记录\n`;
    }

    md += `\n## 💼 核心项目与实战解析\n`;
    if (this.data.projects.length > 0) {
      this.data.projects.forEach(p => {
        const linkedCert = this.data.certificates.find(c => c.id === p.certId);
        md += `\n### 🚀 ${p.name}\n`;
        if (linkedCert) md += `*关联成就: ${linkedCert.name}*\n\n`;
        if (p.skills.length > 0) md += `**应用技术:** ${p.skills.join(', ')}\n\n`;
        md += `- **[S] 挑战背景**: ${p.s || '见项目说明'}\n`;
        md += `- **[T] 核心任务**: ${p.t || '无'}\n`;
        md += `- **[A] 关键行动**: ${p.a || '无'}\n`;
        md += `- **[R] 最终结果**: ${p.r || '无'}\n`;
      });
    } else {
      md += `暂无项目解析记录\n`;
    }

    md += `\n---\n*由 [高校竞赛中心] 自动生成*`;

    wx.setClipboardData({
      data: md,
      success: () => {
        wx.showToast({ title: 'Markdown已复制', icon: 'success' });
      }
    });
  }
})
