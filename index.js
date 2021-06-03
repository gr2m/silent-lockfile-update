import { App, Octokit } from "octokit";
import dotenv from "dotenv";

dotenv.config();

const app = new App({
  appId: process.env.APP_ID,
  privateKey: process.env.PRIVATE_KEY,
});

const { data: appInfo } = await app.octokit.request("GET /app");
console.log("Authenticated as %s app", appInfo.slug);

app.eachRepository(async ({ octokit, repository }) => {
  console.log("Sending requests to %s", repository.full_name);

  const randomName = "test-" + Date.now();

  // https://developer.github.com/v3/repos/commits/#list-commits-on-a-repository
  const {
    data: [latestCommit],
  } = await octokit.rest.repos.listCommits({
    owner: repository.owner.login,
    repo: repository.name,
    sha: repository.default_branch,
    per_page: 1,
  });

  await octokit.rest.git.createRef({
    owner: repository.owner.login,
    repo: repository.name,
    sha: latestCommit.sha,
    ref: `refs/heads/${randomName}`,
  });

  console.log("%s branch created", randomName);

  const { data: newFile } = await octokit.rest.repos.createOrUpdateFileContents(
    {
      owner: repository.owner.login,
      repo: repository.name,
      path: `${randomName}.txt`,
      content: Buffer.from("hello world").toString("base64"),
      message: "creating test file",
      branch: randomName,
    }
  );

  console.log("%s created via %s", randomName, newFile.commit.html_url);

  // NOTE: this will fail due to branch protection
  // await octokit.rest.repos.merge({
  //   owner: repository.owner.login,
  //   repo: repository.name,
  //   base: repository.default_branch,
  //   head: randomName,
  //   head: "test-1622752252981",
  // });

  // NOTE: need to authenticate as a repository admin
  const gr2mOctokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  await gr2mOctokit.rest.repos.merge({
    owner: repository.owner.login,
    repo: repository.name,
    base: repository.default_branch,
    head: randomName,
    // disable retries in case of 409 error
    request: { retries: 0 },
  });

  console.log("Branch merged");
});
