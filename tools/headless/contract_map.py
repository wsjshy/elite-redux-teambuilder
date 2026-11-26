# -*- coding: utf-8 -*-
"""生成《引擎后处理链顺序契约》。

用法：cd D:\\game\\elite-redux && python .\\tools\\headless\\contract_map.py
输出：docs/dev/引擎后处理链顺序契约.md（覆盖写）

为什么：index.html 的流派生成是一串顺序 try 块，每块改卡的一个或几个字段。
「谁先谁后」只存在于行号里，没有任何地方写下来 —— 加新块时只能凭感觉挑插入点。
本脚本把 51 个会改卡面的块扫成一张表，按字段整理出**写者链**，并把顺序依赖固化下来。
"""
import io, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
IDX = os.path.join(ROOT, 'index.html')
OUT = os.path.join(ROOT, 'docs', 'dev', '引擎后处理链顺序契约.md')
NL = '\r\n'

FIELDS = ['name', 'roleTag', 'ev', 'nat', 'it', 'abi', 'score', 'core', 'side', 'warn',
          'breakingRoute', '_v392Rename', '_v393RoleAlign', '_v394OldName', '_v395NameKeep', '_v396Keep']
CORE = set(['name', 'it', 'nat', 'ev', 'roleTag', 'abi', 'score'])
FIELD_ZH = {'name': '流派名', 'it': '道具', 'nat': '性格', 'ev': '努力值',
            'roleTag': '队伍角色', 'abi': '特性', 'score': '排序分'}


def scan():
    t = io.open(IDX, 'rb').read().decode('utf-8')
    line_of = lambda pos: t.count('\n', 0, pos) + 1
    catches = [(m.start(), m.group(1)) for m in re.finditer(r'catch\(\s*(e[A-Za-z0-9_]+)\s*\)\s*\{', t)]
    blocks = []
    n_post = 0
    for pos, name in catches:
        start = t.rfind('try{', max(0, pos - 500000), pos)
        if start < 0:
            continue
        i = pos + t[pos:].index('{')
        depth, j = 0, i
        while j < len(t):
            if t[j] == '{':
                depth += 1
            elif t[j] == '}':
                depth -= 1
                if depth == 0:
                    break
            j += 1
        code = t[start + 4:pos]
        if 'out.forEach' in code or re.search(r'\bb\.', code):
            n_post += 1
        writes, reads = set(), set()
        for f in FIELDS:
            if re.search(r'\bb\.' + re.escape(f) + r'\s*=[^=]', code):
                writes.add(f)
            if re.search(r'\bb\.' + re.escape(f) + r'\b', code):
                reads.add(f)
        if not (writes & CORE):
            continue
        pre = t[max(0, start - 900):start]
        ms = list(re.finditer(r'/\*(.*?)\*/', pre, re.S))
        sem = ''
        if ms:
            raw = re.sub(r'\s+', ' ', ms[-1].group(1).strip())
            raw = re.split(r'[—\-\u3001]', raw)[0]
            sem = raw[:56]
        blocks.append({
            'catch': name, 'line': line_of(start), 'len': j + 1 - start,
            'writes': sorted(writes & CORE),
            'reads': sorted((reads - writes) & CORE),
            'sem': sem,
        })
    blocks.sort(key=lambda x: x['line'])
    return blocks, len(catches), n_post


