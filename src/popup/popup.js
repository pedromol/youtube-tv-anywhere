"use strict";

const toggle = document.getElementById("instructions-toggle");
const setup = document.getElementById("setup");

toggle.addEventListener("click", () => {
  const isHidden = setup.hidden;

  setup.hidden = !isHidden;
  toggle.setAttribute("aria-expanded", String(isHidden));
});
