$ErrorActionPreference = 'Stop'

$managerRoot = Split-Path -Parent $PSCommandPath
$managerUrl = 'http://127.0.0.1:5173/'

function Test-ManagerRunning {
  return $null -ne (Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue)
}

try {
  if (-not (Test-ManagerRunning)) {
    $npm = (Get-Command npm.cmd -ErrorAction Stop).Source
    Start-Process -FilePath $npm -ArgumentList @('run', 'dev') -WorkingDirectory $managerRoot -WindowStyle Hidden

    $deadline = (Get-Date).AddSeconds(20)
    while ((Get-Date) -lt $deadline -and -not (Test-ManagerRunning)) {
      Start-Sleep -Milliseconds 250
    }
  }

  if (-not (Test-ManagerRunning)) {
    throw 'Manager 서버가 시작되지 않았어. 처음 실행이라면 manager 폴더에서 npm install을 한 번 실행해줘.'
  }

  Start-Process $managerUrl
} catch {
  Add-Type -AssemblyName PresentationFramework
  [System.Windows.MessageBox]::Show($_.Exception.Message, 'StudioCats Manager', 'OK', 'Error') | Out-Null
  exit 1
}
