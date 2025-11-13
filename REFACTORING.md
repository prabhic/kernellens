# Architecture Refactoring - Phase 1

## Overview
Minimal refactoring to enable **difficulty levels** and **comparison mode** experiments while maintaining simplicity.

## What Changed

### New Structure
```
src/
├── kernel-visualizer.js       # Main KernelVisualizer class (refactored from kernel-lens.js)
├── syscalls/
│   └── read-config.js         # Layer configs for read() syscall
└── levels/
    └── level-configs.js       # Difficulty level configurations
```

### Key Improvements

1. **Class-Based Architecture**
   - `KernelVisualizer` class wraps all visualization logic
   - Can instantiate multiple times: `new KernelVisualizer(container, config)`
   - Enables comparison mode (side-by-side visualizations)

2. **Separated Concerns**
   - **Data** (syscall configs) separated from **logic** (visualizer)
   - Easy to add new syscalls: just create new config file
   - Layer definitions in `read-config.js`

3. **Difficulty Level Support**
   - Three levels: `newcomer`, `developer`, `expert`
   - Configurable: code visibility, animation speed, particle count
   - Ready for difficulty toggle experiment

4. **Reusable & Extensible**
   - Public API: `play()`, `pause()`, `setDifficulty()`, `destroy()`
   - Clean initialization: `new KernelVisualizer('main-stage', { difficulty: 'developer' })`
   - No breaking changes to HTML structure

## What Stayed the Same

- ✅ Zero build step (ES6 modules work natively)
- ✅ Same HTML structure
- ✅ All existing functionality preserved
- ✅ GSAP animations unchanged
- ✅ Canvas particle system intact
- ✅ Journey mode works as before

## Usage Example

```javascript
// Single visualizer (current use case)
const visualizer = new KernelVisualizer('main-stage', {
    difficulty: 'developer',
    fd: 3,
    size: 4096,
    cacheHit: 85
});

// Future: Comparison mode
const viz1 = new KernelVisualizer('container-1', { syscall: 'read' });
const viz2 = new KernelVisualizer('container-2', { syscall: 'write' });

// Future: Difficulty toggle
visualizer.setDifficulty('expert');
```

## What This Enables

### ✅ Ready Now
1. **Difficulty Levels** - Toggle between newcomer/developer/expert
2. **Comparison Mode** - Run multiple visualizations side-by-side
3. **New Syscalls** - Add `write-config.js`, `open-config.js` easily

### 🚀 Easy to Add Later
- Tutorial mode overlay
- Real trace data integration
- Network/scheduler/memory visualizers
- Plugin system (if needed)

## Testing

### ⚠️ Important: Use HTTP Server
**ES6 modules require HTTP server - cannot open with `file://` protocol!**

```bash
# Start HTTP server
python3 -m http.server 8000

# Open in browser:
# http://localhost:8000/index_cinematic.html
# http://localhost:8000/test-refactoring.html (module verification)
```

### Results
- ✅ JavaScript syntax validated
- ✅ All imports resolve correctly
- ✅ HTTP server serves page without errors
- ✅ Module test page created (`test-refactoring.html`)

## Next Steps

1. Add difficulty toggle UI to header
2. Create experiment branches:
   - `experiment/difficulty-levels`
   - `experiment/comparison-mode`
3. User testing with newcomers and experts

## Philosophy

> **"Do the simplest thing that could possibly work"**

This refactoring adds just enough structure to enable the next experiments without over-engineering. We avoided:
- ❌ Complex plugin loader systems
- ❌ Abstract base classes
- ❌ Build tools
- ❌ Event bus architecture
- ❌ State management libraries

We can add those later **if we actually need them**.

---

**Refactored**: 2025-11-13
**Files Changed**: 4 created, 1 modified
**Lines Added**: ~550
**Complexity**: Minimal ✨
