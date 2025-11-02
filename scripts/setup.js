#!/usr/bin/env node

/*
	Interactive (or fully automated) setup script for FeedLand installations.
	Use CLI flags to pre-supply answers or run non-interactively. Example:
	  node scripts/setup.js --non-interactive \
	    --port=1452 --domain=localhost:1452 --base-url=http://localhost:1452/ \
	    --mysql-host=localhost --mysql-user=feedland --mysql-password=secret \
	    --mysql-database=feedland --install-local-mysql --schema=../feedlandInstall/docs/setup.sql
*/

const fs = require ("fs");
const path = require ("path");
const {spawn, spawnSync} = require ("child_process");
const readline = require ("readline/promises");
const {stdin: input, stdout: output} = require ("process");
const mysql = require ("mysql2/promise");
const mysqlEscape = require ("mysql2");

function parseArgs (argv) {
	const result = {};
	for (let i = 0; i < argv.length; i++) {
		const arg = argv [i];
		if (arg.startsWith ("--")) {
			const body = arg.slice (2);
			const eq = body.indexOf ("=");
			if (eq >= 0) {
				const key = body.slice (0, eq);
				const value = body.slice (eq + 1);
				result [key] = value;
			}
			else {
				const next = argv [i + 1];
				if (next && !next.startsWith ("--")) {
					result [body] = next;
					i++;
				}
				else {
					result [body] = true;
				}
			}
		}
	}
	return result;
}

function toBoolean (value, def) {
	if (value === undefined) {
		return def;
	}
	if (typeof value === "boolean") {
		return value;
	}
	const txt = value.toString ().trim ().toLowerCase ();
	if (["y", "yes", "true", "1"].includes (txt)) {
		return true;
	}
	if (["n", "no", "false", "0"].includes (txt)) {
		return false;
	}
	return def;
}

function toNumber (value, def) {
	if (value === undefined || value === "") {
		return def;
	}
	const num = Number (value);
	if (Number.isNaN (num)) {
		throw new Error ("Expected a numeric value but got " + value);
	}
	return num;
}

function sanitizeIdentifier (value, label) {
	if (!/^[A-Za-z0-9_]+$/.test (value)) {
		throw new Error (`${label} may only contain letters, numbers, and underscores.`);
	}
	return value;
}

function commandExists (cmd) {
	try {
		spawnSync (cmd, ["--version"], {stdio: "ignore"});
		return true;
	}
	catch (err) {
		return false;
	}
}

async function runCommand (cmd, args, options={}) {
	return await new Promise ((resolve, reject) => {
		const child = spawn (cmd, args, {stdio: "inherit", ...options});
		child.on ("close", (code) => {
			if (code === 0) {
				resolve ();
			}
			else {
				reject (new Error (`${cmd} ${args.join (" ")} failed with code ${code}`));
			}
		});
	});
}

