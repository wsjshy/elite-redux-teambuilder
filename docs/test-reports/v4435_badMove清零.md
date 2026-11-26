# v4.435 badMove 门禁清零：#862 毒疗流不再硬灌学不到的剧毒 92

> 日期：2026-11-26　类型：机制推送门控补齐（与其余 4 处同构；零选招 / 零数值 / 零道具漂移）
> 影响范围：全库门禁 badMove 唯一残留 1 张卡（#862 堵拦熊 toxic_heal_item）；常驻 INV18 回归守护
> 引擎：index.html 2,153,236 B / SHA1 `F4D941DE298071213DD0F1B4D13D462B0DBA9DB5` / CRLF 25,115 · bareLF 0

## 1. 起点：全库门禁只剩最后一条 badMove

v4.434 发布闭环后跑 `node tools/headless/gate.js`，基线：

| 指标 | v4.434 基线 | v4.435 改后 |
| --- | --- | --- |
| species | 1906 | 1906 |
| total | 4064 | 4064 |
| badMove | **1** | **0** |
| dup | 0 | 0 |
| empty | [] | [] |
| fatal | [] | [] |
| itemsOver | 0 | 0 |
| defOrb | 0 | 0 |
| offHist | 0:271 / 1:802 / 2:550 / 3:231 / 4:47 / 5:4 / 7:1 | 逐项一致 |

探针 `probe4435_badall.js` 全库枚举，badMove 仅一条：

- **#862 堵拦熊**（Obstagoon，恶/一般，物攻 95），mechRw=`toxic_heal_item`，流派名「毒疗站场流」，roleTag=输出，side=物理，score=99。
- 该卡 main 招组 `[92, 164, 70, 182]`；`learnOf(862)` 共 52 招，**不含 92**（剧毒 Toxic，变化招，FUNC_MV.wear=[73,92]）。164 替身、182 守住、70 怪力均在可学池内。

## 2. 根因：同一机制块 5 处 92 推送，唯独这一处漏门控

`MECH_BUILD.toxic_heal_item`（index.html L14983–14995）在 L14988 无条件执行：

```js
b.mv.main.push({id:92,kind:'tech',tag:'压制',why:['剧毒：中毒消耗对手（毒疗只回复自身，不影响输出）']});
```

同文件其余 4 处 92 push（先手挂状态、消耗、免疫换回合、耐久核配套）原本都已包 `mechHasMv(s,92)` 门控；本条漏门控。`mechHasMv(s,id)`（L14815）= `(learnOf(s)||[]).indexOf(id)>-1`。

排除方向（取证后不动数据层）：

- ER 源码 `eliteredux-source` 无独立 learnset 表，`recommended_sets.h` 无 Obstagoon 记录；#263 蛇纹熊 / #264 直冲熊同族也不含 92。
- 故**不补 learnset**，只在引擎 push 处加门控；不改推荐池、不改 EV / 性格 / 道具。

## 3. 补丁（一处门控，自包作用域口径）

L14988 改为：

```js
if(mechHasMv(s,92))b.mv.main.push({id:92,kind:'tech',tag:'压制',why:['剧毒：中毒消耗对手（毒疗只回复自身，不影响输出）']});
```

版本号三处同步：index.html `ER_ENGINE_VER='v4.435'`、package.json `4.435.0`、AGENTS.md 版本表新行。补丁脚本 `tools/headless/patch_v4435.py`，锚点唯一性断言 + CRLF/bareLF 校验（bareLF 保持 0）。

## 4. 实测：#862 五流派改后招组

| 序 | mechRw | roleTag | 改后 main | bad |
| --- | --- | --- | --- | --- |
| 0 | foul_play_atk | 输出 | 492, 704, 70, 818 | [] |
| 1 | body_press_def | 输出 | 704, 492, 70, 818 | [] |
| 2 | facade_status | 输出 | 263, 70, 164, 818 | [] |
| 3 | toxic_heal_item | 输出 | **164, 70, 704, 818** | [] |
| 4 | — | 强化 | 818, 70, 339, 164 | [] |

第 3 张卡的 92 被门控移除后，替身 164、怪力 70 与补盲攻击招 704 / 818 自然补满四槽：无空槽、无重复、无第二张 badMove。

## 5. 关键工程结论：harness 是离线副本，必须重建

本轮踩坑：改完 index.html 直接跑 `gate.js`，badMove 仍 = 1。原因是 `tools/headless/harness.js` **不是运行时读 index.html**，而是 `tools/headless/make_harness.py` 从 index.html 第 4 段内联脚本 + 三个数据分片离线拼装的引擎副本（STUB 桩 + 数据 + 块 4 + module.exports）。

正确顺序：

1. 改 index.html（及 package.json）；
2. `python tools/headless/make_harness.py` 重建 harness.js；
3. 再跑 smoke / gate / verify_invariants。

不重建 harness，headless 门禁永远跑旧副本，数字不会归零。

## 6. 常驻回归守护：INV18

`verify_invariants.js` 新增 INV18：「最终招式必须在物种可学池内（learnOf 不含的招不得入槽）」，只认最终 `b.mv.main` 四槽，与 gate.js L13/L18 的 badMove 判据同源。改后适用 9599 卡、0 FAIL。

## 7. 门禁与回归

- 6 段 `node --check` / `new Function`：block 0–5 全部 OK。
- smoke：**34/34**（版本三处同步 v4.435）。
- verify_invariants：违规合计 **7**，全为 INV06 既有（#5/#275/#615/#986/#1814/#1817/#2225，empty，日光束/日光刃无晴源，定性自 v4.431 起不变）；INV17 0 FAIL；LEGACY 71。
- gate：badMove 0，其余指标与基线逐项一致；招式 id 序列、道具、其余 build 字段零漂移。

## 8. 边界与未决

- INV06 七红维持既有定性，本版不扩题；costOf 的 wxConditionMet / 全特性池仍是 s 级潜力口径（s 级拿不到 b/team，勿强行合并）。
- 本版未做浏览器截图（纯引擎门控、卡面文案与字段无展示层改动）；如后续需要，#862「毒疗站场流」答案卡可作为 v4.435 抽样。
