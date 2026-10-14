const puppeteer = require('puppeteer');

async function runBot() {
    console.log("Bot to'g'ridan-to'g'ri Incognito rejimida ishga tushmoqda...");
    
    // Brauzerni to'g'ridan-to'g'ri --incognito parametri bilan ochish
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920,1080',
            '--incognito', // Maxfiy va toza rejim
            '--disable-blink-features=AutomationControlled'
        ]
    });

    try {
        const page = await browser.newPage();

        // Kompyuter (Desktop) o'lchami va brauzer sozlamalari
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

        console.log("Asosiy saytga kirilmoqda: https://promo-bot-ucad.onrender.com/r/JT_suzcNFZWTL8QfPWCD6Q");
        await page.goto('https://promo-bot-ucad.onrender.com/r/JT_suzcNFZWTL8QfPWCD6Q', { 
            waitUntil: 'networkidle2', 
            timeout: 60000 
        });

        // Sahifa to'liq yuklanishi uchun 4 soniya kutamiz
        await new Promise(r => setTimeout(r, 4000));

        // 1. BEFORE: Tugmali boshlang'ich sahifani saqlash
        await page.screenshot({ path: '1_before.png', fullPage: true });
        console.log("1_before.png (boshlang'ich sahifa) muvaffaqiyatli saqlandi.");

        console.log('"Нафақа ёшига етмаган фуқаро" tugmasi qidirilmoqda...');
        
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
            console.log("Tugma muvaffaqiyatli bosildi! Yo'naltirilishi kutilmoqda...");
            await new Promise(r => setTimeout(r, 8000)); // Play Market sahifasi ochilishi uchun kutish
        } else {
            console.log("Xatolik: Tugma topilmadi!");
        }

        // Ochilgan yangi oynani yoki yo'naltirilgan sahifani aniqlash
        const pages = await browser.pages();
        const activePage = pages.length > 1 ? pages[pages.length - 1] : page;

        console.log("Hozirgi sahifa URL manzili:", activePage.url());

        // 2. MIDDLE: Yo'naltirilgan sahifani (Play Market) saqlash
        try {
            await activePage.screenshot({ path: '2_middle.png', fullPage: true });
            console.log("2_middle.png (yo'naltirilgan sahifa) saqlandi.");
        } catch (e) {
            console.log("2-rasmni olishda xato:", e.message);
        }

        // Install / O'rnatish tugmasini bosishga urinish
        try {
            await activePage.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('button, span, div, a'));
                const installBtn = elements.find(el => {
                    const text = el.textContent ? el.textContent.toLowerCase() : '';
                    return text.includes('install') || text.includes("o'rnatish") || text.includes('установить');
                });
                if (installBtn) {
                    installBtn.click();
                    console.log("Install / O'rnatish tugmasi bosildi.");
                }
            });
            await new Promise(r => setTimeout(r, 4000));
        } catch (e) {
            console.log("Install tugmasini bosish talab qilinmadi.");
        }

        // 3. AFTER: Yakuniy holatni saqlash
        try {
            await activePage.screenshot({ path: '3_after.png', fullPage: true });
            console.log("3_after.png (yakuniy holat) saqlandi.");
        } catch (e) {
            console.log("3-rasmni olishda xato:", e.message);
        }

    } catch (error) {
        console.error("Skriptni bajarishda xatolik:", error);
    } finally {
        await browser.close();
        console.log("Brauzer yopildi.");
    }
}

runBot();
