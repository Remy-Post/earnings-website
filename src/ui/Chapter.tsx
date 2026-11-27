import type { ReactNode } from "react";

/** A chapter makes one claim: its title, then its finding in the serif, then the evidence. */
export function Chapter({ id, title, finding, children }: { id: string; title: string; finding?: string; children: ReactNode }) {
  return (
    <section className="chapter" id={id} aria-labelledby={`${id}-title`}>
      <h2 className="chapter-title" id={`${id}-title`}>{title}</h2>
      {finding && <p className="finding">{finding}</p>}
      {children}
    </section>
  );
}
