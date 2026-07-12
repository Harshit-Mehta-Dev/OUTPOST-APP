import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";

export function BeamsBackground({ className = "", intensity = "strong", fixed = false }) {
    const canvasRef = useRef(null);
    const beamsRef = useRef([]);
    const animationFrameRef = useRef(0);
    const MINIMUM_BEAMS = 18;

    const opacityMap = {
        subtle: 0.7,
        medium: 0.85,
        strong: 1,
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const updateThemeColor = () => {
            const rootStyle = getComputedStyle(document.documentElement);
            return rootStyle.getPropertyValue('--brand-primary').trim() || '234, 88, 12';
        };

        const updateCanvasSize = () => {
            const scaleFactor = 0.5; 
            canvas.width = window.innerWidth * scaleFactor;
            canvas.height = window.innerHeight * scaleFactor;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            
            ctx.scale(scaleFactor, scaleFactor);

            const themeColor = updateThemeColor();
            
            beamsRef.current = Array.from({ length: MINIMUM_BEAMS }, (_, i) => {
                const spacing = window.innerWidth / MINIMUM_BEAMS;
                return {
                    x: (i * spacing) + (Math.random() * spacing) - (window.innerWidth * 0.2),
                    y: Math.random() * window.innerHeight * 2 - window.innerHeight,
                    width: 60 + Math.random() * 50,
                    length: window.innerHeight * 2.5,
                    angle: -35,
                    speed: 0.6 + (i % 4) * 0.15, // Consistent and elegant speeds
                    opacity: 0.12 + Math.random() * 0.15,
                    pulse: Math.random() * Math.PI * 2,
                    pulseSpeed: 0.015,
                    colorStr: themeColor
                };
            });
        };

        updateCanvasSize();
        window.addEventListener("resize", updateCanvasSize);

        // Listen for theme changes dynamically
        const themeInterval = setInterval(() => {
            const newColor = updateThemeColor();
            beamsRef.current.forEach(beam => beam.colorStr = newColor);
        }, 1000);

        function drawBeam(ctx, beam) {
            ctx.save();
            ctx.translate(beam.x, beam.y);
            ctx.rotate((beam.angle * Math.PI) / 180);
            ctx.translate(0, beam.length / 2);
            
            const pulsingOpacity =
                beam.opacity *
                (0.8 + Math.sin(beam.pulse) * 0.2) *
                opacityMap[intensity];

            ctx.scale(beam.width / 2, beam.length / 2);

            const radGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
            radGrad.addColorStop(0, `rgba(${beam.colorStr}, ${pulsingOpacity})`);
            radGrad.addColorStop(0.3, `rgba(${beam.colorStr}, ${pulsingOpacity * 0.8})`);
            radGrad.addColorStop(1, `rgba(${beam.colorStr}, 0)`);

            ctx.fillStyle = radGrad;
            ctx.beginPath();
            ctx.arc(0, 0, 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        function animate() {
            if (!canvas || !ctx) return;

            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

            beamsRef.current.forEach((beam) => {
                beam.y -= beam.speed;
                // Move x proportionally to the angle so it flows smoothly across the screen
                beam.x += beam.speed * Math.tan(Math.abs(beam.angle) * (Math.PI / 180)); 
                beam.pulse += beam.pulseSpeed;

                if (beam.y + beam.length < -100) {
                    beam.y = window.innerHeight + 100;
                    beam.x = Math.random() * window.innerWidth * 1.5 - window.innerWidth * 0.5;
                }

                drawBeam(ctx, beam);
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        }

        animate();

        return () => {
            window.removeEventListener("resize", updateCanvasSize);
            clearInterval(themeInterval);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [intensity]);

    return (
        <div
            className={`beams-container ${className}`}
            style={{ position: fixed ? "fixed" : "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "hidden", zIndex: -1 }}
        >
            <canvas
                ref={canvasRef}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", transform: "translateZ(0)", pointerEvents: "none" }}
            />
            <motion.div
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.02)", pointerEvents: "none" }}
                animate={{
                    opacity: [0.02, 0.1, 0.02],
                }}
                transition={{
                    duration: 10,
                    ease: "easeInOut",
                    repeat: Number.POSITIVE_INFINITY,
                }}
            />
        </div>
    );
}
