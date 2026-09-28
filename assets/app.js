/* ==========================================================
 * 周末单 · 大学生周末兼职撮合平台（网页原型）
 * app.js — 路由 / 三端页面 / 交互动作 / 一键演示
 * ========================================================== */

/* ---------------- 全局状态 ---------------- */
const state = {
  role: 'student',
  studentId: 's1',
  merchantId: 'm1',
  view: 'home',
  params: {},
  sheet: null,
  filter: { cat: '全部', slot: '', minPay: 0 },
  toastTimer: null
};

const TABS = {
  student: [
    { id: 'home', ic: '🏠', label: '首页' },
    { id: 'schedule', ic: '📅', label: '日程' },
    { id: 'messages', ic: '💬', label: '消息' },
    { id: 'wallet', ic: '💰', label: '钱包' },
    { id: 'me', ic: '👤', label: '我的' }
  ],
  merchant: [
    { id: 'home', ic: '📊', label: '工作台' },
    { id: 'applicants', ic: '📥', label: '报名' },
    { id: 'orders', ic: '📋', label: '订单' },
    { id: 'settle', ic: '💳', label: '结算' },
    { id: 'me', ic: '🏪', label: '店铺' }
  ],
  admin: [
    { id: 'audit', ic: '🛡️', label: '审核' },
    { id: 'orders', ic: '🧾', label: '订单' },
    { id: 'disputes', ic: '⚖️', label: '纠纷' },
    { id: 'dashboard', ic: '📈', label: '看板' }
  ]
};

const TITLES = {
  job: '岗位详情', onboard: '学生认证', review: '评价商家', complaint: '发起投诉',
  subscribe: '订阅提醒', search: '筛选岗位', orderDetail: '订单详情',
  post: '发布兼职', auth: '商家认证', talent: '我的班底', reviewStudent: '评价学生',
  ticket: '纠纷详情', settleDetail: '结算详情'
};

/* ---------------- 工具 ---------------- */
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function fmtDT(ts) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function ago(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return '刚刚';
  if (s < 3600) return Math.floor(s / 60) + ' 分钟前';
  if (s < 86400) return Math.floor(s / 3600) + ' 小时前';
  return Math.floor(s / 86400) + ' 天前';
}
function toast(msg) {
  const el = $('toast');
  el.innerHTML = msg;
  el.classList.add('on');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => el.classList.remove('on'), 1900);
}
function openSheet(html) { state.sheet = html; renderSheet(); }
function closeSheet() { state.sheet = null; renderSheet(); }
function renderSheet() {
  $('overlay').innerHTML = state.sheet
    ? `<div class="mask" data-act="close-sheet"><div class="sheet" data-act="noop">${state.sheet}</div></div>`
    : '';
}
const badge = (t, tone = 'gray') => `<span class="badge ${tone}">${esc(t)}</span>`;
function statusBadge(s) {
  const m = ORDER_STATUS[s] || { text: s, tone: 'gray' };
  return badge(m.text, m.tone);
}
function starsHTML(n) {
  let h = '';
  for (let i = 1; i <= 5; i++) h += `<span style="color:${i <= n ? '#ff9f0a' : '#dcdfe5'}">★</span>`;
  return h;
}
function go(view, params) { state.view = view; state.params = params || {}; render(); }
function me() {
  return state.role === 'student' ? studentById(state.studentId)
    : state.role === 'merchant' ? merchantById(state.merchantId) : null;
}

/* ---------------- 顶栏 / 底栏 ---------------- */
function topbarHTML(title, sub, opts) {
  opts = opts || {};
  const tabs = TABS[state.role];
  const isTab = tabs.some(t => t.id === state.view);
  const back = (!isTab && state.view !== 'home')
    ? `<button class="back" data-act="back">‹</button>` : '';
  return `<div class="topbar ${opts.tinted ? 'tinted' : ''}">${back}
    <div class="ttl">${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ''}</div>
    <div class="grow"></div>${opts.right || ''}</div>`;
}
function tabbarHTML() {
  const tabs = TABS[state.role];
  const unread = state.role === 'student' ? msgsOf(state.studentId).filter(m => !m.read).length : 0;
  const pending = state.role === 'merchant' ? merchantStats(state.merchantId).applied : 0;
  const openTk = state.role === 'admin' ? platformStats().openTickets + platformStats().pendingJobs + platformStats().pendingMerchants : 0;
  return tabs.map(t => {
    const n = t.id === 'messages' ? unread : t.id === 'applicants' ? pending : t.id === 'audit' ? openTk : 0;
    return `<button class="tab ${state.view === t.id ? 'on' : ''}" data-act="go" data-view="${t.id}">
      <span class="ic">${t.ic}</span>${t.label}${n > 0 ? `<span class="dot">${n}</span>` : ''}</button>`;
  }).join('');
}

/* ==========================================================
 * 学生端
 * ========================================================== */
function vStudentHome() {
  const stu = studentById(state.studentId);
  const w = walletOf(stu);
  const active = activeOrdersOf(stu.id);

  if (!stu.cert.real || !stu.cert.school) {
    return `${topbarHTML(`Hi，${stu.name}`, '完成认证，开始接单', { tinted: true })}
    <div class="pad">
      <div class="card" style="background:linear-gradient(135deg,#07c160,#21d07a);color:#fff">
        <div style="font-size:15px;font-weight:700">先完成学生认证 🎓</div>
        <div class="small" style="opacity:.92;line-height:1.6;margin-top:6px">
          平台要求实名 + 在校身份双重认证，认证后才能报名兼职。认证信息仅用于身份核验，不对外展示。</div>
        <button class="btn" style="background:#fff;color:#07c160;margin-top:11px;width:100%" data-act="go" data-view="onboard">立即认证（约 1 分钟）</button>
      </div>
      <div class="sec-title">认证后你将获得</div>
      <div class="card">
        <div class="li"><div class="grow"><div class="k">💰 资金托管保障</div><div class="v">商家先付款，干完 T+1 到账，不怕拖欠</div></div></div>
        <div class="li"><div class="grow"><div class="k">🛡️ 按单意外保险</div><div class="v">履约期间发生意外可申请理赔</div></div></div>
        <div class="li"><div class="grow"><div class="k">📈 信用分成长</div><div class="v">履约越好，越能接到高薪优质岗位</div></div></div>
      </div>
      ${jobPreviewLocked()}
    </div>`;
  }

  const list = recommendJobs(stu, { cat: state.filter.cat, slot: state.filter.slot, includeBlocked: true });
  const matched = list.filter(x => x.score.canApply);

  return `${topbarHTML(`Hi，${stu.name}`, `${stu.campus} · 信用分 ${stu.credit}`, { tinted: true })}
  <div class="pad">
    <div class="card" style="background:linear-gradient(135deg,#07c160,#21d07a);color:#fff">
      <div class="row between">
        <div><div class="small" style="opacity:.9">本周可接单</div>
          <div style="font-size:26px;font-weight:800;letter-spacing:-1px">${matched.length}<span style="font-size:13px;font-weight:600"> 个匹配岗位</span></div></div>
        <div style="text-align:right"><div class="small" style="opacity:.9">钱包余额</div>
          <div style="font-size:22px;font-weight:800">¥${w.balance}</div></div>
      </div>
      <div class="row" style="gap:16px;margin-top:10px;font-size:11.5px;opacity:.95">
        <span>在途订单 ${active.length} 单</span><span>待结算 ¥${w.pending}</span><span>累计赚 ¥${w.earned}</span>
      </div>
    </div>

    <div class="scroller" style="padding-left:0;padding-right:0;margin:12px 0 2px">
      ${['全部', 'sat-am', 'sat-pm', 'sat-eve', 'sun-am', 'sun-pm'].map(s => {
        const on = state.filter.slot === (s === '全部' ? '' : s);
        return `<button class="chip ${on ? 'on' : ''}" data-act="filter-slot" data-slot="${s === '全部' ? '' : s}">${s === '全部' ? '全部时段' : slotLabel(s)}</button>`;
      }).join('')}
    </div>

    <div class="sec-title">为你匹配 <span class="r">按 时间 · 距离 · 信用 · 履约 加权排序</span></div>
    ${matched.length === 0 ? emptyBox('🙈', '当前时段没有匹配岗位', '换个时间片试试，或打开订阅提醒，有新岗位第一时间通知你') : ''}
    ${matched.slice(0, 6).map(x => jobCard(x)).join('')}

    ${list.filter(x => !x.score.canApply).length ? `
      <div class="sec-title">暂不可报名 <span class="r">点击查看原因</span></div>
      ${list.filter(x => !x.score.canApply).slice(0, 3).map(x => jobCard(x, { locked: true })).join('')}` : ''}

    <div class="card flat" style="margin-top:12px">
      <div class="row between"><div class="t" style="font-size:13.5px;font-weight:700">🔔 订阅提醒</div>
        <button class="btn xs ghost" data-act="go" data-view="subscribe">去设置</button></div>
      <div class="small muted mt6">设置你的空闲时段与期望时薪，命中新岗位会推送给你，不用天天刷。</div>
    </div>
  </div>`;
}

function jobPreviewLocked() {
  const j = DB.jobs.filter(x => x.status === 'online')[0];
  if (!j) return '';
  return `<div class="sec-title">岗位预览 <span class="r">认证后可报名</span></div>
    <div class="card" style="opacity:.62">
      <div class="job"><div class="top">
        <div class="avatar">${esc(merchantById(j.merchantId).avatar)}</div>
        <div class="grow"><div class="tt">${esc(j.title)}</div>
          <div class="small muted mt6">${esc(merchantById(j.merchantId).name)} · ${jobDist(j)}km</div></div>
        <div class="match"><b>?</b><span>匹配度</span></div>
      </div>
      <div class="tags mt6">${badge('¥' + j.pay + '/时', 'amber')}${badge(slotLabel(j.slots[0]), 'blue')}</div>
      </div>
    </div>`;
}

function jobCard(item, opts) {
  opts = opts || {};
  const job = item.job, sc = item.score;
  const m = merchantById(job.merchantId);
  const left = job.headcount - slotsTaken(job);
  const pct = Math.round(sc.total);
  const cls = sc.blocked ? 'lock' : pct >= 80 ? '' : pct >= 60 ? 'mid' : 'low';
  const mp = sc.blocked
    ? `<div class="match lock">${esc(sc.blockReason)}</div>`
    : `<div class="match ${cls}"><b>${pct}</b><span>匹配度</span></div>`;

  return `<div class="card job" data-act="open-job" data-id="${job.id}" style="cursor:pointer">
    <div class="top">
      <div class="avatar ${job.cat === '零售促销' ? 'b' : job.cat === '活动执行' ? 'o' : ''}">${esc(m.avatar)}</div>
      <div class="grow">
        <div class="tt ell">${esc(job.title)}</div>
        <div class="small muted mt6 ell">${esc(m.name)} ${m.verified ? '✅' : ''} · ${jobDist(job)}km · 剩 ${Math.max(0, left)} 名额</div>
      </div>
      ${mp}
    </div>
    <div class="tags">
      <span class="pay">¥${job.pay}<small>/时</small></span>
      ${badge('共 ' + job.hours + 'h · ¥' + job.pay * job.hours, 'amber')}
      ${job.slots.map(s => badge(slotLabel(s), 'blue')).join('')}
      ${job.urgent ? badge('急招', 'red') : ''}
      ${job.mode === 'grab' ? badge('先到先得', 'green') : badge('报名录用', 'gray')}
    </div>
    <div class="foot">
      <div class="small muted">${esc(m.tags.slice(0, 3).join(' · '))}</div>
      <div class="small" style="color:#07c160;font-weight:600">${opts.locked ? '查看详情 ›' : '查看并报名 ›'}</div>
    </div>
  </div>`;
}

