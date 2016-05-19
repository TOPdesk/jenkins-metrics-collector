require('chai').should();
require('sinon-bluebird');
const using = require('bluebird').Promise.using;
const rethink = require('./mock-rethink');
const sinon = require('sinon');

const config = require('config');
sinon.stub(config, 'get').withArgs('database.name').returns('test_database');

const persistence = require('../../lib/persistence');

describe('connection', () => {
  beforeEach(() => rethink.prepare());
  afterEach(() => rethink.restore());
  after(() => config.get.restore());

  it('should be closed after use', (done) => {
    const close = rethink.mock.connection.close()
      .once();
    using(persistence.connection(), () => {})
      .finally(() => {
        close.verify();
        done();
      });
  });

  it('should be closed after error', (done) => {
    const error = { message: 'error' };
    const close = rethink.mock.connection.close()
      .once();
    using(persistence.connection(), () => { throw error; })
      .finally(() => {
        close.verify();
        done();
      });
  });

  it('should create database when it does not exists', (done) => {
    const dbCreate = rethink.mock.dbCreate()
      .once()
      .withExactArgs('test_database');
    using(persistence.connection(), () => {})
      .finally(() => {
        dbCreate.verify();
        done();
      });
  });

  it('should not attempt database creation when it does exist', (done) => {
    const dbCreate = rethink.mock.dbCreateWhenExists('test_database')
      .never();
    using(persistence.connection(), () => {})
      .finally(() => {
        dbCreate.verify();
        done();
      });
  });

  it('should create table when it does not exists', (done) => {
    const tableCreate = rethink.mock.database.tableCreate()
      .once()
      .withExactArgs('jenkins_metrics', { primaryKey: 'url' });
    using(persistence.connection(), () => {})
      .finally(() => {
        tableCreate.verify();
        done();
      });
  });

  it('should not attempt table creation when it does exist', (done) => {
    const tableCreate = rethink.mock.database_with_table.tableCreate(['jenkins_metrics'])
      .never();
    using(persistence.connection(), () => {})
      .finally(() => {
        tableCreate.verify();
        done();
      });
  });

  it('should create index when it does not exists', (done) => {
    const indexCreate = rethink.mock.table.indexCreate()
      .once()
      .withExactArgs('jobName');
    using(persistence.connection(), () => {})
      .finally(() => {
        indexCreate.verify();
        done();
      });
  });

  it('should not attempt index creation when it does exist', (done) => {
    const indexCreate = rethink.mock.table_with_index.indexCreate()
      .never();
    using(persistence.connection(), () => {})
      .finally(() => {
        indexCreate.verify();
        done();
      });
  });
});

describe('insert', () => {
  // pending
});

