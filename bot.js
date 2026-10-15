
'use strict';

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const TARGET_URL =
  'https://promo-bot-ucad.onrender.com/r/JT_suzcNFZWTL8QfPWCD6Q';

const OUTPUT_DIR = path.join(process.cwd(), 'screenshots');

const SCREENSHOTS = {
  before: '1_before.png',
  middle: '2_middle.png',
  after: '3_after.png',
};

const BUTTON_TEXT = 'Нафақа ёшига етмаган фуқаро';
const PAGE_TIMEOUT = 60000;
const WAIT_AFTER_LOAD = 3000;

let browser;
let context;
let mainPage;
let logStream;

function log(...args) {
  const message = `[${new Date().toISOString()}] ${args.join(' ')}`;
  console.log(message);

  if (logStream) {
    logStream.write(message + '\n');
  }
}

function errorMessage(error) {
  return error && error.stack ? error.stack : String(error);
}

function ensureOutputDirectory() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const logPath = path.join(OUTPUT_DIR, 'bot.log');
  logStream = fs.createWriteStream(logPath, { flags: 'a' });

  for (const filename of Object.values(SCREENSHOTS)) {
    const filePath = path.join(OUTPUT_DIR, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

async function saveScreenshot(page, filename) {
  const outputPath = path.join(OUTPUT_DIR, filename);

  try {
    if (!page || page.isClosed()) {
      log(`SKIP screenshot: page yopilgan: ${filename}`);
      return false;
    }

    await page.screenshot({
      path: outputPath,
      fullPage: true,
      captureBeyondViewport: false,
      type: 'png',
    });

    const stats = fs.statSync(outputPath);

    log(`SCREENSHOT OK: ${filename}; size=${stats.size} bytes`);
    return true;
  } catch (error) {
    log(`SCREENSHOT ERROR: ${filename}`);
    log(errorMessage(error));
    return false;
  }
}

async function waitForDocument(page, timeout = 15000) {
  try {
    await page.waitForFunction(
      () => document.readyState === 'interactive' ||
            document.readyState === 'complete',
      { timeout }
    );
  } catch (error) {
    log('Document tayyorligini kutish vaqti tugadi:', error.message);
  }
}

async function waitForVisiblePage(page) {
  await waitForDocument(page);
  await new Promise((resolve) => setTimeout(resolve, WAIT_AFTER_LOAD));
}

function monitorPage(page, label) {
  page.on('console', (message) => {
    log(`[${label}] BROWSER CONSOLE ${message.type()}: ${message.text()}`);
  });

  page.on('pageerror', (error) => {
    log(`[${label}] PAGE ERROR: ${error.message}`);
  });

  page.on('requestfailed', (request) => {
    log(
      `[${label}] REQUEST FAILED: ${request.url()} | ` +
      `${request.failure()?.errorText || 'unknown'}`
    );
  });

  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) {
      log(`[${label}] NAVIGATION: ${frame.url()}`);
    }
  });

  page.on('popup', (popup) => {
    log(`[${label}] POPUP: ${popup.url()}`);
  });
}

async function findTargetButton(page) {
  const selectors = [
    'button',
    'a',
    '[role="button"]',
    'input[type="button"]',
    'input[type="submit"]',
  ];

  for (const selector of selectors) {
    const elements = await page.$$(selector);

    for (const element of elements) {
      try {
        const info = await element.evaluate((el) => {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();

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
            disabled: Boolean(el.disabled),
          };
        });

        if (
          info.visible &&
          !info.disabled &&
          info.text.includes(BUTTON_TEXT)
        ) {
          log(`TUGMA TOPILDI: "${info.text}"`);
          return element;
        }
      } catch (error) {
        log('Tugmani tekshirishda xato:', error.message);
      }
    }
  }

  return null;
}

async function findInstallButton(page) {
  const labels = [
    'install',
    'o‘rnatish',
    "o'rnatish",
    'установить',
    'install app',
  ];

  return page.evaluateHandle((allowedLabels) => {
    const elements = Array.from(
      document.querySelectorAll(
        'button, a, [role="button"], input[type="button"], input[type="submit"]'
      )
    );

    return elements.find((element) => {
      const text = (
        element.innerText ||
        element.textContent ||
        element.value ||
        ''
      ).replace(/\s+/g, ' ').trim().toLowerCase();

      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);

      const visible =
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden';

      return visible && allowedLabels.includes(text);
    }) || null;
  }, labels);
}