function vJobDetail() {
  const job = jobById(state.params.id);
  if (!job) return emptyBox('😢', '岗位不存在', '');
  const stu = studentById(state.studentId);
  const m = merchantById(job.merchantId);
  const sc = matchScore(stu, job);
  const mine = DB.orders.filter(o => o.jobId === job.id && o.studentId === stu.id && ACTIVE_ORDER_STATUS.concat(['settled', 'done']).indexOf(o.status) >= 0)[0];
  const left = job.headcount - slotsTaken(job);

  const bars = [
    ['时间匹配', sc.parts.time, '0.25'],
    ['距离', sc.parts.dist, '0.20'],
    ['信用分', sc.parts.credit, '0.15'],
    ['历史履约', sc.parts.fulfill, '0.15'],
    ['技能标签', sc.parts.tag, '0.10'],
    ['薪资匹配', sc.parts.pay, '0.10']
  ].map(([k, v, wgt]) => `
    <div style="margin-bottom:7px">
      <div class="row between small"><span class="muted">${k} <span style="opacity:.6">权重${wgt}</span></span><b class="mono">${Math.round(v)}</b></div>
      <div class="prog thin mt6"><i style="width:${Math.max(2, Math.round(v))}%"></i></div>
    </div>`).join('');

  return `${topbarHTML('岗位详情')}
  <div class="pad">
    <div class="card">
      <div class="row between">
        <div class="grow"><div style="font-size:17px;font-weight:800;line-height:1.35">${esc(job.title)}</div>
          <div class="small muted mt6">${esc(job.cat)} · 发布 ${ago(job.createdAt)} · ${job.views || 0} 人看过</div></div>
      </div>
      <div class="row" style="margin-top:12px;gap:18px">
        <div><div class="pay" style="font-size:24px">¥${job.pay}<small>/时</small></div>
          <div class="small muted">共 ${job.hours} 小时 ≈ ¥${job.pay * job.hours}</div></div>
        <div><div style="font-size:24px;font-weight:800">${job.headcount}</div>
          <div class="small muted">招 ${job.headcount} 人 · 剩 ${Math.max(0, left)}</div></div>
      </div>
      <div class="tags mt10">
        ${job.slots.map(s => badge(slotText(s), 'blue')).join('')}
        ${job.mode === 'grab' ? badge('先到先得', 'green') : badge('报名后商家录用', 'gray')}
        ${job.urgent ? badge('⚡ 急招', 'red') : ''}
      </div>
    </div>

    ${mine ? `<div class="notice ${['settled', 'done'].indexOf(mine.status) >= 0 ? 'green' : 'blue'}">
      你已经报名了这个岗位，当前状态：<b>${ORDER_STATUS[mine.status].text}</b>
      <button class="btn xs dark" style="margin-top:8px" data-act="open-order" data-id="${mine.id}">查看订单</button></div>` : ''}

    <div class="card">
      <div class="card-h"><div class="t">匹配度诊断</div>
        <div class="match ${sc.total >= 80 ? '' : sc.total >= 60 ? 'mid' : 'low'}" style="flex:0 0 52px">
          <b>${Math.round(sc.total)}</b><span>综合匹配度</span></div></div>
      ${bars}
      <div class="small muted mt10" style="line-height:1.6">
        平台用 7 个维度加权计算匹配度：时间 25% · 距离 20% · 信用 15% · 履约 15% · 标签 10% · 薪资 10% · 活跃 5%，再叠加复购关系加分与违约惩罚。</div>
    </div>

    <div class="card">
      <div class="card-h"><div class="t">工作内容</div></div>
      <div class="small" style="line-height:1.75;color:#4a4d57">${esc(job.desc)}</div>
      ${job.bonus ? `<div class="notice green mt10">🎁 ${esc(job.bonus)}</div>` : ''}
    </div>

    <div class="card">
      <div class="card-h"><div class="t">商家信息</div><div class="small muted">已认证</div></div>
      <div class="row">
        <div class="avatar lg ${job.cat === '零售促销' ? 'b' : ''}">${esc(m.avatar)}</div>
        <div class="grow">
          <div style="font-weight:700;font-size:14px">${esc(m.name)} ${m.verified ? '✅' : ''}</div>
          <div class="small muted mt6">${esc(m.addr)} · ${jobDist(job)}km</div>
          <div class="row mt6" style="gap:8px">
            ${badge('评分 ' + m.rating, 'amber')}${badge('信用 ' + m.credit, 'green')}${badge('成交 ' + m.orders + ' 单', 'gray')}
          </div>
        </div>
      </div>
      <div class="tags mt10">${m.tags.map(t => `<span class="chip sm static">${esc(t)}</span>`).join('')}</div>
    </div>

    <div class="card">
      <div class="card-h"><div class="t">报名要求</div></div>
      <div class="li"><div class="grow"><div class="k">信用分 ≥ ${job.req.credit}</div><div class="v">你当前 ${stu.credit} 分</div></div>
        ${stu.credit >= job.req.credit ? badge('满足', 'green') : badge('不足', 'red')}</div>
      <div class="li"><div class="grow"><div class="k">年满 18 周岁</div><div class="v">实名认证已通过</div></div>${badge('满足', 'green')}</div>
      <div class="li"><div class="grow"><div class="k">技能标签</div><div class="v">${job.req.tags.length ? job.req.tags.join('、') : '无硬性要求'}</div></div>
        ${sc.parts.tag >= 100 ? badge('满足', 'green') : badge('可协商', 'amber')}</div>
      <div class="li"><div class="grow"><div class="k">健康证</div><div class="v">${job.req.health ? '需提供' : '不需要'}</div></div>
        ${badge('不需要', 'green')}</div>
    </div>

    <div class="notice">
      <b>平台保障：</b>商家已预付工资到平台托管账户；工作中如遇纠纷可一键求助；薪资将在商家确认工时后 T+1 到账。开始前 12 小时内取消会扣 5 分信用分。
    </div>
  </div>
  <div class="actionbar">
    <button class="btn ghost" data-act="fav">收藏</button>
    <button class="btn ghost" data-act="go" data-view="complaint" data-id="${job.id}">举报</button>
    <button class="btn primary" ${(!sc.canApply || mine) ? 'disabled' : ''} data-act="${job.mode === 'grab' ? 'grab-job' : 'apply-job'}" data-id="${job.id}">
      ${mine ? '已报名' : !sc.canApply ? sc.blockReason : job.mode === 'grab' ? '立即抢单 ¥' + job.pay * job.hours : '立即报名'}</button>
  </div>`;
}

function vSchedule() {
  const stu = studentById(state.studentId);
  const os = ordersOfStudent(stu.id).sort((a, b) => b.createdAt - a.createdAt);
  const doing = os.filter(o => ACTIVE_ORDER_STATUS.indexOf(o.status) >= 0);
  const done = os.filter(o => ['settled', 'done'].indexOf(o.status) >= 0);
  const dead = os.filter(o => ['rejected', 'cancelled'].indexOf(o.status) >= 0);

  const item = o => {
    const j = jobById(o.jobId), m = merchantById(o.merchantId);
    return `<div class="card" data-act="open-order" data-id="${o.id}" style="cursor:pointer">
      <div class="row between">
        <div class="grow"><div style="font-weight:700;font-size:14px">${esc(j.title)}</div>
          <div class="small muted mt6">${esc(m.name)} · ${slotText(o.slot)}</div></div>
        ${statusBadge(o.status)}
      </div>
      <div class="foot" style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:9px;border-top:1px dashed var(--line)">
        <span class="small muted">${fmtDT(o.createdAt)} 报名</span>
        <span class="pay">¥${o.amount}</span>
      </div>
    </div>`;
  };

  return `${topbarHTML('我的日程', `在途 ${doing.length} 单 · 已完成 ${done.length} 单`)}
  <div class="pad">
    ${doing.length ? `<div class="sec-title">进行中</div>${doing.map(item).join('')}` : ''}
    ${done.length ? `<div class="sec-title">已完成</div>${done.slice(0, 8).map(item).join('')}` : ''}
    ${dead.length ? `<div class="sec-title">已结束</div>${dead.map(item).join('')}` : ''}
    ${!os.length ? emptyBox('📅', '还没有兼职记录', '去首页看看本周末的岗位吧') : ''}
  </div>`;
}

function vOrderDetail() {
  const o = orderById(state.params.id);
  if (!o) return emptyBox('😢', '订单不存在', '');
  const j = jobById(o.jobId), m = merchantById(o.merchantId), stu = studentById(o.studentId);
  const steps = [
    ['报名成功', o.createdAt],
    ['商家录用', o.hiredAt],
    ['到岗签到', o.checkIn && o.checkIn.time],
    ['离岗签退', o.checkOut && o.checkOut.time],
    ['工时确认', o.confirmAt],
    ['平台结算', o.settledAt]
  ];
  const idx = ['applied', 'hired', 'checked_in', 'checked_out', 'confirmed', 'settled', 'done'].indexOf(o.status);

  let acts = '';
  if (o.status === 'hired') acts = `<button class="btn primary" data-act="checkin" data-id="${o.id}">扫码签到</button>
    <button class="btn danger" data-act="withdraw" data-id="${o.id}">取消报名</button>`;
  else if (o.status === 'checked_in') acts = `<button class="btn primary" data-act="checkout" data-id="${o.id}">签退下班</button>`;
  else if (o.status === 'checked_out' || o.status === 'confirmed') acts = `<button class="btn ghost" disabled>等待商家确认工时</button>`;
  else if (o.status === 'settled' && !o.review) acts = `<button class="btn primary" data-act="go" data-view="review" data-id="${o.id}">评价商家</button>`;
  else if (o.status === 'applied') acts = `<button class="btn danger" data-act="withdraw" data-id="${o.id}">取消报名</button>`;
  else acts = `<button class="btn ghost" data-act="go" data-view="complaint" data-id="${o.id}">遇到问题？投诉</button>`;

  return `${topbarHTML('订单详情')}
  <div class="pad">
    <div class="card">
      <div class="row between"><div class="grow"><div style="font-weight:800;font-size:15.5px">${esc(j.title)}</div>
        <div class="small muted mt6">${esc(m.name)} · 订单号 ${o.id.toUpperCase()}</div></div>${statusBadge(o.status)}</div>
      <div class="row between mt10" style="padding-top:10px;border-top:1px dashed var(--line)">
        <span class="small muted">工资金额</span><span class="pay" style="font-size:19px">¥${o.amount}</span></div>
      <div class="small muted" style="margin-top:4px;text-align:right">¥${o.pay}/时 × ${o.hours} 小时</div>
    </div>

    <div class="card">
      <div class="card-h"><div class="t">履约进度</div><div class="small muted">${slotText(o.slot)}</div></div>
      <div class="tl">
        ${steps.map((s, i) => `<div class="n ${i <= idx ? 'on' : ''}"><b>${s[0]}</b><span>${s[1] ? fmtDT(s[1]) : '待完成'}</span></div>`).join('')}
      </div>
    </div>

    ${o.checkIn ? `<div class="card"><div class="card-h"><div class="t">考勤记录</div></div>
      <div class="li"><div class="grow"><div class="k">签到 ${fmtDT(o.checkIn.time)}</div><div class="v">${esc(o.checkIn.loc)}</div></div>${badge('GPS 已校验', 'green')}</div>
      ${o.checkOut ? `<div class="li"><div class="grow"><div class="k">签退 ${fmtDT(o.checkOut.time)}</div><div class="v">${esc(o.checkOut.loc)}</div></div>${badge('GPS 已校验', 'green')}</div>` : ''}
      </div>` : ''}

    <div class="card">
      <div class="card-h"><div class="t">商家联系方式</div></div>
      <div class="li"><div class="grow"><div class="k">${esc(m.contact)} · ${esc(m.phone)}</div><div class="v">隐私号，订单结束后 48 小时失效</div></div>
        <button class="btn xs ghost" data-act="call">拨打</button></div>
      <div class="li"><div class="grow"><div class="k">${esc(m.addr)}</div><div class="v">距你 ${jobDist(j)}km</div></div>
        <button class="btn xs ghost" data-act="nav">导航</button></div>
    </div>

    ${o.review ? `<div class="card"><div class="card-h"><div class="t">我的评价</div></div>
      <div>${starsHTML(o.review.stars)} <span class="small muted">${esc(o.review.comment)}</span></div></div>` : ''}

    <div class="notice red">
      <b>安全提示：</b>任何要求你交押金、买物料、刷单返利的都是诈骗，请立即举报。
      <button class="btn xs danger" style="margin-top:8px" data-act="sos">🆘 一键求助</button>
    </div>
  </div>
  <div class="actionbar">${acts}</div>`;
}

function vReview() {
  const o = orderById(state.params.id);
  if (!o) return emptyBox('📝', '请从日程中选择要评价的订单', '只有已完成结算的订单可以评价');
  const j = jobById(o.jobId), m = merchantById(o.merchantId);
  const p = state.params;
  const s = p.stars || 5;
  const tagList = ['准时', '环境好', '老板人nice', '工作量适中', '结算及时', '有工作餐'];
  return `${topbarHTML('评价商家')}
  <div class="pad">
    <div class="card center">
      <div class="avatar lg" style="margin:0 auto 10px">${esc(m.avatar)}</div>
      <div style="font-weight:700">${esc(m.name)}</div>
      <div class="small muted mt6">${esc(j.title)} · ¥${o.amount}</div>
      <div style="font-size:30px;margin-top:14px">${[1, 2, 3, 4, 5].map(i =>
        `<span data-act="set-stars" data-v="${i}" style="cursor:pointer;color:${i <= s ? '#ff9f0a' : '#dcdfe5'}">★</span>`).join('')}</div>
      <div class="small muted mt6">${s >= 5 ? '非常满意' : s >= 4 ? '满意' : s >= 3 ? '一般' : '不满意'}</div>
    </div>
    <div class="card">
      <div class="card-h"><div class="t">印象标签</div></div>
      <div class="chips">${tagList.map(t =>
        `<button class="chip sm ${(p.tags || []).indexOf(t) >= 0 ? 'on' : ''}" data-act="toggle-rtag" data-v="${esc(t)}">${esc(t)}</button>`).join('')}</div>
    </div>
    <div class="field">
      <label>补充评价（可选）</label>
      <textarea class="textarea" id="rev-comment" placeholder="说说真实体验，帮助其他同学判断">${esc(p.comment || '')}</textarea>
    </div>
    <div class="notice blue">评价为双向盲评，商家在 48 小时内看不到你的内容，避免报复性差评。</div>
  </div>
  <div class="actionbar"><button class="btn primary block" data-act="submit-review" data-id="${o.id}">提交评价（信用分 +5）</button></div>`;
}

function vWallet() {
  const stu = studentById(state.studentId);
  const w = walletOf(stu);
  const os = ordersOfStudent(stu.id).filter(o => ['settled', 'done'].indexOf(o.status) >= 0);
  const gp = Math.min(100, Math.round(w.goal.saved / w.goal.target * 100));

  return `${topbarHTML('我的钱包', '资金由平台托管 · T+1 到账')}
  <div class="pad">
    <div class="card" style="background:linear-gradient(135deg,#23252b,#3a3d46);color:#fff">
      <div class="small" style="opacity:.7">可提现余额（元）</div>
      <div style="font-size:32px;font-weight:800;letter-spacing:-1px">¥${w.balance.toFixed(2)}</div>
      <div class="row" style="gap:18px;margin-top:10px;font-size:11.5px;opacity:.85">
        <span>待结算 ¥${w.pending}</span><span>累计收入 ¥${w.earned}</span></div>
      <div class="btn-row mt14">
        <button class="btn primary" data-act="withdraw-cash">提现到微信零钱</button>
        <button class="btn ghost" data-act="bill">账单明细</button>
      </div>
    </div>

    <div class="card">
      <div class="card-h"><div class="t">🎯 ${esc(w.goal.name)}</div><span class="small muted">${gp}%</span></div>
      <div class="prog"><i style="width:${gp}%"></i></div>
      <div class="row between mt6 small muted"><span>已攒 ¥${w.goal.saved}</span><span>目标 ¥${w.goal.target}</span></div>
    </div>

    <div class="stats">
      <div class="stat green"><b>${stu.completed}</b><span>累计完成单数</span></div>
      <div class="stat blue"><b>${stu.rating || '—'}</b><span>商家评分</span></div>
      <div class="stat amber"><b>${stu.credit}</b><span>信用分</span></div>
    </div>

    <div class="sec-title">收入明细 <span class="r">共 ${os.length} 笔</span></div>
    ${os.length ? os.map(o => `<div class="card tight">
      <div class="row between"><div class="grow"><div style="font-weight:600;font-size:13.5px">${esc(jobById(o.jobId).title)}</div>
        <div class="small muted mt6">${esc(merchantById(o.merchantId).name)} · ${fmtDT(o.settledAt || o.createdAt)}</div></div>
        <div style="text-align:right"><div class="pay">+¥${o.amount}</div>
          <div class="small muted">${o.status === 'done' ? '已完成' : '已结算'}</div></div></div></div>`).join('')
      : emptyBox('💰', '还没有收入记录', '完成第一单后，工资 T+1 到账')}

    <div class="card flat">
      <div class="card-h"><div class="t">资金托管说明</div></div>
      <div class="small muted" style="line-height:1.75">
        1. 商家发布岗位时需先预付工资到平台托管账户；<br>
        2. 你完成签到签退、商家确认工时后，平台于 T+1 打款；<br>
        3. 若商家逾期未确认，系统将在 24 小时后按签到记录自动确认；<br>
        4. 发生结算纠纷时，平台可先行垫付（≤200 元）后再向商家追偿。</div>
    </div>
  </div>`;
}

