# VIET THIEN COFFEE GROUP - Mo link online (Cloudflare Quick Tunnel) va BAT BO GIU LINK
# Bo giu link (app\link_keeper.js) chay an: moi phut kiem tra; link hong thi tu mo lai va ghi link moi vao
# tools\link_online.txt + chan trang he thong. Khoi dong lai may chu de cap nhat code KHONG lam doi link.
# Quyen khi mo link: openAccess trong app\data\access.json ("editor" = toan quyen, "viewer" = chi xem, "none" = dang nhap).
$ErrorActionPreference = 'Stop'
$root     = Split-Path -Parent $PSScriptRoot
$app      = Join-Path $root 'app'
$tools    = Join-Path $root 'tools'
$data     = Join-Path $app 'data'
$cf       = Join-Path $tools 'cloudflared.exe'
$linkJson = Join-Path $data 'link.json'
$pidFile  = Join-Path $data 'link_keeper.pid'
$port     = 3456

function Say($msg, $color = 'Gray') { Write-Host $msg -ForegroundColor $color }
function PortUp { [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) }
function Quit($msg) { Say $msg 'Red'; Read-Host 'Nhan Enter de dong'; exit 1 }

Say '======================================================='
Say '   VIET THIEN COFFEE GROUP - MO LINK ONLINE' 'Yellow'
Say '======================================================='
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Quit '[LOI] Chua cai Node.js (https://nodejs.org).' }

# 1. May chu he thong
if (-not (PortUp)) {
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

# 3. Bo giu link: dang chay thi dung lai, chua chay thi bat (an)
$keeper = $null
if (Test-Path $pidFile) { try { $keeper = Get-Process -Id ([int](Get-Content $pidFile -Raw)) -ErrorAction Stop } catch { $keeper = $null } }
if ($keeper) { Say "[3/3] Bo giu link dang chay (PID $($keeper.Id))." }
else {
  Say '[3/3] Dang bat bo giu link (chay an, tu mo lai link khi Cloudflare ngat)...'
  Start-Process -FilePath 'node' -ArgumentList 'link_keeper.js' -WorkingDirectory $app -WindowStyle Hidden
}

# Cho link san sang (toi da ~2 phut)
$url = $null; $status = ''; $perm = $null
for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Seconds 2
  try { $j = Get-Content $linkJson -Raw -Encoding UTF8 | ConvertFrom-Json; $url = $j.url; $status = $j.status; $perm = $j.permanent } catch { }
  if ($url -and $status -eq 'ok' -and $perm) { break }
}
if (-not $url) { Quit '[LOI] Chua lay duoc link (mang cham hoac bi chan). Bo giu link van tiep tuc thu - mo lai cua so nay sau 2 phut.' }
$share = if ($perm) { $perm } else { $url }
try { Set-Clipboard -Value $share } catch { }
$acc = $null
try { $acc = Get-Content (Join-Path $data 'access.json') -Raw -Encoding UTF8 | ConvertFrom-Json } catch { }
$mode = if ($acc -and $acc.openAccess) { "$($acc.openAccess)" } else { 'editor' }

Say ''
Say '=======================================================' 'Green'
if ($perm) {
  Say "  LINK CO DINH (gui sep, khong bao gio doi):" 'Green'
  Say "  $perm" 'Green'
  Say "  Link truc tiep (co the doi):  $url" 'DarkGray'
} else { Say "  LINK ONLINE:  $url" 'Green' }
Say '  (da chep vao bo nho tam - dan vao Zalo de gui)' 'Green'
if ($status -ne 'ok') { Say '  (link vua tao, co the can them 1-2 phut DNS moi vao duoc)' 'Yellow' }
Say '=======================================================' 'Green'
if ($mode -eq 'editor') { Say '  Ai mo link cung CHINH SUA + NHAP LIEU duoc, KHONG can dang nhap -> chi gui nguoi tin cay.' 'Cyan' }
elseif ($mode -eq 'viewer') { Say "  Mo link la XEM duoc ngay. Link chinh sua: $url/k/$($acc.editKey)" 'Cyan' }
elseif ($acc) { Say "  Bat buoc dang nhap. Mat khau CHI XEM: $($acc.viewerPassword)  |  CHINH SUA: $($acc.editorPassword)" 'Cyan' }
Say ''
Say '  - Bo giu link chay an: moi phut kiem tra, link hong thi tu mo lai.'
Say '    Link MOI luon nam o: tools\link_online.txt va chan trang he thong (nut Chep).'
Say '  - Khoi dong lai may chu de cap nhat code KHONG lam doi link.'
Say '  - May nay phai BAT va KHONG de che do ngu (sleep).'
Say '  - Tat link: TAT_LINK_ONLINE.bat  |  Tat ca he thong: DUNG_HE_THONG.bat'
Say ''
Read-Host 'Nhan Enter de dong cua so nay (link VAN tiep tuc chay)'
