# VIET THIEN COFFEE GROUP - Mo link online (Cloudflare Quick Tunnel) de sep xem tu xa
# Chay bang MO_LINK_ONLINE.bat. Link doi dia chi moi moi lan mo lai; may phai bat va khong ngu (sleep).
# Link thuong (gui sep): mo la XEM duoc ngay, khong can mat khau.
# Link chinh sua (<link>/k/<editKey>, khoa trong app\data\access.json): mo 1 lan la thiet bi do co quyen chinh sua 30 ngay.
$ErrorActionPreference = 'Stop'
$root     = Split-Path -Parent $PSScriptRoot
$app      = Join-Path $root 'app'
$tools    = Join-Path $root 'tools'
$cf       = Join-Path $tools 'cloudflared.exe'
$log      = Join-Path $tools 'tunnel.log'
$linkFile = Join-Path $tools 'link_online.txt'
$port     = 3456
$urlRe    = 'https://[a-z0-9-]+\.trycloudflare\.com'

function Say($msg, $color = 'Gray') { Write-Host $msg -ForegroundColor $color }
function PortUp { [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) }
function Quit($msg) { Say $msg 'Red'; Read-Host 'Nhan Enter de dong'; exit 1 }

Say '======================================================='
Say '   VIET THIEN COFFEE GROUP - MO LINK ONLINE CHO SEP' 'Yellow'
Say '======================================================='

# 1. May chu he thong
if (-not (PortUp)) {
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Quit '[LOI] Chua cai Node.js (https://nodejs.org).' }
  Say '[1/3] Dang khoi dong he thong...'
  Start-Process -FilePath 'node' -ArgumentList 'server.js' -WorkingDirectory $app -WindowStyle Minimized
  for ($i = 0; $i -lt 20 -and -not (PortUp); $i++) { Start-Sleep -Milliseconds 500 }
  if (-not (PortUp)) { Quit '[LOI] He thong khong khoi dong duoc. Chay CHAY_HE_THONG.bat de xem loi.' }
} else { Say '[1/3] He thong dang chay.' }

# 2. Cong cu duong ham Cloudflare (tai 1 lan, kiem tra chu ky so cua Cloudflare)
if (-not (Test-Path $cf)) {
  Say '[2/3] Dang tai cong cu duong ham Cloudflare (khoang 55 MB, chi tai 1 lan)...'
  New-Item -ItemType Directory -Force -Path $tools | Out-Null
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  $ProgressPreference = 'SilentlyContinue'
  try { Invoke-WebRequest -UseBasicParsing -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile $cf }
  catch { Quit "[LOI] Khong tai duoc: $($_.Exception.Message)" }
  $sig = Get-AuthenticodeSignature $cf
  if ($sig.Status -ne 'Valid' -or $sig.SignerCertificate.Subject -notmatch 'Cloudflare') { Remove-Item $cf -Force; Quit '[LOI] File tai ve khong co chu ky Cloudflare hop le - da xoa.' }
} else { Say '[2/3] Cong cu duong ham: san sang.' }

# 3. Duong ham: dang chay thi dung lai link cu, chua chay thi mo moi
$running = @(Get-Process cloudflared -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $cf })
$url = $null
if ($running.Count -and (Test-Path $log)) {
  $m = Select-String -Path $log -Pattern $urlRe | Select-Object -Last 1
  if ($m) { $url = $m.Matches[0].Value; Say '[3/3] Link online dang mo san.' }
}
if (-not $url) {
  if ($running.Count) { $running | Stop-Process -Force }
  Say '[3/3] Dang mo duong ham Cloudflare...'
  Start-Process -FilePath $cf -ArgumentList 'tunnel', '--url', "http://127.0.0.1:$port", '--no-autoupdate' -WorkingDirectory $tools -WindowStyle Hidden -RedirectStandardError $log -RedirectStandardOutput (Join-Path $tools 'tunnel.out')
  for ($i = 0; $i -lt 60 -and -not $url; $i++) {
    Start-Sleep -Milliseconds 500
    $m = Select-String -Path $log -Pattern $urlRe -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($m) { $url = $m.Matches[0].Value }
  }
  if (-not $url) { Quit '[LOI] Chua lay duoc link (mang cham hoac bi chan). Thu chay lai sau 1 phut.' }
  Say '      Cho link san sang (khoang 10 giay)...'
  Start-Sleep -Seconds 8
  $ready = $false
  for ($i = 0; $i -lt 10 -and -not $ready; $i++) {
    try { $r = Invoke-WebRequest -UseBasicParsing -Uri "$url/login" -TimeoutSec 8; $ready = $r.StatusCode -eq 200 } catch { Start-Sleep -Seconds 2 }
  }
  if (-not $ready) { Say '      (May nay chua mo thu duoc link - thuong do DNS cham, 1-2 phut sau se vao duoc)' 'Yellow' }
}

$acc = $null
try { $acc = Get-Content (Join-Path $app 'data\access.json') -Raw -Encoding UTF8 | ConvertFrom-Json } catch { }
$editUrl = if ($acc -and $acc.editKey) { "$url/k/$($acc.editKey)" } else { $null }
Set-Content -Path $linkFile -Value (@($url, $editUrl) | Where-Object { $_ }) -Encoding ASCII
try { Set-Clipboard -Value $url } catch { }

Say ''
Say '=======================================================' 'Green'
Say "  LINK GUI SEP (chi xem):  $url" 'Green'
Say '  (da chep vao bo nho tam - dan vao Zalo gui sep)' 'Green'
Say '=======================================================' 'Green'
if ($acc) {
  if ("$($acc.publicView)" -ne 'False') { Say '  Sep mo link la XEM duoc ngay - KHONG can mat khau.' 'Cyan' }
  else { Say "  Mat khau CHI XEM (gui sep): $($acc.viewerPassword)" 'Cyan' }
}
if ($editUrl) {
  Say ''
  Say "  LINK CHINH SUA (cua anh, KHONG gui nguoi ngoai):" 'Yellow'
  Say "  $editUrl" 'Yellow'
  Say '  Mo 1 lan la may/dien thoai do co TOAN QUYEN CHINH SUA 30 ngay, khong can mat khau.' 'Yellow'
}
Say ''
Say '  - May nay phai BAT va KHONG de che do ngu (sleep) thi link moi chay.'
Say '  - Moi lan mo lai duong ham, link DOI dia chi moi -> gui lai link moi.'
Say '  - Moi lan luu, he thong tu giu ban sao trong app\data\backups (sua nham van khoi phuc duoc).'
Say '  - Tat link: TAT_LINK_ONLINE.bat  |  Tat ca he thong: DUNG_HE_THONG.bat'
Say ''
if ($editUrl) {
  $ans = Read-Host 'Go S roi Enter de chep LINK CHINH SUA vao bo nho tam (chi Enter = dong cua so, link VAN chay)'
  if ($ans -match '^[sS]') {
    try { Set-Clipboard -Value $editUrl } catch { }
    Say '  Da chep LINK CHINH SUA - dan vao Zalo "Cloud cua toi" de mo tren dien thoai cua anh.' 'Green'
    Read-Host 'Nhan Enter de dong cua so nay (link VAN tiep tuc chay)'
  }
} else { Read-Host 'Nhan Enter de dong cua so nay (link VAN tiep tuc chay)' }
