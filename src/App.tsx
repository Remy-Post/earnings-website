import { H1Figure } from "./chapters/H1Figure";
import { BigMoveChapter, OverfitChapter, ProfilesChapter, SizeChapter, TechChapter } from "./chapters/Results";
import { LimitsChapter, MethodsChapter, QuestionChapter, verdict } from "./chapters/Text";
import { useReport } from "./data/useReport";
import { Footer } from "./ui/Footer";

const CHAPTERS: [string, string][] = [
  ["question", "The question and the test"],
  ["size", "Size of the move"],
  ["tech", "Technology stocks"],
  ["overfitting", "Overfitting"],
  ["big-moves", "Big moves"],
  ["profiles", "Company profiles"],
  ["methods", "Methods"],
  ["limits", "Limits and the live test"],
];

export function App() {
  const state = useReport();
  const p = state.status === "ready" ? state.loaded.payload : null;
  return (
    <>
      <a className="skip" href="#main">Skip to the report</a>
      <main id="main" className="page">
        <header className="title-block">
          <h1 className="page-title">Can free data predict earnings&#8209;day stock moves?</h1>
          {state.status === "loading" && <p className="lede skeleton" aria-busy="true">Loading the results from the project&rsquo;s data.</p>}
          {state.status === "error" && (
            <p className="lede" role="alert">
              The results could not be loaded just now. They come from the project&rsquo;s own data service, which may be
              restarting; try again in a few minutes.
            </p>
          )}
          {p && <p className="lede">{verdict(p)}</p>}
          <p className="byline">
            COMP&#8209;4112 Introduction to Data Science, term project. Remy Post, Lakehead University. Nasdaq&#8209;100, 2004 to 2026.
          </p>
        </header>
        {!p && <div className="body-skeleton" aria-hidden="true" />}
        {p && (
          <>
            <H1Figure p={p} />
            <nav className="toc" aria-label="Chapters">
              <ol>
                {CHAPTERS.map(([id, label]) => (
                  <li key={id}><a href={`#${id}`}>{label}</a></li>
                ))}
              </ol>
            </nav>
            <QuestionChapter p={p} />
            <SizeChapter p={p} />
            <TechChapter p={p} />
            <OverfitChapter p={p} />
            <BigMoveChapter p={p} />
            <ProfilesChapter p={p} />
            <MethodsChapter />
            <LimitsChapter />
          </>
        )}
      </main>
      <Footer state={state} />
    </>
  );
}
