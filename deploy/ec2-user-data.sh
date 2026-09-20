#!/bin/bash
# EC2 user data for SeatRelay on an AWS Free Tier instance (Amazon Linux 2023).
# Paste this into "Advanced details -> User data" when launching the instance.
set -euxo pipefail

REPO_URL="https://github.com/HirthikBalaji/Bharath-Build-2026-First-Commit.git"
BRANCH="main"
APP_DIR="/opt/seatrelay"

dnf update -y
dnf install -y docker git
systemctl enable --now docker
usermod -aG docker ec2-user

# t3.micro has 1 GB of RAM and the Vite build gets OOM-killed without swap.
# Create it before the first build rather than after it fails.
if [ ! -f /swapfile ]; then
  dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >>/etc/fstab
fi

# Compose v2 as a docker CLI plugin
PLUGIN_DIR=/usr/libexec/docker/cli-plugins
mkdir -p "$PLUGIN_DIR"
curl -sSL "https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-$(uname -s)-$(uname -m)" \
  -o "$PLUGIN_DIR/docker-compose"
chmod +x "$PLUGIN_DIR/docker-compose"

git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
cd "$APP_DIR"
docker compose up -d --build

# Bring the stack back up after a stop/start of the instance.
cat >/etc/systemd/system/seatrelay.service <<UNIT
[Unit]
Description=SeatRelay stack
Requires=docker.service
After=docker.service network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down

[Install]
WantedBy=multi-user.target
UNIT
systemctl enable seatrelay.service
