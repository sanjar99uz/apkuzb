const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const START_URL =
  "https://project.cybercontrol.uz/r/JT_suzcNFZWTL8QfPWCD6Q";

const BUTTON_TEXT = "Нафақа ёшига етмаган фуқаро";
const OUTPUT = path.join(__dirname, "screenshots");

fs.mkdirSync(OUTPUT, { recursive: true });

function log(...args) {
  const line = args.join(" ");
  console.log(line);
  fs.appendFileSync(
    path.join(__dirname, "bot.log"),
    line + "\n"
  );
}

async function screenshot(page, name) {
  try {
    await page.screenshot({
      path: path.join(OUTPUT, name),
      fullPage: true,
    });
    log("SKRINSHOT:", name);
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

    await page.setViewport({
      width: 1365,
      height: 900,
    });

    page.setDefaultTimeout(20000);

    let secondUrl = null;
    let secondPageResponse = null;

    // Har bir navigatsiya manzilini qayd etish.
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) {
        const url = frame.url();
        log("NAVIGATSIYA:", url);

        if (
          url.includes("project.cybercontrol.uz/r/") &&
          url.includes("/javob/") &&
          url.endsWith("/yosh")
        ) {
          secondUrl = url;
          log("IKKINCHI URL TOPILDI:", secondUrl);
        }
      }
    });

    // Ikkinchi sahifaga tegishli javobni kuzatish.
    page.on("response", (response) => {
      const url = response.url();

      if (
        url.includes("project.cybercontrol.uz/r/") &&
        url.includes("/javob/") &&
        url.endsWith("/yosh")
      ) {
        secondPageResponse = response;
        log("IKKINCHI SAHIFA STATUS:", response.status());
        log("IKKINCHI SAHIFA URL:", url);
      }
    });

    // Uchinchi manzilga ketadigan so‘rovni to‘xtatishga urinish.
    // Bu ikkinchi sahifani tiklashni kafolatlamaydi.
    await page.setRequestInterception(true);

    page.on("request", (request) => {
      const url = request.url();

      if (
        /^https:\/\/play\.google\.com\//i.test(url) ||
        /^market:\/\//i.test(url)
      ) {
        log("PLAY MARKET YO‘NALTIRISHI TO‘XTATILDI:", url);
        request.abort().catch(() => {});
        return;
      }

      request.continue().catch(() => {});
    });

    log("1-SAYT OCHILMOQDA:", START_URL);

    try {
      const response = await page.goto(START_URL, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });

      log("BIRINCHI SAHIFA STATUS:", response?.status());
    } catch (e) {
      log("BIRINCHI SAHIFA XATOSI:", e.message);
    }

    log("BIRINCHI SAHIFA URL:", page.url());
    await screenshot(page, "1_before.png");

    // Tugmani topish.
    const button = page.getByText(BUTTON_TEXT, {
      exact: false,
    }).first();

    try {
      await button.waitFor({ state: "visible", timeout: 15000 });
      log("TUGMA TOPILDI:", BUTTON_TEXT);
    } catch {
      log("TUGMA TOPILMADI. SAHIFA HTML SAQLANADI.");

      fs.writeFileSync(
        path.join(__dirname, "page.html"),
        await page.content(),
        "utf8"
      );

      await screenshot(page, "2_middle.png");
      return;
    }

    // Tugmani bosish va navigatsiyani kutish.
    try {
      await Promise.all([
        page.waitForNavigation({
          waitUntil: "domcontentloaded",
          timeout: 20000,
        }).catch((e) => {
          log("NAVIGATSIYA KUTILISHI:", e.message);
        }),
        button.click(),
      ]);
    } catch (e) {
      log("TUGMANI BOSISH XATOSI:", e.message);
    }

    log("BOSISHDAN KEYINGI URL:", page.url());

    // Ikkinchi URL qayd etilgan bo‘lsa, logga yozilgan bo‘ladi.
    if (secondUrl) {
      fs.writeFileSync(
        path.join(__dirname, "second-url.txt"),
        secondUrl,
        "utf8"
      );
    }

    await screenshot(page, "2_middle.png");

    fs.writeFileSync(
      path.join(__dirname, "page.html"),
      await page.content(),
      "utf8"
    );

    log("YAKUNIY URL:", page.url());
    await screenshot(page, "3_after.png");

    log("BOT TUGADI");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  log("UMUMIY XATO:", e.stack || e.message);
  process.exitCode = 1;
});
