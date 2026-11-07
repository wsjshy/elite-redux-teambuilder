# deploy_er.ps1 — Elite Redux 配招助手一键部署（GitHub Pages）
# 分支约定：master 开发 + gh-pages 部署（AGENTS.md 已登记）
#
# 用法：
#   .\tools\deploy_er.ps1                 # 默认增量部署：只覆盖同名文件，不删除线上任何内容
#   .\tools\deploy_er.ps1 -DryRun         # 只做暂存与断言，打印将部署的清单，不改分支不推送
#   .\tools\deploy_er.ps1 -Clean          # 显式全量重建：清空 gh-pages 后只保留 23 个部署文件（会删除历史快照）
#   .\tools\deploy_er.ps1 v4.181 "说明"    # 指定版本号与提交信息
#
# 2026-11-07 安全改动（对应用户「清理冗余不要删库」的要求）：
#   原脚本步骤4 无条件清空 gh-pages 工作区 —— 线上 139 个文件中约 117 个历史快照会被一次删除，
#   且 push --force 不可回滚。现改为：默认增量（零删除），全删必须显式 -Clean，
#   并在 -Clean 前强制打印将被删除的文件数。

$ErrorActionPreference = "Stop"
$Git = "D:\Git\bin\git.exe"
$Repo = "D:\game\elite-redux"
$Temp = "C:\temp\er-deploy"

# 参数解析：-Clean / -DryRun 为开关，其余按位置取版本号与提交信息
$CleanMode = $false
$DryRun = $false
$Rest = @()
foreach ($a in $args) {
    if ($a -eq "-Clean") { $CleanMode = $true }
    elseif ($a -eq "-DryRun") { $DryRun = $true }
    else { $Rest += $a }
}
$Version = $Rest[0]; if (-not $Version) { $Version = "v4.181" }
$Message = $Rest[1]; if (-not $Message) { $Message = "Deploy: $Version" }

# v4.180 评估修复：v498 懒加载分片是线上现役文件（图鉴/分析/速度线运行时按需加载），
# 原白名单只有 3 项，而下方步骤4 会清空 gh-pages 工作区 → 下次部署会删除这 3 个分片，线上 404。
# 数据源合一（2026-11-07）：data.js（2.4 MB 全量单文件）已归档至 archive/，不再部署。
# 实测 data.js 与三分片 26/27 键完全等价（0 差异），唯一多出的 ERDATA.sprites 是空对象且页面零引用。
$DeployFiles = @("index.html", "README.md", "data_species_v498.js", "data_adv_v498.js", "data_lite_v498.js")

# 完整部署清单（2026-11-07 新增）：原二次断言只校验 5 项白名单，
# 本地若误删 assets/sheets/s3.webp 或 ER-source 任一 JSON，脚本仍会「部署成功」而线上静默缺失。
# 此处显式列出 23 个文件，缺一即中止。
$ExpectedFiles = @(
    "index.html", "README.md", "data_species_v498.js", "data_adv_v498.js", "data_lite_v498.js",
    "assets/build_sprites.py", "assets/qrcode_v498.js", "assets/showdown_sets_v496.json",
    "assets/sprites_map.csv", "assets/sprites_report.md",
    "assets/sheets/s0.webp", "assets/sheets/s1.webp", "assets/sheets/s2.webp", "assets/sheets/s3.webp",
    "assets/sheets/s4.webp", "assets/sheets/s5.webp", "assets/sheets/s6.webp", "assets/sheets/s7.webp",
    "assets/sheets/sheets_map.js",
    "ER-source/additionalV2.65beta.json", "ER-source/gameDataV2.65beta.json", "ER-source/item_zh_cn.json",
    ".nojekyll"
)

# 坑4（v4.35 实测）：PS 5.1 下 EAP=Stop 会把 git 的正常 stderr 输出当终止错误（如 checkout 的
# "Switched to branch..."），脚本在步骤3 中断。统一经 Invoke-Git 调用：EAP 临时降为 Continue，
# 用 $LASTEXITCODE 判成败；如需静默输出，把命令的 stderr 引到 Out-Null 交给它处理。
function Invoke-Git {
    param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Args2)
    $prevEAP = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & $Git -C $Repo @Args2
    $rc = $LASTEXITCODE
    $ErrorActionPreference = $prevEAP
    return $rc
}

