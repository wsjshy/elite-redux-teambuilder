# v4.388 收口版全量 verify 留档：按序跑九项 verify + gate + smoke + 语法，实际输出落 out_v4388_verify.txt
$ErrorActionPreference = 'Continue'
$root = 'D:\game\elite-redux'
Set-Location $root
$out = Join-Path $root 'tools\headless\out_v4388_verify.txt'
$sw = New-Object System.IO.StreamWriter($out, $false, [Text.Encoding]::UTF8)

function W($line) { $sw.WriteLine($line) }
function Hdr($title) {
  W ''
  W ('=' * 78)
  W ("### " + $title)
  W ('=' * 78)
}

# ---- 头部指纹 ----
W ("v4.388 收口版 全量 verify 留档  生成时间 " + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))
W ('边界：未改任何判定逻辑、未改三个数据分片、未开 nat 口子；仅版本号字符串抬高。')
foreach ($f in @('index.html','data_lite_v498.js','data_adv_v498.js','data_species_v498.js','package.json')) {
  $p = Join-Path $root $f
  $len = (Get-Item $p).Length
  $sha = (Get-FileHash $p -Algorithm SHA1).Hash
  $b = [IO.File]::ReadAllBytes($p); $crlf = 0; $lf = 0
  for ($i = 0; $i -lt $b.Length; $i++) { if ($b[$i] -eq 10) { if ($i -gt 0 -and $b[$i-1] -eq 13) { $crlf++ } else { $lf++ } } }
  W ("指纹 $f | Length=$len | SHA1=$sha | CRLF=$crlf | bareLF=$lf")
}

# ---- 条目数探针 ----
Hdr '条目数探针（abilities / items / moves / species）'
$probe = @'
const H=require("./tools/headless/harness.js");
const d=H.ERDATA||{};
console.log("species",(d.species||[]).length,"abilities",(d.abilities||[]).length,"items",(d.items||[]).length,"moves",(d.moves||[]).length);
'@
$probe | Out-File -FilePath (Join-Path $root '_ev4388_cnt.js') -Encoding utf8
$nodeProbe = node (Join-Path $root '_ev4388_cnt.js') 2>&1
W ($nodeProbe -join "`n")
W ("exit=" + $LASTEXITCODE)
Remove-Item (Join-Path $root '_ev4388_cnt.js') -Force

$verify = @(
  'verify_default.js',
  'verify_ev.js',
  'verify_boost.js',
  'verify_reduce.js',
  'verify_speedaxis.js',
  'verify_sash.js',
  'verify_v4381.js',
  'verify_desc.js',
  'verify_sleep.js'
)
foreach ($v in $verify) {
  Hdr ("verify: tools/headless/" + $v)
  $r = node (Join-Path $root ('tools/headless/' + $v)) 2>&1
  W ($r -join "`n")
  W ("exit=" + $LASTEXITCODE)
}

Hdr 'gate: tools/headless/gate.js（空队全库门禁）'
$g = node (Join-Path $root 'tools/headless/gate.js') 2>&1
W ($g -join "`n")
W ("exit=" + $LASTEXITCODE)

Hdr 'smoke: tools/smoke.js'
$s = node (Join-Path $root 'tools/smoke.js') 2>&1
W ($s -join "`n")
W ("exit=" + $LASTEXITCODE)

Hdr '内联语法：python tools/headless/check_inline_syntax.py（6 段 node --check）'
$sy = python (Join-Path $root 'tools/headless/check_inline_syntax.py') 2>&1
W ($sy -join "`n")
W ("exit=" + $LASTEXITCODE)

Hdr '分片语法：node --check 三个数据分片'
foreach ($f in @('data_lite_v498.js','data_adv_v498.js','data_species_v498.js')) {
  node --check (Join-Path $root $f) 2>&1 | ForEach-Object { W $_ }
  W ("$f exit=" + $LASTEXITCODE)
}

$sw.Close()
Write-Output ('written ' + $out)
