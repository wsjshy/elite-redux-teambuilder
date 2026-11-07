# deploy_er.ps1 — Elite Redux 配招助手一键部署（GitHub Pages）
# 分支约定：master 开发 + gh-pages 部署（AGENTS.md 已登记）
# 用法：& "D:\Git\bin\git.exe" 已就绪；本脚本自动：commit master → push → 建/更 gh-pages（部署三件套）→ 切回 master
# 部署产物（gh-pages 分支根目录）：index.html（根访问入口，与 配招助手_ER.html 同内容）+ data.js（ERDATA，网页同域/CDN 加载源）
#   + README.md + assets\sprites（相对路径同目录硬前提）+ assets\sheets（运行时合图）+ ER-source 参考 JSON（gameData/additional/item_zh_cn 供重跑参考）+ .nojekyll
# 注意：配招工具_data.js 为 v4.11 前的旧名死产物，勿再部署；ER-source 的 nextdex/.git.bak 为可重建克隆，不入 gh-pages。

$ErrorActionPreference = "Stop"
$Git = "D:\Git\bin\git.exe"
$Repo = "D:\game\elite-redux"
$Temp = "C:\temp\er-deploy"
# v4.180 评估修复：v498 懒加载分片是线上现役文件（图鉴/分析/速度线运行时按需加载），
# 原白名单只有 3 项，而下方步骤4 会清空 gh-pages 工作区 → 下次部署会删除这 3 个分片，线上 404。
# 数据源合一（2026-11-07）：data.js（2.4 MB 全量单文件）已归档至 archive/，不再部署。
# 实测 data.js 与三分片 26/27 键完全等价（0 差异），唯一多出的 ERDATA.sprites 是空对象且页面零引用。
$DeployFiles = @("index.html", "README.md", "data_species_v498.js", "data_adv_v498.js", "data_lite_v498.js")
$Version = $args[0]; if (-not $Version) { $Version = "v4.2" }
$Message = $args[1]; if (-not $Message) { $Message = "Deploy: $Version" }

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
    Invoke-Git push github master | Out-Null
    Write-Host "[1/6] master committed & pushed"
} else {
    Write-Host "[1/6] clean, skip commit"
}

# 步骤2：确认部署产物存在（坑1：先复制到临时目录再切分支）
foreach ($f in $DeployFiles) {
    if (-not (Test-Path (Join-Path $Repo $f))) { throw "部署产物缺失: $f" }
}
if (-not (Test-Path (Join-Path $Repo "assets\sheets"))) { throw "部署产物缺失: assets\sheets" }
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
foreach ($f in $DeployFiles) {
    if (-not (Test-Path (Join-Path $Temp $f))) { throw "暂存目录缺产物: $f —— 已中止，未清空 gh-pages" }
}
Write-Host "[2b/6] staged artifacts verified: $($DeployFiles.Count) files"

# 步骤3：切 gh-pages（首次=orphan 创建；坑3：每步检查，失败即停）
$rc = Invoke-Git checkout gh-pages
if ($rc -ne 0) {
    $rc = Invoke-Git checkout --orphan gh-pages
    if ($rc -ne 0) { throw "创建 gh-pages 分支失败" }
    Invoke-Git rm -rf --cached . | Out-Null
}
Write-Host "[3/6] on gh-pages"

# 步骤4：清空旧产物（保留 .git），复制新产物
Get-ChildItem -Path $Repo -Exclude ".git" -Force | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item (Join-Path $Temp "*") (Join-Path $Repo ".") -Recurse -Force
Write-Host "[4/6] old cleared, new copied"

# 步骤5：提交并推送 gh-pages（--force 覆盖历史部署，孤儿分支/更新通用）
Invoke-Git add --all | Out-Null
Invoke-Git commit -m "$Message" | Out-Null
$rc = Invoke-Git push github gh-pages --force
if ($rc -ne 0) {
    # 2026-11-07：原脚本失败后重试 http://127.0.0.1:7890，该代理在本机已不存在，只会让失败变成等待超时。
    throw "gh-pages push failed。先 git config --get http.proxy 查残留死代理，再用 git -c http.proxy= 手动重试"
}
Write-Host "[5/6] gh-pages pushed"

# 步骤6：切回起始分支
Invoke-Git checkout $StartBranch | Out-Null
Remove-Item -Recurse -Force $Temp -ErrorAction SilentlyContinue
Write-Host "[6/6] done, back on master. URL: https://wsjshy.github.io/elite-redux-teambuilder/"
