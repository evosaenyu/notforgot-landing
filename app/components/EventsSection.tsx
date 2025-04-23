"use client";

import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import frasfest from "@/public/assets/frasfest.jpeg";
import { useState } from "react";
import FullScreenModal from "./FullScreenModal";

const events = [
  {
    name: "Fras Fest",
    date: "May 17, 2025 - Saturday (4pm to 11pm)",
    locationName: "The Ruins at Sassafras Farm",
    address: "194 Darrow Road New Lebanon, NY 12125",
    image: frasfest,
    ticketLink: "https://www.eventbrite.com/e/fras-fest-tickets-1263987995119",
  },
];

export default function EventsSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className="py-20 px-4 relative bg-purple-950/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-amber-300 mb-12">
          Upcoming Events
        </h2>
        <div className="space-y-6">
          {events.map((event) => (
            <Card
              key={event.name}
              className="bg-purple-950/50 border-amber-300/20 p-6 backdrop-blur-sm"
            >
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div
                  className="w-full md:w-48 rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Image
                    src={event.image}
                    alt="Event"
                    className="w-full h-full"
                    width={360}
                    height={450}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-amber-200 text-xl font-semibold mb-2">
                    {event.name}
                  </h3>
                  <p className="text-amber-200/60 mb-4">
                    {event.locationName}
                  </p>
                  <p className="text-amber-200/60 mb-4">
                    {event.address}
                  </p>
                  <div className="flex items-center gap-4">
                    <Calendar className="text-amber-400" />
                    <span className="text-amber-200/80">{event.date}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-amber-400 bg-amber-400 text-black hover:bg-amber-400/60"
                >
                  <a href={event.ticketLink} target="_blank" rel="noopener noreferrer">
                    Get Tickets
                  </a>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <FullScreenModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
} 