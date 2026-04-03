(() => {
  "use strict";

  /* CONFIG */
  const FLIGHT_REGEX = /^[A-Z0-9]{2,3}[0-9]{1,4}[A-Z]?$/i;
  const AVIATIONSTACK_KEY = "2582c5cc9b95a3ce51c21525ff6a4063";
  const AVIATIONSTACK_BASE = "https://api.aviationstack.com/v1/flights";

  const OPENMETEO_BASE = "https://api.open-meteo.com/v1/forecast";

  const AWC_METAR_BASE = "https://api.allorigins.win/raw?url=" + encodeURIComponent("https://aviationweather.gov/api/data/metar");

  async function fetchMetar(icaoOrIata) {
    try {
      const resp = await fetch(
        `https://aviationweather.gov/api/data/metar?ids=${encodeURIComponent(icaoOrIata)}&format=json&hours=1`,
        { headers: { "Accept": "application/json" } }
      );
      if (!resp.ok) return null;
      const data = await resp.json();
      return Array.isArray(data) && data.length ? data[0] : null;
    } catch (err) {
      console.debug("[OpenAero][fetchMetar] failed for", icaoOrIata, err);
      return null;
    }
  }

  const AIRPORT_DB = {
    SIN: { lat: 1.3644, lon: 103.9915, name: "Singapore Changi Airport" },
    LHR: { lat: 51.4700, lon: -0.4543, name: "London Heathrow Airport" },
    JFK: { lat: 40.6413, lon: -73.7781, name: "John F. Kennedy International Airport" },
    LAX: { lat: 33.9425, lon: -118.4081, name: "Los Angeles International Airport" },
    DXB: { lat: 25.2528, lon: 55.3644, name: "Dubai International Airport" },
    SYD: { lat: -33.9399, lon: 151.1753, name: "Sydney Kingsford Smith Airport" },
    HND: { lat: 35.5494, lon: 139.7798, name: "Tokyo Haneda Airport" },
    NRT: { lat: 35.7720, lon: 140.3929, name: "Tokyo Narita International Airport" },
    CDG: { lat: 49.0097, lon: 2.5479, name: "Paris Charles de Gaulle Airport" },
    AMS: { lat: 52.3086, lon: 4.7639, name: "Amsterdam Schiphol Airport" },
    FRA: { lat: 50.0379, lon: 8.5622, name: "Frankfurt Airport" },
    ICN: { lat: 37.4602, lon: 126.4407, name: "Seoul Incheon International Airport" },
    HKG: { lat: 22.3080, lon: 113.9185, name: "Hong Kong International Airport" },
    BKK: { lat: 13.6811, lon: 100.7472, name: "Bangkok Suvarnabhumi Airport" },
    KUL: { lat: 2.7456, lon: 101.7099, name: "Kuala Lumpur International Airport" },
    SFO: { lat: 37.6213, lon: -122.3790, name: "San Francisco International Airport" },
    ORD: { lat: 41.9742, lon: -87.9073, name: "Chicago O'Hare International Airport" },
    ATL: { lat: 33.6407, lon: -84.4277, name: "Hartsfield-Jackson Atlanta International Airport" },
    MIA: { lat: 25.7959, lon: -80.2870, name: "Miami International Airport" },
    YYZ: { lat: 43.6777, lon: -79.6248, name: "Toronto Pearson International Airport" },
    GRU: { lat: -23.4356, lon: -46.4731, name: "São Paulo Guarulhos International Airport" },
    EZE: { lat: -34.8222, lon: -58.5358, name: "Buenos Aires Ezeiza International Airport" },
    MEX: { lat: 19.4363, lon: -99.0721, name: "Mexico City International Airport" },
    NBO: { lat: -1.3192, lon: 36.9275, name: "Nairobi Jomo Kenyatta International Airport" },
    JNB: { lat: -26.1392, lon: 28.2460, name: "Johannesburg OR Tambo International Airport" },
    CPT: { lat: -33.9648, lon: 18.6017, name: "Cape Town International Airport" },
    CAI: { lat: 30.1219, lon: 31.4056, name: "Cairo International Airport" },
    IST: { lat: 41.2608, lon: 28.7418, name: "Istanbul Airport" },
    MAD: { lat: 40.4936, lon: -3.5668, name: "Madrid Barajas Airport" },
    BCN: { lat: 41.2971, lon: 2.0785, name: "Barcelona El Prat Airport" },
    FCO: { lat: 41.8003, lon: 12.2389, name: "Rome Fiumicino Airport" },
    MXP: { lat: 45.6306, lon: 8.7231, name: "Milan Malpensa Airport" },
    MUC: { lat: 48.3538, lon: 11.7861, name: "Munich Airport" },
    ZRH: { lat: 47.4582, lon: 8.5555, name: "Zurich Airport" },
    VIE: { lat: 48.1103, lon: 16.5697, name: "Vienna International Airport" },
    BRU: { lat: 50.9010, lon: 4.4844, name: "Brussels Airport" },
    LIS: { lat: 38.7742, lon: -9.1342, name: "Lisbon Humberto Delgado Airport" },
    OSL: { lat: 60.1939, lon: 11.1004, name: "Oslo Gardermoen Airport" },
    ARN: { lat: 59.6519, lon: 17.9186, name: "Stockholm Arlanda Airport" },
    CPH: { lat: 55.6181, lon: 12.6560, name: "Copenhagen Airport" },
    HEL: { lat: 60.3172, lon: 24.9633, name: "Helsinki Vantaa Airport" },
    WAW: { lat: 52.1657, lon: 20.9671, name: "Warsaw Chopin Airport" },
    PRG: { lat: 50.1008, lon: 14.2600, name: "Prague Václav Havel Airport" },
    BUD: { lat: 47.4298, lon: 19.2611, name: "Budapest Ferenc Liszt International Airport" },
    ATH: { lat: 37.9364, lon: 23.9445, name: "Athens Eleftherios Venizelos Airport" },
    DOH: { lat: 25.2610, lon: 51.6138, name: "Hamad International Airport" },
    AUH: { lat: 24.4330, lon: 54.6511, name: "Abu Dhabi International Airport" },
    RUH: { lat: 24.9576, lon: 46.6988, name: "King Khalid International Airport" },
    DEL: { lat: 28.5562, lon: 77.1000, name: "Indira Gandhi International Airport" },
    BOM: { lat: 19.0896, lon: 72.8656, name: "Chhatrapati Shivaji Maharaj International Airport" },
    BLR: { lat: 13.1979, lon: 77.7063, name: "Kempegowda International Airport" },
    MAA: { lat: 12.9900, lon: 80.1693, name: "Chennai International Airport" },
    HYD: { lat: 17.2403, lon: 78.4294, name: "Rajiv Gandhi International Airport" },
    CCU: { lat: 22.6542, lon: 88.4467, name: "Netaji Subhas Chandra Bose International Airport" },
    DAC: { lat: 23.8433, lon: 90.3978, name: "Hazrat Shahjalal International Airport" },
    CMB: { lat: 7.1808, lon: 79.8841, name: "Bandaranaike International Airport" },
    KHI: { lat: 24.9065, lon: 67.1609, name: "Jinnah International Airport" },
    PEK: { lat: 40.0799, lon: 116.6031, name: "Beijing Capital International Airport" },
    PKX: { lat: 39.5098, lon: 116.4105, name: "Beijing Daxing International Airport" },
    PVG: { lat: 31.1443, lon: 121.8083, name: "Shanghai Pudong International Airport" },
    SHA: { lat: 31.1981, lon: 121.3362, name: "Shanghai Hongqiao International Airport" },
    CAN: { lat: 23.3924, lon: 113.2988, name: "Guangzhou Baiyun International Airport" },
    CTU: { lat: 30.5785, lon: 103.9471, name: "Chengdu Tianfu International Airport" },
    XIY: { lat: 34.4471, lon: 108.7516, name: "Xi'an Xianyang International Airport" },
    MNL: { lat: 14.5086, lon: 121.0197, name: "Ninoy Aquino International Airport" },
    CGK: { lat: -6.1256, lon: 106.6559, name: "Soekarno–Hatta International Airport" },
    DPS: { lat: -8.7482, lon: 115.1668, name: "Ngurah Rai International Airport" },
    SUB: { lat: -7.3798, lon: 112.7869, name: "Juanda International Airport" },
    UPG: { lat: -5.0617, lon: 119.5540, name: "Sultan Hasanuddin International Airport" },
    SRG: { lat: -6.9727, lon: 110.3742, name: "Ahmad Yani International Airport" },
    SOC: { lat: -7.5161, lon: 110.7572, name: "Adi Soemarmo International Airport" },
    JOG: { lat: -7.7882, lon: 110.4317, name: "Adisutjipto International Airport" },
    MLG: { lat: -7.9267, lon: 112.7145, name: "Abdul Rachman Saleh Airport" },
    MDC: { lat: 1.5493, lon: 124.9260, name: "Sam Ratulangi International Airport" },
    BTH: { lat: 1.1213, lon: 104.1192, name: "Hang Nadim International Airport" },
    SIN_ICAO: { lat: 1.3644, lon: 103.9915, name: "Singapore Changi Airport" },
    MEL: { lat: -37.6690, lon: 144.8410, name: "Melbourne Airport" },
    AKL: { lat: -37.0082, lon: 174.7850, name: "Auckland Airport" },
    PER: { lat: -31.9403, lon: 115.9669, name: "Perth Airport" },
    BNE: { lat: -27.3842, lon: 153.1175, name: "Brisbane Airport" },
    YVR: { lat: 49.1967, lon: -123.1815, name: "Vancouver International Airport" },
    YUL: { lat: 45.4706, lon: -73.7408, name: "Montréal-Trudeau International Airport" },
    GIG: { lat: -22.8100, lon: -43.2506, name: "Rio de Janeiro Galeão International Airport" },
    SCL: { lat: -33.3930, lon: -70.7858, name: "Santiago Arturo Merino Benítez International Airport" },
    BOG: { lat: 4.7016, lon: -74.1469, name: "El Dorado International Airport" },
    LIM: { lat: -12.0219, lon: -77.1143, name: "Jorge Chávez International Airport" },
  };

  async function getAirportLocation(code) {
    if (!code) return null;
    const upper = code.toUpperCase();
    if (AIRPORT_DB[upper]) return AIRPORT_DB[upper];

    // // [DIAG] Airport not in static DB, attempting geocode fallback via nominatim
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(upper + " airport")}&format=json&limit=1&featuretype=aeroway`,
        { headers: { "Accept-Language": "en" } }
      );
      if (!resp.ok) {
        // // [DIAG-getAirportLocation] Nominatim response not OK: status=${resp.status}
        return null;
      }
      const results = await resp.json();
      if (results && results.length) {
        // // [DIAG-getAirportLocation] Nominatim fallback hit for code=${upper}, name=${results[0].display_name}
        return { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon), name: results[0].display_name.split(",")[0] };
      }
    } catch (err) {
      // // [DIAG-getAirportLocation] Nominatim fallback threw: ${err}
    }
    return null;
  }

  async function fetchOpenMeteo(code) {
    try {
      const coords = await getAirportLocation(code);
      if (!coords) return null;
      const params = new URLSearchParams({
        latitude: coords.lat,
        longitude: coords.lon,
        current: "temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,visibility",
        wind_speed_unit: "kn",
        forecast_days: "1",
      });
      const resp = await fetch(`${OPENMETEO_BASE}?${params}`);
      if (!resp.ok) return null;
      const weatherData = await resp.json();
      weatherData.airportName = coords.name;
      return weatherData;
    } catch (err) {
      return null;
    }
  }

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

  function synthesizeMetarString(iata, meteo) {
    if (!meteo?.current) return null;
    const cur = meteo.current;
    const now = new Date();
    const dd   = String(now.getUTCDate()).padStart(2, "0");
    const hh   = String(now.getUTCHours()).padStart(2, "0");
    const mm   = String(now.getUTCMinutes()).padStart(2, "0");
    const time = `${dd}${hh}${mm}Z`;

    const windDeg = cur.wind_direction_10m != null ? String(Math.round(cur.wind_direction_10m)).padStart(3, "0") : "000";
    const windKt  = cur.wind_speed_10m     != null ? String(Math.round(cur.wind_speed_10m)).padStart(2,  "0") : "00";
    const wind    = `${windDeg}${windKt}KT`;

    const visM    = cur.visibility != null ? Math.min(Math.round(cur.visibility / 100) * 100, 9999) : 9999;
    const visStr  = visM >= 9999 ? "9999" : String(visM).padStart(4, "0");

    const code    = cur.weather_code ?? 0;
    let wxStr     = "";
    if (code >= 95) wxStr = "TS ";
    else if (code >= 80) wxStr = "SHRA ";
    else if (code >= 71) wxStr = "SN ";
    else if (code >= 51) wxStr = "DZ ";
    else if (code >= 61) wxStr = "RA ";
    else if (code >= 45) wxStr = "FG ";

    let cloudStr  = "SKC";
    if (code >= 3)       cloudStr = "BKN025";
    else if (code >= 2)  cloudStr = "SCT020";
    else if (code >= 1)  cloudStr = "FEW010";

    const tempC   = cur.temperature_2m != null ? Math.round(cur.temperature_2m) : 0;
    const tempStr = (tempC < 0 ? `M${String(Math.abs(tempC)).padStart(2,"0")}` : String(tempC).padStart(2,"0"));
    const dp      = cur.relative_humidity_2m != null
      ? Math.round(tempC - ((100 - cur.relative_humidity_2m) / 5))
      : tempC - 5;
    const dpStr   = (dp < 0 ? `M${String(Math.abs(dp)).padStart(2,"0")}` : String(dp).padStart(2,"0"));

    return `${iata} ${time} ${wind} ${visStr} ${wxStr}${cloudStr} ${tempStr}/${dpStr} Q${Math.round(1013 + (tempC < 15 ? 2 : -1))} (SYNTH)`;
  }

  async function buildWeatherCard(iata, role) {
    const metarPromise = fetchMetar(iata);
    const meteoPromise = fetchOpenMeteo(iata);
    const [metar, meteo] = await Promise.all([metarPromise, meteoPromise]);

    const displayAirportName = sanitize(meteo?.airportName || iata);

    const cur = meteo?.current || {};
    
    const temp = cur.temperature_2m != null ? `${Math.round(cur.temperature_2m)}°C` : "N/A";
    const windSpd = cur.wind_speed_10m != null ? `${Math.round(cur.wind_speed_10m)} kt` : "N/A";
    const windDir = cur.wind_direction_10m != null ? `${windDirToCardinal(cur.wind_direction_10m)}` : "";
    const humidity = cur.relative_humidity_2m != null ? `${cur.relative_humidity_2m}%` : "N/A";
    const visRaw = cur.visibility;
    const vis = visRaw != null ? `${(visRaw / 1000).toFixed(1)} km` : "N/A";
    const condition = cur.weather_code != null ? weatherCodeToCondition(cur.weather_code) : { label: "N/A", icon: "cloud" };

    const metarRaw = metar?.rawOb || metar?.raw_text || synthesizeMetarString(iata, meteo) || null;
    const metarIsSynth = !metar?.rawOb && !metar?.raw_text && metarRaw != null;

    return `
      <div class="weather-card">
        <div class="weather-card-header">
          <div>
            <div class="weather-airport-iata">${sanitize(iata)}</div>
            <div class="weather-airport-role">${displayAirportName} &mdash; ${sanitize(role)}</div>
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
            <div class="metar-label">${metarIsSynth ? "METAR (Synthesized)" : "METAR Report"}</div>
            <button class="copy-metar-btn" data-metar="${sanitize(metarRaw)}" title="Copy METAR">
              <i data-lucide="copy" class="w-3 h-3"></i>
            </button>
          </div>
          <div class="metar-string">${sanitize(metarRaw)}</div>
          ${metarIsSynth ? `<div style="font-size:0.65rem;color:var(--text-muted,#888);margin-top:4px;opacity:0.75">Derived from Open-Meteo · Not suitable for navigation</div>` : ""}
        </div>` : `
        <div class="weather-error">No METAR data available for ${sanitize(iata)}</div>`}
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

  let leafletMap = null;
  let mapLayers  = [];

  function getCoords(iata, flight) {
    const dep = flight.departure || {};
    const arr = flight.arrival   || {};
    
    if (dep.iata === iata && dep.latitude && dep.longitude) {
      return { lat: dep.latitude, lon: dep.longitude };
    }
    if (arr.iata === iata && arr.latitude && arr.longitude) {
      return { lat: arr.latitude, lon: arr.longitude };
    }
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

  let currentResults = [];

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

  function updateAvgeekLinks(flightNumber) {
    const enc = encodeURIComponent(flightNumber);
    el("link-fr24").href = `https://www.flightradar24.com/data/flights/${enc}`;
    el("link-fa").href   = `https://www.flightaware.com/live/flight/${enc}`;
    el("link-ps").href   = `https://www.planespotters.net/search?q=${enc}`;
    // New dynamic links
    el("link-latc").href = `https://www.liveatc.net/search/?icao=${enc}`; 
    el("link-sv").href   = `https://skyvector.com/?ll=20,0&chart=301&zoom=3`;
  }

  function resetAvgeekLinks() {
    el("link-fr24").href = "https://www.flightradar24.com";
    el("link-fa").href   = "https://www.flightaware.com";
    el("link-ps").href   = "https://www.planespotters.net";
    el("link-latc").href = "https://www.liveatc.net";
    el("link-sv").href   = "https://skyvector.com";
  }

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
      const depCode = primary.departure?.icao || primary.departure?.iata;
      const arrCode = primary.arrival?.icao || primary.arrival?.iata;

      renderMap(primary);

      if (depCode && arrCode) {
        renderWeather(depCode, arrCode);
      }

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

    function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);

    const body = document.getElementById("app-body");
    if (body) body.setAttribute("data-theme", theme);

    try {
        localStorage.setItem("openaero-theme", theme);
    } catch (_) {}
    }

    function initTheme() {
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
