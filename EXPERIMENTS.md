# 🧪 Kernel Lens Experiments - Concrete Implementation Guide

## 🎯 Experiment Framework

Each experiment should:
1. **Branch naming**: `experiment/[name]-[date]`
2. **Duration**: 1-2 weeks max
3. **Goal**: Test ONE hypothesis
4. **Outcome**: Keep, iterate, or abandon
5. **Documentation**: Results in this file

---

## 🔬 Active Experiments Queue

### Priority 1: Quick Wins (Week 1-2)

#### Experiment A: Difficulty Toggle
**Branch**: `experiment/difficulty-toggle-2025-01`
**Hypothesis**: A simple difficulty selector dramatically improves UX for both newcomers and experts
**Time**: 2 days

**Implementation**:
```html
<!-- Add to control panel -->
<div class="difficulty-selector">
  <button class="diff-btn" data-level="simple">🎓 Newcomer</button>
  <button class="diff-btn" data-level="normal">👨‍💻 Developer</button>
  <button class="diff-btn active" data-level="expert">🔧 Expert</button>
</div>
```

```javascript
const LEVELS = {
  simple: {
    stages: ['User Space', 'Kernel', 'Hardware'],
    showCode: false,
    showMetrics: false,
    descriptions: 'simple',
    autoExpand: true
  },
  normal: {
    stages: 'all-6', // Current implementation
    showCode: true,
    showMetrics: true,
    descriptions: 'technical',
    autoExpand: false
  },
  expert: {
    stages: 'all-detailed', // Add sub-stages
    showCode: true,
    showMetrics: true,
    showCallStack: true,
    descriptions: 'kernel-doc',
    autoExpand: false
  }
};

function setDifficulty(level) {
  const config = LEVELS[level];
  document.body.dataset.difficulty = level;
  rebuildVisualization(config);
}
```

**Success Criteria**:
- Newcomers find "simple" mode clear
- Experts don't feel limited by "expert" mode
- Smooth transition between modes

---

#### Experiment B: Side-by-Side Comparison
**Branch**: `experiment/comparison-mode-2025-01`
**Hypothesis**: Seeing two executions side-by-side accelerates learning
**Time**: 3 days

**Scenarios to Compare**:
1. **Buffered vs Direct I/O**
   ```c
   // Trace A: Normal read()
   fd = open("file.txt", O_RDONLY);
   read(fd, buf, 4096);

   // Trace B: Direct I/O
   fd = open("file.txt", O_RDONLY | O_DIRECT);
   read(fd, buf, 4096);
   ```

2. **Hot Cache vs Cold Cache**
   ```c
   // Trace A: File in page cache (fast)
   // Trace B: File not cached (slow, I/O needed)
   ```

3. **Small vs Large I/O**
   ```c
   // Trace A: read(fd, buf, 64)     // 64 bytes
   // Trace B: read(fd, buf, 1MB)    // 1 megabyte
   ```

**UI Layout**:
```css
.comparison-mode {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.comparison-header {
  text-align: center;
  font-weight: bold;
}

.comparison-highlight {
  /* Highlight differences */
  background: rgba(255, 200, 0, 0.2);
  animation: pulse 2s infinite;
}
```

**Implementation**:
```javascript
class ComparisonVisualizer {
  constructor(traceA, traceB) {
    this.traceA = traceA;
    this.traceB = traceB;
    this.sync = true; // Synchronized playback
  }

  highlightDifferences() {
    // Compare stages and highlight where they diverge
    const diffs = this.findDifferences();
    diffs.forEach(diff => {
      this.markStage(diff.stage, 'different');
    });
  }

  playSync() {
    // Play both traces in sync
    setInterval(() => {
      this.stepA();
      this.stepB();
    }, this.speed);
  }
}
```

**Success Criteria**:
- Users can spot differences easily
- Loading two traces doesn't break performance
- Educational value: "Now I understand why X is faster"

---

#### Experiment C: Trace Uploader
**Branch**: `experiment/trace-upload-2025-01`
**Hypothesis**: Allowing custom trace upload is a killer feature
**Time**: 4 days

**Supported Formats**:
1. **ftrace** (most common)
2. **perf script** output
3. **strace** (simpler)

