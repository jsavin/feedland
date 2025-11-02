#!/usr/bin/env bash
# Simple smoke test that pings a few public endpoints on a running FeedLand instance.
# Usage:
#   FEEDLAND_HOST="http://localhost:1410" ./scripts/smoke.sh
# Optionally set FEEDLAND_EMAIL and FEEDLAND_CODE for authenticated routes.

set -euo pipefail

HOST=${FEEDLAND_HOST:-"http://localhost:1410"}
EMAIL=${FEEDLAND_EMAIL:-}
CODE=${FEEDLAND_CODE:-}

function log {
	echo "[$(date '+%H:%M:%S')] $*"
	}

function check {
	local path=$1
	log "GET ${HOST}${path}"
	curl --silent --show-error --fail --max-time 10 "${HOST}${path}" >/dev/null
	}

check "/getfeed?url=http://example.com/feed.xml"
check "/getfeeditems?url=http://example.com/feed.xml&maxItems=5"
check "/memoryusage"

if [[ -n "$EMAIL" && -n "$CODE" ]]; then
	AUTH="emailaddress=${EMAIL}&emailcode=${CODE}"
	check "/getuserprefs?${AUTH}"
else
	log "Skipping authenticated checks (set FEEDLAND_EMAIL and FEEDLAND_CODE)."
fi

log "Smoke tests completed."
