import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";

function createBeam(width, height) {
    const angle = -35 + Math.random() * 10;
    return {
        x: Math.random() * width * 1.5 - width * 0.25,
        y: Math.random() * height * 1.5 - height * 0.25,
        width: 30 + Math.random() * 60,
        length: height * 2.5,
        angle: angle,
        speed: 0.6 + Math.random() * 1.2,
        opacity: 0.12 + Math.random() * 0.16,
        hue: 15 + Math.random() * 25,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.03,
    };
}

export function BeamsBackground({ className = "", intensity = "strong", fixed = false }) {
    const canvasRef = useRef(null);
    const beamsRef = useRef([]);
    const animationFrameRef = useRef(0);
    const directionRef = useRef(1); // 1 = downward, -1 = upward
    const lastToggleRef = useRef(Date.now());
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
            
            const column = index % 3;
            const logicalWidth = window.innerWidth;
            const logicalHeight = window.innerHeight;
            const spacing = logicalWidth / 3;

            // Spawn opposite to the current direction of travel
            if (directionRef.current === 1) {
                beam.y = -logicalHeight - 100; // Spawn above to flow downward
            } else {
                beam.y = logicalHeight + 100; // Spawn below to flow upward
            }
            
            beam.x =
                column * spacing +
                spacing / 2 +
                (Math.random() - 0.5) * spacing * 0.5;
            beam.width = 100 + Math.random() * 100;
            beam.speed = 0.5 + Math.random() * 0.4;
            beam.hue = 15 + Math.random() * 25;
            beam.opacity = 0.2 + Math.random() * 0.1;
            beam.angle = -35 + Math.random() * 10;
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

            // Toggle the ocean tide direction every 15 seconds
            const now = Date.now();
            if (now - lastToggleRef.current > 15000) {
                directionRef.current *= -1;
                lastToggleRef.current = now;
            }

            beamsRef.current.forEach((beam, index) => {
                beam.y += beam.speed * directionRef.current;
                beam.x -= beam.speed * Math.tan(Math.abs(beam.angle) * (Math.PI / 180)) * directionRef.current; 
                beam.pulse += beam.pulseSpeed;

                if (directionRef.current === 1) {
                    if (beam.y - beam.length > window.innerHeight + 100) resetBeam(beam, index);
                } else {
                    if (beam.y + beam.length < -100) resetBeam(beam, index);
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
