# deploy_er.ps1 — Elite Redux 配招助手一键部署（GitHub Pages）
# 分支约定：master 开发 + gh-pages 部署（AGENTS.md 已登记）
# 用法：& "D:\Git\bin\git.exe" 已就绪；本脚本自动：commit master → push → 建/更 gh-pages（部署三件套）→ 切回 master
# 部署产物（gh-pages 分支根目录）：index.html（根访问入口，与 配招助手_ER.html 同内容）+ data.js（ERDATA，网页同域/CDN 加载源）
#   + assets\sprites（相对路径同目录硬前提）+ ER-source（gameData/additional 供重跑参考）+ .nojekyll
# 注意：配招工具_data.js 为 v4.11 前的旧名死产物，勿再部署。

$ErrorActionPreference = "Stop"
$Git = "D:\Git\bin\git.exe"
$Repo = "D:\game\elite-redux"
$Temp = "C:\temp\er-deploy"
$DeployFiles = @("index.html", "data.js")
$Version = $args[0]; if (-not $Version) { $Version = "v4.2" }
$Message = $args[1]; if (-not $Message) { $Message = "Deploy: $Version" }

# 步骤0：确保在 master 且干净（坑2：master 有未提交改动时切分支会失败）
& $Git -C $Repo checkout master
$dirty = (& $Git -C $Repo status --porcelain) -join "`n"
# 有改动则提交（master 是开发分支，正常流程是提交后部署）
if ($dirty.Trim().Length -gt 0) {
    & $Git -C $Repo add -A
    & $Git -C $Repo commit -m "$Message"
    & $Git -C $Repo push github master
    Write-Host "[1/6] master committed & pushed"
} else {
    Write-Host "[1/6] master clean, skip commit"
    & $Git -C $Repo push github master
}

# 步骤2：确认部署产物存在（坑1：先复制到临时目录再切分支）
foreach ($f in $DeployFiles) {
    if (-not (Test-Path (Join-Path $Repo $f))) { throw "部署产物缺失: $f" }
}
if (-not (Test-Path (Join-Path $Repo "assets\sprites"))) { throw "部署产物缺失: assets\sprites" }
Remove-Item -Recurse -Force $Temp -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $Temp -Force | Out-Null
foreach ($f in $DeployFiles) { Copy-Item (Join-Path $Repo $f) (Join-Path $Temp $f) -Force }
Copy-Item (Join-Path $Repo "assets") (Join-Path $Temp "assets") -Recurse -Force
if (Test-Path (Join-Path $Repo "ER-source")) { Copy-Item (Join-Path $Repo "ER-source") (Join-Path $Temp "ER-source") -Recurse -Force }
# .nojekyll：GitHub Pages 不做 Jekyll 处理
New-Item -ItemType File -Path (Join-Path $Temp ".nojekyll") -Force | Out-Null
Write-Host "[2/6] deploy artifacts staged to $Temp"

# 步骤3：切 gh-pages（首次=orphan 创建；坑3：每步检查，失败即停）
& $Git -C $Repo checkout gh-pages 2>$null
if ($LASTEXITCODE -ne 0) {
    & $Git -C $Repo checkout --orphan gh-pages
    if ($LASTEXITCODE -ne 0) { throw "创建 gh-pages 分支失败" }
    & $Git -C $Repo rm -rf --cached . 2>$null
}
Write-Host "[3/6] on gh-pages"

# 步骤4：清空旧产物（保留 .git），复制新产物
Get-ChildItem -Path $Repo -Exclude ".git" -Force | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item (Join-Path $Temp "*") (Join-Path $Repo ".") -Recurse -Force
Write-Host "[4/6] old cleared, new copied"

# 步骤5：提交并推送 gh-pages（--force 覆盖历史部署，孤儿分支/更新通用）
& $Git -C $Repo add -A
& $Git -C $Repo commit -m "$Message"
& $Git -C $Repo push github gh-pages --force
Write-Host "[5/6] gh-pages pushed"

# 步骤6：切回 master
& $Git -C $Repo checkout master
Remove-Item -Recurse -Force $Temp -ErrorAction SilentlyContinue
Write-Host "[6/6] done, back on master. URL: https://wsjshy.github.io/elite-redux-teambuilder/"
