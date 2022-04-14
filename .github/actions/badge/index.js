const core = require('@actions/core');
const github = require('@actions/github');

// core.info("Github context: " +  JSON.stringify(github.context))

async function run() {
  let payload = github.context.payload;
  const pr = payload.pull_request
  if (!pr) {
    core.info("Not a pull request. Skipping")
    return
  }
  const repo = payload.repository.name;
  const owner = payload.repository.owner.login;
  const pull_number = pr.number;
  const octokit = github.getOctokit(core.getInput('github_token', { required: true }));
  const badge = `[![Coverage Status](https://coveralls.io/repos/github/${owner}/${repo}/badge.svg?branch=${pr.head.ref})](https://coveralls.io/github/${owner}/${repo}?branch=${pr.head.ref})`

  const existingBody = pr.body ? pr.body : '';
  if (existingBody.includes(badge)) {
    core.info("Body already includes badge. Skipping")
  } else {
    const body = `${badge}\n\n${existingBody}`;
    core.info(`Updating ${owner}/${repo}/pulls/${pull_number} with ${body}`);
    const resp = await octokit.rest.pulls.update({
      owner,
      repo,
      pull_number,
      body
    }).catch(error => core.error(error));
  }
}
run();