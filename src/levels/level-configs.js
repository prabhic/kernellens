// ============================================
// DIFFICULTY LEVEL CONFIGURATIONS
// ============================================
// Defines what information to show at each expertise level

export const LEVEL_CONFIGS = {
    // Newcomer: Simple, high-level view with friendly language
    newcomer: {
        name: 'Newcomer',
        description: 'Simple view for learning kernel basics',
        showCode: false,          // Hide code snippets
        showMetrics: true,         // Show basic metrics
        showTooltips: true,        // Show tooltips
        animationSpeed: 1.0,       // Normal speed
        particleCount: 0.5,        // Fewer particles for simplicity
        layerDetail: 'simple'      // Simplified layer descriptions
    },

    // Developer: Balanced view with code and metrics
    developer: {
        name: 'Developer',
        description: 'Balanced view with code and detailed information',
        showCode: true,            // Show code snippets
        showMetrics: true,         // Show all metrics
        showTooltips: true,        // Show tooltips
        animationSpeed: 1.0,       // Normal speed
        particleCount: 1.0,        // Full particle system
        layerDetail: 'detailed'    // Full layer information
    },

    // Expert: Maximum detail, faster pace
    expert: {
        name: 'Expert',
        description: 'Detailed view for kernel developers',
        showCode: true,            // Show code snippets
        showMetrics: true,         // Show all metrics including advanced
        showTooltips: true,        // Show tooltips
        animationSpeed: 1.5,       // Faster animations
        particleCount: 1.5,        // More particles
        layerDetail: 'expert'      // Expert-level details
    }
};

// Default level
export const DEFAULT_LEVEL = 'developer';

// Helper to get level config
export function getLevelConfig(level) {
    return LEVEL_CONFIGS[level] || LEVEL_CONFIGS[DEFAULT_LEVEL];
}

// Helper to get all available levels
export function getAvailableLevels() {
    return Object.keys(LEVEL_CONFIGS);
}
