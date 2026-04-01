      const htmlEl = document.documentElement;
      const btn = document.getElementById("themeToggle");

      function setTheme(theme) {
        htmlEl.setAttribute("data-bs-theme", theme);
        localStorage.setItem("theme", theme);

        if (theme === "dark") {
          btn.textContent = "☀️ Light";
        } else {
          btn.textContent = "🌙 Dark";
        }
      }

      const saved = localStorage.getItem("theme");
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(saved ?? (prefersDark ? "dark" : "light"));

      btn.addEventListener("click", () => {
        const current = htmlEl.getAttribute("data-bs-theme") || "light";
        setTheme(current === "dark" ? "light" : "dark");
      });

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );

      document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale").forEach((el) => {
        observer.observe(el);
      });
    

