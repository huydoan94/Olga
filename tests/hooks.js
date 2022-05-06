/* globals gauge*/
"use strict";
const path = require("path");
const {
  openBrowser,
  closeBrowser,
  screenshot,
  client,
  waitFor,
  screencast,
  deleteCookies,
} = require("taiko");
const headless = process.env.headless_chrome.toLowerCase() === "true";
const specStore = gauge.dataStore.specStore;
const reporter = require("./utils/reportPortal").reporter;

beforeSuite(async () => {
  await openBrowser({
    headless: headless,
  });
  const protocol = client();
  const { Network } = protocol;
  const types = ["XHR", "Fetch"];

  // specStore.put("network_logs", { req: {}, res: {} });

  Network.requestWillBeSent(async (params) => {
    if (types.includes(params.type)) {
      const req = {
        [params.requestId]: params.request,
      };
      let logs = specStore.get("network_logs");
      logs.req[params.requestId] = params.request;
      specStore.put("network_logs", logs);
    }
  });
  Network.responseReceived(async (params) => {
    if (types.includes(params.type)) {
      const res = {
        [params.requestId]: params.response,
      };
      let logs = specStore.get("network_logs");
      logs.res[params.requestId] = params.response;
      specStore.put("network_logs", logs);
    }
  });
});

beforeSpec(async () => {
  specStore.put("network_logs", { req: {}, res: {} });
});

afterSpec(async () => {
  await deleteCookies();
});

afterStep(async (context) => {
  await waitFor(300); // Time for all HTTP responses to arrive
  if (context.currentStep.isFailed) {
    gauge.message(JSON.stringify(specStore.get("network_logs")));
  }
  specStore.put("network_logs", { req: {}, res: {} });
});

afterSuite(async () => {
  await closeBrowser();
});

// beforeScenario(async () => {
//   await screencast.startScreencast("output.gif");
// });

// afterScenario(async () => {
//   await screencast.stopScreencast();
// });

// Return a screenshot file name
gauge.customScreenshotWriter = async function () {
  const screenshotFilePath = path.join(
    process.env["gauge_screenshots_dir"],
    `screenshot-${process.hrtime.bigint()}.png`
  );

  await screenshot({
    path: screenshotFilePath,
  });
  return path.basename(screenshotFilePath);
};