def main():
    bs, total_catch, post_n = scan()
    L = []
    L.append('# 引擎后处理链顺序契约')
    L.append('')
    L.append('**生成方式**：`python tools/headless/contract_map.py`（覆盖写本文件）。行号会随补丁推移，**以表为准、以脚本重跑为准**。')
    L.append('**引擎版本**：v4.397')
    L.append('')
    L.append('## 一、这份契约解决什么')
    L.append('')
    L.append('流派生成末尾是一串**顺序 `try` 块**（`_deriveBuildsCore` 里，`return out` 之前）。每块做一件事：'
             '改名、换道具、重算 EV、对齐角色。问题在于**「谁必须在前、谁必须在后」只写在行号里** —— '
             '没有一处文字说清，加新块时只能凭感觉挑插入点。')
    L.append('')
    L.append('这不是重构问题，是**契约缺失**：单文件结构不动，只需要把已有顺序写成一张可核对的表。')
    L.append('')
    L.append('本次扫描分三档：全文件 **%d 个 `catch(eX)`**（含数据层、渲染层等其他位置的 try），其中落在流派生成后处理链内、且操作卡对象的 **%d 个**，再筛出**真正会改卡面的 %d 个**（下表）。'
             '剩下的后处理块是只读判定（如 `eP` 重复 6 次的「是否输出向」小判定），不改数据，插在哪都不影响结果。' % (total_catch, post_n, len(bs)))
    L.append('')
    L.append('## 二、51 个改卡面的块（按执行顺序）')
    L.append('')
    L.append('| # | 块 | 行号 | 字节 | 写 | 只读 | 语义 |')
    L.append('|---|---|---|---|---|---|')
    for n, b in enumerate(bs, 1):
        L.append('| %d | `%s` | L%d | %d | %s | %s | %s |' % (
            n, b['catch'], b['line'], b['len'],
            '、'.join(b['writes']) or '—', '、'.join(b['reads']) or '—', b['sem'] or '—'))
    L.append('')

    # 写者链
    L.append('## 三、五个字段的写者链（顺序不可乱的原因）')
    L.append('')
    L.append('同一字段被多个块写时，**只有最后一个写者的值会留下**。因此每加一个写者，都要确认它在链上的位置。')
    L.append('')
    for f in ['name', 'it', 'nat', 'ev', 'roleTag', 'abi']:
        w = [b for b in bs if f in b['writes']]
        if not w:
            continue
        L.append('### %s（%s）—— %d 个写者' % (f, FIELD_ZH.get(f, f), len(w)))
        L.append('')
        L.append('```')
        for b in w:
            L.append('  L%-6d %-12s %s' % (b['line'], b['catch'], b['sem'] or ''))
        L.append('```')
        L.append('')

    L.append('## 四、四条硬顺序（写新块前必须核对）')
    L.append('')
    L.append('### 1. 名字必须先生成，EV/角色才能跟着算')
    L.append('')
    L.append('`roleTag` 只有两个写者：`eV4393`(L18343, v4.393) 与 `eV4394`(L18398, v4.394)。两者都做同一件事 —— '
             '**按当前名字重算 roleTag，再用新的 roleTag 重算 EV 与性格**。')
    L.append('')
    L.append('这意味着它们**必须排在所有改名字的块之后**。名字写者链共 13 块，最后一个 `eV4392`(L18284, v4.392) 在它们之前 —— 顺序正好成立。')
    L.append('')
    L.append('**反例（如果顺序反了会怎样）**：先在 L18000 算 roleTag，再在 L18284 把名字从「骚扰消耗」改成「强化清场」—— '
             '则卡面显示「强化清场」而 EV 仍按消耗位配。这正是 v4.392 之前 `#1 妙蛙种子` 的状态：名字与配置两套逻辑。')
    L.append('')
    L.append('### 2. 同名不同块的改名必须首尾相接，不能并行')
    L.append('')
    L.append('`eV4391`(v4.391 主力输出压制降档) → `eV4392`(v4.392 骚扰消耗落词) → `eV4394`(v4.394 强化清场名实) 三块**串联依赖**：'
             '后一块判断的是前一块改完的名字。')
    L.append('')
    L.append('具体例子：`#3 妙蛙花[2]` 原名「强化清场」，v4.394 按「招组里有没有强化招」重算 → 落「主力输出压制」；'
             '而「主力输出压制」又要过 v4.391 的火力门（≥95）。**若两块顺序互换，它就永远过不了门**（先过门时名字还不是那个名字）。')
    L.append('')
    L.append('### 3. 道具链是「逐块覆盖」，最后写者赢')
    L.append('')
    L.append('`it` 有 **%d 个写者**，是全库最长的覆盖链。后来的块可以合法推翻前面：`e7`(v4.38 机制必需件保护) 之后的 '
             '`eIt1`/`eLk`/`eIL` 仍会覆盖，因为它们的判据更具体（特性×道具死联动）。' % len([b for b in bs if 'it' in b['writes']]))
    L.append('')
    L.append('**新增道具块的位置规则**：如果它判的是「更具体的联动」，追加到链尾即可；如果它判的是「通用兜底」，'
             '必须插在 `eNA`(L13461) 附近靠前 —— 否则会盖掉后面所有具体判定。')
    L.append('')
    L.append('### 4. 跨字段块是最大风险点')
    L.append('')
    L.append('有两个块同时写多个字段，改它们等于同时动两条链：')
    L.append('')
    L.append('| 块 | 行号 | 同时写 | 风险 |')
    L.append('|---|---|---|---|')
    L.append('| `eV4384` | L17875 | 道具 + 名字 | 换道具后名字跟着变（「增伤清场无来源归门」），改一侧就名实分离 |')
    L.append('| `eV4389` | L18162 | EV + 名字 + 性格 | 三者一起重算，改任一处会打破另两处的配套 |')
    L.append('')
    L.append('## 五、纪律（写新补丁时照抄）')
    L.append('')
    L.append('1. **只改名字的块 → 追加在 `eV4392`(L18284) 之后、`eV4393`(L18343) 之前**，这样 roleTag/EV 会自动跟上。')
    L.append('2. **只改道具的块 → 按「具体联动追加链尾 / 通用兜底靠前」判断**，判不准就追加链尾（宁可少覆盖，不可误覆盖）。')
    L.append('3. **同时改名字又改配置的块 → 必须放在 `eV4393` 之前**，并自己重算 roleTag（照抄 `eV4393` 的 `_v393clean` 零矛盾校验）。')
    L.append('4. **不要在两个块之间插入只读判定块以外的代码**：判定块（只读不改）插哪都安全，改数据的块必须按上表定位。')
    L.append('5. 新增块一律 `catch(eX){eX.name}`，**不得新增空 catch**（smoke 阈值 390 已顶满）。')
    L.append('')
    L.append('## 六、怎么验证插入没改变行为')
    L.append('')
    L.append('契约本身不产生证据，**零漂移快照才是**：')
    L.append('')
    L.append('1. 改前生成全卡快照（`tools/headless/snap_*.js`，six + empty 共 9850 张）。')
    L.append('2. 插入/移动块后重跑同一脚本，逐卡逐字段比对。')
    L.append('3. **差异必须 0**，否则说明插入点改变了某张卡的结果 —— 那就是顺序契约被破坏了。')
    L.append('')
    L.append('v4.397（id 表收口 31 处）就是用这个方法证明「纯等价替换」的：9850 张卡差异 0、顺序一致。')
    L.append('')
    L.append('## 七、与 verify_invariants.js 的分工')
    L.append('')
    L.append('| 工具 | 管什么 | 什么时候跑 |')
    L.append('|---|---|---|')
    L.append('| `contract_map.py`（本脚本） | 顺序**结构**：谁写什么、谁在谁之后 | 改后处理链、加新块时 |')
    L.append('| `verify_invariants.js` | 结果**正确性**：13 条名实不变量是否仍成立 | 每次发布前 |')
    L.append('| `gate.js` | 数据**规模**：物种数、流派数、坏招数 | 每次改动后 |')
    L.append('')
    L.append('三者互补：契约告诉你「改动会影响哪些块」，不变量告诉你「改完结果还对不对」。')
    L.append('')

    text = NL.join(L)
    io.open(OUT, 'wb').write(text.encode('utf-8'))
    print('blocks', len(bs), '->', OUT, len(text))


if __name__ == '__main__':
    main()
