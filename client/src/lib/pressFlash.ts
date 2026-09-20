// Brief brighten-flash for on-screen keyboard keys and touch controls.
// Uses the Web Animations API directly on the element so the flash survives
// the re-render that every keystroke causes.
export function pressFlash(el: HTMLElement): void {
  try {
    el.animate(
      [{ filter: "brightness(2.1)" }, { filter: "brightness(1)" }],
      { duration: 160, easing: "ease-out" }
    );
  } catch {} // older engines without el.animate just skip the flash
}
