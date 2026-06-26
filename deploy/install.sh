#!/bin/bash
# ============================================================
# PolarBear Monitor — 一键安装脚本
# 用法: chmod +x install.sh && sudo ./install.sh
# ============================================================

DASHBOARD_PORT=8000
GRPC_PORT=8090
INSTALL_DIR="/opt/polarbear"
AGENT_DIR="/opt/polarbear-agent"
DOWNLOAD_DASHBOARD="https://raw.githubusercontent.com/kkk6769/PolarBear-Monitor/main/Run%20Folder%20(Build%20in%20there)/Linux%20Part/dashboard/polarbear-dashboard"
DOWNLOAD_DASHBOARD_ARM="https://raw.githubusercontent.com/kkk6769/PolarBear-Monitor/main/Run%20Folder%20(Build%20in%20there)/Linux%20Part/dashboard/polarbear-dashboard-arm64"
DOWNLOAD_AGENT="https://raw.githubusercontent.com/kkk6769/PolarBear-Monitor/main/Run%20Folder%20(Build%20in%20there)/Linux%20Part/agent/polarbear-agent"
DOWNLOAD_AGENT_ARM="https://raw.githubusercontent.com/kkk6769/PolarBear-Monitor/main/Run%20Folder%20(Build%20in%20there)/Linux%20Part/agent/polarbear-agent-arm64"
GREEN='\033[32m'; YELLOW='\033[33m'; RED='\033[31m'; BOLD='\033[1m'; NC='\033[0m'

download() {
    local url=$1 out=$2
    # auto-install curl or wget if missing
    if ! command -v curl &>/dev/null && ! command -v wget &>/dev/null; then
        echo "正在安装下载工具..."
        if command -v apt-get &>/dev/null; then
            apt-get update -qq && apt-get install -y -qq curl 2>/dev/null
        elif command -v yum &>/dev/null; then
            yum install -y -q curl 2>/dev/null
        elif command -v dnf &>/dev/null; then
            dnf install -y -q curl 2>/dev/null
        elif command -v apk &>/dev/null; then
            apk add --no-cache curl 2>/dev/null
        elif command -v pacman &>/dev/null; then
            pacman -S --noconfirm curl 2>/dev/null
        fi
    fi
    if command -v curl &>/dev/null; then
        curl -fsSL --connect-timeout 10 --max-time 60 -o "$out" "$url"
    elif command -v wget &>/dev/null; then
        wget -q --timeout=10 -O "$out" "$url"
    else
        return 1
    fi
}

pause() {
    read -p "按 Enter 继续..."
}

require_root() {
    if [ "$(id -u)" -ne 0 ]; then
        echo -e "${RED}请使用 sudo 或以 root 身份运行${NC}"
        exit 1
    fi
}

# ==================== MAIN MENU ====================
main_menu() {
    clear
    echo -e "${BOLD}  🐻‍❄️ PolarBear Monitor 安装脚本${NC}"
    echo "  ─────────────────────────────"
    echo "  1. 安装 Dashboard (面板)"
    echo "  2. 安装 Agent (探针)"
    echo "  3. 更改 Dashboard HTTP 端口"
    echo "  4. 切换 Dashboard 开机自启"
    echo "  5. 切换 Agent 开机自启"
    echo "  6. 卸载 Dashboard (含全部数据)"
    echo "  7. 卸载 Agent"
    echo "  8. 更新 Dashboard (保留数据)"
    echo "  9. 更新 Agent (保留配置)"
    echo "  0. 退出"
    echo
    read -p "  请选择 [0-9]: " choice
    case $choice in
        1) install_dashboard ;;
        2) install_agent ;;
        3) change_port ;;
        4) toggle_service polarbear-dashboard "Dashboard" ;;
        5) toggle_service polarbear-agent "Agent" ;;
        6) uninstall_dashboard ;;
        7) uninstall_agent ;;
        8) update_dashboard ;;
        9) update_agent ;;
        0) echo "退出"; exit 0 ;;
        *) main_menu ;;
    esac
}

