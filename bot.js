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
            timeout: 60000 
        });

        // 1. BEFORE: Asosiy sahifa skrinshoti
        await page.screenshot({ path: '1_before.png', fullPage: true });
        console.log("1_before.png saqlandi.");

        console.log('"Нафақа ёшига етмаган фуқаро" tugmasi qidirilmoqda...');
        const [button] = await page.$x("//div[contains(text(), 'Нафақа ёшига етмаган фуқаро')] | //button[contains(., 'Нафақа ёшига етмаган фуқаро')] | //span[contains(., 'Нафақа ёшига етмаган фуқаро')]");
        
        if (button) {
            console.log("Tugma topildi, bosilmoqda...");
            
            const [targetPage] = await Promise.all([
                new Promise(resolve => browser.once('targetcreated', async target => resolve(await target.page()))).catch(() => null),
                button.click()
            ]);

            const activePage = targetPage || page;
            await new Promise(r => setTimeout(r, 5000));
            console.log("O'tilgan sahifa manzili:", activePage.url());

            // 2. MIDDLE: Yo'naltirilgan sahifa skrinshoti
            await activePage.screenshot({ path: '2_middle.png', fullPage: true });
            console.log("2_middle.png saqlandi.");

            try {
                const [installBtn] = await activePage.$x("//button[contains(., 'Install') or contains(., 'O\\'rnatish') or contains(., 'Установить') or contains(@aria-label, 'Install')]");
                if (installBtn) {
                    await installBtn.click();
                    console.log("'Install' / 'O'rnatish' tugmasi bosildi.");
                    await new Promise(r => setTimeout(r, 3000));
                }
            } catch (err) {
                console.log("Qo'shimcha Install tugmasi bosilmadi yoki talab qilinmadi.");
            }

            // 3. AFTER: Yakuniy holat skrinshoti
            await activePage.screenshot({ path: '3_after.png', fullPage: true });
            console.log("3_after.png saqlandi.");

        } else {
            console.error("Xatolik: Tugma topilmadi!");
            await page.screenshot({ path: '3_after.png', fullPage: true });
        }

    } catch (error) {
        console.error("Skriptni bajarishda xatolik:", error);
    } finally {
        await browser.close();
        console.log("Brauzer yopildi.");
    }
}

runBot();
