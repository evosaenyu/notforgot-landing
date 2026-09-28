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

  const toggleAll = (checked: boolean) => {
    onChange(checked ? [...allIds] : []);
  };

  const chipClass = (selected: boolean) =>
    cn(
      "flex items-center gap-2 rounded-lg border px-2.5 py-2 sm:gap-3 sm:px-3 cursor-pointer transition-colors min-h-[44px]",
      selected
        ? "border-[#ffa5f9] bg-[#ffa5f9]/10"
        : "border-amber-200/15 bg-purple-950/50 hover:border-[#ffa5f9]/50 hover:bg-purple-900/30",
      invalid && !selected && "border-red-400/40"
    );

  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">Who are you coming to see?</legend>
      <p className="text-white font-medium">
        Who are you coming to see?
        <span className="text-[#ffa5f9] ml-1" aria-hidden="true">
          *
        </span>
      </p>
      <p className="text-amber-200/50 text-xs -mt-1">
        Tap a name or grab the whole lineup.
      </p>
      <label
        htmlFor="coming-to-see-all"
        className={chipClass(allSelected)}
      >
        <Checkbox
          id="coming-to-see-all"
          checked={allSelected}
          onCheckedChange={(checked) => toggleAll(checked === true)}
          className="shrink-0 border-amber-200/50 data-[state=checked]:bg-[#ffa5f9] data-[state=checked]:text-black data-[state=checked]:border-[#ffa5f9]"
        />
        <span className="text-sm text-white font-medium">Select all</span>
      </label>
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
              className={chipClass(selected)}
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