**UI**:
```html
<div class="trace-uploader">
  <h3>📊 Analyze Your Own Trace</h3>
  <div class="upload-zone" id="dropzone">
    <p>Drop trace file here or click to browse</p>
    <input type="file" id="tracefile" accept=".dat,.txt,.log">
  </div>

  <div class="trace-format">
    <label>Format:</label>
    <select id="format">
      <option value="ftrace">ftrace</option>
      <option value="perf">perf script</option>
      <option value="strace">strace</option>
    </select>
  </div>

  <button onclick="parseAndVisualize()">🔍 Visualize</button>
</div>
```

**Parser Architecture**:
```javascript
class TraceParser {
  static parse(file, format) {
    switch(format) {
      case 'ftrace':
        return FtraceParser.parse(file);
      case 'perf':
        return PerfParser.parse(file);
      case 'strace':
        return StraceParser.parse(file);
    }
  }
}

class FtraceParser {
  static parse(file) {
    // Parse ftrace format:
    // taskname-PID [CPU] .... timestamp: event: args
    const events = [];
    const lines = file.split('\n');

    for (const line of lines) {
      const match = line.match(/(\S+)-(\d+)\s+\[(\d+)\]\s+[\d.]+:\s+(\w+):\s+(.*)/);
      if (match) {
        events.push({
          task: match[1],
          pid: parseInt(match[2]),
          cpu: parseInt(match[3]),
          event: match[4],
          args: this.parseArgs(match[5])
        });
      }
    }

    return this.buildVisualization(events);
  }
}
```

**Example ftrace input**:
```
# tracer: function_graph
#
# CPU  DURATION                  FUNCTION CALLS
# |     |   |                     |   |   |   |
 0)               |  sys_read() {
 0)               |    vfs_read() {
 0)               |      rw_verify_area() {
 0)   0.127 us    |        security_file_permission();
 0)   0.452 us    |      }
 0)               |      __vfs_read() {
 0)               |        new_sync_read() {
 0)   0.896 us    |          ext4_file_read_iter();
 0)   1.234 us    |        }
 0)   1.678 us    |      }
 0)   2.451 us    |    }
 0)   2.891 us    |  }
```

**Success Criteria**:
- Parses common ftrace output
- Handles files up to 10MB
- Auto-detects format
- Shows meaningful visualization

---

### Priority 2: Core Features (Week 3-4)

#### Experiment D: Tutorial Mode
**Branch**: `experiment/tutorial-mode-2025-01`
**Hypothesis**: Guided tutorial reduces bounce rate for newcomers
**Time**: 5 days

**Tutorial Flow**:
```javascript
const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Kernel Lens!',
    content: 'Let\'s explore how Linux handles a simple read() call',
    highlight: '.header',
    action: 'next'
  },
  {
    id: 'syscall-select',
    title: 'Choose a System Call',
    content: 'System calls are how programs ask the kernel to do work',
    highlight: '#syscall-select',
    action: 'select:read'
  },
  {
    id: 'play-button',
    title: 'Start the Journey',
    content: 'Watch data flow through the kernel layers',
    highlight: '.btn-play',
    action: 'click'
  },
  {
    id: 'stage-1',
    title: 'User Space',
    content: 'Your program calls read(). Now watch what happens...',
    highlight: '.stage[data-id="1"]',
    action: 'wait:2000'
  },
  // ... more steps
  {
    id: 'complete',
    title: 'You did it!',
    content: 'You just watched a system call execute! 🎉',
    action: 'finish'
  }
];

class TutorialEngine {
  constructor(steps) {
    this.steps = steps;
    this.current = 0;
    this.overlay = this.createOverlay();
  }

  start() {
    this.showStep(this.steps[0]);
  }

  showStep(step) {
    // Highlight element
    const element = document.querySelector(step.highlight);
    this.overlay.spotlight(element);

    // Show tooltip
    this.tooltip.show(step.title, step.content);

    // Handle action
    if (step.action === 'next') {
      this.tooltip.addButton('Next', () => this.next());
    } else if (step.action.startsWith('click')) {
      // Wait for user to click
      element.addEventListener('click', () => this.next(), {once: true});
    }
  }
}
```

