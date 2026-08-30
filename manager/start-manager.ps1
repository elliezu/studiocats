$ErrorActionPreference = 'Stop'

$managerRoot = Split-Path -Parent $PSCommandPath
$managerUrl = 'http://127.0.0.1:5173/'

function Test-ManagerRunning {
  return $null -ne (Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue)
}

function Test-ManagerReady {
  if (-not (Test-ManagerRunning)) { return $false }
  try {
    $response = Invoke-WebRequest -Uri "$managerUrl/api/portfolio" -UseBasicParsing -TimeoutSec 2
    return $response.Headers['Content-Type'] -like 'application/json*'
  } catch {
    return $false
  }
}

function Stop-ManagerServers {
  $processIds = @(Get-NetTCPConnection -LocalPort 5173, 5174 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique)
  foreach ($processId in $processIds) {
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
  }
}

try {
  if (-not (Test-ManagerReady)) {
    Stop-ManagerServers
    $npm = (Get-Command npm.cmd -ErrorAction Stop).Source
    Start-Process -FilePath $npm -ArgumentList @('run', 'dev') -WorkingDirectory $managerRoot -WindowStyle Hidden

    $deadline = (Get-Date).AddSeconds(20)
    while ((Get-Date) -lt $deadline -and -not (Test-ManagerReady)) {
      Start-Sleep -Milliseconds 250
    }
  }

  if (-not (Test-ManagerReady)) {
    throw 'Manager API 연결까지 완료하지 못했어. 처음 실행이라면 manager 폴더에서 npm install을 한 번 실행해줘.'
  }

  Start-Process $managerUrl
} catch {
  Add-Type -AssemblyName PresentationFramework
  [System.Windows.MessageBox]::Show($_.Exception.Message, 'StudioCats Manager', 'OK', 'Error') | Out-Null
  exit 1
}
