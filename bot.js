const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const START_URL =
  "https://promo-bot-ucad.onrender.com/r/JT_suzcNFZWTL8QfPWCD6Q";

const BUTTON_TEXT = "Нафақа ёшига етмаган фуқаро";

const SCREENSHOT_DIR = path.join(__dirname, "screenshots");

const LOG_FILE = path.join(__dirname, "bot.log");
const HTML_FILE = path.join(__dirname, "page.html");

function log(...args) {
  const message = args.join(" ");
  console.log(message);

  fs.appendFileSync(
    LOG_FILE,
    `[${new Date().toISOString()}] ${message}\n`
  );
}

async function saveScreenshot(page, filename) {
  const filepath = path.join(SCREENSHOT_DIR, filename);

  try {
    await page.screenshot({
      path: filepath,
      fullPage: true,
      captureBeyondViewport: false,
    });

    log("SKRINSHOT SAQLANDI:", filepath);
  } catch (error) {
    log("SKRINSHOT XATOSI:", error.message);
  }
}

async function saveHtml(page) {
  try {
    const html = await page.content();
    fs.writeFileSync(HTML_FILE, html, "utf8");
    log("HTML SAQLANDI:", HTML_FILE);
  } catch (error) {
    log("HTML SAQLASH XATOSI:", error.message);
  }
}

async function main() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  fs.writeFileSync(LOG_FILE, "", "utf8");

  let browser;

  try {
    log("BOT ISHGA TUSHDI");
    log("BOSHLANG‘ICH URL:", START_URL);

    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--window-size=1365,900",
      ],
    });

    const page = await browser.newPage();

    await page.setViewport({
      width: 1365,
      height: 900,
      deviceScaleFactor: 1,
    });

    page.setDefaultNavigationTimeout(45000);
    page.setDefaultTimeout(15000);

    // Brauzer navigatsiyalarini logga yozish.
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) {
        log("NAVIGATSIYA:", frame.url());
      }
    });

    page.on("requestfailed", (request) => {
      log(
        "SO‘ROV XATOSI:",
        request.url(),
        request.failure()?.errorText || ""
      );
    });

    page.on("pageerror", (error) => {
      log("PAGE JAVASCRIPT XATOSI:", error.message);
    });

    // Play Market manzillariga ketayotgan brauzer so‘rovlarini
    // to‘xtatishga urinadi. Bu server redirectini bekor qilish
    // yoki oldingi sahifani tiklashni kafolatlamaydi.
    await page.setRequestInterception(true);

    page.on("request", (request) => {
      const url = request.url();

      const isPlayStore =
        /^https?:\/\/play\.google\.com\//i.test(url) ||
        /^https?:\/\/market\.android\.com\//i.test(url) ||
        /^market:\/\//i.test(url);

      if (isPlayStore) {
        log("PLAY MARKET SO‘ROVI TO‘XTATILMOQDA:", url);
        request.abort().catch(() => {});
        return;
      }

      request.continue().catch(() => {});
    });

    // Boshlang‘ich sahifani ochish.
    let response = null;

    try {
      response = await page.goto(START_URL, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
    } catch (error) {
      log("SAHIFANI OCHISH XATOSI:", error.message);
    }

    log(
      "HTTP STATUS:",
      response ? response.status() : "JAVOB YO‘Q"
    );

    log("HOZIRGI URL:", page.url());

    await new Promise((resolve) => setTimeout(resolve, 2500));

    await saveScreenshot(page, "1_before.png");
    await saveHtml(page);

    // Kerakli tugma yoki matnni qidirish.
    let buttonFound = false;

    try {
      buttonFound = await page.evaluate((targetText) => {
        const normalize = (text) =>
          (text || "").replace(/\s+/g, " ").trim();

        const elements = Array.from(
          document.querySelectorAll(
            "button, a, [role='button'], input[type='button'], input[type='submit']"
          )
        );

        const match = elements.find((element) => {
          const text = normalize(
            element.innerText ||
              element.textContent ||
              element.value ||
              element.getAttribute("aria-label")
          );

          return text.includes(targetText);
        });

        if (match) {
          match.scrollIntoView({
            behavior: "instant",
            block: "center",
          });

          match.setAttribute("data-bot-target", "true");
          return true;
        }

        // Ayrim saytlar tugma o‘rniga oddiy matn elementidan foydalanadi.
        const textElements = Array.from(
          document.querySelectorAll("body *")
        );

        const textMatch = textElements.find((element) => {
          const text = normalize(element.innerText || element.textContent);

          return (
            text.includes(targetText) &&
            element.children.length < 4
          );
        });

        if (textMatch) {
          textMatch.scrollIntoView({
            behavior: "instant",
            block: "center",
          });

          textMatch.setAttribute("data-bot-target", "true");
          return true;
        }

        return false;
      }, BUTTON_TEXT);
    } catch (error) {
      log("TUGMANI QIDIRISH XATOSI:", error.message);
    }

    if (buttonFound) {
      log("TUGMA TOPILDI:", BUTTON_TEXT);

      try {
        await page.locator("[data-bot-target='true']").click({
          timeout: 10000,
        });

        log("TUGMA BOSILDI:", BUTTON_TEXT);

        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (error) {
        log("TUGMANI BOSISH XATOSI:", error.message);
      }
    } else {
      log("TUGMA TOPILMADI:", BUTTON_TEXT);
      log("SABAB: sahifa boshqa manzilga o‘tgan yoki matn yo‘q.");
    }

    log("TUGMADAN KEYINGI URL:", page.url());

    await saveScreenshot(page, "2_middle.png");
    await saveHtml(page);

    // O‘rnatish tugmasini qidirish va bosishga urinish.
    // Brauzer Android ilovasini haqiqiy telefonga o‘rnata olmaydi.
    try {
      const installFound = await page.evaluate(() => {
        const normalize = (text) =>
          (text || "").replace(/\s+/g, " ").trim().toLowerCase();

        const installTexts = [
          "install",
          "o'rnatish",
          "o‘rnatish",
          "установить",
        ];

        const elements = Array.from(
          document.querySelectorAll(
            "button, a, [role='button']"
          )
        );

        const match = elements.find((element) => {
          const text = normalize(
            element.innerText ||
              element.textContent ||
              element.getAttribute("aria-label")
          );

          return installTexts.some((word) => text.includes(word));
        });

        if (match) {
          match.scrollIntoView({
            behavior: "instant",
            block: "center",
          });

          match.setAttribute("data-bot-install", "true");
          return true;
        }

        return false;
      });

      if (installFound) {
        log("O‘RNATISH TUGMASI TOPILDI");

        await page.locator("[data-bot-install='true']").click({
          timeout: 10000,
        });

        log("O‘RNATISH TUGMASI BOSILDI");

        await new Promise((resolve) => setTimeout(resolve, 2500));
      } else {
        log("O‘RNATISH TUGMASI TOPILMADI");
      }
    } catch (error) {
      log("O‘RNATISH TUGMASI XATOSI:", error.message);
    }

    log("YAKUNIY URL:", page.url());

    await saveScreenshot(page, "3_after.png");
    await saveHtml(page);

    log("BOT ISHI TUGADI");
  } catch (error) {
    log("BOTDA UMUMIY XATO:", error.stack || error.message);
    process.exitCode = 1;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

main().catch((error) => {
  console.error("BOTNI ISHGA TUSHIRISHDA XATO:", error);
  process.exitCode = 1;
});
