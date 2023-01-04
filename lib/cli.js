const {parseConnectionOptions} = require('./utils.js');
const pack = require('../package.json');
const yargs = require('yargs');

yargs
  .scriptName('rdb2cryo')
  .usage(
    `rdb2cryo CLI v${pack.version}
Usage:
rdb2cryo clone localhost unit localhost unit2
* this cmd clone a RethinkDB to an other host
`
  )
  .command(
    'clone <srcHost> <srcDb> <dstCryo>',
    `clone a RethinkDB from one host to another host
	`,
    (y) => {
      y.positional('srcHost', {
        describe: 'RethinkDB source host',
      });
      y.positional('srcDb', {
        describe: 'source db name',
      });
      y.positional('dstCryo', {
        describe: 'Cryo destination database',
      });
    },
    (argv) => {
      const sourceDatabase = {
        ...parseConnectionOptions(argv.srcHost),
        db: argv.srcDb,
      };
      const destinationDatabase = argv.dstCryo;

      require('./main.js')(sourceDatabase, destinationDatabase);
    }
  )
  .help()
  .demandCommand(1, '').argv;
