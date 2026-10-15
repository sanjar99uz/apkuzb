const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const START_URL =
  "https://project.cybercontrol.uz/r/JT_suzcNFZWTL8QfPWCD6Q";

const BUTTON_TEXT = "Нафақа ёшига етmagan фуқаро";

const OUTPUT_DIR = path.join(__dirname, "screenshots");
const LOG_FILE = path.join(__dirname, "bot.log");
const HTML_FILE = path.join(__dirname, "page.html");
const SECOND_URL_FILE = path.join(__dirname, "second-url.txt");

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function log(...args) {
  const line = args.join(" ");
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + "\n", "utf8");
}

async function saveScreenshot(page, filename) {
  try {
    await page.screenshot({
      path: path.join(OUTPUT_DIR, filename),
      fullPage: true,
    });

    log("SKRINSHOT SAQLANDI:", filename);
  } catch (error) {
    log("SKRINSHOT XATOSI:", error.message);
  }
}

async function saveHtml(page) {
  try {
    fs.writeFileSync(HTML_FILE, await page.content(), "utf8");
    log("HTML SAQLANDI:", HTML_FILE);
  } catch (error) {
    log("HTML SAQLASH XATOSI:", error.message);
  }
}

async function main() {
  fs.writeFileSync(LOG_FILE, "", "utf8");

  if (fs.existsSync(SECOND_URL_FILE)) {
    fs.unlinkSync(SECOND_URL_FILE);
  }

  log("BOT ISHGA TUSHDI");
  log("BOSHLANG‘ICH URL:", START_URL);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  let context;

  try {
    // Yangi, alohida sessiya — oldingi ishga tushirish cookie'lari yo‘q.
    context = await browser.createBrowserContext();

    const page = await context.newPage();

    await page.setViewport({
      width: 412,
      height: 915,
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    });

    await page.setUserAgent(
      "Mozilla/5.0 (Linux; Android 14; SM-S938B) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) " +
      "Chrome/131.0.0.0 Mobile Safari/537.36"
    );

    await page.setCacheEnabled(false);

    await page.setExtraHTTPHeaders({
      "Cache-Control": "no-cache, no-store, max-age=0",
      "Pragma": "no-cache",
      "Accept-Language": "uz-UZ,uz;q=0.9,ru;q=0.8,en;q=0.7",
    });

    page.setDefaultNavigationTimeout(45000);
    page.setDefaultTimeout(15000);

    let secondUrl = null;

    // Navigatsiyalarni kuzatish.
    page.on("framenavigated", (frame) => {
      if (frame !== page.mainFrame()) return;

      const url = frame.url();
      log("NAVIGATSIYA:", url);

      if (
        url.includes("project.cybercontrol.uz/") &&
        url.includes("/javob/") &&
        url.endsWith("/yosh")
      ) {
        secondUrl = url;

        fs.writeFileSync(
          SECOND_URL_FILE,
          secondUrl,
          "utf8"
        );

        log("IKKINCHI SAHIFA TOPILDI:", secondUrl);
      }
    });

    // Serverning redirect javoblarini logga yozish.
    page.on("request", (request) => {
      if (request.isNavigationRequest()) {
        log("NAVIGATSIYA SO‘ROVI:", request.url());
      }
    });

    page.on("response", (response) => {
      if (!response.request().isNavigationRequest()) return;

      const headers = response.headers();

      log(
        "NAVIGATSIYA JAVOBI:",
        response.status(),
        response.url(),
        "LOCATION:",
        headers.location || "-"
      );
    });

    // 1. Birinchi saytni ochish.
    let response;

    try {
      response = await page.goto(START_URL, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
    } catch (error) {
      log("SAHIFA OCHISH XATOSI:", error.message);
    }

    log(
      "BIRINCHI JAVOB STATUS:",
      response ? response.status() : "JAVOB YO‘Q"
    );

    log("HOZIRGI URL:", page.url());

    await new Promise((resolve) => setTimeout(resolve, 1500));

    await saveScreenshot(page, "1_before.png");
    await saveHtml(page);

    // 2. Tugmani qidirish.
    const buttonFound = await page.evaluate((targetText) => {
      const normalize = (value) =>
        (value || "").replace(/\s+/g, " ").trim();

      const candidates = Array.from(
        document.querySelectorAll(
          "button, a, [role='button'], input[type='button'], " +
          "input[type='submit'], label, div, span"
        )
      );

      // Eng kichik mos elementni topishga harakat qilish.
      const matches = candidates.filter((element) => {
        const text = normalize(
          element.innerText ||
          element.textContent ||
          element.value ||
          element.getAttribute("aria-label")
        );

        return text.includes(targetText);
      });

      matches.sort((a, b) => {
        return (
          (a.innerText || a.textContent || "").length -
          (b.innerText || b.textContent || "").length
        );
      });

      const element = matches[0];

      if (!element) return false;

      element.setAttribute("data-bot-target", "true");
      element.scrollIntoView({
        block: "center",
        behavior: "instant",
      });

      return true;
    }, BUTTON_TEXT);

    if (!buttonFound) {
      log("TUGMA TOPILMADI:", BUTTON_TEXT);
      log("JORIY URL:", page.url());

      await saveScreenshot(page, "2_middle.png");
      await saveHtml(page);

      log(
        "IZOH: birinchi URL server tomonidan Play Market'ga " +
        "302 redirect qaytarsa, tugma mavjud bo‘lmaydi."
      );

      return;
    }

    log("TUGMA TOPILDI:", BUTTON_TEXT);

    // 3. Tugmani bosish.
    try {
      await page.click("[data-bot-target='true']", {
        timeout: 10000,
      });

      log("TUGMA BOSILDI");
    } catch (error) {
      log("TUGMANI BOSISH XATOSI:", error.message);
    }

    // JavaScript redirect bo‘lishi uchun kutish.
    await new Promise((resolve) => setTimeout(resolve, 2000));

    log("TUGMADAN KEYINGI URL:", page.url());

    if (secondUrl) {
      log("IKKINCHI URL FAYLGA SAQLANDI:", SECOND_URL_FILE);
    } else {
      log("IKKINCHI /javob/.../yosh URL KUZATILMADI");
    }

    await saveScreenshot(page, "2_middle.png");
    await saveHtml(page);

    // 4. Agar uchinchi sahifaga o‘tgan bo‘lsa, holatni qayd etish.
    log("YAKUNIY URL:", page.url());
    await saveScreenshot(page, "3_after.png");

    log("BOT ISHI TUGADI");
  } finally {
    if (context) {
      await context.close().catch(() => {});
    }

    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  log("UMUMIY XATO:", error.stack || error.message);
  process.exitCode = 1;
});
