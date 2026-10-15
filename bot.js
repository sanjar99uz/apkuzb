
'use strict';

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const TARGET_URL =
  'https://promo-bot-ucad.onrender.com/r/JT_suzcNFZWTL8QfPWCD6Q';

const OUTPUT_DIR = path.join(process.cwd(), 'screenshots');
const BUTTON_TEXT = 'Нафақа ёшига етмаган фуқаро';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let browser;
let context;
let logStream;

function log(...args) {
  const message = `[${new Date().toISOString()}] ${args.join(' ')}`;
  console.log(message);
  if (logStream) logStream.write(message + '\n');
}

async function screenshot(page, filename) {
  const file = path.join(OUTPUT_DIR, filename);

  try {
    if (!page || page.isClosed()) {
      log('Skrinshot uchun sahifa mavjud emas:', filename);
      return false;
    }

    await page.screenshot({
      path: file,
      fullPage: true,
      type: 'png'
    });

    log('SKRINSHOT SAQLANDI:', file);
    return true;
  } catch (error) {
    log('SKRINSHOT XATOSI:', filename, error.message);
    return false;
  }
}

async function findButton(page) {
  const selectors = [
    'button',
    'a',
    '[role="button"]',
    'input[type="button"]',
    'input[type="submit"]'
  ];

  for (const selector of selectors) {
    const elements = await page.$$(selector);

    for (const element of elements) {
      try {
        const info = await element.evaluate(el => {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);

          return {
            text: (
              el.innerText ||
              el.textContent ||
              el.value ||
              ''
            ).replace(/\s+/g, ' ').trim(),
            visible:
              rect.width > 0 &&
              rect.height > 0 &&
              style.display !== 'none' &&
              style.visibility !== 'hidden',
            disabled: Boolean(el.disabled)
          };
        });

        if (
          info.visible &&
          !info.disabled &&
          info.text.includes(BUTTON_TEXT)
        ) {
          log('KERAKLI TUGMA TOPILDI:', info.text);
          return element;
        }
      } catch (_) {
        // Element DOM dan o'chirilgan bo'lishi mumkin.
      }
    }
  }

  return null;
}

async function findInstallButton(page) {
  return page.evaluateHandle(() => {
    const labels = [
      'install',
      'o‘rnatish',
      "o'rnatish",
      'установить'
    ];

    return Array.from(
      document.querySelectorAll(
        'button, a, [role="button"]'
      )
    ).find(el => {
      const text = (
        el.innerText ||
        el.textContent ||
        ''
      ).replace(/\s+/g, ' ').trim().toLowerCase();

      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);

      return labels.includes(text) &&
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden';
    }) || null;
  });
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  logStream = fs.createWriteStream(
    path.join(OUTPUT_DIR, 'bot.log'),
    { flags: 'w' }
  );

  for (const file of [
    '1_before.png',
    '2_middle.png',
    '3_after.png',
    'page.html'
  ]) {
    const fullPath = path.join(OUTPUT_DIR, file);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }

  log('BOT ISHGA TUSHDI');
  log('URL:', TARGET_URL);

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    // Har safar yangi sessiya.
    context = await browser.createBrowserContext();

    const page = await context.newPage();

    await page.setViewport({
      width: 1365,
      height: 900,
      deviceScaleFactor: 1
    });

    page.on('console', message => {
      log('BROWSER:', message.type(), message.text());
    });

    page.on('requestfailed', request => {
      log(
        'REQUEST FAILED:',
        request.url(),
        request.failure()?.errorText || ''
      );
    });

    page.on('framenavigated', frame => {
      if (frame === page.mainFrame()) {
        log('NAVIGATSIYA:', frame.url());
      }
    });

    let response = null;

    try {
      response = await page.goto(TARGET_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
    } catch (error) {
      log('SAYTGA KIRISH XATOSI:', error.message);
    }

    if (response) {
      log('HTTP STATUS:', String(response.status()));
      log('JAVOB URL:', response.url());
    }

    await sleep(2500);

    // 429 bo'lsa, qayta-qayta so'rov yubormaymiz.
    if (response && response.status() === 429) {
      log('SERVER 429: so‘rov cheklangan. Bot davom ettirilmaydi.');
      await screenshot(page, '1_before.png');

      try {
        fs.writeFileSync(
          path.join(OUTPUT_DIR, 'page.html'),
          await page.content(),
          'utf8'
        );
      } catch (_) {}

      return;
    }

    // 1-qadam: birinchi sahifa.
    await screenshot(page, '1_before.png');

    let button = await findButton(page);

    if (!button) {
      log('TUGMA TOPILMADI:', BUTTON_TEXT);

      try {
        fs.writeFileSync(
          path.join(OUTPUT_DIR, 'page.html'),
          await page.content(),
          'utf8'
        );
        log('HTML SAQLANDI: page.html');
      } catch (error) {
        log('HTML XATOSI:', error.message);
      }

      // Keyingi qadamlar bajarilmaganini aniq ko'rsatamiz.
      await screenshot(page, '2_middle.png');
      await screenshot(page, '3_after.png');
      return;
    }

    // 2-qadam: tugmani bosish va yangi oynani aniqlash.
    const oldPages = new Set(await context.pages());

    await button.click({ timeout: 15000 });
    await sleep(2500);

    const pages = await context.pages();

    const newPage = pages.find(
      candidate => !oldPages.has(candidate) && !candidate.isClosed()
    );

    const destination = newPage || page;

    try {
      await destination.waitForFunction(
        () => document.readyState !== 'loading',
        { timeout: 10000 }
      );
    } catch (_) {}

    await sleep(1500);

    log('TUGMADAN KEYINGI URL:', destination.url());

    // 3-qadam: keyingi sahifa.
    await screenshot(destination, '2_middle.png');

    // 4-qadam: brauzerda mavjud bo'lsa, o'rnatish tugmasi.
    const handle = await findInstallButton(destination);
    const installButton = handle.asElement();

    if (installButton) {
      try {
        await installButton.click({ timeout: 5000 });
        await sleep(2000);
        log('O‘RNATISH TUGMASI BOSILDI');
      } catch (error) {
        log('O‘RNATISH TUGMASI XATOSI:', error.message);
      }
    } else {
      log('O‘RNATISH TUGMASI TOPILMADI');
    }

    await handle.dispose().catch(() => {});

    // 5-qadam: yakuniy holat.
    await screenshot(destination, '3_after.png');

    log('BOT YAKUNLANDI');

  } catch (error) {
    log('BOT XATOSI:', error.stack || error.message);
    process.exitCode = 1;

  } finally {
    if (context) {
      await context.close().catch(() => {});
    }

    if (browser) {
      await browser.close().catch(() => {});
    }

    if (logStream) {
      await new Promise(resolve => logStream.end(resolve));
    }
  }
}

// MUHIM: main async funksiya ichida await ishlatiladi.
main().catch(error => {
  console.error('FATAL:', error);
  process.exitCode = 1;
});
