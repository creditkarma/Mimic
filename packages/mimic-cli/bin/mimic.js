#!/usr/bin/env node
process.env.MIMIC_VERSION = require('../package.json').version;
// Require CLI Mimic
const cli = require("../dist/index");
// Parse CLI args
cli.parse(process.argv);
