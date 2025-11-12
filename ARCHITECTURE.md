# 🏗️ Kernel Lens Architecture Evolution

## 📐 Current Architecture (v0.1)

### Monolithic Single File
```
index.html (1030 lines)
├─ HTML Structure (lines 1-100)
├─ CSS Styles (lines 100-400)
├─ JavaScript (lines 400-1030)
│  ├─ Data definitions
│  ├─ Visualization logic
│  ├─ Animation control
│  └─ Event handlers
└─ Inline everything
```

**Pros**:
- ✅ Simple to understand
- ✅ Zero build step
- ✅ Portable (single file)
- ✅ Fast to prototype
- ✅ Works offline

**Cons**:
- ❌ Hard to maintain
- ❌ Can't scale to multiple visualizers
- ❌ No code reuse
- ❌ Testing is difficult
- ❌ Collaboration friction

---

## 🎯 Target Architecture (v1.0)

### Modular Plugin-Based System

```
kernellens/
├─ index.html                    # Shell application
├─ core/
│   ├─ engine.js                 # Core visualization engine
│   ├─ state.js                  # Application state management
│   ├─ plugin-loader.js          # Dynamic plugin system
│   └─ event-bus.js              # Component communication
│
├─ visualizers/                  # Pluggable visualizers
│   ├─ base-visualizer.js        # Abstract base class
│   ├─ syscall/
│   │   ├─ syscall-visualizer.js
│   │   └─ syscall-data.js
│   ├─ scheduler/
│   │   ├─ scheduler-visualizer.js
│   │   └─ scheduler-data.js
│   ├─ memory/
│   │   ├─ memory-visualizer.js
│   │   └─ memory-data.js
│   └─ network/
│       ├─ network-visualizer.js
│       └─ network-data.js
│
├─ parsers/                      # Trace format parsers
│   ├─ base-parser.js
│   ├─ ftrace-parser.js
│   ├─ perf-parser.js
│   ├─ strace-parser.js
│   └─ bpf-parser.js
│
├─ ui/                           # Reusable UI components
│   ├─ timeline.js
│   ├─ stage-card.js
│   ├─ code-viewer.js
│   ├─ metrics-panel.js
│   ├─ comparison-view.js
│   └─ tutorial-overlay.js
│
├─ levels/                       # Difficulty/expertise levels
│   ├─ level-manager.js
│   ├─ newcomer-config.js
│   ├─ developer-config.js
│   └─ expert-config.js
│
├─ utils/                        # Shared utilities
│   ├─ animation.js
│   ├─ colors.js
│   ├─ formatting.js
│   └─ storage.js
│
├─ styles/
│   ├─ base.css
│   ├─ themes/
│   │   ├─ dark.css
│   │   └─ light.css
│   └─ components/
│       ├─ timeline.css
│       ├─ stage-card.css
│       └─ ...
│
├─ data/                         # Static trace data
│   ├─ syscalls/
│   │   ├─ read.json
│   │   ├─ write.json
│   │   └─ fork.json
│   └─ examples/
│       ├─ scheduler-loadbalance.json
│       └─ memory-pagefault.json
│
├─ build/                        # Build output (optional)
│   ├─ kernellens.min.js
│   └─ kernellens.min.css
│
└─ tests/
    ├─ unit/
    │   ├─ parsers.test.js
    │   └─ visualizers.test.js
    └─ integration/
        └─ e2e.test.js
```

---

## 🔌 Plugin System Design

### Base Visualizer Interface

```javascript
// core/base-visualizer.js
export class BaseVisualizer {
  constructor(container, config) {
    this.container = container;
    this.config = config;
    this.state = {
      playing: false,
      currentStep: 0,
      speed: 1.0
    };
  }

  // Required methods (abstract)
  async init() {
    throw new Error('init() must be implemented');
  }

  render() {
    throw new Error('render() must be implemented');
  }

  play() {
    throw new Error('play() must be implemented');
  }

  pause() {
    throw new Error('pause() must be implemented');
  }

  step() {
    throw new Error('step() must be implemented');
  }

  // Optional methods
  reset() {
    this.state.currentStep = 0;
    this.render();
  }

  setSpeed(speed) {
    this.state.speed = speed;
  }

  // Lifecycle hooks
  onStageChange(oldStage, newStage) {}
  onComplete() {}
  onError(error) {}
}
```

