# Cursor Usage Tracker


A Chrome extension that extracts and visualizes your Cursor AI usage data with detailed analytics and cost tracking.


### Features

- Real-time usage analytics - Token counts, costs, and request tracking
- Subscription monitoring - Budget tracking with overage warnings
- Billing period tracking - Days remaining and daily averages
- Resizable dashboard - Full analytics in an independent window
- Privacy-first - All data stays local in your browser


# Quick Start

### Install

1. Download and extract the files
2. Go to chrome://extensions/ → Enable `Developer mode` → `Load unpacked`
3. Select the extension folder


### Use

- Visit your Cursor `Usage` page
- Click the extension icon → `Open Dashboard`
- Resize the window as needed


### What You'll See

- Subscription: eg. Pro Plan `$20` with `$15.80` remaining
- Usage: `13.5M` tokens, `$4.20` spent (21% of budget)
- Efficiency: `$0.000311` per token, `3.2M` tokens per dollar
- Projections: Monthly cost estimates and trend analysis


### Files
- `manifest.json`     - Extension config
- `popup.html/js`     - Extension popup  
- `dashboard.html/js` - Main analytics dashboard
- `content.js`        - Data extraction
- `background.js`     - Service worker


### Development

- Clone the repo
- Make changes
- Reload extension in chrome://extensions/
- Test on Cursor dashboard


### Notes

- Requires access to cursor.com usage page
- Manual refresh needed for latest data
- Assumes 15th of month billing cycle (adjustable)


<img width="1015" height="1213" alt="Screenshot 2025-09-20 at 18 13 41" src="https://github.com/user-attachments/assets/558d8ea8-d340-4896-8033-1db716e3d405" />

### Contributing
Issues and PRs welcome! This tool helps developers track their AI coding costs effectively.


⭐ Star this repo if it helped you track your Cursor usage!
