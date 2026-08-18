#!/bin/bash

set -e

# Configuration
SERVER_IP="1.234.44.174"
REMOTE_USER="root"
REMOTE_DIR="/var/www/myungri-yaho"
APP_NAME="myungri-yaho"
DOMAIN="yaho.dowon.ai.kr"
PORT="3001"

echo "Deploying $APP_NAME to $SERVER_IP..."

ssh $REMOTE_USER@$SERVER_IP << EOF
  set -e

  # Load environment to ensure npm/node/pm2 are found
  export NVM_DIR="\$HOME/.nvm"
  [ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"
  source ~/.bashrc 2>/dev/null
  source ~/.profile 2>/dev/null

  cd $REMOTE_DIR

  echo "Pulling latest changes..."
  git stash
  git pull origin main

  echo "Installing dependencies..."
  rm -rf .next
  npm install

  ENV_FILE="$REMOTE_DIR/.env.local"
  [ -f "$REMOTE_DIR/.env" ] && ENV_FILE="$REMOTE_DIR/.env"

  echo "Checking Auth.js environment variables..."
  grep -q '^AUTH_URL=' "\$ENV_FILE" || echo "AUTH_URL=https://$DOMAIN" >> "\$ENV_FILE"
  grep -q '^NEXTAUTH_URL=' "\$ENV_FILE" || echo "NEXTAUTH_URL=https://$DOMAIN" >> "\$ENV_FILE"
  grep -q '^AUTH_TRUST_HOST=' "\$ENV_FILE" || echo "AUTH_TRUST_HOST=true" >> "\$ENV_FILE"
  chmod 600 "\$ENV_FILE"

  if ! grep -q '^AUTH_SECRET=' "\$ENV_FILE"; then
    echo "AUTH_SECRET is missing in \$ENV_FILE."
    exit 1
  fi

  echo "Building application..."
  npm run build
  
  echo "Setting file permissions..."
  # Directories: rwxr-xr-x, Files: rw-r--r--
  # Exclude node_modules so executable package binaries keep their execute bit.
  find $REMOTE_DIR -path "$REMOTE_DIR/node_modules" -prune -o -type d -exec chmod 755 {} \;
  find $REMOTE_DIR -path "$REMOTE_DIR/node_modules" -prune -o -type f -exec chmod 644 {} \;
  # Shell scripts: rwxr-x--- (owner+group execute only)
  find $REMOTE_DIR -name "*.sh" -exec chmod 750 {} \;
  # Env files: rw------- (owner read/write only)
  [ -f "$REMOTE_DIR/.env" ]       && chmod 600 $REMOTE_DIR/.env
  [ -f "$REMOTE_DIR/.env.local" ] && chmod 600 $REMOTE_DIR/.env.local
  # SQLite DB files: rw-r----- (owner+group read)
  find $REMOTE_DIR -name "*.db" -exec chmod 640 {} \;
  find $REMOTE_DIR -name "*.sqlite" -exec chmod 640 {} \;

  echo "Reloading PM2 process..."
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

  echo "Deployment complete!"
EOF
