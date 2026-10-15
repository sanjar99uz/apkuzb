const puppeteer = require('puppeteer');

async function runBot() {
    console.log("Bot Linux Desktop rejimida ishga tushdi...");

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--window-size=1920,1080'
        ]
    });

    try {
        const page = await browser.newPage();

        // Linux Desktop o'lchami va standart User-Agent
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

        console.log("Asosiy ssilkaga kirilmoqda...");
        
        // domcontentloaded - sahifaning birinchi holatini darhol ushlab qolish uchun
        await page.goto('https://promo-bot-ucad.onrender.com/r/JT_suzcNFZWTL8QfPWCD6Q', { 
            waitUntil: 'domcontentloaded', 
            timeout: 60000 
        });

        // Sahifa to'liq yuklanishi va elementlar chiqishi uchun 3 soniya kutish
        await new Promise(r => setTimeout(r, 3000));

        // 1. BEFORE: Boshlang'ich tugmali sahifani (Desktop rejimda) ushlab qolib saqlash
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
            console.log("Tugma bosildi! Keyingi sahifaga yo'naltirilishi kutilmoqda...");
            // Sahifa ochilishi uchun yetarlicha vaqt beramiz
            await new Promise(r => setTimeout(r, 7000));
        } else {
            console.log("Xatolik: Tugma topilmadi!");
        }

        // Yo'naltirilgan oynani aniqlash
        const pages = await browser.pages();
        const activePage = pages.length > 1 ? pages[pages.length - 1] : page;

        console.log("Hozirgi sahifa URL manzili:", activePage.url());

        // 2. MIDDLE: Yo'naltirilgan sahifani saqlash
        try {
            await activePage.screenshot({ path: '2_middle.png', fullPage: true });
            console.log("2_middle.png saqlandi.");
        } catch (e) {
            console.log("2-rasmni olishda xato:", e.message);
        }

        // Install / O'rnatish tugmasi
        try {
            await activePage.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('button, span, div, a'));
                const installBtn = elements.find(el => {
                    const text = el.textContent ?
                        
