// ============================================
// KERNEL LENS - Cinematic Kernel Visualization
// ============================================

// ====================
// STATE & CONFIGURATION
// ====================
const state = {
    fd: 3,
    size: 4096,
    cacheHit: 85,
    currentLayer: 0
};

const shapes = {
    circle: "M 280,80 m -20,0 a 20,20 0 1,0 40,0 a 20,20 0 1,0 -40,0",
    bars: "M 260,135 L 340,135 L 340,150 L 260,150 Z M 260,155 L 340,155 L 340,170 L 260,170 Z M 260,175 L 340,175 L 340,190 L 260,190 Z",
    tree: "M 250,200 L 350,200 L 350,250 L 250,250 Z M 255,210 L 265,210 L 265,220 L 255,220 Z M 255,230 L 345,230 L 345,240 L 255,240 Z",
    grid: "M 265,270 L 285,270 L 285,290 L 265,290 Z M 295,270 L 315,270 L 315,290 L 295,290 Z M 265,300 L 285,300 L 285,320 L 265,320 Z M 295,300 L 315,300 L 315,320 L 295,320 Z",
    queue: "M 240,340 L 360,340 L 360,380 L 240,380 Z M 250,350 L 270,350 L 270,370 L 250,370 Z M 280,350 L 300,350 L 300,370 L 280,370 Z M 310,350 L 330,350 L 330,370 L 310,370 Z",
    device: "M 250,410 L 350,410 L 350,450 L 250,450 Z M 270,420 L 280,420 L 280,430 L 270,430 Z M 320,420 L 330,420 L 330,430 L 320,430 Z"
};

const layers = [
    {
        shape: 'circle',
        color: '#f093fb',
        y: 80,
        label: 'fd=3',
        tooltip: {
            title: 'User Space',
            desc: 'Application code requests file read with fd=3',
            code: 'read(fd, buffer, count)'
        }
    },
    {
        shape: 'bars',
        color: '#4facfe',
        y: 150,
        label: 'Registers',
        tooltip: {
            title: 'System Call Entry',
            desc: 'CPU switches to kernel mode via SYSCALL instruction',
            code: 'RAX=0 (syscall number)\nRDI=3 (fd)\nRSI=buffer_addr\nRDX=count'
        }
    },
    {
        shape: 'tree',
        color: '#43e97b',
        y: 215,
        label: 'file*',
        tooltip: {
            title: 'VFS Layer',
            desc: 'Virtual File System resolves fd to file structure',
            code: 'file* = current->files->fdt->fd[3];\npath = file->f_path;\ninode = file->f_inode;'
        }
    },
    {
        shape: 'grid',
        color: '#fa709a',
        y: 285,
        label: 'Blocks',
        tooltip: {
            title: 'Filesystem Layer',
            desc: 'ext4 maps file offset to physical blocks via extent tree',
            code: 'inode = ext4_iget(sb, 524288);\nextents = inode->i_block;\nblock = ext4_ext_find_extent()'
        }
    },
    {
        shape: 'queue',
        color: '#fee140',
        y: 355,
        label: 'Queue',
        tooltip: {
            title: 'Block I/O Layer',
            desc: 'Creates BIO request, submits to I/O scheduler queue',
            code: 'bio = bio_alloc(sector, count);\nbio->bi_end_io = end_bio_read;\nsubmit_bio(REQ_OP_READ, bio);'
        }
    },
    {
        shape: 'device',
        color: '#30cfd0',
        y: 425,
        label: 'Device',
        tooltip: {
            title: 'Device Driver',
            desc: 'Issues SCSI READ command, DMA transfers data to memory',
            code: 'scsi_read_10(device, lba, length);\nDMA: device_buffer -> kernel_buffer;\nIRQ on completion'
        }
    }
];

// ====================
// CANVAS PARTICLE SYSTEM
// ====================
const canvas = document.getElementById('canvas-particles');
const ctx = canvas.getContext('2d');
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

const particles = [];

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
        this.size = isCacheHit ? 3 : 2; // Cache hits are bigger
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

    draw() {
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

function emitParticles(count, fromY, toY, color, isCacheHit = false) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(
            canvas.width / 2 + (Math.random() - 0.5) * 100,
            fromY,
            toY,
            color,
            isCacheHit
        ));
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
        if (!particles[i].update()) {
            particles.splice(i, 1);
        } else {
            particles[i].draw();
        }
    }

    ctx.globalAlpha = 1.0;
    requestAnimationFrame(animateParticles);
}

animateParticles();

// ====================
// GSAP MORPHING ANIMATION
// ====================
let morphTimeline;

