### F. 自检结果（脚本实跑，非人工判断）

| 检查项 | 期望 | 实测 | 结论 |
|---|---|---|---|
| matchup 行数 | 21 | 21 | ✓ |
| matchup 各行长度 | 均 21 | [21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 19, 20, 21] | ⚠ 末 3 行 19/20/21（见 D.9） |
| matchup 火→地面（防守=地面,攻击=火） | 1 | 1 | ✓ |
| matchup 水→电（防守=电,攻击=水） | 1 | 1 | ✓ |
| matchup 地面→电（防守=电,攻击=地面） | 2 | 2 | ✓ |
| ABI_TAGS（build_tool_data.py）条数 vs ERDATA.abiTags | 相等 | 98 vs 98，内容比对 一致 | ✓ |
| MOVES_NOTES 全部 id 可在 ERDATA.moves 解析 | 0 缺失 | 缺失 [] | ✓ |
| ABI_TAGS 全部 id 可在 ERDATA.abilities 解析中文名 | 0 缺失 | 缺失 [] | ✓ |
| 12 模板 keys 名称在 ERDATA 名称表中命中 | 0 未命中 | 未命中 [] | ✓ |
| 物种 ERDATA 1906 / gameData 1907（差 1 = id -1 占位） | — | 差集 [-1] | ✓ |
| 非最终形态 nonFinal | 640 | 640（gameData 独立复算 640） | ✓ |
| eggMoves / TMHMMoves 全表为空 | 0 / 0 | 0 / 0 | ✓ |
| 引擎评分公式实际实现 | 见 C.4 | 代码含 `nv*40`/`hole*25`，**不含** `novel`/`hitAdj`/`prioAdj`/`pickSet`（AGENTS.md §6 描述的公式在 .py 与 .html 中均不存在） | ⚠ 描述与实现不一致 |
