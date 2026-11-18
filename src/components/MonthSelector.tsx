import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useDate } from "../hooks/useDate";

type MonthSelectorProps = {
    // Compact: only "‹ Month Year ›", for the mobile top bar.
    compact?: boolean
}

// Selected month (the "período" used by every monthly view). Used by the sidebar and the mobile top bar.
export function MonthSelector(props: MonthSelectorProps) {
    const { currentDate, setCurrentDate } = useDate();

    function setNextMonth() {
        const nextDate = new Date(currentDate);

        nextDate.setDate(13);
        nextDate.setMonth(nextDate.getMonth() + 1);

        setCurrentDate(nextDate);
    }

    function setPreviousMonth() {
        const previousDate = new Date(currentDate);

        previousDate.setDate(13);
        previousDate.setMonth(previousDate.getMonth() - 1);

        setCurrentDate(previousDate);
    }

    const monthLabel = currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

    const selector = (
        <div className="flex items-center justify-between">
            <button
                aria-label="Mês anterior"
                className="size-8 flex items-center justify-center text-neutral-600 rounded-full cursor-pointer"
                onClick={setPreviousMonth}
            >
                <ChevronLeft size={14} />
            </button>

            <span className="text-sm font-[600] whitespace-nowrap">{monthLabel[0].toUpperCase() + monthLabel.slice(1)}</span>

            <button
                aria-label="Próximo mês"
                className="size-8 flex items-center justify-center text-neutral-600 rounded-full cursor-pointer"
                onClick={setNextMonth}
            >
                <ChevronRight size={14} />
            </button>
        </div>
    );

    if (props.compact) return selector;

    return (
        <div className="flex flex-col gap-4 px-6 py-4 bg-linear-to-t from-brand/5 to-white border-1 border-slate-200 rounded-3xl mx-4 mt-2">
            <div className="flex justify-between">
                <div className="flex gap-1 items-center">
                    <Calendar size={12} />
                    <span className="text-xs">PERÍODO</span>
                </div>
                <span className="text-brand text-xs underline cursor-pointer" onClick={() => setCurrentDate(new Date())}>Mês atual</span>
            </div>

            {selector}
        </div>
    );
}
