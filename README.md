# OpenAero - Flight Tracking Dashboard

OpenAero is a modern, all-in-one flight tracking dashboard built for the aviation community. It brings real-time flight status, live METARs, and interactive route maps into one unified, modern interface. 

OpenAero is designed to be the ultimate companion for planespotters, flight simmers, travellers, and aviation enthusiasts who want professional grade data at their fingertips.

## Features

* **Real Time Tracking:** Search any IATA flight number to get live status, departure/arrival times, and terminal/gate info.
* **Interactive Route Maps:** Visualizes the flight path using Leaflet.js with custom markers for origin and destination.
* **Airport Weather (METAR):** Fetches and decodes live aviation weather reports. Includes a one click copy feature for pasting METAR strings into flight sims or dispatch tools.
* **Avgeek Toolbelt:** A curated toolkit that links directly to:
    * **FlightRadar24 and FlightAware** for deep radar data.
    * **Planespotters.net** for aircraft photos and history.
    * **LiveATC** for real time radio feeds.
    * **SkyVector** for world aeronautical charts.
    * **Terminal Mode** for a retro, CLI style tracking experience.
* **Responsive Design:** A glassmorphism UI that looks great on desktops, tablets, and mobile devices.

## Future Updates

* **Global Hub Clock:** Real-time local time displays for major international airport hubs.
* **Integration with navigation apps:** Direct links to digital mapping applications to assist with ground travel and airport transitions.
* **Additional Aircraft Insights:** Expanded airframe data including Manufacturer Serial Number (MSN), aircraft age, and historical unit ownership.

## Optimization

### Shared Application Level Caching
I used a cross-page persistence layer using sessionStorage to bridge the GUI (main site) and the Terminal. This means both pages share a single source of truth for API data. I wrapped the AviationStack and Open-Meteo logic in a TTL governed system and successfully achieves a 100 percent reduction in redundant API calls when users switch between views. When people look up a flight in the GUI, the data is already warm and ready when they run the same command in the Terminal.

* **Implementation:** I created cache.js to manage a shared pool with specific expiration timers: 5 minutes for flights, 10 minutes for weather, and 60 minutes for airport coordinates.
* **Results:** This update eliminated unnecessary network latency for repeated searches and conserved API credits by serving cached data from the current session.

### Modular Architecture and Logic Deduplication
I refactored the project to move all heavy lifting into a centralized `cache.js` module. Before, the `AIRPORT_DB` and core functions were duplicated across multiple files with inconsistent data (messy duplicates). I fixed the problem by decoupling the UI from the data-fetching layer (the Terminal and GUI now act as "clients" that pull only what they need from the shared backbone).

* **Implementation:** I combined the IATA/ICAO databases into one object and removed over 200 lines of duplicate code. I also moved all core utilities like `sanitize()`, `memoize()`, and `fetchMetar()` to the global cache module.
* **Results:** The bundle size and memory overhead is significantly reduced. My new "one source of truth" system also makes the system easier to maintain and update in the future.

## Technical Stack

* **Frontend:** Vanilla JavaScript (ES6+), Tailwind CSS, HTML5.
* **Mapping:** Leaflet.js with OpenStreetMap tiles.
* **Icons:** Lucide Icons.
* **APIs:** * Aviationstack (Flight Data)
    * Aviation Weather Center (METAR Data)
    * Open-Meteo (Local Airport Weather)

## OpenAero CLI
Prefer to use a proper terminal? OpenAero now features a native Windows CLI tool built in C++.
* **Fast & Lightweight:** No browser required.
* **Flight Search:** Instant telemetry via `openaero search <flight_id>`.
* **Weather:** Real-time METARs via `openaero weather <ICAO>`.

[Download the latest CLI release here](https://github.com/xaviershilosaputra/OpenAero/releases/latest)

## Getting Started

OpenAero is a client side application. No database or backend server is required.

### Prerequisites
1. Get a free API key from Aviationstack.

### Installation
1. **Clone the repository:**
   ```bash
   git clone [https://github.com/xaviershilosaputra/OpenAero.git](https://github.com/xaviershilosaputra/OpenAero.git)
   cd openaero

## Contributing

Contributions are welcome and encouraged. If you want to fix a bug, add new features, improve accessibility, refine documentation, or create a new theme, this is the place to do it.

For full guidelines, rules, and best practices, please read the contributing guide:

**[CONTRIBUTING.md](docs/CONTRIBUTING.md)**

## License & Attribution

This project is licensed under the **MIT License**.

- You are **free** to learn from, modify, customize, and remix this code.
- You are **free** to use this for commercial purposes.
- **Attribution is Required**: You must maintain proper recognition and attribution to the original author. You may modify the footer branding as long as the attribution remains clear.