**Visual Design**:
```css
.tutorial-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 9999;
  pointer-events: none;
}

.tutorial-spotlight {
  position: absolute;
  background: transparent;
  border: 3px solid var(--accent-primary);
  border-radius: 8px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.8);
  pointer-events: auto;
  animation: pulse 2s infinite;
}

.tutorial-tooltip {
  position: absolute;
  background: white;
  color: black;
  padding: 20px;
  border-radius: 12px;
  max-width: 400px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}
```

**Success Criteria**:
- 80% of users complete tutorial
- Tutorial takes < 3 minutes
- Users understand basic flow after tutorial

---

#### Experiment E: Call Stack Depth
**Branch**: `experiment/call-stack-2025-01`
**Hypothesis**: Showing full call stack helps advanced users
**Time**: 3 days

**Current**: Only shows major stages (6 levels)
**Proposed**: Show full call stack (20+ levels)

**Visual Representation**:
```
Stage 3: VFS Layer
├─ vfs_read()
│  ├─ rw_verify_area()
│  │  └─ security_file_permission()
│  │     └─ selinux_file_permission()
│  ├─ __vfs_read()
│  │  ├─ new_sync_read()
│  │  │  └─ ext4_file_read_iter()
│  │  │     ├─ generic_file_read_iter()
│  │  │     │  └─ filemap_read()
│  │  │     │     └─ page_cache_sync_readahead()
│  │  │     └─ ...
```

**UI Implementation**:
```javascript
class CallStackViewer {
  constructor(stage) {
    this.stage = stage;
    this.collapsed = new Set();
  }

  render() {
    return this.renderNode(this.stage.root, 0);
  }

  renderNode(node, depth) {
    const indent = '│  '.repeat(depth) + (depth > 0 ? '├─ ' : '');
    const html = `
      <div class="call-stack-node" data-depth="${depth}">
        <span class="indent">${indent}</span>
        <span class="function-name">${node.name}()</span>
        <span class="duration">${node.duration}μs</span>
        ${node.children.length > 0 ?
          '<button class="collapse-btn">▼</button>' : ''}
      </div>
    `;

    if (!this.collapsed.has(node.id)) {
      node.children.forEach(child => {
        html += this.renderNode(child, depth + 1);
      });
    }

    return html;
  }
}
```

**Success Criteria**:
- Performance: Can render 100+ nodes smoothly
- UX: Collapse/expand works intuitively
- Value: Experts find it useful

---

### Priority 3: Subsystem Deep Dives (Month 2)

#### Experiment F: Scheduler Visualizer
**Branch**: `experiment/scheduler-viz-2025-02`
**Hypothesis**: Scheduler is complex enough to deserve own visualizer
**Time**: 1 week

**Concepts to Visualize**:
1. **Task States**: Running, Runnable, Sleeping, Stopped
2. **Runqueues**: Per-CPU queues
3. **Priority Levels**: FIFO, RR, Normal, Batch, Idle
4. **CFS Algorithm**: Virtual runtime, time slices
5. **Load Balancing**: Task migration between CPUs

**Visual Layout**:
```
┌─────────────────────────────────────────────────┐
│  CPU 0          CPU 1          CPU 2          CPU 3          │
│  ┌─────┐       ┌─────┐       ┌─────┐       ┌─────┐       │
│  │Task │       │Task │       │Task │       │Task │       │
│  │ A   │       │ D   │       │ G   │       │ J   │       │
│  └─────┘       └─────┘       └─────┘       └─────┘       │
│                                                           │
│  Runqueue:      Runqueue:      Runqueue:      Runqueue:      │
│  [B][C]        [E][F]        [H][I]        [K][L]        │
└─────────────────────────────────────────────────────────────┘

Timeline:
─────────A─────B────────A────────C─────────A─────────▶
     (context switches)
```

**Data Structure**:
```javascript
const SchedulerState = {
  cpus: [
    {
      id: 0,
      current_task: { pid: 1337, comm: 'myapp', vruntime: 1234 },
      runqueue: [
        { pid: 1338, comm: 'worker1', vruntime: 1240, priority: 120 },
        { pid: 1339, comm: 'worker2', vruntime: 1250, priority: 120 }
      ],
      load: 1.5
    },
    // ... more CPUs
  ],
  sleeping_tasks: [
    { pid: 1340, comm: 'daemon', waiting_on: 'futex' }
  ],
  events: [
    { type: 'context_switch', from: 1337, to: 1338, cpu: 0, time: 1000 },
    { type: 'wakeup', pid: 1340, time: 1050 },
    { type: 'load_balance', from_cpu: 0, to_cpu: 1, pid: 1338, time: 1100 }
  ]
};
```