async function main() {
  ensureOutputDirectory();

  log('========================================');
  log('BOT START');
  log('Target:', TARGET_URL);
  log('Output:', OUTPUT_DIR);
  log('========================================');

  const openedPages = new Set();

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--no-default-browser-check',
      ],
    });

    // Har ishga tushishda yangi, ajratilgan sessiya.
    context = await browser.createBrowserContext();

    context.on('page', (page) => {
      openedPages.add(page);
      log('YANGI PAGE:', page.url());
      monitorPage(page, `page-${openedPages.size}`);
    });

    mainPage = await context.newPage();
    openedPages.add(mainPage);

    monitorPage(mainPage, 'main');

    await mainPage.setViewport({
      width: 1365,
      height: 900,
      deviceScaleFactor: 1,
    });

    await mainPage.setDefaultNavigationTimeout(PAGE_TIMEOUT);
    await mainPage.setDefaultTimeout(15000);

    await mainPage.setExtraHTTPHeaders({
      'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
    });

    log('Saytga kirish boshlandi...');

    try {
      await mainPage.goto(TARGET_URL, {
        waitUntil: 'domcontentloaded',
        timeout: PAGE_TIMEOUT,
      });
    } catch (error) {
      log('GOTO WARNING:', error.message);
      log('Joriy URL:', mainPage.url());
    }

    await waitForVisiblePage(mainPage);

    log('BIRINCHI SAHIFA URL:', mainPage.url());

    // 1-qadam: boshlang'ich holat skrinshoti.
    await saveScreenshot(mainPage, SCREENSHOTS.before);

    // Kerakli matn mavjudligini qidiramiz.
    let targetButton = await findTargetButton(mainPage);

    if (!targetButton) {
      log('Asosiy sahifada tugma topilmadi.');

      const pages = await context.pages();

      for (const page of pages) {
        if (page.isClosed()) continue;

        log('OCHIQ SAHIFA:', page.url());

        if (page !== mainPage) {
          await waitForVisiblePage(page);
          await saveScreenshot(page, SCREENSHOTS.middle);

          if (!targetButton) {
            targetButton = await findTargetButton(page);
            if (targetButton) {
              mainPage = page;
              break;
            }
          }
        }
      }
    }

    if (!targetButton) {
      log(
        'STOP: kerakli tugma topilmadi. ' +
        'Sayt redirect qilgan, matn o‘zgargan yoki sahifa yuklanmagan.'
      );

      // Diagnostika uchun mavjud sahifaning HTML qismini saqlash.
      try {
        const html = await mainPage.content();
        fs.writeFileSync(
          path.join(OUTPUT_DIR, 'page.html'),
          html,
          'utf8'
        );
        log('HTML saqlandi: page.html');
      } catch (error) {
        log('HTML saqlash xatosi:', error.message);
      }

      // Skrinshot yo'qolmasligi uchun mavjud sahifani yana saqlaymiz.
      await saveScreenshot(mainPage, SCREENSHOTS.middle);
      await saveScreenshot(mainPage, SCREENSHOTS.after);
      return;
    }

    // 2-qadam: tugmani bosishdan oldin ochiq sahifalarni qayd etamiz.
    const pagesBeforeClick = new Set(await context.pages());

    log('Kerakli tugma bosilmoqda...');

    await targetButton.click({ timeout: 15000 });

    // 3-qadam: popup yoki shu oynadagi navigatsiyani kutamiz.
    let destinationPage = null;
    const popupDeadline = Date.now() + 12000;

    while (Date.now() < popupDeadline) {
      const currentPages = await context.pages();

      const newPage = currentPages.find(
        (page) => !pagesBeforeClick.has(page) && !page.isClosed()
      );

      if (newPage) {
        destinationPage = newPage;
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    if (!destinationPage) {
      destinationPage = mainPage;
    }

    try {
      await waitForVisiblePage(destinationPage);
    } catch (error) {
      log('Destination kutish xatosi:', error.message);
    }

    log('TUGMADAN KEYINGI URL:', destinationPage.url());

    // Play Market yoki keyingi sahifa skrinshoti.
    await saveScreenshot(destinationPage, SCREENSHOTS.middle);

    // 4-qadam: brauzerda ko'rinadigan o'rnatish tugmasini qidirish.
    const installHandle = await findInstallButton(destinationPage);
    const installElement = installHandle.asElement();

    if (installElement) {
      try {
        log('O‘rnatish tugmasi topildi.');

        await installElement.click({ timeout: 5000 });

        await new Promise((resolve) => setTimeout(resolve, 3000));

        log('O‘rnatish tugmasi bosildi.');
      } catch (error) {
        log('O‘rnatish tugmasini bosish amalga oshmadi:', error.message);
      }
    } else {
      log(
        'Install/O‘rnatish/Установить tugmasi topilmadi. ' +
        'Bu Android ilovasini o‘rnatish imkoniyati yo‘qligini anglatishi mumkin.'
      );
    }

    await installHandle.dispose().catch(() => {});

    // Yakuniy holat.
    await saveScreenshot(destinationPage, SCREENSHOTS.after);

    log('Bot muvaffaqiyatli yakunlandi.');

  } catch (error) {
    log('FATAL ERROR:');
    log(errorMessage(error));

    // Xatoda ham mavjud oynalardan skrinshot olish.
    for (const page of openedPages) {
      if (page.isClosed()) continue;

      await saveScreenshot(page, SCREENSHOTS.after);
      break;
    }

    process.exitCode = 1;

  } finally {
    if (context) {
      try {
        await context.close();
        log('Browser context yopildi.');
      } catch (error) {
        log('Context yopish xatosi:', error.message);
      }
    }

    if (browser) {
      try {
        await browser.close();
        log('Browser yopildi.');
      } catch (error) {
        log('Browser yopish xatosi:', error.message);
      }
    }

    log('Yakuniy fayllar:');

    try {
      for (const file of fs.readdirSync(OUTPUT_DIR)) {
        const fullPath = path.join(OUTPUT_DIR, file);

        if (fs.statSync(fullPath).isFile()) {
          log(`${file} (${fs.statSync(fullPath).size} bytes)`);
        }
      }
    } catch (error) {
      log('Fayllarni ro‘yxatlash xatosi:', error.message);
    }

    if (logStream) {
      await new Promise((resolve) => logStream.end(resolve));
    }
  }
}

main().catch((error) => {
  console.error('Kutilmagan xato:', error);
  process.exitCode = 1;
});
