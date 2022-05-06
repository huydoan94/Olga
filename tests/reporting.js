// let RPClient = require("@reportportal/client-javascript");

// let rpClient = new RPClient({
//   token: "b27a62ca-7bd4-4c4e-a63d-3b9b749ebc40",
//   endpoint: "http://localhost:8080/",
//   launch: "superadmin_TEST_EXAMPLE",
//   project: "bstock",
// });

// rpClient.checkConnect().then(
//   (response) => {
//     console.log("You have successfully connected to the server.");
//     console.log(`You are using an account: ${response.fullName}`);
//   },
//   (error) => {
//     console.log("Error connection to server");
//     console.dir(error);
//   }
// );

// let launchObj = rpClient.startLaunch({
//     name: "Client test",
//     startTime: rpClient.helpers.now(),
//     description: "description of the launch",
//     attributes: [
//         {
//             "key": "yourKey",
//             "value": "yourValue"
//         },
//         {
//             "value": "yourValue"
//         }
//     ],
//     //this param used only when you need client to send data into the existing launch
//     id: 'id'
// });
// console.log(launchObj.tempId);
