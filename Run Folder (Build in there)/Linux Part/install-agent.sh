#!/bin/bash
# ============================================================
# PolarBear Agent — 一键安装脚本
# 用法: curl -fsSL <此脚本URL> | bash -s -- IP:PORT
# ============================================================
set -e

SERVER_ADDR="${1:-}"
# detect architecture
ARCH=$(uname -m)
case "$ARCH" in
    aarch64|arm64) DOWNLOAD_URL="https://home.polarbear.wtf/files/polarbear-agent-arm64" ;;
    *)            DOWNLOAD_URL="https://home.polarbear.wtf/files/polarbear-agent" ;;
esac
echo "架构: $ARCH"
INSTALL_DIR="/opt/polarbear-agent"
GREEN='\033[32m'; YELLOW='\033[33m'; RED='\033[31m'; NC='\033[0m'

# ---------- check args ----------
if [ -z "$SERVER_ADDR" ]; then
    echo -e "${RED}用法: curl ... | bash -s -- IP:PORT${NC}"
    echo -e "${RED}例如: curl ... | bash -s -- 192.168.1.5:8090${NC}"
    exit 1
fi

# ---------- ensure root ----------
if [ "$(id -u)" -ne 0 ]; then
    if ! command -v sudo &>/dev/null; then
        echo "sudo 未安装，正在自动安装..."
        command -v apt-get &>/dev/null && su -c "apt-get update -qq && apt-get install -y -qq sudo"
        command -v yum     &>/dev/null && su -c "yum install -y -q sudo"
        command -v dnf     &>/dev/null && su -c "dnf install -y -q sudo"
        command -v apk     &>/dev/null && su -c "apk add --no-cache sudo"
        command -v pacman  &>/dev/null && su -c "pacman -S --noconfirm sudo"
        if ! command -v sudo &>/dev/null; then
            echo -e "${RED}无法安装 sudo，请手动执行 su - 切换到 root 后重试${NC}"
            exit 1
        fi
    fi
    exec sudo bash "$0" "$@"
fi

# ---------- install download tool ----------
if ! command -v curl &>/dev/null && ! command -v wget &>/dev/null; then
    echo "正在安装下载工具..."
    if command -v apt-get &>/dev/null; then
        apt-get update -qq && apt-get install -y -qq curl
    elif command -v yum &>/dev/null; then
        yum install -y -q curl
    elif command -v dnf &>/dev/null; then
        dnf install -y -q curl
    elif command -v apk &>/dev/null; then
        apk add --no-cache curl
    elif command -v pacman &>/dev/null; then
        pacman -S --noconfirm curl
    fi
fi

download() {
    if command -v curl &>/dev/null; then
        curl -fsSL --connect-timeout 10 --max-time 60 -o "$2" "$1"
    elif command -v wget &>/dev/null; then
        wget -q --timeout=10 -O "$2" "$1"
    else
        echo -e "${RED}无法下载: curl/wget 均不可用${NC}"
        exit 1
    fi
}

# ---------- install binary ----------
echo "正在安装 PolarBear Agent..."
mkdir -p "$INSTALL_DIR"

BIN="$INSTALL_DIR/polarbear-agent"
if [ -f "./polarbear-agent" ]; then
    cp ./polarbear-agent "$BIN"
else
    echo "从服务器下载..."
    download "$DOWNLOAD_URL" "$BIN"
fi
chmod +x "$BIN"

# ---------- generate config ----------
cat > "$INSTALL_DIR/agent.yaml" << EOF
server: $SERVER_ADDR
uuid: agent-$(date +%s)$((RANDOM % 1000))
report_delay: 1
debug: false
EOF

# ---------- systemd service ----------
cat > /etc/systemd/system/polarbear-agent.service << EOF
[Unit]
Description=PolarBear Agent
After=network.target
[Service]
Type=simple
ExecStart=$BIN -c $INSTALL_DIR/agent.yaml
WorkingDirectory=$INSTALL_DIR
Restart=always
RestartSec=10
[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable polarbear-agent
systemctl start polarbear-agent
sleep 1

if systemctl is-active --quiet polarbear-agent; then
    echo -e "${GREEN}✅ Agent 安装成功！${NC}"
    echo -e "${GREEN}   上报至: $SERVER_ADDR${NC}"
    echo -e "${GREEN}   开机自启: 已启用${NC}"
    echo -e "   状态: systemctl status polarbear-agent"
    echo -e "   日志: journalctl -u polarbear-agent -f"
else
    echo -e "${RED}⚠ Agent 启动失败，查看日志:${NC}"
    echo -e "   journalctl -u polarbear-agent -n 20"
    exit 1
fi
