"use client";

import { useState, useEffect } from "react";

interface CirclePosition {
  width: number;
  height: number;
  left: number;
  top: number;
}

export default function FloatingCircles() {
  const [scrollY, setScrollY] = useState(0);
  const [circlePositions] = useState<CirclePosition[]>(() =>
    [...Array(15)].map(() => ({
      width: Math.random() * 100 + 100,
      height: Math.random() * 100 + 100,
      left: Math.random() * 100,
      top: Math.random() * 100,
    }))
  );

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {circlePositions.map((pos, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-purple-600/10"
          style={{
            width: `${pos.width}px`,
            height: `${pos.height}px`,
            left: `${pos.left}%`,
            top: `${pos.top}%`,
            transform: `translate(-50%, -50%) rotate(${
              scrollY * (i % 2 ? 1 : -1)
            }deg)`,
            transition: "transform 2.5s ease-out",
          }}
        />
      ))}
    </div>
  );
} 