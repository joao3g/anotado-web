import { useEffect, useRef, type RefObject } from "react";

type DrawerSwipeOptions = {
    open: boolean
    onOpen: () => void
    onClose: () => void
    drawerRef: RefObject<HTMLElement | null>
    backdropRef: RefObject<HTMLDivElement | null>
}

const DESKTOP = "(min-width: 1024px)"; // lg: the sidebar is always visible, no drawer
const LOCK_DISTANCE = 10; // px before deciding between a sideways swipe and a vertical scroll
const HORIZONTAL_RATIO = 1.5; // sideways must win clearly over vertical
const FLING_VELOCITY = 0.4; // px/ms: a quick flick decides even if the drag was short

// Touches that must stay with the page (not the drawer gesture).
function shouldIgnore(target: EventTarget | null) {
    if (window.matchMedia(DESKTOP).matches) return true;

    // A form, the camera or a confirm dialog is open (they all use this overlay).
    if (document.querySelector("div.fixed.inset-0.z-900")) return true;

    if (!(target instanceof Element)) return false;
    if (target.closest("input, textarea, select, [contenteditable='true']")) return true;

    // Areas that already scroll sideways keep their own swipe (e.g. the Settings tabs on small phones).
    for (let node: Element | null = target; node && node !== document.body; node = node.parentElement) {
        if (node.scrollWidth > node.clientWidth + 1) {
            const overflowX = getComputedStyle(node).overflowX;
            if (overflowX === "auto" || overflowX === "scroll") return true;
        }
    }

    return false;
}

// Phones/tablets: swipe right anywhere opens the side menu, swipe left closes it.
// The drawer follows the finger; on release it opens past half its width or on a quick flick.
// During the drag the DOM is moved directly (no React re-render of the pages), then the
// inline styles are cleared and the normal open/closed classes take over (with their transition).
export function useDrawerSwipe(options: DrawerSwipeOptions) {
    // Latest values for the listeners, without re-adding them on every render.
    const latest = useRef(options);
    useEffect(() => {
        latest.current = options;
    });

    useEffect(() => {
        let tracking = false;
        let dragging = false;
        let startX = 0;
        let startY = 0;
        let width = 0;
        let startedOpen = false;
        let lastX = 0;
        let lastTime = 0;
        let velocity = 0;
        let position = 0; // drawer translateX in px: -width = closed, 0 = open

        function apply(x: number) {
            const { drawerRef, backdropRef } = latest.current;
            position = Math.max(-width, Math.min(0, x));

            if (drawerRef.current) {
                drawerRef.current.style.transition = "none";
                // Tailwind 4 translate-x-* classes use the CSS `translate` property (not `transform`),
                // so the inline value must be `translate` too, or both would add up.
                drawerRef.current.style.translate = `${position}px 0`;
            }
            if (backdropRef.current) {
                backdropRef.current.style.transition = "none";
                backdropRef.current.style.opacity = String((position + width) / width);
            }
        }

        // Back to the class-based state; the CSS transition animates from where the finger left it.
        function release() {
            const { drawerRef, backdropRef } = latest.current;
            for (const element of [drawerRef.current, backdropRef.current]) {
                if (!element) continue;
                element.style.transition = "";
                element.style.translate = "";
                element.style.opacity = "";
            }
        }

        function handleTouchStart(event: TouchEvent) {
            tracking = false;
            dragging = false;
            if (event.touches.length !== 1 || shouldIgnore(event.target)) return;

            const touch = event.touches[0];
            tracking = true;
            startX = touch.clientX;
            startY = touch.clientY;
            startedOpen = latest.current.open;
            lastX = startX;
            lastTime = event.timeStamp;
            velocity = 0;
        }

        function handleTouchMove(event: TouchEvent) {
            if (!tracking) return;

            const touch = event.touches[0];
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;

            if (!dragging) {
                if (Math.abs(dx) < LOCK_DISTANCE && Math.abs(dy) < LOCK_DISTANCE) return;

                // Closed: only a swipe right counts. Open: only a swipe left.
                const rightDirection = startedOpen ? dx < 0 : dx > 0;
                if (Math.abs(dx) < Math.abs(dy) * HORIZONTAL_RATIO || !rightDirection) {
                    tracking = false; // A vertical scroll (or the wrong way): leave it to the page
                    return;
                }

                const drawer = latest.current.drawerRef.current;
                if (!drawer) { tracking = false; return; }

                dragging = true;
                width = drawer.offsetWidth;
            }

            event.preventDefault(); // While dragging the drawer, the page does not scroll

            const elapsed = event.timeStamp - lastTime;
            if (elapsed > 0) velocity = (touch.clientX - lastX) / elapsed;
            lastX = touch.clientX;
            lastTime = event.timeStamp;

            apply((startedOpen ? 0 : -width) + dx);
        }

        function handleTouchEnd() {
            if (!dragging) { tracking = false; return; }

            tracking = false;
            dragging = false;

            const progress = (position + width) / width; // 0 = closed, 1 = open
            const shouldOpen =
                velocity > FLING_VELOCITY ? true :
                velocity < -FLING_VELOCITY ? false :
                progress > 0.5;

            release();

            if (shouldOpen && !latest.current.open) latest.current.onOpen();
            if (!shouldOpen && latest.current.open) latest.current.onClose();
        }

        document.addEventListener("touchstart", handleTouchStart, { passive: true });
        // Not passive: preventDefault() stops the page from scrolling while the drawer is dragged.
        document.addEventListener("touchmove", handleTouchMove, { passive: false });
        document.addEventListener("touchend", handleTouchEnd);
        document.addEventListener("touchcancel", handleTouchEnd);

        return () => {
            document.removeEventListener("touchstart", handleTouchStart);
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleTouchEnd);
            document.removeEventListener("touchcancel", handleTouchEnd);
        };
    }, []);
}
