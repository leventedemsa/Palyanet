function showSuccess(message) {
                return Swal.fire({
                    icon: "success",
                    title: "Sikeres művelet",
                    text: message,
                    confirmButtonText: "Rendben",
                });
            }

            function showError(message) {
                return Swal.fire({
                    icon: "error",
                    title: "Hiba",
                    text: message,
                    confirmButtonText: "Rendben",
                });
            }

            function showWarning(message) {
                return Swal.fire({
                    icon: "warning",
                    title: "Figyelem",
                    text: message,
                    confirmButtonText: "Rendben",
                });
            }

            // ===== PÁLYÁK KEZELÉS =====
            const API_URL = "http://localhost:4000/api/palyak";
            const container = document.getElementById("palyakContainer");
            const helyszinInput = document.getElementById("helyszin");
            const helyszinModalElement = document.getElementById("helyszinModal");
            const helyszinModal = helyszinModalElement ? new bootstrap.Modal(helyszinModalElement) : null;
            const selectedLocations = new Set();
            const palyaKepekModalElement = document.getElementById("palyaKepekModal");
            const palyaKepekModal = palyaKepekModalElement ? new bootstrap.Modal(palyaKepekModalElement) : null;
            const palyaKepekMain = document.getElementById("palyaKepekMain");
            const palyaKepekThumbs = document.getElementById("palyaKepekThumbs");
            const galleryViewer = document.querySelector(".gallery-viewer");
            const galleryPrevBtn = document.getElementById("galleryPrevBtn");
            const galleryNextBtn = document.getElementById("galleryNextBtn");
            const galleryCounter = document.getElementById("galleryCounter");
            const galleryFullscreenBtn = document.getElementById("galleryFullscreenBtn");
            const palyaImagesById = {};
            let activeGalleryImages = [];
            let activeGalleryIndex = 0;
            let touchStartX = null;

            const budapestKeruletek = Array.from({ length: 23 }, (_, i) => `${toRoman(i + 1)}. kerület`);
            const megyek = [
                "Bács-Kiskun",
                "Baranya",
                "Békés",
                "Borsod-Abaúj-Zemplén",
                "Csongrád-Csanád",
                "Fejér",
                "Győr-Moson-Sopron",
                "Hajdú-Bihar",
                "Heves",
                "Jász-Nagykun-Szolnok",
                "Komárom-Esztergom",
                "Nógrád",
                "Pest",
                "Somogy",
                "Szabolcs-Szatmár-Bereg",
                "Tolna",
                "Vas",
                "Veszprém",
                "Zala",
            ];
            const varosok = [
                "Budapest",
                "Debrecen",
                "Győr",
                "Kecskemét",
                "Miskolc",
                "Nyíregyháza",
                "Pécs",
                "Sopron",
                "Szeged",
                "Székesfehérvár",
                "Szentendre",
            ];

            function toRoman(num) {
                const map = [
                    [10, "X"],
                    [9, "IX"],
                    [5, "V"],
                    [4, "IV"],
                    [1, "I"],
                ];
                let out = "";
                let n = num;
                map.forEach(([value, numeral]) => {
                    while (n >= value) {
                        out += numeral;
                        n -= value;
                    }
                });
                return out;
            }

            function normalizeLocationText(text) {
                let normalized = String(text || "")
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .toLowerCase();

                const romanDistrictMatch = normalized.match(/^([ivxlcdm]+)\.\s*kerulet\b/);
                if (romanDistrictMatch) {
                    const districtNumber = romanToNumber(romanDistrictMatch[1]);
                    if (districtNumber > 0) {
                        normalized = normalized.replace(/^([ivxlcdm]+)\.\s*kerulet\b/, `${districtNumber}. kerulet`);
                    }
                }

                return normalized;
            }

            function romanToNumber(roman) {
                const values = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 };
                let total = 0;
                let prev = 0;
                const chars = String(roman || "").toLowerCase().split("").reverse();
                chars.forEach((char) => {
                    const current = values[char] || 0;
                    if (current < prev) {
                        total -= current;
                    } else {
                        total += current;
                    }
                    prev = current;
                });
                return total;
            }

            function isBudapestDistrict(normalizedLocation) {
                return /^\d{1,2}\.\s*kerulet\b/.test(normalizedLocation);
            }

            function renderLocationOptions(containerId, items, prefix) {
                const root = document.getElementById(containerId);
                if (!root) return;
                root.innerHTML = items
                    .map(
                        (item, index) => `
              <div class="col-12 col-md-4">
                <div class="form-check mb-2">
                  <input class="form-check-input helyszin-choice" type="checkbox" id="${prefix}_${index}" value="${item}">
                  <label class="form-check-label" for="${prefix}_${index}">${item}</label>
                </div>
              </div>
            `,
                    )
                    .join("");
            }

            function updateSelectedLocationSummary() {
                const list = Array.from(selectedLocations);
                const badgesRoot = document.getElementById("kivalasztottHelyszinek");
                if (!badgesRoot) return;

                if (list.length === 0) {
                    badgesRoot.innerHTML = '<span class="text-body-secondary">Nincs kiválasztott helyszín</span>';
                    helyszinInput.value = "";
                    return;
                }

                badgesRoot.innerHTML = list
                    .map((item) => `<span class="badge rounded-pill text-bg-success fs-6 px-3 py-2 me-2 mb-2">${item}</span>`)
                    .join("");
                helyszinInput.value = list.join(", ");
            }

            function syncLocationCheckboxes() {
                document.querySelectorAll(".helyszin-choice").forEach((checkbox) => {
                    checkbox.checked = selectedLocations.has(checkbox.value);
                });
            }

            function initHelyszinModal() {
                renderLocationOptions("budapestKeruletekContainer", budapestKeruletek, "kerulet");
                renderLocationOptions("megyekContainer", megyek, "megye");
                renderLocationOptions("varosokContainer", varosok, "varos");
                syncLocationCheckboxes();
                updateSelectedLocationSummary();

                document.querySelectorAll(".helyszin-choice").forEach((checkbox) => {
                    checkbox.addEventListener("change", (event) => {
                        const location = event.target.value;
                        if (event.target.checked) {
                            selectedLocations.add(location);
                        } else {
                            selectedLocations.delete(location);
                        }
                        updateSelectedLocationSummary();
                    });
                });
            }

            // Pályák megjelenítése
            function formatTimeOnly(value) {
                if (!value) return "--:--";
                const raw = String(value);
                const hhmmMatch = raw.match(/(\d{1,2}):(\d{2})/);
                if (hhmmMatch) {
                    return `${hhmmMatch[1].padStart(2, "0")}:${hhmmMatch[2]}`;
                }
                const d = new Date(value);
                if (!Number.isNaN(d.getTime())) {
                    return d.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit", hour12: false });
                }
                return "--:--";
            }

            function parseImageUrls(value) {
                if (!value) return [];
                if (Array.isArray(value)) return value.filter(Boolean);

                const raw = String(value).trim();
                if (!raw) return [];

                if (raw.startsWith("[")) {
                    try {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed)) {
                            return parsed.filter(Boolean);
                        }
                    } catch (_) {}
                }

                return [raw];
            }

            function toAbsoluteImageUrl(url) {
                if (!url) return "../palyanetlogo.png";
                if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:")) {
                    return url;
                }
                if (url.startsWith("/")) {
                    return `http://localhost:4000${url}`;
                }
                return url;
            }

            function openImagesModal(palyaId) {
                if (!palyaKepekModal || !palyaKepekMain || !palyaKepekThumbs) return;
                const urls = palyaImagesById[String(palyaId)] || [];
                if (!urls.length) return;

                activeGalleryImages = urls.map((url) => toAbsoluteImageUrl(url));
                activeGalleryIndex = 0;

                palyaKepekThumbs.innerHTML = activeGalleryImages
                    .map(
                        (url, index) =>
                            `<img src="${url}" class="gallery-thumb" alt="Pályakép ${index + 1}" data-index="${index}" />`,
                    )
                    .join("");

                renderGalleryImage();
                palyaKepekModal.show();
            }

            function renderGalleryImage() {
                if (!activeGalleryImages.length || !palyaKepekMain) return;
                if (activeGalleryIndex < 0) activeGalleryIndex = 0;
                if (activeGalleryIndex >= activeGalleryImages.length) activeGalleryIndex = activeGalleryImages.length - 1;

                palyaKepekMain.src = activeGalleryImages[activeGalleryIndex];

                if (galleryCounter) {
                    galleryCounter.textContent = `${activeGalleryIndex + 1} / ${activeGalleryImages.length}`;
                }

                if (galleryPrevBtn) {
                    galleryPrevBtn.style.display = activeGalleryImages.length > 1 ? "flex" : "none";
                }
                if (galleryNextBtn) {
                    galleryNextBtn.style.display = activeGalleryImages.length > 1 ? "flex" : "none";
                }

                if (palyaKepekThumbs) {
                    palyaKepekThumbs.querySelectorAll(".gallery-thumb").forEach((thumb, idx) => {
                        thumb.classList.toggle("is-active", idx === activeGalleryIndex);
                    });
                }
            }

            function updateFullscreenButtonState() {
                if (!galleryFullscreenBtn) return;
                const isFullscreen = !!document.fullscreenElement;
                galleryFullscreenBtn.textContent = isFullscreen ? "Kilépés teljes képernyőről" : "Teljes képernyő";
                galleryFullscreenBtn.setAttribute(
                    "aria-label",
                    isFullscreen ? "Kilépés teljes képernyőről" : "Teljes képernyő",
                );
            }

            function toggleFullscreen() {
                if (!galleryViewer) return;
                if (!document.fullscreenElement) {
                    galleryViewer.requestFullscreen?.();
                    return;
                }
                document.exitFullscreen?.();
            }

            function showNextImage() {
                if (!activeGalleryImages.length) return;
                activeGalleryIndex = (activeGalleryIndex + 1) % activeGalleryImages.length;
                renderGalleryImage();
            }

            function showPrevImage() {
                if (!activeGalleryImages.length) return;
                activeGalleryIndex = (activeGalleryIndex - 1 + activeGalleryImages.length) % activeGalleryImages.length;
                renderGalleryImage();
            }

            window.openImagesModal = openImagesModal;

            if (palyaKepekThumbs) {
                palyaKepekThumbs.addEventListener("click", (event) => {
                    const thumb = event.target.closest("img[data-index]");
                    if (!thumb || !palyaKepekMain) return;
                    const nextIndex = Number(thumb.getAttribute("data-index"));
                    if (Number.isNaN(nextIndex)) return;
                    activeGalleryIndex = nextIndex;
                    renderGalleryImage();
                });
            }

            if (galleryNextBtn) {
                galleryNextBtn.addEventListener("click", showNextImage);
            }

            if (galleryPrevBtn) {
                galleryPrevBtn.addEventListener("click", showPrevImage);
            }

            if (galleryFullscreenBtn) {
                galleryFullscreenBtn.addEventListener("click", toggleFullscreen);
            }

            if (palyaKepekMain) {
                palyaKepekMain.addEventListener("touchstart", (event) => {
                    if (!event.touches || !event.touches.length) return;
                    touchStartX = event.touches[0].clientX;
                }, { passive: true });

                palyaKepekMain.addEventListener("touchend", (event) => {
                    if (touchStartX === null || !event.changedTouches || !event.changedTouches.length) return;
                    const endX = event.changedTouches[0].clientX;
                    const delta = endX - touchStartX;
                    touchStartX = null;

                    if (Math.abs(delta) < 40) return;
                    if (delta < 0) {
                        showNextImage();
                    } else {
                        showPrevImage();
                    }
                }, { passive: true });
            }

            document.addEventListener("fullscreenchange", updateFullscreenButtonState);
            updateFullscreenButtonState();

            if (palyaKepekModalElement) {
                palyaKepekModalElement.addEventListener("hidden.bs.modal", () => {
                    if (document.fullscreenElement) {
                        document.exitFullscreen?.();
                    }
                    activeGalleryImages = [];
                    activeGalleryIndex = 0;
                    updateFullscreenButtonState();
                });
            }

            document.addEventListener("keydown", (event) => {
                if (!palyaKepekModalElement || !palyaKepekModalElement.classList.contains("show")) return;
                if (event.key === "ArrowRight") {
                    event.preventDefault();
                    showNextImage();
                }
                if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    showPrevImage();
                }
                if (event.key === "f" || event.key === "F") {
                    event.preventDefault();
                    toggleFullscreen();
                }
            });

            function renderPalyak(palyak) {
                container.innerHTML = "";

                if (palyak.length === 0) {
                    container.innerHTML = '<div class="col-12"><p class="text-center text-body-secondary">Nincsenek találatok</p></div>';
                    return;
                }

                palyak.forEach((palya) => {
                    const imageUrls = parseImageUrls(palya.kep_url);
                    const primaryImage = toAbsoluteImageUrl(imageUrls[0] || "../palyanetlogo.png");
                    palyaImagesById[String(palya.palya_id)] = imageUrls;

                    let ownerImageUrl = palya.profil_kep_url;
                    if (ownerImageUrl && !ownerImageUrl.startsWith("http")) {
                        ownerImageUrl = `http://localhost:4000${ownerImageUrl}`;
                    }

                    const ownerAvatarUrl = ownerImageUrl
                        ? `<img src="${ownerImageUrl}" alt="${palya.teljes_nev}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; margin-right: 0.75rem;" />`
                        : `<div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--accent) 0%, var(--accent-soft) 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem; margin-right: 0.75rem;">👤</div>`;

                    const card = document.createElement("div");
                    card.className = "col-md-6 col-lg-4";
                    card.innerHTML = `
            <div class="card palya-card bg-body-tertiary border shadow-sm">
                            <img src="${primaryImage}" class="card-img-top" alt="${palya.nev}" style="height:200px; object-fit:cover;" />
              <div class="palya-info">
                <h5 class="card-title fw-bold">${palya.nev}</h5>
                <div class="palya-badge">
                  <span class="badge bg-primary">${palya.sportag}</span>
                </div>
                <p class="palya-meta">📍 ${palya.helyszin}</p>
                <p class="palya-meta">💰 ${palya.ar_ora} Ft / óra</p>
                <p class="palya-meta">🕒 Nyitás-zárás: ${formatTimeOnly(palya.nyitas)} - ${formatTimeOnly(palya.zaras)}</p>
                <div class="palya-owner" style="display: flex; align-items: center; justify-content: space-between;">
                  <div style="display: flex; align-items: center;">
                    ${ownerAvatarUrl}
                    <div>
                      <p class="mb-0 small text-muted" style="font-size: 0.8rem;">Tulajdonos</p>
                      <p class="mb-0 fw-semibold">${palya.teljes_nev || palya.username}</p>
                    </div>
                  </div>
                </div>
                <button class="btn btn-accent w-100 mt-3" onclick="openBookingModal('${palya.palya_id}', '${palya.nev}', '${palya.ar_ora}', '${palya.helyszin}', '${palya.sportag}', '${formatTimeOnly(palya.nyitas)}', '${formatTimeOnly(palya.zaras)}')">📅 Foglalás</button>
                                <button class="btn btn-outline-primary w-100 mt-2" onclick="openImagesModal('${palya.palya_id}')">🖼️ Képek megtekintése</button>
              </div>
            </div>
          `;
                    container.appendChild(card);
                });
            }

            // Pályák betöltése az API-ról
            async function loadPalyak(filters = {}) {
                try {
                    const params = new URLSearchParams();
                    if (filters.sportag) params.append("sportag", filters.sportag);
                    if (filters.maxar) params.append("maxar", filters.maxar);

                    const response = await fetch(`${API_URL}?${params}`);
                    let palyak = await response.json();

                    if (Array.isArray(filters.helyszinLista) && filters.helyszinLista.length > 0) {
                        const normalizedTargets = filters.helyszinLista.map(normalizeLocationText);
                        palyak = palyak.filter((palya) => {
                            const normalizedSource = normalizeLocationText(palya.helyszin);
                            return normalizedTargets.some((target) => {
                                if (target === "budapest") {
                                    return normalizedSource.includes("budapest") || isBudapestDistrict(normalizedSource);
                                }
                                return normalizedSource.includes(target);
                            });
                        });
                    }

                    renderPalyak(palyak);
                } catch (error) {
                    console.error("Pályák betöltési hiba:", error);
                    container.innerHTML = '<div class="col-12"><p class="text-center text-danger">Betöltési hiba</p></div>';
                }
            }

            function runSearch() {
                const selected = Array.from(selectedLocations);
                const filters = {
                    sportag: document.getElementById("sportag").value,
                    maxar: document.getElementById("maxar").value,
                    helyszinLista: selected,
                };

                loadPalyak(filters);
            }

            // Szűrő gomb
            document.getElementById("keresesBtn").addEventListener("click", runSearch);

            if (helyszinInput && helyszinModal) {
                helyszinInput.addEventListener("click", () => {
                    helyszinModal.show();
                });
            }

            const helyszinSzurokTorleseBtn = document.getElementById("helyszinSzurokTorleseBtn");
            if (helyszinSzurokTorleseBtn) {
                helyszinSzurokTorleseBtn.addEventListener("click", () => {
                    selectedLocations.clear();
                    syncLocationCheckboxes();
                    updateSelectedLocationSummary();
                });
            }

            const helyszinKeresesBtn = document.getElementById("helyszinKeresesBtn");
            if (helyszinKeresesBtn) {
                helyszinKeresesBtn.addEventListener("click", () => {
                    runSearch();
                    if (helyszinModal) helyszinModal.hide();
                });
            }

            // Új pálya hozzáadása
            const ujPalyaKuldBtn = document.getElementById("ujPalyaKuldBtn");
            if (ujPalyaKuldBtn)
                ujPalyaKuldBtn.addEventListener("click", async () => {
                    const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user"));

                    if (!user) {
                        showWarning("Bejelentkezés szükséges!");
                        window.location.href = "./bejelentkezes.html";
                        return;
                    }

                    console.log("User objektum:", user);

                    const formData = {
                        tulaj_id: user.felhasznalo_id || 1,
                        nev: document.getElementById("modalNev").value,
                        sportag: document.getElementById("modalSportag").value,
                        helyszin: document.getElementById("modalHelyszin").value,
                        ar_ora: parseInt(document.getElementById("modalAr").value),
                        leiras: document.getElementById("modalLeiras").value,
                        kep_url: document.getElementById("modalKepUrl").value,
                        nyitas: document.getElementById("modalNyitas").value,
                        zaras: document.getElementById("modalZaras").value,
                    };

                    console.log("Küldött adatok:", formData);

                    try {
                        const response = await fetch(API_URL, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(formData),
                        });

                        const responseData = await response.json();
                        console.log("API válasz:", responseData);

                        if (response.ok) {
                            showSuccess("Pálya sikeresen hozzáadva!");
                            document.getElementById("ujPalyaForm").reset();
                            bootstrap.Modal.getInstance(document.getElementById("ujPalyaModal")).hide();
                            loadPalyak();
                        } else {
                            showError("Hiba a pálya hozzáadásakor: " + (responseData.error || responseData.message || "Ismeretlen hiba"));
                        }
                    } catch (error) {
                        console.error("Hiba:", error);
                        showError("Szövegalkalmazás hiba: " + error.message);
                    }
                });

            // ===== NOTIFICATION SYSTEM =====
            function initNotifications() {
                const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user"));
                const notificationContainer = document.getElementById("notificationContainer");

                if (!user) {
                    return;
                }

                notificationContainer.style.display = "block";

                loadNotifications(user);
            }

            function loadNotifications(user) {
                loadRealNotifications(user);
            }

            async function loadRealNotifications(user) {
                try {
                    const userId = user.felhasznalo_id || user.id || user.userId;
                    if (!userId) throw new Error("Hianyzik a user ID");

                    const response = await fetch(`http://localhost:4000/api/notifications/${userId}`);
                    if (!response.ok) throw new Error("Ertesitesek lekerese sikertelen");

                    const notifications = await response.json();
                    const notificationsList = notifications.map((n) => ({
                        type: "system",
                        title: n.olvasott ? "Ertesites" : "Uj ertesites",
                        message: n.uzenet,
                        time: new Date(n.letrehozva).toLocaleString("hu-HU", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                        }),
                    }));

                    displayNotifications(notificationsList);
                } catch (error) {
                    console.error("Valodi ertesitesek betoltesi hiba:", error);
                    displayNotifications([]);
                }
            }
            function displayNotifications(notifications) {
                const dropdown = document.getElementById("notificationDropdown");
                const badge = document.getElementById("notificationBadge");

                if (notifications.length === 0) {
                    dropdown.innerHTML = '<div class="notification-empty">Nincsenek értesítések</div>';
                    badge.style.display = "none";
                    return;
                }

                badge.textContent = notifications.length;
                badge.style.display = "flex";

                dropdown.innerHTML = notifications
                    .map(
                        (notif) => `
          <div class="notification-item">
            <div class="notification-title">${notif.title}</div>
            <div class="notification-message">${notif.message}</div>
            <div class="notification-time">${notif.time}</div>
          </div>
        `,
                    )
                    .join("");
            }

            document.getElementById("notificationIcon").addEventListener("click", () => {
                const dropdown = document.getElementById("notificationDropdown");
                dropdown.classList.toggle("show");
            });

            document.addEventListener("click", (e) => {
                const notifContainer = document.getElementById("notificationContainer");
                const dropdown = document.getElementById("notificationDropdown");

                if (!notifContainer.contains(e.target) && dropdown.classList.contains("show")) {
                    dropdown.classList.remove("show");
                }
            });

            initNotifications();
            setInterval(initNotifications, 5000);

            // ===== BOOKING SYSTEM =====
            let currentPalyaId = null;
            let currentAr = null;
            let currentNyitas = "00:00";
            let currentZaras = "23:59";
            let currentPalyaNev = "";

            function timeToMinutes(timeText) {
                if (!timeText || !timeText.includes(":")) return null;
                const [h, m] = timeText.split(":").map(Number);
                if (Number.isNaN(h) || Number.isNaN(m)) return null;
                return h * 60 + m;
            }

            function isWithinOpening(kezdes, vege) {
                const start = timeToMinutes(kezdes);
                const end = timeToMinutes(vege);
                const open = timeToMinutes(currentNyitas);
                const close = timeToMinutes(currentZaras);
                if (start === null || end === null || open === null || close === null) return false;
                return start >= open && end <= close;
            }

            function minutesToTimeText(totalMinutes) {
                const h = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
                const m = String(totalMinutes % 60).padStart(2, "0");
                return `${h}:${m}`;
            }

            function populateTimeSelectOptions(openTime, closeTime) {
                const kezdesSelect = document.getElementById("foglalasKezdes");
                const vegeSelect = document.getElementById("foglalasVege");
                const open = timeToMinutes(openTime);
                const close = timeToMinutes(closeTime);

                kezdesSelect.innerHTML = '<option value="">Válassz időpontot</option>';
                vegeSelect.innerHTML = '<option value="">Válassz időpontot</option>';

                if (open === null || close === null || close <= open) return;

                // 5 perces lépéssel, 24 órás (00:00-23:59) formátumban
                for (let min = open; min <= close; min += 5) {
                    const t = minutesToTimeText(min);
                    kezdesSelect.insertAdjacentHTML("beforeend", `<option value="${t}">${t}</option>`);
                    vegeSelect.insertAdjacentHTML("beforeend", `<option value="${t}">${t}</option>`);
                }
            }

            function syncTimeSelectBounds() {
                const kezdesSelect = document.getElementById("foglalasKezdes");
                const vegeSelect = document.getElementById("foglalasVege");
                const kezdes = kezdesSelect.value;
                const vege = vegeSelect.value;
                const kezdesMin = timeToMinutes(kezdes);
                const vegeMin = timeToMinutes(vege);

                Array.from(vegeSelect.options).forEach((opt) => {
                    if (!opt.value) return;
                    const optMin = timeToMinutes(opt.value);
                    opt.disabled = kezdesMin !== null ? optMin <= kezdesMin : false;
                });

                Array.from(kezdesSelect.options).forEach((opt) => {
                    if (!opt.value) return;
                    const optMin = timeToMinutes(opt.value);
                    opt.disabled = vegeMin !== null ? optMin >= vegeMin : false;
                });

                if (kezdes && vegeMin !== null && kezdesMin !== null && kezdesMin >= vegeMin) {
                    vegeSelect.value = "";
                }
                if (vege && kezdesMin !== null && vegeMin !== null && vegeMin <= kezdesMin) {
                    kezdesSelect.value = "";
                }
            }

            function validateBookingTimeInputs() {
                const kezdesInput = document.getElementById("foglalasKezdes");
                const vegeInput = document.getElementById("foglalasVege");
                const kezdes = kezdesInput.value;
                const vege = vegeInput.value;

                kezdesInput.setCustomValidity("");
                vegeInput.setCustomValidity("");

                if (!kezdes || !vege) return true;

                if (!isWithinOpening(kezdes, vege)) {
                    const msg = `Csak a nyitvatartásban foglalhatsz: ${currentNyitas}-${currentZaras}`;
                    kezdesInput.setCustomValidity(msg);
                    vegeInput.setCustomValidity(msg);
                    return false;
                }

                if (timeToMinutes(vege) <= timeToMinutes(kezdes)) {
                    const msg = "A vég időpontnak később kell lennie, mint a kezdésnek.";
                    vegeInput.setCustomValidity(msg);
                    return false;
                }

                return true;
            }

            function getTodayDateText() {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, "0");
                const day = String(now.getDate()).padStart(2, "0");
                return `${year}-${month}-${day}`;
            }

            function validateBookingDateInput() {
                const datumInput = document.getElementById("foglalasDatum");
                const datum = datumInput.value;
                const todayText = getTodayDateText();

                datumInput.min = todayText;
                datumInput.setCustomValidity("");

                if (!datum) return true;
                if (datum < todayText) {
                    datumInput.setCustomValidity("Múltbeli dátumra nem lehet foglalni.");
                    return false;
                }

                return true;
            }

            function openBookingModal(palyaId, palyaNev, ar, helyszin, sportag, nyitas, zaras) {
                const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user"));

                if (!user) {
                    showWarning("Bejelentkezés szükséges!");
                    window.location.href = "./bejelentkezes.html";
                    return;
                }

                currentPalyaId = palyaId;
                currentPalyaNev = palyaNev || "";
                currentAr = parseInt(ar);
                const validTime = /^\d{2}:\d{2}$/;
                if (!validTime.test(nyitas || "") || !validTime.test(zaras || "")) {
                    showWarning("Ehhez a pályához nincs érvényes nyitás/zárás idő beállítva.");
                    return;
                }
                currentNyitas = nyitas;
                currentZaras = zaras;

                document.getElementById("palyaNev").textContent = palyaNev;
                document.getElementById("palyaDetails").textContent = `${sportag} • ${helyszin}`;
                document.getElementById("palyaArValue").textContent = ar;
                const old = document.getElementById("palyaNyitvaInfo");
                if (old) old.remove();
                document
                    .getElementById("palyaAr")
                    .insertAdjacentHTML(
                        "afterend",
                        `<p id="palyaNyitvaInfo" class="text-muted mb-3">Nyitás-zárás: ${currentNyitas} - ${currentZaras}</p>`,
                    );

                document.getElementById("foglalasForm").reset();
                const datumInput = document.getElementById("foglalasDatum");
                datumInput.min = getTodayDateText();
                validateBookingDateInput();
                document.getElementById("foglalasOsszeg").value = "";
                populateTimeSelectOptions(currentNyitas, currentZaras);
                syncTimeSelectBounds();

                const modal = new bootstrap.Modal(document.getElementById("foglalasModal"));
                modal.show();
            }

            const bejelentesModalOpenBtn = document.getElementById("bejelentesModalOpenBtn");
            if (bejelentesModalOpenBtn) {
                bejelentesModalOpenBtn.addEventListener("click", () => {
                    const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user"));
                    if (!user) {
                        showWarning("Bejelentkezés szükséges!");
                        window.location.href = "./bejelentkezes.html";
                        return;
                    }
                    if (!currentPalyaId) {
                        showWarning("Előbb válassz pályát.");
                        return;
                    }

                    const info = document.getElementById("bejelentesPalyaInfo");
                    const text = document.getElementById("bejelentesSzoveg");
                    if (info) info.textContent = `Pálya: ${currentPalyaNev || "-"}`;
                    if (text) text.value = "";

                    bootstrap.Modal.getOrCreateInstance(document.getElementById("bejelentesModal")).show();
                });
            }

            const bejelentesKuldBtn = document.getElementById("bejelentesKuldBtn");
            if (bejelentesKuldBtn) {
                bejelentesKuldBtn.addEventListener("click", async () => {
                    const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user"));
                    if (!user) {
                        showWarning("Bejelentkezés szükséges!");
                        window.location.href = "./bejelentkezes.html";
                        return;
                    }
                    if (!currentPalyaId) {
                        showWarning("Nincs kiválasztott pálya.");
                        return;
                    }

                    const szoveg = String(document.getElementById("bejelentesSzoveg").value || "").trim();
                    if (!szoveg) {
                        showWarning("A bejelentés szövege kötelező.");
                        return;
                    }

                    try {
                        const response = await fetch("http://localhost:4000/api/reports", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                kuldo_felhasznalo_id: user.felhasznalo_id,
                                palya_id: parseInt(currentPalyaId, 10),
                                szoveg: szoveg,
                            }),
                        });

                        const data = await response.json().catch(() => ({}));
                        if (!response.ok) {
                            throw new Error(data.message || "Bejelentés küldése sikertelen.");
                        }

                        showSuccess("A bejelentést rögzítettük.");
                        bootstrap.Modal.getOrCreateInstance(document.getElementById("bejelentesModal")).hide();
                    } catch (error) {
                        console.error(error);
                        showError(error.message || "Hiba a bejelentés küldésekor.");
                    }
                });
            }
            function calculatePrice() {
                const datum = document.getElementById("foglalasDatum").value;
                const kezdes = document.getElementById("foglalasKezdes").value;
                const vege = document.getElementById("foglalasVege").value;

                if (!datum || !kezdes || !vege) {
                    document.getElementById("foglalasOsszeg").value = "";
                    return;
                }

                if (!validateBookingDateInput()) {
                    document.getElementById("foglalasOsszeg").value = "Múltbeli dátumra nem lehet foglalni";
                    return;
                }

                if (!validateBookingTimeInputs()) {
                    document.getElementById("foglalasOsszeg").value = `Csak nyitvatartásban lehet: ${currentNyitas}-${currentZaras}`;
                    return;
                }

                const kezdesTime = new Date(`${datum}T${kezdes}`);
                const vegeTime = new Date(`${datum}T${vege}`);

                if (vegeTime <= kezdesTime) {
                    document.getElementById("foglalasOsszeg").value = "Hibás időintervallum";
                    return;
                }

                if (!isWithinOpening(kezdes, vege)) {
                    document.getElementById("foglalasOsszeg").value = `Csak nyitvatartásban lehet: ${currentNyitas}-${currentZaras}`;
                    return;
                }

                const hours = (vegeTime - kezdesTime) / (1000 * 60 * 60);
                const osszeg = Math.round(hours * currentAr);

                document.getElementById("foglalasOsszeg").value = `${osszeg} Ft (${hours} óra)`;
            }

            document.getElementById("foglalasDatum").addEventListener("change", () => {
                validateBookingDateInput();
                calculatePrice();
            });
            document.getElementById("foglalasKezdes").addEventListener("change", () => {
                syncTimeSelectBounds();
                calculatePrice();
            });
            document.getElementById("foglalasVege").addEventListener("change", () => {
                syncTimeSelectBounds();
                calculatePrice();
            });
            document.getElementById("foglalasKezdes").addEventListener("input", () => {
                syncTimeSelectBounds();
                calculatePrice();
            });
            document.getElementById("foglalasVege").addEventListener("input", () => {
                syncTimeSelectBounds();
                calculatePrice();
            });

            document.getElementById("foglalasKuldBtn").addEventListener("click", async () => {
                const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user"));

                if (!user) {
                    showWarning("Bejelentkezés szükséges!");
                    window.location.href = "./bejelentkezes.html";
                    return;
                }

                const datum = document.getElementById("foglalasDatum").value;
                const kezdes = document.getElementById("foglalasKezdes").value;
                const vege = document.getElementById("foglalasVege").value;

                if (!datum || !kezdes || !vege) {
                    showWarning("Kérjük, töltsön ki minden mezőt!");
                    return;
                }

                if (!validateBookingDateInput()) {
                    showWarning("Múltbeli napra nem lehet foglalni.");
                    return;
                }

                if (!validateBookingTimeInputs()) {
                    showWarning(`Csak a pálya nyitvatartásán belül foglalhatsz: ${currentNyitas}-${currentZaras}`);
                    return;
                }

                const kezdesDateTime = new Date(`${datum}T${kezdes}`);
                const vegeDateTime = new Date(`${datum}T${vege}`);

                if (vegeDateTime <= kezdesDateTime) {
                    showWarning("A vég időpontnak később kell lennie, mint a kezdésnek!");
                    return;
                }

                if (!isWithinOpening(kezdes, vege)) {
                    showWarning(`Csak a pálya nyitvatartásán belül foglalhatsz: ${currentNyitas}-${currentZaras}`);
                    return;
                }

                const hours = (vegeDateTime - kezdesDateTime) / (1000 * 60 * 60);
                const ar = hours > 0 ? Math.round(hours * currentAr) : 0;

                if (ar === 0 || isNaN(ar)) {
                    showWarning("Hiba az ár kalkulációban. Ellenőrizd a kezdés és vég időpontot!");
                    return;
                }

                try {
                    const response = await fetch("http://localhost:4000/api/bookings/create", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            palya_id: parseInt(currentPalyaId),
                            berlo_id: parseInt(user.felhasznalo_id),
                            kezdes: kezdesDateTime.toISOString(),
                            vege: vegeDateTime.toISOString(),
                            ar: parseInt(ar),
                        }),
                    });

                    const responseData = await response.json();

                    if (response.ok) {
                        showSuccess("Foglalási kérelem sikeresen elküldve! Az tulajdonos hamarosan megválaszolja.");
                        bootstrap.Modal.getInstance(document.getElementById("foglalasModal")).hide();
                        document.getElementById("foglalasForm").reset();
                    } else {
                        showError("Hiba a foglalás elküldésekor: " + (responseData.message || "Ismeretlen hiba"));
                    }
                } catch (error) {
                    console.error("Hiba:", error);
                    showError("Szövegalkalmazás hiba: " + error.message);
                }
            });

            // Kezdeti betöltés
            validateBookingDateInput();
            initHelyszinModal();
            loadPalyak();
        

