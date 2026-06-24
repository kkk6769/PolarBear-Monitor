# ============================================================
# PolarBear Agent — Windows 一键安装
# 用法: irm https://home.polarbear.wtf/files/install-agent.ps1 | iex
#       Install-Agent -Server 192.168.1.5:8090
# ============================================================

function Install-Agent {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Server
    )

    $InstallDir = "C:\PolarBear Monitor"
    $DownloadUrl = "https://home.polarbear.wtf/files/polarbear-agent.exe"
    $AgentExe = "$InstallDir\polarbear-agent.exe"
    $AgentYaml = "$InstallDir\agent.yaml"
    $VbsFile = "$InstallDir\polarbear-agent.vbs"

    Write-Host "创建安装目录: $InstallDir" -ForegroundColor Cyan
    New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

    if (Test-Path ".\polarbear-agent.exe") {
        Write-Host "使用本地二进制..." -ForegroundColor Yellow
        Copy-Item ".\polarbear-agent.exe" $AgentExe -Force
    } else {
        Write-Host "下载文件中..." -ForegroundColor Cyan
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $DownloadUrl -OutFile $AgentExe -UseBasicParsing
    }

    Write-Host "生成配置..." -ForegroundColor Cyan
    @"
server: $Server
uuid: agent-$(Get-Date -Format 'yyyyMMddHHmmss')$((Get-Random -Minimum 100 -Maximum 999))
report_delay: 1
debug: false
"@ | Out-File -FilePath $AgentYaml -Encoding UTF8

    Write-Host "创建后台 VBS 启动器..." -ForegroundColor Cyan
    @"
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run """$AgentExe"" -c ""$AgentYaml""", 0, False
"@ | Out-File -FilePath $VbsFile -Encoding ASCII

    Write-Host "注册开机自启..." -ForegroundColor Cyan
    Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "PolarBearAgent" -Value "wscript.exe `"$VbsFile`"" -Force

    Write-Host "启动 Agent..." -ForegroundColor Cyan
    Start-Process wscript.exe -ArgumentList """$VbsFile""" -WindowStyle Hidden
    Start-Sleep -Seconds 2

    Write-Host ""
    Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║     ✅ PolarBear Agent 安装完成！         ║" -ForegroundColor Green
    Write-Host "╠══════════════════════════════════════════╣" -ForegroundColor Green
    Write-Host "║  目录: $InstallDir" -ForegroundColor Green
    Write-Host "║  上报: $Server" -ForegroundColor Green
    Write-Host "║  自启: 已启用" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "任务管理器可看到 polarbear-agent.exe 后台运行" -ForegroundColor Yellow
}
