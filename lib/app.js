const options = require('./cli');
const jenkins = require('./jenkins');
const persistence = require('./persistence');
const using = require('bluebird').Promise.using;

function pollJenkinsAndSaveData() {
  using(persistence.connection(), conn => insertBuildData(conn))
    .then((result) => {
      if (result.inserted > 0) {
        console.log(new Date().toLocaleString(),
          '\tInserted', result.inserted, `new record${result.inserted > 1 ? 's' : ''}`);
      }
      setTimeout(pollJenkinsAndSaveData, options.interval);
    })
    .catch(error => {
      console.error('Error', error);
    });
}

function insertBuildData(conn) {
  return jenkins.getBuildData()
    .then(builds => persistence.insert(conn, builds))
    .catch(error => console.error('Error', error));
}

pollJenkinsAndSaveData();
