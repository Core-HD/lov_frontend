import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  radius: number;
  speed: number;
  drift: number;
  phase: number;
  alpha: number;
}

interface Leaf {
  x: number;
  y: number;
  size: number;
  rotation: number;
  spin: number;
  speed: number;
  depth: number;
}

const reducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function createParticles(count: number, width: number, height: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: 0.6 + Math.random() * 2.2,
    speed: 0.1 + Math.random() * 0.35,
    drift: (Math.random() - 0.5) * 0.25,
    phase: Math.random() * Math.PI * 2,
    alpha: 0.35 + Math.random() * 0.55,
  }));
}

function createLeaves(count: number, width: number, height: number): Leaf[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: 60 + Math.random() * 120,
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.0015,
    speed: 0.05 + Math.random() * 0.12,
    depth: 0.3 + Math.random() * 0.7,
  }));
}

function drawLeaf(context: CanvasRenderingContext2D, leaf: Leaf): void {
  context.save();
  context.translate(leaf.x, leaf.y);
  context.rotate(leaf.rotation);
  context.globalAlpha = 0.05 + leaf.depth * 0.06;
  context.fillStyle = '#0e8a5b';
  context.beginPath();
  context.moveTo(0, 0);
  context.bezierCurveTo(leaf.size * 0.35, -leaf.size * 0.4, leaf.size * 0.8, -leaf.size * 0.1, leaf.size, 0);
  context.bezierCurveTo(leaf.size * 0.8, leaf.size * 0.1, leaf.size * 0.35, leaf.size * 0.4, 0, 0);
  context.fill();
  context.restore();
}

export function JungleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const still = reducedMotion();
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let leaves: Leaf[] = [];
    let frame = 0;
    let last = performance.now();

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const density = Math.min(1, (width * height) / (1440 * 900));
      particles = createParticles(still ? 0 : Math.round(70 * density), width, height);
      leaves = createLeaves(still ? 2 : 5, width, height);
      drawStatic();
    };

    const drawFrame = (now: number) => {
      const delta = Math.min(64, now - last);
      last = now;
      context.clearRect(0, 0, width, height);
      leaves.forEach((leaf) => {
        leaf.y += leaf.speed * leaf.depth * delta * 0.05;
        leaf.rotation += leaf.spin * delta;
        if (leaf.y - leaf.size > height) leaf.y = -leaf.size;
        drawLeaf(context, leaf);
      });
      particles.forEach((particle) => {
        particle.y -= particle.speed * delta * 0.04;
        particle.x += Math.sin(now * 0.0005 + particle.phase) * particle.drift;
        if (particle.y < -4) {
          particle.y = height + 4;
          particle.x = Math.random() * width;
        }
        const twinkle = 0.6 + Math.sin(now * 0.002 + particle.phase) * 0.4;
        context.globalAlpha = particle.alpha * twinkle;
        context.shadowBlur = particle.radius * 6;
        context.shadowColor = 'rgba(185, 247, 124, 0.9)';
        context.fillStyle = '#d6ffb0';
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      });
      context.shadowBlur = 0;
      context.globalAlpha = 1;
      frame = requestAnimationFrame(drawFrame);
    };

    const drawStatic = () => {
      context.clearRect(0, 0, width, height);
      leaves.forEach((leaf) => drawLeaf(context, leaf));
      particles.forEach((particle) => {
        context.globalAlpha = particle.alpha * 0.7;
        context.fillStyle = '#d6ffb0';
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      });
      context.globalAlpha = 1;
    };

    const handleVisibility = () => {
      cancelAnimationFrame(frame);
      if (document.hidden || still) return;
      last = performance.now();
      frame = requestAnimationFrame(drawFrame);
    };

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', handleVisibility);
    if (!still) frame = requestAnimationFrame(drawFrame);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <div className="decor-layer jungle-layer" aria-hidden="true">
      <div className="jungle-gradient" />
      <div className="jungle-fog jungle-fog--a" />
      <div className="jungle-fog jungle-fog--b" />
      <canvas ref={canvasRef} className="jungle-canvas" />
    </div>
  );
}
