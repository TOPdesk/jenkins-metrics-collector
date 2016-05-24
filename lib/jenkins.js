const Promise = require('bluebird').Promise;
const request = require('request-promise');
const config = require('config');
const jobFilter = require('./jenkins-job-filter');

const FILTER_PREFIX = 'api/json?tree=';
const BUILD_DETAILS_FILTER =
  'url,id,timestamp,building,duration,result,changeSet[items[rev]],actions';

function promiseViewResults(views) {
  return Promise.map(Object.keys(views), viewName => getViewJobs(viewName))
    .then(builds => builds.reduce((a, b) => a.concat(b), []))
    .then(builds => builds.reduce((a, b) => a.concat(b), []))
    .then(builds => jobFilter.filter(builds));
}

function promiseJobResults(jobs) {
  return Promise.map(Object.keys(jobs), jobName => getJobData(jobName))
    .then(builds => builds.reduce((a, b) => a.concat(b), []))
    .then(builds => jobFilter.filter(builds));
}

function getViewJobs(viewName) {
  const url = createJobsUrl(viewName);
  const actionFilter = createViewActionFilter(viewName);
  return request.get({ url, json: true })
    .then(result => Promise.map(result.jobs, job => getJobData(job.name, actionFilter)))
    .catch(error => ({ error }));
}

function getJobData(jobName, actionFilter) {
  const url = createBuildsUrl(jobName);
  return request.get({ url, json: true })
    .then(result => getJobDetails(result, actionFilter))
    .catch(error => ({ error }));
}

function getJobDetails(job, actionFilter) {
  return Promise.map(job.builds, build => {
    const url = createBuildDetailsUrl(build.url, actionFilter || createActionFilter(job.name));
    return getBuildDetails(job.name, url);
  });
}

function getBuildDetails(jobName, url) {
  return request.get({ url, json: true })
    .then(build => Object.assign(build, { jobName }))
    .catch(error => ({ error }));
}

function createJobsUrl(viewName) {
  const url = config.get('jenkins.url');
  return `${url}/view/${viewName}/${FILTER_PREFIX}jobs[name]${getExtraArguments()}`;
}

function createBuildsUrl(jobName) {
  const url = config.get('jenkins.url');
  return `${url}/job/${jobName}/${FILTER_PREFIX}name,builds[url]${getExtraArguments()}`;
}

function createActionFilter(jobName) {
  const filterName = config.get(`jenkins.jobs.${jobName}`);
  return config.get(`jenkins.filters.${filterName}`);
}

function createViewActionFilter(viewName) {
  const filterName = config.get(`jenkins.views.${viewName}`);
  return config.get(`jenkins.filters.${filterName}`);
}

function createBuildDetailsUrl(url, actionFilter) {
  return `${url}${FILTER_PREFIX}${BUILD_DETAILS_FILTER}${actionFilter}${getExtraArguments()}`;
}

function getExtraArguments() {
  return config.has('jenkins.extraUrlArguments')
    ? config.get('jenkins.extraUrlArguments')
    : '';
}

module.exports = {
  getBuildData: () => {
    const views = config.get('jenkins.views');
    const viewResults = promiseViewResults(views);

    const jobs = config.get('jenkins.jobs');
    const jobResults = promiseJobResults(jobs);

    return Promise.join(viewResults, jobResults,
      (jobsFromViews, standaloneJobs) => standaloneJobs.concat(jobsFromViews));
  }
};
