import {
    Auto,
    IPlugin,
  } from "@auto-it/core";

export default class GemCanaryReleasePlugin implements IPlugin {
  name = "gem-canary-release";

  /** Tap into auto plugin points. */
  apply(auto: Auto) {
    auto.hooks.canary.tapPromise(
        this.name,
        async ({ bump, canaryIdentifier, dryRun, quiet }) => {
          const lastRelease = await auto.git!.getLatestRelease();
          const current = await auto.getCurrentVersion(lastRelease);
          
          const canaryVersion = `canary-${canaryIdentifier}`;
      
          
          auto.logger.verbose.info(`Successfully published canary version ${canaryVersion}`);
          return canaryVersion;
        }
      );

  }
}