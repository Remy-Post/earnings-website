import { useLayoutEffect, useRef, useState } from "react";

/** Never lay a chart out narrower than at the 320px floor (DESIGN.md section 6). */
export const MIN_WIDTH = 280;

/** The width of an element, followed with a ResizeObserver, and the page scale (root font size / 16), so a
 *  chart lays out in CSS pixels at its real width and its spacing grows with the page's rem scale. */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, scale: 1 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      setSize({ width: Math.max(MIN_WIDTH, Math.round(el.clientWidth)), scale: root / 16 });
    };
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => { ro.disconnect(); };
  }, []);
  return { ref, ...size };
}
