(() => {
  "use strict";

  const {
    get:    cacheGet,
    set:    cacheSet,
    TTL,
    memoize,
    sanitize,
    fetchMetar,
    fetchOpenMeteo,
    fetchFlights: sharedFetchFlights,
  } = window.OpenAeroCache;

  const FLIGHT_REGEX       = /^[A-Z0-9]{2,3}[0-9]{1,4}[A-Z]?$/i;
  const AVIATIONSTACK_KEY  = "2582c5cc9b95a3ce51c21525ff6a4063";
  const AVIATIONSTACK_BASE = "https://api.aviationstack.com/v1/flights";

  function createIconsIn(containerEl) {
    if (typeof lucide === "undefined") return;
    if (containerEl) {
      lucide.createIcons({ nameAttr: "data-lucide", attrs: {}, nodes: [containerEl] });
    } else {
      lucide.createIcons();
    }
  }

  const weatherCodeToCondition = memoize((code) => {
    if (code === 0)   return { label: "Clear",         icon: "sun" };
    if (code <= 3)    return { label: "Partly Cloudy", icon: "cloud-sun" };
    if (code <= 49)   return { label: "Fog / Haze",    icon: "cloud" };
    if (code <= 67)   return { label: "Rain",           icon: "cloud-rain" };
    if (code <= 77)   return { label: "Snow",           icon: "snowflake" };
    if (code <= 82)   return { label: "Showers",        icon: "cloud-drizzle" };
    if (code <= 99)   return { label: "Thunderstorm",   icon: "cloud-lightning" };
    return { label: "Unknown", icon: "cloud" };
  });

  const windDirToCardinal = memoize((deg) => {
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return dirs[Math.round(deg / 45) % 8];
  });

  const DEMO_DATA = [
    {
      flight: { iata: "SQ322", number: "322" },
      flight_status: "active",
      airline: { name: "Singapore Airlines", iata: "SQ" },
      departure: {
        iata: "SIN", airport: "Singapore Changi Airport",
        scheduled: "2025-06-01T00:35:00+08:00",
        actual: "2025-06-01T00:41:00+08:00",
        terminal: "3", gate: "C28", delay: 6,
      },
      arrival: {
        iata: "LHR", airport: "London Heathrow Airport",
        scheduled: "2025-06-01T07:20:00+01:00",
        estimated: "2025-06-01T07:30:00+01:00",
        terminal: "2", gate: "B30",
      },
      aircraft: { registration: "9V-SMC", iata: "77W" },
    },
    {
      flight: { iata: "SQ326", number: "326" },
      flight_status: "scheduled",
      airline: { name: "Singapore Airlines", iata: "SQ" },
      departure: {
        iata: "SIN", airport: "Singapore Changi Airport",
        scheduled: "2025-06-02T01:05:00+08:00",
        terminal: "3", gate: "D41", delay: null,
      },
      arrival: {
        iata: "LHR", airport: "London Heathrow Airport",
        scheduled: "2025-06-02T07:50:00+01:00",
        terminal: "2", gate: null,
      },
      aircraft: { registration: "9V-SMF", iata: "77W" },
    },
  ];

  async function fetchFlights(flightNumber) {
    if (AVIATIONSTACK_KEY === "YOUR_AVIATIONSTACK_API_KEY") {
      const cacheKey = `flight:${flightNumber}`;
      const cached = cacheGet(cacheKey);
      if (cached !== undefined) return cached;
      await new Promise(r => setTimeout(r, 1000));
      const lower   = flightNumber.toLowerCase();
      const matches = DEMO_DATA.filter(f =>
        f.flight.iata.toLowerCase().includes(lower) ||
        f.airline.iata.toLowerCase() === lower.slice(0, 2)
      );
      const result = matches.length ? matches : [];
      cacheSet(cacheKey, result, TTL.flight);
      return result;
    }
    return sharedFetchFlights(flightNumber, AVIATIONSTACK_KEY, AVIATIONSTACK_BASE);
  }

  const el   = (id) => document.getElementById(id);
  const show = (id) => el(id).classList.remove("hidden");
  const hide = (id) => el(id).classList.add("hidden");

  function formatTime(iso) {
    if (!iso) return "N/A";
    try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }); }
    catch { return "N/A"; }
  }

  function formatDate(iso) {
    if (!iso) return "N/A";
    try { return new Date(iso).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" }); }
    catch { return "N/A"; }
  }

  function updateLiveRegion(msg) {
    const r = el("results-live-region");
    r.textContent = "";
    requestAnimationFrame(() => { r.textContent = msg; });
  }

  function normalizeStatus(raw) {
    if (!raw) return "unknown";
    const map = { active: "active", landed: "landed", scheduled: "scheduled", cancelled: "cancelled", incident: "cancelled", diverted: "delayed" };
    return map[raw.toLowerCase()] || "unknown";
  }

  function statusLabel(s) {
    return { active: "En Route", landed: "Landed", scheduled: "Scheduled", cancelled: "Cancelled", delayed: "Delayed", unknown: "Unknown" }[s] || "Unknown";
  }

  function buildStatusBadge(status) {
    return `<span class="status-badge status-${sanitize(status)}">${sanitize(statusLabel(status))}</span>`;
  }

  function validateInput(raw) {
    const value = raw.trim().toUpperCase();
    if (!value) return { valid: false, error: "Please enter a flight number.", value: "" };
    if (!FLIGHT_REGEX.test(value)) return { valid: false, error: "Invalid format. Use airline code + number, e.g. SQ322.", value: "" };
    if (value.length < 3) return { valid: false, error: "Flight number too short.", value: "" };
    return { valid: true, error: null, value };
  }

  function showInputError(msg) {
    el("error-msg").textContent = msg;
    el("input-error").classList.remove("hidden");
  }

  function clearInputError() {
    el("input-error").classList.add("hidden");
    el("error-msg").textContent = "";
  }

  function synthesizeMetarString(iata, meteo) {
    if (!meteo?.current) return null;
    const cur  = meteo.current;
    const now  = new Date();
    const time = `${String(now.getUTCDate()).padStart(2,"0")}${String(now.getUTCHours()).padStart(2,"0")}${String(now.getUTCMinutes()).padStart(2,"0")}Z`;

    const windDeg = cur.wind_direction_10m != null ? String(Math.round(cur.wind_direction_10m)).padStart(3, "0") : "000";
    const windKt  = cur.wind_speed_10m     != null ? String(Math.round(cur.wind_speed_10m)).padStart(2,  "0")   : "00";
    const visM    = cur.visibility != null ? Math.min(Math.round(cur.visibility / 100) * 100, 9999) : 9999;
    const code    = cur.weather_code ?? 0;

    let wxStr = "";
    if (code >= 95)      wxStr = "TS ";
    else if (code >= 80) wxStr = "SHRA ";
    else if (code >= 71) wxStr = "SN ";
    else if (code >= 61) wxStr = "RA ";
    else if (code >= 51) wxStr = "DZ ";
    else if (code >= 45) wxStr = "FG ";

    let cloudStr = "SKC";
    if (code >= 3)      cloudStr = "BKN025";
    else if (code >= 2) cloudStr = "SCT020";
    else if (code >= 1) cloudStr = "FEW010";

    const tempC   = cur.temperature_2m != null ? Math.round(cur.temperature_2m) : 0;
    const tempStr = tempC < 0 ? `M${String(Math.abs(tempC)).padStart(2,"0")}` : String(tempC).padStart(2,"0");
    const dp      = cur.relative_humidity_2m != null ? Math.round(tempC - ((100 - cur.relative_humidity_2m) / 5)) : tempC - 5;
    const dpStr   = dp < 0 ? `M${String(Math.abs(dp)).padStart(2,"0")}` : String(dp).padStart(2,"0");

    return `${iata} ${time} ${windDeg}${windKt}KT ${visM >= 9999 ? "9999" : String(visM).padStart(4,"0")} ${wxStr}${cloudStr} ${tempStr}/${dpStr} Q${Math.round(1013 + (tempC < 15 ? 2 : -1))} (SYNTH)`;
  }

  async function buildWeatherCard(iata, role) {
    const [metar, meteo] = await Promise.all([fetchMetar(iata), fetchOpenMeteo(iata)]);
    const cur       = meteo?.current || {};
    const temp      = cur.temperature_2m       != null ? `${Math.round(cur.temperature_2m)}°C` : "N/A";
    const windSpd   = cur.wind_speed_10m       != null ? `${Math.round(cur.wind_speed_10m)} kt` : "N/A";
    const windDir   = cur.wind_direction_10m   != null ? windDirToCardinal(cur.wind_direction_10m) : "";
    const humidity  = cur.relative_humidity_2m != null ? `${cur.relative_humidity_2m}%` : "N/A";
    const vis       = cur.visibility           != null ? `${(cur.visibility / 1000).toFixed(1)} km` : "N/A";
    const condition = cur.weather_code         != null ? weatherCodeToCondition(cur.weather_code) : { label: "N/A", icon: "cloud" };
    const metarRaw     = metar?.rawOb || metar?.raw_text || synthesizeMetarString(iata, meteo) || null;
    const metarIsSynth = !metar?.rawOb && !metar?.raw_text && metarRaw != null;

    return `
      <div class="weather-card">
        <div class="weather-card-header">
          <div>
            <div class="weather-airport-iata">${sanitize(iata)}</div>
            <div class="weather-airport-role">${sanitize(meteo?.airportName || iata)} &mdash; ${sanitize(role)}</div>
          </div>
          <div class="weather-icon-wrap" aria-hidden="true"><i data-lucide="${sanitize(condition.icon)}" class="w-5 h-5"></i></div>
        </div>
        <div class="weather-stats-grid">
          <div class="weather-stat"><div class="weather-stat-label">Temp</div><div class="weather-stat-value highlight">${temp}</div></div>
          <div class="weather-stat"><div class="weather-stat-label">Wind</div><div class="weather-stat-value">${windSpd} ${windDir}</div></div>
          <div class="weather-stat"><div class="weather-stat-label">Humidity</div><div class="weather-stat-value">${humidity}</div></div>
          <div class="weather-stat"><div class="weather-stat-label">Visibility</div><div class="weather-stat-value">${vis}</div></div>
          <div class="weather-stat" style="grid-column:span 2"><div class="weather-stat-label">Condition</div><div class="weather-stat-value">${sanitize(condition.label)}</div></div>
        </div>
        ${metarRaw ? `
        <div class="weather-metar-block">
          <div class="flex items-center justify-between mb-1">
            <div class="metar-label">${metarIsSynth ? "METAR (Synthesized)" : "METAR Report"}</div>
            <button class="copy-metar-btn" data-metar="${sanitize(metarRaw)}" title="Copy METAR"><i data-lucide="copy" class="w-3 h-3"></i></button>
          </div>
          <div class="metar-string">${sanitize(metarRaw)}</div>
          ${metarIsSynth ? `<div style="font-size:0.65rem;color:var(--text-muted,#888);margin-top:4px;opacity:0.75">Derived from Open-Meteo · Not suitable for navigation</div>` : ""}
        </div>` : `<div class="weather-error">No METAR data available for ${sanitize(iata)}</div>`}
      </div>`;
  }

  async function renderWeather(depIata, arrIata) {
    show("weather-section");
    show("weather-loading");
    el("weather-grid").innerHTML = "";
    const [depCard, arrCard] = await Promise.all([
      buildWeatherCard(depIata, "Departure"),
      buildWeatherCard(arrIata, "Arrival"),
    ]);
    hide("weather-loading");
    const grid = el("weather-grid");
    grid.innerHTML = depCard + arrCard;
    createIconsIn(grid);
  }

  let leafletMap = null;
  let mapLayers  = [];

  function getCoords(iata, flight) {
    const dep = flight.departure || {};
    const arr = flight.arrival   || {};
    if (dep.iata === iata && dep.latitude && dep.longitude) return { lat: dep.latitude, lon: dep.longitude };
    if (arr.iata === iata && arr.latitude && arr.longitude) return { lat: arr.latitude, lon: arr.longitude };
    return null;
  }

  function makeSvgIcon(color, size = 14) {
    return L.divIcon({
      className: "",
      html: `<svg width="${size}" height="${size}" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" fill="${color}" stroke="rgba(6,13,31,0.9)" stroke-width="2"/><circle cx="7" cy="7" r="2" fill="white" opacity="0.9"/></svg>`,
      iconSize: [size, size], iconAnchor: [size/2, size/2], popupAnchor: [0, -(size/2+4)],
    });
  }

  function initMap() {
    if (leafletMap) return;
    leafletMap = L.map("flight-map", { zoomControl: true, attributionControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer" target="_blank">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(leafletMap);
    leafletMap.setView([20, 0], 2);
  }

  function clearMapLayers() {
    for (const layer of mapLayers) {
      if (leafletMap && leafletMap.hasLayer(layer)) leafletMap.removeLayer(layer);
    }
    mapLayers = [];
  }

  function renderMap(flight) {
    const dep = flight.departure || {};
    const arr = flight.arrival   || {};
    const depCoords = getCoords(dep.iata, flight);
    const arrCoords = getCoords(arr.iata, flight);
    if (!depCoords || !arrCoords) { hide("map-section"); return; }
    show("map-section"); show("map-legend");
    if (!leafletMap) initMap();
    clearMapLayers();
    const depLL = [depCoords.lat, depCoords.lon];
    const arrLL = [arrCoords.lat, arrCoords.lon];
    mapLayers.push(
      L.polyline([depLL, arrLL], { color: "#22d3ee", weight: 2, opacity: 0.7, dashArray: "8, 6" }).addTo(leafletMap),
      L.marker(depLL, { icon: makeSvgIcon("#22d3ee", 16) }).addTo(leafletMap)
        .bindPopup(`<div class="map-popup-iata">${sanitize(dep.iata||"??")}</div><div class="map-popup-name">${sanitize(dep.airport||"")}</div><div class="map-popup-time">DEP ${sanitize(formatTime(dep.scheduled))}</div>`),
      L.marker(arrLL, { icon: makeSvgIcon("#818cf8", 16) }).addTo(leafletMap)
        .bindPopup(`<div class="map-popup-iata">${sanitize(arr.iata||"??")}</div><div class="map-popup-name">${sanitize(arr.airport||"")}</div><div class="map-popup-time">ARR ${sanitize(formatTime(arr.scheduled))}</div>`),
    );
    leafletMap.fitBounds(L.latLngBounds([depLL, arrLL]), { padding: [60, 60], maxZoom: 7 });
    setTimeout(() => { if (leafletMap) leafletMap.invalidateSize(); }, 300);
  }

  function buildResultCard(flight, index) {
    const status  = normalizeStatus(flight.flight_status);
    const dep     = flight.departure || {};
    const arr     = flight.arrival   || {};
    const iata    = sanitize(flight.flight?.iata || "N/A");
    const airline = sanitize(flight.airline?.name || "Unknown");
    const depIata = sanitize(dep.iata || "???");
    const arrIata = sanitize(arr.iata || "???");

    return `
      <article class="result-card" role="listitem" tabindex="0"
        aria-label="${iata} from ${depIata} to ${arrIata}, status: ${sanitize(statusLabel(status))}"
        data-index="${index}">
        <div class="card-header"><span class="flight-badge">${iata}</span>${buildStatusBadge(status)}</div>
        <div class="route-row">
          <div><div class="airport-code">${depIata}</div><div class="airport-name">${sanitize(dep.airport||"")}</div></div>
          <div class="route-arrow" aria-hidden="true">
            <div class="route-line"></div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </div>
          <div><div class="airport-code">${arrIata}</div><div class="airport-name">${sanitize(arr.airport||"")}</div></div>
        </div>
        <div class="card-footer">
          <span>${airline}</span>
          <span>${sanitize(formatDate(dep.scheduled))} &middot; ${sanitize(formatTime(dep.scheduled))}</span>
          <span class="card-cta">Details <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
        </div>
      </article>`;
  }

  function buildDetailCard(flight) {
    const status  = normalizeStatus(flight.flight_status);
    const dep     = flight.departure || {};
    const arr     = flight.arrival   || {};
    const ac      = flight.aircraft  || {};
    const iata    = sanitize(flight.flight?.iata || "N/A");
    const airline = sanitize(flight.airline?.name || "Unknown");

    return `
      <div class="detail-route-bar">
        <div class="detail-airport"><div class="detail-iata">${sanitize(dep.iata||"???")}</div><div class="detail-city">${sanitize(dep.airport||"")}</div></div>
        <div class="detail-arrow" aria-hidden="true">
          <div class="detail-flight-num">${iata}</div><div class="detail-arrow-line"></div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--cyan);opacity:0.6"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </div>
        <div class="detail-airport" style="text-align:right"><div class="detail-iata">${sanitize(arr.iata||"???")}</div><div class="detail-city">${sanitize(arr.airport||"")}</div></div>
      </div>
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div><div class="detail-label">Airline</div><div class="detail-value">${airline}</div></div>
        <div>${buildStatusBadge(status)}</div>
      </div>
      <div class="detail-grid">
        <div class="detail-block"><div class="detail-label">Departure — Scheduled</div><div class="detail-value large">${sanitize(formatTime(dep.scheduled))}</div><div class="detail-label mt-2">Date</div><div class="detail-value">${sanitize(formatDate(dep.scheduled))}</div></div>
        <div class="detail-block"><div class="detail-label">Arrival — Scheduled</div><div class="detail-value large">${sanitize(formatTime(arr.scheduled))}</div><div class="detail-label mt-2">Date</div><div class="detail-value">${sanitize(formatDate(arr.scheduled))}</div></div>
        <div class="detail-block">
          <div class="detail-label">Departure Terminal</div><div class="detail-value">${dep.terminal ? sanitize(dep.terminal) : "N/A"}</div>
          <div class="detail-label mt-2">Gate</div><div class="detail-value">${dep.gate ? sanitize(dep.gate) : "N/A"}</div>
          ${dep.delay ? `<div class="detail-label mt-2">Delay</div><div class="detail-value" style="color:#fdba74">+${sanitize(String(dep.delay))} min</div>` : ""}
        </div>
        <div class="detail-block">
          <div class="detail-label">Arrival Terminal</div><div class="detail-value">${arr.terminal ? sanitize(arr.terminal) : "N/A"}</div>
          <div class="detail-label mt-2">Gate</div><div class="detail-value">${arr.gate ? sanitize(arr.gate) : "N/A"}</div>
        </div>
        ${dep.actual    ? `<div class="detail-block"><div class="detail-label">Actual Departure</div><div class="detail-value">${sanitize(formatTime(dep.actual))}</div></div>` : ""}
        ${arr.estimated ? `<div class="detail-block"><div class="detail-label">Estimated Arrival</div><div class="detail-value">${sanitize(formatTime(arr.estimated))}</div></div>` : ""}
        ${(ac.registration || ac.iata) ? `
        <div class="detail-block">
          <div class="detail-label">Aircraft</div><div class="detail-value">${sanitize(ac.iata||"N/A")}</div>
          ${ac.registration ? `<div class="detail-label mt-2">Registration</div><div class="detail-value">${sanitize(ac.registration)}</div>` : ""}
        </div>` : ""}
      </div>`;
  }

  let currentResults = [];

  function renderResults(flights) {
    const grid = el("results-grid");
    grid.innerHTML = flights.map((f, i) => buildResultCard(f, i)).join("");
    el("results-count").textContent = `(${flights.length})`;
    show("results-section");
    grid.querySelectorAll(".result-card").forEach(card => {
      card.addEventListener("click",   () => openDetail(Number(card.dataset.index)));
      card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetail(Number(card.dataset.index)); } });
    });
  }

  function openDetail(index) {
    const flight = currentResults[index];
    if (!flight) return;
    const detailCard = el("detail-card");
    detailCard.innerHTML = buildDetailCard(flight);
    createIconsIn(detailCard);
    hide("results-section"); show("detail-section");
    el("detail-section").scrollIntoView({ behavior: "smooth", block: "start" });
    updateLiveRegion(`Showing detail for flight ${flight.flight?.iata || ""}`);
  }

  function updateAvgeekLinks(flightNumber) {
    const enc = encodeURIComponent(flightNumber);
    el("link-fr24").href  = `https://www.flightradar24.com/data/flights/${enc}`;
    el("link-fa").href    = `https://www.flightaware.com/live/flight/${enc}`;
    el("link-ps").href    = `https://www.planespotters.net/search?q=${enc}`;
    el("link-latc").href  = `https://www.liveatc.net/search/?icao=${enc}`;
    el("link-sv").href    = `https://skyvector.com/?ll=20,0&chart=301&zoom=3`;
  }

  function resetAvgeekLinks() {
    el("link-fr24").href  = "https://www.flightradar24.com";
    el("link-fa").href    = "https://www.flightaware.com";
    el("link-ps").href    = "https://www.planespotters.net";
    el("link-latc").href  = "https://www.liveatc.net";
    el("link-sv").href    = "https://skyvector.com";
  }

  async function handleSearch() {
    clearInputError();
    const { valid, error, value } = validateInput(el("flight-input").value);
    if (!valid) { showInputError(error); el("flight-input").focus(); return; }

    hide("results-section"); hide("detail-section"); hide("empty-section");
    hide("map-section"); hide("weather-section");
    show("loading-section");
    el("search-btn").disabled = true;
    updateLiveRegion("Searching for flight data...");

    try {
      const flights = await fetchFlights(value);
      hide("loading-section");
      el("search-btn").disabled = false;

      if (!flights.length) {
        show("empty-section"); updateLiveRegion("No flights found."); resetAvgeekLinks(); return;
      }

      currentResults = flights;
      renderResults(flights);
      updateAvgeekLinks(value);
      updateLiveRegion(`Found ${flights.length} result${flights.length > 1 ? "s" : ""} for ${value}.`);

      const primary = flights[0];
      const depCode = primary.departure?.icao || primary.departure?.iata;
      const arrCode = primary.arrival?.icao   || primary.arrival?.iata;
      renderMap(primary);
      if (depCode && arrCode) renderWeather(depCode, arrCode);

    } catch (err) {
      hide("loading-section");
      el("search-btn").disabled = false;
      showInputError("Could not retrieve flight data. Please try again later.");
      updateLiveRegion("Error retrieving flight data.");
      console.error("[OpenAero]", err);
    }
  }

  function initSearch() {
    el("search-btn").addEventListener("click", handleSearch);
    el("flight-input").addEventListener("keydown", e => { if (e.key === "Enter") handleSearch(); });
    el("flight-input").addEventListener("input", clearInputError);
    el("clear-results").addEventListener("click", () => {
      hide("results-section"); hide("map-section"); hide("weather-section");
      el("results-grid").innerHTML = ""; el("weather-grid").innerHTML = "";
      currentResults = []; resetAvgeekLinks(); clearMapLayers();
      el("flight-input").value = ""; el("flight-input").focus();
      updateLiveRegion("Results cleared.");
    });
    el("back-btn").addEventListener("click", () => {
      hide("detail-section"); show("results-section");
      el("results-section").scrollIntoView({ behavior: "smooth", block: "start" });
      updateLiveRegion("Back to results.");
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    document.getElementById("app-body")?.setAttribute("data-theme", theme);
    try { localStorage.setItem("openaero-theme", theme); } catch (_) {}
  }

  function initTheme() {
    let stored = "dark";
    try { stored = localStorage.getItem("openaero-theme") || "dark"; } catch (_) {}
    applyTheme(stored);
    el("theme-toggle")?.addEventListener("click", () => {
      applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
    window.addEventListener("storage", e => {
      if (e.key === "openaero-theme") applyTheme(e.newValue || "dark");
    });
  }

  function initWeatherActions() {
    el("weather-grid").addEventListener("click", async (e) => {
      const btn = e.target.closest(".copy-metar-btn");
      if (!btn) return;
      try {
        await navigator.clipboard.writeText(btn.dataset.metar);
        const original = btn.innerHTML;
        btn.innerHTML = `<i data-lucide="check" class="w-3 h-3 text-cyan-400"></i>`;
        createIconsIn(btn);
        setTimeout(() => { btn.innerHTML = original; createIconsIn(btn); }, 2000);
      } catch (err) { console.error("Failed to copy METAR:", err); }
    });
  }

  function init() {
    initTheme();
    initSearch();
    initWeatherActions();
    createIconsIn(null);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
