# PowerShell: 安装 Flutter 并初始化本项目平台目录
# 用法: powershell -ExecutionPolicy Bypass -File scripts\setup.ps1

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

function Find-Flutter {
  $candidates = @(
    "$env:LOCALAPPDATA\Pub\Cache\bin\flutter.bat",
    "$env:USERPROFILE\.puro\envs\stable\flutter\bin\flutter.bat",
    "C:\tools\flutter\bin\flutter.bat",
    "C:\src\flutter\bin\flutter.bat"
  )
  foreach ($c in $candidates) {
    if (Test-Path $c) { return $c }
  }
  $cmd = Get-Command flutter -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  return $null
}

$flutter = Find-Flutter
if (-not $flutter) {
  Write-Host "未找到 Flutter SDK。请先安装: https://docs.flutter.dev/get-started/install/windows"
  Write-Host "或使用 Puro: winget install pingbird.Puro && puro create stable && puro use -g stable"
  exit 1
}

Write-Host "Using Flutter: $flutter"
& $flutter --version
& $flutter create . --project-name frontend_mobile_flutter --org com.jianflow --platforms=android,ios,web,windows
& $flutter pub get
Write-Host "Running tests..."
& $flutter test
Write-Host "Done. Run: flutter run --dart-define=API_BASE_URL=http://127.0.0.1:3001/api"
