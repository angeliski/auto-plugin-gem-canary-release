
const {
  determineNextVersion,
  execPromise,
} = require("@auto-it/core");

const glob = require("fast-glob");

const fs = require("fs");
const { promisify } = require("util");

const readFile = promisify(fs.readFile)

const GEM_PKG_BUILD = /(pkg.*)[^.]/;
const GEM_FINAL_PUBLISH = /pkg\/([\S]+)[.]gem/;
const GEM_SPEC_NAME = /name\s*=\s*["']([\S ]+)["']/;
const loadGemName = async () => {
  const gemspec = glob.sync("*.gemspec")[0];
  let content = await readFile(gemspec, { encoding: "utf8" });

  return content.match(GEM_SPEC_NAME)[1];
}

const makeInstallDetails = (name, canaryVersion) =>
  [
    ":sparkles: Test out this PR via:\n",
    "```bash",
    `gem ${name}, ${canaryVersion}`,
    "```",
  ].join("\n");

module.exports = class TestPlugin {
  constructor() {
    this.name = "gem-canary-release";
  }

  /**
   * Tap into auto plugin points.
   * @param {import('@auto-it/core').default} auto
   */
  apply(auto) {
    auto.hooks.canary.tapPromise(
      this.name,
      async ({ bump, canaryIdentifier, dryRun, quiet }) => {
        const lastRelease = await auto.git.getLatestRelease();

        /** Log the version */
        const logVersion = (version) => {
          if (quiet) {
            console.log(version);
          } else {
            auto.logger.log.info([lastRelease, current, bump, canaryIdentifier])
            auto.logger.log.info(`Would have published: ${version}`);
          }
        };

        const current = await auto.getCurrentVersion(lastRelease);
        const name = await loadGemName();

        const canaryVersion = determineNextVersion(lastRelease, current, bump, canaryIdentifier);

        const finalCanaryVersion = canaryVersion.replace("--", "-")

        if (dryRun) {
          logVersion(finalCanaryVersion);
          return;
        }


        await execPromise("gem", [
          "bump",
          "-v",
          finalCanaryVersion
        ]);

        auto.logger.verbose.info("Bump canary version");

        const buildResult = await execPromise("bundle", [
          "exec",
          "rake",
          "build"
        ]);

        const gemPath = GEM_PKG_BUILD.exec(buildResult)[0]

        auto.logger.verbose.info("Build gem");

        auto.logger.verbose.info(gemPath);

        await execPromise("gem", [
          "push",
          `${gemPath}`
        ]);

        const publishedGem = gemPath.match(GEM_FINAL_PUBLISH)[1]

        auto.logger.verbose.info("Successfully published canary version");

        return {
          newVersion: publishedGem,
          details: makeInstallDetails(name, publishedGem),
        };
      }
    );

  }
};