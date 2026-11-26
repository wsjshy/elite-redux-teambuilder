# -*- coding: utf-8 -*-
"""解析 abilities.cc + AbilityEnum.proto + AbilityList.textproto：
输出 _src_reduce.json {id:{enum,en,zh,defMul,teAfter}}，供 v4.383 探针按 id 权威判定减伤。只读。"""
import re, io, os, json, subprocess

ROOT = r'D:\game\elite-redux'
SRC = r'D:\game\scratch\eliteredux-source\src\abilities.cc'
PROTO = r'D:\game\scratch\eliteredux-source\proto\AbilityEnum.proto'
LIST = r'D:\game\scratch\eliteredux-source\proto\AbilityList.textproto'

proto = io.open(PROTO, encoding='utf-8').read()
enum2id = dict(re.findall(r'ABILITY_(\w+)\s*=\s*(\d+)', proto))

# textproto: id: ABILITY_X / name: "En"
enum2en = {}
for m in re.finditer(r'id:\s*ABILITY_(\w+)\s*\n\s*name:\s*"([^"]*)"', io.open(LIST, encoding='utf-8').read()):
    enum2en[m.group(1)] = m.group(2)

cc = io.open(SRC, encoding='utf-8').read()
blocks = {}
for m in re.finditer(r'Impl<ABILITY_(\w+)>\s*=\s*\{(.*?)\n\};', cc, re.S):
    blocks[m.group(1)] = m.group(2)

def resolve(enum, seen=None):
    if seen is None: seen = set()
    if enum in seen or enum not in blocks: return {'defMul': [], 'teAfter': [], 'aliasDefMul': None, 'aliasTeAfter': None}
    seen.add(enum)
    body = blocks[enum]
    h = {'defMul': [], 'teAfter': [], 'aliasDefMul': None, 'aliasTeAfter': None}
    am = re.search(r'onDefensiveMultiplier\s*=\s*Impl<ABILITY_(\w+)>\.onDefensiveMultiplier', body)
    if am: h['aliasDefMul'] = am.group(1)
    at = re.search(r'onAfterTypeEffectiveness\s*=\s*Impl<ABILITY_(\w+)>\.onAfterTypeEffectiveness', body)
    if at: h['aliasTeAfter'] = at.group(1)
    if '.onDefensiveMultiplier' in body and not am:
        seg = body.split('.onDefensiveMultiplier', 1)[1].split('.onOffensive', 1)[0]
        h['defMul'].append(re.sub(r'\s+', ' ', seg.strip())[:300])
    if '.onAfterTypeEffectiveness' in body and not at:
        seg = body.split('.onAfterTypeEffectiveness', 1)[1]
        h['teAfter'].append(re.sub(r'\s+', ' ', seg.strip())[:300])
    return h

out = {}
for enum in blocks:
    h = resolve(enum); chain = [enum]
    while h['aliasDefMul'] or h['aliasTeAfter']:
        nxt = h['aliasDefMul'] or h['aliasTeAfter']
        if nxt in chain: break
        chain.append(nxt); sub = resolve(nxt)
        h['defMul'] += sub['defMul']; h['teAfter'] += sub['teAfter']
        h['aliasDefMul'] = sub['aliasDefMul']; h['aliasTeAfter'] = sub['aliasTeAfter']
    if h['defMul'] or h['teAfter']:
        aid = enum2id.get(enum)
        if aid: out[aid] = {'enum': enum, 'en': enum2en.get(enum, ''), 'defMul': h['defMul'], 'teAfter': h['teAfter']}

# 挂 zh（harness ERDATA）
h = json.loads(subprocess.check_output(['node', '-e',
    "const H=require('./tools/headless/harness.js');const m={};H.ERDATA.abilities.forEach(a=>m[a[0]]=a[2]);console.log(JSON.stringify(m))"],
    cwd=ROOT, text=True))
for aid, v in out.items(): v['zh'] = h.get(aid, '')

io.open(os.path.join(ROOT, 'tools', 'headless', '_src_reduce.json'), 'w', encoding='utf-8', newline='').write(json.dumps(out, ensure_ascii=False, indent=1))
print('source reduce abilities:', len(out))
for aid, v in sorted(out.items(), key=lambda kv: int(kv[0])):
    print(aid, v['en'], '/', v['zh'])
