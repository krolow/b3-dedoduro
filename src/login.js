const URL = 'https://cei.b3.com.br/CEI_Responsivo/';

module.exports = async function login({ page, username, password }) {
  await page.goto(URL, { waitUntil: 'networkidle2' });

  await page.focus('#ctl00_ContentPlaceHolder1_txtLogin')
  await page.keyboard.type(username);

  await page.focus('#ctl00_ContentPlaceHolder1_txtSenha');
  await page.keyboard.type(password);

  await Promise.all([
    page.click('input[type=submit]'),
    page.waitForNavigation({ waitUntil: 'networkidle0' })
  ]);
}
