import { useState } from "react";

export default function NoteCell({ value }) {
    const [open, setOpen] = useState(false);

    const handleClick = () => setOpen((prev) => !prev);

    return (
        <span
            onClick={handleClick}
            className={`
                block max-w-[16ch]
                ${open ? "" : "truncate text-ellipsis whitespace-nowrap overflow-hidden"}
                ${open ? "relative z-10  p-0.5" : ""}
                cursor-pointer
            `}
            style={{ userSelect: "text" }}
        >
            {value}
        </span>
    );
}