function vMessages() {
  const list = msgsOf(state.role === 'student' ? state.studentId : state.merchantId);
  list.forEach(m => { m.read = true; });
  saveDB();
  return `${topbarHTML('消息')}
  <div class="pad">
    ${list.length ? list.map(m => `<div class="card tight">
      <div class="row between"><div style="font-weight:700;font-size:13.5px">${esc(m.title)}</div>
        <span class="small muted">${ago(m.time)}</span></div>
      <div class="small muted mt6" style="line-height:1.65">${esc(m.body)}</div></div>`).join('')
      : emptyBox('💬', '暂无消息', '报名、录用、结算等通知都会出现在这里')}
  </div>`;
}

function vMe() {
  const stu = studentById(state.studentId);
  const w = walletOf(stu);
  const cert = stu.cert;
  return `${topbarHTML('我的', '学生端')}
  <div class="pad">
    <div class="card">
      <div class="row">
        <div class="avatar lg">${esc(stu.avatar)}</div>
        <div class="grow">
          <div class="row" style="gap:6px"><span style="font-weight:800;font-size:16px">${esc(stu.name)}</span>
            ${cert.real ? badge('已实名', 'green') : badge('未实名', 'red')}</div>
          <div class="small muted mt6">${esc(stu.school)} · ${esc(stu.campus)} · ${esc(stu.grade)}</div>
          <div class="row mt6" style="gap:6px">
            ${badge('信用 ' + stu.credit, 'green')}${badge('完成 ' + stu.completed + ' 单', 'blue')}${badge('评分 ' + (stu.rating || '—'), 'amber')}</div>
        </div>
      </div>
      <div class="btn-row mt14">
        <button class="btn ghost sm" data-act="go" data-view="onboard">认证中心</button>
        <button class="btn ghost sm" data-act="go" data-view="subscribe">订阅提醒</button>
      </div>
    </div>

    <div class="card">
      <div class="card-h"><div class="t">认证状态</div><div class="small muted">${cert.real && cert.school ? '已完成' : '待完善'}</div></div>
      <div class="li"><div class="grow"><div class="k">实名认证</div><div class="v">身份证 + 人脸活体</div></div>${cert.real ? badge('已通过', 'green') : badge('未完成', 'red')}</div>
      <div class="li"><div class="grow"><div class="k">学生身份认证</div><div class="v">学信网 / 学生证 / 校园邮箱</div></div>${cert.school ? badge('已通过', 'green') : badge('未完成', 'red')}</div>
      <div class="li"><div class="grow"><div class="k">健康证</div><div class="v">部分餐饮岗位需要</div></div>${cert.health ? badge('已上传', 'green') : badge('未上传', 'gray')}</div>
    </div>

    <div class="card">
      <div class="card-h"><div class="t">信用分 ${stu.credit}</div><span class="small muted">${stu.credit >= 850 ? '金牌学生' : stu.credit >= 700 ? '优质学生' : stu.credit >= 500 ? '正常' : '受限'}</span></div>
      <div class="prog"><i style="width:${stu.credit / 10}%"></i></div>
      <div class="small muted mt6">${stu.completed * 5 + 600} / 1000 · 完成 ${stu.completed} 单 · 爽约 ${stu.noShow} 次 · 取消 ${stu.cancel} 次</div>
      <div class="notice green mt10">信用分 ≥ 850 可解锁：免履约保证金、高薪/夜间岗位、商家定向邀约、保险升级。</div>
    </div>

    <div class="card">
      <div class="card-h"><div class="t">技能标签</div><span class="small muted">影响推荐排序</span></div>
      <div class="chips">${ALL_TAGS.map(t => `<button class="chip sm ${stu.tags.indexOf(t) >= 0 ? 'on' : ''}" data-act="toggle-tag" data-v="${esc(t)}">${esc(t)}</button>`).join('')}</div>
      <div class="small muted mt6">点击即可增减（原型演示用）</div>
    </div>

    <div class="card">
      <div class="card-h"><div class="t">兼职履历</div><span class="small muted">${stu.records.length} 条</span></div>
      ${stu.records.length ? stu.records.map(r => `<div class="li">
        <div class="grow"><div class="k">${esc(r.title)}</div>
          <div class="v">${esc(r.merchant)} · ${esc(r.when)} · ¥${r.amount}</div>
          ${r.comment ? `<div class="v" style="color:#0a8f4c">“${esc(r.comment)}”</div>` : ''}</div>
        <div>${starsHTML(r.rating)}</div></div>`).join('') : '<div class="small muted">完成第一单后自动生成</div>'}
      <button class="btn ghost sm block mt10" data-act="export-resume">生成可分享履历卡</button>
    </div>

    <div class="card">
      <div class="card-h"><div class="t">安全设置</div></div>
      <div class="li"><div class="grow"><div class="k">紧急联系人</div>
        <div class="v">${stu.emergency ? esc(stu.emergency.name + ' ' + stu.emergency.phone) : '未设置（夜间岗位必须设置）'}</div></div>
        <button class="btn xs ghost" data-act="set-emergency">设置</button></div>
      <div class="li"><div class="grow"><div class="k">行程分享</div><div class="v">到岗途中可分享实时位置</div></div>${badge('默认开启', 'green')}</div>
      <div class="li"><div class="grow"><div class="k">隐私保护</div><div class="v">手机号隐藏 · 仅展示院校与信用等级</div></div>${badge('已开启', 'green')}</div>
      <div class="li"><div class="grow"><div class="k">切换演示身份</div><div class="v">${esc(stu.name)}</div></div>
        <button class="btn xs ghost" data-act="switch-student-next">换一个</button></div>
    </div>
  </div>`;
}

function vOnboard() {
  const stu = studentById(state.studentId);
  const step = state.params.step || 0;
  const names = ['实名认证', '学生身份', '完善档案', '完成'];
  let body = '';

  if (step === 0) {
    body = `<div class="card">
      <div class="field"><label>真实姓名</label><input class="input" id="ob-name" value="${esc(stu.name)}" placeholder="请输入身份证上的姓名"></div>
      <div class="field"><label>身份证号</label><input class="input" id="ob-id" value="4201**********1234" placeholder="18 位身份证号"></div>
      <div class="notice blue">信息仅用于实名核验与保险投保，平台加密存储，不会展示给商家。</div>
    </div>`;
  } else if (step === 1) {
    body = `<div class="card">
      <div class="card-h"><div class="t">选择一种在校身份证明</div></div>
      ${['学信网在线验证码（最快）', '学生证拍照识别（含注册章）', '校园邮箱验证（.edu.cn）'].map((t, i) => `
        <div class="li" data-act="pick-cert" data-i="${i}" style="cursor:pointer">
          <div class="grow"><div class="k">${t}</div><div class="v">${i === 0 ? '推荐，1 分钟出结果' : i === 1 ? '需上传学生证内页' : '需能接收校园邮件'}</div></div>
          <span class="arrow">›</span></div>`).join('')}
      <div class="notice green mt10">认证通过后即可报名所有岗位，认证等级越高可接的岗位越多。</div>
    </div>`;
  } else if (step === 2) {
    body = `<div class="card">
      <div class="card-h"><div class="t">你的空闲时段</div><span class="small muted">多选</span></div>
      <div class="chips">${SLOTS.map(s => `<button class="chip sm ${stu.avail.indexOf(s.id) >= 0 ? 'on' : ''}" data-act="toggle-avail" data-v="${s.id}">${s.label}</button>`).join('')}</div>
    </div>
    <div class="card">
      <div class="card-h"><div class="t">技能标签</div><span class="small muted">多选</span></div>
      <div class="chips">${ALL_TAGS.map(t => `<button class="chip sm ${stu.tags.indexOf(t) >= 0 ? 'on' : ''}" data-act="toggle-tag" data-v="${esc(t)}">${esc(t)}</button>`).join('')}</div>
    </div>
    <div class="card">
      <div class="card-h"><div class="t">期望时薪</div><span class="small muted" id="expect-label">¥${stu.expectPay}/时</span></div>
      <input type="range" min="12" max="40" value="${stu.expectPay}" style="width:100%" data-act="set-expect">
      <div class="small muted mt6">低于该时薪的岗位不会优先推荐给你</div>
    </div>`;
  } else {
    body = `<div class="card center" style="padding:26px 16px">
      <div style="font-size:44px">🎉</div>
      <div style="font-weight:800;font-size:17px;margin-top:10px">认证完成</div>
      <div class="small muted mt6" style="line-height:1.7">
        实名认证 ✅　学生身份 ✅<br>已根据你的空闲时段推荐 ${recommendJobs(stu, {}).length} 个匹配岗位</div>
    </div>`;
  }

  return `${topbarHTML('学生认证', `第 ${Math.min(step + 1, 4)} / 4 步`)}
  <div class="pad">
    <div class="prog" style="margin-bottom:14px"><i style="width:${(step + 1) / 4 * 100}%"></i></div>
    <div class="row" style="gap:6px;margin-bottom:12px">
      ${names.map((n, i) => `<div style="flex:1;text-align:center">
        <div style="height:26px;width:26px;line-height:26px;border-radius:50%;margin:0 auto;font-size:11px;font-weight:700;
          background:${i <= step ? '#07c160' : '#eceef2'};color:${i <= step ? '#fff' : '#8c909c'}">${i < step ? '✓' : i + 1}</div>
        <div class="small" style="margin-top:4px;color:${i <= step ? '#17181c' : '#8c909c'}">${n}</div></div>`).join('')}
    </div>
    ${body}
  </div>
  <div class="actionbar">
    ${step > 0 && step < 3 ? `<button class="btn ghost" data-act="ob-prev">上一步</button>` : ''}
    <button class="btn primary" data-act="ob-next">${step === 3 ? '开始找兼职' : step === 1 ? '提交认证' : '下一步'}</button>
  </div>`;
}

