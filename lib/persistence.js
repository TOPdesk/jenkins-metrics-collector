const config = require('config');
const rethink = require('rethinkdb');

const DATABASE_NAME = config.get('database.name').toString();
const TABLE_NAME = 'jenkins_metrics';
const INDEX_NAME = 'jobName';

function connection() {
  return rethink.connect(config.get('database'))
    .then(conn => ensureDatabase(conn)
        .catch(error => {
          connectionDisposer(conn);
          throw error;
        }))
    .disposer(connectionDisposer);
}

function ensureDatabase(conn) {
  return rethink.dbList()
    .run(conn)
    .then(databases => ((databases.indexOf(DATABASE_NAME) !== -1)
        ? ensureTable(conn)
        : createDatabase(conn)));
}

function createDatabase(conn) {
  return rethink.dbCreate(DATABASE_NAME)
    .run(conn)
    .then(() => ensureTable(conn));
}

function ensureTable(conn) {
  return getDb()
    .tableList()
    .run(conn)
    .then(tables =>
      ((tables.indexOf(TABLE_NAME) !== -1)
          ? ensureIndex(conn)
          : createTable(conn)));
}

function ensureIndex(conn) {
  return getTable()
    .indexList()
    .run(conn)
    .then(indexes => ((indexes.indexOf(INDEX_NAME) !== -1)
        ? waitForIndex(conn)
        : createIndex(conn)));
}

function createTable(conn) {
  return getDb()
    .tableCreate(TABLE_NAME)
      .run(conn)
      .then(() => createIndex(conn));
}

function createIndex(conn) {
  return getDb()
    .table(TABLE_NAME)
    .indexCreate(INDEX_NAME)
    .run(conn)
    .then(() => waitForIndex(conn));
}

function waitForIndex(conn) {
  return getTable()
    .indexWait(INDEX_NAME)
    .run(conn)
    .then(() => conn);
}

function connectionDisposer(conn) {
  if (conn) {
    try {
      conn.close();
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  }
}

function getTable() {
  return getDb().table(TABLE_NAME);
}

function getDb() {
  return rethink.db(DATABASE_NAME);
}


module.exports = {
  connection
};
