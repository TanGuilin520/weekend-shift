/* ==========================================================
 * 周末单 · 大学生周末兼职撮合平台（网页原型）
 * data.js — 演示种子数据 / 持久化 / 匹配算法
 * 纯前端，无任何依赖
 * ========================================================== */

var STORE_KEY = 'zhoumodan.prototype.v1';

/* ---------------- 周末时间片 ---------------- */
var SLOTS = [
  { id: 'fri-eve', day: '周五', time: '18:00-22:00', label: '周五晚' },
  { id: 'sat-am',  day: '周六', time: '09:00-12:00', label: '周六上午' },
  { id: 'sat-pm',  day: '周六', time: '13:00-18:00', label: '周六下午' },
  { id: 'sat-eve', day: '周六', time: '18:00-22:00', label: '周六晚' },
  { id: 'sun-am',  day: '周日', time: '09:00-12:00', label: '周日上午' },
  { id: 'sun-pm',  day: '周日', time: '13:00-18:00', label: '周日下午' },
  { id: 'sun-eve', day: '周日', time: '18:00-22:00', label: '周日晚' }
];

function slotOf(id) { for (var i = 0; i < SLOTS.length; i++) if (SLOTS[i].id === id) return SLOTS[i]; return null; }
function slotText(id) { var s = slotOf(id); return s ? s.day + ' ' + s.time : id; }
function slotLabel(id) { var s = slotOf(id); return s ? s.label : id; }

/* ---------------- 类目 ---------------- */
var CATS = ['餐饮帮工', '零售促销', '活动执行', '仓储分拣', '校内勤工'];
var ALL_TAGS = ['餐饮服务', '收银', '促销', '物料搬运', '活动执行', '主持', '摄影', '外语', '理货', '客服'];

/* ---------------- 订单状态表 ---------------- */
var ORDER_STATUS = {
  applied:     { text: '待商家录用', tone: 'amber' },
  hired:       { text: '已录用 · 待到岗', tone: 'blue' },
  checked_in:  { text: '已签到 · 工作中', tone: 'green' },
  checked_out: { text: '已签退 · 待确认工时', tone: 'amber' },
  confirmed:   { text: '工时已确认 · 待结算', tone: 'blue' },
  settled:     { text: '已结算', tone: 'green' },
  done:        { text: '已完成', tone: 'green' },
  rejected:    { text: '未录用', tone: 'gray' },
  cancelled:   { text: '已取消', tone: 'gray' },
  disputed:    { text: '争议处理中', tone: 'red' }
};

var ACTIVE_ORDER_STATUS = ['applied', 'hired', 'checked_in', 'checked_out', 'confirmed'];

/* ==========================================================
 * 种子数据
 * ========================================================== */
