/* 临时冒烟测试：验证 data.js 的匹配与撮合闭环逻辑 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const store = {};
global.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; }
};

const code = fs.readFileSync(path.join(__dirname, 'assets', 'data.js'), 'utf8');
vm.runInThisContext(code, { filename: 'data.js' });

let fails = 0;
function ok(cond, label, extra) {
  if (cond) console.log('  PASS  ' + label + (extra ? '  → ' + extra : ''));
  else { fails++; console.log('  FAIL  ' + label + (extra ? '  → ' + extra : '')); }
}

loadDB();
console.log('\n[1] 种子数据');
ok(DB.students.length === 3, '学生 3 人', DB.students.length);
ok(DB.merchants.length === 5, '商家 5 家', DB.merchants.length);
ok(DB.jobs.length === 8, '岗位 8 个', DB.jobs.length);
ok(DB.jobs.filter(j => j.status === 'online').length === 7, '在线岗位 7 个');

console.log('\n[2] 匹配算法（学生 s1 林小雨）');
const stu = studentById('s1');
const list = recommendJobs(stu, { includeBlocked: true });
ok(list.length > 0, '返回推荐结果', list.length + ' 条');
ok(list.every((x, i, a) => i === 0 || a[i - 1].score.total >= x.score.total), '按匹配度降序排列');
list.forEach(x => console.log('        ' + x.score.total.toFixed(1).padStart(5) + '  ' +
  (x.score.blocked ? '[' + x.score.blockReason + ']' : '[可报名]') + '  ' + x.job.title));

const j1 = jobById('j1');
const j5 = jobById('j5');
ok(timeMatch(stu, j1) === 1, 'j1 时间完全匹配（sat-eve 在空闲内）');
ok(matchScore(stu, j1).canApply, 'j1 可报名');
ok(matchScore(studentById('s2'), jobById('j6')).blocked === 'credit', 's2 因信用分不足被拦截', 'j6 要求 700，s2 为 620');
ok(matchScore(studentById('s3'), j1).blocked === 'cert', 's3 未认证被拦截');
ok(slotsTaken(j1) === 0, 'j1 初始无人录用');

console.log('\n[3] 完整撮合闭环：报名→录用→签到→签退→确认→结算→评价');
const before = studentById('s1').wallet.balance;
const o = applyJob('s1', 'j1', '测试报名');
ok(o.status === 'applied', '报名后状态 = applied', o.status);
ok(DB.messages.some(m => m.to === 'm1' && m.type === 'apply'), '商家收到报名通知');
ok(slotsTaken(j1) === 0, '未录用前不占用名额');

hireOrder(o.id);
ok(orderById(o.id).status === 'hired', '录用后状态 = hired');
ok(DB.messages.some(m => m.to === 's1' && m.type === 'hired'), '学生收到录用通知');
ok(slotsTaken(j1) === 1, '录用后占用 1 个名额', slotsTaken(j1) + '/' + j1.headcount);

checkIn(o.id);
ok(orderById(o.id).status === 'checked_in', '签到后状态 = checked_in');
ok(!!orderById(o.id).checkIn.loc, '记录签到定位', orderById(o.id).checkIn.loc);

checkOut(o.id);
ok(orderById(o.id).status === 'checked_out', '签退后状态 = checked_out');

confirmHours(o.id);
ok(orderById(o.id).status === 'confirmed', '确认工时后状态 = confirmed');
ok(orderById(o.id).amount === 110, '金额 = 22×5 = 110', '¥' + orderById(o.id).amount);

const creditBefore = studentById('s1').credit;
settleOrder(o.id);
ok(orderById(o.id).status === 'settled', '结算后状态 = settled');
ok(studentById('s1').wallet.balance === before + 110, '钱包余额 +110', '¥' + studentById('s1').wallet.balance);
ok(studentById('s1').credit === creditBefore + 5, '信用分 +5', studentById('s1').credit);
ok(studentById('s1').completed === 13, '完成单数 +1', studentById('s1').completed);

reviewOrder(o.id, 5, '很好', ['准时']);
ok(orderById(o.id).status === 'done', '评价后状态 = done');
ok(o.review.stars === 5, '评价已写入');
ok(studentById('s1').records[0].title === '周六晚高峰传菜员', '履历已生成', studentById('s1').records[0].merchant);
ok(slotsTaken(j1) === 2 || slotsTaken(j1) === 1, '名额占用统计正常', slotsTaken(j1));

console.log('\n[4] 抢单模式（先到先得，直接录用）');
const g = applyJob('s2', 'j5', '抢单');
ok(g.status === 'hired', 'grab 模式报名即录用', g.status);

console.log('\n[5] 商家发单 → 平台审核 → 上线');
const nj = publishJob('m1', {
  title: '周日备菜帮工', cat: '餐饮帮工', slots: ['sun-am'], pay: 21, hours: 4,
  headcount: 1, mode: 'apply', credit: 600, tags: [], desc: '备菜', bonus: '', urgent: false
});
ok(nj.status === 'pending', '新岗位进入待审核', nj.status);
const audit = DB.audits.filter(a => a.refId === nj.id)[0];
ok(!!audit, '生成审核记录');
ok(recommendJobs(stu, {}).every(x => x.job.id !== nj.id), '未审核岗位不出现在推荐流');
auditPass(audit.id);
ok(jobById(nj.id).status === 'online', '审核通过后上线', jobById(nj.id).status);

console.log('\n[6] 审核商家 + 投诉 + 结算统计');
const mA = DB.audits.filter(a => a.kind === 'merchant' && a.status === 'pending')[0];
if (mA) { auditPass(mA.id); ok(merchantById(mA.refId).verified === true, '商家审核通过后 verified=true'); }
else console.log('  SKIP  无待审商家');

const tk = submitTicket('s2', o.id, '工时争议', '测试投诉', '工时少算');
ok(DB.tickets[0].id === tk.id, '工单已创建');
ok(orderById(o.id).status === 'done', '投诉不覆盖已结算状态', orderById(o.id).status);
ok(orderById(o.id).disputed === true, '订单被标记为争议中');
resolveTicket(tk.id, '支持学生，先行垫付', 'student');
ok(DB.tickets[0].status === 'closed', '工单已结案');
ok(orderById(o.id).status === 'done' && orderById(o.id).disputed === false, '结案后保留结算事实并解除争议标记');

console.log('\n[7] 平台统计');
const ps = platformStats();
ok(ps.orders > 0 && ps.gmv > 0, 'GMV 与订单数可计算', 'GMV ¥' + ps.gmv + ' / ' + ps.orders + ' 单');
ok(ps.vshw > 0, '北极星 VSHW > 0', ps.vshw + ' 人·小时');
console.log('        ' + JSON.stringify({
  matchRate: ps.matchRate + '%', fulfillRate: ps.fulfillRate + '%',
  students: ps.students, merchants: ps.merchants, onlineJobs: ps.onlineJobs
}));

console.log('\n[8] 持久化');
saveDB();
const raw = localStorage.getItem('zhoumodan.prototype.v1');
ok(!!raw && JSON.parse(raw).students.length === 3, 'localStorage 可序列化/反序列化', (raw.length / 1024).toFixed(1) + ' KB');
resetDB();
ok(DB.meta.demoStep === 0 && DB.orders.length === 1, 'resetDB 恢复初始状态');

console.log('\n' + (fails === 0 ? '✅ 全部通过' : '❌ 失败 ' + fails + ' 项'));
process.exit(fails === 0 ? 0 : 1);
