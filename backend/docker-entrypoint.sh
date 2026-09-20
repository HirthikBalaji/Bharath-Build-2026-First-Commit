#!/bin/sh
set -e

DB_PATH="${SEATRELAY_DB_PATH:-/app/data/seatrelay.db}"
mkdir -p "$(dirname "$DB_PATH")"

if [ ! -f "$DB_PATH" ]; then
  echo "[entrypoint] no database at $DB_PATH - initialising schema and seed data"
  python3 db_init.py
  node src/seed.js
else
  echo "[entrypoint] reusing existing database at $DB_PATH"
fi

exec "$@"
