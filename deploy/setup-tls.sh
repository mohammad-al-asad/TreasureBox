#!/usr/bin/env bash
# One-time HTTPS setup on the server (run as root after DNS points to this server):
#   sudo bash /opt/treasurebox/src/deploy/setup-tls.sh
# Issues a Let's Encrypt certificate for the domains, installs a renewal timer and
# restarts nginx so it picks up the HTTPS config.
set -euo pipefail

DOMAINS=(api.treassurebox.com admin.treassurebox.com)
CERTBOT_IMAGE=certbot/certbot:v2.11.0
NGINX_CONTAINER=treasurebox-nginx-1

mkdir -p /etc/letsencrypt /var/www/certbot

ARGS=()
for d in "${DOMAINS[@]}"; do ARGS+=(-d "$d"); done

docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/certbot:/var/www/certbot \
  "$CERTBOT_IMAGE" certonly --webroot -w /var/www/certbot \
  --cert-name treassurebox "${ARGS[@]}" \
  --agree-tos --register-unsafely-without-email --non-interactive --keep-until-expiring

# Renew twice a day (certbot only renews when < 30 days remain), then reload nginx
cat > /etc/systemd/system/certbot-renew.service <<UNIT
[Unit]
Description=Renew Let's Encrypt certificates (TreasureBox)
After=docker.service

[Service]
Type=oneshot
ExecStart=/usr/bin/docker run --rm -v /etc/letsencrypt:/etc/letsencrypt -v /var/www/certbot:/var/www/certbot $CERTBOT_IMAGE renew --quiet
ExecStartPost=/usr/bin/docker exec $NGINX_CONTAINER nginx -s reload
UNIT

cat > /etc/systemd/system/certbot-renew.timer <<UNIT
[Unit]
Description=Twice-daily Let's Encrypt renewal check (TreasureBox)

[Timer]
OnCalendar=*-*-* 03,15:00:00
RandomizedDelaySec=1h
Persistent=true

[Install]
WantedBy=timers.target
UNIT

systemctl daemon-reload
systemctl enable --now certbot-renew.timer

# Restart (not reload) so the container's startup script enables tls.conf
docker restart "$NGINX_CONTAINER" >/dev/null
echo "HTTPS enabled for: ${DOMAINS[*]}"
