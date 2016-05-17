const cmd = require('commander');
const VERSION = require('../package.json').version;
const DEFAULT_INTERVAL = 15;
const DEFAULT_DAEMONIZE = false;

cmd
  .version(VERSION)
  .option('-d, --daemon', 'Daemonize process')
  .option('-i, --interval <minutes>', 'Polling interval in minutes', parseInt)
  .parse(process.argv);

const options = {
  daemon: cmd.daemon || DEFAULT_DAEMONIZE,
  interval: cmd.interval || DEFAULT_INTERVAL
};

module.exports = options;
