import execa from "execa";

run();

async function run() {
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

  const result = await command("git diff --name-only");

  if (!/package-lock.json/.test(result)) {
    console.log("no changes");
    process.exit(0);
  }
}

async function command(cmd) {
  const [bin, ...cmdOptions] = cmd.split(/\s+/);

  console.log("$ %s", cmd);

  const result = await execa(bin, cmdOptions, { all: true });

  console.log(result.all);

  return result;
}
