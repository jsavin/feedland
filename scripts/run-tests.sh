#!/usr/bin/env bash
# End-to-end test runner for FeedLand automated suites.
# - Ensures MySQL is installed (via Homebrew when available).
# - Creates a temporary database/user and imports the FeedLand schema.
# - Generates a throwaway config.json in /tmp using scripts/setup.js.
# - Installs npm dependencies fresh for each run.
# - Runs `npm test` and then cleans up database + temp files.
# This is intended for local/CI runs that need a clean environment each time.

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
TEMP_DIR=$(mktemp -d /tmp/feedland-tests-XXXXXX)
CONFIG_FILE="$TEMP_DIR/config.json"
NODE_BIN=$(which node)
NPM_BIN=$(which npm)
MYSQL_SCHEMA_EXTERNAL="$REPO_ROOT/../feedlandInstall/docs/setup.sql"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
DB_NAME="feedland_test_${TIMESTAMP}"
DB_USER="${DB_NAME}_u"
DB_PASS="testpass"
MYSQL_ROOT_USER=${MYSQL_ROOT_USER:-"root"}
MYSQL_ROOT_PASS=${MYSQL_ROOT_PASS:-""}
MYSQL_HOST="localhost"
MYSQL_PORT=3306

function cleanup {
	set +e
	mysql_cmd=(mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_ROOT_USER")
	if [[ -n "$MYSQL_ROOT_PASS" ]]; then
		mysql_cmd+=("-p$MYSQL_ROOT_PASS")
	fi
	"${mysql_cmd[@]}" -e "DROP DATABASE IF EXISTS \`$DB_NAME\`;" >/dev/null 2>&1 || true
	"${mysql_cmd[@]}" -e "DROP USER IF EXISTS '$DB_USER'@'localhost';" >/dev/null 2>&1 || true
	rm -rf "$TEMP_DIR"
	rm -rf "$REPO_ROOT/node_modules"
}

trap cleanup EXIT INT TERM

function command_exists {
	command -v "$1" >/dev/null 2>&1
}

# Ensure mysql client is available
if ! command_exists mysql; then
	if command_exists brew; then
		echo "mysql command not found. Installing via Homebrew..."
		brew install mysql
	else
		echo "Error: mysql command not found and Homebrew isn't available. Install MySQL manually." >&2
		exit 1
	fi
fi

# Ensure server is reachable
if command_exists mysqladmin; then
	if ! mysqladmin ping >/dev/null 2>&1; then
		if command_exists brew; then
			echo "Starting MySQL via brew services..."
			brew services start mysql
		else
			echo "Attempting mysql.server start..."
			if command_exists mysql.server; then
				mysql.server start
			else
				echo "Failed to start MySQL. Start it manually and re-run." >&2
				exit 1
			fi
		fi
	fi
else
	echo "mysqladmin not found; assuming local MySQL is already running."
fi

sleep 3

# Prepare schema path (prefer external feedlandInstall copy if present)
if [[ -f "$MYSQL_SCHEMA_EXTERNAL" ]]; then
	SCHEMA_FILE="$MYSQL_SCHEMA_EXTERNAL"
else
	SCHEMA_FILE="$REPO_ROOT/docs/setup.sql"
fi

# If schema includes CREATE DATABASE/USE statements, filter them out.
IMPORT_FILE="$SCHEMA_FILE"
if [[ -f "$SCHEMA_FILE" ]]; then
	IMPORT_FILE="$TEMP_DIR/schema.sql"
	awk 'tolower($0) !~ /^create database/ && tolower($0) !~ /^use / {print}' "$SCHEMA_FILE" >"$IMPORT_FILE"
fi

# Install dependencies fresh
(
	cd "$REPO_ROOT"
	rm -rf node_modules
	"$NPM_BIN" install --prefer-online --no-save
)

# Build config.json via setup.js
CONFIG_CMD=("$NODE_BIN" "$SCRIPT_DIR/setup.js" \
	--non-interactive \
	--config="$CONFIG_FILE" \
	--port=1452 \
	--domain=localhost:1452 \
	--base-url=http://localhost:1452/ \
	--mysql-host=localhost \
	--mysql-port=3306 \
	--mysql-user="$DB_USER" \
	--mysql-password="$DB_PASS" \
	--mysql-database="$DB_NAME" \
	--smtp=no \
	--run-npm=false \
	--use-local-mysql=true \
	--install-local-mysql \
	--mysql-root-user="$MYSQL_ROOT_USER" \
	--mysql-root-password="$MYSQL_ROOT_PASS"
)
if [[ -f "$IMPORT_FILE" ]]; then
	CONFIG_CMD+=(--schema="$IMPORT_FILE")
fi

"${CONFIG_CMD[@]}"

# Run automated tests
(
	cd "$REPO_ROOT"
	"$NPM_BIN" test
)

echo "Tests completed. Temporary files at $TEMP_DIR have been removed."
