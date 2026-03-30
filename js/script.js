(() => {
  "use strict";

  /* ════════════════════════════════════════
     CONFIG
  ════════════════════════════════════════ */
  const FLIGHT_REGEX = /^[A-Z0-9]{2,3}[0-9]{1,4}[A-Z]?$/i;
  const AVIATIONSTACK_KEY = "2582c5cc9b95a3ce51c21525ff6a4063";
  const AVIATIONSTACK_BASE = "https://api.aviationstack.com/v1/flights";

  /* Open-Meteo: free, no key needed */
  const OPENMETEO_BASE = "https://api.open-meteo.com/v1/forecast";

  /* Aviation Weather Center METAR: free CORS-friendly endpoint */
  const AWC_METAR_BASE = "https://aviationweather.gov/api/data/metar";

  /* ════════════════════════════════════════
     AIRPORT COORDINATE LOOKUP
     (subset of major airports for demo / fallback)
  ════════════════════════════════════════ */
  const AIRPORT_COORDS = {
    SIN: { lat: 1.3644,   lon: 103.9915, name: "Singapore Changi" },
    LHR: { lat: 51.4775,  lon: -0.4614,  name: "London Heathrow" },
    JFK: { lat: 40.6413,  lon: -73.7781, name: "New York JFK" },
    LAX: { lat: 33.9425,  lon: -118.4081,name: "Los Angeles" },
    DXB: { lat: 25.2532,  lon: 55.3657,  name: "Dubai Intl" },
    SYD: { lat: -33.9461, lon: 151.1772, name: "Sydney Kingsford Smith" },
    CDG: { lat: 49.0097,  lon: 2.5479,   name: "Paris Charles de Gaulle" },
    AMS: { lat: 52.3086,  lon: 4.7639,   name: "Amsterdam Schiphol" },
    FRA: { lat: 50.0379,  lon: 8.5622,   name: "Frankfurt" },
    NRT: { lat: 35.7647,  lon: 140.3864, name: "Tokyo Narita" },
    HND: { lat: 35.5494,  lon: 139.7798, name: "Tokyo Haneda" },
    ICN: { lat: 37.4602,  lon: 126.4407, name: "Seoul Incheon" },
    PEK: { lat: 40.0799,  lon: 116.6031, name: "Beijing Capital" },
    PVG: { lat: 31.1443,  lon: 121.8083, name: "Shanghai Pudong" },
    HKG: { lat: 22.3080,  lon: 113.9185, name: "Hong Kong Intl" },
    BKK: { lat: 13.6811,  lon: 100.7470, name: "Bangkok Suvarnabhumi" },
    KUL: { lat: 2.7456,   lon: 101.7099, name: "Kuala Lumpur Intl" },
    CGK: { lat: -6.1256,  lon: 106.6559, name: "Jakarta Soekarno-Hatta" },
    MNL: { lat: 14.5086,  lon: 121.0197, name: "Manila Ninoy Aquino" },
    DEL: { lat: 28.5562,  lon: 77.1000,  name: "New Delhi Indira Gandhi" },
    BOM: { lat: 19.0896,  lon: 72.8656,  name: "Mumbai Chhatrapati Shivaji" },
    DFW: { lat: 32.8998,  lon: -97.0403, name: "Dallas Fort Worth" },
    ORD: { lat: 41.9742,  lon: -87.9073, name: "Chicago O'Hare" },
    ATL: { lat: 33.6407,  lon: -84.4277, name: "Atlanta Hartsfield" },
    MIA: { lat: 25.7959,  lon: -80.2870, name: "Miami Intl" },
    GRU: { lat: -23.4356, lon: -46.4731, name: "Sao Paulo Guarulhos" },
    MEX: { lat: 19.4363,  lon: -99.0721, name: "Mexico City Intl" },
    MAD: { lat: 40.4936,  lon: -3.5668,  name: "Madrid Barajas" },
    BCN: { lat: 41.2974,  lon: 2.0833,   name: "Barcelona El Prat" },
    FCO: { lat: 41.8003,  lon: 12.2389,  name: "Rome Fiumicino" },
    MXP: { lat: 45.6306,  lon: 8.7281,   name: "Milan Malpensa" },
    ZRH: { lat: 47.4647,  lon: 8.5492,   name: "Zurich" },
    VIE: { lat: 48.1103,  lon: 16.5697,  name: "Vienna Intl" },
    IST: { lat: 41.2753,  lon: 28.7519,  name: "Istanbul Ataturk" },
    DOH: { lat: 25.2731,  lon: 51.6080,  name: "Doha Hamad" },
    AUH: { lat: 24.4330,  lon: 54.6511,  name: "Abu Dhabi Intl" },
    CAI: { lat: 30.1219,  lon: 31.4056,  name: "Cairo Intl" },
    JNB: { lat: -26.1392, lon: 28.2460,  name: "Johannesburg OR Tambo" },
    NBO: { lat: -1.3192,  lon: 36.9275,  name: "Nairobi Jomo Kenyatta" },
    MEL: { lat: -37.6690, lon: 144.8410, name: "Melbourne Tullamarine" },
    AKL: { lat: -37.0082, lon: 174.7850, name: "Auckland Intl" },
  };

  /* ════════════════════════════════════════
     DEMO FLIGHT DATA (used when no API key)
  ════════════════════════════════════════ */
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

  /* ════════════════════════════════════════
     DOM HELPERS
  ════════════════════════════════════════ */
  const el   = (id) => document.getElementById(id);
  const show = (id) => el(id).classList.remove("hidden");
  const hide = (id) => el(id).classList.add("hidden");

  function sanitize(str) {
    const div = document.createElement("div");
    div.textContent = (str == null) ? "" : String(str);
    return div.innerHTML;
  }

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

  /* ════════════════════════════════════════
     FLIGHT STATUS HELPERS
  ════════════════════════════════════════ */
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

  /* ════════════════════════════════════════
     INPUT VALIDATION
  ════════════════════════════════════════ */
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

  /* ════════════════════════════════════════
     FLIGHT API
  ════════════════════════════════════════ */
  async function fetchFlights(flightNumber) {
    if (AVIATIONSTACK_KEY === "YOUR_AVIATIONSTACK_API_KEY") {
      await new Promise(r => setTimeout(r, 1000));
      const lower = flightNumber.toLowerCase();
      const matches = DEMO_DATA.filter(f =>
        f.flight.iata.toLowerCase().includes(lower) ||
        f.airline.iata.toLowerCase() === lower.slice(0, 2)
      );
      return matches.length ? matches : [];
    }
    const params = new URLSearchParams({ access_key: AVIATIONSTACK_KEY, flight_iata: encodeURIComponent(flightNumber) });
    const resp = await fetch(`${AVIATIONSTACK_BASE}?${params}`);
    if (!resp.ok) throw new Error(`API error ${resp.status}`);
    const data = await resp.json();
    if (data.error) throw new Error(data.error.message || "API error");
    return Array.isArray(data.data) ? data.data : [];
  }

  /* ════════════════════════════════════════
     METAR API  (Aviation Weather Center, free, no key)
  ════════════════════════════════════════ */
  async function fetchMetar(icaoOrIata) {
    try {
      const url = `${AWC_METAR_BASE}?ids=${encodeURIComponent(icaoOrIata)}&format=json&hours=1`;
      const resp = await fetch(url);
      if (!resp.ok) return null;
      const data = await resp.json();
      return Array.isArray(data) && data.length ? data[0] : null;
    } catch {
      return null;
    }
  }

  /* ════════════════════════════════════════
     OPEN-METEO WEATHER API  (free, no key)
  ════════════════════════════════════════ */
  async function fetchOpenMeteo(lat, lon) {
    try {
      const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: "temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,visibility",
        wind_speed_unit: "kn",
        forecast_days: "1",
      });
      const resp = await fetch(`${OPENMETEO_BASE}?${params}`);
      if (!resp.ok) return null;
      return await resp.json();
    } catch {
      return null;
    }
  }

  function weatherCodeToCondition(code) {
    if (code === 0) return { label: "Clear", icon: "sun" };
    if (code <= 3) return { label: "Partly Cloudy", icon: "cloud-sun" };
    if (code <= 49) return { label: "Fog / Haze", icon: "cloud" };
    if (code <= 67) return { label: "Rain", icon: "cloud-rain" };
    if (code <= 77) return { label: "Snow", icon: "snowflake" };
    if (code <= 82) return { label: "Showers", icon: "cloud-drizzle" };
    if (code <= 99) return { label: "Thunderstorm", icon: "cloud-lightning" };
    return { label: "Unknown", icon: "cloud" };
  }

  function windDirToCardinal(deg) {
    const dirs = ["N","NE","E","SE","S","SW","W","NW"];
    return dirs[Math.round(deg / 45) % 8];
  }

  /* ════════════════════════════════════════
     WEATHER PANEL BUILDER
  ════════════════════════════════════════ */
  async function buildWeatherCard(iata, role) {
    const coords = AIRPORT_COORDS[iata];
    const metarPromise = fetchMetar(iata);
    const meteoPromise = coords ? fetchOpenMeteo(coords.lat, coords.lon) : Promise.resolve(null);

    const [metar, meteo] = await Promise.all([metarPromise, meteoPromise]);

    const cur = meteo?.current || {};
    const temp = cur.temperature_2m != null ? `${Math.round(cur.temperature_2m)}&deg;C` : "N/A";
    const windSpd = cur.wind_speed_10m != null ? `${Math.round(cur.wind_speed_10m)} kt` : "N/A";
    const windDir = cur.wind_direction_10m != null ? `${windDirToCardinal(cur.wind_direction_10m)}` : "";
    const humidity = cur.relative_humidity_2m != null ? `${cur.relative_humidity_2m}%` : "N/A";
    const visRaw = cur.visibility;
    const vis = visRaw != null ? `${(visRaw / 1000).toFixed(1)} km` : "N/A";
    const condition = cur.weather_code != null ? weatherCodeToCondition(cur.weather_code) : { label: "N/A", icon: "cloud" };

    const metarRaw = metar?.rawOb || metar?.raw_text || null;
    const airportName = sanitize(coords?.name || iata);

    return `
      <div class="weather-card">
        <div class="weather-card-header">
          <div>
            <div class="weather-airport-iata">${sanitize(iata)}</div>
            <div class="weather-airport-role">${sanitize(airportName)} &mdash; ${sanitize(role)}</div>
          </div>
          <div class="weather-icon-wrap" aria-hidden="true">
            <i data-lucide="${sanitize(condition.icon)}" class="w-5 h-5"></i>
          </div>
        </div>

        <div class="weather-stats-grid">
          <div class="weather-stat">
            <div class="weather-stat-label">Temp</div>
            <div class="weather-stat-value highlight">${temp}</div>
          </div>
          <div class="weather-stat">
            <div class="weather-stat-label">Wind</div>
            <div class="weather-stat-value">${windSpd} ${windDir}</div>
          </div>
          <div class="weather-stat">
            <div class="weather-stat-label">Humidity</div>
            <div class="weather-stat-value">${humidity}</div>
          </div>
          <div class="weather-stat">
            <div class="weather-stat-label">Visibility</div>
            <div class="weather-stat-value">${vis}</div>
          </div>
          <div class="weather-stat" style="grid-column: span 2">
            <div class="weather-stat-label">Condition</div>
            <div class="weather-stat-value">${sanitize(condition.label)}</div>
          </div>
        </div>

        ${metarRaw ? `
        <div class="weather-metar-block">
          <div class="flex items-center justify-between mb-1">
            <div class="metar-label">METAR Report</div>
            <button class="copy-metar-btn" data-metar="${sanitize(metarRaw)}" title="Copy METAR to clipboard">
              <i data-lucide="copy" class="w-3 h-3"></i>
            </button>
          </div>
          <div class="metar-string" aria-label="Raw METAR string">${sanitize(metarRaw)}</div>
        </div>` : `
        <div class="weather-error">No METAR data available for ${sanitize(iata)}</div>`}

        <div class="weather-condition-bar">
          <i data-lucide="${sanitize(condition.icon)}" class="w-3.5 h-3.5 weather-condition-icon" aria-hidden="true"></i>
          <span>${sanitize(condition.label)}</span>
          ${meteo ? `<span class="ml-auto opacity-40 text-xs font-mono">via Open-Meteo</span>` : ""}
        </div>
      </div>
    `;
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
    el("weather-grid").innerHTML = depCard + arrCard;
    lucide.createIcons();
  }

  /* ════════════════════════════════════════
     LEAFLET MAP
  ════════════════════════════════════════ */
  let leafletMap = null;
  let mapLayers  = [];

  function getCoords(iata, flight) {
    if (AIRPORT_COORDS[iata]) return AIRPORT_COORDS[iata];
    const dep = flight.departure || {};
    const arr = flight.arrival   || {};
    if (dep.iata === iata && dep.latitude  && dep.longitude)  return { lat: dep.latitude,  lon: dep.longitude  };
    if (arr.iata === iata && arr.latitude  && arr.longitude)  return { lat: arr.latitude,  lon: arr.longitude  };
    return null;
  }

  function makeSvgIcon(color, size = 14) {
    return L.divIcon({
      className: "",
      html: `<svg width="${size}" height="${size}" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
               <circle cx="7" cy="7" r="5" fill="${color}" stroke="rgba(6,13,31,0.9)" stroke-width="2"/>
               <circle cx="7" cy="7" r="2" fill="white" opacity="0.9"/>
             </svg>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -(size / 2 + 4)],
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
    mapLayers.forEach(l => { if (leafletMap.hasLayer(l)) leafletMap.removeLayer(l); });
    mapLayers = [];
  }

  function renderMap(flight) {
    const dep = flight.departure || {};
    const arr = flight.arrival   || {};
    const depCoords = getCoords(dep.iata, flight);
    const arrCoords = getCoords(arr.iata, flight);

    if (!depCoords || !arrCoords) {
      hide("map-section");
      return;
    }

    show("map-section");
    show("map-legend");

    if (!leafletMap) initMap();
    clearMapLayers();

    const depLatLng = [depCoords.lat, depCoords.lon];
    const arrLatLng = [arrCoords.lat, arrCoords.lon];

    const routeLine = L.polyline([depLatLng, arrLatLng], {
      color: "#22d3ee",
      weight: 2,
      opacity: 0.7,
      dashArray: "8, 6",
    }).addTo(leafletMap);
    mapLayers.push(routeLine);

    const depMarker = L.marker(depLatLng, { icon: makeSvgIcon("#22d3ee", 16) })
      .addTo(leafletMap)
      .bindPopup(`
        <div class="map-popup-iata">${sanitize(dep.iata || "??")}</div>
        <div class="map-popup-name">${sanitize(dep.airport || "")}</div>
        <div class="map-popup-time">DEP ${sanitize(formatTime(dep.scheduled))}</div>
      `);
    mapLayers.push(depMarker);

    const arrMarker = L.marker(arrLatLng, { icon: makeSvgIcon("#818cf8", 16) })
      .addTo(leafletMap)
      .bindPopup(`
        <div class="map-popup-iata">${sanitize(arr.iata || "??")}</div>
        <div class="map-popup-name">${sanitize(arr.airport || "")}</div>
        <div class="map-popup-time">ARR ${sanitize(formatTime(arr.scheduled))}</div>
      `);
    mapLayers.push(arrMarker);

    const bounds = L.latLngBounds([depLatLng, arrLatLng]);
    leafletMap.fitBounds(bounds, { padding: [60, 60], maxZoom: 7 });

    setTimeout(() => { if (leafletMap) leafletMap.invalidateSize(); }, 300);
  }

  /* ════════════════════════════════════════
     RESULT CARD BUILDER
  ════════════════════════════════════════ */
  function buildResultCard(flight, index) {
    const status  = normalizeStatus(flight.flight_status);
    const dep     = flight.departure || {};
    const arr     = flight.arrival   || {};
    const iata    = sanitize(flight.flight?.iata || "N/A");
    const airline = sanitize(flight.airline?.name || "Unknown");
    const depIata = sanitize(dep.iata || "???");
    const arrIata = sanitize(arr.iata || "???");
    const depTime = sanitize(formatTime(dep.scheduled));
    const depDate = sanitize(formatDate(dep.scheduled));

    return `
      <article
        class="result-card"
        role="listitem"
        tabindex="0"
        aria-label="${iata} from ${depIata} to ${arrIata}, status: ${sanitize(statusLabel(status))}"
        data-index="${sanitize(String(index))}"
      >
        <div class="card-header">
          <span class="flight-badge">${iata}</span>
          ${buildStatusBadge(status)}
        </div>
        <div class="route-row">
          <div>
            <div class="airport-code">${depIata}</div>
            <div class="airport-name">${sanitize(dep.airport || "")}</div>
          </div>
          <div class="route-arrow" aria-hidden="true">
            <div class="route-line"></div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </div>
          <div>
            <div class="airport-code">${arrIata}</div>
            <div class="airport-name">${sanitize(arr.airport || "")}</div>
          </div>
        </div>
        <div class="card-footer">
          <span>${airline}</span>
          <span>${depDate} &middot; ${depTime}</span>
          <span class="card-cta">
            Details
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </span>
        </div>
      </article>
    `;
  }

  /* ════════════════════════════════════════
     DETAIL CARD BUILDER
  ════════════════════════════════════════ */
  function buildDetailCard(flight) {
    const status  = normalizeStatus(flight.flight_status);
    const dep     = flight.departure || {};
    const arr     = flight.arrival   || {};
    const ac      = flight.aircraft  || {};
    const iata    = sanitize(flight.flight?.iata || "N/A");
    const airline = sanitize(flight.airline?.name || "Unknown");
    const depIata = sanitize(dep.iata || "???");
    const arrIata = sanitize(arr.iata || "???");

    return `
      <div class="detail-route-bar">
        <div class="detail-airport">
          <div class="detail-iata">${depIata}</div>
          <div class="detail-city">${sanitize(dep.airport || "")}</div>
        </div>
        <div class="detail-arrow" aria-hidden="true">
          <div class="detail-flight-num">${iata}</div>
          <div class="detail-arrow-line"></div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--cyan);opacity:0.6"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </div>
        <div class="detail-airport" style="text-align:right">
          <div class="detail-iata">${arrIata}</div>
          <div class="detail-city">${sanitize(arr.airport || "")}</div>
        </div>
      </div>

      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <div class="detail-label">Airline</div>
          <div class="detail-value">${airline}</div>
        </div>
        <div>${buildStatusBadge(status)}</div>
      </div>

      <div class="detail-grid">
        <div class="detail-block">
          <div class="detail-label">Departure &mdash; Scheduled</div>
          <div class="detail-value large">${sanitize(formatTime(dep.scheduled))}</div>
          <div class="detail-label mt-2">Date</div>
          <div class="detail-value">${sanitize(formatDate(dep.scheduled))}</div>
        </div>
        <div class="detail-block">
          <div class="detail-label">Arrival &mdash; Scheduled</div>
          <div class="detail-value large">${sanitize(formatTime(arr.scheduled))}</div>
          <div class="detail-label mt-2">Date</div>
          <div class="detail-value">${sanitize(formatDate(arr.scheduled))}</div>
        </div>
        <div class="detail-block">
          <div class="detail-label">Departure Terminal</div>
          <div class="detail-value">${dep.terminal ? sanitize(dep.terminal) : "N/A"}</div>
          <div class="detail-label mt-2">Gate</div>
          <div class="detail-value">${dep.gate ? sanitize(dep.gate) : "N/A"}</div>
          ${dep.delay ? `<div class="detail-label mt-2">Delay</div><div class="detail-value" style="color:#fdba74">+${sanitize(String(dep.delay))} min</div>` : ""}
        </div>
        <div class="detail-block">
          <div class="detail-label">Arrival Terminal</div>
          <div class="detail-value">${arr.terminal ? sanitize(arr.terminal) : "N/A"}</div>
          <div class="detail-label mt-2">Gate</div>
          <div class="detail-value">${arr.gate ? sanitize(arr.gate) : "N/A"}</div>
        </div>
        ${dep.actual ? `<div class="detail-block"><div class="detail-label">Actual Departure</div><div class="detail-value">${sanitize(formatTime(dep.actual))}</div></div>` : ""}
        ${arr.estimated ? `<div class="detail-block"><div class="detail-label">Estimated Arrival</div><div class="detail-value">${sanitize(formatTime(arr.estimated))}</div></div>` : ""}
        ${(ac.registration || ac.iata) ? `
        <div class="detail-block">
          <div class="detail-label">Aircraft</div>
          <div class="detail-value">${sanitize(ac.iata || "N/A")}</div>
          ${ac.registration ? `<div class="detail-label mt-2">Registration</div><div class="detail-value">${sanitize(ac.registration)}</div>` : ""}
        </div>` : ""}
      </div>
    `;
  }

  /* ════════════════════════════════════════
     STATE
  ════════════════════════════════════════ */
  let currentResults = [];

  /* ════════════════════════════════════════
     RENDER RESULTS
  ════════════════════════════════════════ */
  function renderResults(flights) {
    const grid = el("results-grid");
    grid.innerHTML = flights.map((f, i) => buildResultCard(f, i)).join("");
    el("results-count").textContent = `(${flights.length})`;
    show("results-section");

    grid.querySelectorAll(".result-card").forEach(card => {
      card.addEventListener("click", () => openDetail(Number(card.dataset.index)));
      card.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetail(Number(card.dataset.index)); }
      });
    });
  }

  function openDetail(index) {
    const flight = currentResults[index];
    if (!flight) return;
    el("detail-card").innerHTML = buildDetailCard(flight);
    hide("results-section");
    show("detail-section");
    el("detail-section").scrollIntoView({ behavior: "smooth", block: "start" });
    updateLiveRegion(`Showing detail for flight ${flight.flight?.iata || ""}`);
  }

  /* ════════════════════════════════════════
     AVGEEK LINK UPDATER
  ════════════════════════════════════════ */
  function updateAvgeekLinks(flightNumber) {
    const enc = encodeURIComponent(flightNumber);
    el("link-fr24").href = `https://www.flightradar24.com/data/flights/${enc}`;
    el("link-fa").href   = `https://www.flightaware.com/live/flight/${enc}`;
    el("link-ps").href   = `https://www.planespotters.net/search?q=${enc}`;
    // New dynamic links
    el("link-latc").href = `https://www.liveatc.net/search/?icao=${enc}`; 
    el("link-sv").href   = `https://skyvector.com/?ll=20,0&chart=301&zoom=3`; // General view, as SkyVector doesn't support direct flight # search via URL as easily
  }

  function resetAvgeekLinks() {
    el("link-fr24").href = "https://www.flightradar24.com";
    el("link-fa").href   = "https://www.flightaware.com";
    el("link-ps").href   = "https://www.planespotters.net";
    el("link-latc").href = "https://www.liveatc.net";
    el("link-sv").href   = "https://skyvector.com";
  }

  /* ════════════════════════════════════════
     MAIN SEARCH HANDLER
  ════════════════════════════════════════ */
  async function handleSearch() {
    clearInputError();
    const { valid, error, value } = validateInput(el("flight-input").value);
    if (!valid) { showInputError(error); el("flight-input").focus(); return; }

    hide("results-section");
    hide("detail-section");
    hide("empty-section");
    hide("map-section");
    hide("weather-section");
    show("loading-section");
    el("search-btn").disabled = true;
    updateLiveRegion("Searching for flight data...");

    try {
      const flights = await fetchFlights(value);
      hide("loading-section");
      el("search-btn").disabled = false;

      if (!flights.length) {
        show("empty-section");
        updateLiveRegion("No flights found.");
        resetAvgeekLinks();
        return;
      }

      currentResults = flights;
      renderResults(flights);
      updateAvgeekLinks(value);
      updateLiveRegion(`Found ${flights.length} result${flights.length > 1 ? "s" : ""} for ${value}.`);

      const primary = flights[0];
      const depIata = primary.departure?.iata;
      const arrIata = primary.arrival?.iata;

      renderMap(primary);

      if (depIata && arrIata) {
        renderWeather(depIata, arrIata);
      }

    } catch (err) {
      hide("loading-section");
      el("search-btn").disabled = false;
      showInputError("Could not retrieve flight data. Please try again later.");
      updateLiveRegion("Error retrieving flight data.");
      console.error("[OpenAero]", err);
    }
  }

  /* ════════════════════════════════════════
     EVENT LISTENERS
  ════════════════════════════════════════ */
  function initSearch() {
    el("search-btn").addEventListener("click", handleSearch);
    el("flight-input").addEventListener("keydown", e => { if (e.key === "Enter") handleSearch(); });
    el("flight-input").addEventListener("input", clearInputError);

    el("clear-results").addEventListener("click", () => {
      hide("results-section");
      hide("map-section");
      hide("weather-section");
      el("results-grid").innerHTML = "";
      el("weather-grid").innerHTML = "";
      currentResults = [];
      resetAvgeekLinks();
      clearMapLayers();
      el("flight-input").value = "";
      el("flight-input").focus();
      updateLiveRegion("Results cleared.");
    });

    el("back-btn").addEventListener("click", () => {
      hide("detail-section");
      show("results-section");
      el("results-section").scrollIntoView({ behavior: "smooth", block: "start" });
      updateLiveRegion("Back to results.");
    });
  }

/* ════════════════════════════════════════
   THEME (SYNCED WITH TERMINAL)
════════════════════════════════════════ */

    function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);

    const body = document.getElementById("app-body");
    if (body) body.setAttribute("data-theme", theme);

    try {
        localStorage.setItem("openaero-theme", theme);
    } catch (_) {}
    }

    function initTheme() {
    // Load saved theme
    let stored = "dark";
    try {
        stored = localStorage.getItem("openaero-theme") || "dark";
    } catch (_) {}

    applyTheme(stored);

    const toggle = el("theme-toggle");

    if (toggle) {
    toggle.addEventListener("click", () => {
        const cur = document.documentElement.getAttribute("data-theme") || "dark";
        const next = cur === "dark" ? "light" : "dark";

        applyTheme(next, true);
    });
    }

    window.addEventListener("storage", (e) => {
        if (e.key === "openaero-theme") {
        applyTheme(e.newValue || "dark");
        }
    });
    }

    function initWeatherActions() {
        const grid = el("weather-grid");
        grid.addEventListener("click", async (e) => {
        const btn = e.target.closest(".copy-metar-btn");
        if (!btn) return;

        const metar = btn.dataset.metar;
        try {
            await navigator.clipboard.writeText(metar);
            
            // Brief visual feedback
            const icon = btn.querySelector("i");
            const originalInner = btn.innerHTML;
            btn.innerHTML = `<i data-lucide="check" class="w-3 h-3 text-cyan-400"></i>`;
            lucide.createIcons();
            
            setTimeout(() => {
            btn.innerHTML = originalInner;
            lucide.createIcons();
            }, 2000);
        } catch (err) {
            console.error("Failed to copy METAR:", err);
        }
        });
    }

  /* ════════════════════════════════════════
     INIT
  ════════════════════════════════════════ */
  function init() {
    initTheme();
    initSearch();
    initWeatherActions();
    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
