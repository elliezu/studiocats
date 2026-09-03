param(
  [switch]$NoBrowser,
  [switch]$NoDialog
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$managerRoot = Split-Path -Parent $PSCommandPath
$managerUrl = 'http://127.0.0.1:5173/'
$managerApiUrl = 'http://127.0.0.1:5174/api/portfolio'
$stdoutLog = Join-Path $managerRoot '.manager-stdout.log'
$stderrLog = Join-Path $managerRoot '.manager-stderr.log'

function Test-ManagerEndpoint {
  param(
    [string]$Url,
    [string]$ExpectedContentType = ''
  )

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 -DisableKeepAlive
    if ($response.StatusCode -ne 200) { return $false }
    if (-not $ExpectedContentType) { return $true }

    $contentType = [string]$response.Headers['Content-Type']
    return $contentType.StartsWith($ExpectedContentType, [System.StringComparison]::OrdinalIgnoreCase)
  } catch {
    return $false
  }
}

function Test-ManagerReady {
  return (Test-ManagerEndpoint -Url $managerUrl) -and (Test-ManagerEndpoint -Url $managerApiUrl -ExpectedContentType 'application/json')
}

function Get-ManagerListenerProcessIds {
  $ids = @()
  foreach ($line in (& netstat.exe -ano -p tcp 2>$null)) {
    if ($line -match '^\s*TCP\s+\S+:(5173|5174)\s+\S+\s+LISTENING\s+(\d+)\s*$') {
      $ids += [int]$Matches[2]
    }
  }
  return @($ids | Sort-Object -Unique)
}

function Stop-ManagerServers {
  $processIds = @(Get-ManagerListenerProcessIds)
  foreach ($processId in $processIds) {
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
  }

  $deadline = (Get-Date).AddSeconds(5)
  while ((Get-Date) -lt $deadline -and (Get-ManagerListenerProcessIds).Count -gt 0) {
    Start-Sleep -Milliseconds 100
  }
}

function Get-ManagerFailureDetail {
  foreach ($logPath in @($stderrLog, $stdoutLog)) {
    if (Test-Path -LiteralPath $logPath) {
      $lines = @(Get-Content -LiteralPath $logPath -Tail 12 -ErrorAction SilentlyContinue)
      if ($lines.Count -gt 0) {
        return ($lines -join [Environment]::NewLine)
      }
    }
  }
  return ''
}

try {
  if (-not (Test-ManagerReady)) {
    Stop-ManagerServers
    $npm = (Get-Command npm.cmd -ErrorAction Stop).Source
    $serverProcess = Start-Process -FilePath $npm -ArgumentList @('run', 'dev') -WorkingDirectory $managerRoot -WindowStyle Hidden -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog -PassThru

    $deadline = (Get-Date).AddSeconds(30)
    while ((Get-Date) -lt $deadline -and -not (Test-ManagerReady)) {
      Start-Sleep -Milliseconds 250
      if ($serverProcess.HasExited) { break }
    }
  }

  if (-not (Test-ManagerReady)) {
    $detail = Get-ManagerFailureDetail
    $message = "StudioCats Manager did not start. Run npm install once in the manager folder, then try again."
    if ($detail) {
      $message += [Environment]::NewLine + [Environment]::NewLine + $detail
    }
    throw $message
  }

  if (-not $NoBrowser) {
    Start-Process $managerUrl
  }
} catch {
  if ($NoDialog) {
    Write-Error $_.Exception.Message
    exit 1
  }
  Add-Type -AssemblyName PresentationFramework
  [System.Windows.MessageBox]::Show($_.Exception.Message, 'StudioCats Manager', 'OK', 'Error') | Out-Null
  exit 1
}
