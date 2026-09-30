"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { COMING_TO_SEE_ARTISTS, type ComingToSeeId } from "@/lib/coming-to-see";
import { cn } from "@/lib/utils";

type ComingToSeePickerProps = {
  value: ComingToSeeId[];
  onChange: (value: ComingToSeeId[]) => void;
  invalid?: boolean;
};

const GRAY_BORDER = "border-zinc-500/55";
const GRAY_BORDER_HOVER = "hover:border-zinc-400/80 hover:bg-purple-900/35";
const CHECKBOX_CLASS =
  "h-5 w-5 shrink-0 rounded-[4px] border-zinc-400/80 bg-transparent shadow-none ring-offset-0 focus-visible:ring-1 focus-visible:ring-zinc-400 focus-visible:ring-offset-0 data-[state=checked]:bg-[#ffa5f9] data-[state=checked]:text-black data-[state=checked]:border-[#ffa5f9] data-[state=indeterminate]:bg-[#ffa5f9] data-[state=indeterminate]:text-black data-[state=indeterminate]:border-[#ffa5f9]";

export default function ComingToSeePicker({
  value,
  onChange,
  invalid = false,
}: ComingToSeePickerProps) {
  const allIds = COMING_TO_SEE_ARTISTS.map((artist) => artist.id);
  const allSelected = value.length === COMING_TO_SEE_ARTISTS.length;
  const someSelected = value.length > 0 && !allSelected;
  const oddLastChip = COMING_TO_SEE_ARTISTS.length % 2 === 1;

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
      "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors min-h-[48px] h-full",
      "focus-within:ring-1 focus-within:ring-zinc-400/70",
      selected
        ? "border-[#ffa5f9] bg-[#ffa5f9]/10"
        : cn(GRAY_BORDER, "bg-purple-950/50", GRAY_BORDER_HOVER),
      invalid && !selected && "border-red-400/50"
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
      <p className="text-zinc-300 text-xs -mt-1">
        Tap a name or grab the whole lineup.
      </p>
      <label
        htmlFor="coming-to-see-all"
        className={cn(chipClass(allSelected), "min-h-[44px]")}
      >
        <Checkbox
          id="coming-to-see-all"
          checked={allSelected ? true : someSelected ? "indeterminate" : false}
          onCheckedChange={(checked) => toggleAll(checked === true)}
          className={CHECKBOX_CLASS}
        />
        <span className="text-sm text-white font-medium">Select all</span>
      </label>
      <div
        className="grid grid-cols-2 gap-2.5"
        role="group"
        aria-required="true"
        aria-invalid={invalid}
      >
        {COMING_TO_SEE_ARTISTS.map((artist, index) => {
          const selected = value.includes(artist.id);
          const isLastOdd =
            oddLastChip && index === COMING_TO_SEE_ARTISTS.length - 1;
          return (
            <label
              key={artist.id}
              htmlFor={`coming-to-see-${artist.id}`}
              className={cn(chipClass(selected), isLastOdd && "col-span-2")}
            >
              <Checkbox
                id={`coming-to-see-${artist.id}`}
                checked={selected}
                onCheckedChange={(checked) => toggle(artist.id, checked === true)}
                className={CHECKBOX_CLASS}
              />
              <span className="text-sm text-white leading-snug">
                {artist.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
