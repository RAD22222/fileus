// Android-style touch ripple: expands from the pointer position and fades out.
// Attached globally in main.tsx; any element with .md-ripple responds.

export function initRipples(): void {
  if (typeof document === 'undefined') return;

  document.addEventListener(
    'pointerdown',
    (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const host = target?.closest<HTMLElement>('.md-ripple');
      if (!host) return;

      // Respect reduced-motion users
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const rect = host.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2.2;
      const wave = document.createElement('span');
      wave.className = 'md-ripple-wave';
      wave.style.width = `${size}px`;
      wave.style.height = `${size}px`;
      wave.style.left = `${event.clientX - rect.left - size / 2}px`;
      wave.style.top = `${event.clientY - rect.top - size / 2}px`;

      host.appendChild(wave);
      const remove = () => wave.remove();
      wave.addEventListener('animationend', remove);
      // Safety cleanup if animation events never fire (e.g. background tab)
      window.setTimeout(remove, 800);
    },
    { passive: true }
  );
}
