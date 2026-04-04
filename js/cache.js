(function () {
  "use strict";

  const TTL = { flight: 5 * 60_000, weather: 10 * 60_000, geo: 60 * 60_000 };
  const SS_PREFIX = "oac:";

  const shadow = new Map();

  function ssGet(key) {
    const full = SS_PREFIX + key;
    if (shadow.has(full)) {
      const s = shadow.get(full);
      if (Date.now() <= s.expires) return s.value;
      shadow.delete(full);
    }
    try {
      const raw = sessionStorage.getItem(full);
      if (!raw) return undefined;
      const entry = JSON.parse(raw);
      if (Date.now() > entry.expires) { sessionStorage.removeItem(full); return undefined; }
      shadow.set(full, entry);
      return entry.value;
    } catch (_) { return undefined; }
  }

  function ssSet(key, value, ttl) {
    const full   = SS_PREFIX + key;
    const entry  = { value, expires: Date.now() + ttl };
    shadow.set(full, entry);
    try { sessionStorage.setItem(full, JSON.stringify(entry)); } catch (_) {
      /* sessionStorage quota exceeded — fall back to shadow-only */
    }
    return value;
  }

  function prune() {
    const now = Date.now();
    /* Prune shadow */
    for (const [k, v] of shadow) { if (now > v.expires) shadow.delete(k); }
    try {
      const toRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (!k.startsWith(SS_PREFIX)) continue;
        try {
          const entry = JSON.parse(sessionStorage.getItem(k));
          if (now > entry.expires) toRemove.push(k);
        } catch (_) { toRemove.push(k); }
      }
      toRemove.forEach(k => sessionStorage.removeItem(k));
    } catch (_) {}
  }

  prune();
  setInterval(prune, 15 * 60_000);

  function memoize(fn) {
    const memo = new Map();
    return (...args) => {
      const key = args.length === 1 ? args[0] : JSON.stringify(args);
      if (memo.has(key)) return memo.get(key);
      const result = fn(...args);
      memo.set(key, result);
      return result;
    };
  }

  const _sanitizeNode  = document.createElement("div");
  const _sanitizeCache = new Map();

  function sanitize(str) {
    if (str == null || str === "") return "";
    const s = String(str);
    if (_sanitizeCache.has(s)) return _sanitizeCache.get(s);
    _sanitizeNode.textContent = s;
    const result = _sanitizeNode.innerHTML;
    if (s.length < 64) _sanitizeCache.set(s, result);
    return result;
  }

  const AIRPORT_DB = {
    WSSS: { lat: 1.3502,    lon: 103.9945,  name: "Singapore Changi Airport" },
    KJFK: { lat: 40.6413,   lon: -73.7781,  name: "New York JFK" },
    EGLL: { lat: 51.4700,   lon: -0.4543,   name: "London Heathrow Airport" },
    WMKK: { lat: 2.7456,    lon: 101.7072,  name: "Kuala Lumpur International Airport" },
    VHHH: { lat: 22.3080,   lon: 113.9185,  name: "Hong Kong International Airport" },
    RJTT: { lat: 35.5494,   lon: 139.7798,  name: "Tokyo Haneda Airport" },
    RJAA: { lat: 35.7720,   lon: 140.3929,  name: "Tokyo Narita International Airport" },
    LFPG: { lat: 49.0097,   lon: 2.5479,    name: "Paris Charles de Gaulle Airport" },
    EHAM: { lat: 52.3086,   lon: 4.7639,    name: "Amsterdam Schiphol Airport" },
    EDDF: { lat: 50.0379,   lon: 8.5622,    name: "Frankfurt Airport" },
    RKSI: { lat: 37.4602,   lon: 126.4407,  name: "Seoul Incheon International Airport" },
    VTBS: { lat: 13.6811,   lon: 100.7472,  name: "Bangkok Suvarnabhumi Airport" },
    KSFO: { lat: 37.6213,   lon: -122.3790, name: "San Francisco International Airport" },
    KORD: { lat: 41.9742,   lon: -87.9073,  name: "Chicago O'Hare International Airport" },
    KATL: { lat: 33.6407,   lon: -84.4277,  name: "Atlanta Hartsfield-Jackson Airport" },
    KDXB: { lat: 25.2528,   lon: 55.3644,   name: "Dubai International Airport" },
    OMDB: { lat: 25.2528,   lon: 55.3644,   name: "Dubai International Airport" },
    OTHH: { lat: 25.2610,   lon: 51.6138,   name: "Hamad International Airport" },
    VIDP: { lat: 28.5562,   lon: 77.1000,   name: "Indira Gandhi International Airport" },
    VABB: { lat: 19.0896,   lon: 72.8656,   name: "Chhatrapati Shivaji Maharaj International Airport" },
    WIDD: { lat: 1.1213,    lon: 104.1192,  name: "Hang Nadim International Airport" },
    WIII: { lat: -6.1256,   lon: 106.6559,  name: "Soekarno–Hatta International Airport" },
    WADD: { lat: -8.7482,   lon: 115.1668,  name: "Ngurah Rai International Airport" },
    WARR: { lat: -7.3798,   lon: 112.7869,  name: "Juanda International Airport" },
    WAMM: { lat: 1.5493,    lon: 124.9260,  name: "Sam Ratulangi International Airport" },
    WARS: { lat: -6.9727,   lon: 110.3742,  name: "Ahmad Yani International Airport" },
    ZMUB: { lat: -7.5161,   lon: 110.7572,  name: "Adi Soemarmo International Airport" },
    YBSY: { lat: -37.6690,  lon: 144.8410,  name: "Melbourne Airport" },
    YMML: { lat: -37.6690,  lon: 144.8410,  name: "Melbourne Airport" },
    NZAA: { lat: -37.0082,  lon: 174.7850,  name: "Auckland Airport" },
    YPPH: { lat: -31.9403,  lon: 115.9669,  name: "Perth Airport" },
    YBBN: { lat: -27.3842,  lon: 153.1175,  name: "Brisbane Airport" },

    SIN: { lat: 1.3644,    lon: 103.9915,  name: "Singapore Changi Airport" },
    LHR: { lat: 51.4700,   lon: -0.4543,   name: "London Heathrow Airport" },
    JFK: { lat: 40.6413,   lon: -73.7781,  name: "John F. Kennedy International Airport" },
    LAX: { lat: 33.9425,   lon: -118.4081, name: "Los Angeles International Airport" },
    DXB: { lat: 25.2528,   lon: 55.3644,   name: "Dubai International Airport" },
    SYD: { lat: -33.9399,  lon: 151.1753,  name: "Sydney Kingsford Smith Airport" },
    HND: { lat: 35.5494,   lon: 139.7798,  name: "Tokyo Haneda Airport" },
    NRT: { lat: 35.7720,   lon: 140.3929,  name: "Tokyo Narita International Airport" },
    CDG: { lat: 49.0097,   lon: 2.5479,    name: "Paris Charles de Gaulle Airport" },
    AMS: { lat: 52.3086,   lon: 4.7639,    name: "Amsterdam Schiphol Airport" },
    FRA: { lat: 50.0379,   lon: 8.5622,    name: "Frankfurt Airport" },
    ICN: { lat: 37.4602,   lon: 126.4407,  name: "Seoul Incheon International Airport" },
    HKG: { lat: 22.3080,   lon: 113.9185,  name: "Hong Kong International Airport" },
    BKK: { lat: 13.6811,   lon: 100.7472,  name: "Bangkok Suvarnabhumi Airport" },
    KUL: { lat: 2.7456,    lon: 101.7099,  name: "Kuala Lumpur International Airport" },
    SFO: { lat: 37.6213,   lon: -122.3790, name: "San Francisco International Airport" },
    ORD: { lat: 41.9742,   lon: -87.9073,  name: "Chicago O'Hare International Airport" },
    ATL: { lat: 33.6407,   lon: -84.4277,  name: "Hartsfield-Jackson Atlanta International Airport" },
    MIA: { lat: 25.7959,   lon: -80.2870,  name: "Miami International Airport" },
    YYZ: { lat: 43.6777,   lon: -79.6248,  name: "Toronto Pearson International Airport" },
    GRU: { lat: -23.4356,  lon: -46.4731,  name: "São Paulo Guarulhos International Airport" },
    EZE: { lat: -34.8222,  lon: -58.5358,  name: "Buenos Aires Ezeiza International Airport" },
    MEX: { lat: 19.4363,   lon: -99.0721,  name: "Mexico City International Airport" },
    NBO: { lat: -1.3192,   lon: 36.9275,   name: "Nairobi Jomo Kenyatta International Airport" },
    JNB: { lat: -26.1392,  lon: 28.2460,   name: "Johannesburg OR Tambo International Airport" },
    CPT: { lat: -33.9648,  lon: 18.6017,   name: "Cape Town International Airport" },
    CAI: { lat: 30.1219,   lon: 31.4056,   name: "Cairo International Airport" },
    IST: { lat: 41.2608,   lon: 28.7418,   name: "Istanbul Airport" },
    MAD: { lat: 40.4936,   lon: -3.5668,   name: "Madrid Barajas Airport" },
    BCN: { lat: 41.2971,   lon: 2.0785,    name: "Barcelona El Prat Airport" },
    FCO: { lat: 41.8003,   lon: 12.2389,   name: "Rome Fiumicino Airport" },
    MXP: { lat: 45.6306,   lon: 8.7231,    name: "Milan Malpensa Airport" },
    MUC: { lat: 48.3538,   lon: 11.7861,   name: "Munich Airport" },
    ZRH: { lat: 47.4582,   lon: 8.5555,    name: "Zurich Airport" },
    VIE: { lat: 48.1103,   lon: 16.5697,   name: "Vienna International Airport" },
    BRU: { lat: 50.9010,   lon: 4.4844,    name: "Brussels Airport" },
    LIS: { lat: 38.7742,   lon: -9.1342,   name: "Lisbon Humberto Delgado Airport" },
    OSL: { lat: 60.1939,   lon: 11.1004,   name: "Oslo Gardermoen Airport" },
    ARN: { lat: 59.6519,   lon: 17.9186,   name: "Stockholm Arlanda Airport" },
    CPH: { lat: 55.6181,   lon: 12.6560,   name: "Copenhagen Airport" },
    HEL: { lat: 60.3172,   lon: 24.9633,   name: "Helsinki Vantaa Airport" },
    WAW: { lat: 52.1657,   lon: 20.9671,   name: "Warsaw Chopin Airport" },
    PRG: { lat: 50.1008,   lon: 14.2600,   name: "Prague Václav Havel Airport" },
    BUD: { lat: 47.4298,   lon: 19.2611,   name: "Budapest Ferenc Liszt International Airport" },
    ATH: { lat: 37.9364,   lon: 23.9445,   name: "Athens Eleftherios Venizelos Airport" },
    DOH: { lat: 25.2610,   lon: 51.6138,   name: "Hamad International Airport" },
    AUH: { lat: 24.4330,   lon: 54.6511,   name: "Abu Dhabi International Airport" },
    RUH: { lat: 24.9576,   lon: 46.6988,   name: "King Khalid International Airport" },
    DEL: { lat: 28.5562,   lon: 77.1000,   name: "Indira Gandhi International Airport" },
    BOM: { lat: 19.0896,   lon: 72.8656,   name: "Chhatrapati Shivaji Maharaj International Airport" },
    BLR: { lat: 13.1979,   lon: 77.7063,   name: "Kempegowda International Airport" },
    MAA: { lat: 12.9900,   lon: 80.1693,   name: "Chennai International Airport" },
    HYD: { lat: 17.2403,   lon: 78.4294,   name: "Rajiv Gandhi International Airport" },
    CCU: { lat: 22.6542,   lon: 88.4467,   name: "Netaji Subhas Chandra Bose International Airport" },
    DAC: { lat: 23.8433,   lon: 90.3978,   name: "Hazrat Shahjalal International Airport" },
    CMB: { lat: 7.1808,    lon: 79.8841,   name: "Bandaranaike International Airport" },
    KHI: { lat: 24.9065,   lon: 67.1609,   name: "Jinnah International Airport" },
    PEK: { lat: 40.0799,   lon: 116.6031,  name: "Beijing Capital International Airport" },
    PKX: { lat: 39.5098,   lon: 116.4105,  name: "Beijing Daxing International Airport" },
    PVG: { lat: 31.1443,   lon: 121.8083,  name: "Shanghai Pudong International Airport" },
    SHA: { lat: 31.1981,   lon: 121.3362,  name: "Shanghai Hongqiao International Airport" },
    CAN: { lat: 23.3924,   lon: 113.2988,  name: "Guangzhou Baiyun International Airport" },
    CTU: { lat: 30.5785,   lon: 103.9471,  name: "Chengdu Tianfu International Airport" },
    XIY: { lat: 34.4471,   lon: 108.7516,  name: "Xi'an Xianyang International Airport" },
    MNL: { lat: 14.5086,   lon: 121.0197,  name: "Ninoy Aquino International Airport" },
    CGK: { lat: -6.1256,   lon: 106.6559,  name: "Soekarno–Hatta International Airport" },
    DPS: { lat: -8.7482,   lon: 115.1668,  name: "Ngurah Rai International Airport" },
    SUB: { lat: -7.3798,   lon: 112.7869,  name: "Juanda International Airport" },
    UPG: { lat: -5.0617,   lon: 119.5540,  name: "Sultan Hasanuddin International Airport" },
    SRG: { lat: -6.9727,   lon: 110.3742,  name: "Ahmad Yani International Airport" },
    SOC: { lat: -7.5161,   lon: 110.7572,  name: "Adi Soemarmo International Airport" },
    JOG: { lat: -7.7882,   lon: 110.4317,  name: "Adisutjipto International Airport" },
    MLG: { lat: -7.9267,   lon: 112.7145,  name: "Abdul Rachman Saleh Airport" },
    MDC: { lat: 1.5493,    lon: 124.9260,  name: "Sam Ratulangi International Airport" },
    BTH: { lat: 1.1213,    lon: 104.1192,  name: "Hang Nadim International Airport" },
    MEL: { lat: -37.6690,  lon: 144.8410,  name: "Melbourne Airport" },
    AKL: { lat: -37.0082,  lon: 174.7850,  name: "Auckland Airport" },
    PER: { lat: -31.9403,  lon: 115.9669,  name: "Perth Airport" },
    BNE: { lat: -27.3842,  lon: 153.1175,  name: "Brisbane Airport" },
    YVR: { lat: 49.1967,   lon: -123.1815, name: "Vancouver International Airport" },
    YUL: { lat: 45.4706,   lon: -73.7408,  name: "Montréal-Trudeau International Airport" },
    GIG: { lat: -22.8100,  lon: -43.2506,  name: "Rio de Janeiro Galeão International Airport" },
    SCL: { lat: -33.3930,  lon: -70.7858,  name: "Santiago Arturo Merino Benítez International Airport" },
    BOG: { lat: 4.7016,    lon: -74.1469,  name: "El Dorado International Airport" },
    LIM: { lat: -12.0219,  lon: -77.1143,  name: "Jorge Chávez International Airport" },
  };

  async function fetchMetar(icaoOrIata) {
    const cacheKey = `metar:${icaoOrIata}`;
    const cached = ssGet(cacheKey);
    if (cached !== undefined) return cached;
    try {
      const resp = await fetch(
        `https://aviationweather.gov/api/data/metar?ids=${encodeURIComponent(icaoOrIata)}&format=json&hours=1`,
        { headers: { Accept: "application/json" } }
      );
      if (!resp.ok) { ssSet(cacheKey, null, TTL.weather); return null; }
      const data = await resp.json();
      const result = Array.isArray(data) && data.length ? data[0] : null;
      ssSet(cacheKey, result, TTL.weather);
      return result;
    } catch (_) {
      ssSet(cacheKey, null, TTL.weather);
      return null;
    }
  }

  async function getAirportLocation(code) {
    if (!code) return null;
    const upper = code.toUpperCase();
    if (AIRPORT_DB[upper]) return AIRPORT_DB[upper];

    const cacheKey = `geo:${upper}`;
    const cached = ssGet(cacheKey);
    if (cached !== undefined) return cached;

    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(upper + " airport")}&format=json&limit=1&featuretype=aeroway`,
        { headers: { "Accept-Language": "en" } }
      );
      if (!resp.ok) { ssSet(cacheKey, null, TTL.geo); return null; }
      const results = await resp.json();
      if (results && results.length) {
        const loc = {
          lat: parseFloat(results[0].lat),
          lon: parseFloat(results[0].lon),
          name: results[0].display_name.split(",")[0],
        };
        ssSet(cacheKey, loc, TTL.geo);
        return loc;
      }
    } catch (_) {}
    ssSet(cacheKey, null, TTL.geo);
    return null;
  }

  async function fetchOpenMeteo(code) {
    const cacheKey = `meteo:${code}`;
    const cached = ssGet(cacheKey);
    if (cached !== undefined) return cached;
    try {
      const coords = await getAirportLocation(code);
      if (!coords) { ssSet(cacheKey, null, TTL.weather); return null; }
      const params = new URLSearchParams({
        latitude:  coords.lat,
        longitude: coords.lon,
        current:   "temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,visibility,surface_pressure",
        wind_speed_unit: "kn",
        forecast_days: "1",
      });
      const resp = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      if (!resp.ok) { ssSet(cacheKey, null, TTL.weather); return null; }
      const weatherData = await resp.json();
      weatherData.airportName = coords.name;
      ssSet(cacheKey, weatherData, TTL.weather);
      return weatherData;
    } catch (_) {
      ssSet(cacheKey, null, TTL.weather);
      return null;
    }
  }

  async function fetchFlights(flightNumber, apiKey, apiBase) {
    const cacheKey = `flight:${flightNumber}`;
    const cached = ssGet(cacheKey);
    if (cached !== undefined) return cached;
    const params = new URLSearchParams({ access_key: apiKey, flight_iata: encodeURIComponent(flightNumber) });
    const resp = await fetch(`${apiBase}?${params}`);
    if (!resp.ok) throw new Error(`API error ${resp.status}`);
    const data = await resp.json();
    if (data.error) throw new Error(data.error.message || "API error");
    const result = Array.isArray(data.data) ? data.data : [];
    ssSet(cacheKey, result, TTL.flight);
    return result;
  }

  window.OpenAeroCache = {
    get:    ssGet,
    set:    ssSet,
    prune,
    TTL,
    memoize,
    sanitize,
    /* data */
    AIRPORT_DB,
    fetchMetar,
    getAirportLocation,
    fetchOpenMeteo,
    fetchFlights,
  };
})();
