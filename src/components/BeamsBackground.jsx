import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";

export function BeamsBackground({ className = "", intensity = "strong", fixed = false }) {
    const canvasRef = useRef(null);
    const animationFrameRef = useRef(0);
    const particlesRef = useRef([]);
    const mouseRef = useRef({ x: -1000, y: -1000 });

    const config = {
        subtle: { count: 35, maxDist: 100, opacity: 0.3 },
        medium: { count: 50, maxDist: 130, opacity: 0.5 },
        strong: { count: 70, maxDist: 160, opacity: 0.8 },
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;

        const updateThemeColor = () => {
            const rootStyle = getComputedStyle(document.documentElement);
            return rootStyle.getPropertyValue('--brand-primary').trim() || '234, 88, 12';
        };

        const currentConfig = config[intensity] || config.medium;
        let themeColor = updateThemeColor();

        const initParticles = () => {
            particlesRef.current = Array.from({ length: currentConfig.count }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.6,
                vy: (Math.random() - 0.5) * 0.6,
                size: Math.random() * 1.5 + 1
            }));
        };

        const updateCanvasSize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            
            // Use device pixel ratio for crisp retina display
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.scale(dpr, dpr);
            
            initParticles();
        };

        updateCanvasSize();
        window.addEventListener("resize", updateCanvasSize);

        // Dynamically poll for theme changes
        const themeInterval = setInterval(() => {
            themeColor = updateThemeColor();
        }, 1000);

        const handleMouseMove = (e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };
        const handleMouseLeave = () => {
            mouseRef.current = { x: -1000, y: -1000 };
        };
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseleave", handleMouseLeave);

        function animate() {
            // Clear frame
            ctx.clearRect(0, 0, width, height);
            
            const particles = particlesRef.current;
            const maxDist = currentConfig.maxDist;

            // Update and draw particles
            particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;

                // Bounce off edges smoothly
                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                // Draw node
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${themeColor}, ${currentConfig.opacity})`;
                ctx.fill();

                // Draw connections to other particles
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < maxDist) {
                        const alpha = (1 - dist / maxDist) * currentConfig.opacity * 0.8;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(${themeColor}, ${alpha})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }

                // Interactive connection with mouse
                const mDx = p.x - mouseRef.current.x;
                const mDy = p.y - mouseRef.current.y;
                const mDist = Math.sqrt(mDx * mDx + mDy * mDy);
                
                if (mDist < maxDist * 1.2) {
                    const alpha = (1 - mDist / (maxDist * 1.2)) * currentConfig.opacity * 1.2;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
                    ctx.strokeStyle = `rgba(${themeColor}, ${alpha})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        }

        animate();

        return () => {
            window.removeEventListener("resize", updateCanvasSize);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseleave", handleMouseLeave);
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
            {/* Subtle overlay to enhance contrast */}
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.1)", pointerEvents: "none" }} />
        </div>
    );
}
