const path = require('path');
process.env.XCRAFT_ROOT = path.resolve(__dirname, '..');

const r = require('rethinkdb');
const Cryo = require('xcraft-core-cryo');
const watt = require('gigawatts');

/*************************** Helper functions ***************************/

const getTableList = watt(function* (conn, next) {
  const q = r.tableList();
  return yield q.run(conn, next);
});

/************************************************************************/

module.exports = watt(function* (sourceDatabase, destinationDatabase, next) {
  console.log('Connecting source db...');
  const connSDB = yield r.connect(sourceDatabase, next);
  console.log('Source db connected!');

  const cryo = new Cryo(destinationDatabase);

  // Get table list
  const srcTableList = yield getTableList(connSDB, next);

  // Number of tables copied
  let i = 0;

  const resp = {
    log: {
      verb: console.log,
      info: console.log,
      warn: console.error,
      err: console.error,
      dbg: console.log,
    },
  };
  const msg = {
    data: {
      db: sourceDatabase.db,
      action: null,
      rules: {
        mode: 'all',
        db: null,
      },
    },
  };

  // Insert rows
  for (let table of srcTableList) {
    let rowsInserted = 0;
    console.log(`Start copying table "${table}"...`);
    const q = r.table(table);
    let cursor = yield q.run(connSDB, next);
    let err;

    cryo.begin(resp, msg);

    do {
      // Batch 10000 records by 10000 records
      if (rowsInserted > 0 && rowsInserted % 10000 === 0) {
        cryo.commit(resp, msg);
        console.log(`→ ${rowsInserted}`);
        cryo.begin(resp, msg);
      }
      try {
        const state = yield cursor.next(next);
        const type = state.id.split('@', 1)[0];
        const id = state.id;
        const meta = {
          _goblinCaller: 'rdb2cryo',
          _goblinInCreate: false,
          id,
        };

        const _msg = Object.assign({}, msg);
        _msg.data.action = {
          meta,
          payload: {
            db: sourceDatabase.db,
            meta,
            state,
          },
          type: 'persist',
        };
        _msg.data.rules.db = `${type}-${id}`;

        cryo.freeze(resp, _msg);
        ++rowsInserted;
      } catch (e) {
        err = e;
        if (e.msg !== 'No more rows in the cursor.') {
          throw e;
        }
      }
    } while (!err);

    cryo.commit(resp, msg);

    i++;
    console.log(
      `Copy of table "${table}" finished | number of rows inserted: ${rowsInserted} | table ${i}/${srcTableList.length}`
    );
  }

  console.log('All tables have been copied! Disconnecting from source db ...');

  connSDB.removeAllListeners();
  yield connSDB.close({noreplyWait: true}, next);
  cryo.close();

  console.log('Disconnected!');
});