### Syscall Visualizer Implementation

```javascript
// visualizers/syscall/syscall-visualizer.js
import { BaseVisualizer } from '../../core/base-visualizer.js';
import { SyscallData } from './syscall-data.js';

export class SyscallVisualizer extends BaseVisualizer {
  async init() {
    this.data = await SyscallData.load(this.config.syscall);
    this.stages = this.buildStages(this.data);
    this.timeline = this.buildTimeline(this.stages);
    this.render();
  }

  render() {
    this.renderTimeline();
    this.renderStages();
    this.renderMetrics();
  }

  play() {
    this.state.playing = true;
    this.animationLoop();
  }

  pause() {
    this.state.playing = false;
    cancelAnimationFrame(this.animationFrame);
  }

  step() {
    if (this.state.currentStep < this.stages.length) {
      this.advanceStage(this.state.currentStep++);
    }
  }

  advanceStage(stageIndex) {
    const stage = this.stages[stageIndex];
    this.highlightStage(stage);
    this.updateMetrics(stage);
    this.onStageChange(stageIndex - 1, stageIndex);
  }
}
```

### Plugin Registration

```javascript
// core/plugin-loader.js
export class PluginLoader {
  constructor() {
    this.visualizers = new Map();
    this.parsers = new Map();
  }

  registerVisualizer(name, visualizerClass) {
    this.visualizers.set(name, visualizerClass);
  }

  registerParser(format, parserClass) {
    this.parsers.set(format, parserClass);
  }

  async loadVisualizer(name, container, config) {
    const VisualizerClass = this.visualizers.get(name);
    if (!VisualizerClass) {
      throw new Error(`Visualizer '${name}' not found`);
    }

    const visualizer = new VisualizerClass(container, config);
    await visualizer.init();
    return visualizer;
  }
}

// Usage
const loader = new PluginLoader();
loader.registerVisualizer('syscall', SyscallVisualizer);
loader.registerVisualizer('scheduler', SchedulerVisualizer);
loader.registerVisualizer('memory', MemoryVisualizer);

const viz = await loader.loadVisualizer('syscall', container, {
  syscall: 'read',
  difficulty: 'developer'
});
```

---

## 🎨 Component Architecture

### Timeline Component

```javascript
// ui/timeline.js
export class Timeline {
  constructor(container, stages) {
    this.container = container;
    this.stages = stages;
    this.currentStage = 0;
  }

  render() {
    const html = `
      <div class="timeline">
        ${this.stages.map((stage, i) => `
          <div class="timeline-item ${i === this.currentStage ? 'active' : ''}"
               data-stage="${i}"
               style="width: ${100 / this.stages.length}%">
            <div class="timeline-marker"></div>
            <div class="timeline-label">${stage.name}</div>
          </div>
        `).join('')}
      </div>
    `;
    this.container.innerHTML = html;
    this.attachEvents();
  }

  setActive(stageIndex) {
    this.currentStage = stageIndex;
    this.updateActive();
  }

  updateActive() {
    this.container.querySelectorAll('.timeline-item').forEach((item, i) => {
      item.classList.toggle('active', i === this.currentStage);
      item.classList.toggle('completed', i < this.currentStage);
    });
  }

  attachEvents() {
    this.container.querySelectorAll('.timeline-item').forEach((item, i) => {
      item.addEventListener('click', () => {
        this.emit('stage-selected', i);
      });
    });
  }
}
```

### Stage Card Component

