
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const TARGET_URL =
  'https://promo-bot-ucad.onrender.com/r/JT_suzcNFZWTL8QfPWCD6Q';

const OUTPUT_DIR = path.join(__dirname, 'screenshots');
const BUTTON_TEXT = 'Нафақа ёшига етмаган фуқаро';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function saveScreenshot(page, filename) {
  if (!page || page.isClosed()) {
    console.log(`Skrinshot olinmadi: ${filename}`);
    return false;
  }

  try {
    await page.screenshot({
      path: path.join(OUTPUT_DIR, filename),
      fullPage: true,
      captureBeyondViewport: false
    });

    console.log(`Skrinshot saqlandi: ${filename}`);
    return true;
  } catch (error) {
    console.error(`Skrinshot xatosi (${filename}):`, error.message);
    return false;
  }
}

async function waitForPage(page, timeout = 15000) {
  try {
    await page.waitForFunction(
      () => document.readyState !== 'loading',
      { timeout }
    );
  } catch (_) {
    // Sahifa to'liq yuklanmasa ham davom etamiz.
  }
}

async function findTargetButton(page) {
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
        const text = await page.evaluate((el) => {
          return (
            el.innerText ||
            el.textContent ||
            el.value ||
            ''
          ).replace(/\s+/g, ' ').trim();
        }, element);

        if (
          text.includes(BUTTON_TEXT) &&
          await element.isVisible()
        ) {
          return element;
        }
      } catch (_) {
        // DOM yangilangan bo'lishi mumkin.
      }
    }
  }

  return null;
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Oldingi ishga tushirishdan qolgan skrinshotlarni tozalash.
  for (const filename of [
    '1_before.png',
    '2_middle.png',
    '3_after.png'
  ]) {
    const file = path.join(OUTPUT_DIR, filename);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }

  let browser;
  let context;
  let mainPage;
  const openedPages = [];

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--no-first-run'
      ]
    });

    // Yangi, cookie va localStorage ma'lumotlari ajratilgan sessiya.
    context = await browser.createBrowserContext();
    mainPage = await context.newPage();
    openedPages.push(mainPage);

    await mainPage.setViewport({
      width: 1365,
      height: 900,
      deviceScaleFactor: 1
    });

    // Har qanday tashqi oynani kuzatish.
    context.on('page', (page) => {
      if (!openedPages.includes(page)) {
        openedPages.push(page);
        console.log('Yangi oyna ochildi:', page.url());
      }
    });

    mainPage.on('framenavigated', (frame) => {
      if (frame === mainPage.mainFrame()) {
        console.log('Asosiy sahifa navigatsiyasi:', frame.url());
      }
    });

    // Muhim: bu kod redirectni bloklamaydi, faqat kuzatadi.
    await mainPage.goto(TARGET_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await waitForPage(mainPage, 10000);
    await sleep(2000);

    console.log('Boshlangich URL:', mainPage.url());

    // Birinchi skrinshot.
    await saveScreenshot(mainPage, '1_before.png');

    // Tugma aynan shu sahifada mavjudligini tekshirish.
    let targetButton = await findTargetButton(mainPage);

    if (!targetButton) {
      console.error(
        'Kerakli tugma topilmadi. Sayt redirect qilgan yoki ' +
        'tugma DOM ichida mavjud emas.'
      );
      return;
    }

    // Click bilan bir vaqtda yangi oynalarni aniqlash.
    const previousPages = new Set(
      await context.pages()
    );

    const popupPromise = new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), 15000);

      const listener = (page) => {
        if (!previousPages.has(page)) {
          clearTimeout(timer);
          context.off('page', listener);
          resolve(page);
        }
      };

      context.on('page', listener);
    });

    await targetButton.click({ timeout: 10000 });

    let destinationPage = await popupPromise;

    if (!destinationPage) {
      // Ba'zan tugma yangi oyna emas, shu oynani o'zgartiradi.
      destinationPage = mainPage;
    }

    try {
      await destinationPage.waitForNavigation({
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });
    } catch (_) {
      // SPA yoki yangi ochilgan sahifa navigatsiyasiz yuklanishi mumkin.
    }

    await sleep(3000);

    console.log('Tugmadan keyingi URL:', destinationPage.url());

    // Tugma bosilgandan keyingi holat.
    await saveScreenshot(destinationPage, '2_middle.png');

    // Play Marketning web sahifasida mavjud tugmalarni tekshirish.
    // Android ilovasini o'rnatish bu kod orqali amalga oshmaydi.
    const installButton = await destinationPage.evaluateHandle(() => {
      const candidates = Array.from(
        document.querySelectorAll(
          'button, a, [role="button"]'
        )
      );

      return candidates.find((el) => {
        const text = (
          el.innerText ||
          el.textContent ||
          ''
        ).trim().toLowerCase();

        return (
          text === 'install' ||
          text === 'o‘rnatish' ||
          text === "o'rnatish" ||
          text === 'установить' ||
          text === 'install app'
        );
      }) || null;
    });

    const element = installButton.asElement();

    if (element) {
      try {
        if (await element.isVisible()) {
          await element.click({ timeout: 5000 });
          await sleep(3000);
          console.log('O‘rnatish tugmasi bosildi.');
        }
      } catch (error) {
        console.log(
          'O‘rnatish tugmasini bosib bo‘lmadi:',
          error.message
        );
      }
    } else {
      console.log(
        'O‘rnatish tugmasi topilmadi yoki Play Market sahifasi ' +
        'ushbu brauzerda ochilmadi.'
      );
    }

    await installButton.dispose().catch(() => {});

    // Yakuniy skrinshot.
    await saveScreenshot(destinationPage, '3_after.png');

  } catch (error) {
    console.error('Bot xatosi:', error);

    // Xato yuz bersa ham mavjud sahifani saqlashga harakat qilamiz.
    if (mainPage && !mainPage.isClosed()) {
      await saveScreenshot(mainPage, '1_before.png');
    }

    process.exitCode = 1;
  } finally {
    if (context) {
      await context.close().catch(() => {});
    }

    if (browser) {
      await browser.close().catch(() => {});
    }

    console.log('Bot yakunlandi.');
  }
}

main();
