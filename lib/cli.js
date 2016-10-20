const cmd = require('commander');
const VERSION = require('../package.json').version;
const DEFAULT_INTERVAL = 60;

cmd
  .version(VERSION)
  .option('-i, --interval <minutes>', 'Polling interval in minutes', parseInt)
  .parse(process.argv);

const options = {
  interval: (cmd.interval || DEFAULT_INTERVAL) * 60 * 1000
};

module.exports = options;
