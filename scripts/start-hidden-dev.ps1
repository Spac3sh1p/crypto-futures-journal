$ErrorActionPreference = "Stop"

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ServerLogFile = Join-Path $ProjectRoot "persistent-dev.log"
$StartupLogFile = Join-Path $ProjectRoot "persistent-dev-startup.log"
$PidFile = Join-Path $ProjectRoot ".next-dev.pid"
$Port = 3000
$NpmCmd = "C:\Users\admin\.local\node-v24.14.0-win-x64\npm.cmd"

function Write-StartupLog {
  param([string]$Message)

  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Add-Content -Path $StartupLogFile -Value "[$timestamp] $Message"
}

function Test-PortOpen {
  param([int]$TargetPort)

  $client = [System.Net.Sockets.TcpClient]::new()
  try {
    $task = $client.ConnectAsync("127.0.0.1", $TargetPort)
    if (!$task.Wait(1000)) {
      return $false
    }

    return $client.Connected
  } catch {
    return $false
  } finally {
    $client.Dispose()
  }
}

if (!(Test-Path -LiteralPath $NpmCmd)) {
  Write-StartupLog "npm not found at $NpmCmd"
  exit 1
}

if (Test-PortOpen -TargetPort $Port) {
  Write-StartupLog "port $Port is already reachable; skip start"
  exit 0
}

$cmd = "cd /d `"$ProjectRoot`" && `"$NpmCmd`" run dev >> `"$ServerLogFile`" 2>&1"
$process = Start-Process `
  -FilePath $env:ComSpec `
  -ArgumentList "/d", "/s", "/c", $cmd `
  -WorkingDirectory $ProjectRoot `
  -WindowStyle Hidden `
  -PassThru

Set-Content -Path $PidFile -Value $process.Id
Write-StartupLog "started hidden dev server wrapper pid $($process.Id) on port $Port"