# 步骤0：记录起始分支；只在 master 上自动提交（2026-11-07 修复）
# 原脚本硬编码 checkout master：本轮在 audit-20261107 上作业时若直接运行，
# 会把工作区切回 master（该分支 index.html 仍是 v4.81、落后远端 189 个提交）→ 线上退回 v4.81。
$StartBranch = (& $Git -C $Repo rev-parse --abbrev-ref HEAD).Trim()
Write-Host "[0/6] start branch: $StartBranch"
$dirty = (& $Git -C $Repo status --porcelain) -join "`n"
# 有改动且在 master 上则提交（master 是开发分支，正常流程是提交后部署）
if ($dirty.Trim().Length -gt 0) {
    if ($StartBranch -ne "master") {
        throw "当前分支 $StartBranch 有未提交改动；脚本不在非 master 分支上自动提交，请先手动提交或切回 master"
    }
    Invoke-Git add --all | Out-Null
    Invoke-Git commit -m "$Message" | Out-Null
    $rc = Invoke-Git push github master
    # 2026-11-07：原代码 | Out-Null 吞掉 push 结果。master 若与远端分叉（non-fast-forward），
    # 推送会被拒但脚本继续部署 gh-pages —— 本地与远端永久分叉且无人察觉。此处改为失败即停。
    if ($rc -ne 0) { throw "master push 失败（可能 non-fast-forward）。已中止，未改动 gh-pages" }
    Write-Host "[1/6] master committed & pushed"
} else {
    Write-Host "[1/6] clean, skip commit"
}

# 步骤2：确认部署产物存在（坑1：先复制到临时目录再切分支）
foreach ($f in $DeployFiles) {
    if (-not (Test-Path (Join-Path $Repo $f))) { throw "部署产物缺失: $f" }
}
# assets\sheets 不能只断言目录存在 —— 必须逐张确认 8 张合图与标尺文件
foreach ($f in @("s0.webp", "s1.webp", "s2.webp", "s3.webp", "s4.webp", "s5.webp", "s6.webp", "s7.webp", "sheets_map.js")) {
    if (-not (Test-Path (Join-Path $Repo "assets\sheets\$f"))) { throw "部署产物缺失: assets\sheets\$f" }
}
# assets\sprites（旧精灵图源，gitignored 本地文件，v4.6.2 合图后零引用、gh-pages 不需）不作为部署前置条件；运行时只消费 assets\sheets
Remove-Item -Recurse -Force $Temp -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $Temp -Force | Out-Null
foreach ($f in $DeployFiles) { Copy-Item (Join-Path $Repo $f) (Join-Path $Temp $f) -Force }
Copy-Item (Join-Path $Repo "assets") (Join-Path $Temp "assets") -Recurse -Force
# ER-source：仅部署 3 个参考 JSON（gameData/additional/item_zh_cn），可重建克隆（nextdex/.git.bak）不入库
if (Test-Path (Join-Path $Repo "ER-source")) {
    New-Item -ItemType Directory -Path (Join-Path $Temp "ER-source") -Force | Out-Null
    foreach ($ref in @("gameDataV2.65beta.json", "additionalV2.65beta.json", "item_zh_cn.json")) {
        if (Test-Path (Join-Path $Repo "ER-source\$ref")) { Copy-Item (Join-Path $Repo "ER-source\$ref") (Join-Path $Temp "ER-source\$ref") -Force }
    }
}
# .nojekyll：GitHub Pages 不做 Jekyll 处理
New-Item -ItemType File -Path (Join-Path $Temp ".nojekyll") -Force | Out-Null
Write-Host "[2/6] deploy artifacts staged to $Temp"

# v4.180 评估修复：清空 gh-pages 前先断言暂存目录齐全。步骤4 是破坏性清空，
# 缺任一现役文件都会造成「部署成功但线上 404」，必须在写盘前拦住。
# 2026-11-07：断言范围从 5 项白名单扩到完整 23 项（assets 14 + ER-source 3 + .nojekyll）。
$missing = @()
foreach ($f in $ExpectedFiles) {
    if (-not (Test-Path (Join-Path $Temp $f))) { $missing += $f }
}
if ($missing.Count -gt 0) {
    throw "暂存目录缺 $($missing.Count) 个产物: $($missing -join ', ') —— 已中止，未改动 gh-pages"
}
Write-Host "[2b/6] staged artifacts verified: $($ExpectedFiles.Count) files"

