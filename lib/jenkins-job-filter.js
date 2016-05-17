const Promise = require('bluebird').Promise;

function notEmpty(obj) {
  return obj !== null && Object.keys(obj).length > 0;
}

function notError(obj) {
  return !(obj.hasOwnProperty('error') && Object.keys(obj).length === 1);
}

function completed(obj) {
  return !obj.building;
}

function normalize(details) {
  const trimmed = deleteRecursive(details, '_class');
  delete trimmed.building;

  const actions = details.actions.filter(notEmpty);
  return Object.assign(trimmed, { actions });
}

function deleteRecursive(obj, property) {
  const trimmed = Object.assign(obj);
  delete trimmed[property];
  Object.keys(trimmed).forEach(key => {
    trimmed[key] = (typeof trimmed[key] === 'object')
      ? deleteRecursive(trimmed[key], property)
      : trimmed[key];
  });
  return trimmed;
}


module.exports = {
  filter(buildData) {
    return Promise.filter(buildData, notError)
      .then(build => build.filter(completed))
      .then(build => build.map(normalize));
  }
};
