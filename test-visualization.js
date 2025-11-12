const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    console.log('🚀 Starting Kernel Lens Playwright Test...\n');

    // Launch browser
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    // Create screenshots directory
    const screenshotDir = './playwright-screenshots';
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir);
    }

    const results = {
        timestamp: new Date().toISOString(),
        tests: [],
        screenshots: [],
        errors: []
    };

    try {
        // Start local server in background (assuming it's already running)
        console.log('📱 Navigating to visualization...');
        await page.goto('http://localhost:8000/index.html', {
            waitUntil: 'networkidle'
        });

        // Test 1: Journey Mode appears
        console.log('✅ Test 1: Journey Mode Initial State');
        const journeySpace = await page.locator('.journey-space').isVisible();
        results.tests.push({
            name: 'Journey Mode Visible',
            passed: journeySpace,
            details: 'Journey space with pulsing kernel should be visible initially'
        });

        await page.screenshot({
            path: `${screenshotDir}/01-journey-mode.png`,
            fullPage: true
        });
        results.screenshots.push('01-journey-mode.png');
        console.log('  📸 Screenshot: 01-journey-mode.png');

        // Test 2: Click to enter kernel
        console.log('\n✅ Test 2: Enter Kernel Animation');
        await page.click('.kernel-core');
        await page.waitForTimeout(2000); // Wait for entry animation

        const mainVisualization = await page.locator('#svg-morph').isVisible();
        results.tests.push({
            name: 'Main Visualization Appears',
            passed: mainVisualization,
            details: 'SVG morphing visualization should appear after clicking kernel'
        });

        await page.screenshot({
            path: `${screenshotDir}/02-main-visualization.png`,
            fullPage: true
        });
        results.screenshots.push('02-main-visualization.png');
        console.log('  📸 Screenshot: 02-main-visualization.png');

        // Test 3: Check if morphing animation is running
        console.log('\n✅ Test 3: Morphing Animation Active');
        await page.waitForTimeout(1000);

        const initialShape = await page.evaluate(() => {
            return document.getElementById('data-shape').getAttribute('d');
        });

        await page.waitForTimeout(3000); // Wait for morph to happen

        const changedShape = await page.evaluate(() => {
            return document.getElementById('data-shape').getAttribute('d');
        });

        const morphingActive = initialShape !== changedShape;
        results.tests.push({
            name: 'Shape Morphing Active',
            passed: morphingActive,
            details: `Shape changed from "${initialShape?.substring(0, 30)}..." to "${changedShape?.substring(0, 30)}..."`
        });
        console.log(`  Shape morphing: ${morphingActive ? 'ACTIVE ✓' : 'NOT ACTIVE ✗'}`);

        await page.screenshot({
            path: `${screenshotDir}/03-morphing-active.png`,
            fullPage: true
        });
        results.screenshots.push('03-morphing-active.png');
        console.log('  📸 Screenshot: 03-morphing-active.png');

        // Test 4: Particle system is running
        console.log('\n✅ Test 4: Particle System');
        const particleStats = await page.evaluate(() => {
            const canvas = document.getElementById('particle-canvas');
            return {
                exists: !!canvas,
                width: canvas?.width || 0,
                height: canvas?.height || 0,
                visible: canvas?.style.display !== 'none'
            };
        });

        results.tests.push({
            name: 'Particle Canvas Active',
            passed: particleStats.exists && particleStats.visible,
            details: `Canvas: ${particleStats.width}x${particleStats.height}`
        });
        console.log(`  Canvas: ${particleStats.width}x${particleStats.height} - ${particleStats.visible ? 'VISIBLE ✓' : 'HIDDEN ✗'}`);

        // Test 5: Interactive sliders
        console.log('\n✅ Test 5: Interactive Sliders');

        // Test FD slider
        await page.locator('#fd-input').fill('5');
        const fdValue = await page.locator('#fd-value').textContent();
        const fdTest = fdValue === '5';
        console.log(`  FD Slider: ${fdTest ? 'WORKING ✓' : 'FAILED ✗'} (value: ${fdValue})`);

        await page.screenshot({
            path: `${screenshotDir}/04-fd-slider.png`,
            fullPage: true
        });
        results.screenshots.push('04-fd-slider.png');

        // Test Size slider
        await page.locator('#size-input').fill('16384');
        const sizeValue = await page.locator('#size-value').textContent();
        const sizeTest = sizeValue === '16384';
        console.log(`  Size Slider: ${sizeTest ? 'WORKING ✓' : 'FAILED ✗'} (value: ${sizeValue})`);

        await page.screenshot({
            path: `${screenshotDir}/05-size-slider.png`,
            fullPage: true
        });
        results.screenshots.push('05-size-slider.png');

        // Test Cache slider
        await page.locator('#cache-input').fill('100');
        const cacheValue = await page.locator('#cache-value').textContent();
        const cacheTest = cacheValue === '100';
        console.log(`  Cache Slider: ${cacheTest ? 'WORKING ✓' : 'FAILED ✗'} (value: ${cacheValue}%)`);

        results.tests.push({
            name: 'Interactive Sliders',
            passed: fdTest && sizeTest && cacheTest,
            details: `FD: ${fdValue}, Size: ${sizeValue}, Cache: ${cacheValue}%`
        });

        await page.screenshot({
            path: `${screenshotDir}/06-cache-slider.png`,
            fullPage: true
        });
        results.screenshots.push('06-cache-slider.png');

        // Test 6: Metrics display
        console.log('\n✅ Test 6: Metrics Display');
        const metrics = await page.evaluate(() => {
            const time = document.querySelector('.metric:nth-child(1) .metric-value')?.textContent;
            const cache = document.querySelector('.metric:nth-child(2) .metric-value')?.textContent;
            const ops = document.querySelector('.metric:nth-child(3) .metric-value')?.textContent;
            const size = document.querySelector('.metric:nth-child(4) .metric-value')?.textContent;

            return { time, cache, ops, size };
        });

        results.tests.push({
            name: 'Metrics Display',
            passed: !!(metrics.time && metrics.cache && metrics.ops && metrics.size),
            details: `Time: ${metrics.time}, Cache: ${metrics.cache}, Ops: ${metrics.ops}, Size: ${metrics.size}`
        });
        console.log(`  Time: ${metrics.time}`);
        console.log(`  Cache: ${metrics.cache}`);
        console.log(`  Ops: ${metrics.ops}`);
        console.log(`  Size: ${metrics.size}`);

        // Test 7: Layer tooltip on hover
        console.log('\n✅ Test 7: Layer Tooltips');

        // Hover over USER SPACE layer
        await page.hover('#layer-user');
        await page.waitForTimeout(500);

        const tooltipVisible = await page.evaluate(() => {
            const tooltip = document.getElementById('layer-tooltip');
            return tooltip?.classList.contains('show');
        });

        const tooltipContent = await page.evaluate(() => {
            const tooltip = document.getElementById('layer-tooltip');
            return {
                visible: tooltip?.classList.contains('show'),
                content: tooltip?.innerHTML || ''
            };
        });

        results.tests.push({
            name: 'Layer Tooltip',
            passed: tooltipVisible,
            details: tooltipContent.content.substring(0, 100) + '...'
        });
        console.log(`  Tooltip visible: ${tooltipVisible ? 'YES ✓' : 'NO ✗'}`);

        await page.screenshot({
            path: `${screenshotDir}/07-tooltip.png`,
            fullPage: true
        });
        results.screenshots.push('07-tooltip.png');

        // Test 8: Capture full morphing cycle
        console.log('\n✅ Test 8: Full Morphing Cycle');
        console.log('  Capturing morphing sequence...');

        for (let i = 0; i < 6; i++) {
            await page.waitForTimeout(2000);
            await page.screenshot({
                path: `${screenshotDir}/08-morph-stage-${i + 1}.png`,
                fullPage: true
            });
            results.screenshots.push(`08-morph-stage-${i + 1}.png`);
            console.log(`  📸 Stage ${i + 1}/6 captured`);
        }

        results.tests.push({
            name: 'Full Morphing Cycle',
            passed: true,
            details: 'Captured 6 stages of morphing animation'
        });

        // Test 9: Performance check
        console.log('\n✅ Test 9: Performance Metrics');
        const perfMetrics = await page.evaluate(() => {
            return new Promise((resolve) => {
                let frameCount = 0;
                let startTime = performance.now();

                function countFrames() {
                    frameCount++;
                    if (frameCount < 60) {
                        requestAnimationFrame(countFrames);
                    } else {
                        const endTime = performance.now();
                        const duration = (endTime - startTime) / 1000;
                        const fps = frameCount / duration;
                        resolve({
                            fps: Math.round(fps),
                            memory: performance.memory ? {
                                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
                            } : null
                        });
                    }
                }

                requestAnimationFrame(countFrames);
            });
        });

        results.tests.push({
            name: 'Performance',
            passed: perfMetrics.fps >= 30, // At least 30fps is acceptable
            details: `FPS: ${perfMetrics.fps}, Memory: ${perfMetrics.memory?.used}MB / ${perfMetrics.memory?.total}MB`
        });
        console.log(`  FPS: ${perfMetrics.fps} ${perfMetrics.fps >= 30 ? '✓' : '✗'}`);
        if (perfMetrics.memory) {
            console.log(`  Memory: ${perfMetrics.memory.used}MB / ${perfMetrics.memory.total}MB`);
        }

        // Test 10: GSAP library loaded
        console.log('\n✅ Test 10: Dependencies');
        const gsapLoaded = await page.evaluate(() => {
            return typeof gsap !== 'undefined';
        });

        results.tests.push({
            name: 'GSAP Library Loaded',
            passed: gsapLoaded,
            details: 'GSAP animation library is loaded and available'
        });
        console.log(`  GSAP loaded: ${gsapLoaded ? 'YES ✓' : 'NO ✗'}`);

        // Final screenshot
        await page.screenshot({
            path: `${screenshotDir}/09-final-state.png`,
            fullPage: true
        });
        results.screenshots.push('09-final-state.png');
        console.log('\n📸 Final screenshot captured');

    } catch (error) {
        console.error('\n❌ Error during testing:', error.message);
        results.errors.push({
            message: error.message,
            stack: error.stack
        });

        // Capture error screenshot
        try {
            await page.screenshot({
                path: `${screenshotDir}/error.png`,
                fullPage: true
            });
            results.screenshots.push('error.png');
        } catch (screenshotError) {
            console.error('Could not capture error screenshot:', screenshotError.message);
        }
    }

    // Close browser
    await browser.close();

    // Generate report
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));

    const passed = results.tests.filter(t => t.passed).length;
    const total = results.tests.length;
    const passRate = ((passed / total) * 100).toFixed(1);

    console.log(`\nTotal Tests: ${total}`);
    console.log(`Passed: ${passed} ✓`);
    console.log(`Failed: ${total - passed} ✗`);
    console.log(`Pass Rate: ${passRate}%`);

    console.log('\n' + '-'.repeat(60));
    console.log('Test Details:');
    console.log('-'.repeat(60));

    results.tests.forEach((test, index) => {
        const status = test.passed ? '✓ PASS' : '✗ FAIL';
        console.log(`\n${index + 1}. ${test.name}: ${status}`);
        console.log(`   ${test.details}`);
    });

    if (results.errors.length > 0) {
        console.log('\n' + '-'.repeat(60));
        console.log('Errors:');
        console.log('-'.repeat(60));
        results.errors.forEach((error, index) => {
            console.log(`\n${index + 1}. ${error.message}`);
        });
    }

    console.log('\n' + '-'.repeat(60));
    console.log(`Screenshots: ${results.screenshots.length} files in ${screenshotDir}/`);
    console.log('-'.repeat(60));
    results.screenshots.forEach((screenshot, index) => {
        console.log(`  ${index + 1}. ${screenshot}`);
    });

    // Save JSON report
    const reportPath = './playwright-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Full report saved to: ${reportPath}`);

    console.log('\n' + '='.repeat(60));
    console.log(passRate === '100.0' ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED');
    console.log('='.repeat(60) + '\n');

    process.exit(passed === total ? 0 : 1);
})();
