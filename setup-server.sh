#!/bin/bash

set -e

# Configuration
SERVER_IP="1.234.44.174"
REMOTE_USER="root"
REMOTE_DIR="/var/www/myungri-yaho"
APP_NAME="myungri-yaho"
GIT_REPO="https://github.com/ocean3885/myungri-yaho.git"
DOMAIN="yaho.dowon.ai.kr"
PORT="3001"

echo "Setting up $APP_NAME on $SERVER_IP..."

ssh $REMOTE_USER@$SERVER_IP << EOF
  set -e

  # Load environment to ensure npm/node/pm2 are found
  export NVM_DIR="\$HOME/.nvm"
  [ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"
  source ~/.bashrc 2>/dev/null
  source ~/.profile 2>/dev/null

  command -v git >/dev/null 2>&1 || { echo "git is not installed."; exit 1; }
  command -v npm >/dev/null 2>&1 || { echo "npm is not installed."; exit 1; }
  command -v pm2 >/dev/null 2>&1 || { echo "pm2 is not installed."; exit 1; }
  command -v nginx >/dev/null 2>&1 || { echo "nginx is not installed."; exit 1; }

  echo "Preparing project directory..."
  mkdir -p "$(dirname "$REMOTE_DIR")"

  if [ -d "$REMOTE_DIR/.git" ]; then
    cd $REMOTE_DIR
    git stash
    git pull origin main
  elif [ -e "$REMOTE_DIR" ]; then
    echo "$REMOTE_DIR already exists but is not a git repository."
    echo "Move it aside or initialize it manually before running this setup script."
    exit 1
  else
    git clone $GIT_REPO $REMOTE_DIR
    cd $REMOTE_DIR
  fi

  if [ ! -f "$REMOTE_DIR/.env.local" ] && [ ! -f "$REMOTE_DIR/.env" ]; then
    echo "Creating empty .env.local. Add production environment variables before real use."
    touch "$REMOTE_DIR/.env.local"
    chmod 600 "$REMOTE_DIR/.env.local"
  fi

  ENV_FILE="$REMOTE_DIR/.env.local"
  [ -f "$REMOTE_DIR/.env" ] && ENV_FILE="$REMOTE_DIR/.env"

  echo "Ensuring Auth.js domain environment variables..."
  grep -q '^AUTH_URL=' "\$ENV_FILE" || echo "AUTH_URL=https://$DOMAIN" >> "\$ENV_FILE"
  grep -q '^NEXTAUTH_URL=' "\$ENV_FILE" || echo "NEXTAUTH_URL=https://$DOMAIN" >> "\$ENV_FILE"
  grep -q '^AUTH_TRUST_HOST=' "\$ENV_FILE" || echo "AUTH_TRUST_HOST=true" >> "\$ENV_FILE"
  chmod 600 "\$ENV_FILE"

  if ! grep -q '^AUTH_SECRET=' "\$ENV_FILE"; then
    echo "AUTH_SECRET is missing in \$ENV_FILE."
    echo "Add AUTH_SECRET and other production secrets before running setup again."
    exit 1
  fi

  echo "Installing dependencies..."
  npm install

  echo "Building application..."
  npm run build

  echo "Setting file permissions..."
  find $REMOTE_DIR -path "$REMOTE_DIR/node_modules" -prune -o -type d -exec chmod 755 {} \;
  find $REMOTE_DIR -path "$REMOTE_DIR/node_modules" -prune -o -type f -exec chmod 644 {} \;
  find $REMOTE_DIR -name "*.sh" -exec chmod 750 {} \;
  [ -f "$REMOTE_DIR/.env" ]       && chmod 600 "$REMOTE_DIR/.env"
  [ -f "$REMOTE_DIR/.env.local" ] && chmod 600 "$REMOTE_DIR/.env.local"
  find $REMOTE_DIR -name "*.db" -exec chmod 640 {} \;
  find $REMOTE_DIR -name "*.sqlite" -exec chmod 640 {} \;

  echo "Configuring Nginx..."
  cat > /etc/nginx/sites-available/$DOMAIN << NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        proxy_cache_bypass \\\$http_upgrade;
    }
}
NGINX

  ln -sfn /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
  nginx -t
  systemctl reload nginx

  echo "Starting PM2 process..."
  if pm2 describe $APP_NAME >/dev/null 2>&1; then
    NODE_ENV=production \
      PORT=$PORT \
      AUTH_URL=https://$DOMAIN \
      NEXTAUTH_URL=https://$DOMAIN \
      AUTH_TRUST_HOST=true \
      pm2 reload $APP_NAME --update-env
  else
    NODE_ENV=production \
      PORT=$PORT \
      AUTH_URL=https://$DOMAIN \
      NEXTAUTH_URL=https://$DOMAIN \
      AUTH_TRUST_HOST=true \
      pm2 start npm --name $APP_NAME -- start
  fi

  echo "Configuring PM2 startup..."
  pm2 save
  pm2 startup systemd -u $REMOTE_USER --hp \$HOME || true

  echo "Initial server setup complete!"
EOF
