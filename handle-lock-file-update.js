const { readFile } = require("fs").promises;
const { Octokit } = require("octokit");

run();

const query = `query($commitUrl:URI!) {
  resource(url: $commitUrl) {
    ... on Commit {
      statusCheckRollup {
        state
      }
    }
  }
}
`;

async function run() {
  const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH));

  console.log(`process.env.GITHUB_SHA`);
  console.log(process.env.GITHUB_SHA);

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  const sha = event.commit ? event.commit.sha : event.check_run.head_sha;
  const result = await octokit.graphql(query, {
    commitUrl: `https://github.com/${owner}/${repo}/commit/${sha}`,
  });

  if (
    ["EXPECTED", "PENDING"].includes(result.resource.statusCheckRollup.state)
  ) {
    console.log("Status is pending, exiting.");
    return;
  }

  if (result.resource.statusCheckRollup.state === "SUCCESS") {
    console.log("TODO: SUCCESS! merge the branch and delete it");

    // 1. get `/package-lock.json` from from the
    return;
  }

  console.log(
    "TODO: Status is %s. Create pull request",
    result.resource.statusCheckRollup.state
  );
}
