# B-Stock End-to-end Test Automation

---

<a name="tech-stack"></a>

## Tech Stack

- Node.js (Tested with LTS versions: 16.15.0 and 14.19.2)
- Javascript
- Gauge
- Taiko

<a name="installation"></a>

## Installation

```bash
$ git clone git@gitlab.bstock.io:b-stock/code/qa/e2e_test_automation.git
$ cd e2e_test_automation/
$ npm install

```

<a name="testing"></a>

## Testing

- Run tests with default environment

```bash
$ npm run test

```

- Run tests in the Dev environment

```bash
$ npm run test:dev

```

- Run tests in the QA environment

```bash
$ npm run test:qa

```

- Run tests in parallel

```bash
$ npm run test -- -p

```