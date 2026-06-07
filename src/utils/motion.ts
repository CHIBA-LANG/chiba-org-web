// Central GSAP setup. Import this ONCE per client entry to register plugins
// and define the brand-wide custom ease. Every animation file should
// `import { motion } from '../utils/motion'` and use the helpers below
// instead of touching gsap globally.

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { SplitText } from 'gsap/SplitText';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(
  ScrollTrigger,
  DrawSVGPlugin,
  MorphSVGPlugin,
  SplitText,
  MotionPathPlugin,
  CustomEase,
);

// Brand ease. Mirrors --ease-brand in global.css. Slightly accelerated
// start, long settling tail — the "drawn slowly with a fine nib" feel.
CustomEase.create('brand', '0.2, 0.7, 0.1, 1');

// Tokens mirrored from CSS variables. Kept as strings/numbers so GSAP can
// consume them directly without a CSSOM lookup at runtime.
export const motionTokens = {
  instant: 0.12,
  base: 0.48,
  slow: 0.9,
  ease: 'brand',
} as const;

// Wrapper around gsap.matchMedia that bakes in the brand defaults:
//   - desktop + motion-allowed:  full timeline
//   - reduced-motion or mobile:  static end-state only
//
// Usage:
//   const mm = motion.matchMedia();
//   mm.add({ desktop: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
//            mobile:  '(max-width: 1023px)',
//            reduced: '(prefers-reduced-motion: reduce)' },
//     ctx => { ... });
//
// The returned controller exposes .revert() for component cleanup.
export const motion = {
  gsap,
  matchMedia: () => gsap.matchMedia(),
  timeline: gsap.timeline.bind(gsap),
};

export type MotionController = ReturnType<typeof gsap.matchMedia>;