```javascript
// ui/stage-card.js
export class StageCard {
  constructor(stage, config) {
    this.stage = stage;
    this.config = config;
    this.expanded = false;
  }

  render() {
    return `
      <div class="stage-card" data-stage="${this.stage.id}">
        <div class="stage-header" onclick="this.toggle()">
          <div class="stage-number">${this.stage.number}</div>
          <div class="stage-title">${this.stage.name}</div>
          <div class="stage-duration">${this.stage.duration}μs</div>
        </div>

        ${this.expanded ? this.renderExpanded() : ''}
      </div>
    `;
  }

  renderExpanded() {
    return `
      <div class="stage-body">
        ${this.config.showCode ? this.renderCode() : ''}
        ${this.config.showMetrics ? this.renderMetrics() : ''}
        ${this.config.showFlow ? this.renderDataFlow() : ''}
      </div>
    `;
  }

  renderCode() {
    return `
      <div class="code-viewer">
        <pre><code class="language-c">${this.stage.code}</code></pre>
      </div>
    `;
  }

  renderMetrics() {
    return `
      <div class="metrics-grid">
        ${Object.entries(this.stage.metrics).map(([key, value]) => `
          <div class="metric">
            <div class="metric-label">${key}</div>
            <div class="metric-value">${value}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  toggle() {
    this.expanded = !this.expanded;
    this.emit('toggled', this.expanded);
  }
}
```

---

## 🔄 State Management

### Centralized State

```javascript
// core/state.js
export class AppState {
  constructor() {
    this.state = {
      // Current visualization
      visualizer: 'syscall',
      syscall: 'read',

      // Playback state
      playing: false,
      currentStage: 0,
      speed: 1.0,

      // UI state
      difficulty: 'developer',
      theme: 'dark',
      sidebarOpen: true,

      // Comparison mode
      comparisonMode: false,
      comparisonTraces: [],

      // User preferences
      autoplay: false,
      showCode: true,
      showMetrics: true,

      // Tutorial
      tutorialActive: false,
      tutorialStep: 0
    };

    this.listeners = new Map();
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    this.notify(key, value, oldValue);
  }

  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push(callback);
  }

  notify(key, newValue, oldValue) {
    const callbacks = this.listeners.get(key) || [];
    callbacks.forEach(cb => cb(newValue, oldValue));
  }

  // Persist to localStorage
  save() {
    localStorage.setItem('kernellens-state', JSON.stringify(this.state));
  }

  // Restore from localStorage
  load() {
    const saved = localStorage.getItem('kernellens-state');
    if (saved) {
      this.state = { ...this.state, ...JSON.parse(saved) };
    }
  }
}

// Usage
const state = new AppState();

// Subscribe to changes
state.subscribe('currentStage', (newStage, oldStage) => {
  console.log(`Stage changed: ${oldStage} → ${newStage}`);
  timeline.setActive(newStage);
});

// Update state
state.set('currentStage', 3);
```

---

## 🔗 Event Bus

### Component Communication

```javascript
// core/event-bus.js
export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  }
}

// Global event bus
export const eventBus = new EventBus();

// Usage

// Component A: Timeline
eventBus.on('stage-selected', (stageIndex) => {
  visualizer.jumpToStage(stageIndex);
});

// Component B: Stage Card
stageCard.addEventListener('click', () => {
  eventBus.emit('stage-selected', stageCard.index);
});
```

---

## 📦 Data Format Standards

### Universal Trace Format (UTF)

```javascript
// Universal format for all traces
{
  "meta": {
    "version": "1.0",
    "format": "kernel-lens-trace",
    "source": "ftrace",
    "timestamp": "2025-01-12T10:30:00Z",
    "kernel_version": "6.1.0",
    "architecture": "x86_64",
    "duration_ms": 150
  },

  "config": {
    "difficulty": "developer",
    "visualizer": "syscall",
    "custom_data": {}
  },

  "events": [
    {
      "id": "evt_001",
      "type": "syscall_enter",
      "timestamp_ns": 1234567890000,
      "cpu": 2,
      "pid": 1337,
      "tid": 1337,
      "comm": "myapp",

      "syscall": {
        "name": "read",
        "number": 0,
        "args": {
          "fd": 3,
          "buf": "0x7fff12340000",
          "count": 4096
        }
      },

      "metadata": {
        "stage": "syscall_interface",
        "subsystem": "syscall",
        "layer": 1
      }
    },

    {
      "id": "evt_002",
      "type": "function_enter",
      "timestamp_ns": 1234567890100,
      "cpu": 2,
      "pid": 1337,
      "parent_id": "evt_001",

      "function": {
        "name": "vfs_read",
        "file": "fs/read_write.c",
        "line": 456
      },

      "metadata": {
        "stage": "vfs_layer",
        "subsystem": "vfs",
        "layer": 2
      }
    },

    // ... more events

    {
      "id": "evt_099",
      "type": "syscall_exit",
      "timestamp_ns": 1234567905000,
      "cpu": 2,
      "pid": 1337,
      "parent_id": "evt_001",

      "syscall": {
        "name": "read",
        "return_value": 4096,
        "errno": 0
      },

      "metrics": {
        "duration_ns": 15000,
        "cpu_time_ns": 8000,
        "wait_time_ns": 7000,
        "context_switches": 0,
        "page_faults": 0,
        "cache_references": 1024,
        "cache_misses": 5
      }
    }
  ],

  "stages": [
    {
      "id": "stage_1",
      "name": "User Space",
      "event_ids": ["evt_001"],
      "start_ns": 1234567890000,
      "end_ns": 1234567890050,
      "duration_ns": 50
    },
    {
      "id": "stage_2",
      "name": "System Call Interface",
      "event_ids": ["evt_002", "evt_003"],
      "start_ns": 1234567890050,
      "end_ns": 1234567890500,
      "duration_ns": 450
    }
    // ... more stages
  ],

  "annotations": [
    {
      "event_id": "evt_002",
      "type": "bottleneck",
      "message": "This VFS lookup took longer than expected",
      "severity": "warning"
    }
  ]
}
```

---

## 🔨 Build System (Optional)

### Development Mode
- No build step
- Direct module imports (ES6)
- Fast iteration

### Production Mode
- Bundle for performance
- Minify for size
- Single file output (optional)

```javascript
// rollup.config.js
export default {
  input: 'src/main.js',
  output: [
    {
      file: 'dist/kernellens.js',
      format: 'iife',
      name: 'KernelLens'
    },
    {
      file: 'dist/kernellens.min.js',
      format: 'iife',
      name: 'KernelLens',
      plugins: [terser()]
    }
  ],
  plugins: [
    resolve(),
    commonjs()
  ]
};
```

```json
// package.json
{
  "name": "kernellens",
  "version": "1.0.0",
  "scripts": {
    "dev": "python3 -m http.server 8000",
    "build": "rollup -c",
    "test": "jest",
    "lint": "eslint src/"
  },
  "devDependencies": {
    "rollup": "^3.0.0",
    "rollup-plugin-terser": "^7.0.2",
    "jest": "^29.0.0",
    "eslint": "^8.0.0"
  }
}
```

---

## 🧪 Testing Strategy

### Unit Tests

```javascript
// tests/unit/parsers.test.js
import { FtraceParser } from '../../src/parsers/ftrace-parser.js';

describe('FtraceParser', () => {
  test('parses basic ftrace output', () => {
    const input = `
      myapp-1337  [002] .... 1234567890: sys_enter_read: fd=3, buf=0x7fff..., count=4096
    `;

    const result = FtraceParser.parse(input);

    expect(result.events).toHaveLength(1);
    expect(result.events[0].type).toBe('syscall_enter');
    expect(result.events[0].pid).toBe(1337);
    expect(result.events[0].cpu).toBe(2);
  });

  test('handles function graph format', () => {
    const input = `
      0)               |  sys_read() {
      0)               |    vfs_read() {
      0)   0.452 us    |    }
      0)   2.891 us    |  }
    `;

    const result = FtraceParser.parse(input);

    expect(result.events).toHaveLength(4); // enter/exit for each
    expect(result.events[0].function.name).toBe('sys_read');
  });
});
```

