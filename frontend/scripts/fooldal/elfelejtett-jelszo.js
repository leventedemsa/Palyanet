      const htmlEl = document.documentElement;
      const btn = document.getElementById("themeToggle");

      function setTheme(theme) {
        htmlEl.setAttribute("data-bs-theme", theme);
        localStorage.setItem("theme", theme);

        if (theme === "dark") {
          btn.textContent = "☀️ Light";
          btn.classList.remove("btn-outline-secondary");
          btn.classList.add("btn-outline-light");
        } else {
          btn.textContent = "🌙 Dark";
          btn.classList.remove("btn-outline-light");
          btn.classList.add("btn-outline-secondary");
        }
      }

      const saved = localStorage.getItem("theme");
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(saved ?? (prefersDark ? "dark" : "light"));

      btn.addEventListener("click", () => {
        const current = htmlEl.getAttribute("data-bs-theme") || "light";
        setTheme(current === "dark" ? "light" : "dark");
      });
    

      (() => {
        "use strict";
        const forms = document.querySelectorAll(".needs-validation");
        Array.from(forms).forEach((form) => {
          form.addEventListener(
            "submit",
            (event) => {
              if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
              }
              form.classList.add("was-validated");
            },
            false,
          );
        });
      })();
    

