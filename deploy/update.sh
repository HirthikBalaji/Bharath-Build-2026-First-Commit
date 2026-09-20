#!/bin/bash
# Redeploy the latest commit on the EC2 box. Run from the repo checkout (/opt/seatrelay).
set -euo pipefail
git pull --ff-only
docker compose up -d --build
docker image prune -f
docker compose ps