### Integration Tests

```javascript
// tests/integration/e2e.test.js
import { PluginLoader } from '../../src/core/plugin-loader.js';
import { SyscallVisualizer } from '../../src/visualizers/syscall/syscall-visualizer.js';

describe('End-to-end', () => {
  test('loads and renders syscall visualization', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const loader = new PluginLoader();
    loader.registerVisualizer('syscall', SyscallVisualizer);

    const viz = await loader.loadVisualizer('syscall', container, {
      syscall: 'read',
      difficulty: 'developer'
    });

    expect(container.querySelector('.timeline')).toBeTruthy();
    expect(container.querySelectorAll('.stage-card')).toHaveLength(6);
  });
});
```

---

## 📊 Performance Considerations

### Lazy Loading

```javascript
// Load visualizers only when needed
const visualizerRegistry = {
  'syscall': () => import('./visualizers/syscall/syscall-visualizer.js'),
  'scheduler': () => import('./visualizers/scheduler/scheduler-visualizer.js'),
  'memory': () => import('./visualizers/memory/memory-visualizer.js')
};

async function loadVisualizer(type) {
  const loader = visualizerRegistry[type];
  const module = await loader();
  return module.default;
}
```

### Virtual Scrolling

```javascript
// For large traces with 1000+ events
class VirtualTimeline {
  constructor(events, viewport) {
    this.events = events;
    this.viewport = viewport;
    this.itemHeight = 50;
  }

  render() {
    const scrollTop = this.viewport.scrollTop;
    const start = Math.floor(scrollTop / this.itemHeight);
    const end = start + Math.ceil(this.viewport.clientHeight / this.itemHeight);

    const visible = this.events.slice(start, end);

    this.viewport.innerHTML = `
      <div style="height: ${this.events.length * this.itemHeight}px">
        <div style="transform: translateY(${start * this.itemHeight}px)">
          ${visible.map(event => this.renderEvent(event)).join('')}
        </div>
      </div>
    `;
  }
}
```

