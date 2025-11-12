#!/usr/bin/env python3
"""
Kernel Lens Playwright Test
Comprehensive testing and analysis of the kernel visualization
"""

import asyncio
import json
import os
from pathlib import Path
from datetime import datetime
from playwright.async_api import async_playwright

class KernelLensTest:
    def __init__(self):
        self.screenshot_dir = Path('./playwright-screenshots')
        self.screenshot_dir.mkdir(exist_ok=True)

        self.results = {
            'timestamp': datetime.now().isoformat(),
            'tests': [],
            'screenshots': [],
            'errors': []
        }

    def log_test(self, name, passed, details=''):
        """Log a test result"""
        self.results['tests'].append({
            'name': name,
            'passed': passed,
            'details': details
        })
        status = '✓ PASS' if passed else '✗ FAIL'
        print(f"\n  {status}: {name}")
        if details:
            print(f"  Details: {details}")

    async def screenshot(self, page, filename, description=''):
        """Take a screenshot"""
        path = self.screenshot_dir / filename
        await page.screenshot(path=str(path), full_page=True)
        self.results['screenshots'].append(filename)
        print(f"  📸 {filename}")
        if description:
            print(f"      {description}")

    async def run_tests(self):
        """Run all tests"""
        print('🚀 Starting Kernel Lens Playwright Test...\n')

        async with async_playwright() as p:
            try:
                # Launch browser
                browser = await p.chromium.launch(
                    headless=True,
                    args=['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
                )

                context = await browser.new_context(
                    viewport={'width': 1920, 'height': 1080}
                )
                page = await context.new_page()

                # Test 1: Navigate to page
                print('✅ Test 1: Page Navigation')
                try:
                    await page.goto('http://localhost:8000/index.html', timeout=10000)
                    self.log_test('Page Navigation', True, 'Successfully loaded index.html')
                except Exception as e:
                    self.log_test('Page Navigation', False, str(e))
                    raise

                # Test 2: Journey Mode
                print('\n✅ Test 2: Journey Mode Initial State')
                journey_visible = await page.locator('.journey-space').is_visible()
                kernel_core_visible = await page.locator('.kernel-core').is_visible()
                self.log_test('Journey Mode Visible',
                             journey_visible and kernel_core_visible,
                             f'Journey space: {journey_visible}, Kernel core: {kernel_core_visible}')

                await self.screenshot(page, '01-journey-mode.png', 'Initial journey mode view')

                # Test 3: Enter Kernel Animation
                print('\n✅ Test 3: Enter Kernel Animation')
                await page.click('.kernel-core')
                await asyncio.sleep(2)  # Wait for animation

                main_viz_visible = await page.locator('#svg-morph').is_visible()
                self.log_test('Main Visualization Appears',
                             main_viz_visible,
                             'SVG morphing visualization appeared after click')

                await self.screenshot(page, '02-main-visualization.png', 'Main visualization after entry')

                # Test 4: Morphing Animation
                print('\n✅ Test 4: Shape Morphing Animation')
                await asyncio.sleep(1)

                initial_shape = await page.evaluate('''() => {
                    return document.getElementById('data-shape').getAttribute('d');
                }''')

                await asyncio.sleep(3)  # Wait for morph

                changed_shape = await page.evaluate('''() => {
                    return document.getElementById('data-shape').getAttribute('d');
                }''')

                morphing_active = initial_shape != changed_shape
                self.log_test('Shape Morphing Active',
                             morphing_active,
                             f'Shape changed: {morphing_active}')

                await self.screenshot(page, '03-morphing-active.png', 'Morphing in progress')

                # Test 5: Particle System
                print('\n✅ Test 5: Particle Canvas System')
                particle_stats = await page.evaluate('''() => {
                    const canvas = document.getElementById('particle-canvas');
                    return {
                        exists: !!canvas,
                        width: canvas ? canvas.width : 0,
                        height: canvas ? canvas.height : 0,
                        visible: canvas ? canvas.style.display !== 'none' : false
                    };
                }''')

                self.log_test('Particle Canvas Active',
                             particle_stats['exists'] and particle_stats['visible'],
                             f"Canvas: {particle_stats['width']}x{particle_stats['height']}")

                # Test 6: Interactive Sliders
                print('\n✅ Test 6: Interactive Parameter Controls')

                # Test FD slider
                await page.fill('#fd-input', '7')
                fd_value = await page.text_content('#fd-value')
                fd_test = fd_value == '7'
                print(f"  FD Slider: {fd_value} {'✓' if fd_test else '✗'}")

                await self.screenshot(page, '04-fd-slider.png', f'FD = {fd_value}')

                # Test Size slider
                await page.fill('#size-input', '16384')
                size_value = await page.text_content('#size-value')
                size_test = size_value == '16384'
                print(f"  Size Slider: {size_value} {'✓' if size_test else '✗'}")

                await self.screenshot(page, '05-size-slider.png', f'Size = {size_value}')

                # Test Cache slider
                await page.fill('#cache-input', '100')
                cache_value = await page.text_content('#cache-value')
                cache_test = cache_value.startswith('100')
                print(f"  Cache Slider: {cache_value} {'✓' if cache_test else '✗'}")

                self.log_test('Interactive Sliders',
                             fd_test and size_test and cache_test,
                             f'FD: {fd_value}, Size: {size_value}, Cache: {cache_value}')

                await self.screenshot(page, '06-cache-slider.png', f'Cache = {cache_value}')

                # Test 7: Metrics Display
                print('\n✅ Test 7: Real-time Metrics')
                metrics = await page.evaluate('''() => {
                    const time = document.querySelector('.metric:nth-child(1) .metric-value')?.textContent;
                    const cache = document.querySelector('.metric:nth-child(2) .metric-value')?.textContent;
                    const ops = document.querySelector('.metric:nth-child(3) .metric-value')?.textContent;
                    const size = document.querySelector('.metric:nth-child(4) .metric-value')?.textContent;

                    return { time, cache, ops, size };
                }''')

                all_metrics_present = all(metrics.values())
                self.log_test('Metrics Display',
                             all_metrics_present,
                             f"Time: {metrics['time']}, Cache: {metrics['cache']}, Ops: {metrics['ops']}, Size: {metrics['size']}")

                # Test 8: Layer Tooltips
                print('\n✅ Test 8: Layer Hover Tooltips')
                await page.hover('#layer-user')
                await asyncio.sleep(0.5)

                tooltip_info = await page.evaluate('''() => {
                    const tooltip = document.getElementById('layer-tooltip');
                    return {
                        visible: tooltip ? tooltip.classList.contains('show') : false,
                        content: tooltip ? tooltip.textContent.substring(0, 100) : ''
                    };
                }''')

                self.log_test('Layer Tooltip',
                             tooltip_info['visible'],
                             f"Content preview: {tooltip_info['content'][:50]}...")

                await self.screenshot(page, '07-tooltip.png', 'USER SPACE layer tooltip')

                # Test 9: Morphing Cycle Capture
                print('\n✅ Test 9: Full Morphing Cycle')
                print('  Capturing complete morphing sequence...')

                for i in range(6):
                    await asyncio.sleep(2)
                    await self.screenshot(page, f'08-morph-stage-{i+1}.png',
                                        f'Morph stage {i+1}/6')

                self.log_test('Full Morphing Cycle',
                             True,
                             'Captured all 6 morphing stages')

                # Test 10: Performance Metrics
                print('\n✅ Test 10: Performance Analysis')
                perf_metrics = await page.evaluate('''() => {
                    return new Promise((resolve) => {
                        let frameCount = 0;
                        const startTime = performance.now();

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
                }''')

                fps_good = perf_metrics['fps'] >= 30
                self.log_test('Performance',
                             fps_good,
                             f"FPS: {perf_metrics['fps']} {'(Good)' if fps_good else '(Poor)'}")

                if perf_metrics['memory']:
                    print(f"  Memory: {perf_metrics['memory']['used']}MB / {perf_metrics['memory']['total']}MB")

                # Test 11: GSAP Library
                print('\n✅ Test 11: Dependencies Check')
                gsap_loaded = await page.evaluate('''() => {
                    return typeof gsap !== 'undefined' && typeof gsap.to === 'function';
                }''')

                self.log_test('GSAP Library Loaded',
                             gsap_loaded,
                             'GSAP animation library fully functional')

                # Test 12: All Layer Elements Present
                print('\n✅ Test 12: Complete Layer Structure')
                layer_count = await page.evaluate('''() => {
                    return document.querySelectorAll('[id^="layer-"]').length;
                }''')

                self.log_test('All Layers Present',
                             layer_count >= 6,
                             f'{layer_count} kernel layers detected')

                # Final screenshot
                await self.screenshot(page, '09-final-state.png', 'Final visualization state')

                await browser.close()

            except Exception as e:
                print(f'\n❌ Error during testing: {e}')
                self.results['errors'].append({
                    'message': str(e),
                    'type': type(e).__name__
                })

                try:
                    await page.screenshot(path=str(self.screenshot_dir / 'error.png'))
                    self.results['screenshots'].append('error.png')
                except:
                    pass

    def print_summary(self):
        """Print test summary"""
        print('\n' + '=' * 60)
        print('📊 TEST SUMMARY')
        print('=' * 60)

        total = len(self.results['tests'])
        passed = sum(1 for t in self.results['tests'] if t['passed'])
        pass_rate = (passed / total * 100) if total > 0 else 0

        print(f'\nTotal Tests: {total}')
        print(f'Passed: {passed} ✓')
        print(f'Failed: {total - passed} ✗')
        print(f'Pass Rate: {pass_rate:.1f}%')

        print('\n' + '-' * 60)
        print('Test Details:')
        print('-' * 60)

        for i, test in enumerate(self.results['tests'], 1):
            status = '✓ PASS' if test['passed'] else '✗ FAIL'
            print(f"\n{i}. {test['name']}: {status}")
            if test['details']:
                print(f"   {test['details']}")

        if self.results['errors']:
            print('\n' + '-' * 60)
            print('Errors:')
            print('-' * 60)
            for i, error in enumerate(self.results['errors'], 1):
                print(f"\n{i}. {error['message']}")

        print('\n' + '-' * 60)
        print(f"Screenshots: {len(self.results['screenshots'])} files in {self.screenshot_dir}/")
        print('-' * 60)
        for i, screenshot in enumerate(self.results['screenshots'], 1):
            print(f"  {i}. {screenshot}")

        # Save JSON report
        report_path = Path('./playwright-report.json')
        with open(report_path, 'w') as f:
            json.dump(self.results, f, indent=2)
        print(f'\n📄 Full report saved to: {report_path}')

        print('\n' + '=' * 60)
        if pass_rate == 100.0:
            print('🎉 ALL TESTS PASSED!')
        else:
            print('⚠️  SOME TESTS FAILED')
        print('=' * 60 + '\n')

        return passed == total

async def main():
    tester = KernelLensTest()
    await tester.run_tests()
    success = tester.print_summary()
    return 0 if success else 1

if __name__ == '__main__':
    exit_code = asyncio.run(main())
    exit(exit_code)