function seed() {
  var T = Date.now();
  var H = 3600 * 1000;

  return {
    meta: { born: T, demoStep: 0, seq: 100 },

    /* ---------- 学生 ---------- */
    students: [
      {
        id: 's1', name: '林小雨', avatar: '林', gender: '女',
        school: '江城大学', campus: '东湖校区', grade: '大二', phone: '138****2233',
        credit: 735, expectPay: 18, maxDist: 3,
        avail: ['sat-am', 'sat-pm', 'sat-eve', 'sun-am', 'sun-pm'],
        tags: ['餐饮服务', '收银', '促销'],
        cert: { real: true, school: true, health: false },
        completed: 12, noShow: 0, cancel: 0, rating: 4.9,
        wallet: { balance: 264 },
        goal: { name: '换一副新耳机', target: 800, saved: 264 },
        emergency: { name: '妈妈', phone: '139****8877' },
        records: [
          { id: 'rec1', title: '周六晚高峰传菜员', merchant: '巷子口老火锅', when: '上周六', amount: 110, rating: 5, comment: '干活麻利，准时到岗' },
          { id: 'rec2', title: '门店理货', merchant: '潮玩数码体验店', when: '上上周日', amount: 154, rating: 4, comment: '认真负责' }
        ]
      },
      {
        id: 's2', name: '陈子豪', avatar: '陈', gender: '男',
        school: '江城大学', campus: '东湖校区', grade: '大三', phone: '150****6688',
        credit: 620, expectPay: 20, maxDist: 5,
        avail: ['sat-eve', 'sun-pm', 'sun-eve'],
        tags: ['物料搬运', '活动执行'],
        cert: { real: true, school: true, health: false },
        completed: 5, noShow: 1, cancel: 1, rating: 4.5,
        wallet: { balance: 90 },
        goal: { name: '攒钱买相机', target: 3000, saved: 640 },
        emergency: { name: '爸爸', phone: '137****1122' },
        records: [
          { id: 'rec3', title: '马拉松物料发放', merchant: '城市马拉松赛事服务', when: '上上周六', amount: 120, rating: 4, comment: '力气大' }
        ]
      },
      {
        id: 's3', name: '周晓萌', avatar: '周', gender: '女',
        school: '江城大学', campus: '东湖校区', grade: '大一', phone: '186****3344',
        credit: 600, expectPay: 16, maxDist: 2,
        avail: ['sat-am', 'sat-pm', 'sun-am', 'sun-pm'],
        tags: [],
        cert: { real: false, school: false, health: false },
        completed: 0, noShow: 0, cancel: 0, rating: 0,
        wallet: { balance: 0 },
        goal: { name: '第一笔兼职收入', target: 300, saved: 0 },
        emergency: null,
        records: []
      }
    ],

    /* ---------- 商家 ---------- */
    merchants: [
      {
        id: 'm1', name: '巷子口老火锅', avatar: '火', cat: '餐饮帮工',
        addr: '大学城商业街 12 号', dist: 0.8, credit: 780, rating: 4.8,
        orders: 46, verified: true, noShowRate: 0.02,
        license: '91420100MA4K****XG', contact: '王店长', phone: '027-8888****',
        photos: 3, tags: ['包工作餐', '有空调', '近地铁']
      },
      {
        id: 'm2', name: '潮玩数码体验店', avatar: '潮', cat: '零售促销',
        addr: '东湖购物中心 3F-08', dist: 1.6, credit: 690, rating: 4.6,
        orders: 21, verified: true, noShowRate: 0.05,
        license: '91420100MA4K****PD', contact: '李经理', phone: '027-8666****',
        photos: 5, tags: ['销售提成', '正规合同', '提供正装']
      },
      {
        id: 'm3', name: '城市马拉松赛事服务', avatar: '赛', cat: '活动执行',
        addr: '滨江体育中心', dist: 2.4, credit: 810, rating: 4.9,
        orders: 8, verified: true, noShowRate: 0.01,
        license: '91420100MA4K****TY', contact: '赵主管', phone: '027-8555****',
        photos: 2, tags: ['日结', '含早餐', '统一班车']
      },
      {
        id: 'm4', name: '江城大学学生会', avatar: '学', cat: '校内勤工',
        addr: '大学生活动中心 205', dist: 0.3, credit: 900, rating: 5.0,
        orders: 12, verified: true, noShowRate: 0.0,
        license: '校园组织认证', contact: '张同学', phone: '156****7788',
        photos: 1, tags: ['校内', '免抽佣', '轻松']
      },
      {
        id: 'm5', name: '深夜烧烤吧', avatar: '烧', cat: '餐饮帮工',
        addr: '夜市后街 4 号', dist: 2.9, credit: 0, rating: 0,
        orders: 0, verified: false, noShowRate: 0,
        license: '待核验', contact: '刘老板', phone: '133****9900',
        photos: 0, tags: []
      }
    ],

    /* ---------- 岗位 ---------- */
    jobs: [
      {
        id: 'j1', merchantId: 'm1', title: '周六晚高峰传菜员', cat: '餐饮帮工',
        slots: ['sat-eve'], pay: 22, hours: 5, headcount: 2, mode: 'apply',
        req: { credit: 600, tags: [], health: false, minAge: 18 },
        desc: '负责传菜、收拾桌面、简单引导。有老员工带，不需要经验。包一顿工作餐，工服店里提供。',
        bonus: '满 5 小时 +20 元全勤奖', status: 'online', urgent: false, createdAt: T - 30 * H, views: 218
      },
      {
        id: 'j2', merchantId: 'm1', title: '周六午市帮工（先到先得）', cat: '餐饮帮工',
        slots: ['sat-pm'], pay: 20, hours: 5, headcount: 1, mode: 'grab',
        req: { credit: 600, tags: [], health: false, minAge: 18 },
        desc: '午市高峰 11:30-14:00 最忙，其余时间备菜、擦桌。适合住在附近、想快速上手的同学。',
        bonus: '包午餐', status: 'online', urgent: false, createdAt: T - 20 * H, views: 143
      },
      {
        id: 'j3', merchantId: 'm2', title: '新店开业促销员', cat: '零售促销',
        slots: ['sat-am', 'sat-pm'], pay: 25, hours: 8, headcount: 3, mode: 'apply',
        req: { credit: 650, tags: ['促销'], health: false, minAge: 18 },
        desc: '引导顾客体验产品、发放开业礼品、登记会员。需要表达清晰、能站 8 小时，请着正装（提供）。',
        bonus: '销售额 2% 提成 + 午饭补贴 15 元', status: 'online', urgent: false, createdAt: T - 50 * H, views: 396
      },
      {
        id: 'j4', merchantId: 'm2', title: '周日门店理货', cat: '零售促销',
        slots: ['sun-am', 'sun-pm'], pay: 19, hours: 8, headcount: 2, mode: 'grab',
        req: { credit: 600, tags: ['理货'], health: false, minAge: 18 },
        desc: '上架补货、整理货架、拆箱贴标。体力活，男生女生都可以，有推车。',
        bonus: '包午餐', status: 'online', urgent: false, createdAt: T - 12 * H, views: 87
      },
      {
        id: 'j5', merchantId: 'm3', title: '马拉松物料发放（急招）', cat: '活动执行',
        slots: ['sat-am'], pay: 30, hours: 4, headcount: 20, mode: 'grab',
        req: { credit: 650, tags: [], health: false, minAge: 18 },
        desc: '6:00 滨江体育中心集合，发放参赛包、引导选手。含早餐与往返班车，当天日结。',
        bonus: '含早餐 + 班车 + 活动证书', status: 'online', urgent: true, createdAt: T - 6 * H, views: 512
      },
      {
        id: 'j6', merchantId: 'm3', title: '展会引导员', cat: '活动执行',
        slots: ['sun-pm'], pay: 28, hours: 5, headcount: 10, mode: 'apply',
        req: { credit: 700, tags: ['活动执行', '外语'], health: false, minAge: 18 },
        desc: '展厅入口引导、答疑、维持秩序。要求形象整洁、普通话标准，会简单英语优先。',
        bonus: '日结 + 提供工牌', status: 'online', urgent: false, createdAt: T - 9 * H, views: 264
      },
      {
        id: 'j7', merchantId: 'm4', title: '校园招聘会现场协助', cat: '校内勤工',
        slots: ['sun-pm'], pay: 15, hours: 4, headcount: 6, mode: 'apply',
        req: { credit: 500, tags: [], health: false, minAge: 18 },
        desc: '引导企业入场、发放资料、维持秩序。校内岗位，走路 5 分钟，学校勤工助学补贴。',
        bonus: '志愿时长证明', status: 'online', urgent: false, createdAt: T - 4 * H, views: 132
      },
      {
        id: 'j8', merchantId: 'm5', title: '夜市烧烤帮工（待审核）', cat: '餐饮帮工',
        slots: ['fri-eve', 'sat-eve'], pay: 26, hours: 5, headcount: 2, mode: 'apply',
        req: { credit: 600, tags: [], health: false, minAge: 18 },
        desc: '穿串、上菜、收桌。',
        bonus: '包宵夜', status: 'pending', urgent: false, createdAt: T - 2 * H, views: 0
      }
    ],

    /* ---------- 订单 ---------- */
    orders: [
      {
        id: 'o1', jobId: 'j4', studentId: 's2', merchantId: 'm2',
        status: 'applied', pay: 19, hours: 8, amount: 152,
        slot: 'sun-am', intro: '做过一次理货，能搬能扛',
        createdAt: T - 3 * H, checkIn: null, checkOut: null,
        confirmAt: null, settledAt: null, review: null, theirReview: null
      }
    ],

    /* ---------- 消息 ---------- */
    messages: [
      { id: 'msg1', to: 's1', type: 'system', title: '欢迎来到周末单', body: '完成学生认证即可报名周末兼职，平台资金托管，干完 T+1 到账。', time: T - 40 * H, read: false },
      { id: 'msg2', to: 's2', type: 'system', title: '报名成功', body: '你已报名「周日门店理货」，商家将在 24 小时内处理。', time: T - 3 * H, read: false },
      { id: 'msg3', to: 'm1', type: 'system', title: '岗位审核通过', body: '「周六晚高峰传菜员」已上线，正在向匹配学生推送。', time: T - 29 * H, read: true }
    ],

    /* ---------- 工单 / 投诉 ---------- */
    tickets: [
      {
        id: 'tk1', type: '结算纠纷', from: 's2', target: 'm2', orderId: '-',
        title: '上上周理货工时少算了 1 小时', detail: '我 13:00 到店，签退显示 17:00，实际干到 18:00。',
        status: 'open', createdAt: T - 26 * H, handler: '', result: ''
      }
    ],

    /* ---------- 审核队列（由 pending 商家/岗位派生，此处补充历史记录） ---------- */
    audits: [
      { id: 'au1', kind: 'merchant', refId: 'm5', status: 'pending', note: '营业执照待核验，门头照缺失', createdAt: T - 4 * H },
      { id: 'au2', kind: 'job', refId: 'j8', status: 'pending', note: '自动校验：夜市类目 + 无健康证要求，人工复核', createdAt: T - 2 * H }
    ],

    logs: []
  };
}

