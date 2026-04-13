(() => {
  "use strict";

  const form = document.querySelector("form.needs-validation");
  if (!form) return;

  const statusContainer = document.createElement("div");
  statusContainer.setAttribute("aria-live", "polite");
  statusContainer.className = "mt-3";
  form.parentNode.insertBefore(statusContainer, form.nextSibling);

  const sanitize = (value) => String(value || "").trim();
  const encode = (value) => encodeURIComponent(value || "");

  const showReturnConfirmation = () => {
    if (sessionStorage.getItem("kapcsolatVisszateres")) {
      Swal.fire({
        icon: "success",
        title: "Megkaptuk az emailed",
        text: "Minél hamarabb válaszolunk rá.",
        confirmButtonText: "Rendben",
      });
      statusContainer.textContent = "";
      statusContainer.className = "mt-3";
      sessionStorage.removeItem("kapcsolatVisszateres");
      form.classList.remove("was-validated");
    }
  };

  showReturnConfirmation();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      statusContainer.textContent = "Kérlek töltsd ki az összes kötelező mezőt.";
      statusContainer.className = "mt-3 text-danger";
      return;
    }

    const name = sanitize(document.getElementById("name").value);
    const email = sanitize(document.getElementById("email").value);
    const message = sanitize(document.getElementById("message").value);

    const subject = `Pályanet kapcsolat - ${name}`;
    const body = `Név: ${name}\nEmail: ${email}\n\nÜzenet:\n${message}`;

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${encode("toth.kornel@ganziskola.hu")}&cc=${encode("demsa.levente@ganziskola.hu")}&su=${encode(subject)}&body=${encode(body)}`;

    statusContainer.innerHTML = "Gmail megnyitása...";
    statusContainer.className = "mt-3 text-success";
    sessionStorage.setItem("kapcsolatVisszateres", "1");

    const gmailWindow = window.open(gmailUrl, "_blank");
    if (!gmailWindow) {
      sessionStorage.removeItem("kapcsolatVisszateres");
      Swal.fire({
        icon: "error",
        title: "A Gmail megnyitása sikertelen",
        html: `Az email kliens nem nyílt meg automatikusan. <a href="${gmailUrl}" target="_blank" rel="noopener noreferrer">Kattints ide</a> a Gmail megnyitásához.`,
        confirmButtonText: "Rendben",
      });
      statusContainer.innerHTML = `A Gmail ablak nem nyílt meg automatikusan. <a href="${gmailUrl}" target="_blank" rel="noopener noreferrer">Kattints ide</a> a Gmail megnyitásához.`;
      statusContainer.className = "mt-3 text-warning";
      return;
    }

    Swal.fire({
      icon: "success",
      title: "Megkaptuk az emailed",
      text: "Minél hamarabb válaszolunk rá.",
      confirmButtonText: "Rendben",
    });
    statusContainer.textContent = "";
    statusContainer.className = "mt-3";
  });
})();

