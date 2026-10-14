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
            await new Promise(r => setTimeout(r, 8000)); // Play Market sahifasi ochil
        
