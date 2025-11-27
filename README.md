# C'ville GeoFinder - Multiplayer Edition

A real-time multiplayer GeoGuessr-style game featuring Charlottesville and UVA locations!

## Features

- **Real-time multiplayer** - Everyone plays simultaneously
- **Shareable room codes** - Share a link in Teams/Slack and teammates can join instantly
- **Lobby system** - See who's joined, adjust settings before starting
- **Live scoring** - See how many players have guessed, results after each round
- **25 Charlottesville/UVA locations** - The Rotunda, Downtown Mall, Scott Stadium, and more!

## How to Play

1. One person creates a game and shares the room code/link
2. Others join using the code
3. Host clicks "Start Game"
4. Everyone sees the same Street View location
5. When viewing time ends, the map appears - click to place your guess
6. Points awarded based on distance (closer = more points!)
7. See results after each round, final standings at the end

---

## Quick Deploy Options

### Option 1: Render.com (Recommended - Free Tier)

Render offers a free tier perfect for this game. Services sleep after 15 min of inactivity but wake up when someone visits.

1. Go to [render.com](https://render.com) and sign up (free, no credit card needed)
2. Click **"New +"** → **"Web Service"**
3. Choose **"Build and deploy from a Git repository"**
4. First, push this code to a GitHub repo:
   - Create a new repo on GitHub
   - Push these files to it
5. Connect your GitHub account and select the repo
6. Configure the service:
   - **Name**: `cville-geofinder` (or whatever you want)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Select **"Free"**
7. Click **"Create Web Service"**
8. Wait for deploy (2-3 minutes)
9. Your game will be live at `https://cville-geofinder.onrender.com`
10. Share this URL in Teams!

**Note**: The first visit after inactivity may take 30-60 seconds to wake up.

### Option 2: Fly.io (Pay-as-you-go, ~$0-5/month)

Fly.io is fast and reliable with global deployment.

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Sign up: `fly auth signup`
3. In the project folder, run: `fly launch`
4. Follow the prompts (choose a region close to Virginia like `iad`)
5. Deploy: `fly deploy`
6. Your app will be at `https://your-app-name.fly.dev`

### Option 3: Run Locally (For Testing or LAN Party)

```bash
# Make sure you have Node.js installed (v18+)
cd cville-geofinder-multiplayer
npm install
npm start
```

Then open `http://localhost:3000` in your browser.

For others to join on the same network, find your IP and share it (e.g., `http://192.168.1.100:3000`).

### Option 4: UVA/Department Server

If you have access to UVA web hosting or a department server:

1. Upload all files to your server
2. SSH in and run:
   ```bash
   npm install
   npm start
   ```
3. Or set up with PM2 for persistent hosting:
   ```bash
   npm install -g pm2
   pm2 start server.js --name geofinder
   ```

### Option 5: Any VPS (DigitalOcean, Linode, Vultr, etc.)

Most VPS providers have $4-6/month tiers that work great:

1. Create a small VPS (Ubuntu recommended)
2. Install Node.js: 
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
3. Clone/upload your files
4. Install PM2: `npm install -g pm2`
5. Start the app: `pm2 start server.js --name geofinder`
6. (Optional) Set up nginx reverse proxy for custom domain/HTTPS

---

## Game Settings

- **Rounds**: 3, 5, 7, or 10
- **View Time**: 15-60 seconds to study the Street View
- **Guess Time**: 15-60 seconds to place your guess on the map

## Scoring

- Maximum 5,000 points per round
- Points decrease with distance from actual location
- 0 points if more than 5 miles away
- No guess = 0 points

## Tips for Players

- Look for landmarks: UVA buildings, street signs, business names
- Note the terrain and architecture style
- Downtown has brick sidewalks, UVA has distinctive columns
- Check the sun position and shadows for orientation

---

## Customization

To add more locations, edit the `LOCATIONS` array in `server.js`:

```javascript
{ name: "Location Name", lat: 38.0000, lng: -78.5000, heading: 90 }
```

- `lat/lng`: Coordinates (find on Google Maps)
- `heading`: Camera direction (0=North, 90=East, 180=South, 270=West)

---

Enjoy the game! 🎯
