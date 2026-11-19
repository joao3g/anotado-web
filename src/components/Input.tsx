import { ChevronDown, Ellipsis, Search } from "lucide-react";
import { useState } from "react";

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

export function Input(props: CustomInputProps) {
    return (
        <div className="flex flex-col gap-y-1 flex-1 w-full">
            <label className="text-sm font-[500]">{props.label}</label>
            <input
                {...props}
                className="px-4 py-2 bg-white rounded-full shadow-black-100 shadow-sm/10 text-base md:text-sm focus:outline-1 focus:outline-brand"
            />
        </div>
    )
}

type MoreOptionButtonProps = {
    onClick: React.MouseEventHandler
}

export function MoreOptionButton(props: MoreOptionButtonProps) {
    return (
        <div
            className="flex justify-center items-center size-8 rounded-full hover:bg-slate-200/40 hover:cursor-pointer"
            onClick={props.onClick}
        >
            <Ellipsis size={16} className="text-ink" fill="currentColor" />
        </div>
    );
}

export function SearchInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    const [focus, setFocus] = useState(false);

    return (
        <div className={`flex items-center gap-2 w-full px-4 py-2 bg-white rounded-full shadow-black-100 shadow-sm/10 text-base md:text-sm ${focus ? "outline-1 outline-brand" : null}`} >
            <Search size={16} className="text-slate-600" />
            <input
                {...props}
                className="focus:outline-0"
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
            />
        </div>
    );
}

type SelectCardProps = {
    icon: React.ReactNode
    title: string
    description?: string
    selected?: boolean
    onClick: Function
}

export function SelectCard(props: SelectCardProps) {
    return (
        <div 
            className={`p-3 sm:p-4 rounded-3xl flex flex-col border-1 w-full ${props.selected ? "border-brand bg-brand/5 shadow-md" : "border-slate-200 hover:bg-brand/5 hover:border-brand/50 hover:cursor-pointer"}`}
            onClick={() => props.onClick()}
        >
            <div className="mb-2 text-neutral-600">{props.icon}</div>
            <span className="text-sm font-semibold">{props.title}</span>
            <span className="hidden sm:block text-[11px] text-neutral-600">{props.description}</span>
        </div>
    );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string
    options?: { value: string, title: string, selected?: boolean }[]
}

export function Select(props: SelectProps) {
    return (
        <div className="relative flex flex-col gap-y-1 flex-1">
            <label className="text-sm font-[500]">{props.label}</label>
            <select
                {...props}
                className="px-4 py-2 pr-10 bg-white appearance-none rounded-full shadow-black-100 shadow-sm/10 text-base md:text-sm focus:outline-1 focus:outline-brand cursor-pointer"
                defaultValue="blank"
            >
                <option id="blank" value="blank" key="blank-option" disabled hidden>Selecione uma opção</option>
                {
                    props.options?.map((option, index) => {
                        return <option key={index} value={option.value} selected={option.selected}>{option.title}</option>
                    })
                }
            </select>

            <ChevronDown
                className="absolute bottom-3 md:bottom-2 right-4 text-neutral-600"
                size={16}
            />
        </div>
    );
}

type SliderProps = {
    onChange: Function
    checked?: boolean // Optional: when given, the switch shows this value (e.g. in edit modals)
}

export function Slider(props: SliderProps) {
    return (
        <label className="inline-flex items-center cursor-pointer select-none">
            <input type="checkbox" className="sr-only peer" checked={props.checked} onChange={() => props.onChange()} />

            <div className="
                relative w-11 h-6 bg-gray-200 rounded-full transition-colors duration-300 peer-checked:bg-brand
                after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:size-5 after:trasition-transform after:duration-300 peer-checked:after:translate-x-full
            "/>
        </label>
    );
}