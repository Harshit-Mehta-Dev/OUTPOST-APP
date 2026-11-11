import React, { useEffect, useRef } from 'react';
import './BinaryScoutFace.css';

/**
 * BinaryScoutFace
 * Renders an interactive cybernetic AI neural face formed by binary digits (0 and 1).
 * Features:
 * - Dynamic binary particle grid shaping the AI face contours (eyes, brow, nose bridge, lips, neural aura).
 * - Real-time animation that blinks, looks around smoothly, and modulates mouth movements when Scout is speaking.
 * - Gentle floating binary matrix rain in the ambient perimeter.
 * - Subdued cyber-amber / neon orange glow aligned with Outpost's aesthetic.
 */
const BinaryScoutFace = ({ isSpeaking = false, isThinking = false }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Matrix background binary stream particles
    const columns = Math.floor(width / 24);
    const rainDrops = Array.from({ length: columns }, () => Math.random() * -50);

    // AI Facial node definitions in normalized coordinates (-1 to 1)
    const generateFacePoints = () => {
      const points = [];

      // 1. Face oval / chin contour
      for (let angle = 0; angle < Math.PI * 2; angle += 0.08) {
        const x = Math.sin(angle) * 0.72;
        // Egg-shaped multiplier for jawline
        const yMod = angle > Math.PI ? 0.95 : 1.25;
        const y = -Math.cos(angle) * 0.95 * yMod;
        points.push({ x, y, size: 10, type: 'contour', baseAlpha: 0.28 });
      }

      // Inner jawline & cheeks
      for (let angle = 0.3; angle < Math.PI - 0.3; angle += 0.12) {
        const x = Math.cos(angle) * 0.52;
        const y = Math.sin(angle) * 0.85 + 0.1;
        points.push({ x, y, size: 9, type: 'cheek', baseAlpha: 0.22 });
        points.push({ x: -x, y, size: 9, type: 'cheek', baseAlpha: 0.22 });
      }

      // 2. Forehead Neural Nodes / Cyber Crown
      for (let i = -0.55; i <= 0.55; i += 0.09) {
        points.push({ x: i, y: -0.78, size: 9, type: 'forehead', baseAlpha: 0.32 });
        points.push({ x: i * 0.8, y: -0.9, size: 8, type: 'forehead', baseAlpha: 0.2 });
      }

      // 3. Eyebrows
      for (let i = 0.12; i <= 0.46; i += 0.05) {
        // Left eyebrow
        points.push({ x: -i, y: -0.36 + (i - 0.25) * 0.2, size: 11, type: 'brow', baseAlpha: 0.65 });
        // Right eyebrow
        points.push({ x: i, y: -0.36 + (i - 0.25) * 0.2, size: 11, type: 'brow', baseAlpha: 0.65 });
      }

      // 4. Eyes (Almond cybernetic contours)
      // Left eye
      const leftEyeCenter = { x: -0.28, y: -0.16 };
      for (let a = 0; a < Math.PI * 2; a += 0.22) {
        const rx = 0.12 * Math.cos(a);
        const ry = 0.065 * Math.sin(a);
        points.push({ x: leftEyeCenter.x + rx, y: leftEyeCenter.y + ry, size: 11, type: 'left_eye_contour', baseAlpha: 0.85 });
      }
      // Left pupil
      points.push({ x: leftEyeCenter.x, y: leftEyeCenter.y, size: 13, type: 'left_pupil', baseAlpha: 0.95 });

      // Right eye
      const rightEyeCenter = { x: 0.28, y: -0.16 };
      for (let a = 0; a < Math.PI * 2; a += 0.22) {
        const rx = 0.12 * Math.cos(a);
        const ry = 0.065 * Math.sin(a);
        points.push({ x: rightEyeCenter.x + rx, y: rightEyeCenter.y + ry, size: 11, type: 'right_eye_contour', baseAlpha: 0.85 });
      }
      // Right pupil
      points.push({ x: rightEyeCenter.x, y: rightEyeCenter.y, size: 13, type: 'right_pupil', baseAlpha: 0.95 });

      // 5. Nose bridge & tip
      for (let y = -0.12; y <= 0.18; y += 0.06) {
        points.push({ x: 0, y, size: 10, type: 'nose_bridge', baseAlpha: 0.4 });
      }
      points.push({ x: -0.06, y: 0.2, size: 9, type: 'nose', baseAlpha: 0.5 });
      points.push({ x: 0, y: 0.22, size: 11, type: 'nose', baseAlpha: 0.6 });
      points.push({ x: 0.06, y: 0.2, size: 9, type: 'nose', baseAlpha: 0.5 });

      // 6. Mouth & Lips (will morph when speaking!)
      for (let x = -0.24; x <= 0.24; x += 0.04) {
        // Upper lip
        const uy = 0.42 - Math.cos((x / 0.24) * (Math.PI / 2)) * 0.03;
        points.push({ x, y: uy, size: 10, type: 'lip_upper', baseAlpha: 0.6 });
        // Lower lip
        const ly = 0.46 + Math.cos((x / 0.24) * (Math.PI / 2)) * 0.04;
        points.push({ x, y: ly, size: 10, type: 'lip_lower', baseAlpha: 0.65 });
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
    let nextBlink = 120 + Math.random() * 100;
    let isBlinking = false;

    // Smooth head movement
    let targetLookX = 0;
    let targetLookY = 0;
    let currentLookX = 0;
    let currentLookY = 0;

    const render = () => {
      time += 0.035;

      // Smooth look drift
      if (Math.floor(time * 30) % 180 === 0) {
        targetLookX = (Math.random() - 0.5) * 0.14;
        targetLookY = (Math.random() - 0.5) * 0.08;
      }
      currentLookX += (targetLookX - currentLookX) * 0.04;
      currentLookY += (targetLookY - currentLookY) * 0.04;

      // Handle Blinking
      nextBlink -= 1;
      if (nextBlink <= 0 && !isBlinking) {
        isBlinking = true;
        blinkProgress = 0;
      }
      if (isBlinking) {
        blinkProgress += 0.18;
        if (blinkProgress >= Math.PI) {
          isBlinking = false;
          blinkProgress = 0;
          nextBlink = 140 + Math.random() * 160;
        }
      }

      ctx.clearRect(0, 0, width, height);

      // --- 1. Ambient Falling Binary Rain in Background ---
      ctx.font = '11px monospace';
      for (let i = 0; i < rainDrops.length; i++) {
        const x = i * 24;
        const y = rainDrops[i];
        const char = (Math.floor(time * 10 + i) % 2 === 0) ? '1' : '0';

        ctx.fillStyle = 'rgba(255, 107, 43, 0.055)';
        ctx.fillText(char, x, y);

        rainDrops[i] += 2.2;
        if (rainDrops[i] > height) {
          rainDrops[i] = -20;
        }
      }

      // --- 2. Render Cybernetic Binary Face ---
      const centerX = width * 0.5 + currentLookX * 40;
      const centerY = height * 0.44 + currentLookY * 30;
      const faceScale = Math.min(width, height) * 0.42;

      // Mouth modulation when speaking
      const mouthMod = isSpeaking ? Math.sin(time * 18) * 0.05 : 0;
      const eyeBlinkScale = isBlinking ? Math.max(0.08, Math.abs(Math.cos(blinkProgress))) : 1;

      // Pulsing aura when thinking or speaking
      const auraPulse = (isSpeaking || isThinking) 
        ? (0.85 + Math.sin(time * 8) * 0.15) 
        : (0.7 + Math.sin(time * 2) * 0.08);

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

        // Apply mouth opening motion
        if (node.type === 'lip_lower') {
          ptY += Math.max(0, mouthMod * 1.6);
        } else if (node.type === 'lip_upper') {
          ptY -= Math.max(0, mouthMod * 0.6);
        }

        // Apply eye blink compression
        if (node.type === 'left_eye_contour' || node.type === 'left_pupil') {
          const dy = ptY - (-0.16);
          ptY = -0.16 + dy * eyeBlinkScale;
        } else if (node.type === 'right_eye_contour' || node.type === 'right_pupil') {
          const dy = ptY - (-0.16);
          ptY = -0.16 + dy * eyeBlinkScale;
        }

        // Thinking neural ripple effect
        if (isThinking && (node.type === 'forehead' || node.type === 'brow')) {
          ptY += Math.sin(time * 10 + node.x * 6) * 0.02;
        }

        const screenX = centerX + ptX * faceScale;
        const screenY = centerY + ptY * faceScale;

        // Color modulation based on node type and status
        let alpha = node.baseAlpha * auraPulse;
        let color = `rgba(255, 107, 43, ${alpha})`;

        if (node.type === 'left_pupil' || node.type === 'right_pupil') {
          color = isSpeaking ? `rgba(255, 230, 150, ${alpha * 1.3})` : `rgba(255, 138, 77, ${alpha * 1.2})`;
        } else if (node.type === 'lip_upper' || node.type === 'lip_lower') {
          color = isSpeaking ? `rgba(255, 180, 120, ${Math.min(1, alpha * 1.4)})` : `rgba(255, 107, 43, ${alpha})`;
        } else if (isThinking && (node.type === 'forehead' || node.type === 'brow')) {
          color = `rgba(255, 180, 80, ${Math.min(1, alpha * 1.3)})`;
        }

        ctx.font = `bold ${node.size}px "JetBrains Mono", Consolas, monospace`;
        ctx.fillStyle = color;
        ctx.fillText(node.char, screenX, screenY);
      }

      // Connecting neural synapic lines between key face points
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = `rgba(255, 107, 43, ${0.07 * auraPulse})`;
      ctx.beginPath();
      // Left eye contour connect
      const leftEyePoints = faceNodes.filter(n => n.type === 'left_eye_contour');
      for (let j = 0; j < leftEyePoints.length; j++) {
        const next = leftEyePoints[(j + 1) % leftEyePoints.length];
        ctx.moveTo(centerX + leftEyePoints[j].x * faceScale, centerY + leftEyePoints[j].y * faceScale);
        ctx.lineTo(centerX + next.x * faceScale, centerY + next.y * faceScale);
      }
      // Right eye contour connect
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
      window.removeEventListener('resize', handleResize);
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
