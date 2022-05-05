const { refresh_access_token } = require("gmail-tester");
const path = require("path");
const { Inbox } = require("gmail-inbox");

const credentials = path.resolve(__dirname, "credentials.json");
const token = path.resolve(__dirname, "gmailToken.json");

async function get_latest_messages(searchQuery) {
  let messages;
  await refresh_access_token(credentials, token);
  const inbox = new Inbox(credentials, token);
  await inbox.authenticateAccount();
  await inbox.waitTillMessage(searchQuery, false, 10, 120);

  messages = await inbox.getLatestMessages();
  return messages;
}

exports.get_latest_messages = get_latest_messages;