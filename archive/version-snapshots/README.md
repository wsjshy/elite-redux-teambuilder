# 版本产物快照（v4.166 – v4.179）

来源：`C:\temp\er-gh474` 工作区（该 worktree 长期处于 `locked initializing`，2026-11-07 清理时发现并抢救出这 8 个文件）。

这 8 个文件是 **v4.137–v4.179 无脚本源阶段**的产物实物证据 —— 该阶段直接在 `index.html` 上演进，生成器停在 v4.136。

| 文件 | 大小 (B) |
|---|---|
| index.html.v4166final | 1,534,314 |
| index.html.v4169final | 1,534,486 |
| index.html.v4171final | 1,536,356 |
| index.html.v4173final | 1,538,170 |
| index.html.v4175final | 1,538,625 |
| index.html.v4176final | 1,538,907 |
| index.html.v4177final | 1,538,900 |
| index.html.v4179final | 1,539,237 |

**用途**：若要反向补齐生成器（规划 P0 的方案 B），这些快照是逐版 diff 的基准。
**不入库**：合计 11.7 MB，已写入 `.gitignore`。

**注意**：`index.html.v4179final`（1,539,237 B）与线上部署版（1,539,379 B）**并非逐字节相同**；线上以 gh-pages 与 git `v485` 分支为准。