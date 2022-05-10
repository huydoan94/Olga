const RPClient = require("@reportportal/client-javascript");
const fs = require("fs");
const url = require("url");
const { screenshot, waitFor } = require("taiko");
const {
  saveLaunchIdToFile,
  readLaunchesFromFile,
} = require("@reportportal/client-javascript/lib/helpers");
const suiteStore = gauge.dataStore.suiteStore;
const specStore = gauge.dataStore.specStore;
const scenarioStore = gauge.dataStore.scenarioStore;

const client = new RPClient({
  token: process.env.rp_uuid,
  endpoint: process.env.rp_uri,
  launch: process.env.rp_launch_name,
  project: process.env.rp_project,
});

let launch;

beforeSuite(async () => {
  const config = {
    startTime: client.helpers.now(),
    description: process.env.rp_launch_description,
    attributes: [
      {
        key: "build",
        value: "latest",
      },
      {
        value: "UI",
      },
    ],
  };
  let launchObj = client.startLaunch(config);
  suiteStore.put("launch", launchObj);
  launch = suiteStore.get("launch");
  launch.promise.then(
    (response) => {
      if (process.env.autoMergeParallelLaunches.toLowerCase() === "true") {
        saveLaunchIdToFile(response.id);
      }
    },
    (error) => {
      console.dir(`Error at the start of launch: ${error}`);
    }
  );
});
afterSuite(async () => {
  await client.getPromiseFinishAllItems(launch.tempId).then(() => {
    console.log(
      "All report data finished uploading. Launch will be finished now."
    );
  });
  await client
    .finishLaunch(launch.tempId, {
      endTime: client.helpers.now(),
    })
    .promise.then(() => {
      if (process.env.autoMergeParallelLaunches.toLowerCase() === "true") {
        return mergeParallelLaunches();
      } else {
        return Promise.reject(
          "skipped merge request since autoMergeParallelLaunches is false."
        );
      }
    })
    .then((res) => {
      console.log(
        "Finished launch: parallel launches have been merged successfully."
      );
    })
    .catch((err) => {
      console.log("Finished launch: " + err);
    });
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

function mergeParallelLaunches() {
  const launchUUIds = readLaunchesFromFile();
  const params = new url.URLSearchParams({
    "filter.in.uuid": launchUUIds,
  });
  const launchSearchUrl = `launch?${params.toString()}`;
  return client.restClient
    .retrieveSyncAPI(launchSearchUrl, { headers: client.headers })
    .then((response) => {
      const launchesInProgress = response.content.filter(
        (l) => l.status === "IN_PROGRESS"
      );
      if (launchesInProgress.length) {
        return Promise.reject(
          "one or more launches were still IN PROGRESS. Skipped merge request."
        );
      } else {
        deleteLaunchIdFiles();
        return Promise.resolve(response.content.map((l) => l.id));
      }
    })
    .then((launchIds) => {
      if (launchIds.length > 1) {
        const request = client.getMergeLaunchesRequest(launchIds);
        request.description = process.env.rp_launch_description;
        request.extendSuitesDescription = false;
        const mergeURL = "launch/merge";
        return client.restClient.create(mergeURL, request, {
          headers: client.headers,
        });
      } else return Promise.reject("No launches to merge.");
    });
}

function deleteLaunchIdFiles() {
  return fs
    .readdirSync("./")
    .filter((item) => item.includes("rplaunch-"))
    .map((file) =>
      fs.unlinkSync(file, (err) => {
        if (err) {
          throw err;
        }
      })
    );
}

module.exports = { client };
