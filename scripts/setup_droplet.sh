#!/usr/bin/env bash
set -e

echo "=== 1. Allocating 3GB Swap ==="
if [ ! -f /swapfile ]; then
    fallocate -l 3G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "Swap allocated successfully."
else
    echo "Swapfile already exists."
fi

echo "=== 2. Installing System Packages & Docker ==="
apt-get update -y
apt-get install -y ca-certificates curl gnupg git ufw rsync
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "=== 3. Enabling Docker Service ==="
systemctl enable docker
systemctl start docker

echo "=== 4. Status Check ==="
docker --version
docker compose version
free -m

