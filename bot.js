const puppeteer = require('puppeteer');

async function runBot() {
    console.log("Bot ishga tushdi...");
    
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=390,844'
        ]
    });

    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();

    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');
    await page.setViewport({ width: 390, height: 844, isMobile: true });

    try {
        console.log("Asosiy sahifaga kirilmoqda...");
        await page.goto('https://promo-bot-ucad.onrender.com/r/JT_suzcNFZWTL8QfPWCD6Q', { 
            waitUntil: 'networkidle2', 
            timeout: 60000 
        });
    } catch (e) {
        console.log("Sahifaga kirishda muammo bo'ldi, lekin davom etamiz:", e.message);
    }

    // 1. BEFORE: Har qanday holatda ham 1-rasmni saqlash
    try {
        await page.screenshot({ path: '1_before.png', fullPage: true });
        console.log("1_before.png saqlandi.");
    } catch (e) {
        console.log("1-rasmni olishda xato:", e.message);
    }

    try {
        console.log('"Нафақа ёшига етмаган фуқаро" tugmasi qidirilmoqda...');
        const clicked = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('div, button, span, a'));
            const target = elements.find(el => el.textContent && el.textContent.includes('Нафақа ёшига етмаган фуқаро'));
            if (target) {
                target.click();
                return true;
            }
            return false;
        });

        if (clicked) {
            console.log("Tugma topildi va bosildi!");
            await new Promise(r => setTimeout(r, 6000));
        } else {
            console.log("Tugma topilmadi!");
        }
    } catch (e) {
        console.log("Tugmani bosish jarayonida xato:", e.message);
    }

    const pages = await browser.pages();
    const activePage = pages.length > 1 ? pages[pages.length - 1] : page;

    // 2. MIDDLE: Yo'naltirilgan sahifa skrinshoti
    try {
        await activePage.screenshot({ path: '2_middle.png', fullPage: true });
        console.log("2_middle.png saqlandi.");
    } catch (e) {
        console.log("2-rasmni olishda xato:", e.message);
    }

    try {
        await activePage.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('button, a, div'));
            const installBtn = elements.find(el => {
                const text = el.textContent ? el.textContent.toLowerCase() : '';
                return text.includes('install') || text.includes("o'rnatish") || text.includes('установить');
            });
            if (installBtn) installBtn.click();
        });
        await new Promise(r => setTimeout(r, 3000));
    } catch (e) {
        console.log("Install tugmasini bosishda amal bajarilmadi.");
    }

    // 3. AFTER: Yakuniy holat skrinshoti
    try {
        await activePage.screenshot({ path: '3_after.png', fullPage: true });
        console.log("3_after.png saqlandi.");
    } catch (e) {
        console.log("3-rasmni olishda xato:", e.message);
    }

    await browser.close();
    console.log("Bot o'z ishini yakunladi.");
}

runBot();
