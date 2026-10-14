const puppeteer = require('puppeteer');

async function runBot() {
    console.log("Bot Android rejimida ishga tushdi...");
    
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=412,915',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    const page = await browser.newPage();

    // Haqiqiy Android qurilma va Chrome brauzer User-Agent'i
    const androidUserAgent = 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
    await page.setUserAgent(androidUserAgent);
    
    // Android mobil ekran o'lchami va sensorli ekran sozlamasi
    await page.setViewport({ 
        width: 412, 
        height: 915, 
        deviceScaleFactor: 2.625,
        isMobile: true, 
        hasTouch: true 
    });

    // Server Linux ekanligimizni sezmasligi uchun navigator xususiyatlarini o'zgartiramiz
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'platform', { get: () => 'Linux armv7l' });
        Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 5 });
        Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.' });
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    try {
        console.log("Asosiy saytga kirilmoqda...");
        await page.goto('https://promo-bot-ucad.onrender.com/r/JT_suzcNFZWTL8QfPWCD6Q', { 
            waitUntil: 'networkidle2', 
            timeout: 60000 
        });

        await new Promise(r => setTimeout(r, 3000));

        // 1. BEFORE: Asosiy sahifa
        await page.screenshot({ path: '1_before.png', fullPage: true });
        console.log("1_before.png saqlandi.");

        console.log('"Нафақа ёшига етмаган фуқаро" tugmasi bosilmoqda...');
        
        const clicked = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('div, button, span, a, p'));
            const target = elements.find(el => el.textContent && el.textContent.trim().includes('Нафақа ёшига етмаган фуқаро'));
            if (target) {
                target.click();
                return true;
            }
            return false;
        });

        if (clicked) {
            console.log("Tugma bosildi! Play Marketga yo'naltirilishi kutilmoqda...");
            // Yo'naltirish (redirection) sodir bo'lishi uchun yetarlicha vaqt beramiz
            await new Promise(r => setTimeout(r, 8000));
        } else {
            console.log("Tugma topilmadi!");
        }

    } catch (e) {
        console.log("Xatolik:", e.message);
    }

    // Yangi ochilgan sahifani yoki Play Marketga o'tgan oynani aniqlash
    const pages = await browser.pages();
    const activePage = pages.length > 1 ? pages[pages.length - 1] : page;

    console.log("Hozirgi sahifa URL manzili:", activePage.url());

    // 2. MIDDLE: Yo'naltirilgan sahifa (Play Market)
    try {
        await activePage.screenshot({ path: '2_middle.png', fullPage: true });
        console.log("2_middle.png saqlandi.");
    } catch (e) {
        console.log("2-rasmni olishda xato:", e.message);
    }

    // Play Market sahifasida "Install" yoki "O'rnatish" tugmasini bosish
    try {
        await activePage.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('button, span, div, a'));
            const installBtn = elements.find(el => {
                const text = el.textContent ? el.textContent.toLowerCase() : '';
                return text.includes('install') || text.includes("o'rnatish") || text.includes('установить');
            });
            if (installBtn) {
                installBtn.click();
                console.log("Install tugmasi bosildi.");
            }
        });
        await new Promise(r => setTimeout(r, 4000));
    } catch (e) {
        console.log("Install tugmasini bosish talab qilinmadi.");
    }

    // 3. AFTER: Yakuniy holat
    try {
        await activePage.screenshot({ path: '3_after.png', fullPage: true });
        console.log("3_after.png saqlandi.");
    } catch (e) {
        console.log("3-rasmni olishda xato:", e.message);
    }

    await browser.close();
    console.log("Bot ishlashni yakunladi.");
}

runBot();
