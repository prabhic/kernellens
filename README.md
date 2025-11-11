# 🔍 Kernel Lens

**Interactive Visualization of Kernel Internal Execution**

Inspired by [Transformer Explainer](https://poloclub.github.io/transformer-explainer/), Kernel Lens brings the same level of interactive, educational visualization to understanding how the Linux kernel executes system calls.

## ✨ Features

- **Interactive Flow Visualization** - See exactly how system calls flow through kernel layers
- **Multi-Level Abstraction** - From high-level overview to detailed kernel code
- **Step-by-Step Execution** - Auto-play or manually step through each stage
- **Real Kernel Code** - Actual Linux kernel code snippets with syntax highlighting
- **Performance Metrics** - See timing, memory usage, and I/O statistics
- **Sankey-Style Data Flow** - Visual representation of data transformations
- **Zero Dependencies** - Pure HTML/CSS/JavaScript, runs offline in any browser

## 🚀 Quick Start

Simply open `index.html` in your web browser:

```bash
# Clone the repository
git clone <repository-url>
cd kernellens

# Open in browser (any of these)
open index.html              # macOS
xdg-open index.html          # Linux
start index.html             # Windows
```

Or use a local web server:

```bash
python3 -m http.server 8000
# Visit http://localhost:8000
```

## 📚 How to Use

1. **Select a System Call** - Choose from read(), write(), open(), or fork()
2. **Start Visualization** - Click "▶ Start" to auto-play through all stages
3. **Step Through** - Use "⏭ Step Through" to manually advance one stage at a time
4. **Expand Stages** - Click on any stage header to see detailed code and metrics
5. **Follow the Timeline** - Track progress through the top timeline bar

## 🎓 What You'll Learn

### System Call Journey
- How applications transition from user space to kernel space
- The role of the Virtual File System (VFS) layer
- How file systems map logical blocks to physical storage
- Block I/O scheduling and device driver interaction
- Performance characteristics at each layer

### Currently Visualized: read() System Call

**6 Major Stages:**
1. **User Space** - Application invokes read()
2. **System Call Interface** - Trap to kernel mode
3. **VFS Layer** - File descriptor resolution
4. **File System** - ext4/xfs specific operations
5. **Block Layer** - I/O scheduling and device drivers
6. **Return to User** - Data copy and context switch back

## 🎨 Design Principles

Kernel Lens follows proven visualization principles from Transformer Explainer:

1. **Multi-Level Abstractions** - Progressive disclosure of complexity
2. **Sankey Flow Diagrams** - Clear data transformation visualization
3. **Interactive Exploration** - User-controlled pacing and depth
4. **Visual Consistency** - Uniform design language throughout
5. **Coordinated Views** - Timeline, stages, code, and metrics synchronized
6. **Smooth Animations** - Convey sequence and causality
7. **Educational Focus** - Learn by exploration, not just reading

See [DESIGN_PRINCIPLES.md](DESIGN_PRINCIPLES.md) for detailed analysis.

## 🔮 Future Plans

- [ ] Real kernel trace integration (ftrace, perf)
- [ ] Custom sequence upload
- [ ] Network stack visualization
- [ ] Process scheduler visualization
- [ ] Memory management visualization
- [ ] Performance comparison mode
- [ ] Export to image/video

## 🤝 Contributing

Contributions welcome! Areas of interest:
- Additional system calls and sequences
- Real trace data integration
- New visualization modes
- Educational content improvements
- Performance optimizations

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Inspired by [Transformer Explainer](https://poloclub.github.io/transformer-explainer/) by Polo Club of Data Science
- Linux Kernel documentation and source code
- The amazing kernel developer community

