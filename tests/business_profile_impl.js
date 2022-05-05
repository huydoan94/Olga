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
  below,
  waitFor,
} = require("taiko");
const assert = require("assert");
const specStore = gauge.dataStore.specStore;

step("Enter business name and start profile", async function () {
  await write("QA_Business", into(textBox("Enter the name of your business")));
  await click(button("Start profile"));
  assert.equal(
    await text(
      "Continue building your profile to unlock access to more marketplaces and millions of products."
    ).exists(),
    true,
    "Must navigate to business-profile page."
  );
});

step("Start business background", async function () {
  await waitFor(1000);
  await click($(`//div[@to='/business-background']/button`));
});

step("Enter Business Name if empty and continue", async function () {
  if (!(await textBox("Name of your business").value())) {
    await write("QA_Business_Again", into(textBox("Name of your business")));
  }
  await click(button("Continue"));
  assert.equal(
    await text("How can we reach you?").exists(),
    true,
    "Must be navigated to address form."
  );
});

step("Fill business address info and continue", async function () {
  await write("12345678901", into(textBox({ name: "phone" })));
  await write("1301 Shoreway Rd.", into(textBox({ name: "address1" })));
  await write("Suite 200", into(textBox({ name: "address2" })));
  await write("Belmont", into(textBox({ name: "city" })));
  await dropDown({ name: "state" }).select("California");
  await write("94002", into(textBox({ name: "zipCode" })));
  await click(button("Continue"));
  assert.ok(await text("Verify your billing address").exists());
});

step("Use suggested address and continue", async function () {
  await click(button("Use suggested address"));
  assert.ok(await button("Continue").isVisible());
  await click(button("Continue"));
  assert.ok(
    await text("Which of these best represents your business?").exists()
  );
});

step("Select retailer as business type", async function () {
  await click(text("Retailer"));
  await click(button("Continue"));
  assert.ok(
    await text(
      "What kind of merchandise are you looking for? Click all that apply!"
    ).exists()
  );
});

step("Select cell phones as merchandise", async function () {
  await click(text("Cell phones"));
  await click(button("Finish"));
  assert.ok(
    await text(
      "Continue building your profile to unlock access to more marketplaces and millions of products."
    ).exists()
  );
});
