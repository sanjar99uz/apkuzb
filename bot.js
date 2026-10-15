
log('Saytga kirish boshlandi...');

let response;

try {
  response = await mainPage.goto(TARGET_URL, {
    waitUntil: 'domcontentloaded',
    timeout: PAGE_TIMEOUT,
  });
} catch (error) {
  log('NAVIGATION ERROR:', error.message);
}

if (response) {
  const status = response.status();

  log('HTTP STATUS:', String(status));
  log('RESPONSE URL:', response.url());

  if (status === 429) {
    log(
      'SERVER 429 qaytardi. So‘rovlar cheklangan. ' +
      'Bot to‘xtatiladi; qayta urinish amalga oshirilmaydi.'
    );

    await saveScreenshot(mainPage, SCREENSHOTS.before);
    return;
  }

  if (status >= 400) {
    log('SERVER ERROR:', String(status));
    await saveScreenshot(mainPage, SCREENSHOTS.before);
    return;
  }
}

await waitForVisiblePage(mainPage);
log('BIRINCHI SAHIFA URL:', mainPage.url());
await saveScreenshot(mainPage, SCREENSHOTS.before);
