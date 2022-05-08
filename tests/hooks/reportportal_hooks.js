const RPClient = require("@reportportal/client-javascript");
const fs = require("fs");
const url = require("url");
const { screenshot, waitFor } = require("taiko");
const suiteStore = gauge.dataStore.suiteStore;
const specStore = gauge.dataStore.specStore;
const scenarioStore = gauge.dataStore.scenarioStore;

const client = new RPClient({
  token: "b27a62ca-7bd4-4c4e-a63d-3b9b749ebc40",
  endpoint: "http://localhost:8080/api/v1",
  launch: "End-to-end Tests",
  project: "bstock",
});

let launch;

beforeSuite(async () => {
  let launchObj = client.startLaunch({
    startTime: client.helpers.now(),
    description: "BStock functional tests on UI.",
    attributes: [
      {
        key: "build",
        value: "latest",
      },
      {
        value: "UI",
      },
      {
        value: "gauge_e2e_tests",
      },
    ],
  });
  suiteStore.put("launch", launchObj);
  launch = suiteStore.get("launch");
  createMergeLaunchLockFile();
});
afterSuite(async () => {
  client
    .finishLaunch(launch.tempId, {
      endTime: client.helpers.now(),
    })
    .promise.then(() => {})
    .then(() => {
      mergeParallelLaunches();
    });

  client.getPromiseFinishAllItems(launch.tempId).then(() => {});
});

beforeSpec(async (context) => {
  let suiteObj = client.startTestItem(
    {
      description: "",
      name: context.currentSpec.name,
      startTime: client.helpers.now(),
      type: "SUITE",
    },
    launch.tempId
  );
  specStore.put("tempId", suiteObj.tempId);
});

afterSpec(async (context) => {
  client.finishTestItem(specStore.get("tempId"), {
    status: context.currentSpec.isFailed ? "FAILED" : "PASSED",
  });
});

beforeScenario(async (context) => {
  let testObj = client.startTestItem(
    {
      description: "",
      name: context.currentScenario.name,
      startTime: client.helpers.now(),
      type: "STEP",
    },
    launch.tempId,
    specStore.get("tempId")
  );
  scenarioStore.put("tempId", testObj.tempId);
});

afterScenario(async (context) => {
  client.finishTestItem(scenarioStore.get("tempId"), {
    status: context.currentScenario.isFailed ? "FAILED" : "PASSED",
  });
});

beforeStep(async (context) => {
  let stepObj = client.startTestItem(
    {
      description: "",
      name: context.currentStep.step.actualStepText,
      startTime: client.helpers.now(),
      type: "STEP",
      hasStats: false,
    },
    launch.tempId,
    scenarioStore.get("tempId")
  );
  scenarioStore.put("steptempId", stepObj.tempId);
});

afterStep(async (context) => {
  await waitFor(300); // Time for all HTTP responses to arrive
  client.sendLog(
    scenarioStore.get("steptempId"),
    {
      level: "ERROR",
      message: context.currentStep.stackTrace,
      time: client.helpers.now(),
    },
    {
      name: "Screenshot",
      type: "image/png",
      content: await screenshot({ encoding: "base64" }),
    }
  );
  client.sendLog(
    scenarioStore.get("steptempId"),
    {
      level: "INFO",
      message: JSON.stringify(specStore.get("network_logs")),
      time: client.helpers.now(),
    },
    {
      name: "Network logs",
      type: "text/plain",
      content: specStore.get("network_logs").toString(),
    }
  );
  if (context.currentStep.isFailed) {
    client.finishTestItem(scenarioStore.get("steptempId"), {
      status: "FAILED",
    });
  } else {
    client.finishTestItem(scenarioStore.get("steptempId"), {
      status: "PASSED",
    });
  }
  specStore.put("network_logs", { req: {}, res: {} });
});

// =====

async function mergeParallelLaunches() {
  const ciBuildId = "gauge_e2e_tests";
  try {
    // 1. Send request to get all launches with the same CI_BUILD_ID attribute value
    const params = new url.URLSearchParams({
      "filter.has.attributeValue": ciBuildId,
    });
    const launchSearchUrl = `launch?${params.toString()}`;
    const response = await client.restClient.retrieveSyncAPI(launchSearchUrl, {
      headers: client.headers,
    });

    // 2. Filter them to find launches that are in progress
    const launchesInProgress = response.content.filter(
      (l) => l.status === "IN_PROGRESS"
    );
    // 3. If exists, just return
    if (launchesInProgress.length) {
      return;
    }
    // 4. If not, merge all found launches with the same CI_BUILD_ID attribute value
    const lids = fs
      .readdirSync("./")
      .filter((item) => item.includes("rplaunchinprogress"))
      .map((file) => fs.readFileSync(file, "utf-8"));

    const deleted = fs
      .readdirSync("./")
      .filter((item) => item.includes("rplaunchinprogress"))
      .map((file) => fs.unlinkSync(file));

    const launchIds = response.content
      .filter((l) => lids.includes(l.uuid))
      .map((l) => l.id);
    const request = client.getMergeLaunchesRequest(launchIds);
    request.description = "BStock functional tests on UI.";
    request.extendSuitesDescription = false;
    const mergeURL = "launch/merge";
    await client.restClient.create(mergeURL, request, {
      headers: client.headers,
    });
  } catch (err) {
    console.error("Fail to merge launches", err);
  }
}

const createMergeLaunchLockFile = () => {
  const filename = `rplaunchinprogress-${launch.tempId}.json`;
  fs.open(filename, "w", (err) => {
    if (err) {
      throw err;
    }
  });
  launch.promise.then(
    (response) => {
      fs.writeFile(filename, response.id, function (err) {
        if (err) return console.log(err);
      });
    },
    (error) => {
      console.dir(`Error at the start of launch: ${error}`);
    }
  );
};
