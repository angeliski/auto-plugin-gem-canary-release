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
        const current = await auto.getCurrentVersion(lastRelease);
        
        const canaryVersion = `canary-${canaryIdentifier}`;
    
        
        auto.logger.verbose.info(`Successfully published canary version ${canaryVersion}`);
        return canaryVersion;
      }
    );
  }
};