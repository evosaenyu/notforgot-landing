import { events } from "@/app/data/events";
import EventCard from "@/app/components/EventCard";
import BackToHome from "@/app/components/BackToHome";

export default function MayEventsBlog() {
  return (
    <div className="min-h-screen py-20 px-4 relative bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800">
      <div className="max-w-4xl mx-auto">
        <BackToHome />
        <h1 className="text-4xl font-bold text-amber-300 mb-8">
          10 Music Events Happening in Upstate NY (Albany) in May 2025
        </h1>
        <h2 className="text-lg text-amber-200/80 mb-12">
          May is shaping up to be an exciting month for music and cultural events in the Albany area, so we put together a list of 10 concerts and music festivals we thought you should check out!
          From Avril Lavigne, to rising talents in the area, to our very own Fras Fest, there&apos;s something for everyone to enjoy!
        </h2>
        
        <div className="space-y-8">
          {events.map((event) => (
            <div key={event.title} className="space-y-4">
              <h2 className="text-2xl font-semibold text-amber-200 mb-2 border-b-2 border-amber-300/20 pb-2">{event.number}. {event.title}</h2>
              <EventCard event={event} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 