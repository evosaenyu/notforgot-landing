import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Event } from "@/app/data/events";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <Card className="bg-purple-950/50 border-amber-300/20 overflow-hidden">
      <div className="flex flex-col">
        <TooltipProvider>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <div className="w-full h-96 relative">
                <a
                  href={event.ticket_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image
                    src={event.banner_image}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                </a>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Buy Tickets</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="p-6 flex-1">
          <p className="text-amber-200/60 mb-2">
            <span className="font-semibold">Date:</span> {event.date}
          </p>
          <p className="text-amber-200/60 mb-2">
            <span className="font-semibold">Location:</span> {event.address}
          </p>
          <p className="text-amber-200/80">
            {event.event_detailed_description}
          </p>
        </div>
        <a
          href={event.ticket_link}
          target="_blank"
          rel="noopener noreferrer"
          className="block m-6"
        >
          <div className="bg-amber-300/10 hover:bg-amber-300/20 border border-amber-300/20 hover:border-amber-300/40 rounded-lg p-4 text-center transition-all duration-200">
            <span className="text-amber-200 font-semibold text-lg">Buy Tickets</span>
          </div>
        </a>
      </div>
    </Card>
  );
}
