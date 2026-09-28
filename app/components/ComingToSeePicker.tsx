"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { COMING_TO_SEE_ARTISTS, type ComingToSeeId } from "@/lib/coming-to-see";
import { cn } from "@/lib/utils";

type ComingToSeePickerProps = {
  value: ComingToSeeId[];
  onChange: (value: ComingToSeeId[]) => void;
  invalid?: boolean;
};

export default function ComingToSeePicker({
  value,
  onChange,
  invalid = false,
}: ComingToSeePickerProps) {
  const allIds = COMING_TO_SEE_ARTISTS.map((artist) => artist.id);
  const allSelected = value.length === COMING_TO_SEE_ARTISTS.length;

  const toggle = (id: ComingToSeeId, checked: boolean) => {
    if (checked) {
      if (value.includes(id)) return;
      onChange([...value, id]);
      return;
    }
    onChange(value.filter((current) => current !== id));
  };

  const toggleAll = () => {
    onChange(allSelected ? [] : [...allIds]);
  };

  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">Who are you coming to see?</legend>
      <div className="flex items-start justify-between gap-3">
        <p className="text-white font-medium">
          Who are you coming to see?
          <span className="text-[#ffa5f9] ml-1" aria-hidden="true">
            *
          </span>
        </p>
        <button
          type="button"
          onClick={toggleAll}
          className="shrink-0 text-xs font-medium text-[#ffa5f9] hover:text-[#FFD5FC] transition-colors min-h-[44px] px-1"
        >
          {allSelected ? "Clear all" : "Select all"}
        </button>
      </div>
      <p className="text-amber-200/50 text-xs -mt-1">
        Renaissance Night has a stacked lineup — pick everyone you&apos;re excited for.
      </p>
      <div
        className="grid grid-cols-2 gap-2"
        role="group"
        aria-required="true"
        aria-invalid={invalid}
      >
        {COMING_TO_SEE_ARTISTS.map((artist) => {
          const selected = value.includes(artist.id);
          return (
            <label
              key={artist.id}
              htmlFor={`coming-to-see-${artist.id}`}
              className={cn(
                "flex items-center gap-2 sm:gap-3 rounded-lg border px-2.5 py-2 sm:px-3 sm:py-2.5 cursor-pointer transition-colors min-h-[44px]",
                selected
                  ? "border-[#ffa5f9] bg-[#ffa5f9]/10"
                  : "border-amber-200/15 bg-purple-950/50 hover:border-[#ffa5f9]/50 hover:bg-purple-900/30",
                invalid && !selected && "border-red-400/40"
              )}
            >
              <Checkbox
                id={`coming-to-see-${artist.id}`}
                checked={selected}
                onCheckedChange={(checked) => toggle(artist.id, checked === true)}
                className="shrink-0 border-amber-200/50 data-[state=checked]:bg-[#ffa5f9] data-[state=checked]:text-black data-[state=checked]:border-[#ffa5f9]"
              />
              <span className="text-xs sm:text-sm text-white leading-snug break-words">
                {artist.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
