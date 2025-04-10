"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";
import frasfest from "@/public/assets/frasfest.jpeg";

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
        <Image
          src={frasfest}
          alt="Event"
          className="w-full h-auto rounded-lg"
          width={1200}
          height={1500}
        />
      </div>
    </motion.div>
  );
} 