async function ensureLocalMysql ({interactive, install, rootUser, rootPassword, dbName, dbUser, dbPassword, importSchema}) {
	const hasMysql = commandExists ("mysql");
	if (!hasMysql) {
		if (commandExists ("brew")) {
			if (!install) {
				if (!interactive) {
					throw new Error ("mysql command not found. Re-run with --install-local-mysql to install via Homebrew.");
				}
				const rl = readline.createInterface ({input, output});
				const answer = await rl.question ("mysql command not found. Install with Homebrew now? [yes]: ");
				rl.close ();
				if (!toBoolean (answer || "yes", true)) {
					throw new Error ("MySQL is required; install it manually or re-run with install option.");
				}
			}
			output.write ("Installing MySQL via Homebrew...\n");
			await runCommand ("brew", ["install", "mysql"]);
		}
		else {
			throw new Error ("mysql command not found and Homebrew unavailable. Install MySQL manually.");
		}
	}

	async function pingDatabase () {
		try {
			const conn = await mysql.createConnection ({host: "localhost", port: 3306, user: rootUser, password: rootPassword || undefined});
			await conn.end ();
			return true;
		}
		catch (err) {
			return false;
		}
	}

	if (!(await pingDatabase ())) {
		if (commandExists ("brew")) {
			output.write ("Starting MySQL with 'brew services start mysql'...\n");
			await runCommand ("brew", ["services", "start", "mysql"]);
		}
		else if (commandExists ("mysql.server")) {
			output.write ("Starting MySQL with 'mysql.server start'...\n");
			await runCommand ("mysql.server", ["start"]);
		}
		else {
			throw new Error ("Unable to start MySQL automatically. Start it manually and re-run.");
		}

		let retries = 5;
		while (retries-- > 0) {
			if (await pingDatabase ()) {
				break;
			}
			await new Promise ((resolve) => setTimeout (resolve, 2000));
		}
		if (!(await pingDatabase ())) {
			throw new Error ("MySQL service did not start successfully.");
		}
	}

	const safeDbName = sanitizeIdentifier (dbName, "Database name");
	const safeDbUser = sanitizeIdentifier (dbUser, "MySQL user");
	const escapedUser = mysqlEscape.escape (safeDbUser);
	const escapedPass = mysqlEscape.escape (dbPassword);

const conn = await mysql.createConnection ({host: "localhost", port: 3306, user: rootUser, password: rootPassword || undefined});
await conn.query (`DROP DATABASE IF EXISTS \`${safeDbName}\``);
await conn.query (`CREATE DATABASE \`${safeDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
	await conn.query (`CREATE USER IF NOT EXISTS ${escapedUser}@'localhost' IDENTIFIED BY ${escapedPass}`);
	await conn.query (`ALTER USER ${escapedUser}@'localhost' IDENTIFIED BY ${escapedPass}`);
	await conn.query (`GRANT ALL PRIVILEGES ON \`${safeDbName}\`.* TO ${escapedUser}@'localhost'`);
	await conn.execute ("FLUSH PRIVILEGES");
	await conn.end ();

	if (importSchema && fs.existsSync (importSchema)) {
		output.write (`Importing schema from ${importSchema}...\n`);
		const mysqlArgs = ["-h", "localhost", "-P", "3306", "-u", rootUser, "--database", dbName];
		if (rootPassword) {
			mysqlArgs.push (`-p${rootPassword}`);
		}
		await new Promise ((resolve, reject) => {
			const child = spawn ("mysql", mysqlArgs, {stdio: ["pipe", "inherit", "inherit"]});
			fs.createReadStream (importSchema).pipe (child.stdin);
			child.on ("close", (code) => {
				if (code === 0) {
					resolve ();
				}
				else {
					reject (new Error ("MySQL schema import failed"));
				}
			});
		});
		output.write ("Schema import complete.\n");
	}
	else if (importSchema) {
		output.write (`Schema file ${importSchema} not found, skipping import.\n`);
	}
}

