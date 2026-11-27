// Applies the stored theme choice before first paint, so a reader who forced light or dark never sees the other
// palette flash. Loaded as a blocking script from index.html (the CSP allows no inline script).
(function () {
  try {
    var stored = window.localStorage.getItem("report-theme");
    if (stored === "light" || stored === "dark") document.documentElement.setAttribute("data-theme", stored);
  } catch {
    // Storage is blocked: follow the system setting.
  }
})();
