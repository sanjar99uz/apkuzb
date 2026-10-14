const puppeteer = require('puppeteer');

async function runBot() {
    console.log("Bot ishga tushdi...");
    
    // Puppeteer'ni GitHub Actions da ishlashi uchun mos parametrlar bilan ochish
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

    try {
        // Har safar mutlaqo yangi, kesh va tarixsiz (incognito) sessiya ochish
        const context = await browser.createIncognitoBrowserContext();
        const page = await context.newPage();

        // Mobil qurilma sifatida ko'rinish uchun User-Agent va Viewport o'rnatish
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');
        await page.setViewport({ width: 390, height: 844, isMobile: true });

        console.log("Asosiy sahifaga kirilmoqda: https://promo-bot-ucad.onrender.com/r/JT_suzcNFZWTL8QfPWCD6Q");
        await page.goto('https://promo-bot-ucad.onrender.com/r/JT_suzcNFZWTL8QfPWCD6Q', { 
            waitUntil: 'networkidle2', 
            timeout: 60000 
        });

        console.log('"Нафақа ёшига етмаган фуқаро" tugmasi qidirilmoqda...');
        
        // Rasmda ko'rsatilgan matnli tugmani topish va bosish[span_2](start_span)[span_2](end_span)
        const [button] = await page.$x("//div[contains(text(), 'Нафақа ёшига етмаган фуқаро')] | //button[contains(., 'Нафақа ёшига етмаган фуқаро')] | //span[contains(., 'Нафақа ёшига етмаган фуқаро')]");
        
        if (button) {
            console.log("Tugma topildi, bosilmoqda...");
            
            // Tugma bosilganda yangi sahifa yoki yo'naltirish yuz berishini kuzatish
            const [targetPage] = await Promise.all([
                new Promise(resolve => browser.once('targetcreated', async target => resolve(await target.page()))).catch(() => null),
                button.click()
            ]);

            const activePage = targetPage || page;
            
            // Sahifa yuklanishini biroz kutish
            await new Promise(r => setTimeout(r, 4000));
            console.log("Hozirgi sahifa manzili:", activePage.url());

            // Ochilgan oynadan (Play Market yoki boshqa) Install / O'rnatish tugmasini qidirib bosish
            try {
                const [installBtn] = await activePage.$x("//button[contains(., 'Install') or contains(., 'O\\'rnatish') or contains(., 'Установить') or contains(@aria-label, 'Install')]");
                if (installBtn) {
                    await installBtn.click();
                    console.log("'Install' / 'O'rnatish' tugmasi muvaffaqiyatli bosildi!");
                } else {
                    console.log("Yo'naltirilgan havolaga muvaffaqiyatli o'tildi (tugmaning o'zi yetarli).");
                }
            } catch (err) {
                console.log("Qo'shimcha tugmani bosish talab qilinmadi yoki topilmadi.");
            }

        } else {
            console.error("Xatolik: 'Нафақа ёшига етмаган фуқаро' tugmasi topilmadi!");
        }

    } catch (error) {
        console.error("Skriptni bajarishda xatolik yuz berdi:", error);
    } finally {
        await browser.close();
        console.log("Brauzer yopildi va sessiya tozalandi.");
    }
}

runBot();