(async function () {
	const args = parseArgs (process.argv.slice (2));
	let interactive = !toBoolean (args ["non-interactive"], false);
	if (toBoolean (args ["interactive"], false)) {
		interactive = true;
	}

	const rl = interactive ? readline.createInterface ({input, output}) : null;
	const ask = async (key, prompt, def="") => {
		if (args [key] !== undefined) {
			return args [key];
		}
		if (!interactive) {
			if (def === undefined) {
				throw new Error (`Missing required option --${key}`);
			}
			return def;
		}
		const suffix = (def === "" || def === undefined) ? "" : ` [${def}]`;
		const answer = await rl.question (`${prompt}${suffix}: `);
		return (answer.trim () === "") ? def : answer.trim ();
	};

	output.write ("\nFeedLand interactive setup\n\n");

	const configPath = path.resolve (args ["config"] || path.join (process.cwd (), "config.json"));
	const port = toNumber (await ask ("port", "Port FeedLand should listen on", "1452"), 1452);
	const websocketEnabled = toBoolean (await ask ("websocket", "Enable websockets?", "yes"), true);
	const websocketPort = toNumber (await ask ("websocket-port", "Websocket port", (port + 10).toString ()), port + 10);
	const baseUrl = await ask ("base-url", "Base URL (include protocol)", `http://localhost:${port}/`);
	const myDomain = await ask ("domain", "Domain + port for requests", `localhost:${port}`);

	const smtpEnabled = toBoolean (await ask ("smtp", "Configure SMTP for email login?", "yes"), true);
	let smtpHost = args ["smtp-host"];
	let smtpPort = args ["smtp-port"] !== undefined ? Number (args ["smtp-port"]) : 587;
	let smtpUsername = args ["smtp-username"];
	let smtpPassword = args ["smtp-password"];
	let mailSender = args ["mail-sender"];
	if (smtpEnabled) {
		smtpHost = smtpHost || await ask ("smtp-host", "SMTP host", "smtp.mailhost.com");
		smtpPort = toNumber (smtpPort || await ask ("smtp-port", "SMTP port", "587"), 587);
		smtpUsername = smtpUsername || await ask ("smtp-username", "SMTP username", "username");
		smtpPassword = smtpPassword || await ask ("smtp-password", "SMTP password", "password");
		mailSender = mailSender || await ask ("mail-sender", "Sender email address", "admin@example.com");
	}
	else {
		mailSender = mailSender || await ask ("mail-sender", "Sender email address", "admin@example.com");
	}

let mysqlHost = await ask ("mysql-host", "MySQL host", "localhost");
let mysqlPort = toNumber (await ask ("mysql-port", "MySQL port", "3306"), 3306);
let mysqlUser = sanitizeIdentifier (await ask ("mysql-user", "MySQL user", "feedland"), "MySQL user");
let mysqlPassword = await ask ("mysql-password", "MySQL password", "password");
let mysqlDatabase = sanitizeIdentifier (await ask ("mysql-database", "MySQL database name", "feedland"), "Database name");
	const mysqlUseSsl = toBoolean (await ask ("mysql-ssl", "Use SSL for MySQL connection?", "no"), false);

	const localMysqlRequested = toBoolean (args ["use-local-mysql"], null);
	const installLocalMysql = toBoolean (args ["install-local-mysql"], false);
	const importSchemaPath = args ["schema"] ? path.resolve (args ["schema"]) : null;
	let runLocalSetup = false;
	if (localMysqlRequested !== null) {
		runLocalSetup = localMysqlRequested;
	}
	else if (mysqlHost === "localhost" || mysqlHost === "127.0.0.1") {
		runLocalSetup = interactive ? toBoolean (await ask ("confirm-local-mysql", "Attempt to configure a local MySQL server automatically?", "yes"), true) : true;
	}

	if (runLocalSetup) {
		const rootUser = args ["mysql-root-user"] || await ask ("mysql-root-user", "Local MySQL root user", "root");
		const rootPassword = args ["mysql-root-password"] || await ask ("mysql-root-password", "Local MySQL root password (leave blank if none)", "");
		let schemaFile = importSchemaPath;
		if (!schemaFile) {
			const candidate = path.resolve (__dirname, "../docs/setup.sql");
			if (fs.existsSync (candidate)) {
				schemaFile = candidate;
			}
			else {
				const alt = path.resolve (__dirname, "../../feedlandInstall/docs/setup.sql");
				if (fs.existsSync (alt)) {
					schemaFile = alt;
				}
			}
		}
		await ensureLocalMysql ({
			interactive,
			install: installLocalMysql,
			rootUser,
			rootPassword,
			dbName: mysqlDatabase,
			dbUser: mysqlUser,
			dbPassword: mysqlPassword,
			importSchema: importSchemaPath ? importSchemaPath : schemaFile
		});
		mysqlHost = "localhost";
		mysqlPort = 3306;
	}

	const enableUserFeeds = toBoolean (await ask ("enable-user-feeds", "Host user feeds and likes?", "no"), false);
	let urlForFeeds = "";
	let s3PathForFeeds = "";
	let s3LikesPath = "";
	let urlNewsProducts = "";
	if (enableUserFeeds) {
		urlForFeeds = await ask ("feeds-url", "URL where generated feeds will be served", "http://data.mydomain.com/feeds/");
		s3PathForFeeds = await ask ("feeds-path", "S3 path for feeds", "/data.mydomain.com/feeds/");
		s3LikesPath = await ask ("likes-path", "S3 path for likes", "/data.mydomain.com/likes/");
		urlNewsProducts = await ask ("news-url", "URL for news products", "http://news.mydomain.com/");
	}

	const githubBackups = toBoolean (await ask ("github", "Configure GitHub backups?", "no"), false);
	let githubConfig = {
		enabled: false,
		username: "",
		password: "",
		repo: "",
		basepath: "backups/",
		committer: {name: "", email: ""},
		message: "."
	};
	if (githubBackups) {
		githubConfig = {
			enabled: true,
			username: await ask ("github-username", "GitHub username"),
			password: await ask ("github-password", "GitHub token/password"),
			repo: await ask ("github-repo", "GitHub repo name", "feedlandServer"),
			basepath: await ask ("github-basepath", "Path inside repo", "backups/"),
			committer: {
				name: await ask ("github-committer-name", "Committer name"),
				email: await ask ("github-committer-email", "Committer email")
			},
			message: await ask ("github-message", "Commit message", "Backup of FeedLand server")
		};
	}

	const defaultConfig = {
		port,
		flWebsocketEnabled: websocketEnabled,
		websocketPort,
		urlWebsocketServerForClient: websocketEnabled ? baseUrl.replace (/^http/, "ws") : "",
		myDomain,
		urlFeedlandApp: baseUrl,
		mailSender,
		confirmEmailSubject: "FeedLand confirmation",
		confirmationExpiresAfter: 86400,
		urlServerForEmail: baseUrl,
		flUseDatabaseForConfirmations: true,
		database: {
			host: mysqlHost,
			port: mysqlPort,
			user: mysqlUser,
			password: mysqlPassword,
			charset: "utf8mb4",
			connectionLimit: 100,
			database: mysqlDatabase,
			debug: false,
			flLogQueries: false,
			flQueueAllRequests: false,
			flUseMySql2: true
		},
		flUseTwitterIdentity: false,
		flEnableNewUsers: true,
		flBackupOnStartup: false,
		flNewsProducts: enableUserFeeds,
		flUserFeeds: enableUserFeeds,
		flLikesFeeds: enableUserFeeds,
		urlForFeeds: enableUserFeeds ? urlForFeeds : "",
		s3PathForFeeds: enableUserFeeds ? s3PathForFeeds : "",
		s3LikesPath: enableUserFeeds ? s3LikesPath : "",
		urlNewsProducts: enableUserFeeds ? urlNewsProducts : "",
		maxRiverItems: 175,
		maxNewFeedSubscriptions: 250,
		flUpdateFeedsInBackground: true,
		minSecsBetwFeedChecks: 15,
		productName: "FeedLand",
		productNameForDisplay: "FeedLand",
		urlServerHomePageSource: "http://scripting.com/code/feedland/home/index.html",
		flUseRiverCache: true,
		ctSecsLifeRiverCache: 300,
		githubBackup: githubConfig
	};

	if (smtpEnabled) {
		defaultConfig.smtpHost = smtpHost;
		defaultConfig.smtpPort = smtpPort;
		defaultConfig.smtpUsername = smtpUsername;
		defaultConfig.smtpPassword = smtpPassword;
	}

	if (mysqlUseSsl) {
		defaultConfig.database.ssl = {rejectUnauthorized: true};
	}

	if (interactive && rl) {
		await rl.question ("\nAbout to write config.json (press Enter to confirm)");
	}
	fs.writeFileSync (configPath, JSON.stringify (defaultConfig, null, "\t") + "\n");
	output.write (`\nWrote ${configPath}.\n`);

	const runNpm = toBoolean (args ["run-npm"], true) && !toBoolean (args ["skip-npm"], false);
	if (runNpm) {
		output.write ("\nRunning npm install...\n");
		await runCommand ("npm", ["install"]);
	}

	if (rl) {
		rl.close ();
	}
	output.write ("\nSetup complete. Review config.json and run 'node feedland.js' when ready.\n");
}) ().catch ((err) => {
	console.error ("Setup failed:", err.message);
	process.exit (1);
});