/* ==========================================================
 * 持久化
 * ========================================================== */
var DB = null;
var MEM_FALLBACK = false;

function loadDB() {
  try {
    var raw = localStorage.getItem(STORE_KEY);
    if (raw) { DB = JSON.parse(raw); if (DB && DB.students) return; }
  } catch (e) { MEM_FALLBACK = true; }
  DB = seed();
  saveDB();
}

function saveDB() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); } catch (e) { MEM_FALLBACK = true; }
}

function resetDB() { DB = seed(); saveDB(); }

function uid(prefix) { DB.meta.seq = (DB.meta.seq || 100) + 1; return prefix + DB.meta.seq; }

/* ==========================================================
 * 查询辅助
 * ========================================================== */
function studentById(id) { return DB.students.filter(function (s) { return s.id === id; })[0]; }
function merchantById(id) { return DB.merchants.filter(function (m) { return m.id === id; })[0]; }
/* 岗位距离取自所属门店 */
function jobDist(job) { var m = job ? merchantById(job.merchantId) : null; return m ? m.dist : 3; }
function jobById(id) { return DB.jobs.filter(function (j) { return j.id === id; })[0]; }
function orderById(id) { return DB.orders.filter(function (o) { return o.id === id; })[0]; }
function ordersOfStudent(id) { return DB.orders.filter(function (o) { return o.studentId === id; }); }
function ordersOfMerchant(id) { return DB.orders.filter(function (o) { return o.merchantId === id; }); }
function jobsOfMerchant(id) { return DB.jobs.filter(function (j) { return j.merchantId === id; }); }
function msgsOf(who) { return DB.messages.filter(function (m) { return m.to === who; }).sort(function (a, b) { return b.time - a.time; }); }
function slotsTaken(job) {
  return DB.orders.filter(function (o) {
    return o.jobId === job.id && ['hired', 'checked_in', 'checked_out', 'confirmed', 'settled', 'done'].indexOf(o.status) >= 0;
  }).length;
}
function activeOrdersOf(studentId) {
  return DB.orders.filter(function (o) {
    return o.studentId === studentId && ACTIVE_ORDER_STATUS.indexOf(o.status) >= 0;
  });
}

