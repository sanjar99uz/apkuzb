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
            '--disable-blink-features=AutomationControlled' // Bot ekanligini yashirish uchun
        ]
    });

    const page = await browser.newPage();

    // Haqiqiy mobil qurilma brauzeridek ko'rsatish
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    // Bot ekanligini fosh qiluvchi xususiyatlarni olib tashlash
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    try {
        console.log("Asosiy saytga kirilmoqda...");
        await page.goto('https://promo-bot-ucad.onrender.com/r/JT_suzcNFZWTL8QfPWCD6Q', { 
            waitUntil: 'networkidle2', 
            timeout: 60000 
        });

        // Sahifa to'liq ochilishi uchun biroz kutamiz
        await new Promise(r => setTimeout(r, 4000));

        // 1. BEFORE: Asosiy sayt ochilgan holat
        await page.screenshot({ path: '1_before.png', fullPage: true });
        console.log("1_before.png saqlandi.");

        console.log('"Нафақа ёшига етмаган фуқаро" tugmasi qidirilmoqda...');
        
        // Tugmani bosish
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
            console.log("Tugma muvaffaqiyatli bosildi! Yo'naltirish kutilmoqda...");
            // Havola ochilishi va sahifa o'zgarishi uchun 7 soniya kutamiz
            await new Promise(r => setTimeout(r, 7000));
        } else {
            console.log("Tugma topilmadi!");
        }

    } catch (e) {
        console.log("Jarayonda xatolik yuz berdi:", e.message);
    }

    // Sahifalar ro'yxatini olamiz (agar yangi oyna ochilgan bo'lsa)
    const pages = await browser.pages();
    const activePage = pages.length > 1 ? pages[pages.length - 1] : page;

    console.log("Hozirgi ochiq sahifa manzili (URL):", activePage.url());

    // 2. MIDDLE: Yo'naltirilgan sahifa holati
    try {
        await activePage.screenshot({ path: '2_middle.png', fullPage: true });
        console.log("2_middle.png saqlandi.");
    } catch (e) {
        console.log("2-rasmni olishda xato:", e.message);
    }

    // Install / O'rnatish tugmasini qidirib bosish
    try {
        await activePage.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('button, a, div, span'));
            const installBtn = elements.find(el => {
                const text = el.textContent ? el.textContent.toLowerCase() : '';
                return text.includes('install') || text.includes("o'rnatish") || text.includes('установить');
            });
            if (installBtn) installBtn.click();
        });
        await new Promise(r => setTimeout(r, 4000));
    } catch (e) {
        console.log("Install tugmasi topilmadi yoki bosilmadi.");
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
