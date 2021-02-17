import testWithSpectron from 'vue-cli-plugin-electron-builder/lib/testWithSpectron';
import { expect } from 'chai';
const spectron = __non_webpack_require__('spectron');

describe('Application launch', function () {
  this.timeout(120000);

  beforeEach(async function () {
    const instance = await testWithSpectron(spectron)
    this.app = instance.app;
    this.stopServe = instance.stopServe;
  });

  afterEach(function () {
    if (this.app && this.app.isRunning()) {
      return this.app.mainProcess.exit(0);
    }
  });

  it('opens a window', async function () {
    await this.app.client.waitUntilWindowLoaded();
    expect(await this.app.client.getWindowCount()).to.be.at.least(2);
    expect(await this.app.browserWindow.isMinimized()).to.be.false;
    expect(await this.app.browserWindow.isVisible()).to.be.true;
    const { width, height } = await this.app.browserWindow.getBounds();
    expect(width).to.be.above(0);
    expect(height).to.be.above(0);
  });

});
      