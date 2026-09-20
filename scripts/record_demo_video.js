const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const FRAMES_DIR = path.resolve(__dirname, '../video_recording/frames');
const OUTPUT_VIDEO = path.resolve(__dirname, '../video_recording/seatrelay_demo_walkthrough.mp4');

// Ensure frames directory is clean
if (fs.existsSync(FRAMES_DIR)) {
  fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
}
fs.mkdirSync(FRAMES_DIR, { recursive: true });

let frameCount = 0;
let isRecording = true;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function smoothScroll(page, targetY, durationMs = 1500) {
  await page.evaluate(async ({ targetY, durationMs }) => {
    return new Promise((resolve) => {
      const startY = window.scrollY;
      const distance = targetY - startY;
      const startTime = performance.now();

      function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        // easeInOutQuad
        const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
        window.scrollTo(0, startY + distance * ease);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      }
      requestAnimationFrame(step);
    });
  }, { targetY, durationMs });
  await sleep(durationMs);
}

async function main() {
  console.log('🚀 Launching Puppeteer for SeatRelay video capture...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1920,1080',
      '--disable-gpu',
      '--hide-scrollbars'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  // Frame capture loop running at ~20 fps
  const captureInterval = setInterval(async () => {
    if (!isRecording) return;
    try {
      frameCount++;
      const framePath = path.join(FRAMES_DIR, `frame_${String(frameCount).padStart(6, '0')}.jpg`);
      await page.screenshot({ path: framePath, type: 'jpeg', quality: 85 });
    } catch (err) {
      // Ignore transient screenshot errors during navigation
    }
  }, 50);

  try {
    console.log('🎬 SCENE 1: Landing Page & Problem (0:00 - 0:40)');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await sleep(2500);

    // Smooth scroll through landing page highlights
    await smoothScroll(page, 750, 2000);
    await sleep(2000);
    await smoothScroll(page, 1500, 2000);
    await sleep(2500);
    await smoothScroll(page, 0, 1500);
    await sleep(1500);

    console.log('🎬 SCENE 2: Seller Experience (Rahul Sharma)');
    // Navigate to My Journeys (tickets)
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const ticketsBtn = buttons.find(b => b.textContent && b.textContent.includes('My journeys'));
      if (ticketsBtn) ticketsBtn.click();
    });
    await sleep(3000);

    // Show Journey cards and status
    await smoothScroll(page, 300, 1500);
    await sleep(2500);
    await smoothScroll(page, 0, 1200);
    await sleep(1500);

    console.log('🎬 SCENE 3: Buyer Search & Route Finding (Priya Kumar)');
    // Navigate to Search
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const searchBtn = buttons.find(b => b.textContent && b.textContent.includes('Find a seat'));
      if (searchBtn) searchBtn.click();
    });
    await sleep(3000);

    // Look at sold-out route with resale berth
    await smoothScroll(page, 450, 1800);
    await sleep(3000);

    // Open checkout modal by clicking on a resale berth or seat
    const seatClicked = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const claimBtn = allButtons.find(b => b.textContent && (b.textContent.includes('Claim') || b.textContent.includes('₹850') || b.textContent.includes('Relayed')));
      if (claimBtn) {
        claimBtn.click();
        return true;
      }
      return false;
    });
    await sleep(3000);

    // If modal opened, demonstrate payment selection and DigiLocker
    if (seatClicked) {
      console.log('💳 Demonstrating DigiLocker & e-Rupee in Checkout Modal');
      await sleep(3500);
      // Close modal
      await page.keyboard.press('Escape');
      await sleep(1500);
    }

    console.log('🎬 SCENE 4: Live Portal & Zero Seeded Inventory');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const liveBtn = buttons.find(b => b.textContent && b.textContent.includes('Live Portal'));
      if (liveBtn) liveBtn.click();
    });
    await sleep(3000);

    // Scroll through Live Portal
    await smoothScroll(page, 350, 1500);
    await sleep(2500);

    console.log('🎬 SCENE 5: DigiLocker Identity Gateway Tab');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const kycBtn = buttons.find(b => b.textContent && b.textContent.includes('DigiLocker Identity Gateway'));
      if (kycBtn) kycBtn.click();
    });
    await sleep(3500);

    console.log('🎬 SCENE 6: RBI e-Rupee Programmable Escrow Tab');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const cbdcBtn = buttons.find(b => b.textContent && b.textContent.includes('RBI e-Rupee Programmable Escrow'));
      if (cbdcBtn) cbdcBtn.click();
    });
    await sleep(4000);

    console.log('🎬 SCENE 7: Resale Ledger');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const ledgerBtn = buttons.find(b => b.textContent && b.textContent.includes('Ledger'));
      if (ledgerBtn) ledgerBtn.click();
    });
    await sleep(3000);
    await smoothScroll(page, 400, 1500);
    await sleep(2500);
    await smoothScroll(page, 0, 1200);

    console.log('🎬 SCENE 8: AWS Architecture Reference Modal');
    // Open Command Palette or click platform menu
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const platformBtn = buttons.find(b => b.textContent && b.textContent.includes('Platform'));
      if (platformBtn) platformBtn.click();
    });
    await sleep(1500);

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const archBtn = buttons.find(b => b.textContent && b.textContent.includes('Reference architecture'));
      if (archBtn) archBtn.click();
    });
    await sleep(3000);

    // Cycle through AWS Architecture tabs: Services -> State machine -> One-buyer -> e-Rupee Escrow
    const tabNames = ['State machine', 'Money model', 'One-buyer guarantee', 'e-Rupee (CBDC) Escrow', 'Services'];
    for (const tabName of tabNames) {
      await page.evaluate((name) => {
        const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
        const target = tabs.find(t => t.textContent && t.textContent.includes(name));
        if (target) target.click();
      }, tabName);
      await sleep(2500);
    }

    // Close architecture modal
    await page.keyboard.press('Escape');
    await sleep(1500);

    console.log('🎬 SCENE 9: Automated End-to-End Walkthrough Demonstration');
    // Open Platform -> Live Walkthrough
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const platformBtn = buttons.find(b => b.textContent && b.textContent.includes('Platform'));
      if (platformBtn) platformBtn.click();
    });
    await sleep(1200);

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const demoBtn = buttons.find(b => b.textContent && b.textContent.includes('Live walkthrough'));
      if (demoBtn) demoBtn.click();
    });
    // Wait for the automated walkthrough modal to animate its steps
    await sleep(10000);

    // Close demo progress modal
    await page.keyboard.press('Escape');
    await sleep(2000);

    console.log('🏁 Captured all scenes smoothly!');
  } catch (error) {
    console.error('Error during recording:', error);
  } finally {
    isRecording = false;
    clearInterval(captureInterval);
    await browser.close();
    console.log(`📸 Total frames captured: ${frameCount}`);
  }
}

main().then(() => {
  console.log('Rendering MP4 with ffmpeg...');
  const ffmpegArgs = [
    '-y',
    '-framerate', '20',
    '-pattern_type', 'glob',
    '-i', path.join(FRAMES_DIR, '*.jpg'),
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'fast',
    '-crf', '22',
    OUTPUT_VIDEO
  ];

  const ffmpeg = spawn('/opt/homebrew/bin/ffmpeg', ffmpegArgs);

  ffmpeg.stdout.on('data', (d) => console.log(d.toString()));
  ffmpeg.stderr.on('data', (d) => process.stderr.write(d.toString()));

  ffmpeg.on('close', (code) => {
    if (code === 0) {
      console.log(`\n🎉 High-Definition Video Rendered Successfully: ${OUTPUT_VIDEO}`);
    } else {
      console.error(`\n❌ FFmpeg exited with code ${code}`);
    }
  });
});
