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
            '--window-size=390,844',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    try {
        const page = await browser.newPage();

        // Mobil qurilma ko'rinishi
        await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');

        console.log("Asosiy ssilkaga kirilmoqda...");
        
        // domcontentloaded - sahifa ochilishi bilanoq darhol to'xtaydi (oxirigacha sakrab ketishiga yo'l qo'ymaydi)
        await page.goto('https://promo-bot-ucad.onrender.com/r/JT_suzcNFZWTL8QfPWCD6Q', { 
            waitUntil: 'domcontentloaded', 
            timeout: 60000 
        });

        // 1-sahifa (tugmalar turgan sahifa) to'liq yuklanishi uchun qisqa kutish
        await new Promise(r => setTimeout(r, 3000));

        // 1. BEFORE: Boshlang'ich tugmali sahifani ushlab qolib saqlash
        await page.screenshot({ path: '1_before.png', fullPage: true });
        console.log("1_before.png (tugmali sahifa) muvaffaqiyatli saqlandi.");

        console.log('"Нафақа ёшига етмаган фуқаро" tugmasi qidirilmoqda va bosilmoqda...');
        
        // Tugmani topib bosish
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
            console.log("Tugma bosildi! Play Marketga o'tishi kutilmoqda...");
            // Play Market sahifasi ochilishi uchun yetarlicha vaqt beramiz
            await new Promise(r => setTimeout(r, 7000));
        } else {
            console.log("Xatolik: Tugma topilmadi!");
        }

        // Play Marketga o'tgan oynani aniqlash
        const pages = await browser.pages();
        const activePage = pages.length > 1 ? pages[pages.length - 1] : page;

        console.log("Hozirgi sahifa URL manzili:", activePage.url());

        // 2. MIDDLE: Play Market sahifasini saqlash
        try {
            await activePage.screenshot({ path: '2_middle.png', fullPage: true });
            console.log("2_middle.png (Play Market sahifasi) saqlandi.");
        } catch (e) {
            console.log("2-rasmni olishda xato:", e.message
                        