/* ==========================================================
 * 匹配算法（对应 PRD 第 7.2 节 MatchScore）
 * ========================================================== */
function timeMatch(stu, job) {
  if (!job.slots.length) return 1;
  var hit = job.slots.filter(function (s) { return stu.avail.indexOf(s) >= 0; }).length;
  return hit / job.slots.length;
}
function distScore(dist) { return Math.max(0, 1 - dist / 3); }
function creditScore(c) { return Math.min(1, c / 1000); }
function fulfillScore(stu) {
  var total = stu.completed + stu.noShow * 3 + stu.cancel;
  return total > 0 ? stu.completed / total : 0.6;
}
function tagScore(stu, job) {
  var req = job.req.tags || [];
  if (!req.length) return 1;
  var hit = req.filter(function (t) { return stu.tags.indexOf(t) >= 0; }).length;
  return hit / req.length;
}
function payScore(stu, job) { return job.pay >= stu.expectPay ? 1 : job.pay / stu.expectPay; }
function relationBonus(stu, job) {
  var past = DB.orders.filter(function (o) {
    return o.studentId === stu.id && o.merchantId === job.merchantId &&
      ['settled', 'done'].indexOf(o.status) >= 0;
  });
  var b = 0;
  if (past.length >= 1) b += 8;
  if (past.length >= 2) b += 4;
  return b;
}
function penaltyOf(stu) { return -(stu.cancel * 10 + stu.noShow * 25) / 30; }

