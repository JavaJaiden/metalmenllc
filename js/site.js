/* Metal Men LLC — site behaviour (no dependencies) */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----- mobile nav ----- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    var mq = window.matchMedia("(max-width: 860px)");
    function setNav(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Close" : "Menu";
      nav.classList.toggle("is-open", open);
    }
    toggle.addEventListener("click", function () {
      setNav(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A" && mq.matches) setNav(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") { setNav(false); toggle.focus(); }
    });
    mq.addEventListener("change", function () { setNav(false); });
  }

  /* ----- header compacts after the page scrolls ----- */
  var header = document.getElementById("site-header");
  if (header) {
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        header.classList.toggle("is-scrolled", window.scrollY > 24);
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ----- scroll reveal (elements are visible without JS; this only adds the entrance) ----- */
  if ("IntersectionObserver" in window && !reduceMotion) {
    var groups = document.querySelectorAll("[data-reveal]");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    groups.forEach(function (group) {
      var kids = group.getAttribute("data-reveal") === "children" ? Array.prototype.slice.call(group.children) : [group];
      kids.forEach(function (el, i) {
        el.classList.add("reveal");
        el.style.setProperty("--d", Math.min(i, 6) * 70 + "ms");
        io.observe(el);
      });
    });
  }

  /* ----- footer year ----- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ----- back to top ----- */
  var toTop = document.getElementById("to-top");
  if (toTop) {
    window.addEventListener("scroll", function () {
      toTop.classList.toggle("is-visible", window.scrollY > 900);
    }, { passive: true });
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ----- project filters ----- */
  var chips = document.querySelectorAll(".chip[data-filter]");
  var projects = document.querySelectorAll(".project[data-category]");
  var list = document.querySelector(".projects-list");
  if (chips.length && projects.length) {
    function applyFilter(value) {
      chips.forEach(function (c) {
        c.setAttribute("aria-pressed", c.getAttribute("data-filter") === value ? "true" : "false");
      });
      var swap = function () {
        projects.forEach(function (p) {
          p.hidden = !(value === "all" || p.getAttribute("data-category") === value);
        });
        if (list) list.classList.remove("is-filtering");
      };
      if (list && !reduceMotion) { list.classList.add("is-filtering"); setTimeout(swap, 160); } else { swap(); }
    }
    chips.forEach(function (c) {
      c.addEventListener("click", function () { applyFilter(c.getAttribute("data-filter")); });
    });
  }

  /* ----- lightbox ----- */
  var lb = document.getElementById("lightbox");
  if (lb) {
    var lbStage = lb.querySelector(".lb-stage");
    var lbImg = lb.querySelector(".lb-stage img");
    var lbCap = lb.querySelector(".lb-caption");
    var lbTitle = lb.querySelector(".lb-title");
    var lbCount = lb.querySelector(".lb-count");
    var lbClose = lb.querySelector(".lb-close");
    var lbPrev = lb.querySelector(".lb-prev");
    var lbNext = lb.querySelector(".lb-next");
    var items = [];
    var index = 0;
    var lastFocus = null;
    var closeTimer = null;

    document.querySelectorAll(".photo button[data-full]").forEach(function (btn) {
      var item = {
        full: btn.getAttribute("data-full"),
        alt: btn.querySelector("img") ? btn.querySelector("img").alt : "",
        caption: btn.getAttribute("data-caption") || "",
        title: btn.getAttribute("data-title") || "",
        button: btn
      };
      items.push(item);
      btn.addEventListener("click", function () { open(item); });
    });

    function visibleItems() {
      return items.filter(function (i) {
        var proj = i.button.closest(".project");
        return !proj || !proj.hidden;
      });
    }
    function render() {
      var vis = visibleItems();
      if (!vis.length) return;
      if (index < 0) index = vis.length - 1;
      if (index >= vis.length) index = 0;
      var it = vis[index];
      lbImg.classList.add("is-loading");
      lbStage.classList.add("is-loading");
      lbImg.onload = function () { lbImg.classList.remove("is-loading"); lbStage.classList.remove("is-loading"); };
      lbImg.src = it.full;
      lbImg.alt = it.alt;
      lbCap.textContent = it.caption;
      lbTitle.textContent = it.title;
      lbCount.textContent = (index + 1) + " / " + vis.length;
      [vis[(index + 1) % vis.length], vis[(index - 1 + vis.length) % vis.length]].forEach(function (n) {
        var im = new Image(); im.src = n.full;
      });
    }
    function open(item) {
      index = Math.max(0, visibleItems().indexOf(item));
      lastFocus = document.activeElement;
      clearTimeout(closeTimer);
      lb.hidden = false;
      document.body.classList.add("lb-open");
      render();
      requestAnimationFrame(function () { lb.classList.add("is-open"); });
      lbClose.focus();
    }
    function close() {
      lb.classList.remove("is-open");
      document.body.classList.remove("lb-open");
      closeTimer = setTimeout(function () {
        lb.hidden = true;
        lbImg.removeAttribute("src");
      }, reduceMotion ? 0 : 220);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    lbClose.addEventListener("click", close);
    lbPrev.addEventListener("click", function () { index -= 1; render(); });
    lbNext.addEventListener("click", function () { index += 1; render(); });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target === lbStage) close(); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") { close(); return; }
      if (e.key === "ArrowRight") { index += 1; render(); return; }
      if (e.key === "ArrowLeft") { index -= 1; render(); return; }
      if (e.key === "Tab") {
        var focusables = [lbClose, lbPrev, lbNext];
        var i = focusables.indexOf(document.activeElement);
        if (e.shiftKey && (i <= 0)) { e.preventDefault(); focusables[focusables.length - 1].focus(); }
        else if (!e.shiftKey && i === focusables.length - 1) { e.preventDefault(); focusables[0].focus(); }
      }
    });
    var startX = null;
    lb.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) { index += dx < 0 ? 1 : -1; render(); }
      startX = null;
    });
  }

  /* ----- contact form ----- */
  /* On Netlify the form posts to Netlify Forms, which emails Artie.
     Anywhere else (local preview, a host without form handling) it falls back
     to opening the visitor's email app with the request filled in. */
  var form = document.getElementById("quote-form");
  if (form) {
    var status = form.querySelector(".form-status");
    var button = form.querySelector('button[type="submit"]');
    var get = function (n) { var el = form.elements[n]; return el ? el.value.trim() : ""; };
    function mailtoFallback() {
      var subject = "Project inquiry from " + (get("name") || "website visitor") + (get("company") ? " (" + get("company") + ")" : "");
      var body = [
        "Name: " + get("name"), "Company: " + get("company"), "Phone: " + get("phone"),
        "Email: " + get("email"), "Project type: " + get("type"), "", "Project details:", get("details")
      ].join("\n");
      window.location.href = "mailto:artie@metalmenllc.net?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      if (status) status.textContent = "Your email app should open with this request. If it doesn't, email artie@metalmenllc.net or call 410-878-0329.";
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!get("name") || !get("email")) {
        if (status) status.textContent = "Please add your name and email so we can reply.";
        (get("name") ? form.elements.email : form.elements.name).focus();
        return;
      }
      if (button) button.disabled = true;
      if (status) status.textContent = "Sending\u2026";
      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(new FormData(form)).toString()
      }).then(function (res) {
        if (!res.ok) throw new Error(res.status);
        form.reset();
        if (status) status.textContent = "Thanks. Your request was sent to Artie, and he will get back to you within one business day.";
      }).catch(mailtoFallback).then(function () { if (button) button.disabled = false; });
    });
  }
})();
