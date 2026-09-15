import Page from "../components/layout/Page";
import Title from "../components/ui/Title";
import { Moon, Sun } from "lucide-react";

import { useTheme } from "../context/themeContext";
import Button from "../components/ui/Button";

export default function Settings() {
    const { theme, setTheme } = useTheme();

    function toggleTheme() {
        setTheme(theme === "light" ? "dark" : "light");
    }

    return (
        <div>
            <Page>
                <Title
                    left={
                        <h2 className="font-bold text-text text-xl">Impostazioni</h2>
                    }
                >
                </Title>

                <div className="flex items-center gap-2 mt-2">
                    <p className="text-text-secondary text-sm">Tema</p>
                    <Button
                        variant="ghost"
                        size="md"
                        onClick={toggleTheme}
                        aria-label="Cambia tema"
                    >
                        <div className="text-sm flex items-center gap-1 " >
                            {theme === "light" ? <Sun size={14} /> : <Moon size={14} />}
                            {theme === "light" ? "Chiaro" : "Scuro"}
                        </div>
                    </Button>
                </div>

            </Page>
        </div>
    );
}
