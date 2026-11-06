import { useEffect, useState } from 'react';
import { motion, type Variants } from 'framer-motion';

export type GibbonState = 'idle' | 'blink' | 'wave' | 'happy' | 'surprised' | 'greeting' | 'curious';

interface GibbonProps {
  state?: GibbonState;
  size?: number;
  className?: string;
}

const bodyVariants: Variants = {
  idle: { y: [0, -3, 0], transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' } },
  happy: { y: [0, -10, 0], transition: { duration: 0.7, repeat: 2, ease: 'easeOut' } },
  surprised: { y: [0, -6, 0], transition: { duration: 0.35 } },
  curious: { rotate: [0, -6, 0], transition: { duration: 1.2, ease: 'easeInOut' } },
};

const armVariants: Variants = {
  rest: { rotate: 0 },
  wave: { rotate: [0, -40, 6, -40, 0], transition: { duration: 1.6, repeat: 1, ease: 'easeInOut' } },
  greeting: { rotate: [0, -65, -25, -65, -25, -65, 0], transition: { duration: 2.2, ease: 'easeInOut' } },
};

const tailVariants: Variants = {
  sway: { rotate: [-8, 10, -8], transition: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' } },
};

const sparkleVariants: Variants = {
  twinkle: (delay: number) => ({
    scale: [0, 1.15, 0],
    opacity: [0, 1, 0],
    transition: { duration: 1.8, repeat: Infinity, delay, ease: 'easeInOut' },
  }),
};

const HAPPY_STATES: GibbonState[] = ['happy', 'greeting', 'wave'];

function mouthPath(state: GibbonState): string {
  switch (state) {
    case 'happy':
    case 'greeting':
    case 'wave':
      return 'M 70 94 Q 84 114 98 94 Z';
    case 'curious':
      return 'M 78 99 Q 88 102 94 96';
    case 'surprised':
      return 'M 84 92 m -5 0 a 5 6 0 1 0 10 0 a 5 6 0 1 0 -10 0 Z';
    default:
      return 'M 74 96 Q 84 104 94 96';
  }
}

function browPaths(state: GibbonState): [string, string] {
  switch (state) {
    case 'surprised':
      return ['M 48 38 Q 60 32 72 38', 'M 96 38 Q 108 32 120 38'];
    case 'happy':
    case 'greeting':
    case 'wave':
      return ['M 48 47 Q 60 40 72 47', 'M 96 47 Q 108 40 120 47'];
    case 'curious':
      return ['M 48 40 Q 60 34 72 42', 'M 96 46 Q 108 46 120 48'];
    default:
      return ['M 48 46 Q 60 42 72 46', 'M 96 46 Q 108 42 120 46'];
  }
}

export function Gibbon({ state = 'idle', size = 160, className }: GibbonProps) {
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    let timer: number;
    let closeTimer: number;
    const schedule = () => {
      timer = window.setTimeout(() => {
        setBlinking(true);
        closeTimer = window.setTimeout(() => {
          setBlinking(false);
          schedule();
        }, 140);
      }, 2600 + Math.random() * 2400);
    };
    schedule();
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(closeTimer);
    };
  }, []);

  const eyesClosed = blinking || state === 'blink';
  const eyeScale = state === 'surprised' ? 1.2 : 1;
  const lookX = state === 'curious' ? 3 : 0;
  const bodyState = state === 'wave' || state === 'greeting' ? 'idle' : state;
  const armState = state === 'wave' || state === 'greeting' ? state : 'rest';
  const cheekOpacity = HAPPY_STATES.includes(state) ? 0.7 : 0.4;
  const [leftBrow, rightBrow] = browPaths(state);

  return (
    <motion.svg
      viewBox="0 0 168 168"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Гиббон, талисман GibbonChat"
      initial={{ opacity: 0, y: 16, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      style={{ overflow: 'visible', filter: 'drop-shadow(0 0 18px rgba(185, 247, 124, 0.22))' }}
    >
      <path d="M 156 14 C 124 36 120 64 136 84" fill="none" stroke="#19c982" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
      <path d="M 136 84 C 132 96 140 102 148 98" fill="none" stroke="#19c982" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <path d="M 138 62 C 150 52 162 56 164 68" fill="none" stroke="#0e8a5b" strokeWidth="3" strokeLinecap="round" opacity="0.6" />

      <motion.g variants={bodyVariants} animate={bodyState} style={{ originX: '50%', originY: '100%' }}>
        <motion.g variants={tailVariants} animate="sway" style={{ originX: '120px', originY: '150px' }}>
          <path d="M 118 150 C 152 160 158 126 142 114 C 136 108 130 116 136 122" fill="none" stroke="#173c2b" strokeWidth="9" strokeLinecap="round" />
          <path d="M 118 150 C 152 160 158 126 142 114 C 136 108 130 116 136 122" fill="none" stroke="#2c6148" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 7" />
        </motion.g>

        <ellipse cx="62" cy="158" rx="14" ry="9" fill="#10291d" stroke="#2c6148" strokeWidth="2" />
        <ellipse cx="106" cy="158" rx="14" ry="9" fill="#10291d" stroke="#2c6148" strokeWidth="2" />

        <ellipse cx="84" cy="128" rx="40" ry="34" fill="#173c2b" stroke="#2c6148" strokeWidth="3" />
        <ellipse cx="84" cy="134" rx="24" ry="20" fill="#d4f1bd" opacity="0.22" />

        <motion.g variants={armVariants} animate="rest" style={{ originX: '46px', originY: '112px' }}>
          <path d="M 46 112 C 24 120 22 140 30 152" fill="none" stroke="#173c2b" strokeWidth="16" strokeLinecap="round" />
          <path d="M 46 112 C 24 120 22 140 30 152" fill="none" stroke="#2c6148" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 6" />
          <circle cx="30" cy="154" r="8" fill="#10291d" stroke="#2c6148" strokeWidth="2" />
        </motion.g>

        <motion.g variants={armVariants} animate={armState} style={{ originX: '122px', originY: '112px' }}>
          <path d="M 122 112 C 144 120 146 140 138 152" fill="none" stroke="#173c2b" strokeWidth="16" strokeLinecap="round" />
          <path d="M 122 112 C 144 120 146 140 138 152" fill="none" stroke="#2c6148" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 6" />
          <circle cx="138" cy="154" r="8" fill="#10291d" stroke="#2c6148" strokeWidth="2" />
        </motion.g>

        <ellipse cx="36" cy="72" rx="13" ry="14" fill="#173c2b" stroke="#2c6148" strokeWidth="3" />
        <ellipse cx="36" cy="72" rx="6" ry="7" fill="#d4f1bd" opacity="0.5" />
        <ellipse cx="132" cy="72" rx="13" ry="14" fill="#173c2b" stroke="#2c6148" strokeWidth="3" />
        <ellipse cx="132" cy="72" rx="6" ry="7" fill="#d4f1bd" opacity="0.5" />

        <ellipse cx="84" cy="68" rx="48" ry="44" fill="#1b4530" stroke="#2c6148" strokeWidth="3" />
        <path d="M 72 26 C 78 12 92 12 98 24 C 90 22 80 24 72 26 Z" fill="#0e8a5b" />
        <path d="M 96 28 C 104 18 116 20 118 30 C 110 28 102 30 96 28 Z" fill="#0e8a5b" opacity="0.8" />

        <ellipse cx="84" cy="82" rx="33" ry="28" fill="#d4f1bd" />

        <motion.ellipse
          cx="52"
          cy="90"
          rx="7"
          ry="5"
          fill="#ff9fa8"
          animate={{ opacity: cheekOpacity }}
          transition={{ duration: 0.4 }}
        />
        <motion.ellipse
          cx="116"
          cy="90"
          rx="7"
          ry="5"
          fill="#ff9fa8"
          animate={{ opacity: cheekOpacity }}
          transition={{ duration: 0.4 }}
        />

        <motion.path
          d={leftBrow}
          fill="none"
          stroke="#061710"
          strokeWidth="4"
          strokeLinecap="round"
          animate={{ d: leftBrow }}
          transition={{ duration: 0.25 }}
        />
        <motion.path
          d={rightBrow}
          fill="none"
          stroke="#061710"
          strokeWidth="4"
          strokeLinecap="round"
          animate={{ d: rightBrow }}
          transition={{ duration: 0.25 }}
        />

        {[62, 106].map((cx) => (
          <motion.g
            key={cx}
            animate={{ scaleY: eyesClosed ? 0.08 : eyeScale }}
            transition={{ duration: 0.09 }}
            style={{ originX: `${cx}px`, originY: '70px' }}
          >
            <ellipse cx={cx} cy="70" rx="12" ry="13" fill="#eaf7ee" />
            <circle cx={cx + lookX} cy="71" r="7" fill="#061710" />
            <circle cx={cx + lookX + 2.5} cy="67.5" r="2.4" fill="#eaf7ee" />
          </motion.g>
        ))}

        <ellipse cx="80" cy="84" rx="2" ry="1.6" fill="#5b7a4f" />
        <ellipse cx="88" cy="84" rx="2" ry="1.6" fill="#5b7a4f" />

        <motion.path
          d={mouthPath(state)}
          fill={state === 'surprised' || HAPPY_STATES.includes(state) ? '#061710' : 'none'}
          stroke="#061710"
          strokeWidth="3"
          strokeLinecap="round"
          animate={{ d: mouthPath(state) }}
          transition={{ duration: 0.25 }}
        />
        {HAPPY_STATES.includes(state) && (
          <ellipse cx="84" cy="103" rx="6" ry="3" fill="#ff8a9a" />
        )}
      </motion.g>

      {HAPPY_STATES.includes(state) && (
        <g fill="#f5c86b">
          <motion.path
            d="M 0 -6 L 1.5 -1.5 L 6 0 L 1.5 1.5 L 0 6 L -1.5 1.5 L -6 0 L -1.5 -1.5 Z"
            transform="translate(22 42)"
            variants={sparkleVariants}
            custom={0}
            animate="twinkle"
          />
          <motion.path
            d="M 0 -5 L 1.2 -1.2 L 5 0 L 1.2 1.2 L 0 5 L -1.2 1.2 L -5 0 L -1.2 -1.2 Z"
            transform="translate(150 36)"
            variants={sparkleVariants}
            custom={0.9}
            animate="twinkle"
          />
        </g>
      )}

      <path d="M 0 160 C 20 150 40 156 60 160" fill="none" stroke="#0e8a5b" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
    </motion.svg>
  );
}
