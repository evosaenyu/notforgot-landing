import Link from "next/link";

export default function BackToHome() {
  return (
    <Link 
      href="/"
      className="inline-flex items-center gap-2 text-amber-200/80 hover:text-amber-300 transition-colors mb-8 group"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transform group-hover:-translate-x-1 transition-transform"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Back to Home
    </Link>
  );
} 