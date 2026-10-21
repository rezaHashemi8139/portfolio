import type { PortfolioScene } from './PortfolioScene';

/**
 * Tiny bridge between React UI and the (lazily loaded) WebGL scene.
 * Type-only import keeps three.js out of the main bundle.
 */
export const sceneBus: { scene: PortfolioScene | null } = { scene: null };
