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

# 启动前先把当前分支拉到 GitHub 最新：只允许 fast-forward，本地有未提交改动或网络不通时放弃，
# 服务照常用现有代码启动。拉到新提交时清掉 .next 缓存，避免旧编译结果混用。
$ProgressPreference = "SilentlyContinue"
$gitCommand = Get-Command git -ErrorAction SilentlyContinue
if ($gitCommand) {
  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $before = (cmd /c "git -C ""$ProjectRoot"" rev-parse HEAD 2>&1") -join ""
    $branch = (cmd /c "git -C ""$ProjectRoot"" rev-parse --abbrev-ref HEAD 2>&1") -join ""
    if ($LASTEXITCODE -eq 0 -and $branch -and $branch -ne "HEAD") {
      $pullOutput = cmd /c "git -C ""$ProjectRoot"" -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=20 pull --ff-only origin $branch 2>&1"
      Write-StartupLog "git pull $branch (exit $LASTEXITCODE): $(($pullOutput | Select-Object -Last 2) -join ' | ')"
      $after = (cmd /c "git -C ""$ProjectRoot"" rev-parse HEAD 2>&1") -join ""
      if ($LASTEXITCODE -eq 0 -and $after -ne $before) {
        $nextDir = Join-Path $ProjectRoot ".next"
        if (Test-Path -LiteralPath $nextDir) {
          Remove-Item -LiteralPath $nextDir -Recurse -Force -ErrorAction SilentlyContinue
          Write-StartupLog "updated $($before.Substring(0, 7)) -> $($after.Substring(0, 7)); cleared .next"
        }
      }
    } else {
      Write-StartupLog "git pull skipped: not on a branch"
    }
  } catch {
    Write-StartupLog "git pull failed: $($_.Exception.Message)"
  }
  $ErrorActionPreference = $previousPreference
} else {
  Write-StartupLog "git not found; skip pull"
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
