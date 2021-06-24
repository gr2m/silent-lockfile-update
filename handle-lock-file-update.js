const { readFile } = require("fs").promises;

const { Octokit } = require("octokit");
const {
  createOrUpdateTextFile,
} = require("@octokit/plugin-create-or-update-text-file");

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

const MyOctokit = Octokit.plugin(createOrUpdateTextFile);

async function run() {
  const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH));
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");

  if (process.env.GITHUB_EVENT_NAME === "check_run") {
    if (event.check_run.check_suite.head_branch !== "update-lockfile") {
      console.log(
        "Check run was not created on update-lockfile branch but from %s",
        check_run.check_suite.head_branch
      );
      process.exit();
    }
  } else {
    const branchNames = event.branches.map((branch) => branch.name);
    if (!branchNames.includes("update-lockfile")) {
      console.log(
        "Status was not created on update-lockfile branch, but on %j",
        branchNames
      );
      process.exit();
    }
  }

  const octokit = new MyOctokit({
    auth: process.env.GITHUB_TOKEN,
  });

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
    // get current content of `package-lock.json` file from `update-lockfile` branch
    const { data: content } = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      {
        owner,
        repo,
        path: "package-lock.json",
        ref: "update-lockfile",
        mediaType: {
          format: "raw",
        },
      }
    );

    // update `package-lock.json` in default branch
    await octokit.createOrUpdateTextFile({
      owner,
      repo,
      path: "package-lock.json",
      content,
      message: "build(deps): lockfile update",
    });

    console.log("package-lock.json updated in default branch");

    // delete `update-lockfile` branch
    await octokit.request("DELETE /repos/{owner}/{repo}/git/refs/{ref}", {
      owner,
      repo,
      ref: `heads/update-lockfile`,
    });

    console.log("update-lockfile branch deleted");

    return;
  }

  console.log("Combined status is %s", result.resource.statusCheckRollup.state);

  const {
    data: [pr],
  } = await octokit.request("GET /repos/{owner}/{repo}/pulls", {
    owner,
    repo,
    head: "gr2m:update-lockfile",
  });

  if (pr) {
    console.log("Pull request already exists: %s", pr.html_url);
    process.exit();
  }

  await octokit.request("POST /repos/{owner}/{repo}/pulls", {
    owner,
    repo,
    head: update - lockfile,
    base: event.repository.default_branch,
    title: "🚨 An update to package-lock.json caused the CI to fail",
  });
}
