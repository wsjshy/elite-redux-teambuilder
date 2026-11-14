# 无头门禁与审计（node，不依赖浏览器）

把单文件引擎与三个数据分片在 node 里跑起来，用于离线全库门禁与批量审计。
**仅开发工具，不参与部署**（`tools/deploy_er.ps1` 的 23 项白名单不含本目录）。

## 用法

```powershell
# 1. 由 index.html + 数据分片生成 harness.js（index/分片改动后须重新生成）
python tools/headless/make_harness.py

# 2. 全库门禁（约 16s，浏览器注入约 35s+ 且易 GAC pipe 超时）
node tools/headless/gate.js

# 3. 审计脚本
node tools/headless/audit_name.js       # 名实相符：流派名机制词须有对应主招
node tools/headless/audit_default.js    # 并列机制首推参考（非缺陷判定，需人工复核）
```

## 口径

- `gate.js` 与浏览器注入门禁逐值一致：物种 1906、流派 4369、badMove 1、dup 0、itemsOver 0、defOrb 0、fatal 0、无空流派。
- `harness.js` 用 Proxy 桩替代 window/document/navigator，并中和顶层自动 UI 初始化（`renderSp`/`_initCoreList`/`initRuleBoxes`），函数定义全部保留，`deriveBuilds`/`classifyBuilds` 结果与浏览器一致。
- 数据分片须按 `lite → species → adv` 顺序加载（lite 先定义 ERDATA）。

## 并行/子代理

`harness.js` 导出 `ERDATA/deriveBuilds/classifyBuilds/learnOf/MV/ITM/sideDisp`。
批量审计可按物种区间拆成多个 node 进程（或子代理各跑不相交区间），不占用唯一的浏览器会话。
