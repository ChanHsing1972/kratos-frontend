#!/usr/bin/env bash
set -euo pipefail

: "${FRONTEND_NAME:?FRONTEND_NAME is required}"
: "${SITE_ROOT:?SITE_ROOT is required}"

DEPLOY_HOST="${DEPLOY_HOST:-192.0.2.1}"
DEPLOY_USER="${DEPLOY_USER:-root}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
COMMIT_SHA="${CI_COMMIT_SHA:-manual}"
ARCHIVE="/tmp/${FRONTEND_NAME}-${COMMIT_SHA}.tar.gz"
REMOTE_ARCHIVE="/tmp/${FRONTEND_NAME}-${COMMIT_SHA}.tar.gz"
SSH_TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$SSH_TMP_DIR"
  rm -f "$ARCHIVE"
}
trap cleanup EXIT

test -d dist
tar --format=ustar -C dist -czf "$ARCHIVE" .

ssh_common=(-p "$DEPLOY_PORT" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null)
scp_common=(-P "$DEPLOY_PORT" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null)

if [[ -n "${SSH_PRIVATE_KEY:-}" ]]; then
  SSH_KEY_FILE="$SSH_TMP_DIR/id_deploy"
  if [[ -f "$SSH_PRIVATE_KEY" ]]; then
    cp "$SSH_PRIVATE_KEY" "$SSH_KEY_FILE"
  else
    printf '%s\n' "$SSH_PRIVATE_KEY" > "$SSH_KEY_FILE"
  fi
  chmod 600 "$SSH_KEY_FILE"
  ssh_cmd=(ssh -i "$SSH_KEY_FILE" "${ssh_common[@]}")
  scp_cmd=(scp -i "$SSH_KEY_FILE" "${scp_common[@]}")
elif [[ -n "${SSH_PASSWORD:-}" ]]; then
  ssh_cmd=(sshpass -p "$SSH_PASSWORD" ssh "${ssh_common[@]}")
  scp_cmd=(sshpass -p "$SSH_PASSWORD" scp "${scp_common[@]}")
else
  echo "Set SSH_PRIVATE_KEY or SSH_PASSWORD in GitLab CI/CD Variables." >&2
  exit 1
fi

"${scp_cmd[@]}" "$ARCHIVE" "$DEPLOY_USER@$DEPLOY_HOST:$REMOTE_ARCHIVE"

"${ssh_cmd[@]}" "$DEPLOY_USER@$DEPLOY_HOST" \
  "SITE_ROOT='$SITE_ROOT' REMOTE_ARCHIVE='$REMOTE_ARCHIVE' bash -s" <<'REMOTE_SCRIPT'
set -euo pipefail

if command -v apt-get >/dev/null 2>&1; then
  missing_packages=()
  command -v nginx >/dev/null 2>&1 || missing_packages+=(nginx)
  command -v curl >/dev/null 2>&1 || missing_packages+=(curl)
  if [[ "${#missing_packages[@]}" -gt 0 ]]; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update
    apt-get install -y "${missing_packages[@]}"
  fi
fi

mkdir -p /var/www/se3/agent /var/www/se3/eval "$SITE_ROOT"
find "$SITE_ROOT" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
tar --no-same-owner -xzf "$REMOTE_ARCHIVE" -C "$SITE_ROOT"
chown -R root:root "$SITE_ROOT"
rm -f "$REMOTE_ARCHIVE"

cat > /etc/nginx/sites-available/se3.conf <<'NGINX'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /var/www/se3/agent;
    index index.html;
    client_max_body_size 20m;

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /eval/health {
        proxy_pass http://127.0.0.1:8001/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /eval/api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /eval-api/ {
        proxy_pass http://127.0.0.1:8001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /eval {
        return 301 /eval/;
    }

    location /eval/ {
        alias /var/www/se3/eval/;
        try_files $uri $uri/ /eval/index.html;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX

ln -sfn /etc/nginx/sites-available/se3.conf /etc/nginx/sites-enabled/se3.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl reload nginx || systemctl restart nginx
REMOTE_SCRIPT
