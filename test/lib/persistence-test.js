const chai = require('chai')
chai.should();
chai.use(require('chai-as-promised'));
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

  it('should be closed after use', () => {
    const close = rethink.mock.connection.close()
      .once();
    return using(persistence.connection(), () => {})
      .finally(() => close.verify());
  });

  it('should be closed after error', () => {
    const error = { message: 'error' };
    const close = rethink.mock.connection.close()
      .once();
    return using(persistence.connection(), () => { throw error; })
      .finally(() => close.verify())
      .should.be.rejectedWith('error');
  });

  it('should create database when it does not exists', () => {
    const dbCreate = rethink.mock.dbCreate()
      .once()
      .withExactArgs('test_database');
    return using(persistence.connection(), (conn) => {
      conn.should.equal(rethink.test.connection());
    }).finally(() => dbCreate.verify());
  });

  it('should not attempt database creation when it does exist', () => {
    const dbCreate = rethink.mock.dbCreateWhenExists('test_database')
      .never();
    return using(persistence.connection(), (conn) => {
      conn.should.equal(rethink.test.connection());
    }).finally(() => dbCreate.verify());
  });

  it('should create table when it does not exists', () => {
    const tableCreate = rethink.mock.database.tableCreate()
      .once()
      .withExactArgs('jenkins_metrics', { primaryKey: 'url' });
    return using(persistence.connection(), (conn) => {
      conn.should.equal(rethink.test.connection());
    }).finally(() => {
      tableCreate.verify();
    });
  });

  it('should not attempt table creation when it does exist', () => {
    const tableCreate = rethink.mock.database_with_table.tableCreate(['jenkins_metrics'])
      .never();
    return using(persistence.connection(), (conn) => {
      conn.should.equal(rethink.test.connection());
    }).finally(() => tableCreate.verify());
  });

  it('should create index when it does not exists', () => {
    const indexCreate = rethink.mock.table.indexCreate()
      .once()
      .withExactArgs('jobName');
    return using(persistence.connection(), (conn) => {
      conn.should.equal(rethink.test.connection());
    }).finally(() => indexCreate.verify());
  });

  it('should not attempt index creation when it does exist', () => {
    const indexCreate = rethink.mock.table_with_index.indexCreate()
      .never();
    return using(persistence.connection(), (conn) => {
      conn.should.equal(rethink.test.connection());
    }).finally(() => indexCreate.verify());
  });

  it('should wait for indexes when they exist', () => {
    const indexWait = rethink.mock.table_with_index.indexWait()
      .once();
    return using(persistence.connection(), (conn) => {
      conn.should.equal(rethink.test.connection());
    }).finally(() => indexWait.verify());
  });

  it('should wait for indexes when they just being created', () => {
    const indexWait = rethink.mock.table.indexWait()
      .once();
    return using(persistence.connection(), (conn) => {
      conn.should.equal(rethink.test.connection());
    }).finally(() => indexWait.verify());
  });

});

describe('insert', () => {
  // pending
});

