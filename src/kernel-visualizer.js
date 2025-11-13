// ============================================
// KERNEL VISUALIZER - Main Visualization Class
// ============================================
// Refactored from kernel-lens.js to support multiple instances

import { shapes, layers as defaultLayers } from './syscalls/read-config.js';
import { getLevelConfig, DEFAULT_LEVEL } from './levels/level-configs.js';

export class KernelVisualizer {
    constructor(containerId, config = {}) {
        // Configuration
        this.containerId = containerId;
        this.difficulty = config.difficulty || DEFAULT_LEVEL;
        this.levelConfig = getLevelConfig(this.difficulty);

        // Get container elements
        this.mainStage = document.getElementById(containerId);
        if (!this.mainStage) {
            throw new Error(`Container '${containerId}' not found`);
        }

        // State
        this.state = {
            fd: config.fd || 3,
            size: config.size || 4096,
            cacheHit: config.cacheHit || 85,
            currentLayer: 0
        };

        // Layer configuration (deep copy to allow per-instance modifications)
        this.shapes = { ...shapes };
        this.layers = JSON.parse(JSON.stringify(defaultLayers));

        // Animation timeline
        this.morphTimeline = null;

        // Canvas and particles
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationFrameId = null;

        // Initialize
        this.init();
    }

    // ====================
    // INITIALIZATION
    // ====================
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.createMorphingFlow();
        this.updateMetrics();
        this.startParticleAnimation();
    }

    setupCanvas() {
        this.canvas = document.getElementById('canvas-particles');
        if (!this.canvas) {
            console.warn('Canvas element not found');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    setupEventListeners() {
        // File descriptor slider
        const fdInput = document.getElementById('fd-input');
        if (fdInput) {
            fdInput.addEventListener('input', (e) => this.onFdChange(e));
        }

        // Buffer size slider
        const sizeInput = document.getElementById('size-input');
        if (sizeInput) {
            sizeInput.addEventListener('input', (e) => this.onSizeChange(e));
        }

        // Cache hit rate slider
        const cacheInput = document.getElementById('cache-input');
        if (cacheInput) {
            cacheInput.addEventListener('input', (e) => this.onCacheChange(e));
        }

        // Window resize
        window.addEventListener('resize', () => this.onResize());
    }

    // ====================
    // PARTICLE SYSTEM
    // ====================
    startParticleAnimation() {
        const animate = () => {
            if (!this.ctx) return;

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            for (let i = this.particles.length - 1; i >= 0; i--) {
                if (!this.particles[i].update()) {
                    this.particles.splice(i, 1);
                } else {
                    this.particles[i].draw(this.ctx);
                }
            }

            this.ctx.globalAlpha = 1.0;
            this.animationFrameId = requestAnimationFrame(animate);
        };

        animate();
    }

    emitParticles(count, fromY, toY, color, isCacheHit = false) {
        if (!this.canvas) return;

        // Adjust count based on difficulty level
        const adjustedCount = Math.ceil(count * this.levelConfig.particleCount);

        for (let i = 0; i < adjustedCount; i++) {
            this.particles.push(new Particle(
                this.canvas.width / 2 + (Math.random() - 0.5) * 100,
                fromY,
                toY,
                color,
                isCacheHit
            ));
        }
    }

    // ====================
    // GSAP MORPHING ANIMATION
    // ====================
    createMorphingFlow() {
        if (this.morphTimeline) {
            this.morphTimeline.kill();
        }

        this.morphTimeline = gsap.timeline({ repeat: -1, repeatDelay: 1 });

        this.layers.forEach((layer, i) => {
            if (i === 0) return;

            const duration = 1.5 / this.levelConfig.animationSpeed;
            const prevLayer = this.layers[i - 1];
            const startTime = i * 2 / this.levelConfig.animationSpeed;

            // Morph shape with elastic easing
            this.morphTimeline.to('#data-shape', {
                attr: { d: this.shapes[layer.shape] },
                fill: layer.color,
                duration: duration,
                ease: "elastic.out(1, 0.5)"
            }, startTime);

            // Update label text
            this.morphTimeline.to('#data-label', {
                textContent: layer.label,
                duration: 0.3,
                ease: "power2.out"
            }, startTime);

            // Move label vertically
            this.morphTimeline.to('#data-label', {
                attr: { y: layer.y + 5 },
                duration: duration,
                ease: "elastic.out(1, 0.5)"
            }, startTime);

            // Highlight active layer
            this.morphTimeline.call(() => {
                this.highlightLayer(i);
                this.state.currentLayer = i;
            }, null, startTime);

            // Emit particles during transition
            this.morphTimeline.call(() => {
                const particleCount = Math.ceil(this.state.size / 200);
                const isCacheHit = Math.random() * 100 < this.state.cacheHit;

                this.emitParticles(particleCount, prevLayer.y, layer.y, layer.color, isCacheHit);

                // Cache miss: emit more particles to lower layers
                if (!isCacheHit && i < this.layers.length - 1) {
                    setTimeout(() => {
                        this.emitParticles(
                            Math.ceil(particleCount / 2),
                            layer.y,
                            this.layers[i + 1].y,
                            this.layers[i + 1].color,
                            false
                        );
                    }, 500);
                }
            }, null, startTime);
        });
    }

    highlightLayer(layerIndex) {
        // Deactivate all layers
        document.querySelectorAll('.stage-label').forEach(el => {
            el.classList.remove('active');
        });
        document.querySelectorAll('.layer-zone').forEach(el => {
            el.classList.remove('active');
        });

        // Activate current layer
        const layerId = ['user', 'syscall', 'vfs', 'fs', 'block', 'device'][layerIndex];
        const layerGroup = document.getElementById(`layer-${layerId}`);
        if (layerGroup) {
            const label = layerGroup.querySelector('.stage-label');
            const zone = layerGroup.querySelector('.layer-zone');
            if (label) label.classList.add('active');
            if (zone) zone.classList.add('active');
        }
    }

    // ====================
    // METRICS & UI UPDATES
    // ====================
    updateMetrics() {
        const ioOps = Math.ceil((100 - this.state.cacheHit) / 100 * Math.ceil(this.state.size / 4096));
        const totalTime = 1 + 0.5 + 2 + (ioOps * 10) + (ioOps * 150);

        // Animate metrics with GSAP
        const timeMetric = document.getElementById('time-metric');
        if (timeMetric) {
            gsap.to(timeMetric, {
                textContent: totalTime.toFixed(1) + 'μs',
                duration: 0.5,
                snap: { textContent: 0.1 }
            });
        }

        const cacheMetric = document.getElementById('cache-metric');
        if (cacheMetric) {
            gsap.to(cacheMetric, {
                textContent: this.state.cacheHit + '%',
                duration: 0.5
            });
        }

        const ioMetric = document.getElementById('io-metric');
        if (ioMetric) {
            gsap.to(ioMetric, {
                textContent: ioOps,
                duration: 0.5,
                snap: { textContent: 1 }
            });
        }

        const transferMetric = document.getElementById('transfer-metric');
        if (transferMetric) {
            gsap.to(transferMetric, {
                textContent: Math.ceil(this.state.size / 1024) + 'KB',
                duration: 0.5
            });
        }
    }

    // ====================
    // EVENT HANDLERS
    // ====================
    onFdChange(e) {
        this.state.fd = parseInt(e.target.value);
        const fdDisplay = document.getElementById('fd-display');
        if (fdDisplay) {
            fdDisplay.textContent = `fd=${this.state.fd}`;
        }
        this.layers[0].label = `fd=${this.state.fd}`;
        this.updateMetrics();
    }

    onSizeChange(e) {
        this.state.size = parseInt(e.target.value);
        const sizeDisplay = document.getElementById('size-display');
        if (sizeDisplay) {
            sizeDisplay.textContent = `${this.state.size}B`;
        }
        this.updateMetrics();
    }

    onCacheChange(e) {
        this.state.cacheHit = parseInt(e.target.value);
        const cacheDisplay = document.getElementById('cache-display');
        if (cacheDisplay) {
            cacheDisplay.textContent = `${this.state.cacheHit}%`;
        }
        this.updateMetrics();
    }

    onResize() {
        if (this.canvas) {
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
        }
    }

    // ====================
    // PUBLIC API
    // ====================
    play() {
        if (this.morphTimeline) {
            this.morphTimeline.play();
        }
    }

    pause() {
        if (this.morphTimeline) {
            this.morphTimeline.pause();
        }
    }

    setDifficulty(level) {
        this.difficulty = level;
        this.levelConfig = getLevelConfig(level);
        this.createMorphingFlow(); // Recreate with new speed
    }

    destroy() {
        // Clean up
        if (this.morphTimeline) {
            this.morphTimeline.kill();
        }
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.particles = [];
    }
}

// ====================
// PARTICLE CLASS
// ====================
class Particle {
    constructor(x, y, targetY, color, isCacheHit) {
        this.x = x;
        this.y = y;
        this.targetY = targetY;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = 0;
        this.color = color;
        this.life = 1.0;
        this.isCacheHit = isCacheHit;
        this.size = isCacheHit ? 3 : 2;
    }

    update() {
        // Spring physics
        const dy = this.targetY - this.y;
        const springConstant = 0.05;
        const damping = 0.92;

        this.vy += dy * springConstant;
        this.vy *= damping;

        this.y += this.vy;
        this.x += this.vx;
        this.vx *= 0.98;

        // Fade out as approaching target
        if (Math.abs(dy) < 30) {
            this.life -= 0.02;
        }

        return this.life > 0;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life * (this.isCacheHit ? 0.8 : 0.6);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Glow for cache hits
        if (this.isCacheHit) {
            ctx.strokeStyle = this.color;
            ctx.globalAlpha = this.life * 0.3;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

// ====================
// HELPER FUNCTIONS (Keep for backward compatibility)
// ====================
export function enterKernel() {
    const journeySpace = document.getElementById('journey-space');
    const mainStage = document.getElementById('main-stage');

    if (journeySpace) journeySpace.classList.add('hidden');

    setTimeout(() => {
        if (mainStage) mainStage.classList.add('active');
    }, 1000);
}

export function skipToVisualization() {
    const journeySpace = document.getElementById('journey-space');
    const mainStage = document.getElementById('main-stage');

    if (journeySpace) journeySpace.style.display = 'none';
    if (mainStage) mainStage.classList.add('active');
}

// ====================
// TOOLTIP FUNCTIONS (Keep for backward compatibility)
// ====================
export function showLayerTooltip(event, layers, layerIndex) {
    const tooltip = document.getElementById('tooltip');
    if (!tooltip) return;

    const layer = layers[layerIndex];
    const t = layer.tooltip;

    tooltip.style.borderColor = layer.color;
    tooltip.innerHTML = `
        <div class="tooltip-title" style="color: ${layer.color}">${t.title}</div>
        <div class="tooltip-desc">${t.desc}</div>
        <div class="tooltip-code">${t.code}</div>
    `;

    tooltip.style.left = event.clientX + 15 + 'px';
    tooltip.style.top = event.clientY + 15 + 'px';
    tooltip.classList.add('show');
}

export function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
        tooltip.classList.remove('show');
    }
}
