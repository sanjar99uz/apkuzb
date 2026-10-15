const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const START_URL =
  "https://project.cybercontrol.uz/r/JT_suzcNFZWTL8QfPWCD6Q";

const BUTTON_TEXT = "Нафақа ёшига етmagan фуқаро";
const OUT = path.join(__dirname, "screenshots");

fs.mkdirSync(OUT, { recursive: true });

function log(...args) {
  const line = args.join(" ");
  console.log(line);
  fs.appendFileSync(path.join(__dirname, "bot.log"), line + "\n");
}

async function shot(page, name) {
  try {
    await page.screenshot({
      path: path.join(OUT, name),
      fullPage: true,
    });
    log("SKRINSHOT SAQLANDI:", name);
  } catch (e) {
    log("SKRINSHOT XATOSI:", e.message);
  }
}

async function main() {
  fs.writeFileSync(path.join(__dirname, "bot.log"), "");

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  try {
    const page = await browser.newPage();

    // Android Chrome kabi ko‘rinishga harakat qilish.
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

    page.setDefaultNavigationTimeout(45000);

    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) {
        log("NAVIGATSIYA:", frame.url());
      }
    });

    page.on("request", (request) => {
      if (request.isNavigationRequest()) {
        log("NAVIGATSIYA SO‘ROVI:", request.url());
      }
    });

    page.on("response", (response) => {
      const request = response.request();

      if (request.isNavigationRequest()) {
        log(
          "NAVIGATSIYA JAVOBI:",
          response.status(),
          response.url(),
          "LOCATION:",
          response.headers().location || "-"
        );
      }
    });

    log("1-SAYT OCHILMOQDA:", START_URL);

    try {
      await page.goto(START_URL, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
    } catch (e) {
      log("OCHISH XATOSI:", e.message);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    log("HOZIRGI URL:", page.url());
    await shot(page, "1_before.png");

    // Tugmani oddiy DOM orqali qidirish.
    const found = await page.evaluate((target) => {
      const normalize = (s) =>
        (s || "").replace(/\s+/g, " ").trim();

      const elements = Array.from(
        document.querySelectorAll(
          "button, a, [role='button'], div, span"
        )
      );

      const element = elements.find((el) => {
        const text = normalize(el.innerText || el.textContent);
        return text === target ||
          (text.includes(target) && text.length < 180);
      });

      if (!element) return false;

      element.setAttribute("data-bot-button", "yes");
      element.scrollIntoView({ block: "center" });
      return true;
    }, BUTTON_TEXT);

    if (!found) {
      log("TUGMA TOPILMADI:", BUTTON_TEXT);

      fs.writeFileSync(
        path.join(__dirname, "page.html"),
        await page.content(),
        "utf8"
      );

      await shot(page, "2_middle.png");
      return;
    }

    log("TUGMA TOPILDI. BOSILMOQDA.");

    try {
      await page.click("[data-bot-button='yes']", {
        timeout: 10000,
      });
    } catch (e) {
      log("TUGMANI BOSISH XATOSI:", e.message);
    }

    await new Promise((resolve) => setTimeout(resolve, 2500));

    log("BOSISHDAN KEYINGI URL:", page.url());

    fs.writeFileSync(
      path.join(__dirname, "second-url.txt"),
      page.url(),
      "utf8"
    );

    await shot(page, "2_middle.png");

    fs.writeFileSync(
      path.join(__dirname, "page.html"),
      await page.content(),
      "utf8"
    );

    await shot(page, "3_after.png");

    log("BOT TUGADI");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  log("UMUMIY XATO:", e.stack || e.message);
  process.exitCode = 1;
});