# ==================== DASHBOARD ====================
install_dashboard() {
    require_root
    echo -e "\n${BOLD}── 安装 Dashboard${NC}"

    # port input
    read -p "HTTP 端口 (默认 8000): " input_port
    [ -n "$input_port" ] && DASHBOARD_PORT=$input_port
    # gRPC port = HTTP port + 90
    GRPC_PORT=$((DASHBOARD_PORT + 90))

    # binary
    mkdir -p "$INSTALL_DIR/data"
    BIN="$INSTALL_DIR/polarbear-dashboard"
    if [ -f "./polarbear-dashboard" ]; then
        cp ./polarbear-dashboard "$BIN"
    elif [ -f "./dashboard/polarbear-dashboard" ]; then
        cp ./dashboard/polarbear-dashboard "$BIN"
    elif [ -x "$BIN" ]; then
        echo "使用已有二进制: $BIN"
    else
        ARCH=$(uname -m)
        case "$ARCH" in
            aarch64|arm64) DASHBOARD_URL="$DOWNLOAD_DASHBOARD_ARM" ;;
            *)             DASHBOARD_URL="$DOWNLOAD_DASHBOARD" ;;
        esac
        echo "架构: $ARCH, 从 $DASHBOARD_URL 下载中..."
        if ! download "$DASHBOARD_URL" "$BIN"; then
            echo -e "${RED}下载失败 (curl/wget 均不可用或下载地址无效)${NC}"
            pause; return
        fi
    fi
    chmod +x "$BIN"

    # systemd
    cat > /etc/systemd/system/polarbear-dashboard.service << EOF
[Unit]
Description=PolarBear Dashboard
After=network.target
[Service]
Type=simple
ExecStart=$BIN
WorkingDirectory=$INSTALL_DIR
Environment="POLARBEAR_HTTP_PORT=$DASHBOARD_PORT"
Environment="POLARBEAR_GRPC_PORT=$GRPC_PORT"
Restart=always
RestartSec=5
[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable polarbear-dashboard 2>/dev/null || true
    systemctl start polarbear-dashboard 2>/dev/null || true
    sleep 2

    if ! systemctl is-active --quiet polarbear-dashboard; then
        echo -e "${RED}Dashboard 启动失败，查看日志: journalctl -u polarbear-dashboard -n 20${NC}"
        pause; return
    fi

    # show password
    local pw
    pw=$(journalctl -u polarbear-dashboard --no-pager -n 50 2>/dev/null | grep -oP '🔐.*?\K[a-zA-Z0-9]{15}' | tail -1)
    local ip
    ip=$(hostname -I 2>/dev/null | awk '{print $1}')
    [ -z "$ip" ] && ip="YOUR_SERVER_IP"

    echo
    echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}${BOLD}║     ✅ Dashboard 安装完成！               ║${NC}"
    echo -e "${GREEN}${BOLD}╠══════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║  仪表盘: http://$ip:$DASHBOARD_PORT${NC}"
    echo -e "${GREEN}║  管理后台: http://$ip:$DASHBOARD_PORT/admin${NC}"
    echo -e "${GREEN}║  Agent 上报地址: $ip:$GRPC_PORT${NC}"
    if [ -n "$pw" ]; then
        echo -e "${YELLOW}${BOLD}║  🔐 管理密码: $pw    (仅此一次！请立即记录)${NC}"
    else
        echo -e "${YELLOW}║  🔐 管理密码: 查看日志 journalctl -u polarbear-dashboard${NC}"
    fi
    echo -e "${GREEN}╠══════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║  Agent 一键安装:${NC}"
    echo -e "${GREEN}║  Linux: curl -fsSL https://raw.githubusercontent.com/kkk6769/PolarBear-Monitor/main/Run%20Folder%20(Build%20in%20there)/Linux%20Part/install-agent.sh | bash -s -- $ip:$GRPC_PORT${NC}"
    echo -e "${GREEN}║  Win PS: irm https://raw.githubusercontent.com/kkk6769/PolarBear-Monitor/main/Run%20Folder%20(Build%20in%20there)/Windows%20Part/install-agent.ps1 | iex${NC}"
    echo -e "${GREEN}║           Install-Agent -Server $ip:$GRPC_PORT${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
    pause
}

# ==================== AGENT ====================
install_agent() {
    require_root
    echo -e "\n${BOLD}── 安装 Agent${NC}"

    read -p "Dashboard 的 gRPC 地址 (例如 192.168.1.5:8090): " server_addr
    [ -z "$server_addr" ] && echo -e "${RED}地址不能为空${NC}" && pause && return
    read -p "上报间隔/秒 (默认 1): " delay
    [ -z "$delay" ] && delay=1

    mkdir -p "$AGENT_DIR"
    BIN="$AGENT_DIR/polarbear-agent"
    if [ -f "./polarbear-agent" ]; then
        cp ./polarbear-agent "$BIN"
    elif [ -x "$BIN" ]; then
        echo "使用已有二进制"
    else
        ARCH=$(uname -m)
        case "$ARCH" in
            aarch64|arm64) AGENT_URL="$DOWNLOAD_AGENT_ARM" ;;
            *)             AGENT_URL="$DOWNLOAD_AGENT" ;;
        esac
        echo "架构: $ARCH, 从服务器下载中..."
        if ! download "$AGENT_URL" "$BIN"; then
            echo -e "${RED}下载失败 (curl/wget 均不可用或下载地址无效)${NC}"
            pause; return
        fi
    fi
    chmod +x "$BIN"

    # config
    cat > "$AGENT_DIR/agent.yaml" << EOF
