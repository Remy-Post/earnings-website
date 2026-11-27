import { useReport } from "./data/useReport";
import { Footer } from "./ui/Footer";

export function App() {
  const state = useReport();
  return (
    <>
      <a className="skip" href="#main">Skip to the report</a>
      <main id="main" className="page">
        <header className="title-block">
          <h1 className="page-title">Can free data predict earnings&#8209;day stock moves?</h1>
          {state.status === "loading" && <p className="lede skeleton" aria-busy="true">Loading the results.</p>}
          {state.status === "error" && (
            <p className="lede" role="alert">
              The results could not be loaded just now ({state.message}). The data comes from the project&rsquo;s
              API, which may be restarting; try again in a few minutes.
            </p>
          )}
          {state.status === "ready" && (
            <p className="lede">
              Results loaded for {state.loaded.payload.splits.validation.years}
              {state.loaded.payload.splits.test ? ` and ${state.loaded.payload.splits.test.years}` : ""}.
            </p>
          )}
        </header>
      </main>
      <Footer state={state} />
    </>
  );
}
