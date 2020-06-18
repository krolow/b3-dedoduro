const slugify = require('slugify');

const URL = 'https://cei.b3.com.br/CEI_Responsivo/negociacao-de-ativos.aspx';

module.exports = async function getAllOperations(page) {
  await page.goto(URL, { waitUntil: 'networkidle2' });

  const brokers = await getBrokers(page);
  const operationsPromises = brokers.map(broker => getOperationsForBroker({ page, broker }));
  const operations = await runSerial(operationsPromises);

  return operations;
}


async function getBrokers(page) {
  const brokers = await page.$$eval('#ctl00_ContentPlaceHolder1_ddlAgentes option', options => {
    return options.map(option => ({
      name: option.innerText.split(' - ').slice(-1).shift(),
      value: option.getAttribute('value')
    })).slice(1);
  });

  return brokers;
}


async function getOperationsForBroker({ page, broker }) {
  await selectBroker({ page, broker });
  const operations = await extractOperations(page);
  return operations.map(operation => ({ ...operation, broker }));
}


async function selectBroker({ page, broker }) {
  const shouldReset = await page.$eval('#ctl00_ContentPlaceHolder1_ddlAgentes', el => el.value);
  if (shouldReset !== '-1') {
    await page.click('#ctl00_ContentPlaceHolder1_btnConsultar');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
  }

  await page.select('#ctl00_ContentPlaceHolder1_ddlAgentes', broker.value);
  await page.waitFor(300);
  await page.click('#ctl00_ContentPlaceHolder1_btnConsultar');
  await page.waitForSelector('#ctl00_ContentPlaceHolder1_rptAgenteBolsa_ctl00_rptContaBolsa_ctl00_pnAtivosNegociados');
}


async function extractOperations(page) {
  const headers = (await page.$$eval('#ctl00_ContentPlaceHolder1_rptAgenteBolsa_ctl00_rptContaBolsa_ctl00_pnAtivosNegociados th', ths => {
    return ths.map(th => th.innerText);
  })).map(text => slugify(text, { lower: true, replacement: '_', remove: /[*+~.()'"!:@\/\\]/g }));

  const operations = await page.$$eval('#ctl00_ContentPlaceHolder1_rptAgenteBolsa_ctl00_rptContaBolsa_ctl00_pnAtivosNegociados tbody td', tds => {
    return tds.map(td => td.innerText);
  });

  let headerIndex = 0;
  let entryCount  = 0;
  return operations.reduce((acc, entry) => {
    if (headerIndex === headers.length) {
      headerIndex = 0;
      entryCount++;
      acc.push({});
    }

    acc[entryCount] = {
      ...acc[entryCount],
      [headers[headerIndex]]: entry
    };

    headerIndex++;

    return acc;
  }, [{}]);
}

function runSerial(funcs) {
  return funcs.reduce((promise, func) =>
    promise.then(result => func.then()),
    Promise.resolve([])
  );
}
