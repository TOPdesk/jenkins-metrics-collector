const rethink = require('rethinkdb');
const sinon = require('sinon');


const connectionStub = {
  close: sinon.stub()
};

function prepare() {
  sinon.stub(rethink, 'connect').resolves(connectionStub);
  sinon.stub(rethink, 'db').returns(createDatabaseStub());
  sinon.stub(rethink, 'dbList').returns(createRunnable([]));
  sinon.stub(rethink, 'dbCreate').returns(createRunnable());
}

function restore() {
  rethink.connect.restore();
  rethink.db.restore();
  rethink.dbList.restore();
  rethink.dbCreate.restore();
}

function createDatabaseStub() {
  return {
    table: () => createTableStub(),
    tableList: () => createRunnable([]),
    tableCreate: () => createRunnable()
  };
}

function createTableStub() {
  return {
    indexWait: () => createRunnable(),
    indexCreate: () => createRunnable(),
    indexList: () => createRunnable([]),
    insert: () => createRunnable()
  };
}

function createRunnable(result) {
  return {
    run: sinon.stub().resolves(result)
  };
}

module.exports = {
  prepare,
  restore,
  test: {
    connection: () => connectionStub
  },
  mock: {
    table: {
      indexCreate: () => {
        const table = sinon.mock(createTableStub());
        const database = Object.assign(createDatabaseStub(), { table: () => table.object });
        rethink.db.restore();
        sinon.stub(rethink, 'db').returns(database);
        return table
          .expects('indexCreate')
          .returns(createRunnable());
      },
      indexWait: () => {
        const table = sinon.mock(createTableStub());
        const database = Object.assign(createDatabaseStub(), { table: () => table.object });
        rethink.db.restore();
        sinon.stub(rethink, 'db').returns(database);
        return table
          .expects('indexWait')
          .returns(createRunnable());
      },
      insert: () => {
        const table = sinon.mock(createTableStub());
        const database = Object.assign(createDatabaseStub(), { table: () => table.object });
        rethink.db.restore();
        sinon.stub(rethink, 'db').returns(database);
        return table
          .expects('insert')
          .returns(createRunnable());
      }
    },
    table_with_index: {
      indexCreate: () => {
        const table = sinon.mock(Object.assign(createTableStub(),
          { indexList: () => createRunnable(['jobName']) }));
        const database = Object.assign(createDatabaseStub(), {
          table: () => table.object,
          tableList: () => createRunnable(['jenkins_metrics'])
        });
        rethink.db.restore();
        sinon.stub(rethink, 'db').returns(database);
        return table
          .expects('indexCreate')
          .returns(createRunnable());
      },
      indexWait: () => {
        const table = sinon.mock(Object.assign(createTableStub(),
          { indexList: () => createRunnable(['jobName']) }));
        const database = Object.assign(createDatabaseStub(), {
          table: () => table.object,
          tableList: () => createRunnable(['jenkins_metrics'])
        });
        rethink.db.restore();
        sinon.stub(rethink, 'db').returns(database);
        return table
          .expects('indexWait')
          .returns(createRunnable());
      }
    },
    dbCreate: () => {
      rethink.dbCreate.restore();
      const mockRethink = sinon.mock(rethink);
      return mockRethink
        .expects('dbCreate')
        .returns(createRunnable());
    },
    dbCreateWhenExists: (dbName) => {
      rethink.dbCreate.restore();
      rethink.dbList.restore();
      sinon.stub(rethink, 'dbList').returns(createRunnable([dbName]));
      const mockRethink = sinon.mock(rethink);
      return mockRethink
        .expects('dbCreate')
        .returns(createRunnable());
    },
    database: {
      tableCreate: () => {
        const database = sinon.mock(createDatabaseStub());
        rethink.db.restore();
        sinon.stub(rethink, 'db').returns(database.object);
        return database
          .expects('tableCreate')
          .returns(createRunnable());
      }
    },
    database_with_table: {
      tableCreate: () => {
        const database = sinon.mock(Object.assign(createDatabaseStub(),
          { tableList: () => createRunnable(['jenkins_metrics']) }));
        rethink.db.restore();
        sinon.stub(rethink, 'db').returns(database.object);
        return database
          .expects('tableCreate')
          .returns(createRunnable());
      }
    },
    connection: {
      close: () => {
        const close = sinon.mock();
        rethink.connect.restore();
        sinon.stub(rethink, 'connect').resolves({ close });
        return close;
      }
    }
  }
};
