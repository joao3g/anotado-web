import { useId } from "react";
import { Check, Plus } from "lucide-react";

// Colors shared by categories and cards. Hex WITHOUT "#" (the UI adds it), upper case.
// The first 6 were the original palette: keep them first, so saved categories and cards still match.
const PICKER_COLORS = [
    { hex: "009A4D", name: "Verde" },
    { hex: "00B5B5", name: "Turquesa" },
    { hex: "C37F00", name: "Mostarda" },
    { hex: "796AE5", name: "Roxo" },
    { hex: "F14D4C", name: "Vermelho" },
    { hex: "C282D0", name: "Lilás" },
    { hex: "2563EB", name: "Azul" },
    { hex: "E8742E", name: "Laranja" },
    { hex: "D6409F", name: "Rosa" },
    { hex: "8B5E3C", name: "Marrom" },
    { hex: "64748B", name: "Cinza" }
];

// Check mark readable on any swatch: dark on light colors, white on dark ones.
function checkColor(hex: string) {
    const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? "#12201F" : "#ffffff";
}

// Ring around the selected swatch. ring-offset uses the card color, so it also works in dark mode.
const SELECTED_RING = "ring-2 ring-brand ring-offset-2 ring-offset-white";

type ColorPickerProps = {
    value: string // Hex without "#"; "" = none chosen yet
    onChange: (color: string) => void
}

export function ColorPicker(props: ColorPickerProps) {
    const labelId = useId();
    const value = props.value.toUpperCase();
    // A color outside the palette (picked with "+", or saved before) shows on the last swatch, selected.
    const custom = /^[0-9A-F]{6}$/.test(value) && !PICKER_COLORS.some(color => color.hex === value) ? value : null;

    return (
        <div className="flex flex-col gap-2">
            <span className="font-[500] text-sm" id={labelId}>Cor</span>
            <div role="radiogroup" aria-labelledby={labelId} className="grid grid-cols-6 gap-3 justify-items-center w-full">
                {PICKER_COLORS.map(color => {
                    const selected = value === color.hex;
                    return (
                        <button
                            key={color.hex}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            aria-label={color.name}
                            title={color.name}
                            className={`flex justify-center items-center size-10 rounded-full cursor-pointer transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${selected ? SELECTED_RING : ""}`}
                            style={{ backgroundColor: `#${color.hex}` }}
                            onClick={() => props.onChange(color.hex)}
                        >
                            {selected ? <Check size={18} color={checkColor(color.hex)} /> : null}
                        </button>
                    );
                })}

                {/* Any color: the device's own color chooser. The real input is invisible but still focusable. */}
                <label
                    title="Outra cor"
                    className={`relative flex justify-center items-center size-10 rounded-full cursor-pointer transition-transform hover:scale-110 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${custom ? SELECTED_RING : "border-2 border-dashed border-slate-200 text-neutral-500"}`}
                    style={custom ? { backgroundColor: `#${custom}` } : undefined}
                >
                    <input
                        type="color"
                        aria-label="Outra cor"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        value={`#${custom ?? "009A4D"}`}
                        onChange={(event) => props.onChange(event.target.value.slice(1).toUpperCase())}
                    />
                    {custom ? <Check size={18} color={checkColor(custom)} /> : <Plus size={18} />}
                </label>
            </div>
        </div>
    );
}
