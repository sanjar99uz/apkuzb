const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function runBot() {
    console.log("Bot mobil rejimda va toza kesh bilan ishga tushdi...");
    
    // Har safar mutlaqo toza kesh va tarix uchun yangi vaqtinchalik profil papkasi
    const userDataDir = path.join(__dirname, 'temp_profile_' + Date.now());

    const browser = await puppeteer.launch({
        headless: true,
        userDataDir: userDataDir,
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

        // Mobil qurilma (iPhone) o'lchami va User-Agent'i o'rnatish
        await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');

        console.log("Asosiy saytga kirilmoqda...");
        await page.goto('https://promo-bot-ucad.onrender.com/r/JT_suzcNFZWTL8QfPWCD6Q', { 
            waitUntil: 'networkidle2', 
            timeout: 60000 
        });

        // Sahifa yuklanishi uchun 4 soniya kutish
        await new Promise(r => setTimeout(r, 4000));

        // 1. BEFORE: Tugmali boshlang'ich sahifani saqlash
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
            console.log("Tugma muvaffaqiyatli bosildi! Play Marketga yo'naltirilishi kutilmoqda...");
            await new Promise(r => setTimeout(r, 8000)); // Play Market sahifasi ochilishi uchun kutish
        } else {
            console.log("Xatolik: Tugma topilmadi!");
        }

        // Yo'naltirilgan sahifani (Play Market) aniqlash
        const pages = await browser.pages();
        const activePage = pages.length > 1 ? pages[pages.length - 1] : page;

        console.log("Hozirgi sahifa URL manzili:", activePage.url());

        // 2. MIDDLE: Play Market sahifasini saqlash
        try {
            await activePage.screenshot({ path: '2_middle.png', fullPage: true });
            console.log("2_middle.png (Play Market sahifasi) saqlandi.");
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

        // Vaqtinchalik profilni o'chirib tashlash (keyingi safar yana 100% toza bo'lishi uchun)
        try {
            if (fs.existsSync(userDataDir)) {
                fs.rmSync(userDataDir, { recursive: true, force: true });
            }
        } catch (e) {}

    
