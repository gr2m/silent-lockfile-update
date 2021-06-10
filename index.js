import { Octokit } from "octokit";
import execa from "execa";

run();

async function run() {
  // const octokit = new Octokit({
  //   auth: process.env.GITHUB_TOKEN,
  // });

  try {
    await command("git checkout update-lockfile");
  } catch (error) {
    if (
      !/pathspec 'update-lockfile' did not match any file/.test(error.stderr)
    ) {
      throw error;
    }

    await command("git checkout -b update-lockfile");
  }

  await command("rm -rf package-lock.json node_modules");
  await command("npm install");
}

async function command(cmd) {
  const [bin, ...cmdOptions] = cmd.split(/\s+/);

  console.log("$ %s", cmd);

  const result = await execa(bin, cmdOptions, { all: true });

  console.log(result.all);

  return result;
}
