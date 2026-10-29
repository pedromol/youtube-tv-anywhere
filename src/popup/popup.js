"use strict";

const toggle = document.getElementById("instructions-toggle");
const setup = document.getElementById("setup");

toggle.addEventListener("click", () => {
  setup.hidden = !setup.hidden;
  toggle.setAttribute("aria-expanded", String(!setup.hidden));
});
