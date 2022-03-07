#!/usr/bin/env node
const program = require("commander");

program.command("add [tags]", "adds the given tags");
program.command("remove [tags] ", "removes the given tags");
program.command("filter [tags] ", "filter files according to the given tags");

program.parse(process.argv);
