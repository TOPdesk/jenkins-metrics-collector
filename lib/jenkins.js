const Promise = require('bluebird').Promise;
const request = require('request-promise');
const config = require('config');

const FILTER_PREFIX = 'api/json?tree=';
const BUILD_DETAILS_FILTER = 'id,timestamp,building,duration,result,changeSet[items[rev]],actions';

function getJobData(jobId) {
  const url = createBuildsUrl(jobId);
  return request.get({ url, json: true })
    .then(result => getJobDetails(result))
    .catch(error => ({ error }));
}

function getJobDetails(job) {
  return Promise.map(job.builds, build => {
    const actionFilter = createActionFilter(job.name);
    const detailsUrl = createBuildDetailsUrl(build.url, actionFilter);
    return getBuildDetails(detailsUrl);
  });
}

function getBuildDetails(url) {
  return request.get({ url, json: true })
    .then(result => normalize(result))
    .catch(error => ({ error }));
}

function normalize(details) {
  if (details.building) {
    return {};
  }
  const actions = details.actions.filter(isEmpty);
  const normalized = Object.assign(details, { actions });
  delete normalized.building;
  return normalized;
}

function isEmpty(obj) {
  return obj !== null && Object.keys(obj).length !== 0;
}

function createBuildsUrl(jobId) {
  return `${config.get('jenkins.url')}/job/${jobId}/${FILTER_PREFIX}name,builds[url]`;
}

function createActionFilter(jobId) {
  const filterName = config.get(`jenkins.jobs.${jobId}`);
  return config.get(`jenkins.filters.${filterName}`);
}

function createBuildDetailsUrl(url, actionFilter) {
  return `${url}${FILTER_PREFIX}${BUILD_DETAILS_FILTER}${actionFilter}`;
}

module.exports = {
  getBuildData: () => {
    const jobs = config.get('jenkins.jobs');
    return Promise.map(Object.keys(jobs), job => getJobData(job))
      .then(builds => builds.filter(isEmpty));
  }
};
