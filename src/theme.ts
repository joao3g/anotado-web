// Dark mode, saved on this device (localStorage). Until the user picks one, it follows the phone/PC setting.
// index.html runs the same first check before the app loads, so there is no white flash. Keep both in sync.
const STORAGE_KEY = "theme"; // "dark" | "light", or nothing = follow the system
const BROWSER_BAR_COLOR = { light: "#ffffff", dark: "#131D1C" }; // Same as --color-white in each mode
const CHANGE_EVENT = "themechange";

const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

// localStorage can throw (private mode, blocked storage): then the system setting is used.
function getSavedChoice(): "dark" | "light" | null {
    try {
        const value = localStorage.getItem(STORAGE_KEY);
        return value === "dark" || value === "light" ? value : null;
    } catch {
        return null;
    }
}

function apply(dark: boolean) {
    document.documentElement.classList.toggle("dark", dark);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? BROWSER_BAR_COLOR.dark : BROWSER_BAR_COLOR.light);
    window.dispatchEvent(new Event(CHANGE_EVENT));
}

export const isDarkMode = () => document.documentElement.classList.contains("dark");

// The toggle: saves the choice, so the system setting stops being followed on this device.
export function setDarkMode(dark: boolean) {
    try {
        localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
    } catch {
        // Not saved: it still applies until the page is reloaded.
    }
    apply(dark);
}

// For useSyncExternalStore: re-render when the mode changes (toggle or system change).
export function subscribeToDarkMode(onChange: () => void) {
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

// Called once at startup: applies the mode and follows system changes while no choice is saved.
export function initTheme() {
    apply(getSavedChoice() ? getSavedChoice() === "dark" : systemDark.matches);

    systemDark.addEventListener("change", (event) => {
        if (!getSavedChoice()) apply(event.matches);
    });
}
