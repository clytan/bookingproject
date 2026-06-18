param(
  [string]$Html = (Join-Path $PSScriptRoot 'SRS_and_Proposal.html'),
  [string]$Pdf  = (Join-Path $PSScriptRoot 'SRS_and_Proposal.pdf')
)

$ErrorActionPreference = 'Stop'

# Prefer Edge — its headless mode plays nicest with PowerShell automation.
$candidates = @(
  'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
  'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
  'C:\Program Files\Google\Chrome\Application\chrome.exe',
  'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'
)
$browser = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) { throw 'No Edge or Chrome found.' }
if (-not (Test-Path $Html)) { throw "HTML not found: $Html" }

$tmpProfile = Join-Path $env:TEMP ("hpdf-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmpProfile -Force | Out-Null
Remove-Item $Pdf -Force -ErrorAction SilentlyContinue

$args = @(
  '--headless=new',
  '--disable-gpu',
  '--no-pdf-header-footer',
  "--user-data-dir=$tmpProfile",
  '--virtual-time-budget=10000',     # let web fonts + layout settle
  "--print-to-pdf=$Pdf",
  ('file:///' + ($Html -replace '\\','/'))
)

Write-Host "Browser : $browser"
Write-Host "Output  : $Pdf"
$p = Start-Process -FilePath $browser -ArgumentList $args -Wait -PassThru -WindowStyle Hidden
Remove-Item $tmpProfile -Recurse -Force -ErrorAction SilentlyContinue

if (-not (Test-Path $Pdf)) { throw "PDF was not produced (browser exit $($p.ExitCode))." }

$f = Get-Item $Pdf
"OK  $($f.FullName)  ($([math]::Round($f.Length/1KB,1)) KB)"
