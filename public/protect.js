(() => {
  const block = (e) => {
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

      // DevTools / view source / save / print / select-all / copy / cut / paste
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

  // Light DevTools-open deterrent (desktop only; not foolproof)
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