/* 返回 {total, parts, blocked, blockReason} */
function matchScore(stu, job) {
  var m = {
    time: timeMatch(stu, job) * 100,
    dist: distScore(jobDist(job)) * 100,
    credit: creditScore(stu.credit) * 100,
    fulfill: fulfillScore(stu) * 100,
    tag: tagScore(stu, job) * 100,
    pay: payScore(stu, job) * 100,
    act: 70
  };
  var total = 0.25 * m.time + 0.20 * m.dist + 0.15 * m.credit + 0.15 * m.fulfill +
    0.10 * m.tag + 0.10 * m.pay + 0.05 * m.act;
  total += relationBonus(stu, job) + penaltyOf(stu);

  var blocked = '', blockReason = '';
  if (!stu.cert.real || !stu.cert.school) { blocked = 'cert'; blockReason = '需先完成学生认证'; }
  else if (m.time <= 0) { blocked = 'time'; blockReason = '与你的空闲时间冲突'; }
  else if (stu.credit < (job.req.credit || 0)) { blocked = 'credit'; blockReason = '信用分不足 ' + job.req.credit; }
  else if (jobDist(job) > stu.maxDist) { blocked = 'dist'; blockReason = '超过你设置的距离上限'; }
  else if (activeOrdersOf(stu.id).length >= 3) { blocked = 'load'; blockReason = '在途订单已达 3 单上限'; }
  else if (slotsTaken(job) >= job.headcount) { blocked = 'full'; blockReason = '名额已满'; }

  return {
    total: Math.max(0, Math.min(99, total)),
    parts: m,
    blocked: blocked,
    blockReason: blockReason,
    canApply: !blocked
  };
}

/* 学生首页推荐流：可见岗位按匹配度排序 */
function recommendJobs(stu, opts) {
  opts = opts || {};
  var list = DB.jobs.filter(function (j) {
    if (j.status !== 'online') return false;
    if (opts.cat && opts.cat !== '全部' && j.cat !== opts.cat) return false;
    if (opts.slot && j.slots.indexOf(opts.slot) < 0) return false;
    if (opts.minPay && j.pay < opts.minPay) return false;
    if (opts.slot && j.slots.indexOf(opts.slot) < 0) return false;
    var m = merchantById(j.merchantId);
    if (!m || !m.verified) return false;
    return true;
  }).map(function (j) {
    return { job: j, score: matchScore(stu, j) };
  });
  if (!opts.includeBlocked) list = list.filter(function (x) { return x.score.canApply; });
  list.sort(function (a, b) { return b.score.total - a.score.total; });
  return list;
}

/* ==========================================================
 * 派生统计
 * ========================================================== */
function walletOf(stu) {
  var pending = 0;
  ordersOfStudent(stu.id).forEach(function (o) {
    if (['hired', 'checked_in', 'checked_out', 'confirmed'].indexOf(o.status) >= 0) pending += o.amount;
  });
  var earned = ordersOfStudent(stu.id).reduce(function (a, o) {
    return a + (['settled', 'done'].indexOf(o.status) >= 0 ? o.amount : 0);
  }, 0);
  return { pending: pending, balance: stu.wallet.balance, earned: earned, goal: stu.goal };
}

function merchantStats(mid) {
  var jobs = jobsOfMerchant(mid);
  var os = ordersOfMerchant(mid);
  var hired = os.filter(function (o) { return ['hired', 'checked_in', 'checked_out', 'confirmed', 'settled', 'done'].indexOf(o.status) >= 0; });
  var arrived = os.filter(function (o) { return ['checked_in', 'checked_out', 'confirmed', 'settled', 'done'].indexOf(o.status) >= 0; });
  var unpaid = os.filter(function (o) { return ['confirmed'].indexOf(o.status) >= 0; });
  return {
    jobCount: jobs.filter(function (j) { return j.status === 'online'; }).length,
    pendingJobs: jobs.filter(function (j) { return j.status === 'pending'; }).length,
    applied: os.filter(function (o) { return o.status === 'applied'; }).length,
    toCheckIn: hired.filter(function (o) { return o.status === 'hired'; }).length,
    toConfirm: os.filter(function (o) { return o.status === 'checked_out'; }).length,
    toPay: unpaid.length,
    toPayAmount: unpaid.reduce(function (a, o) { return a + o.amount; }, 0),
    arriveRate: hired.length ? Math.round(arrived.length / hired.length * 100) : 100,
    total: os.length
  };
}

