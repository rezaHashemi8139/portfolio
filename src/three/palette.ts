import type { Theme } from '../lib/theme';

/**
 * Scene colours per theme, matching the Parsian IT brand tokens in styles/tokens.css:
 * teal + purple particles, orange satellites, navy (dark) or soft grey (light) backdrop.
 */
export interface ScenePalette {
  bgTop: string;
  bgBottom: string;
  glowA: string; // cool key glow
  glowB: string; // warm rim glow
  glow: number;
  particleA: string;
  particleB: string;
  particleOpacity: number;
  ring: string;
  wire: string;
  satellite: string;
  glassTint: string;
  envIntensity: number;
  keyLight: string;
  rimLight: string;
}

export const palettes: Record<Theme, ScenePalette> = {
  dark: {
    bgTop: '#12122a',
    bgBottom: '#0a0a16',
    glowA: '#062729',
    glowB: '#1e0b26',
    glow: 0.85,
    particleA: '#00c9a7',
    particleB: '#b04cc6',
    particleOpacity: 0.9,
    ring: '#00c9a7',
    wire: '#4fe3c8',
    satellite: '#e85d2f',
    glassTint: '#c9fff3',
    envIntensity: 0.7,
    keyLight: '#bffff0',
    rimLight: '#b04cc6',
  },
  light: {
    bgTop: '#f8f8fb',
    bgBottom: '#eaeaef',
    glowA: '#efdcf3',
    glowB: '#d4f3ec',
    glow: 0.8,
    particleA: '#802392',
    particleB: '#00a88a',
    particleOpacity: 0.62,
    ring: '#802392',
    wire: '#5f1a6d',
    satellite: '#e85d2f',
    glassTint: '#f3e6f6',
    envIntensity: 1.3,
    keyLight: '#ffffff',
    rimLight: '#ffcf96',
  },
};