server: $server_addr
uuid: agent-$(date +%s)$((RANDOM%1000))
report_delay: $delay
debug: false
EOF

    # systemd
    cat > /etc/systemd/system/polarbear-agent.service << EOF
[Unit]
Description=PolarBear Agent
After=network.target
[Service]
Type=simple
ExecStart=$BIN -c $AGENT_DIR/agent.yaml
WorkingDirectory=$AGENT_DIR
Restart=always
RestartSec=10
[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable polarbear-agent 2>/dev/null || true
    systemctl start polarbear-agent 2>/dev/null || true
    sleep 1

    if ! systemctl is-active --quiet polarbear-agent; then
        echo -e "${RED}Agent 启动失败，查看日志: journalctl -u polarbear-agent -n 20${NC}"
        pause; return
    fi
    echo -e "${GREEN}✅ Agent 已安装并启动 (上报至 $server_addr)${NC}"
    pause
}

# ==================== UPDATE DASHBOARD ====================
update_dashboard() {
    require_root
    echo -e "\n${BOLD}── 更新 Dashboard${NC}"

    BIN="$INSTALL_DIR/polarbear-dashboard"
    if [ ! -f "$BIN" ]; then
        echo -e "${RED}Dashboard 未安装，请先执行安装${NC}"
        pause; return
    fi

    # check current version
    local old_ver
    old_ver=$("$BIN" -v 2>/dev/null || echo "未知")
    echo "当前版本: $old_ver"

    echo "正在停止 Dashboard..."
    systemctl stop polarbear-dashboard 2>/dev/null || true

    # backup old binary
    cp "$BIN" "$BIN.bak" 2>/dev/null
    echo "已备份旧文件 → $BIN.bak"

    # detect arch & download
    ARCH=$(uname -m)
    case "$ARCH" in
        aarch64|arm64) DASHBOARD_URL="$DOWNLOAD_DASHBOARD_ARM" ;;
        *)             DASHBOARD_URL="$DOWNLOAD_DASHBOARD" ;;
    esac
    echo "架构: $ARCH, 从 $DASHBOARD_URL 下载最新版本..."
    if ! download "$DASHBOARD_URL" "$BIN"; then
        echo -e "${RED}下载失败，正在恢复备份...${NC}"
        mv "$BIN.bak" "$BIN" 2>/dev/null
        systemctl start polarbear-dashboard 2>/dev/null
        pause; return
    fi
    chmod +x "$BIN"

    # verify binary is valid
    if ! "$BIN" -v &>/dev/null; then
        echo -e "${RED}新二进制校验失败，正在恢复备份...${NC}"
        mv "$BIN.bak" "$BIN" 2>/dev/null
        chmod +x "$BIN"
        systemctl start polarbear-dashboard 2>/dev/null
        pause; return
    fi

    # restart
    systemctl start polarbear-dashboard 2>/dev/null
    sleep 2

    if systemctl is-active --quiet polarbear-dashboard; then
        local new_ver
        new_ver=$("$BIN" -v 2>/dev/null || echo "未知")
        rm -f "$BIN.bak"
        echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}${BOLD}║     ✅ Dashboard 更新完成！               ║${NC}"
        echo -e "${GREEN}${BOLD}╠══════════════════════════════════════════╣${NC}"
        echo -e "${GREEN}║  旧版本: $old_ver${NC}"
        echo -e "${GREEN}║  新版本: $new_ver${NC}"
        echo -e "${GREEN}║  数据完整保留: $INSTALL_DIR/data/${NC}"
        echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
    else
        echo -e "${RED}启动失败，正在恢复备份...${NC}"
        mv "$BIN.bak" "$BIN" 2>/dev/null
        chmod +x "$BIN"
        systemctl start polarbear-dashboard 2>/dev/null
        echo -e "${YELLOW}已恢复旧版本，查看日志: journalctl -u polarbear-dashboard -n 20${NC}"
    fi
    pause
}

