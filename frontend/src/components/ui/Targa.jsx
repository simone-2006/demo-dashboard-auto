import React from "react";
import { Plus } from "lucide-react";

export default function Targa({ targa }) {
    // Regex per targa italiana (es: AB123CD)
    const regexItaliana = /^[A-Za-z]{2}\d{3}[A-Za-z]{2}$/;
    // Regex per targa svizzera standard: due lettere, uno spazio, uno o più numeri (es: TI 12345)
    // oppure due lettere, uno o più numeri (senza spazio)
    const regexSvizzera = /^([A-Z]{2})\s?\d+$/i;

    let targaFormattedIta = ""

    let tipo = "altro";
    if (targa && regexItaliana.test(targa)) {
        tipo = "italiana";
        targaFormattedIta = `${targa.slice(0, 2)} ${targa.slice(2, 5)} ${targa.slice(5, 7)}`;
    } else if (targa && regexSvizzera.test(targa)) {
        tipo = "svizzera";
    }

    // Funzione per copiare la targa (quella originale) negli appunti
    const handleCopy = async (e) => {
        e.stopPropagation();
        if (targa) {
            try {
                await navigator.clipboard.writeText(targa);
                // opzionale: dare un breve feedback visuale
            } catch (err) {
                // errore copia, fai niente o logga
            }
        }
    };

    if (tipo === "italiana") {
        return (
            <div 
                className="flex justify-between h-6 border border-border rounded-md font-semibold bg-white max-w-30 text-black cursor-pointer active:opacity-70 select-none"
                onClick={handleCopy}
                title="Copia targa"
            >
                <div className="bg-blue-600 w-3 rounded-l-md"></div>
                <div className="mx-1 whitespace-nowrap">{targaFormattedIta}</div>
                <div className="bg-blue-600 w-3 rounded-r-md"></div>
            </div>
        );
    } else if (tipo === "svizzera") {
        return (
            <div 
                className="flex justify-between h-6 border border-border bg-white rounded-md items-center px-1 max-w-30 cursor-pointer active:opacity-70 select-none"
                onClick={handleCopy}
                title="Copia targa"
            >
                <div className="rounded-b-full bg-red-600 w-4 h-4 text-white flex items-center justify-center">
                    <Plus></Plus>
                </div>
                <div className="mx-1 whitespace-nowrap font-semibold">{targa}</div>
            </div>
        );
    } else {
        return (
            <div 
                className="flex justify-between h-6 border border-border rounded-md max-w-30 text-black bg-white cursor-pointer active:opacity-70 select-none"
                onClick={handleCopy}
                title="Copia targa"
            >
                <div className="bg-white w-3 rounded-l-md"></div>
                <div className="bg-white mx-1 whitespace-nowrap">{targa}</div>
                <div className="bg-white w-3 rounded-r-md"></div>
            </div>
        );
    }
}