### Web Workers

```javascript
// Parse large traces in background
// trace-parser.worker.js
self.onmessage = (e) => {
  const { format, data } = e.data;
  const parser = getParser(format);
  const result = parser.parse(data);
  self.postMessage(result);
};

// main.js
const worker = new Worker('trace-parser.worker.js');
worker.postMessage({ format: 'ftrace', data: largeTraceFile });
worker.onmessage = (e) => {
  const parsed = e.data;
  visualizer.setData(parsed);
};
```

---

## 🚀 Migration Path

### Phase 1: Extract Core
1. Create `core/` directory
2. Extract state management
3. Extract event bus
4. Keep existing visualizer in monolith

### Phase 2: Componentize UI
1. Extract Timeline component
2. Extract StageCard component
3. Extract CodeViewer component
4. Refactor monolith to use components

### Phase 3: Plugin System
1. Create BaseVisualizer
2. Refactor existing visualizer to extend Base
3. Create PluginLoader
4. Test with one visualizer

### Phase 4: Add New Visualizers
1. Implement SchedulerVisualizer
2. Implement MemoryVisualizer
3. Validate plugin system works

### Phase 5: Build & Deploy
1. Add build system (optional)
2. Add tests
3. Documentation
4. Release v1.0

---

## 🎯 Architecture Goals

1. **Modularity**: Each piece has one job
2. **Extensibility**: Easy to add new visualizers
3. **Testability**: Components can be tested in isolation
4. **Performance**: Handles large traces efficiently
5. **Developer Experience**: Clear APIs, good docs
6. **User Experience**: Fast, smooth, offline-capable

---

The architecture evolution supports the vision: **A world of kernel visualizations that scales from tutorial to expert, from single syscall to entire subsystems.**
