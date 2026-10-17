"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";

interface FullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FullScreenModal({ isOpen, onClose }: FullScreenModalProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <button
        className="absolute top-4 right-4 text-white hover:text-amber-400 transition-colors"
        onClick={onClose}
      >
        <X className="w-8 h-8" />
      </button>
      <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
        <video
          src="/assets/trickandtreat.mp4"
          poster="/assets/trickandtreat.jpg"
          autoPlay
          loop
          muted
          playsInline
          aria-label="Trick & Treat event poster"
          className="w-full h-auto rounded-lg"
          width={384}
          height={456}
        />
      </div>
    </motion.div>
  );
}
