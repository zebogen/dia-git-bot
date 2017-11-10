async function addTrackerLink(context) {
  const result = await context.github.pullRequests.getCommits(context.issue());
  const targetCommit = result.data.find((commit) => commit.commit.message.match(/\[Finishes #(\d+)\]/));
  if (targetCommit) {
    console.log('delivery commit found: ', targetCommit.commit.message);
    const issueNum = targetCommit.commit.message.match(/\[Finishes #(\d+)\]/)[1];
    const link = `https://www.pivotaltracker.com/story/show/${issueNum}`;
    const existingBody = context.payload.pull_request.body;
    const params = context.issue({ body: `${existingBody}\n\n Tracker link (autoadded by dia-git-bot): ${link}` });
    context.github.pullRequests.update(params);
  }
}

async function autoMergeBackFromProduction(context) {
  const pull = context.payload.pull_request;
  if (pull.merged && pull.base.ref === 'production' && pull.head.ref === 'master') {
    context.github.repos.merge({ ...context.issue(), head: 'production', base: 'master' });
  }
}

module.exports = (robot) => {
  robot.on('pull_request.opened', async context => {
    console.log('pull request opened');
    addTrackerLink(context);
  });

  robot.on('pull_request.closed', async context => {
    autoMergeBackFromProduction(context);
  });
}