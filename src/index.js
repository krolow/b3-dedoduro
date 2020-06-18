const puppeteer = require('puppeteer');

const login = require('./login');
const getAllOperations = require('./operations');


module.exports =  async function start({ username, password, year, debug }) {
  const browser = await puppeteer.launch(getLaunchOptions(debug));
  const page = await browser.newPage();

  await login({ page, username, password });
  const operations = await getAllOperations(page);

  console.log(operations);

  await browser.close();
}

function getLaunchOptions(debug) {
  if (debug) {
    return {
      headless: false,
      slowMo: 10
    };
  }

  return undefined;
}
