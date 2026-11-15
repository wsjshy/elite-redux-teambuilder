// v4.387 A：合并分片现状(B) 与 cc 源码映射(C)，分类落 _ev4387_a.json（只读）
const fs=require('fs'),path=require('path');
const dir=__dirname;
const B=JSON.parse(fs.readFileSync(path.join(dir,'_ev4387_b.json'),'utf8'));
const C=JSON.parse(fs.readFileSync(path.join(dir,'_ev4387_a_cc.json'),'utf8'));

// 人工分类（依据 _ev4387_a_cc.json 的 cc 信号逐条核过，见任务台账）
const CLASS={
  '317':'数字错','582':'数字错','200':'只写进攻半套、防守侧漏记','442':'只写进攻半套、防守侧漏记',
  '440':'缺幅度','499':'缺幅度','524':'缺幅度','613':'缺幅度','664':'缺幅度',
  '671':'部分无依据（暴击1/4有依据；最低随机数本块无依据）','678':'数字错','682':'缺幅度',
  '726':'缺幅度','741':'缺幅度','773':'数字错','779':'缺幅度','817':'数字错','829':'缺幅度',
  '881':'缺幅度','900':'缺幅度','925':'缺幅度','932':'缺幅度','936':'缺幅度','948':'缺幅度',
  '954':'缺幅度','962':'缺幅度','968':'无依据、建议保留原文','970':'缺幅度','997':'缺幅度',
  '1004':'数字错','1010':'缺幅度','1032':'缺幅度（兼缺中文名）','1048':'分片漏登记（cc/proto 存在）','1053':'分片漏登记（cc/proto 存在）'
};

const Cby={};Object.values(C).forEach(c=>{if(c&&c.id)Cby[String(c.id)]=c;});
const noNumber=[];
const rows=B.rows.map(r=>{
  const c=Cby[r.id]||{};
  const cc=c.cc||{};
  const own=cc.own||{};
  const hasNum=/[0-9]/.test(r.desc||'');
  if(!hasNum)noNumber.push(r.id);
  const sig={line:own.line,ate:own.ate,def:own.def,off:own.off,deleg:own.deleg,bases:cc.bases};
  return {id:r.id,en:r.en,zh:r.zh,desc:r.desc,extra:r.extra,class:CLASS[r.id]||'待核',sig,proto:c.proto_const,proto_desc:c.proto_desc,noNumber:!hasNum};
});

const byClass={};rows.forEach(r=>byClass[r.class]=(byClass[r.class]||0)+1);
const out={rows,byClass,noNumberIds:noNumber,noNumberCount:noNumber.length};
fs.writeFileSync(path.join(dir,'_ev4387_a.json'),JSON.stringify(out,null,1));
console.log('条数',rows.length);
console.log('分类统计',JSON.stringify(byClass,null,1));
console.log('无数字条数',noNumber.length,noNumber.join(','));
rows.forEach(r=>console.log(`${r.id}\t${r.zh}\t${r.class}\t${r.sig.line||'-'}\t${(r.desc||'').slice(0,40)}`));
