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

    try {
        const context = await browser.createIncognitoBrowserContext();
        const page = await context.newPage();

        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');
        await page.setViewport({ width: 390, height: 844, isMobile: true });

        console.log("Asosiy sahifaga kirilmoqda...");
        await page.goto('https://promo-bot-ucad.onrender.com/r/JT_suzcNFZWTL8QfPWCD6Q', { 
            waitUntil: 'networkidle2', 
            timeout: 90000 
        });

        // 1. BEFORE: Asosiy sahifa ochilgandagi skrinshot
        await page.screenshot({ path: '1_before.png', fullPage: true });
        console.log("1_before.png muvaffaqiyatli saqlandi.");

        console.log('"Нафақа ёшига етмаган фуқаро" tugmasi qidirilmoqda...');
        
        // Elementni matn bo'yicha xatosiz topib bosish (Puppeteer yangi versiyalari uchun mukammal usul)
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
            console.log("Tugma topildi va bosildi! Yo'naltirilishi kutilmoqda...");
            
            // Sahifa ochilishi yoki yo'naltirilishi uchun biroz ko'proq vaqt beramiz
            await new Promise(r => setTimeout(r, 7000));

            // Ochilgan yangi oynani yoki asosiy oynani aniqlash
            const pages = await browser.pages();
            const activePage = pages.length > 1 ? pages[pages.length - 1] : page;
            
            console.log("Hozirgi sahifa manzili:", activePage.url());

            // 2. MIDDLE: Yo'naltirilgan sahifa skrinshoti
            await activePage.screenshot({ path: '2_middle.png', fullPage: true });
            console.log("2_middle.png muvaffaqiyatli saqlandi.");

            // Install / O'rnatish tugmasini bosishga urinish
            try {
                await activePage.evaluate(() => {
                    const elements = Array.from(document.querySelectorAll('button, a, div'));
                    const installBtn = elements.find(el => {
                        const text = el.textContent ? el.textContent.toLowerCase() : '';
                        return text.includes('install') || text.includes("o'rnatish") || text.includes('установить');
                    });
                    if (installBtn) installBtn.click();
                });
                console.log("Install / O'rnatish tugmasi tekshirildi.");
                await new Promise(r => setTimeout(r, 4000));
            } catch (err) {
                console.log("Qo'shimcha tugma bosilmadi yoki talab qilinmadi.");
            }

            // 3. AFTER: Yakuniy holat skrinshoti
            await activePage.screenshot({ path: '3_after.png', fullPage: true });
            console.log("3_after.png muvaffaqiyatli saqlandi.");

        } else {
            console.error("Xatolik: 'Нафақа ёшига етмаган фуқаро' matnli tugma topilmadi!");
            await page.screenshot({ path: '3_after.png', fullPage: true });
        }

    } catch (error) {
        console.error("Skriptni bajarishda xatolik yuz berdi:", error);
    } finally {
        await browser.close();
        console.log("Brauzer yopildi.");
    }
}

runBot();