function vSubscribe() {
  const stu = studentById(state.studentId);
  const sub = state.params.sub || stu.subscribe || { slots: ['sat-eve'], cats: ['餐饮帮工'], minPay: 18 };
  return `${topbarHTML('订阅提醒', '命中新岗位第一时间推送')}
  <div class="pad">
    <div class="card">
      <div class="card-h"><div class="t">关注时段</div><span class="small muted">多选</span></div>
      <div class="chips">${SLOTS.map(s => `<button class="chip sm ${sub.slots.indexOf(s.id) >= 0 ? 'on' : ''}" data-act="sub-slot" data-v="${s.id}">${s.label}</button>`).join('')}</div>
    </div>
    <div class="card">
      <div class="card-h"><div class="t">关注类目</div></div>
      <div class="chips">${CATS.map(c => `<button class="chip sm ${sub.cats.indexOf(c) >= 0 ? 'on' : ''}" data-act="sub-cat" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div>
    </div>
    <div class="card">
      <div class="card-h"><div class="t">最低时薪</div><span class="small muted" id="subpay-label">¥${sub.minPay}/时</span></div>
      <input type="range" min="12" max="40" value="${sub.minPay}" style="width:100%" data-act="sub-pay">
    </div>
    <div class="card">
      <div class="card-h"><div class="t">推送设置</div></div>
      <div class="li"><div class="grow"><div class="k">微信服务通知</div><div class="v">每类目每天最多 3 条，自动合并</div></div>${badge('已开启', 'green')}</div>
      <div class="li"><div class="grow"><div class="k">免打扰时段</div><div class="v">23:00 - 07:30 不推送</div></div>${badge('已开启', 'green')}</div>
    </div>
    <div class="notice">当前订阅条件命中 <b>${recommendJobs(stu, {}).filter(x => x.job.slots.some(s => sub.slots.indexOf(s) >= 0) && x.job.pay >= sub.minPay).length}</b> 个在招岗位。</div>
  </div>
  <div class="actionbar"><button class="btn primary block" data-act="save-sub">保存订阅</button></div>`;
}

function vSearch() {
  const stu = studentById(state.studentId);
  const f = state.filter;
  const list = recommendJobs(stu, { cat: f.cat, slot: f.slot, minPay: f.minPay, includeBlocked: true });
  return `${topbarHTML('筛选岗位', `${list.length} 个结果`)}
  <div class="pad">
    <div class="card">
      <div class="field"><label>类目</label>
        <div class="chips">${['全部'].concat(CATS).map(c => `<button class="chip sm ${f.cat === c ? 'on' : ''}" data-act="filter-cat" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div></div>
      <div class="field"><label>时段</label>
        <div class="chips">${[{ id: '', label: '不限' }].concat(SLOTS).map(s => `<button class="chip sm ${f.slot === s.id ? 'on' : ''}" data-act="filter-slot" data-slot="${s.id}">${s.label}</button>`).join('')}</div></div>
      <div class="field"><label id="filterpay-label">最低时薪 ¥${f.minPay} 元</label>
        <input type="range" min="0" max="40" step="1" value="${f.minPay}" style="width:100%" data-act="filter-pay"></div>
      <button class="btn ghost sm block" data-act="filter-reset">重置筛选</button>
    </div>
    ${list.map(x => jobCard(x)).join('')}
    ${!list.length ? emptyBox('🔍', '没有符合条件的岗位', '放宽条件试试') : ''}
  </div>`;
}

function vComplaint() {
  const stu = studentById(state.studentId);
  const os = ordersOfStudent(stu.id);
  return `${topbarHTML('发起投诉', '客服 24 小时内响应')}
  <div class="pad">
    <div class="field"><label>问题类型</label>
      <div class="chips" id="cp-type">
        ${['商家爽约', '拖欠工资', '工时争议', '虚假岗位', '人身安全', '诱导线下交易'].map((t, i) =>
          `<button class="chip sm ${i === 0 ? 'on' : ''}" data-act="cp-type" data-v="${esc(t)}">${esc(t)}</button>`).join('')}
      </div></div>
    <div class="field"><label>关联订单（可选）</label>
      <select class="select" id="cp-order">
        <option value="">不关联订单</option>
        ${os.map(o => `<option value="${o.id}">${esc(jobById(o.jobId).title)} · ¥${o.amount}</option>`).join('')}
      </select></div>
    <div class="field"><label>问题描述</label>
      <textarea class="textarea" id="cp-detail" placeholder="请描述发生了什么，包括时间、地点、金额"></textarea></div>
    <div class="field"><label>上传证据</label>
      <div class="card flat center" style="padding:20px;border-style:dashed;cursor:pointer" data-act="upload">
        <div style="font-size:24px">📎</div><div class="small muted mt6">点击上传截图 / 现场照片（最多 6 张）</div></div></div>
    <div class="notice red"><b>紧急情况请优先保证自身安全</b>，直接拨打 110，并在订单页使用「一键求助」，客服会电话联系你。</div>
  </div>
  <div class="actionbar"><button class="btn primary block" data-act="submit-complaint">提交投诉</button></div>`;
}

/* ==========================================================
 * 商家端
 * ========================================================== */
function vMerchantHome() {
  const m = merchantById(state.merchantId);
  if (!m.verified) return vMerchantAuth();

  const st = merchantStats(m.id);
  const jobs = jobsOfMerchant(m.id).filter(j => j.status === 'online');
  const recent = ordersOfMerchant(m.id).filter(o => o.status === 'applied').slice(0, 3);

  return `${topbarHTML(m.name, `${m.cat} · 距校区 ${m.dist}km`, { tinted: true, right: `<button class="btn xs primary" data-act="go" data-view="post">+ 发单</button>` })}
  <div class="pad">
    <div class="stats">
      <div class="stat blue"><b>${st.applied}</b><span>待处理报名</span></div>
      <div class="stat amber"><b>${st.toCheckIn}</b><span>待到岗</span></div>
      <div class="stat green"><b>${st.arriveRate}%</b><span>到岗率</span></div>
    </div>

    <div class="card mt10" style="background:linear-gradient(135deg,#23252b,#3a3d46);color:#fff">
      <div class="row between">
        <div><div class="small" style="opacity:.7">待支付/待结算</div>
          <div style="font-size:26px;font-weight:800">¥${st.toPayAmount}</div></div>
        <div style="text-align:right"><div class="small" style="opacity:.7">在招岗位</div>
          <div style="font-size:26px;font-weight:800">${st.jobCount}</div></div>
      </div>
      <div class="btn-row mt14">
        <button class="btn primary" data-act="go" data-view="applicants">处理报名</button>
        <button class="btn ghost" data-act="go" data-view="orders">确认工时</button>
      </div>
    </div>

    ${recent.length ? `<div class="sec-title">新报名待处理 <span class="r">${st.applied} 条</span></div>
      ${recent.map(o => {
        const stu = studentById(o.studentId), job = jobById(o.jobId), sc = matchScore(stu, job);
        return `<div class="card tight" data-act="open-order" data-id="${o.id}" style="cursor:pointer">
        <div class="row">
          <div class="avatar sm b">${esc(stu.avatar)}</div>
          <div class="grow"><div style="font-weight:600;font-size:13.5px">${esc(stu.name)} <span class="small muted">报名 ${esc(job.title)}</span></div>
            <div class="row mt6" style="gap:5px">${badge('信用 ' + stu.credit, 'green')}${badge('完成 ' + stu.completed + ' 单', 'blue')}${badge('匹配 ' + Math.round(sc.total), 'amber')}</div></div>
          <span class="arrow">›</span></div></div>`;
      }).join('')}` : ''}

    <div class="sec-title">在招岗位 <span class="r">${jobs.length} 个</span></div>
    ${jobs.map(j => {
      const applied = DB.orders.filter(o => o.jobId === j.id && o.status === 'applied').length;
      const hired = slotsTaken(j);
      return `<div class="card tight">
        <div class="row between"><div class="grow"><div style="font-weight:700;font-size:14px">${esc(j.title)}</div>
          <div class="row mt6" style="gap:5px">${badge('¥' + j.pay + '/时', 'amber')}${badge(slotLabel(j.slots[0]), 'blue')}${j.urgent ? badge('急招', 'red') : ''}</div></div>
          <div style="text-align:right"><div style="font-weight:800;font-size:16px">${hired}/${j.headcount}</div><div class="small muted">已录用</div></div></div>
        <div class="row between mt10" style="padding-top:9px;border-top:1px dashed var(--line)">
          <span class="small muted">${applied} 人待处理 · ${j.views || 0} 次浏览</span>
          <button class="btn xs ghost" data-act="go" data-view="applicants" data-id="${j.id}">查看报名</button></div></div>`;
    }).join('') || emptyBox('📭', '还没有在招岗位', '点击右上角「发单」发布第一个周末岗位')}

    <div class="card flat mt10">
      <div class="card-h"><div class="t">💡 运营建议</div></div>
      <div class="small muted" style="line-height:1.75">
        · 你的岗位平均 6.2 小时收到首个报名，建议提前 3 天发布；<br>
        · 时薪 ¥22 在同商圈处于中位，提升到 ¥25 可让报名量提升约 40%；<br>
        · 已有 3 名学生可加入「班底」，下次一键邀约，到岗率可达 98%。</div>
    </div>
  </div>`;
}

function vMerchantAuth() {
  const m = merchantById(state.merchantId);
  return `${topbarHTML('商家认证', '审核约 1 个工作日')}
  <div class="pad">
    <div class="notice amber">当前门店 <b>${esc(m.name)}</b> 尚未通过认证，无法发布岗位。</div>
    <div class="card">
      <div class="li"><div class="grow"><div class="k">营业执照</div><div class="v">OCR 自动识别 + 统一社会信用代码核验</div></div>${badge('待核验', 'amber')}</div>
      <div class="li"><div class="grow"><div class="k">门店照片</div><div class="v">门头照 + 内景照，用于学生判断真实性</div></div>${badge('缺少门头照', 'red')}</div>
      <div class="li"><div class="grow"><div class="k">门店定位打卡</div><div class="v">到店打卡，与填写地址偏差需 ≤ 200m</div></div>${badge('未打卡', 'gray')}</div>
      <div class="li"><div class="grow"><div class="k">经办人身份</div><div class="v">法人身份证或授权书 + 经办人身份证</div></div>${badge('未提交', 'gray')}</div>
    </div>
    <div class="card flat center" style="padding:24px;border-style:dashed">
      <div style="font-size:26px">📷</div>
      <div class="small muted mt6">上传门头照（演示）</div>
    </div>
    <div class="notice blue">认证通过后，你的岗位会显示「已认证」标识，报名转化率平均提升 2.3 倍。</div>
  </div>
  <div class="actionbar"><button class="btn primary block" data-act="auth-submit">提交认证</button></div>`;
}

function vPostJob() {
  const m = merchantById(state.merchantId);
  const d = state.params.draft || {
    title: '', cat: '餐饮帮工', slots: ['sat-eve'], pay: 22, hours: 5,
    headcount: 2, mode: 'apply', credit: 600, tags: [], desc: '', bonus: '', urgent: false
  };
  const amount = d.pay * d.hours * d.headcount;
  const lowPay = d.pay < 18;
  const noSlot = d.slots.length === 0;

  return `${topbarHTML('发布兼职', `${m.name} · 已认证`)}
  <div class="pad">
    <div class="card">
      <div class="field"><label>岗位模板（快速填充）</label>
        <div class="chips">${['餐饮帮工', '零售促销', '活动执行', '仓储分拣'].map(c =>
          `<button class="chip sm ${d.cat === c ? 'on' : ''}" data-act="draft-cat" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div></div>
      <div class="field"><label>岗位标题</label>
        <input class="input" id="pj-title" value="${esc(d.title)}" placeholder="例如：周六晚高峰传菜员" data-act="draft-title"></div>
      <div class="field"><label>工作时段（可多选）</label>
        <div class="chips">${SLOTS.map(s =>
          `<button class="chip sm ${d.slots.indexOf(s.id) >= 0 ? 'on' : ''}" data-act="draft-slot" data-v="${s.id}">${s.label}</button>`).join('')}</div>
        ${noSlot ? '<div class="hintline" style="color:#f5222d">请至少选择一个时段</div>' : ''}</div>
      <div class="row" style="gap:10px">
        <div class="field grow"><label>时薪（元/时）</label>
          <input class="input ${lowPay ? 'err' : ''}" type="number" id="pj-pay" value="${d.pay}" data-act="draft-pay">
          ${lowPay ? '<div class="hintline" style="color:#f5222d">低于本地最低小时工资，将无法通过审核</div>' : '<div class="hintline">同商圈中位价 ¥22</div>'}</div>
        <div class="field grow"><label>每人时长（小时）</label>
          <input class="input" type="number" id="pj-hours" value="${d.hours}" data-act="draft-hours"></div>
      </div>
      <div class="row" style="gap:10px">
        <div class="field grow"><label>招聘人数</label>
          <input class="input" type="number" id="pj-head" value="${d.headcount}" data-act="draft-head"></div>
        <div class="field grow"><label>录用方式</label>
          <select class="select" data-act="draft-mode">
            <option value="apply" ${d.mode === 'apply' ? 'selected' : ''}>报名后我筛选</option>
            <option value="grab" ${d.mode === 'grab' ? 'selected' : ''}>先到先得（急招）</option>
          </select></div>
      </div>
    </div>

    <div class="card">
      <div class="field"><label id="credit-label">报名门槛：信用分 ≥ ${d.credit}</label>
        <input type="range" min="500" max="800" step="50" value="${d.credit}" style="width:100%" data-act="draft-credit">
        <div class="hintline">门槛越高，报名人数越少但到岗率越高。建议 600。</div></div>
      <div class="field"><label>需要的技能标签</label>
        <div class="chips">${ALL_TAGS.map(t =>
          `<button class="chip sm ${d.tags.indexOf(t) >= 0 ? 'on' : ''}" data-act="draft-tag" data-v="${esc(t)}">${esc(t)}</button>`).join('')}</div></div>
      <div class="field"><label>工作内容</label>
        <textarea class="textarea" id="pj-desc" placeholder="写清具体做什么、有没有老员工带、穿什么衣服" data-act="draft-desc">${esc(d.desc)}</textarea></div>
      <div class="field"><label>福利 / 补贴</label>
        <input class="input" id="pj-bonus" value="${esc(d.bonus)}" placeholder="例如：包工作餐、满勤奖 20 元" data-act="draft-bonus"></div>
      <div class="li"><div class="grow"><div class="k">⚡ 标记为急招</div><div class="v">进入急招专区，曝光量提升约 3 倍</div></div>
        <button class="chip sm ${d.urgent ? 'on' : ''}" data-act="draft-urgent">${d.urgent ? '已开启' : '开启'}</button></div>
    </div>

    <div class="card" style="background:#23252b;color:#fff">
      <div class="card-h"><div class="t" style="color:#fff">费用预估</div></div>
      <div class="row between small" style="opacity:.85"><span>工资总额（${d.headcount} 人 × ${d.hours}h × ¥${d.pay}）</span><span id="fee-gross">¥${amount}</span></div>
      <div class="row between small mt6" style="opacity:.85"><span>平台服务费（MVP 期免佣）</span><span>¥0</span></div>
      <div class="row between mt10" style="padding-top:9px;border-top:1px solid rgba(255,255,255,.15)">
        <b>需预付到托管账户</b><b class="pay" id="fee-total" style="font-size:18px">¥${amount}</b></div>
      <div class="small mt6" style="opacity:.65;line-height:1.6">资金由平台托管，学生完成履约后才结算；若最终无人到岗，全额退回。</div>
    </div>
    <div class="notice">发布后将进入平台审核（约 1 小时），通过后自动向匹配学生推送。</div>
  </div>
  <div class="actionbar">
    <button class="btn ghost" data-act="draft-reset">重置</button>
    <button class="btn primary" id="publish-btn" ${(!d.title || noSlot || lowPay) ? 'disabled' : ''} data-act="publish-job">发布并预付 <span id="fee-bottom">¥${amount}</span></button>
  </div>`;
}

function vApplicants() {
  const m = merchantById(state.merchantId);
  const jobFilter = state.params.id || '';
  const jobs = jobsOfMerchant(m.id);
  const list = ordersOfMerchant(m.id).filter(o =>
    ['applied', 'hired'].indexOf(o.status) >= 0 && (!jobFilter || o.jobId === jobFilter));
  list.sort((a, b) => {
    const sa = matchScore(studentById(a.studentId), jobById(a.jobId)).total;
    const sb = matchScore(studentById(b.studentId), jobById(b.jobId)).total;
    return sb - sa;
  });

  return `${topbarHTML('报名管理', `${list.length} 条待处理`)}
  <div class="pad">
    <div class="scroller" style="padding-left:0;padding-right:0;margin-bottom:10px">
      <button class="chip ${!jobFilter ? 'on' : ''}" data-act="go" data-view="applicants">全部岗位</button>
      ${jobs.map(j => `<button class="chip ${jobFilter === j.id ? 'on' : ''}" data-act="go" data-view="applicants" data-id="${j.id}">${esc(j.title.slice(0, 8))}</button>`).join('')}
    </div>

    ${list.length ? list.map(o => {
      const stu = studentById(o.studentId), job = jobById(o.jobId), sc = matchScore(stu, job);
      const isNew = o.status === 'applied';
      return `<div class="card">
        <div class="row">
          <div class="avatar ${stu.credit >= 700 ? '' : 'b'}">${esc(stu.avatar)}</div>
          <div class="grow">
            <div class="row" style="gap:6px"><b style="font-size:14.5px">${esc(stu.name)}</b>
              ${stu.credit >= 700 ? badge('优质', 'green') : ''}${stu.noShow ? badge('有爽约记录', 'red') : ''}</div>
            <div class="small muted mt6">${esc(stu.school)} · ${esc(stu.grade)} · 完成 ${stu.completed} 单</div>
          </div>
          <div class="match ${sc.total >= 80 ? '' : 'mid'}" style="flex:0 0 48px"><b>${Math.round(sc.total)}</b><span>匹配度</span></div>
        </div>
        <div class="row mt10" style="gap:5px;flex-wrap:wrap">
          ${badge('信用 ' + stu.credit, 'green')}${badge('评分 ' + (stu.rating || '—'), 'amber')}
          ${badge('履约率 ' + Math.round(sc.parts.fulfill) + '%', 'blue')}
          ${stu.tags.slice(0, 2).map(t => badge(t, 'gray')).join('')}
        </div>
        ${o.intro ? `<div class="small mt10" style="background:#f7f8fa;padding:9px;border-radius:9px;line-height:1.6">“${esc(o.intro)}”</div>` : ''}
        <div class="row between mt10" style="padding-top:9px;border-top:1px dashed var(--line)">
          <span class="small muted">报名 ${esc(job.title)} · ${ago(o.createdAt)}</span>
          ${isNew ? `<span>
            <button class="btn xs ghost" data-act="reject-order" data-id="${o.id}">不合适</button>
            <button class="btn xs primary" data-act="hire-order" data-id="${o.id}">录用</button></span>`
          : `<span>${badge('已录用', 'green')} <button class="btn xs ghost" data-act="open-order" data-id="${o.id}">详情</button></span>`}
        </div>
      </div>`;
    }).join('') : emptyBox('📥', '暂无待处理报名', '发布岗位后，匹配学生的报名会出现在这里')}
  </div>`;
}

function vMerchantOrders() {
  const m = merchantById(state.merchantId);
  const list = ordersOfMerchant(m.id).sort((a, b) => b.createdAt - a.createdAt);
  const groups = [
    ['待到岗', list.filter(o => o.status === 'hired')],
    ['工作中', list.filter(o => o.status === 'checked_in')],
    ['待确认工时', list.filter(o => o.status === 'checked_out')],
    ['待结算', list.filter(o => o.status === 'confirmed')],
    ['已完成', list.filter(o => ['settled', 'done'].indexOf(o.status) >= 0)]
  ];
  return `${topbarHTML('订单与履约', '扫码核销 · 工时确认')}
  <div class="pad">
    ${groups.map(([t, arr]) => arr.length ? `<div class="sec-title">${t} <span class="r">${arr.length}</span></div>
      ${arr.map(o => {
        const stu = studentById(o.studentId), job = jobById(o.jobId);
        return `<div class="card tight">
        <div class="row between">
          <div class="grow"><div style="font-weight:700;font-size:13.5px">${esc(stu.name)} · ${esc(job.title)}</div>
            <div class="small muted mt6">${slotText(o.slot)} · ¥${o.pay}/时 × ${o.hours}h = <b class="pay">¥${o.amount}</b></div></div>
          ${statusBadge(o.status)}
        </div>
        ${o.checkIn ? `<div class="small muted mt6">签到 ${fmtDT(o.checkIn.time)}${o.checkOut ? ' · 签退 ' + fmtDT(o.checkOut.time) : ''}</div>` : ''}
        <div class="row between mt10" style="padding-top:9px;border-top:1px dashed var(--line)">
          <span class="small muted">${ago(o.createdAt)} 创建</span>
          <span>
            ${o.status === 'hired' ? `<button class="btn xs dark" data-act="scan-in" data-id="${o.id}">代核销签到</button>` : ''}
            ${o.status === 'checked_out' ? `<button class="btn xs primary" data-act="confirm-hours" data-id="${o.id}">确认工时</button>` : ''}
            ${o.status === 'confirmed' ? `<button class="btn xs primary" data-act="pay-order" data-id="${o.id}">立即结算</button>` : ''}
            ${['settled', 'done'].indexOf(o.status) >= 0 && !o.theirReview ? `<button class="btn xs ghost" data-act="go" data-view="reviewStudent" data-id="${o.id}">评价学生</button>` : ''}
          </span>
        </div></div>`;
      }).join('')}` : '').join('')}
    ${!list.length ? emptyBox('📋', '还没有订单', '学生报名并被录用后，订单会出现在这里') : ''}
  </div>`;
}

function vSettle() {
  const m = merchantById(state.merchantId);
  const os = ordersOfMerchant(m.id);
  const toPay = os.filter(o => o.status === 'confirmed');
  const paid = os.filter(o => ['settled', 'done'].indexOf(o.status) >= 0);
  const escrow = os.filter(o => ['hired', 'checked_in', 'checked_out'].indexOf(o.status) >= 0);
  const sum = a => a.reduce((x, o) => x + o.amount, 0);
  const fee = o => Math.round(o.amount * 0.05 * 100) / 100;

  return `${topbarHTML('结算中心', '资金托管 · 履约后结算')}
  <div class="pad">
    <div class="stats">
      <div class="stat amber"><b>${toPay.length}</b><span>待结算单</span></div>
      <div class="stat blue"><b>¥${sum(escrow)}</b><span>托管中</span></div>
      <div class="stat green"><b>¥${sum(paid)}</b><span>已结算</span></div>
    </div>

    <div class="sec-title">待结算 <span class="r">确认工时后即可结算</span></div>
    ${toPay.length ? toPay.map(o => `<div class="card tight">
      <div class="row between"><div class="grow"><div style="font-weight:600;font-size:13.5px">${esc(studentById(o.studentId).name)} · ${esc(jobById(o.jobId).title)}</div>
        <div class="small muted mt6">${o.hours} 小时 × ¥${o.pay}</div></div>
        <div style="text-align:right"><div class="pay">¥${o.amount}</div><div class="small muted">服务费 ¥${fee(o)}（MVP 免）</div></div></div>
      <button class="btn xs primary block mt10" data-act="pay-order" data-id="${o.id}">立即结算 ¥${o.amount}</button></div>`).join('')
      : '<div class="card flat center small muted" style="padding:20px">暂无待结算订单</div>'}

    <div class="sec-title">已结算记录 <span class="r">共 ${paid.length} 笔</span></div>
    ${paid.map(o => `<div class="card tight"><div class="row between">
      <div class="grow"><div style="font-weight:600;font-size:13px">${esc(studentById(o.studentId).name)} · ${esc(jobById(o.jobId).title)}</div>
        <div class="small muted mt6">${fmtDT(o.settledAt || o.createdAt)} · ${o.hours}h</div></div>
      <div style="text-align:right"><div class="pay">¥${o.amount}</div><div class="small muted">已打款</div></div></div></div>`).join('')}

    <div class="card flat">
      <div class="card-h"><div class="t">费用规则</div></div>
      <div class="small muted" style="line-height:1.8">
        · 发布岗位时预付工资到平台托管账户；<br>
        · 学生完成履约、你确认工时后，平台 T+1 打款给学生；<br>
        · 平台服务费 5%（MVP 阶段免收，商业化后启用）；<br>
        · 学生未到岗：全额退回托管金额，并自动补充候补学生。</div>
    </div>
  </div>`;
}

function vMerchantMe() {
  const m = merchantById(state.merchantId);
  const st = merchantStats(m.id);
  const reviews = DB.orders.filter(o => o.merchantId === m.id && o.review).slice(0, 3);
  return `${topbarHTML('店铺主页', m.verified ? '已认证商家' : '未认证')}
  <div class="pad">
    <div class="card">
      <div class="row">
        <div class="avatar lg">${esc(m.avatar)}</div>
        <div class="grow"><div class="row" style="gap:6px"><b style="font-size:16px">${esc(m.name)}</b>${m.verified ? badge('已认证', 'green') : badge('待认证', 'amber')}</div>
          <div class="small muted mt6">${esc(m.cat)} · ${esc(m.addr)}</div>
          <div class="row mt6" style="gap:6px">${badge('评分 ' + (m.rating || '—'), 'amber')}${badge('信用 ' + m.credit, 'green')}${badge('成交 ' + m.orders + ' 单', 'blue')}</div></div>
      </div>
      <div class="tags mt10">${m.tags.map(t => `<span class="chip sm static">${esc(t)}</span>`).join('')}</div>
    </div>

    <div class="stats">
      <div class="stat green"><b>${st.arriveRate}%</b><span>学生到岗率</span></div>
      <div class="stat blue"><b>${st.total}</b><span>累计订单</span></div>
      <div class="stat amber"><b>${m.noShowRate ? Math.round(m.noShowRate * 100) + '%' : '0%'}</b><span>爽约率</span></div>
    </div>

    <div class="card mt10">
      <div class="card-h"><div class="t">店铺资料</div><span class="small muted">完善后可提升报名率</span></div>
      <div class="li"><div class="grow"><div class="k">营业执照</div><div class="v">${esc(m.license)}</div></div>${m.verified ? badge('已核验', 'green') : badge('待核验', 'amber')}</div>
      <div class="li"><div class="grow"><div class="k">门店照片</div><div class="v">${m.photos} 张（门头 / 内景 / 工作区）</div></div><span class="arrow">›</span></div>
      <div class="li"><div class="grow"><div class="k">对接人</div><div class="v">${esc(m.contact)} · ${esc(m.phone)}</div></div><span class="arrow">›</span></div>
    </div>

    <div class="card">
      <div class="card-h"><div class="t">学生评价</div><span class="small muted">${reviews.length} 条</span></div>
      ${reviews.length ? reviews.map(o => `<div class="li">
        <div class="grow"><div class="k">${starsHTML(o.review.stars)}</div>
          <div class="v">${esc(o.review.comment)}</div>
          <div class="v">${esc(studentById(o.studentId).name)} · ${esc(jobById(o.jobId).title)}</div></div></div>`).join('')
        : '<div class="small muted">还没有学生评价</div>'}
    </div>

    <div class="card">
      <div class="card-h"><div class="t">我的班底</div><span class="small muted">长期合作学生</span></div>
      <div class="small muted" style="line-height:1.7">把满意学生加入班底后，下次发单可一键定向邀约，到岗率可达 98%。</div>
      <button class="btn ghost sm block mt10" data-act="go" data-view="talent">查看候选池</button>
    </div>

    <div class="card">
      <div class="card-h"><div class="t">演示设置</div></div>
      <div class="li"><div class="grow"><div class="k">切换演示店铺</div><div class="v">${esc(m.name)}</div></div>
        <button class="btn xs ghost" data-act="switch-merchant-next">换一个</button></div>
    </div>
  </div>`;
}

function vTalent() {
  const m = merchantById(state.merchantId);
  const pool = DB.students.filter(s => s.cert.real).map(s => ({ s, sc: matchScore(s, jobsOfMerchant(m.id)[0] || DB.jobs[0]) }));
  pool.sort((a, b) => b.sc.total - a.sc.total);
  return `${topbarHTML('我的班底', '候选池按匹配度排序')}
  <div class="pad">
    <div class="notice green">班底学生 = 合作过且评价良好的学生。下次发单可一键邀约，到岗率平均 98%。</div>
    ${pool.map(({ s, sc }) => `<div class="card tight"><div class="row">
      <div class="avatar sm ${s.credit >= 700 ? '' : 'b'}">${esc(s.avatar)}</div>
      <div class="grow"><div style="font-weight:600;font-size:13.5px">${esc(s.name)} ${s.team && s.team.indexOf(m.id) >= 0 ? badge('班底', 'green') : ''}</div>
        <div class="row mt6" style="gap:5px">${badge('信用 ' + s.credit, 'green')}${badge('完成 ' + s.completed + ' 单', 'blue')}${badge('匹配 ' + Math.round(sc.total), 'amber')}</div></div>
      <button class="btn xs primary" data-act="invite" data-id="${s.id}">邀请</button></div></div>`).join('')}
  </div>`;
}

function vReviewStudent() {
  const o = orderById(state.params.id);
  const stu = studentById(o.studentId);
  const p = state.params;
  const s = p.stars || 5;
  return `${topbarHTML('评价学生')}
  <div class="pad">
    <div class="card center">
      <div class="avatar lg" style="margin:0 auto 10px">${esc(stu.avatar)}</div>
      <div style="font-weight:700">${esc(stu.name)}</div>
      <div class="small muted mt6">${esc(jobById(o.jobId).title)} · ¥${o.amount}</div>
      <div style="font-size:30px;margin-top:14px">${[1, 2, 3, 4, 5].map(i =>
        `<span data-act="set-stars" data-v="${i}" style="cursor:pointer;color:${i <= s ? '#ff9f0a' : '#dcdfe5'}">★</span>`).join('')}</div>
    </div>
    <div class="card">
      <div class="card-h"><div class="t">印象标签</div></div>
      <div class="chips">${['准时到岗', '干活麻利', '态度好', '学习快', '有待提升', '下次还找'].map(t =>
        `<button class="chip sm ${(p.tags || []).indexOf(t) >= 0 ? 'on' : ''}" data-act="toggle-rtag" data-v="${esc(t)}">${esc(t)}</button>`).join('')}</div>
    </div>
    <div class="field"><label>评价内容（可选）</label>
      <textarea class="textarea" id="rev-comment" placeholder="例如：准时到店，手脚麻利，欢迎下次再来"></textarea></div>
    <div class="li"><div class="grow"><div class="k">⭐ 加入我的班底</div><div class="v">下次发单可一键定向邀约</div></div>
      <button class="chip sm ${p.joinTeam ? 'on' : ''}" data-act="toggle-team">${p.joinTeam ? '已加入' : '加入'}</button></div>
    <div class="notice blue">评价将计入学生信用分与履约率，请客观填写。</div>
  </div>
  <div class="actionbar"><button class="btn primary block" data-act="submit-mreview" data-id="${o.id}">提交评价</button></div>`;
}

/* ==========================================================
 * 平台管理端
 * ========================================================== */
function vAudit() {
  const pend = DB.audits.filter(a => a.status === 'pending');
  const doneList = DB.audits.filter(a => a.status !== 'pending').slice(0, 6);
  const refund = a => a.kind === 'merchant' ? merchantById(a.refId) : jobById(a.refId);
  return `${topbarHTML('审核中心', `${pend.length} 条待处理`)}
  <div class="pad">
    <div class="stats">
      <div class="stat amber"><b>${DB.merchants.filter(m => !m.verified).length}</b><span>待审商家</span></div>
      <div class="stat blue"><b>${DB.jobs.filter(j => j.status === 'pending').length}</b><span>待审岗位</span></div>
      <div class="stat green"><b>${DB.audits.filter(a => a.status === 'passed').length}</b><span>今日已通过</span></div>
    </div>

    <div class="sec-title">待处理 <span class="r">按提交时间排序</span></div>
    ${pend.length ? pend.map(a => {
      const obj = refund(a);
      if (!obj) return '';
      const isM = a.kind === 'merchant';
      return `<div class="card">
        <div class="row between"><div class="row" style="gap:8px">
          <div class="avatar sm g">${esc(obj.avatar || '?')}</div>
          <div><div style="font-weight:700;font-size:13.5px">${esc(obj.name)}</div>
            <div class="small muted">${isM ? '商家入驻认证' : '岗位发布审核'} · ${ago(a.createdAt)}</div></div></div>
          ${badge(isM ? '商家' : '岗位', isM ? 'blue' : 'green')}</div>
        <div class="notice mt10" style="font-size:11.5px">${esc(a.note)}</div>
        ${isM ? `<div class="li"><div class="grow"><div class="k">营业执照</div><div class="v">${esc(obj.license)}</div></div>${badge('OCR 识别', 'gray')}</div>
          <div class="li"><div class="grow"><div class="k">门店地址</div><div class="v">${esc(obj.addr)}</div></div>${badge('定位偏差 120m', 'amber')}</div>
          <div class="li"><div class="grow"><div class="k">门头照</div><div class="v">未上传</div></div>${badge('缺失', 'red')}</div>`
        : `<div class="li"><div class="grow"><div class="k">时薪校验</div><div class="v">¥${obj.pay}/时 · 高于本地最低标准</div></div>${badge('通过', 'green')}</div>
          <div class="li"><div class="grow"><div class="k">类目合规</div><div class="v">${esc(obj.cat)} · 夜市类目需人工复核</div></div>${badge('人工复核', 'amber')}</div>
          <div class="li"><div class="grow"><div class="k">敏感词检测</div><div class="v">押金 / 刷单 / 贷款 等违规词</div></div>${badge('未命中', 'green')}</div>`}
        <div class="btn-row mt10">
          <button class="btn danger sm" data-act="audit-reject" data-id="${a.id}">驳回</button>
          <button class="btn primary sm" data-act="audit-pass" data-id="${a.id}">通过</button></div>
      </div>`;
    }).join('') : emptyBox('✅', '审核队列已清空', '所有商家与岗位均已处理')}

    <div class="sec-title">最近处理记录</div>
    ${doneList.map(a => `<div class="card tight"><div class="row between">
      <div class="grow"><div style="font-weight:600;font-size:13px">${esc((refund(a) || {}).name || a.refId)}</div>
        <div class="small muted mt6">${a.kind === 'merchant' ? '商家认证' : '岗位审核'} · ${ago(a.decidedAt || a.createdAt)}</div></div>
      ${a.status === 'passed' ? badge('已通过', 'green') : badge('已驳回', 'red')}</div></div>`).join('')}
  </div>`;
}

function vAdminOrders() {
  const list = DB.orders.slice().sort((a, b) => b.createdAt - a.createdAt);
  const ps = platformStats();
  return `${topbarHTML('订单管理', `共 ${ps.orders} 单 · GMV ¥${ps.gmv}`)}
  <div class="pad">
    <div class="stats">
      <div class="stat blue"><b>${ps.matchRate}%</b><span>撮合成功率</span></div>
      <div class="stat green"><b>${ps.fulfillRate}%</b><span>履约完成率</span></div>
      <div class="stat amber"><b>${ps.openTickets}</b><span>待处理工单</span></div>
    </div>
    <div class="sec-title">全部订单 <span class="r">实时</span></div>
    ${list.map(o => {
      const stu = studentById(o.studentId), m = merchantById(o.merchantId), j = jobById(o.jobId);
      return `<div class="card tight">
        <div class="row between"><div class="grow">
          <div style="font-weight:600;font-size:13px">${esc(stu.name)} → ${esc(m.name)}</div>
          <div class="small muted mt6">${esc(j.title)} · ${slotText(o.slot)} · ${fmtDT(o.createdAt)}</div></div>
          <div style="text-align:right">${statusBadge(o.status)}<div class="pay mt6">¥${o.amount}</div></div></div>
        ${o.status === 'disputed' ? `<div class="notice red mt10">该订单存在争议，资金已冻结
          <button class="btn xs danger" style="margin-top:6px" data-act="go" data-view="disputes">去处理</button></div>` : ''}
      </div>`;
    }).join('')}
  </div>`;
}

function vDisputes() {
  const list = DB.tickets.slice().sort((a, b) => b.createdAt - a.createdAt);
  const open = list.filter(t => t.status === 'open');
  return `${topbarHTML('纠纷与风控', `${open.length} 个待处理工单`)}
  <div class="pad">
    <div class="notice red"><b>处理原则：</b>钱在平台手里、证据在线上、判定有时限（24h 响应 / 72h 结案）、结果可追溯。金额 ≤200 元且证据不足时，平台可先行垫付学生。</div>

    <div class="sec-title">待处理工单</div>
    ${open.length ? open.map(t => {
      const stu = studentById(t.from) || { name: t.from };
      const o = t.orderId !== '-' ? orderById(t.orderId) : null;
      return `<div class="card">
        <div class="row between"><div><b style="font-size:13.5px">${esc(t.type)}</b>
          <div class="small muted mt6">${esc(t.title)}</div></div>${badge('待处理', 'amber')}</div>
        <div class="small mt10" style="background:#f7f8fa;padding:10px;border-radius:9px;line-height:1.65">${esc(t.detail)}</div>
        <div class="li"><div class="grow"><div class="k">发起人</div><div class="v">学生 ${esc(stu.name)} · ${ago(t.createdAt)}</div></div></div>
        <div class="li"><div class="grow"><div class="k">关联订单</div><div class="v">${o ? esc(jobById(o.jobId).title) + ' · ¥' + o.amount : '未关联'}</div></div></div>
        <div class="li"><div class="grow"><div class="k">证据材料</div><div class="v">签到定位记录、聊天记录、现场照片（3 项）</div></div>${badge('已聚合', 'green')}</div>
        <div class="btn-row mt10">
          <button class="btn danger sm" data-act="resolve-ticket" data-id="${t.id}" data-favor="merchant">判商家无责</button>
          <button class="btn primary sm" data-act="resolve-ticket" data-id="${t.id}" data-favor="student">支持学生（垫付）</button></div>
      </div>`;
    }).join('') : emptyBox('⚖️', '没有待处理纠纷', '平台运行良好')}

    <div class="sec-title">风控预警</div>
    <div class="card tight"><div class="row between"><div class="grow">
      <div style="font-weight:600;font-size:13px">⚠️ 深夜烧烤吧 · 夜市类目</div>
      <div class="small muted mt6">夜间时段 + 未认证商家，已限制发布</div></div>${badge('高风险', 'red')}</div></div>
    <div class="card tight"><div class="row between"><div class="grow">
      <div style="font-weight:600;font-size:13px">⚠️ 陈子豪 · 爽约 1 次</div>
      <div class="small muted mt6">近 30 天取消 1 次，已扣信用分，限流 7 天观察</div></div>${badge('中风险', 'amber')}</div></div>

    <div class="sec-title">已结案</div>
    ${list.filter(t => t.status === 'closed').map(t => `<div class="card tight"><div class="row between">
      <div class="grow"><div style="font-weight:600;font-size:13px">${esc(t.title)}</div>
        <div class="small muted mt6">${esc(t.result)} · 处理人 ${esc(t.handler)}</div></div>${badge('已结案', 'green')}</div></div>`).join('')
      || '<div class="card flat center small muted" style="padding:18px">暂无结案记录</div>'}
  </div>`;
}

function vDashboard() {
  const ps = platformStats();
  const weeks = [42, 58, 71, 96, 118, 156, ps.done || 12];
  const max = Math.max.apply(null, weeks);
  const funnel = [
    ['岗位发布', ps.jobs, ps.jobs / ps.jobs * 100],
    ['学生报名', ps.orders, 100],
    ['商家录用', ps.hired, ps.orders ? ps.hired / ps.orders * 100 : 0],
    ['到岗签到', DB.orders.filter(o => ['checked_in', 'checked_out', 'confirmed', 'settled', 'done'].indexOf(o.status) >= 0).length, 0],
    ['完成结算', ps.done, ps.orders ? ps.done / ps.orders * 100 : 0]
  ];
  funnel[3][2] = ps.orders ? funnel[3][1] / ps.orders * 100 : 0;

  const cats = {};
  DB.jobs.forEach(j => { if (j.status === 'online') cats[j.cat] = (cats[j.cat] || 0) + 1; });
  const catMax = Math.max.apply(null, Object.keys(cats).map(k => cats[k]).concat([1]));

  return `${topbarHTML('数据看板', '平台运营总览')}
  <div class="pad">
    <div class="card" style="background:linear-gradient(135deg,#07c160,#21d07a);color:#fff">
      <div class="small" style="opacity:.9">北极星指标 · 每周成功履约并结算的工时数</div>
      <div style="font-size:34px;font-weight:800;letter-spacing:-1.5px">${ps.vshw}<span style="font-size:14px;font-weight:600"> 人·小时</span></div>
      <div class="small" style="opacity:.9;margin-top:6px">GMV ¥${ps.gmv} · 完成订单 ${ps.done} 单 · 该指标同时约束需求真实性、供给真实性与履约有效性</div>
    </div>

    <div class="sec-title">本周趋势</div>
    <div class="card">
      <div class="bars">${weeks.map((w, i) => `<div class="b" style="height:${Math.round(w / max * 100)}%"><i>${['W1', 'W2', 'W3', 'W4', 'W5', 'W6', '本周'][i]}</i></div>`).join('')}</div>
      <div style="height:16px"></div>
    </div>

    <div class="sec-title">转化漏斗</div>
    <div class="card">
      ${funnel.map(([k, v, p]) => `<div style="margin-bottom:9px">
        <div class="row between small"><span>${k}</span><b class="mono">${v} <span class="muted">(${Math.round(p)}%)</span></b></div>
        <div class="prog thin mt6"><i style="width:${Math.max(2, Math.round(p))}%"></i></div></div>`).join('')}
      <div class="small muted mt10">撮合成功率 ${ps.matchRate}% · 履约完成率 ${ps.fulfillRate}%</div>
    </div>

    <div class="stats">
      <div class="stat green"><b>${ps.certified}</b><span>认证学生</span></div>
      <div class="stat blue"><b>${ps.onlineJobs}</b><span>在招岗位</span></div>
      <div class="stat amber"><b>${ps.merchants}</b><span>入驻商家</span></div>
    </div>

    <div class="sec-title">类目分布</div>
    <div class="card">
      ${Object.keys(cats).map(k => `<div style="margin-bottom:9px">
        <div class="row between small"><span>${esc(k)}</span><b>${cats[k]}</b></div>
        <div class="prog thin mt6"><i style="width:${Math.round(cats[k] / catMax * 100)}%"></i></div></div>`).join('')}
    </div>

    <div class="sec-title">健康度预警</div>
    <div class="card tight"><div class="small" style="line-height:1.9">
      ${ps.fulfillRate >= 90 ? '✅' : '⚠️'} 履约完成率 ${ps.fulfillRate}%（目标 ≥90%）<br>
      ${ps.matchRate >= 55 ? '✅' : '⚠️'} 撮合成功率 ${ps.matchRate}%（目标 ≥55%）<br>
      ${ps.openTickets <= 3 ? '✅' : '⚠️'} 待处理工单 ${ps.openTickets} 个（目标 ≤3）<br>
      ${ps.pendingMerchants + ps.pendingJobs <= 5 ? '✅' : '⚠️'} 审核积压 ${ps.pendingMerchants + ps.pendingJobs} 条
    </div></div>
  </div>`;
}

/* ---------------- 通用空态 ---------------- */
function emptyBox(ic, t, d) {
  return `<div class="empty"><div class="ic">${ic}</div><div class="t">${esc(t)}</div>${d ? `<div class="d">${esc(d)}</div>` : ''}</div>`;
}

/* ==========================================================
 * 视图路由
 * ========================================================== */
const VIEWS = {
  student: {
    home: vStudentHome, job: vJobDetail, schedule: vSchedule, messages: vMessages,
    wallet: vWallet, me: vMe, onboard: vOnboard, subscribe: vSubscribe,
    search: vSearch, complaint: vComplaint, review: vReview, orderDetail: vOrderDetail
  },
  merchant: {
    home: vMerchantHome, applicants: vApplicants, orders: vMerchantOrders,
    settle: vSettle, me: vMerchantMe, post: vPostJob, auth: vMerchantAuth,
    talent: vTalent, reviewStudent: vReviewStudent, orderDetail: vOrderDetail
  },
  admin: {
    audit: vAudit, orders: vAdminOrders, disputes: vDisputes, dashboard: vDashboard
  }
};

function currentView() {
  const fn = VIEWS[state.role][state.view] || VIEWS[state.role][TABS[state.role][0].id];
  return fn();
}

function render() {
  const tabs = TABS[state.role];
  const isTab = tabs.some(t => t.id === state.view);
  state.params = state.params || {};
  $('screen').innerHTML = currentView();
  $('tabbar').style.display = state.role === 'admin' ? 'flex' : 'flex';
  $('tabbar').innerHTML = tabbarHTML();
  $('screen').scrollTop = 0;
  renderConsole();
  renderSheet();
}

/* ==========================================================
 * 演示控制台
 * ========================================================== */
const DEMO_SCRIPTS = [
  { role: 'student', actor: 's1', view: 'home', desc: '打开学生首页：系统按 <b>时间 25% · 距离 20% · 信用 15% · 履约 15%</b> 等维度加权推荐本周末岗位', run: () => '推荐流已按匹配度排序，最高 97%' },
  {
    role: 'student', actor: 's1', view: 'job', params: { id: 'j1' },
    desc: '查看「周六晚高峰传菜员」：时薪 ¥22、周六 18:00-22:00、距校区 0.8km', run: () => '已打开岗位详情，可查看匹配度诊断'
  },
  {
    role: 'student', actor: 's1', desc: '学生提交报名（附自我介绍）', run: () => {
      ensureOrder('s1', 'j1');
      const o = findOrder('s1', 'j1');
      if (o.status === 'applied') return '报名成功，等待商家处理';
      return '订单已存在（' + ORDER_STATUS[o.status].text + '）';
    }
  },
  { role: 'merchant', actor: 'm1', view: 'applicants', desc: '切到商家端：报名列表按<b>匹配度 / 信用分 / 履约率</b>排序，商家一眼判断', run: () => '商家看到 1 条新报名' },
  {
    role: 'merchant', actor: 'm1', desc: '商家点击「录用」，学生立即收到通知', run: () => {
      const o = findOrder('s1', 'j1');
      if (o.status === 'applied') { hireOrder(o.id); return '已录用林小雨，通知已推送'; }
      return '订单当前状态：' + ORDER_STATUS[o.status].text;
    }
  },
  { role: 'student', actor: 's1', view: 'schedule', desc: '学生日程自动写入，到岗前 24h / 2h 会有提醒', run: () => '日程已更新' },
  {
    role: 'student', actor: 's1', desc: '学生到店<b>扫码签到</b>（GPS 校验 ≤200m）', run: () => {
      const o = findOrder('s1', 'j1');
      if (o.status === 'hired') { checkIn(o.id); return '签到成功，定位校验通过'; }
      return '当前状态无法签到';
    }
  },
  {
    role: 'student', actor: 's1', desc: '工作结束<b>签退</b>，等待商家确认工时', run: () => {
      const o = findOrder('s1', 'j1');
      if (o.status === 'checked_in') { checkOut(o.id); return '签退成功'; }
      return '当前状态无法签退';
    }
  },
  {
    role: 'merchant', actor: 'm1', view: 'orders', desc: '商家核对签到记录并<b>确认工时</b>（超时 24h 系统自动确认）', run: () => {
      const o = findOrder('s1', 'j1');
      if (o.status === 'checked_out') { confirmHours(o.id); return '工时已确认：5 小时 / ¥110'; }
      return '当前状态：' + ORDER_STATUS[o.status].text;
    }
  },
  {
    role: 'merchant', actor: 'm1', desc: '平台从托管账户<b>结算打款</b>，学生钱包实时到账', run: () => {
      const o = findOrder('s1', 'j1');
      if (o.status === 'confirmed') { settleOrder(o.id); return '已结算 ¥110，学生信用分 +5'; }
      return '当前状态：' + ORDER_STATUS[o.status].text;
    }
  },
  { role: 'student', actor: 's1', view: 'wallet', desc: '学生钱包到账，可提现到微信零钱；同时提醒做评价', run: () => '钱包余额已更新' },
  {
    role: 'student', actor: 's1', view: 'review', params: () => ({ id: (findOrder('s1', 'j1') || {}).id }),
    desc: '双向盲评，48 小时后同时公开；最后切到平台端看<b>北极星指标</b>', run: () => {
      const o = findOrder('s1', 'j1');
      if (!o.review) { reviewOrder(o.id, 5, '老板人很好，工作餐也不错，下次还来', ['准时', '有工作餐']); return '评价已提交，订单完成'; }
      return '订单已完成';
    }
  },
  { role: 'admin', actor: '', view: 'dashboard', desc: '平台看板：北极星 = <b>每周成功履约并结算的工时数</b>，一次性校验需求、供给与履约真实性', run: () => '闭环完成 🎉' }
];

function findOrder(sid, jid) {
  return DB.orders.filter(o => o.studentId === sid && o.jobId === jid)
    .sort((a, b) => b.createdAt - a.createdAt)[0];
}
function ensureOrder(sid, jid) {
  if (!findOrder(sid, jid)) applyJob(sid, jid, '我做过餐饮服务，能吃苦，周六全天有空！');
}

function renderConsole() {
  const el = $('console');
  if (!el) return;
  const step = DB.meta.demoStep || 0;
  const scripts = DEMO_SCRIPTS;
  const cur = scripts[Math.min(step, scripts.length - 1)];
  const stuList = DB.students.map(s => `<button class="${state.role === 'student' && state.studentId === s.id ? 'on' : ''}" data-act="pick-student" data-id="${s.id}">${esc(s.name)}</button>`).join('');
  const merList = DB.merchants.filter(m => m.verified).map(m => `<button class="${state.role === 'merchant' && state.merchantId === m.id ? 'on' : ''}" data-act="pick-merchant" data-id="${m.id}">${esc(m.name)}</button>`).join('');

  el.innerHTML = `
    <h1>周末单 <span>· 交互原型</span></h1>
    <div class="sub">大学生周末兼职撮合平台 · 学生端 / 商家端 / 平台端 三端可切换，数据互通<br>
      <span style="color:#6f7885">纯前端演示，无需后端。点击手机内的任何卡片即可交互。</span></div>

    <div class="grp"><label>切换身份</label>
      <div class="seg">
        <button class="${state.role === 'student' ? 'on' : ''}" data-act="set-role" data-v="student">学生</button>
        <button class="${state.role === 'merchant' ? 'on' : ''}" data-act="set-role" data-v="merchant">商家</button>
        <button class="${state.role === 'admin' ? 'on' : ''}" data-act="set-role" data-v="admin">平台</button>
      </div>
    </div>

    ${state.role === 'student' ? `<div class="grp"><label>选择学生账号</label><div class="actor">${stuList}</div></div>` : ''}
    ${state.role === 'merchant' ? `<div class="grp"><label>选择商家账号</label><div class="actor">${merList}</div></div>` : ''}

    <div class="demo-box">
      <div style="font-size:11px;color:#7fe0a8;letter-spacing:1px;margin-bottom:6px">一键演示 · 完整撮合闭环（${Math.min(step, scripts.length)}/${scripts.length}）</div>
      <div class="step">${cur.desc}</div>
      <div class="dots">${scripts.map((_, i) => `<i class="${i < step ? 'on' : ''}"></i>`).join('')}</div>
      <button class="cbtn primary" data-act="demo-next">${step >= scripts.length ? '重新演示' : '执行下一步 ▶'}</button>
      <button class="cbtn ghost" data-act="demo-auto">自动播放全部</button>
    </div>

    <button class="cbtn ghost" data-act="reset">🔄 重置演示数据</button>

    <div class="grp" style="margin-top:14px"><label>操作日志</label>
      <div class="log">${(DB.logs || []).slice(0, 12).map(l => `<div><b>${fmtDT(l.t)}</b> ${esc(l.text)}</div>`).join('') || '<div>暂无操作，试试「执行下一步」</div>'}</div>
    </div>

    <div class="hint">
      💡 建议体验路径：<br>
      1）学生端完成认证 → 看匹配度诊断 → 报名<br>
      2）切到商家端 → 录用 → 确认工时 → 结算<br>
      3）切到学生端 → 签到签退 → 钱包 → 评价<br>
      4）切到平台端 → 审核入驻 → 处理纠纷 → 看北极星指标
    </div>`;
}

/* ==========================================================
 * 动作分发
 * ========================================================== */
function handleAct(act, el) {
  const id = el.dataset.id;
  const v = el.dataset.v;
  switch (act) {

    /* ---- 通用 ---- */
    case 'noop': return;
    case 'close-sheet': return closeSheet();
    case 'back': return go(TABS[state.role][0].id);
    case 'go': return go(el.dataset.view, id ? { id } : {});
    case 'set-role': {
      state.role = v;
      state.view = TABS[v][0].id;
      state.params = {};
      return render();
    }
    case 'pick-student': { state.studentId = id; state.view = 'home'; state.params = {}; return render(); }
    case 'pick-merchant': { state.merchantId = id; state.view = 'home'; state.params = {}; return render(); }
    case 'switch-student-next': {
      const i = DB.students.findIndex(s => s.id === state.studentId);
      state.studentId = DB.students[(i + 1) % DB.students.length].id;
      state.view = 'home'; return render();
    }
    case 'switch-merchant-next': {
      const list = DB.merchants.filter(m => m.verified);
      const i = list.findIndex(m => m.id === state.merchantId);
      state.merchantId = list[(i + 1) % list.length].id;
      state.view = 'home'; return render();
    }
    case 'reset': {
      if (confirm('确定要重置所有演示数据吗？')) {
        resetDB(); state.view = TABS[state.role][0].id; state.params = {};
        toast('演示数据已重置'); render();
      }
      return;
    }
    case 'call': return toast('正在通过隐私号拨号…<br><span style="opacity:.7;font-size:12px">真实号码在订单结束后 48 小时失效</span>');
    case 'nav': return toast('已打开地图导航（模拟）');
    case 'upload': return toast('已选择 3 张图片（模拟）');
    case 'fav': return toast('已加入收藏');
    case 'sos': return toast('🆘 已通知平台客服并共享位置<br><span style="opacity:.75;font-size:12px">紧急情况请直接拨打 110</span>');
    case 'bill': case 'export-resume': case 'withdraw-cash': return toast('演示原型暂不提供该功能');

    /* ---- 学生 ---- */
    case 'open-job': return go('job', { id });
    case 'open-order': return go('orderDetail', { id });
    case 'filter-slot': {
      state.filter.slot = el.dataset.slot || '';
      return render();
    }
    case 'filter-cat': { state.filter.cat = v; return render(); }
    case 'filter-pay': { state.filter.minPay = +el.value; return render(); }
    case 'filter-reset': { state.filter = { cat: '全部', slot: '', minPay: 0 }; return render(); }
    case 'toggle-tag': {
      const stu = studentById(state.studentId);
      const i = stu.tags.indexOf(v);
      if (i >= 0) stu.tags.splice(i, 1); else stu.tags.push(v);
      saveDB(); return render();
    }
    case 'toggle-avail': {
      const stu = studentById(state.studentId);
      const i = stu.avail.indexOf(v);
      if (i >= 0) stu.avail.splice(i, 1); else stu.avail.push(v);
      saveDB(); return render();
    }
    case 'set-expect': { studentById(state.studentId).expectPay = +el.value; saveDB(); return; }
    case 'apply-job': return confirmApply(id, false);
    case 'grab-job': return confirmApply(id, true);
    case 'do-apply': {
      const jobId = state.params.jobId, grab = state.params.grab;
      const intro = ($('apply-intro') || {}).value || '';
      const o = applyJob(state.studentId, jobId, intro);
      closeSheet();
      toast(grab ? '⚡ 抢单成功！<br><span style="font-size:12px;opacity:.8">' + jobById(jobId).title + '</span>'
        : '✅ 报名成功<br><span style="font-size:12px;opacity:.8">等待商家在 24 小时内处理</span>');
      go(grab ? 'orderDetail' : 'schedule', grab ? { id: o.id } : {});
      return;
    }
    case 'checkin': return doCheckIn(id);
    case 'do-checkin': { checkIn(id); closeSheet(); toast('✅ 签到成功<br><span style="font-size:12px;opacity:.8">GPS 校验通过 · 门店 80m 内</span>'); return go('orderDetail', { id }); }
    case 'checkout': {
      checkOut(id); toast('✅ 签退成功<br><span style="font-size:12px;opacity:.8">等待商家确认工时</span>');
      return go('orderDetail', { id });
    }
    case 'withdraw': {
      if (!confirm('开始前 12 小时内取消将扣除 5 分信用分，确定取消吗？')) return;
      withdrawOrder(id); toast('已取消报名，信用分 -5'); return render();
    }
    case 'set-stars': { state.params.stars = +v; return render(); }
    case 'toggle-rtag': {
      const tags = state.params.tags || (state.params.tags = []);
      const i = tags.indexOf(v);
      if (i >= 0) tags.splice(i, 1); else tags.push(v);
      return render();
    }
    case 'toggle-team': { state.params.joinTeam = !state.params.joinTeam; return render(); }
    case 'submit-review': {
      const comment = ($('rev-comment') || {}).value || '';
      reviewOrder(id, state.params.stars || 5, comment, state.params.tags || []);
      toast('⭐ 评价已提交<br><span style="font-size:12px;opacity:.8">信用分 +5，感谢你的反馈</span>');
      return go('schedule');
    }
    case 'submit-mreview': {
      const comment = ($('rev-comment') || {}).value || '';
      merchantReviewOrder(id, state.params.stars || 5, comment, !!state.params.joinTeam);
      toast('评价已提交');
      return go('orders');
    }
    case 'set-emergency': {
      studentById(state.studentId).emergency = { name: '妈妈', phone: '139****8877' };
      saveDB(); toast('紧急联系人已设置'); return render();
    }
    case 'ob-next': {
      const step = state.params.step || 0;
      const stu = studentById(state.studentId);
      if (step === 0) {
        const nm = ($('ob-name') || {}).value;
        if (nm) completeStudentAuth(stu.id, 'real', { name: nm }); else completeStudentAuth(stu.id, 'real', {});
      }
      if (step === 1) completeStudentAuth(stu.id, 'school', {});
      if (step === 2) completeStudentAuth(stu.id, 'profile', {});
      if (step === 3) { toast('开始找兼职吧！'); return go('home'); }
      state.params.step = step + 1;
      saveDB(); return render();
    }
    case 'ob-prev': { state.params.step = Math.max(0, (state.params.step || 0) - 1); return render(); }
    case 'pick-cert': { toast('已选择：' + ['学信网验证码', '学生证 OCR', '校园邮箱'][+el.dataset.i] + '<br><span style="font-size:12px;opacity:.8">模拟校验通过</span>'); return; }
    case 'sub-slot': case 'sub-cat': {
      const stu = studentById(state.studentId);
      const sub = state.params.sub || (state.params.sub = JSON.parse(JSON.stringify(stu.subscribe || { slots: ['sat-eve'], cats: ['餐饮帮工'], minPay: 18 })));
      const key = act === 'sub-slot' ? 'slots' : 'cats';
      const i = sub[key].indexOf(v);
      if (i >= 0) sub[key].splice(i, 1); else sub[key].push(v);
      return render();
    }
    case 'sub-pay': { (state.params.sub || (state.params.sub = { slots: [], cats: [], minPay: 18 })).minPay = +el.value; return render(); }
    case 'save-sub': {
      studentById(state.studentId).subscribe = state.params.sub;
      saveDB(); toast('✅ 订阅已保存<br><span style="font-size:12px;opacity:.8">有匹配新岗位会第一时间通知你</span>');
      return go('me');
    }
    case 'cp-type': case 'cp-order': case 'cp-detail': return;
    case 'submit-complaint': {
      const type = (document.querySelector('#cp-type .chip.on') || {}).textContent || '其他';
      const detail = ($('cp-detail') || {}).value || '（未填写描述）';
      const oid = ($('cp-order') || {}).value || '';
      submitTicket(state.studentId, oid, type.trim(), type.trim() + '：' + detail.slice(0, 18), detail);
      toast('✅ 投诉已提交<br><span style="font-size:12px;opacity:.8">客服将在 24 小时内联系你</span>');
      return go('schedule');
    }

    /* ---- 商家 ---- */
    case 'auth-submit': {
      merchantById(state.merchantId).verified = true;
      merchantById(state.merchantId).credit = 700;
      DB.audits.unshift({ id: uid('au'), kind: 'merchant', refId: state.merchantId, status: 'pending', note: '商家自助提交认证，待平台审核', createdAt: Date.now() });
      saveDB(); toast('认证材料已提交<br><span style="font-size:12px;opacity:.8">平台将在 1 个工作日内审核</span>');
      return render();
    }
    case 'draft-title': case 'draft-desc': case 'draft-bonus': return;
    case 'draft-cat': {
      const d = ensureDraft();
      d.cat = v;
      const tpl = { '餐饮帮工': { pay: 22, slots: ['sat-eve'], title: '周六晚高峰帮工', desc: '负责传菜、收拾桌面、简单引导，有老员工带。' },
        '零售促销': { pay: 25, slots: ['sat-am', 'sat-pm'], title: '门店促销员', desc: '引导顾客体验产品、登记会员，需表达清晰。' },
        '活动执行': { pay: 28, slots: ['sat-am'], title: '活动协助', desc: '物料发放、现场引导、维持秩序。' },
        '仓储分拣': { pay: 24, slots: ['sat-eve'], title: '周末分拣', desc: '包裹分拣、扫码上架，有推车。' } }[v];
      Object.assign(d, tpl);
      return render();
    }
    case 'draft-slot': {
      const d = ensureDraft(); const i = d.slots.indexOf(v);
      if (i >= 0) d.slots.splice(i, 1); else d.slots.push(v);
      return render();
    }
    case 'draft-tag': {
      const d = ensureDraft(); const i = d.tags.indexOf(v);
      if (i >= 0) d.tags.splice(i, 1); else d.tags.push(v);
      return render();
    }
    case 'draft-mode': { ensureDraft().mode = el.value; return render(); }
    case 'draft-pay': { const d = ensureDraft(); d.pay = +el.value; syncDraftInputs(); return render(); }
    case 'draft-hours': { const d = ensureDraft(); d.hours = +el.value; syncDraftInputs(); return render(); }
    case 'draft-head': { const d = ensureDraft(); d.headcount = +el.value; syncDraftInputs(); return render(); }
    case 'draft-credit': { ensureDraft().credit = +el.value; syncDraftInputs(); return render(); }
    case 'draft-urgent': { const d = ensureDraft(); d.urgent = !d.urgent; return render(); }
    case 'draft-reset': { state.params.draft = null; return render(); }
    case 'publish-job': {
      const d = syncDraftInputs();
      if (!d.title) return toast('请填写岗位标题');
      const j = publishJob(state.merchantId, d);
      state.params.draft = null;
      toast('✅ 已提交审核<br><span style="font-size:12px;opacity:.8">预计 1 小时内上线，通过后自动推送匹配学生</span>');
      return go('home');
    }
    case 'hire-order': {
      const r = hireOrder(id);
      toast(r.ok ? '✅ 已录用，通知已推送给学生' : '⚠️ ' + r.msg);
      return render();
    }
    case 'reject-order': {
      openSheet(`<h3>不合适的原因</h3><div class="desc">理由会展示给学生，避免「已读不回」影响体验。</div>
        <div class="chips">${['已招满', '经验不足', '距离过远', '时间不匹配'].map((r, i) =>
          `<button class="chip ${i === 0 ? 'on' : ''}" data-act="pick-reject" data-v="${esc(r)}">${esc(r)}</button>`).join('')}</div>
        <button class="btn primary block mt14" data-act="do-reject" data-id="${id}">确认拒绝</button>`);
      return;
    }
    case 'pick-reject': {
      document.querySelectorAll('.sheet .chip').forEach(c => c.classList.remove('on'));
      el.classList.add('on'); return;
    }
    case 'do-reject': {
      const reason = (document.querySelector('.sheet .chip.on') || {}).textContent || '已招满';
      rejectOrder(id, reason.trim()); closeSheet(); toast('已拒绝并通知学生'); return render();
    }
    case 'scan-in': { checkIn(id); toast('✅ 已代为核销签到'); return render(); }
    case 'confirm-hours': {
      const o = orderById(id);
      openSheet(`<h3>确认工时</h3><div class="desc">${esc(studentById(o.studentId).name)} · ${esc(jobById(o.jobId).title)}</div>
        <div class="card flat"><div class="row between"><span class="small muted">签到</span><b>${o.checkIn ? fmtDT(o.checkIn.time) : '—'}</b></div>
        <div class="row between mt10"><span class="small muted">签退</span><b>${o.checkOut ? fmtDT(o.checkOut.time) : '—'}</b></div>
        <div class="row between mt10"><span class="small muted">系统核算工时</span><b>${o.hours} 小时</b></div></div>
        <div class="field"><label>确认工时（小时）</label><input class="input" id="cf-hours" type="number" value="${o.hours}"></div>
        <div class="notice">确认后金额为 ¥${o.pay} × 工时，T+1 由平台打款给学生。若 24 小时未确认，系统将按签到记录自动确认。</div>
        <button class="btn primary block mt14" data-act="do-confirm" data-id="${id}">确认并进入结算</button>`);
      return;
    }
    case 'do-confirm': {
      const h = +($('cf-hours') || {}).value || orderById(id).hours;
      confirmHours(id, h); closeSheet(); toast('✅ 工时已确认'); return render();
    }
    case 'pay-order': { settleOrder(id); toast('💰 已结算<br><span style="font-size:12px;opacity:.8">工资已打入学生零钱，信用分 +5</span>'); return render(); }
    case 'invite': { toast('已向 ' + studentById(id).name + ' 发送定向邀约'); return; }

    /* ---- 平台 ---- */
    case 'audit-pass': { auditPass(id); toast('✅ 审核通过，已通知对方'); return render(); }
    case 'audit-reject': {
      openSheet(`<h3>驳回原因</h3><div class="desc">驳回后对方可修改资料重新提交。</div>
        <div class="chips">${['资料不完整', '营业执照存疑', '薪资低于最低标准', '类目不合规'].map((r, i) =>
          `<button class="chip ${i === 0 ? 'on' : ''}" data-act="pick-reject" data-v="${esc(r)}">${esc(r)}</button>`).join('')}</div>
        <button class="btn primary block mt14" data-act="do-audit-reject" data-id="${id}">确认驳回</button>`);
      return;
    }
    case 'do-audit-reject': {
      const reason = (document.querySelector('.sheet .chip.on') || {}).textContent || '资料不完整';
      auditReject(id, reason.trim()); closeSheet(); toast('已驳回并通知对方'); return render();
    }
    case 'resolve-ticket': {
      const favor = el.dataset.favor;
      resolveTicket(id, favor === 'student' ? '支持学生 · 平台先行垫付 ¥110，向商家追偿' : '商家无责 · 按签到记录结算', favor);
      toast(favor === 'student' ? '✅ 已支持学生并垫付' : '✅ 已判定商家无责');
      return render();
    }

    /* ---- 演示 ---- */
    case 'demo-next': return demoNext();
    case 'demo-auto': return demoAuto();
    default: return;
  }
}

function ensureDraft() {
  if (!state.params.draft) {
    state.params.draft = {
      title: '', cat: '餐饮帮工', slots: ['sat-eve'], pay: 22, hours: 5,
      headcount: 2, mode: 'apply', credit: 600, tags: [], desc: '', bonus: '', urgent: false
    };
  }
  return state.params.draft;
}
function syncDraftInputs() {
  const d = state.params.draft || {};
  const t = $('pj-title'); if (t) d.title = t.value;
  const de = $('pj-desc'); if (de) d.desc = de.value;
  const b = $('pj-bonus'); if (b) d.bonus = b.value;
  const p = $('pj-pay'); if (p) d.pay = +p.value || 0;
  const h = $('pj-hours'); if (h) d.hours = +h.value || 0;
  const hd = $('pj-head'); if (hd) d.headcount = +hd.value || 0;
  state.params.draft = d;
  return d;
}

/* 局部刷新费用预估与按钮可用状态（避免整页重渲染打断输入） */
function updateFeePreview() {
  const d = syncDraftInputs();
  const amount = (d.pay || 0) * (d.hours || 0) * (d.headcount || 0);
  const g = $('fee-gross'); if (g) g.textContent = '¥' + amount;
  const t = $('fee-total'); if (t) t.textContent = '¥' + amount;
  const b = $('fee-bottom'); if (b) b.textContent = '¥' + amount;
  const btn = $('publish-btn');
  if (btn) btn.disabled = (!d.title || !d.slots.length || d.pay < 18);
  const pay = $('pj-pay'); if (pay) pay.classList.toggle('err', d.pay < 18);
}

function confirmApply(jobId, grab) {
  const job = jobById(jobId);
  const stu = studentById(state.studentId);
  const sc = matchScore(stu, job);
  if (!sc.canApply) return toast('⚠️ ' + sc.blockReason);
  state.params.jobId = jobId;
  state.params.grab = grab;
  openSheet(`<h3>${grab ? '确认抢单' : '确认报名'}</h3>
    <div class="desc">${esc(job.title)} · ${esc(merchantById(job.merchantId).name)}</div>
    <div class="card flat">
      <div class="row between"><span class="small muted">时间</span><b>${job.slots.map(slotText).join('、')}</b></div>
      <div class="row between mt10"><span class="small muted">薪酬</span><b class="pay">¥${job.pay}/时 × ${job.hours}h = ¥${job.pay * job.hours}</b></div>
      <div class="row between mt10"><span class="small muted">匹配度</span><b>${Math.round(sc.total)} 分</b></div>
    </div>
    <div class="field"><label>给商家的一句话${grab ? '' : '（提升录用率）'}</label>
      <textarea class="textarea" id="apply-intro" placeholder="例如：做过餐饮服务，周六全天有空，能吃苦">做过传菜和收银，周六全天有空，能吃苦！</textarea></div>
    <div class="notice">${grab ? '抢单成功即视为录用，请务必按时到岗。' : '商家将在 24 小时内处理，未录用也会告知理由。'}开始前 12 小时内取消将扣 5 分信用分。</div>
    <button class="btn primary block mt14" data-act="do-apply">${grab ? '⚡ 确认抢单' : '✅ 确认报名'}</button>`);
}

function doCheckIn(id) {
  const o = orderById(id), j = jobById(o.jobId), m = merchantById(o.merchantId);
  openSheet(`<h3>扫码签到</h3><div class="desc">${esc(m.name)} · ${esc(m.addr)}</div>
    <div class="scanbox">正在识别商家二维码…</div>
    <div class="card flat">
      <div class="row between"><span class="small muted">定位校验</span><b style="color:#07c160">✅ 门店 80m 内</b></div>
      <div class="row between mt10"><span class="small muted">当前时间</span><b>${fmtDT(Date.now())}</b></div>
      <div class="row between mt10"><span class="small muted">岗位时段</span><b>${slotText(o.slot)}</b></div>
    </div>
    <div class="notice green">签到成功后，商家会收到到岗通知，你的行程也会同步给紧急联系人（如已开启）。</div>
    <button class="btn primary block mt14" data-act="do-checkin" data-id="${id}">确认签到</button>`);
}

/* ==========================================================
 * 一键演示
 * ========================================================== */
function runDemoStep(i) {
  const s = DEMO_SCRIPTS[i];
  if (!s) return null;
  state.role = s.role;
  if (s.actor) { if (s.role === 'student') state.studentId = s.actor; else if (s.role === 'merchant') state.merchantId = s.actor; }
  state.view = s.view || TABS[s.role][0].id;
  state.params = Object.assign({}, typeof s.params === 'function' ? s.params() : (s.params || {}));
  let msg = '';
  try { msg = s.run ? s.run() : ''; } catch (e) { msg = '（步骤跳过）'; }
  DB.meta.demoStep = i + 1;
  saveDB();
  render();
  toast(`第 ${i + 1} 步 · ${esc(msg || s.desc.replace(/<[^>]+>/g, ''))}`);
  return msg;
}
function demoNext() {
  let i = DB.meta.demoStep || 0;
  if (i >= DEMO_SCRIPTS.length) { DB.meta.demoStep = 0; resetDB(); i = 0; render(); }
  return runDemoStep(i);
}
let autoTimer = null;
function demoAuto() {
  if (autoTimer) { clearInterval(autoTimer); autoTimer = null; toast('已暂停自动播放'); return; }
  DB.meta.demoStep = 0;
  const stu = studentById('s1');
  stu.wallet.balance = 264;
  DB.orders = DB.orders.filter(o => !(o.studentId === 's1' && o.jobId === 'j1'));
  saveDB();
  runDemoStep(0);
  autoTimer = setInterval(() => {
    const i = DB.meta.demoStep || 0;
    if (i >= DEMO_SCRIPTS.length) { clearInterval(autoTimer); autoTimer = null; toast('🎉 完整闭环演示结束'); return; }
    runDemoStep(i);
  }, 2200);
}

/* ==========================================================
 * 事件绑定 / 初始化
 * ========================================================== */
/* 点击：忽略表单控件本身，交由 input/change 处理，避免重渲染导致失焦 */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
  const act = el.dataset.act;
  if (act === 'noop') return;
  handleAct(act, el);
});

/* 输入：只做局部 DOM 更新，不整页重渲染 */
document.addEventListener('input', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  switch (el.dataset.act) {
    case 'draft-title': case 'draft-desc': case 'draft-bonus':
      syncDraftInputs(); updateFeePreview(); break;
    case 'draft-pay': case 'draft-hours': case 'draft-head':
      syncDraftInputs(); updateFeePreview(); break;
    case 'draft-credit': {
      ensureDraft().credit = +el.value;
      const l = $('credit-label'); if (l) l.textContent = '报名门槛：信用分 ≥ ' + el.value;
      break;
    }
    case 'set-expect': {
      studentById(state.studentId).expectPay = +el.value; saveDB();
      const l = $('expect-label'); if (l) l.textContent = '¥' + el.value + '/时';
      break;
    }
    case 'sub-pay': {
      const sub = state.params.sub || (state.params.sub = { slots: [], cats: [], minPay: 18 });
      sub.minPay = +el.value;
      const l = $('subpay-label'); if (l) l.textContent = '¥' + el.value + '/时';
      break;
    }
    case 'filter-pay': {
      state.filter.minPay = +el.value;
      const l = $('filterpay-label'); if (l) l.textContent = '最低时薪 ¥' + el.value + ' 元';
      break;
    }
  }
});

/* 变更：滑块松手后刷新结果列表 */
document.addEventListener('change', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  if (el.dataset.act === 'filter-pay') { state.filter.minPay = +el.value; render(); }
  if (el.dataset.act === 'draft-mode') { ensureDraft().mode = el.value; }
});

function tickClock() {
  const d = new Date();
  const el = $('clock');
  if (el) el.textContent = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function init() {
  loadDB();
  if (!DB.meta.demoStep) DB.meta.demoStep = 0;
  document.title = '周末单 · 大学生周末兼职撮合平台原型';
  tickClock();
  setInterval(tickClock, 20000);
  render();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
