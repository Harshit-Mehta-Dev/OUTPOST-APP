import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";

function createBeam(width, height) {
    const angle = -15 + Math.random() * 30; // Slanted light rays
    return {
        x: Math.random() * width * 1.5 - width * 0.25, // Start anywhere initially
        y: -height * 0.1 - Math.random() * height * 0.2, // Originate from the top surface
        width: 60 + Math.random() * 60, // Elegant, varied widths
        length: height * 2.5, // Long enough to reach the ocean floor
        angle: angle,
        speed: 0.6 + Math.random() * 1.2, // Sweeping speed
        opacity: 0.1 + Math.random() * 0.15,
        hue: 15 + Math.random() * 25,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.015 + Math.random() * 0.02,
    };
}

export function BeamsBackground({ className = "", intensity = "strong", fixed = false }) {
    const canvasRef = useRef(null);
    const beamsRef = useRef([]);
    const animationFrameRef = useRef(0);
    const MINIMUM_BEAMS = 6; // Very few rays to avoid traffic

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

        const updateCanvasSize = () => {
            const scaleFactor = 0.5; 
            canvas.width = window.innerWidth * scaleFactor;
            canvas.height = window.innerHeight * scaleFactor;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            
            ctx.scale(scaleFactor, scaleFactor);

            const totalBeams = MINIMUM_BEAMS;
            beamsRef.current = Array.from({ length: totalBeams }, () =>
                createBeam(window.innerWidth, window.innerHeight)
            );
        };

        updateCanvasSize();
        window.addEventListener("resize", updateCanvasSize);

        function resetBeam(beam, index) {
            if (!canvas) return beam;
            
            const logicalWidth = window.innerWidth;
            const logicalHeight = window.innerHeight;

            // Start completely off-screen to the left to sweep right
            beam.x = -logicalWidth * 0.5 - Math.random() * logicalWidth * 0.5;
            beam.y = -logicalHeight * 0.1 - Math.random() * logicalHeight * 0.2;
            beam.width = 60 + Math.random() * 60;
            beam.speed = 0.6 + Math.random() * 1.2;
            beam.hue = 15 + Math.random() * 25;
            beam.opacity = 0.1 + Math.random() * 0.15;
            beam.angle = -15 + Math.random() * 30;
            return beam;
        }

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
            radGrad.addColorStop(0, `hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity})`);
            radGrad.addColorStop(0.3, `hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity * 0.8})`);
            radGrad.addColorStop(1, `hsla(${beam.hue}, 85%, 65%, 0)`);

            ctx.fillStyle = radGrad;
            ctx.beginPath();
            ctx.arc(0, 0, 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        function animate() {
            if (!canvas || !ctx) return;

            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

            beamsRef.current.forEach((beam, index) => {
                // Sweep horizontally from left to right
                beam.x += beam.speed; 
                // Very subtle downward drift mimicking water depth
                beam.y += beam.speed * 0.15; 
                beam.pulse += beam.pulseSpeed;

                // Wipeout at the right screen edge
                if (beam.x > window.innerWidth * 1.5) {
                    resetBeam(beam, index);
                }

                drawBeam(ctx, beam);
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        }

        animate();

        return () => {
            window.removeEventListener("resize", updateCanvasSize);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [intensity]);

    return (
        <div
            className={`beams-container ${className}`}
            style={{ position: fixed ? "fixed" : "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "hidden", zIndex: -1, pointerEvents: "none" }}
        >
            <canvas
                ref={canvasRef}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", transform: "translateZ(0)", pointerEvents: "none", willChange: "transform" }}
            />
            <motion.div
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.02)", pointerEvents: "none", transform: "translateZ(0)", willChange: "opacity" }}
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
