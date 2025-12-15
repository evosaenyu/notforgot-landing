"use client";

import { Card } from "@/components/ui/card";

const spotifyEmbeds = [
  { // I'm Thinking of Leaving
    url: "https://open.spotify.com/embed/album/0jViYfvwJPKBz7e8kS3yzC?utm_source=generator&theme=0",
    height: "352"
  },
  {
    url: "https://open.spotify.com/embed/track/4lRHWnYfCkZ7okJvuBjvH5?utm_source=generator&theme=0",
    height: "352"
  },
  {
    url: "https://open.spotify.com/embed/track/6cbej4JjbzCjemxlJ8iJa3?utm_source=generator&theme=0",
    height: "352"
  },
  {
    url: "https://open.spotify.com/embed/track/635EU2S7QMnLQrHfjEGJFG?utm_source=generator&theme=0",
    height: "352"
  },
  {
    url: "https://open.spotify.com/embed/album/2Y635ccyKvwRXbob0ih8M5?utm_source=generator",
    height: "352"
  },
  {
    url: "https://open.spotify.com/embed/album/06tL1WF9FeRrzW6vgK42xz?utm_source=generator&theme=0",
    height: "352"
  },
  {
    url: "https://open.spotify.com/embed/album/6RNA7TbbhIKoAYzYDBoia0?utm_source=generator&theme=0",
    height: "152"
  },
  {
    url: "https://open.spotify.com/embed/track/3r7TBu7owh1cuigx8pgUdv?utm_source=generator&theme=0",
    height: "152"
  }
];

export default function MusicSection() {
  return (
    <section className="min-h-screen py-20 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-amber-300 mb-12">
          Latest Releases
        </h2>
        <div className="grid grid-cols-1 gap-8">
          {spotifyEmbeds.map((embed, index) => (
            <Card key={index} className="bg-purple-950/50 border-amber-300/20 p-4 backdrop-blur-sm">
              <iframe
                style={{ borderRadius: "12px" }}
                src={embed.url}
                width="100%"
                height={embed.height}
                frameBorder="0"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
} 