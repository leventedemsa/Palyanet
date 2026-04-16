const registerForm = document.getElementById("registerForm");

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const email = document.getElementById("email").value.trim();
    const username = document.getElementById("username").value.trim();
    const teljes_nev = document.getElementById("fullname").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const szerep = document.getElementById("role").value;

    if (!registerForm.checkValidity()) {
      registerForm.classList.add("was-validated");
      return;
    }

    if (password !== confirmPassword) {
      await Swal.fire({
        icon: "warning",
        title: "Eltérő jelszavak",
        text: "A két jelszó nem egyezik.",
        confirmButtonColor: "#ff7a18"
      });
      return;
    }

    try {
      const response = await fetch("http://localhost:4000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          username,
          teljes_nev,
          password,
          szerep
        })
      });

      const data = await response.json();

      if (!response.ok) {
        await Swal.fire({
          icon: "error",
          title: "Regisztrációs hiba",
          text: data.message || "Hiba történt regisztráció közben.",
          confirmButtonColor: "#ff7a18"
        });
        return;
      }


      localStorage.setItem("user", JSON.stringify(data.user));
      
      await Swal.fire({
        icon: "success",
        title: "Sikeres regisztráció",
        text: "Most már be tudsz jelentkezni.",
        confirmButtonColor: "#ff7a18"
      });
      window.location.href = "./bejelentkezes.html";
    } catch (error) {
      console.error(error);
      await Swal.fire({
        icon: "error",
        title: "Kapcsolódási hiba",
        text: "Nem sikerült kapcsolódni a szerverhez.",
        confirmButtonColor: "#ff7a18"
      });
    }
  });

