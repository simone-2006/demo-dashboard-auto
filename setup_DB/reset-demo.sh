#!/bin/bash
set -u
set +H
export TZ=Europe/Rome
SQLCMD="/opt/mssql-tools18/bin/sqlcmd"

run_seed() {
  echo "$(date '+%Y-%m-%d %H:%M:%S %Z') Avvio reset dati demo..."
  if "$SQLCMD" -S sqlserver -U sa -P "$MSSQL_SA_PASSWORD" -C -b -i /scripts/seed-demo.sql; then
    echo "$(date '+%Y-%m-%d %H:%M:%S %Z') Reset dati demo completato."
  else
    echo "$(date '+%Y-%m-%d %H:%M:%S %Z') Reset dati demo fallito (exit $?)."
  fi
}

echo "Scheduler reset demo: ogni notte a mezzanotte ($TZ)."
while true; do
  now=$(date +%s)
  midnight=$(date -d "tomorrow 00:00" +%s)
  wait=$((midnight - now))
  echo "Prossimo reset: $(date -d "@$midnight" '+%Y-%m-%d %H:%M:%S %Z') (tra ${wait}s)"
  sleep "$wait"
  run_seed
done
