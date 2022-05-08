"use strict";
const {
  write,
  goto,
  click,
  link,
  text,
  textBox,
  button,
  dropDown,
  into,
  $,
  screencast,
  waitFor,
  image,
} = require("taiko");
const assert = require("assert");
const { randomInt } = require("crypto");
const get_latest_messages = require("./utils/gmailApi");
const specStore = gauge.dataStore.specStore;

step("Go to account portal", async function () {
  await goto("https://bstock-dev.com/");
  assert.equal(
    await text("Maintenance page").exists(),
    true,
    "Maintenance page should be displayed."
  );
});

step("Navigate to Registration flow", async function () {
  await click(link("Signup"));
  assert.equal(
    await text("Welcome!").exists(),
    true,
    "Signup page should be displayed."
  );
});

step("Enter email id and start", async function () {
  const register_email = `qa.bstock+${Date.now()}@gmail.com`;
  await write(register_email, into(textBox("Email Address")));
  specStore.put("register_email", register_email);
  await click(button("Start"));

  assert.equal(
    await text("Help us get to know you better").exists(),
    true,
    "Next page with title 'Help us get to know you better' must be displayed."
  );
});

step(
  "Verify code is sent from: <from> with subject: <sub> and message: <msg>",
  async function (from, sub, msg) {
    const currentMessages = await get_latest_messages(
      specStore.get("register_email")
    );
    let received_email;
    for (let step = 0; step < 5; step++) {
      if (currentMessages[step].to == specStore.get("register_email")) {
        received_email = currentMessages[step];
        break;
      }
    }
    assert.equal(!received_email, false, "Verification email not found.");
    assert.equal(received_email.subject, sub);
    assert.equal(received_email.from, from);
    assert.equal(received_email.body.text.toString().includes(msg), true);

    const message = JSON.parse(received_email.body.text.toString());
    specStore.put("verify_code", message.code);
  }
);

step("Submit Business Info as following <table>", async function (table) {
  let country;
  table.rows.forEach((row) => {
    let key = row.cells[0];
    let value = row.cells[1];
    switch (key.toLowerCase()) {
      case "country":
        country = value;
        break;
    }
  });
  await dropDown({ name: "country" }).select(country);
  await write(
    randomInt(11, 99) + "-" + randomInt(1111111, 9999999),
    into(textBox({ name: "brid" }))
  );
  await click(button("Continue"));
});

step("Submit verification code", async function () {
  const verify_code = specStore.get("verify_code").toString();
  await write(verify_code, into(textBox("Verification code")));
  await click(button("Continue"));
});

step("Submit Account Info as following <table>", async function (table) {
  let firstname, lastname, phone;
  table.rows.forEach((row) => {
    let key = row.cells[0];
    let value = row.cells[1];
    switch (key.toLowerCase()) {
      case "first name":
        firstname = value;
        break;
      case "last name":
        lastname = value;
        break;
      case "phone":
        phone = value;
        break;
    }
  });
  await write(firstname, into(textBox({ name: "firstName" })));
  await write(lastname, into(textBox({ name: "lastName" })));
  await write(phone, into(textBox({ name: "phone" })));
  await click(button("Continue"));
});

step("Create a password for created account", async function () {
  const password = "P@ssword-" + randomInt(11111, 99999);
  await write(password, into(textBox({ name: "password" })));
  specStore.put("password", password);

  assert.equal(
    await $(
      `//div[contains(@class, 'SubmitDiv-glhiYG')]/button[contains(@class, 'SubmitButton-iOarNe')]`
    ).isDisabled(),
    false,
    "Create button must be enabled after valid password is entered."
  );
  await click(
    $(
      `//div[contains(@class, 'SubmitDiv-glhiYG')]/button[contains(@class, 'SubmitButton-iOarNe')]`
    )
  );

  assert.equal(
    await $(
      `//div[contains(@class,'Error__StyledAlert')]/following-sibling::p`
    ).text(),
    "This password looks good! Save to finish changing the password!",
    "Password validation message mismatch."
  );
  await click(
    $(
      `//div[contains(@class, 'SubmitDiv-glhiYG')]/button[contains(@class, 'SubmitButton-iOarNe')]`
    )
  );
  assert.equal(
    await image("FusionAuth").exists(),
    true,
    "Fusion auth login page must be displayed."
  );
});

step("Login with saved email and password", async function () {
  const register_email = specStore.get("register_email");
  const password = specStore.get("password");
  await write(register_email, into(textBox({ id: "loginId" })));
  await write(password, into(textBox({ id: "password" })));
  await click(button("Submit"));
  assert.equal(
    await text("Let's create your buyer profile").exists(),
    true,
    "Create profile page must be displayed after login."
  );
});

step(
  "Verify Greeting text displayed after signed in successfully",
  async function () {
    assert.equal(
      await text("Hello").exists(),
      true,
      "Greeting text must be displayed after user has successfully logged in."
    );
  }
);
