import React, { useEffect, useRef } from 'react';
import './BinaryScoutFace.css';

/**
 * BinaryScoutFace
 * Cybernetic AI face rendered cleanly in binary 0 & 1 characters.
 * Features:
 * - High-visibility luminous glowing binary contours (eyes, brows, nose, lips, jawline)
 * - Eye-blinking cycles, natural gaze drift, speaking mouth modulation
 * - Ambient background falling matrix binary rain
 * - High-contrast neon amber glow tuned for Outpost dark aesthetic
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
      canvas.width = Math.max(w, 320);
      canvas.height = Math.max(h, 320);
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    // Matrix background binary stream particles
    let columns = Math.floor(canvas.width / 26);
    let rainDrops = Array.from({ length: columns }, () => Math.random() * -60);

    // AI Facial node definitions in normalized coordinates (-1 to 1)
    const generateFacePoints = () => {
      const points = [];

      // 1. Jawline & Chin contour (dense binary curve)
      for (let angle = 0; angle <= Math.PI * 2; angle += 0.07) {
        const x = Math.sin(angle) * 0.72;
        const yMod = angle > Math.PI ? 0.95 : 1.25;
        const y = -Math.cos(angle) * 0.92 * yMod;
        points.push({ x, y, size: 12, type: 'contour', baseAlpha: 0.55 });
      }

      // Inner cheek structure
      for (let angle = 0.35; angle < Math.PI - 0.35; angle += 0.1) {
        const x = Math.cos(angle) * 0.52;
        const y = Math.sin(angle) * 0.82 + 0.08;
        points.push({ x, y, size: 11, type: 'cheek', baseAlpha: 0.45 });
        points.push({ x: -x, y, size: 11, type: 'cheek', baseAlpha: 0.45 });
      }

      // 2. Forehead Cyber Arc
      for (let i = -0.58; i <= 0.58; i += 0.08) {
        points.push({ x: i, y: -0.75, size: 11, type: 'forehead', baseAlpha: 0.55 });
        points.push({ x: i * 0.82, y: -0.88, size: 10, type: 'forehead', baseAlpha: 0.4 });
      }

      // 3. Eyebrows (Distinct strong binary arches)
      for (let i = 0.12; i <= 0.48; i += 0.04) {
        // Left brow
        points.push({ x: -i, y: -0.36 + (i - 0.25) * 0.22, size: 13, type: 'brow', baseAlpha: 0.9 });
        // Right brow
        points.push({ x: i, y: -0.36 + (i - 0.25) * 0.22, size: 13, type: 'brow', baseAlpha: 0.9 });
      }

      // 4. Eyes (High-contrast almond eyes with glowing pupil core)
      const leftEyeCenter = { x: -0.28, y: -0.16 };
      for (let a = 0; a < Math.PI * 2; a += 0.18) {
        const rx = 0.13 * Math.cos(a);
        const ry = 0.07 * Math.sin(a);
        points.push({ x: leftEyeCenter.x + rx, y: leftEyeCenter.y + ry, size: 13, type: 'left_eye_contour', baseAlpha: 0.95 });
      }
      points.push({ x: leftEyeCenter.x, y: leftEyeCenter.y, size: 15, type: 'left_pupil', baseAlpha: 1.0 });

      const rightEyeCenter = { x: 0.28, y: -0.16 };
      for (let a = 0; a < Math.PI * 2; a += 0.18) {
        const rx = 0.13 * Math.cos(a);
        const ry = 0.07 * Math.sin(a);
        points.push({ x: rightEyeCenter.x + rx, y: rightEyeCenter.y + ry, size: 13, type: 'right_eye_contour', baseAlpha: 0.95 });
      }
      points.push({ x: rightEyeCenter.x, y: rightEyeCenter.y, size: 15, type: 'right_pupil', baseAlpha: 1.0 });

      // 5. Nose bridge & nostril dots
      for (let y = -0.12; y <= 0.18; y += 0.05) {
        points.push({ x: 0, y, size: 12, type: 'nose_bridge', baseAlpha: 0.65 });
      }
      points.push({ x: -0.07, y: 0.20, size: 11, type: 'nose', baseAlpha: 0.75 });
      points.push({ x: 0, y: 0.22, size: 13, type: 'nose', baseAlpha: 0.85 });
      points.push({ x: 0.07, y: 0.20, size: 11, type: 'nose', baseAlpha: 0.75 });

      // 6. Mouth & Lips (morphs visibly when speaking)
      for (let x = -0.25; x <= 0.25; x += 0.035) {
        const uy = 0.42 - Math.cos((x / 0.25) * (Math.PI / 2)) * 0.03;
        points.push({ x, y: uy, size: 13, type: 'lip_upper', baseAlpha: 0.9 });
        const ly = 0.46 + Math.cos((x / 0.25) * (Math.PI / 2)) * 0.04;
        points.push({ x, y: ly, size: 13, type: 'lip_lower', baseAlpha: 0.95 });
      }

      return points;
    };

    const faceNodes = generateFacePoints().map((pt, idx) => ({
      ...pt,
      char: idx % 2 === 0 ? '1' : '0',
      nextFlip: Math.random() * 60 + 20
    }));

    let time = 0;
    let blinkProgress = 0;
    let nextBlink = 120 + Math.random() * 80;
    let isBlinking = false;

    let targetLookX = 0;
    let targetLookY = 0;
    let currentLookX = 0;
    let currentLookY = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      time += 0.035;

      // Smooth eye & head gaze shift
      if (Math.floor(time * 30) % 160 === 0) {
        targetLookX = (Math.random() - 0.5) * 0.12;
        targetLookY = (Math.random() - 0.5) * 0.08;
      }
      currentLookX += (targetLookX - currentLookX) * 0.04;
      currentLookY += (targetLookY - currentLookY) * 0.04;

      // Natural eye blinking
      nextBlink -= 1;
      if (nextBlink <= 0 && !isBlinking) {
        isBlinking = true;
        blinkProgress = 0;
      }
      if (isBlinking) {
        blinkProgress += 0.2;
        if (blinkProgress >= Math.PI) {
          isBlinking = false;
          blinkProgress = 0;
          nextBlink = 120 + Math.random() * 140;
        }
      }

      ctx.clearRect(0, 0, width, height);

      // --- 1. Ambient Falling Matrix Binary Rain in Background ---
      ctx.font = '11px monospace';
      for (let i = 0; i < rainDrops.length; i++) {
        const x = i * 26;
        const y = rainDrops[i];
        const char = (Math.floor(time * 8 + i) % 2 === 0) ? '1' : '0';

        ctx.fillStyle = 'rgba(255, 107, 43, 0.12)';
        ctx.fillText(char, x, y);

        rainDrops[i] += 2.5;
        if (rainDrops[i] > height) {
          rainDrops[i] = -20;
        }
      }

      // --- 2. Render Cybernetic Binary Face ---
      const centerX = width * 0.5 + currentLookX * 45;
      const centerY = height * 0.42 + currentLookY * 30;
      const faceScale = Math.min(width, height) * 0.44;

      const mouthMod = isSpeaking ? Math.sin(time * 18) * 0.06 : 0;
      const eyeBlinkScale = isBlinking ? Math.max(0.08, Math.abs(Math.cos(blinkProgress))) : 1;
      const auraPulse = (isSpeaking || isThinking) 
        ? (0.95 + Math.sin(time * 8) * 0.12) 
        : (0.85 + Math.sin(time * 2) * 0.08);

      for (let i = 0; i < faceNodes.length; i++) {
        const node = faceNodes[i];

        // Randomly flip binary digit
        node.nextFlip -= 1;
        if (node.nextFlip <= 0) {
          node.char = node.char === '1' ? '0' : '1';
          node.nextFlip = 40 + Math.random() * 80;
        }

        let ptX = node.x;
        let ptY = node.y;

        // Apply mouth opening motion when speaking
        if (node.type === 'lip_lower') {
          ptY += Math.max(0, mouthMod * 1.8);
        } else if (node.type === 'lip_upper') {
          ptY -= Math.max(0, mouthMod * 0.7);
        }

        // Apply eye blink compression
        if (node.type === 'left_eye_contour' || node.type === 'left_pupil') {
          const dy = ptY - (-0.16);
          ptY = -0.16 + dy * eyeBlinkScale;
        } else if (node.type === 'right_eye_contour' || node.type === 'right_pupil') {
          const dy = ptY - (-0.16);
          ptY = -0.16 + dy * eyeBlinkScale;
        }

        // Neural ripple when thinking
        if (isThinking && (node.type === 'forehead' || node.type === 'brow')) {
          ptY += Math.sin(time * 10 + node.x * 6) * 0.02;
        }

        const screenX = centerX + ptX * faceScale;
        const screenY = centerY + ptY * faceScale;

        // High-clarity color modulation
        let alpha = Math.min(1, node.baseAlpha * auraPulse);
        let color = `rgba(255, 120, 50, ${alpha})`;

        if (node.type === 'left_pupil' || node.type === 'right_pupil') {
          color = isSpeaking ? `rgba(255, 240, 180, ${alpha})` : `rgba(255, 160, 90, ${alpha})`;
        } else if (node.type === 'lip_upper' || node.type === 'lip_lower') {
          color = isSpeaking ? `rgba(255, 195, 140, ${alpha})` : `rgba(255, 120, 50, ${alpha})`;
        } else if (isThinking && (node.type === 'forehead' || node.type === 'brow')) {
          color = `rgba(255, 195, 90, ${alpha})`;
        }

        ctx.font = `bold ${node.size}px "JetBrains Mono", Consolas, monospace`;
        ctx.fillStyle = color;
        ctx.fillText(node.char, screenX, screenY);
      }

      // Connecting neural synapse lines between eyes
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = `rgba(255, 120, 50, ${0.12 * auraPulse})`;
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
