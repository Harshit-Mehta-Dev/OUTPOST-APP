import React, { useEffect, useRef } from 'react';
import './BinaryScoutFace.css';

/**
 * BinaryScoutFace
 * Advanced cybernetic AI face rendered using dynamic glowing binary 0 & 1 particles.
 * Features:
 * - High-definition full-face anatomy:
 *   Forehead neural grid, arched cybernetic eyebrows, glowing iris & pupils,
 *   nose bridge, natural cheek curves, articulated speaking lips, chin & jawline.
 * - Dynamic flashing binary light bursts:
 *   Shooting cyber-binary beams and pulsing node flashes across the face aura.
 * - Ambient background falling matrix rain of 0 and 1 digits.
 * - Expressive eye-blinking, smooth human-like gaze tracking, and speech-synced mouth articulation.
 */
const BinaryScoutFace = ({ isSpeaking = false, isThinking = false }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;

    const updateDimensions = () => {
      const parent = canvas.parentElement;
      const w = parent ? parent.clientWidth : window.innerWidth;
      const h = parent ? parent.clientHeight : window.innerHeight;
      canvas.width = Math.max(w, 360);
      canvas.height = Math.max(h, 360);
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    // Matrix background binary rain
    let columns = Math.floor(canvas.width / 24);
    let rainDrops = Array.from({ length: columns }, () => Math.random() * -80);

    // Dynamic flashing binary light bursts (beams of light passing through the background)
    const flashBursts = Array.from({ length: 6 }, () => ({
      x: Math.random(),
      y: Math.random(),
      speed: 0.003 + Math.random() * 0.005,
      radius: 60 + Math.random() * 120,
      intensity: 0.15 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2
    }));

    // Generate detailed cybernetic facial feature nodes
    const generateFacePoints = () => {
      const points = [];

      // 1. Jawline & Chin Contour (Smooth organic curve)
      for (let angle = 0; angle <= Math.PI * 2; angle += 0.065) {
        const x = Math.sin(angle) * 0.74;
        const yMod = angle > Math.PI ? 0.96 : 1.28;
        const y = -Math.cos(angle) * 0.94 * yMod;
        points.push({ x, y, size: 12, type: 'contour', baseAlpha: 0.65 });
      }

      // Cheekbone & Temple accent contours
      for (let angle = 0.32; angle < Math.PI - 0.32; angle += 0.09) {
        const x = Math.cos(angle) * 0.54;
        const y = Math.sin(angle) * 0.82 + 0.06;
        points.push({ x, y, size: 11, type: 'cheek', baseAlpha: 0.5 });
        points.push({ x: -x, y, size: 11, type: 'cheek', baseAlpha: 0.5 });
      }

      // 2. Forehead & Neural Cyber Crown
      for (let i = -0.62; i <= 0.62; i += 0.075) {
        points.push({ x: i, y: -0.74, size: 12, type: 'forehead', baseAlpha: 0.65 });
        points.push({ x: i * 0.85, y: -0.88, size: 11, type: 'forehead', baseAlpha: 0.5 });
        points.push({ x: i * 0.65, y: -1.02, size: 10, type: 'forehead', baseAlpha: 0.35 });
      }

      // 3. Eyebrows (Arched expressive curves)
      for (let i = 0.10; i <= 0.50; i += 0.038) {
        const browArc = -0.37 + (i - 0.26) * 0.24;
        // Left eyebrow (double layered for depth)
        points.push({ x: -i, y: browArc, size: 13, type: 'brow', baseAlpha: 0.95 });
        points.push({ x: -i, y: browArc - 0.035, size: 11, type: 'brow', baseAlpha: 0.6 });
        // Right eyebrow
        points.push({ x: i, y: browArc, size: 13, type: 'brow', baseAlpha: 0.95 });
        points.push({ x: i, y: browArc - 0.035, size: 11, type: 'brow', baseAlpha: 0.6 });
      }

      // 4. Eyes: High-Definition Cybernetic Lids, Iris, and Glowing Pupils
      // Left Eye
      const leftEyeCenter = { x: -0.28, y: -0.16 };
      for (let a = 0; a < Math.PI * 2; a += 0.16) {
        const rx = 0.135 * Math.cos(a);
        const ry = 0.075 * Math.sin(a);
        points.push({ x: leftEyeCenter.x + rx, y: leftEyeCenter.y + ry, size: 13, type: 'left_eye_contour', baseAlpha: 0.95 });
      }
      // Left Iris Ring
      for (let a = 0; a < Math.PI * 2; a += 0.5) {
        const rx = 0.05 * Math.cos(a);
        const ry = 0.045 * Math.sin(a);
        points.push({ x: leftEyeCenter.x + rx, y: leftEyeCenter.y + ry, size: 11, type: 'left_iris', baseAlpha: 0.9 });
      }
      // Left Glowing Pupil
      points.push({ x: leftEyeCenter.x, y: leftEyeCenter.y, size: 16, type: 'left_pupil', baseAlpha: 1.0 });

      // Right Eye
      const rightEyeCenter = { x: 0.28, y: -0.16 };
      for (let a = 0; a < Math.PI * 2; a += 0.16) {
        const rx = 0.135 * Math.cos(a);
        const ry = 0.075 * Math.sin(a);
        points.push({ x: rightEyeCenter.x + rx, y: rightEyeCenter.y + ry, size: 13, type: 'right_eye_contour', baseAlpha: 0.95 });
      }
      // Right Iris Ring
      for (let a = 0; a < Math.PI * 2; a += 0.5) {
        const rx = 0.05 * Math.cos(a);
        const ry = 0.045 * Math.sin(a);
        points.push({ x: rightEyeCenter.x + rx, y: rightEyeCenter.y + ry, size: 11, type: 'right_iris', baseAlpha: 0.9 });
      }
      // Right Glowing Pupil
      points.push({ x: rightEyeCenter.x, y: rightEyeCenter.y, size: 16, type: 'right_pupil', baseAlpha: 1.0 });

      // 5. Nose Bridge, Tip & Wing Curves
      for (let y = -0.13; y <= 0.18; y += 0.045) {
        points.push({ x: 0, y, size: 12, type: 'nose_bridge', baseAlpha: 0.75 });
      }
      points.push({ x: -0.075, y: 0.19, size: 12, type: 'nose', baseAlpha: 0.8 });
      points.push({ x: 0, y: 0.22, size: 14, type: 'nose', baseAlpha: 0.9 });
      points.push({ x: 0.075, y: 0.19, size: 12, type: 'nose', baseAlpha: 0.8 });

      // 6. Natural Lips & Mouth (Upper + Lower contour that morphs dynamically when speaking)
      for (let x = -0.26; x <= 0.26; x += 0.032) {
        const cupidArc = -0.035 * Math.cos((x / 0.26) * Math.PI);
        const uy = 0.42 + cupidArc;
        points.push({ x, y: uy, size: 13, type: 'lip_upper', baseAlpha: 0.95 });
        const ly = 0.46 - cupidArc * 1.2;
        points.push({ x, y: ly, size: 13, type: 'lip_lower', baseAlpha: 1.0 });
      }

      return points;
    };

    const faceNodes = generateFacePoints().map((pt, idx) => ({
      ...pt,
      char: idx % 2 === 0 ? '1' : '0',
      nextFlip: Math.random() * 50 + 15
    }));

    let time = 0;
    let blinkProgress = 0;
    let nextBlink = 120 + Math.random() * 90;
    let isBlinking = false;

    let targetLookX = 0;
    let targetLookY = 0;
    let currentLookX = 0;
    let currentLookY = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      time += 0.038;

      // Smooth gaze tracking drift
      if (Math.floor(time * 30) % 150 === 0) {
        targetLookX = (Math.random() - 0.5) * 0.14;
        targetLookY = (Math.random() - 0.5) * 0.09;
      }
      currentLookX += (targetLookX - currentLookX) * 0.045;
      currentLookY += (targetLookY - currentLookY) * 0.045;

      // Natural eye blinking
      nextBlink -= 1;
      if (nextBlink <= 0 && !isBlinking) {
        isBlinking = true;
        blinkProgress = 0;
      }
      if (isBlinking) {
        blinkProgress += 0.22;
        if (blinkProgress >= Math.PI) {
          isBlinking = false;
          blinkProgress = 0;
          nextBlink = 120 + Math.random() * 140;
        }
      }

      ctx.clearRect(0, 0, width, height);

      // --- 1. Flashing Binary Beams & Ambient Light Bursts in Background ---
      for (const burst of flashBursts) {
        burst.phase += burst.speed * 2;
        const currentAlpha = Math.max(0, Math.sin(burst.phase)) * burst.intensity;
        if (currentAlpha > 0.02) {
          const gx = burst.x * width;
          const gy = burst.y * height;
          const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, burst.radius);
          grad.addColorStop(0, `rgba(255, 120, 50, ${currentAlpha * 0.45})`);
          grad.addColorStop(0.6, `rgba(255, 80, 30, ${currentAlpha * 0.18})`);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(gx, gy, burst.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // --- 2. Ambient Falling Matrix Binary Rain ---
      ctx.font = '12px monospace';
      for (let i = 0; i < rainDrops.length; i++) {
        const x = i * 24;
        const y = rainDrops[i];
        const char = (Math.floor(time * 8 + i) % 2 === 0) ? '1' : '0';

        // Flashing binary lights trigger bright glowing streaks in rain
        const isFlashColumn = (i % 7 === 0 && Math.sin(time * 3 + i) > 0.6);
        const rainAlpha = isFlashColumn ? 0.35 : 0.12;

        ctx.fillStyle = isFlashColumn ? `rgba(255, 210, 140, ${rainAlpha})` : `rgba(255, 110, 45, ${rainAlpha})`;
        ctx.fillText(char, x, y);

        rainDrops[i] += 2.8;
        if (rainDrops[i] > height) {
          rainDrops[i] = -25;
        }
      }

      // --- 3. Render Cybernetic Binary Face ---
      const centerX = width * 0.5 + currentLookX * 45;
      const centerY = height * 0.42 + currentLookY * 30;
      const faceScale = Math.min(width, height) * 0.44;

      const mouthMod = isSpeaking ? Math.sin(time * 18) * 0.065 : 0;
      const eyeBlinkScale = isBlinking ? Math.max(0.06, Math.abs(Math.cos(blinkProgress))) : 1;
      const auraPulse = (isSpeaking || isThinking) 
        ? (0.98 + Math.sin(time * 8) * 0.15) 
        : (0.88 + Math.sin(time * 2.5) * 0.1);

      // Radial backlight beacon centered right behind the face
      const faceBacklight = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, faceScale * 1.15);
      faceBacklight.addColorStop(0, `rgba(255, 107, 43, ${0.16 * auraPulse})`);
      faceBacklight.addColorStop(0.5, `rgba(255, 75, 25, ${0.08 * auraPulse})`);
      faceBacklight.addColorStop(1, 'transparent');
      ctx.fillStyle = faceBacklight;
      ctx.beginPath();
      ctx.arc(centerX, centerY, faceScale * 1.15, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < faceNodes.length; i++) {
        const node = faceNodes[i];

        // Randomly flip binary digit
        node.nextFlip -= 1;
        if (node.nextFlip <= 0) {
          node.char = node.char === '1' ? '0' : '1';
          node.nextFlip = 30 + Math.random() * 70;
        }

        let ptX = node.x;
        let ptY = node.y;

        // Dynamic mouth movement when speaking
        if (node.type === 'lip_lower') {
          ptY += Math.max(0, mouthMod * 1.9);
        } else if (node.type === 'lip_upper') {
          ptY -= Math.max(0, mouthMod * 0.8);
        }

        // Eye blinking compression
        if (node.type.includes('left_eye') || node.type.includes('left_pupil') || node.type.includes('left_iris')) {
          const dy = ptY - (-0.16);
          ptY = -0.16 + dy * eyeBlinkScale;
        } else if (node.type.includes('right_eye') || node.type.includes('right_pupil') || node.type.includes('right_iris')) {
          const dy = ptY - (-0.16);
          ptY = -0.16 + dy * eyeBlinkScale;
        }

        // Neural ripple across crown when thinking
        if (isThinking && (node.type === 'forehead' || node.type === 'brow')) {
          ptY += Math.sin(time * 10 + node.x * 6) * 0.02;
        }

        const screenX = centerX + ptX * faceScale;
        const screenY = centerY + ptY * faceScale;

        // Bright high-visibility color palette
        let alpha = Math.min(1, node.baseAlpha * auraPulse);
        let color = `rgba(255, 120, 50, ${alpha})`;

        if (node.type === 'left_pupil' || node.type === 'right_pupil') {
          color = isSpeaking ? `rgba(255, 255, 210, ${alpha})` : `rgba(255, 200, 110, ${alpha})`;
        } else if (node.type === 'lip_upper' || node.type === 'lip_lower') {
          color = isSpeaking ? `rgba(255, 210, 150, ${alpha})` : `rgba(255, 130, 60, ${alpha})`;
        } else if (isThinking && (node.type === 'forehead' || node.type === 'brow')) {
          color = `rgba(255, 215, 100, ${alpha})`;
        }

        ctx.font = `bold ${node.size}px "JetBrains Mono", Consolas, monospace`;
        ctx.fillStyle = color;
        ctx.fillText(node.char, screenX, screenY);
      }

      // Connecting neural synapic lines between key facial structures
      ctx.lineWidth = 0.85;
      ctx.strokeStyle = `rgba(255, 130, 60, ${0.14 * auraPulse})`;
      ctx.beginPath();
      const leftEyePoints = faceNodes.filter(n => n.type === 'left_eye_contour');
      for (let j = 0; j < leftEyePoints.length; j++) {
        const next = leftEyePoints[(j + 1) % leftEyePoints.length];
        ctx.moveTo(centerX + leftEyePoints[j].x * faceScale, centerY + leftEyePoints[j].y * faceScale);
        ctx.lineTo(centerX + next.x * faceScale, centerY + next.y * faceScale);
      }
      const rightEyePoints = faceNodes.filter(n => n.type === 'right_eye_contour');
      for (let j = 0; j < rightEyePoints.length; j++) {
        const next = rightEyePoints[(j + 1) % rightEyePoints.length];
        ctx.moveTo(centerX + rightEyePoints[j].x * faceScale, centerY + rightEyePoints[j].y * faceScale);
        ctx.lineTo(centerX + next.x * faceScale, centerY + next.y * faceScale);
      }
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateDimensions);
    };
  }, [isSpeaking, isThinking]);

  return (
    <div className={`scout-binary-face-wrapper ${isSpeaking ? 'is-speaking' : ''} ${isThinking ? 'is-thinking' : ''}`}>
      <canvas ref={canvasRef} className="scout-binary-face-canvas" />
      <div className="scout-face-glow-vignette" />
    </div>
  );
};

export default BinaryScoutFace;