function platformStats() {
  var all = DB.orders;
  var done = all.filter(function (o) { return ['settled', 'done'].indexOf(o.status) >= 0; });
  var applied = all.length;
  var hired = all.filter(function (o) { return ['hired', 'checked_in', 'checked_out', 'confirmed', 'settled', 'done'].indexOf(o.status) >= 0; });
  var gmv = done.reduce(function (a, o) { return a + o.amount; }, 0);
  var hours = done.reduce(function (a, o) { return a + o.hours; }, 0);
  return {
    jobs: DB.jobs.length,
    onlineJobs: DB.jobs.filter(function (j) { return j.status === 'online'; }).length,
    pendingJobs: DB.jobs.filter(function (j) { return j.status === 'pending'; }).length,
    students: DB.students.length,
    certified: DB.students.filter(function (s) { return s.cert.real && s.cert.school; }).length,
    merchants: DB.merchants.length,
    pendingMerchants: DB.merchants.filter(function (m) { return !m.verified; }).length,
    orders: applied,
    hired: hired.length,
    done: done.length,
    gmv: gmv,
    vshw: hours,
    matchRate: applied ? Math.round(hired.length / applied * 100) : 0,
    fulfillRate: hired.length ? Math.round(done.length / hired.length * 100) : 0,
    openTickets: DB.tickets.filter(function (t) { return t.status === 'open'; }).length
  };
}

/* ==========================================================
 * 写操作
 * ========================================================== */
function pushMsg(to, type, title, body) {
  DB.messages.push({ id: uid('msg'), to: to, type: type, title: title, body: body, time: Date.now(), read: false });
}
function log(text) {
  DB.logs.unshift({ t: Date.now(), text: text });
  if (DB.logs.length > 60) DB.logs.pop();
}

/* 学生报名 */
function applyJob(studentId, jobId, intro) {
  var stu = studentById(studentId), job = jobById(jobId);
  var o = {
    id: uid('o'), jobId: jobId, studentId: studentId, merchantId: job.merchantId,
    status: job.mode === 'grab' ? 'hired' : 'applied',
    pay: job.pay, hours: job.hours, amount: job.pay * job.hours,
    slot: job.slots[0], intro: intro || '', createdAt: Date.now(),
    checkIn: null, checkOut: null, confirmAt: null, settledAt: null,
    review: null, theirReview: null
  };
  if (o.status === 'hired') {
    o.hiredAt = Date.now();
    pushMsg(studentId, 'hired', '抢单成功', '你已抢到「' + job.title + '」，' + slotText(o.slot) + ' 到岗，请准时签到。');
    pushMsg(job.merchantId, 'hired', '有新同学接单', stu.name + ' 已抢单「' + job.title + '」。');
  } else {
    pushMsg(studentId, 'apply', '报名成功', '你已报名「' + job.title + '」，等待商家录用（24 小时内处理）。');
    pushMsg(job.merchantId, 'apply', '新的报名', stu.name + ' 报名了「' + job.title + '」，匹配度见报名列表。');
  }
  DB.orders.push(o);
  job.views = (job.views || 0) + 1;
  log('学生「' + stu.name + '」' + (o.status === 'hired' ? '抢单' : '报名') + '「' + job.title + '」');
  saveDB();
  return o;
}

