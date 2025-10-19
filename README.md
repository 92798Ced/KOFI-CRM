# GHL-Lite CRM

A lightweight, static CRM web application inspired by HighLevel (GHL). It delivers the essentials for managing leads, opportunities, automations, reviews, and insights without requiring a server or database.

## Features

- **Dashboard landing page** with new lead volume, lead source mix, review stats, conversion rate, calendar, and live weather forecast.
- **Workspace hub** (hamburger menu) with lead capture form, review intake + shareable links, and a ClickUp/Zapier-style automation builder.
- **Contact table** with quick filtering by lifecycle stage.
- **Opportunities board** that mirrors a simple Kanban pipeline with stage updates.
- **Automation builder** for defining trigger → action workflows and toggling them on/off.
- **Review intake** for Google and Facebook feedback with rolling averages.
- **AI-style analytics** summarising performance trends and suggesting next actions.
- **Calendar overlay** that plots opportunity due dates alongside a 5-day weather outlook.
- **Settings drawer** for timezone, time format, temperature unit, dark mode, accent colour, and CRM defaults.

All data is stored in `localStorage`, so the experience feels app-like without external dependencies.

## Getting started

The project is 100% static; you only need a web server capable of serving the three files in the repository.

```bash
# Option 1: use any static server (Python example)
python -m http.server 8000
# Then open http://localhost:8000 in your browser
```

For a Node-based workflow you can rely on [`serve`](https://www.npmjs.com/package/serve) or any equivalent utility:

```bash
npx serve .
```

> ℹ️ The app persists data locally in your browser. Use the “Reset  Data” control in the header to go back to the seeded dataset.

## Deployment

Because everything is static, deployment to Netlify, Render, Vercel, GitHub Pages, or any CDN is straightforward:

1. Push this repository to your remote of choice.
2. Configure the host to serve the repo root as a static site (no build command needed).
3. Set the publish directory to the repository root (`/`).

Netlify example configuration:

- **Build command:** _none_
- **Publish directory:** `.`

Render static site example:

- **Build command:** `null`
- **Publish directory:** `.`
- **Environment:** Static Site (serves via CDN automatically)

## Weather API

The dashboard queries [Open-Meteo](https://open-meteo.com/) for the 5-day forecast. No API key is required, but you will need outbound HTTPS access from your hosting environment. A graceful fallback is shown if the API cannot be reached. Temperature units respect the Fahrenheit/Celsius toggle in Settings.

## Project structure

```
├── app.js        # CRM logic, localStorage data model, rendering helpers
├── index.html    # Landing dashboard and UI markup
└── styles.css    # Responsive styling with dark/light themes and drawer overlays
```

## Extending the CRM

- Replace localStorage persistence with your preferred backend by swapping the data helpers in `app.js`.
- Connect the automations array to actual webhook calls or external services.
- Swap the static review logging form for API calls to Google Business Profile or Meta if credentials are available.

## License

MIT © 2025
