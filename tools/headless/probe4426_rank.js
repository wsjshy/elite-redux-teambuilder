const H = require('./harness.js');
const { ERDATA } = H;
const s = ERDATA.species.find(x => String(x.id) === '1507');
// 复刻 _findTeammatesCore 前半拿 fin2 不可行，改用 findTeammates 返回的候选池
// 直接统计：哪些最终形态的 mateRoleOf 含「强化」，并看 findTeammates 实际顺序
const ans = H.findTeammates(s);
console.log('findTeammates 返回类型:', Array.isArray(ans) ? 'array' : typeof ans, 'keys:', Object.keys(ans).slice(0, 12));