# ==================== UPDATE AGENT ====================
update_agent() {
    require_root
    echo -e "\n${BOLD}── 更新 Agent${NC}"

    BIN="$AGENT_DIR/polarbear-agent"
    CFG="$AGENT_DIR/agent.yaml"

    if [ ! -f "$BIN" ]; then
        echo -e "${RED}Agent 未安装，请先执行安装${NC}"
        pause; return
    fi

    echo "正在停止 Agent..."
    systemctl stop polarbear-agent 2>/dev/null || true

    # backup old binary
    cp "$BIN" "$BIN.bak" 2>/dev/null
    echo "已备份旧文件 → $BIN.bak"

    # detect arch & download
    ARCH=$(uname -m)
    case "$ARCH" in
        aarch64|arm64) AGENT_URL="$DOWNLOAD_AGENT_ARM" ;;
        *)             AGENT_URL="$DOWNLOAD_AGENT" ;;
    esac
    echo "架构: $ARCH, 从 $AGENT_URL 下载最新版本..."
    if ! download "$AGENT_URL" "$BIN"; then
        echo -e "${RED}下载失败，正在恢复备份...${NC}"
        mv "$BIN.bak" "$BIN" 2>/dev/null
        systemctl start polarbear-agent 2>/dev/null
        pause; return
    fi
    chmod +x "$BIN"

    # verify binary is valid (agent doesn't have -v, just check file size > 0)
    if [ ! -s "$BIN" ]; then
        echo -e "${RED}新二进制校验失败（文件为空），正在恢复备份...${NC}"
        mv "$BIN.bak" "$BIN" 2>/dev/null
        chmod +x "$BIN"
        systemctl start polarbear-agent 2>/dev/null
        pause; return
    fi

    # restart
    systemctl start polarbear-agent 2>/dev/null
    sleep 1

    if systemctl is-active --quiet polarbear-agent; then
        rm -f "$BIN.bak"
        local server_addr
        server_addr=$(grep -oP 'server:\s*\K.*' "$CFG" 2>/dev/null || echo "未知")
        echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}${BOLD}║     ✅ Agent 更新完成！                    ║${NC}"
        echo -e "${GREEN}${BOLD}╠══════════════════════════════════════════╣${NC}"
        echo -e "${GREEN}║  上报地址: $server_addr${NC}"
        echo -e "${GREEN}║  配置文件: $CFG (已保留)${NC}"
        echo -e "${GREEN}║  查看日志: journalctl -u polarbear-agent -f${NC}"
        echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
    else
        echo -e "${RED}启动失败，正在恢复备份...${NC}"
        mv "$BIN.bak" "$BIN" 2>/dev/null
        chmod +x "$BIN"
        systemctl start polarbear-agent 2>/dev/null
        echo -e "${YELLOW}已恢复旧版本，查看日志: journalctl -u polarbear-agent -n 20${NC}"
    fi
    pause
}

# ==================== CHANGE PORT ====================
change_port() {
    require_root
    read -p "新的 HTTP 端口 (当前 $DASHBOARD_PORT): " new_port
    [ -z "$new_port" ] && echo "未更改" && pause && return
    DASHBOARD_PORT=$new_port
    GRPC_PORT=$((DASHBOARD_PORT + 90))
    # update systemd env
    sed -i "s/POLARBEAR_HTTP_PORT=[0-9]*/POLARBEAR_HTTP_PORT=$DASHBOARD_PORT/" /etc/systemd/system/polarbear-dashboard.service
    sed -i "s/POLARBEAR_GRPC_PORT=[0-9]*/POLARBEAR_GRPC_PORT=$GRPC_PORT/" /etc/systemd/system/polarbear-dashboard.service
    systemctl daemon-reload
    systemctl restart polarbear-dashboard
    echo -e "${GREEN}✅ 端口已更新 → HTTP:$DASHBOARD_PORT  gRPC:$GRPC_PORT${NC}"
    echo -e "${GREEN}   Agent 连接地址: YOUR_SERVER_IP:$GRPC_PORT${NC}"
    pause
}

# ==================== TOGGLE AUTO-START ====================
toggle_service() {
    local svc=$1 name=$2
    require_root
    if systemctl is-enabled "$svc" &>/dev/null; then
        systemctl disable "$svc"
        echo -e "${YELLOW}$name 开机自启: 已关闭${NC}"
    else
        systemctl enable "$svc"
        echo -e "${GREEN}$name 开机自启: 已开启${NC}"
    fi
    pause
}

# ==================== UNINSTALL ====================
uninstall_dashboard() {
    require_root
    echo -e "${RED}${BOLD}⚠ 这将删除 Dashboard 及全部数据！${NC}"
    read -p "输入 DELETE 确认: " confirm
    [ "$confirm" != "DELETE" ] && echo "取消" && pause && return
    systemctl stop polarbear-dashboard 2>/dev/null || true
    systemctl disable polarbear-dashboard 2>/dev/null || true
    rm -f /etc/systemd/system/polarbear-dashboard.service
    rm -rf "$INSTALL_DIR"
    systemctl daemon-reload
    echo -e "${GREEN}✅ Dashboard 已彻底删除${NC}"
    pause
}

uninstall_agent() {
    require_root
    systemctl stop polarbear-agent 2>/dev/null || true
    systemctl disable polarbear-agent 2>/dev/null || true
    rm -f /etc/systemd/system/polarbear-agent.service
    rm -rf "$AGENT_DIR"
    systemctl daemon-reload
    echo -e "${GREEN}✅ Agent 已删除${NC}"
    pause
}

# ==================== RUN ====================
main_menu