# DryRun：到此为止。打印将覆盖的文件与总量，不切分支、不推送。
if ($DryRun) {
    $total = (Get-ChildItem -Path $Temp -Recurse -File | Measure-Object -Sum Length).Sum
    Write-Host "[DRYRUN] mode=$(if ($CleanMode) { 'CLEAN (会删除 gh-pages 上的历史文件)' } else { 'INCREMENTAL (不删除任何线上文件)' })"
    Write-Host "[DRYRUN] will upload $($ExpectedFiles.Count) files, $([Math]::Round($total / 1MB, 2)) MB"
    foreach ($f in $ExpectedFiles) { Write-Host "  + $f" }
    Write-Host "[DRYRUN] no branch switch, no push. Done."
    Remove-Item -Recurse -Force $Temp -ErrorAction SilentlyContinue
    return
}

# 步骤3：切 gh-pages，但**先对齐远端 tip**
# 2026-11-07 P0（子 agent 审计发现）：本地 gh-pages 可能是很老的旧树（当前 67b0dde：落后远端 118 个提交、
# 树里只有 19 个文件）。若不先对齐就 checkout 到旧树再覆写 23 个文件，新提交的父节点是旧 tip →
# force-push 会把远端 139 个文件的 tip 整个换成约 24 个：**即使默认「增量模式」也会删掉 116 个线上文件**。
# 所以必须先 fetch，再强制把本地分支对齐到 github/gh-pages（本地旧 tip 是它的祖先、ahead=0，无独有提交可丢）。
$rc = Invoke-Git fetch github
if ($rc -ne 0) { throw "fetch github 失败：无法确认远端 gh-pages 现状，已中止（未改动任何东西）" }
$rc = Invoke-Git rev-parse --verify --quiet "github/gh-pages"
if ($rc -eq 0) {
    $rc = Invoke-Git checkout -B gh-pages "github/gh-pages"
    if ($rc -ne 0) { throw "对齐 gh-pages 到 github/gh-pages 失败" }
    Write-Host "[3/6] gh-pages realigned to github/gh-pages (增量底座正确)"
} else {
    $rc = Invoke-Git checkout --orphan gh-pages
    if ($rc -ne 0) { throw "创建 gh-pages 分支失败" }
    Invoke-Git rm -rf --cached . | Out-Null
    Write-Host "[3/6] gh-pages orphan created (远端原本不存在)"
}

# 步骤4：放置新产物
# 2026-11-07 默认行为改为「增量覆盖」：只把 23 个文件覆盖到 gh-pages，线上其余文件（历史快照、
# 旧 data.js）一律保留。这直接消除了「跑一次部署就删掉线上 117 个文件」的风险。
# 需要彻底重建时显式传 -Clean，且会先把将删除的文件数打印出来。
if ($CleanMode) {
    $toDelete = (Get-ChildItem -Path $Repo -Exclude ".git" -Force | Measure-Object).Count
    Write-Host "[4/6] CLEAN mode: 将删除 gh-pages 根目录 $toDelete 个条目（仅保留随后写入的 23 个文件）"
    Write-Host "[4/6] 提示：线上快照备份分支为 ghpages-backup-20261107，可随时 force-push 回滚"
    Get-ChildItem -Path $Repo -Exclude ".git" -Force | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Copy-Item (Join-Path $Temp "*") (Join-Path $Repo ".") -Recurse -Force
    Write-Host "[4/6] clean done"
} else {
    Copy-Item (Join-Path $Temp "*") (Join-Path $Repo ".") -Recurse -Force
    Write-Host "[4/6] incremental done — 未删除线上任何文件"
}

# 步骤5：提交并推送 gh-pages（--force 覆盖历史部署，孤儿分支/更新通用）
Invoke-Git add --all | Out-Null
Invoke-Git commit -m "$Message" | Out-Null
$rc = Invoke-Git push github gh-pages
if ($rc -ne 0) {
    # 2026-11-07：不再 --force。步骤3 已把本地分支对齐到 github/gh-pages，本次提交是它的直接后代，
    # 必然 fast-forward；若此处仍被拒，说明远端刚被并发推送，应当中止而不是覆盖。
    throw "gh-pages push 被拒（可能 non-fast-forward：远端已被并发更新）。未覆盖远端。先 git fetch 再重跑；回滚分支 ghpages-backup-20261107"
}
Write-Host "[5/6] gh-pages pushed"

# 步骤6：切回起始分支
Invoke-Git checkout $StartBranch | Out-Null
Remove-Item -Recurse -Force $Temp -ErrorAction SilentlyContinue
Write-Host "[6/6] done, back on $StartBranch. URL: https://wsjshy.github.io/elite-redux-teambuilder/"