function createMorphingFlow() {
    if (morphTimeline) {
        morphTimeline.kill();
    }

    morphTimeline = gsap.timeline({ repeat: -1, repeatDelay: 1 });

    layers.forEach((layer, i) => {
        if (i === 0) return;

        const duration = 1.5;
        const prevLayer = layers[i - 1];
        const startTime = i * 2;

        // Morph shape with elastic easing
        morphTimeline.to('#data-shape', {
            attr: { d: shapes[layer.shape] },
            fill: layer.color,
            duration: duration,
            ease: "elastic.out(1, 0.5)" // Spring!
        }, startTime);

        // Update label text
        morphTimeline.to('#data-label', {
            textContent: layer.label,
            duration: 0.3,
            ease: "power2.out"
        }, startTime);

        // Move label vertically
        morphTimeline.to('#data-label', {
            attr: { y: layer.y + 5 },
            duration: duration,
            ease: "elastic.out(1, 0.5)"
        }, startTime);

        // Highlight active layer
        morphTimeline.call(() => {
            // Deactivate all layers
            document.querySelectorAll('.stage-label').forEach(el => {
                el.classList.remove('active');
            });
            document.querySelectorAll('.layer-zone').forEach(el => {
                el.classList.remove('active');
            });

            // Activate current layer
            const layerId = ['user', 'syscall', 'vfs', 'fs', 'block', 'device'][i];
            const layerGroup = document.getElementById(`layer-${layerId}`);
            if (layerGroup) {
                layerGroup.querySelector('.stage-label').classList.add('active');
                layerGroup.querySelector('.layer-zone').classList.add('active');
            }

            state.currentLayer = i;
        }, null, startTime);

        // Emit particles during transition
        morphTimeline.call(() => {
            const particleCount = Math.ceil(state.size / 200);
            const isCacheHit = Math.random() * 100 < state.cacheHit;

            emitParticles(particleCount, prevLayer.y, layer.y, layer.color, isCacheHit);

            // Cache miss: emit more particles to lower layers
            if (!isCacheHit && i < layers.length - 1) {
                setTimeout(() => {
                    emitParticles(
                        Math.ceil(particleCount / 2),
                        layer.y,
                        layers[i + 1].y,
                        layers[i + 1].color,
                        false
                    );
                }, 500);
            }
        }, null, startTime);
    });
}

createMorphingFlow();

// ====================
// JOURNEY MODE
// ====================
function enterKernel() {
    const journeySpace = document.getElementById('journey-space');
    const mainStage = document.getElementById('main-stage');

    // Fade out journey
    journeySpace.classList.add('hidden');

    // Fade in visualization after delay
    setTimeout(() => {
        mainStage.classList.add('active');
    }, 1000);
}

function skipToVisualization() {
    document.getElementById('journey-space').style.display = 'none';
    document.getElementById('main-stage').classList.add('active');
}

// ====================
// LIVE PARAMETER UPDATES
// ====================
function updateMetrics() {
    const ioOps = Math.ceil((100 - state.cacheHit) / 100 * Math.ceil(state.size / 4096));
    const totalTime = 1 + 0.5 + 2 + (ioOps * 10) + (ioOps * 150);

    // Animate metrics with GSAP
    gsap.to('#time-metric', {
        textContent: totalTime.toFixed(1) + 'μs',
        duration: 0.5,
        snap: { textContent: 0.1 }
    });

    gsap.to('#cache-metric', {
        textContent: state.cacheHit + '%',
        duration: 0.5
    });

    gsap.to('#io-metric', {
        textContent: ioOps,
        duration: 0.5,
        snap: { textContent: 1 }
    });

    gsap.to('#transfer-metric', {
        textContent: Math.ceil(state.size / 1024) + 'KB',
        duration: 0.5
    });
}

document.getElementById('fd-input').addEventListener('input', (e) => {
    state.fd = parseInt(e.target.value);
    document.getElementById('fd-display').textContent = `fd=${state.fd}`;
    layers[0].label = `fd=${state.fd}`;
    updateMetrics();
});

document.getElementById('size-input').addEventListener('input', (e) => {
    state.size = parseInt(e.target.value);
    document.getElementById('size-display').textContent = `${state.size}B`;
    updateMetrics();
});

document.getElementById('cache-input').addEventListener('input', (e) => {
    state.cacheHit = parseInt(e.target.value);
    document.getElementById('cache-display').textContent = `${state.cacheHit}%`;
    updateMetrics();
});

updateMetrics();

// ====================
// TOOLTIPS
// ====================
const tooltip = document.getElementById('tooltip');

function showLayerTooltip(event, layerIndex) {
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

function hideTooltip() {
    tooltip.classList.remove('show');
}

// ====================
// RESPONSIVE RESIZE
// ====================
window.addEventListener('resize', () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
});