/* 商家录用 / 拒绝 */
function hireOrder(orderId) {
  var o = orderById(orderId), job = jobById(o.jobId), stu = studentById(o.studentId);
  if (slotsTaken(job) >= job.headcount) return { ok: false, msg: '名额已满' };
  o.status = 'hired'; o.hiredAt = Date.now();
  pushMsg(o.studentId, 'hired', '你被录用了 🎉',
    '「' + job.title + '」录用成功。' + slotText(o.slot) + ' 在 ' + merchantById(o.merchantId).addr +
    ' 到岗，请提前 10 分钟到达并扫码签到。');
  log('商家「' + merchantById(o.merchantId).name + '」录用 ' + stu.name);
  saveDB();
  return { ok: true, msg: '已录用' };
}
function rejectOrder(orderId, reason) {
  var o = orderById(orderId), job = jobById(o.jobId);
  o.status = 'rejected'; o.rejectReason = reason || '已招满';
  pushMsg(o.studentId, 'rejected', '本次未录用',
    '很遗憾，「' + job.title + '」' + o.rejectReason + '。系统已为你推荐相近岗位。');
  log('商家拒绝 ' + studentById(o.studentId).name + '（' + o.rejectReason + '）');
  saveDB();
}
function withdrawOrder(orderId) {
  var o = orderById(orderId), stu = studentById(o.studentId), job = jobById(o.jobId);
  var hoursLeft = (o.hiredAt ? 0 : 1);
  o.status = 'cancelled';
  var within12h = true; /* 演示环境视为 12 小时内取消 */
  if (within12h) { stu.credit = Math.max(0, stu.credit - 5); stu.cancel += 1; }
  pushMsg(o.merchantId, 'cancel', '学生取消报名', stu.name + ' 取消了「' + job.title + '」的报名。');
  log('学生「' + stu.name + '」取消「' + job.title + '」（信用分 ' + (within12h ? '-5' : '0') + '）');
  saveDB();
}

/* 签到 / 签退 */
function checkIn(orderId) {
  var o = orderById(orderId);
  o.status = 'checked_in';
  o.checkIn = { time: Date.now(), loc: '定位校验通过（门店 80m 内）' };
  var job = jobById(o.jobId);
  pushMsg(o.merchantId, 'checkin', '学生已签到', studentById(o.studentId).name + ' 已到岗「' + job.title + '」。');
  log('签到：' + studentById(o.studentId).name + ' @ ' + job.title);
  saveDB();
}
function checkOut(orderId) {
  var o = orderById(orderId);
  o.status = 'checked_out';
  o.checkOut = { time: Date.now(), loc: '定位校验通过' };
  pushMsg(o.merchantId, 'checkout', '学生已签退', studentById(o.studentId).name + ' 已签退，请确认工时。');
  log('签退：' + studentById(o.studentId).name);
  saveDB();
}
function confirmHours(orderId, hours) {
  var o = orderById(orderId);
  o.status = 'confirmed';
  o.confirmAt = Date.now();
  if (hours) { o.hours = hours; o.amount = o.pay * hours; }
  pushMsg(o.studentId, 'confirm', '工时已确认', '商家确认工时 ' + o.hours + ' 小时，金额 ¥' + o.amount + '，平台将在 T+1 结算。');
  log('商家确认工时 ' + o.hours + 'h / ¥' + o.amount);
  saveDB();
}
function settleOrder(orderId) {
  var o = orderById(orderId), stu = studentById(o.studentId);
  o.status = 'settled'; o.settledAt = Date.now();
  stu.wallet.balance += o.amount;
  stu.credit = Math.min(1000, stu.credit + 5);
  stu.completed += 1;
  if (stu.goal) stu.goal.saved = (stu.goal.saved || 0) + o.amount;
  pushMsg(o.studentId, 'settle', '已到账 ¥' + o.amount, '「' + jobById(o.jobId).title + '」工资已打入零钱，信用分 +5。');
  log('结算 ¥' + o.amount + ' → ' + stu.name);
  saveDB();
}
function reviewOrder(orderId, stars, comment, tags) {
  var o = orderById(orderId);
  o.review = { stars: stars, comment: comment, tags: tags || [], time: Date.now() };
  if (o.theirReview) o.status = 'done';
  var stu = studentById(o.studentId);
  if (stu.records) {
    stu.records.unshift({
      id: uid('rec'), title: jobById(o.jobId).title, merchant: merchantById(o.merchantId).name,
      when: '刚刚', amount: o.amount, rating: stars, comment: comment
    });
  }
  o.status = 'done';
  log('学生评价 ' + stars + ' 星');
  saveDB();
}
function merchantReviewOrder(orderId, stars, comment, joinTeam) {
  var o = orderById(orderId), stu = studentById(o.studentId);
  o.theirReview = { stars: stars, comment: comment, time: Date.now() };
  if (joinTeam) { stu.team = stu.team || []; if (stu.team.indexOf(o.merchantId) < 0) stu.team.push(o.merchantId); }
  o.status = 'done';
  stu.rating = stu.rating ? ((stu.rating * stu.completed + stars) / (stu.completed + 1)).toFixed(1) : stars.toFixed(1);
  log('商家评价学生 ' + stars + ' 星');
  saveDB();
}

