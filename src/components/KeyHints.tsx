interface Hint {
  keys: string;
  label: string;
}

/** On-screen legend so the demo is self-explanatory with a PC keyboard. */
export function KeyHints({ hints }: { hints: Hint[] }) {
  return (
    <footer className="key-hints" aria-label="Controles">
      {hints.map((hint) => (
        <span key={hint.label} className="key-hints__item">
          <kbd>{hint.keys}</kbd> {hint.label}
        </span>
      ))}
    </footer>
  );
}
