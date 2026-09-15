import { useState } from "react";
import { scadenzaTone } from "../../hooks/function";

const TONE_CLASS = {
    ok: "text-success",
    watch: "text-warning",
    soon: "text-accent",
    urgent: "text-critical",
    expired: "text-expired",
    tolerance: "text-tolerance",
    unknown: "text-bg-secondary",
};

export default function SliderTempo({
    min = 0,
    max = 90,
    value,
    defaultValue,
    onChange,
    label = "",
    id = "",
    showValue = true,
    valueLabel = (val) => ``,
}) {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(defaultValue ?? min);
    const sliderValue = isControlled ? value : internalValue;
    const tone = scadenzaTone(null, sliderValue);

    const handleChange = (e) => {
        let newValue = Number(e.target.value);

        if (newValue > max) newValue = max;
        if (newValue < min) newValue = min;

        if (!isControlled) {
            setInternalValue(newValue);
        }
        if (onChange) {
            onChange(newValue);
        }
    };

    return (
        <div className="">
            <label htmlFor={id} className="block mx-0.5 mt-2 text-sm font-medium text-heading">
                {label}
            </label>
            <input
                id={id}
                type="range"
                min={min}
                max={max}
                value={sliderValue}
                onChange={handleChange}
                className="w-full h-1.5 bg-gray-300 rounded-full appearance-none cursor-pointer
                    /* Stili per il Cursore (WebKit / Safari / Chrome / Edge) */
                    [&::-webkit-slider-thumb]:appearance-none 
                    [&::-webkit-slider-thumb]:h-3 
                    [&::-webkit-slider-thumb]:w-3 
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-brand 
                    [&::-webkit-slider-thumb]:transition-all
                    [&::-webkit-slider-thumb]:duration-150
                    [&::-webkit-slider-thumb]:ease-in-out
                    hover:[&::-webkit-slider-thumb]:scale-130
                    active:[&::-webkit-slider-thumb]:bg-brand-hover
                "
            />
            {showValue && (
                <div className="mt-2 text-sm text-heading">
                    L'avviso per email arriverà{" "}
                    <strong className={TONE_CLASS[tone] ?? TONE_CLASS.unknown}>
                        <input
                            type="text"
                            className="w-10 border border-border rounded-md text-center"
                            value={sliderValue}
                            onChange={handleChange}
                            min={min}
                            max={max}
                        />
                    </strong>{" "}
                    giorni prima della scadenza.
                </div>
            )}
        </div>
    );
}