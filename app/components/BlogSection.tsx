"use client";

import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

const blogPosts = [
  {
    id: 1,
    title: "10 Music Events Happening in Upstate NY (Albany) in May",
    excerpt: "Discover the best music and cultural events happening in Albany this May, including our very own Fras Fest.",
    imageUrl: "https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F971882623%2F857333264543%2F1%2Foriginal.20250228-150956?crop=focalpoint&fit=crop&w=940&auto=format%2Ccompress&q=75&sharp=10&fp-x=0.5&fp-y=0.5&s=8ffd40adee040e456ce7036a8948d89f",
    link: "/blog/upstate-ny-may-events"
  }
];

export default function BlogSection() {
  return (
    <section className="min-h-screen py-20 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-amber-300 mb-12">
          Latest Blog Posts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <Card
              key={post.id}
              className="bg-purple-950/50 border-amber-300/20 overflow-hidden group"
            >
              <div className="aspect-video relative">
                <Image
                  src={post.imageUrl}
                  alt="Blog post"
                  className="w-full h-full object-cover"
                  width={800}
                  height={600}
                />
              </div>
              <div className="p-6">
                <h3 className="text-amber-200 font-semibold text-xl mb-2">
                  {post.title}
                </h3>
                <p className="text-amber-200/60 mb-4">
                  {post.excerpt}
                </p>
                <Button
                  variant="ghost"
                  className="text-amber-200/80 hover:text-amber-300 hover:bg-amber-300/10 p-2 rounded-lg transition-colors"
                  asChild
                >
                  <Link href={post.link || "#"}>
                    <span className="flex items-center">
                      Read More <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
} 