"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { COMING_TO_SEE_ARTISTS, type ComingToSeeId } from "@/lib/coming-to-see";
import { cn } from "@/lib/utils";

type ComingToSeePickerProps = {
  value: ComingToSeeId | null;
  onChange: (value: ComingToSeeId) => void;
  invalid?: boolean;
};

export default function ComingToSeePicker({
  value,
  onChange,
  invalid = false,
}: ComingToSeePickerProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-white font-medium">
        Who are you coming to see?
        <span className="text-[#ffa5f9] ml-1" aria-hidden="true">
          *
        </span>
      </legend>
      <p className="text-amber-200/50 text-xs -mt-1">
        August 30 has a stacked lineup — pick the act you&apos;re most excited for.
      </p>
      <RadioGroup
        value={value ?? ""}
        onValueChange={(next) => onChange(next as ComingToSeeId)}
        className="grid grid-cols-1 sm:grid-cols-2 gap-2"
        aria-required="true"
        aria-invalid={invalid}
      >
        {COMING_TO_SEE_ARTISTS.map((artist) => {
          const selected = value === artist.id;
          return (
            <label
              key={artist.id}
              htmlFor={`coming-to-see-${artist.id}`}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors",
                selected
                  ? "border-[#ffa5f9] bg-[#ffa5f9]/10"
                  : "border-amber-200/15 bg-purple-950/50 hover:border-[#ffa5f9]/50 hover:bg-purple-900/30",
                invalid && !selected && "border-red-400/40"
              )}
            >
              <RadioGroupItem
                id={`coming-to-see-${artist.id}`}
                value={artist.id}
                className="border-amber-200/50 text-[#ffa5f9] data-[state=checked]:border-[#ffa5f9]"
              />
              <span className="text-sm text-white">{artist.label}</span>
            </label>
          );
        })}
      </RadioGroup>
    </fieldset>
  );
}
