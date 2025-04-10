"use client";

import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";

const blogPosts = [
  {
    id: 1,
    title: "Blog Post Title 1",
    excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.",
    imageUrl: "https://source.unsplash.com/random/800x600?music-blog=1"
  },
  {
    id: 2,
    title: "Blog Post Title 2",
    excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.",
    imageUrl: "https://source.unsplash.com/random/800x600?music-blog=2"
  },
  {
    id: 3,
    title: "Blog Post Title 3",
    excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.",
    imageUrl: "https://source.unsplash.com/random/800x600?music-blog=3"
  }
];

export default function BlogSection() {
  return (
    <section className="min-h-screen py-20 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-amber-300 mb-12">
          Latest News
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
                <p className="text-amber-200/60 mb-4 line-clamp-2">
                  {post.excerpt}
                </p>
                <Button
                  variant="ghost"
                  className="text-amber-400 hover:text-amber-300 p-0 h-auto"
                >
                  Read More <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
} 