/* 商家发布岗位 */
function publishJob(mid, draft) {
  var j = {
    id: uid('j'), merchantId: mid, title: draft.title, cat: draft.cat,
    slots: draft.slots.slice(), pay: draft.pay, hours: draft.hours,
    headcount: draft.headcount, mode: draft.mode,
    req: { credit: draft.credit, tags: draft.tags.slice(), health: false, minAge: 18 },
    desc: draft.desc, bonus: draft.bonus || '', status: 'pending',
    urgent: !!draft.urgent, createdAt: Date.now(), views: 0
  };
  DB.jobs.unshift(j);
  DB.audits.unshift({ id: uid('au'), kind: 'job', refId: j.id, status: 'pending', note: '待平台审核', createdAt: Date.now() });
  log('商家发布岗位「' + j.title + '」，进入审核队列');
  saveDB();
  return j;
}

/* 平台审核 */
function auditPass(auditId) {
  var a = DB.audits.filter(function (x) { return x.id === auditId; })[0];
  if (!a) return;
  a.status = 'passed'; a.decidedAt = Date.now();
  if (a.kind === 'job') {
    var j = jobById(a.refId); if (j) { j.status = 'online'; pushMsg(j.merchantId, 'audit', '岗位审核通过', '「' + j.title + '」已上线，正在向匹配学生推送。'); }
  } else {
    var m = merchantById(a.refId); if (m) { m.verified = true; m.credit = 700; pushMsg(m.id, 'audit', '商家认证通过', '你的门店已通过认证，可以发布岗位了。'); }
  }
  log('平台审核通过：' + a.kind + ' / ' + a.refId);
  saveDB();
}
function auditReject(auditId, reason) {
  var a = DB.audits.filter(function (x) { return x.id === auditId; })[0];
  if (!a) return;
  a.status = 'rejected'; a.decidedAt = Date.now(); a.rejectReason = reason || '资料不完整';
  if (a.kind === 'job') { var j = jobById(a.refId); if (j) j.status = 'rejected'; }
  log('平台驳回：' + a.kind + ' / ' + a.refId + '（' + a.rejectReason + '）');
  saveDB();
}

/* 学生提交投诉 */
function submitTicket(studentId, orderId, type, title, detail) {
  var t = {
    id: uid('tk'), type: type, from: studentId, target: '', orderId: orderId || '-',
    title: title, detail: detail, status: 'open', createdAt: Date.now(), handler: '', result: ''
  };
  var o = orderById(orderId);
  if (o) {
    t.target = o.merchantId;
    /* 用独立标记记录争议，不覆盖已结算事实（否则 GMV / 北极星指标会被抹掉） */
    o.disputed = true;
    o.disputeId = t.id;
    if (['settled', 'done'].indexOf(o.status) < 0) o.status = 'disputed';
  }
  DB.tickets.unshift(t);
  log('学生提交投诉：' + type + ' — ' + title);
  saveDB();
  return t;
}
function resolveTicket(ticketId, result, favor) {
  var t = DB.tickets.filter(function (x) { return x.id === ticketId; })[0];
  if (!t) return;
  t.status = 'closed'; t.result = result; t.handler = '平台客服';
  if (t.orderId && t.orderId !== '-') {
    var o = orderById(t.orderId);
    if (o) {
      o.disputed = false;
      /* 争议中的在途订单判定后回到可结算状态；已结算订单保持原状态 */
      if (o.status === 'disputed') o.status = 'confirmed';
      if (favor === 'student') {
        var stu = studentById(o.studentId);
        if (stu) stu.credit = Math.min(1000, stu.credit + 3);
      }
    }
  }
  log('工单结案：' + t.title + ' → ' + result);
  saveDB();
}

/* 学生档案更新 */
function saveStudentProfile(sid, patch) {
  var stu = studentById(sid);
  Object.keys(patch).forEach(function (k) { stu[k] = patch[k]; });
  saveDB();
}
function completeStudentAuth(sid, step, payload) {
  var stu = studentById(sid);
  if (step === 'real') { stu.cert.real = true; if (payload && payload.name) stu.name = payload.name; }
  if (step === 'school') { stu.cert.school = true; }
  if (step === 'profile') {
    if (payload.avail) stu.avail = payload.avail;
    if (payload.tags) stu.tags = payload.tags;
    if (payload.expectPay) stu.expectPay = payload.expectPay;
    if (payload.emergency) stu.emergency = payload.emergency;
  }
  saveDB();
}
