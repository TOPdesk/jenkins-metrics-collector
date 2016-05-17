const Promise = require('bluebird').Promise;
const request = require('request-promise');
const config = require('config');
const jobFilter = require('./jenkins-job-filter');

const FILTER_PREFIX = 'api/json?tree=';
const BUILD_DETAILS_FILTER =
  'url,id,timestamp,building,duration,result,changeSet[items[rev]],actions';

function getJobData(jobName) {
  const url = createBuildsUrl(jobName);
  return request.get({ url, json: true })
    .then(result => getJobDetails(result))
    .catch(error => ({ error }));
}

function getJobDetails(job) {
  return Promise.map(job.builds, build => {
    const actionFilter = createActionFilter(job.name);
    const detailsUrl = createBuildDetailsUrl(build.url, actionFilter);
    return getBuildDetails(job.name, detailsUrl);
  });
}

function getBuildDetails(jobName, url) {
  return request.get({ url, json: true })
    .then(build => Object.assign(build, { jobName }))
    .catch(error => ({ error }));
}

function createBuildsUrl(jobName) {
  return `${config.get('jenkins.url')}/job/${jobName}/${FILTER_PREFIX}name,builds[url]`;
}

function createActionFilter(jobName) {
  const filterName = config.get(`jenkins.jobs.${jobName}`);
  return config.get(`jenkins.filters.${filterName}`);
}

function createBuildDetailsUrl(url, actionFilter) {
  return `${url}${FILTER_PREFIX}${BUILD_DETAILS_FILTER}${actionFilter}`;
}


module.exports = {
  getBuildData: () => {
    const jobs = config.get('jenkins.jobs');
    return Promise.map(Object.keys(jobs), jobName => getJobData(jobName))
      .then(builds => builds.reduce((a, b) => a.concat(b), []))
      .then(builds => jobFilter.filter(builds));
  }
};