**Implementation**:
```javascript
class SchedulerVisualizer {
  constructor(container) {
    this.container = container;
    this.cpus = navigator.hardwareConcurrency || 4;
    this.timeline = [];
  }

  render() {
    this.renderCPUs();
    this.renderTimeline();
    this.renderTaskList();
  }

  animateContextSwitch(from_task, to_task, cpu) {
    // Animate task moving from runqueue to CPU
    const fromEl = document.querySelector(`[data-pid="${from_task}"]`);
    const toEl = document.querySelector(`[data-pid="${to_task}"]`);
    const cpuEl = document.querySelector(`.cpu[data-id="${cpu}"]`);

    // Swap animation
    this.animateSwap(fromEl, toEl, cpuEl);
  }
}
```

**Success Criteria**:
- Clearly shows CFS algorithm in action
- Context switches are visible
- Load balancing makes sense visually

---

#### Experiment G: Memory Visualizer
**Branch**: `experiment/memory-viz-2025-02`
**Hypothesis**: Memory management is confusing, visualization helps
**Time**: 1 week

**Concepts to Visualize**:
1. **Page Faults**: Minor vs Major
2. **Page Cache**: Hot pages, eviction
3. **Memory Mappings**: Anonymous, file-backed, shared
4. **Page Tables**: Virtual → Physical translation
5. **OOM Killer**: When and why processes are killed

**Visual Layout**:
```
Virtual Memory Space                Physical Memory
┌──────────────────┐              ┌──────────────┐
│ Stack      [4GB] │              │ Page 0       │ ← Kernel
│      ↑           │              │ Page 1       │
│                  │    ┌────────▶│ Page 2       │ ← Program
│ Heap       [1GB] │    │         │ Page 3       │
│      ↓           │    │         │ ...          │
│ BSS        [1MB] │────┘         │ Page N       │
│ Data       [1MB] │──────────────▶│ Page N+1     │
│ Text       [1MB] │              │ ...          │
└──────────────────┘              │ Free         │
                                  └──────────────┘

Page Cache:
┌────────────────────────────────────────┐
│ [Hot] file.txt page 0                  │
│ [Hot] file.txt page 1                  │
│ [Cold] old.txt page 0    ← evict next  │
└────────────────────────────────────────┘
```

**Success Criteria**:
- Page fault handling is clear
- Cache behavior makes sense
- Useful for understanding performance

---

### Priority 4: Advanced Features (Month 3)

#### Experiment H: 3D Visualization
**Branch**: `experiment/3d-callgraph-2025-03`
**Hypothesis**: 3D adds value for complex traces
**Time**: 1 week

**Technology**: Three.js

**3D Layout**:
- **X-axis**: Time
- **Y-axis**: Call depth
- **Z-axis**: Subsystem
- **Color**: CPU usage
- **Size**: Duration

```javascript
import * as THREE from 'three';

class CallGraph3D {
  constructor(container) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  addFunction(func) {
    // Create box for function call
    const geometry = new THREE.BoxGeometry(func.duration, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: this.cpuColor(func.cpu_usage),
      opacity: 0.8
    });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(
      func.timestamp,     // X: time
      func.call_depth,    // Y: depth
      func.subsystem_id   // Z: subsystem
    );

    this.scene.add(mesh);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
```

**Success Criteria**:
- Adds understanding, not just "cool factor"
- Performant (60 FPS with 1000+ nodes)
- Intuitive controls

---

#### Experiment I: Real-Time Mode
**Branch**: `experiment/realtime-2025-03`
**Hypothesis**: Live visualization of running system is valuable
**Time**: 1 week

**Architecture**:
```
┌─────────────┐      WebSocket      ┌──────────────┐
│   Kernel    │◄────────────────────│ Kernel Lens  │
│   (eBPF)    │─────────────────────▶│   Browser    │
└─────────────┘   JSON events       └──────────────┘
```

