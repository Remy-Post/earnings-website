#!/bin/bash
# One-time (or after changing deploy/publish-report or deploy/report.caddy) setup of the Oracle box, run from a
# machine that can SSH to it:   deploy/install-box.sh
# Installs ~/bin/publish-report, creates ~/sites/report, and writes the `# BEGIN report ... # END report` block
# into ~/n8n/caddy/Caddyfile: backed up first, validated before reload, rolled back if validation fails.
# Touches nothing else in the Caddyfile.
set -euo pipefail
cd "$(dirname "$0")"
BOX="${REPORT_BOX:-ubuntu@40.233.100.237}"
KEY="${REPORT_BOX_KEY:-$HOME/.ssh/oci_n8n}"
SSH=(ssh -i "$KEY" -o BatchMode=yes -o ConnectTimeout=15)

echo "== publish script"
"${SSH[@]}" "$BOX" 'mkdir -p ~/bin ~/sites/report/releases && cat > ~/bin/publish-report.new && chmod 755 ~/bin/publish-report.new && mv ~/bin/publish-report.new ~/bin/publish-report' < publish-report

echo "== Caddy block"
"${SSH[@]}" "$BOX" 'cat > /tmp/report.caddy' < report.caddy
"${SSH[@]}" "$BOX" 'bash -s' <<'REMOTE'
set -euo pipefail
CF=~/n8n/caddy/Caddyfile
BAK="$CF.bak-report-$(date -u +%Y%m%d-%H%M%S)"
cp -p "$CF" "$BAK"
# Drop an existing report block, then put the new one right after "# END earnings" (or at the end).
awk -v blk=/tmp/report.caddy '
  /^# BEGIN report( |$)/ { skip = 1 }
  !skip { print }
  !skip && /^# END earnings$/ { print ""; while ((getline line < blk) > 0) print line; done = 1 }
  /^# END report$/ { skip = 0 }
  END { if (!done) { print ""; while ((getline line < blk) > 0) print line } }
' "$BAK" > "$CF.new"
# Guard: apart from the report block, no line of the old file may be lost.
strip() { awk '/^# BEGIN report( |$)/{s=1} !s{print} /^# END report$/{s=0}' "$1" | grep -v '^$'; }
if ! diff <(strip "$BAK") <(strip "$CF.new") >/dev/null; then
  echo "refusing: the edit would change lines outside the report block" >&2; rm -f "$CF.new"; exit 1
fi
cat "$CF.new" > "$CF"   # keep the inode: the file is bind-mounted into the container
rm -f "$CF.new" /tmp/report.caddy
cd ~/n8n
if docker compose exec -T caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/tmp/caddy-validate.log 2>&1; then
  docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
  echo "reloaded (backup: $BAK)"
else
  cat "$BAK" > "$CF"
  echo "validation failed, Caddyfile restored from $BAK:" >&2
  tail -20 /tmp/caddy-validate.log >&2
  exit 1
fi
REMOTE
