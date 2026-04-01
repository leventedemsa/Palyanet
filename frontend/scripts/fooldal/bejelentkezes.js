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

    const form = document.getElementById("loginForm");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }

      const identifier = document.getElementById("identifier").value.trim();
      const password = document.getElementById("password").value;
      const rememberMe = document.getElementById("rememberMe").checked;

      try {
        const response = await fetch("http://localhost:4000/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier,
            password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          await Swal.fire({
            icon: "error",
            title: "Bejelentkezési hiba",
            text: data.message || "Hibás bejelentkezés.",
            confirmButtonColor: "#ff7a18"
          });
          return;
        }

        if (rememberMe) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
        } else {
          sessionStorage.setItem("token", data.token);
          sessionStorage.setItem("user", JSON.stringify(data.user));
        }

        await Swal.fire({
          icon: "success",
          title: "Sikeres bejelentkezés",
          text: "Üdv újra a Pályaneten!",
          timer: 1200,
          showConfirmButton: false
        });
        window.location.href = "./index.html";
      } catch (error) {
        console.error("Login fetch hiba:", error);
        await Swal.fire({
          icon: "error",
          title: "Kapcsolódási hiba",
          text: "Nem sikerült kapcsolódni a szerverhez.",
          confirmButtonColor: "#ff7a18"
        });
      }

      form.classList.add("was-validated");
    });
  })();

