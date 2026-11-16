import { Check } from "lucide-react";

// Colors shared by categories and cards. Hex WITHOUT "#" (the UI adds it).
const PICKER_COLORS = ["009A4D", "00B5B5", "C37F00", "796AE5", "F14D4C", "C282D0"];

type ColorPickerProps = {
    value: string
    onChange: (color: string) => void
}

export function ColorPicker(props: ColorPickerProps) {
    return (
        <div className="flex flex-col gap-2">
            <span className="font-[500] text-sm">Cor</span>
            <div className="flex flex-col gap-4 items-center w-full">
                <div className="flex items-center justify-around w-full">
                    {PICKER_COLORS.map(color => (
                        <div
                            key={color}
                            className={`flex justify-center items-center cursor-pointer rounded-full size-10 ${props.value.toUpperCase() === color ? "border-2" : ""}`}
                            style={{ backgroundColor: `#${color}` }}
                            onClick={() => props.onChange(color)}
                        >
                            {props.value.toUpperCase() === color ? <Check size={18} color="white" /> : null}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
