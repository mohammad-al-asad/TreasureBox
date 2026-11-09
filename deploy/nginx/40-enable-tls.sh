#!/bin/sh
# Runs inside the nginx container at startup (official image runs /docker-entrypoint.d/*.sh).
# Enables the HTTPS config only when the certificate exists, so nginx never fails to start.
if [ -f /etc/letsencrypt/live/treassurebox/fullchain.pem ]; then
  cp /etc/nginx/tls/tls.conf /etc/nginx/conf.d/tls.conf
  echo "40-enable-tls: certificate found, HTTPS enabled"
else
  rm -f /etc/nginx/conf.d/tls.conf
  echo "40-enable-tls: no certificate yet, HTTP only"
fi
