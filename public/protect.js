(() => {
  const isLocalDev =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "[::1]";

  // Skip all protections during local development (DevTools overlay caused a black screen)
  if (isLocalDev) {
    document.documentElement.classList.remove("devtools-open");
    return;
  }

  const isJsonEditor = (target) =>
    target instanceof Element && Boolean(target.closest("[data-json-editor='true']"));

  const block = (e) => {
    // The admin JSON editors deliberately remain editable, including clipboard
    // actions. Everything else on the public site stays protected.
    if (isJsonEditor(e.target) && ["copy", "cut", "paste"].includes(e.type)) return;
    e.preventDefault();
    return false;
  };

  document.addEventListener("contextmenu", block, { capture: true });
  document.addEventListener("selectstart", block, { capture: true });
  document.addEventListener("dragstart", block, { capture: true });
  document.addEventListener("copy", block, { capture: true });
  document.addEventListener("cut", block, { capture: true });
  document.addEventListener("paste", block, { capture: true });

  document.addEventListener(
    "keydown",
    (e) => {
      const key = e.key?.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const isClipboardShortcut = ctrl && ["c", "x", "v"].includes(key);

      if (isClipboardShortcut && isJsonEditor(e.target)) return;

      if (
        key === "f12" ||
        (ctrl && shift && ["i", "j", "c", "k", "u"].includes(key)) ||
        (ctrl && ["u", "s", "p", "a", "c", "x", "v"].includes(key)) ||
        (e.metaKey && e.altKey && ["i", "j", "c"].includes(key))
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    },
    { capture: true }
  );

  const threshold = 160;
  setInterval(() => {
    if (window.innerWidth < 900) {
      document.documentElement.classList.remove("devtools-open");
      return;
    }
    const widthGap = window.outerWidth - window.innerWidth > threshold;
    const heightGap = window.outerHeight - window.innerHeight > threshold;
    if (widthGap || heightGap) {
      document.documentElement.classList.add("devtools-open");
    } else {
      document.documentElement.classList.remove("devtools-open");
    }
  }, 800);
})();