**eBPF Program**:
```c
// bpf_trace.c
#include <linux/bpf.h>
#include <bpf/bpf_helpers.h>

SEC("tracepoint/syscalls/sys_enter_read")
int trace_read_enter(struct trace_event_raw_sys_enter *ctx) {
    struct event evt = {
        .type = EVENT_SYSCALL_ENTER,
        .syscall = SYS_READ,
        .timestamp = bpf_ktime_get_ns(),
        .pid = bpf_get_current_pid_tgid() >> 32
    };

    bpf_perf_event_output(ctx, &events, BPF_F_CURRENT_CPU, &evt, sizeof(evt));
    return 0;
}
```

**WebSocket Server**:
```python
# server.py
import asyncio
import websockets
import json
from bcc import BPF

bpf = BPF(src_file="bpf_trace.c")

async def stream_events(websocket):
    def event_handler(cpu, data, size):
        event = bpf["events"].event(data)
        asyncio.create_task(
            websocket.send(json.dumps({
                'type': event.type,
                'timestamp': event.timestamp,
                'pid': event.pid
            }))
        )

    bpf["events"].open_perf_buffer(event_handler)
    while True:
        bpf.perf_buffer_poll()
        await asyncio.sleep(0.01)

start_server = websockets.serve(stream_events, "localhost", 8765)
asyncio.get_event_loop().run_until_complete(start_server)
```

**Browser Client**:
```javascript
const ws = new WebSocket('ws://localhost:8765');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  visualizer.addEvent(data);
};

// Ring buffer for last N events
const eventBuffer = new RingBuffer(1000);
```

**Success Criteria**:
- < 1ms latency
- Handles 10,000 events/sec
- Doesn't crash browser

---

## 📊 Experiment Results Template

```markdown
## Experiment: [Name]
**Date**: YYYY-MM-DD
**Branch**: experiment/[name]
**Duration**: X days
**Status**: ✅ Success / ⚠️ Partial / ❌ Failed

### Hypothesis
[Original hypothesis]

### Implementation
[What was built]

### Results
**Quantitative**:
- Metric 1: [value]
- Metric 2: [value]

**Qualitative**:
- User feedback: [summary]
- Observations: [insights]

### Decision
- [ ] Merge to main
- [ ] Iterate (another experiment)
- [ ] Abandon

### Learnings
[What did we learn?]

### Next Steps
[If merging: what needs to be done]
[If iterating: what to try next]
[If abandoning: why, and alternatives]
```

---

## 🎯 Experimentation Philosophy

### Fail Fast
- 1 week = enough time to validate
- Don't perfect experiments
- It's OK to abandon

### Measure
- Set success criteria upfront
- Collect data
- User feedback > opinions

### Iterate
- Experiment → Learn → Experiment
- Best ideas come from trying

### Share
- Document everything
- Share failures, not just successes
- Build on each other's work

---

## 🚀 Quick Start: Run an Experiment

```bash
# 1. Create branch
git checkout -b experiment/my-idea-2025-01

# 2. Implement
# ... code ...

# 3. Test
# ... user testing ...

# 4. Document results
# Add to EXPERIMENTS.md

# 5. Decide
# Merge, iterate, or abandon

# 6. Push
git push -u origin experiment/my-idea-2025-01
```

---

## 📝 Active Experiments Tracking

| Experiment | Branch | Status | Start Date | End Date | Result |
|------------|--------|--------|------------|----------|--------|
| Difficulty Toggle | experiment/difficulty-toggle-2025-01 | 🟡 Planned | TBD | TBD | TBD |
| Side-by-Side | experiment/comparison-mode-2025-01 | 🟡 Planned | TBD | TBD | TBD |
| Trace Upload | experiment/trace-upload-2025-01 | 🟡 Planned | TBD | TBD | TBD |
| Tutorial Mode | experiment/tutorial-mode-2025-01 | 🟡 Planned | TBD | TBD | TBD |
| Call Stack | experiment/call-stack-2025-01 | 🟡 Planned | TBD | TBD | TBD |

Legend:
- 🟡 Planned
- 🔵 In Progress
- 🟢 Success (Merged)
- 🟠 Partial (Iterating)
- 🔴 Failed (Abandoned)

---

Let the experiments begin! 🚀
