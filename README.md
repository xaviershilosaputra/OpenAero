# OpenAero - Flight Tracking Dashboard

OpenAero is a modern, all-in-one flight tracking dashboard built for the aviation community. It brings real-time flight status, live METARs, and interactive route maps into one unified, modern interface. 

OpenAero is designed to be the ultimate companion for planespotters, flight simmers, travellers, and aviation enthusiasts who want professional grade data at their fingertips.

## Features

* **Real Time Tracking:** Search any IATA flight number to get live status, departure/arrival times, and terminal/gate info.
* **Interactive Route Maps:** Visualizes the flight path using Leaflet.js with custom markers for origin and destination.
* **Airport Weather (METAR):** Fetches and decodes live aviation weather reports. Includes a one click copy feature for pasting METAR strings into flight sims or dispatch tools.
* **Avgeek Toolbelt:** A curated 3x2 dashboard linking directly to:
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

## Technical Stack

* **Frontend:** Vanilla JavaScript (ES6+), Tailwind CSS, HTML5.
* **Mapping:** Leaflet.js with OpenStreetMap tiles.
* **Icons:** Lucide Icons.
* **APIs:** * Aviationstack (Flight Data)
    * Aviation Weather Center (METAR Data)
    * Open-Meteo (Local Airport Weather)

## Getting Started

OpenAero is a client side application. No database or backend server is required.

### Prerequisites
1. Get a free API key from Aviationstack.

### Installation
1. **Clone the repository:**
   ```bash
   git clone [https://github.com/yourusername/openaero.git](https://github.com/yourusername/openaero.git)
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
