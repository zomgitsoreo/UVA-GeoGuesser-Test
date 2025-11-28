const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Explicitly serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Charlottesville/UVA locations - prioritizing indoor Street Views where available
const LOCATIONS = [
  // Indoor locations (harder, more interesting)
  { name: "Inside the Rotunda", lat: 38.03545, lng: -78.50337, heading: 180, indoor: true },
  { name: "Alderman Library Reading Room", lat: 38.03679, lng: -78.50567, heading: 270, indoor: true },
  { name: "Newcomb Hall Interior", lat: 38.03538, lng: -78.50699, heading: 90, indoor: true },
  { name: "The Corner - Littlejohn's Deli", lat: 38.03356, lng: -78.50052, heading: 45, indoor: true },
  { name: "Dairy Market Food Hall", lat: 38.02509, lng: -78.47893, heading: 180, indoor: true },
  { name: "IX Art Park Gallery", lat: 38.02432, lng: -78.47922, heading: 0, indoor: true },
  { name: "Downtown Mall - Mudhouse Coffee", lat: 38.02963, lng: -78.48161, heading: 90, indoor: true },
  { name: "Charlottesville City Market", lat: 38.02912, lng: -78.47704, heading: 270, indoor: true },
  { name: "The Jefferson Theater Lobby", lat: 38.02943, lng: -78.48054, heading: 180, indoor: true },
  { name: "Violet Crown Cinema", lat: 38.02994, lng: -78.48209, heading: 0, indoor: true },
  { name: "McGuffey Art Center", lat: 38.03089, lng: -78.48441, heading: 90, indoor: true },
  { name: "C'ville Coffee Downtown", lat: 38.02947, lng: -78.47742, heading: 45, indoor: true },
  { name: "Brazos Tacos", lat: 38.02882, lng: -78.48292, heading: 180, indoor: true },
  { name: "John Paul Jones Arena Concourse", lat: 38.04583, lng: -78.50694, heading: 270, indoor: true },
  { name: "Regal Stonefield Cinema", lat: 38.05712, lng: -78.49813, heading: 0, indoor: true },
  
  // Outdoor locations (mix of easy and tricky)
  { name: "The Rotunda - Outside", lat: 38.0356, lng: -78.5034, heading: 180, indoor: false },
  { name: "The Lawn", lat: 38.0346, lng: -78.5035, heading: 0, indoor: false },
  { name: "The Corner", lat: 38.0343, lng: -78.5010, heading: 90, indoor: false },
  { name: "Scott Stadium", lat: 38.0311, lng: -78.5138, heading: 45, indoor: false },
  { name: "Downtown Mall Fountain", lat: 38.0298, lng: -78.4800, heading: 270, indoor: false },
  { name: "Belmont Bridge", lat: 38.0275, lng: -78.4825, heading: 45, indoor: false },
  { name: "UVA Medical Center", lat: 38.0297, lng: -78.5009, heading: 0, indoor: false },
  { name: "Barracks Road Shopping Center", lat: 38.0453, lng: -78.5057, heading: 180, indoor: false },
  { name: "Rugby Road", lat: 38.0385, lng: -78.5038, heading: 180, indoor: false },
  { name: "Lambeth Field", lat: 38.0378, lng: -78.5093, heading: 135, indoor: false },
];

// Game rooms storage
const rooms = new Map();

// Generate a random room code
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate points based on distance - exponential decay for small area precision
function calculatePoints(distance) {
  // Exponential decay: much more sensitive at close distances
  // 0 miles = 5000, 0.1 miles = ~4000, 0.25 miles = ~2800, 0.5 miles = ~1500, 1 mile = ~450, 2+ miles = near 0
  const points = Math.round(5000 * Math.exp(-3 * distance));
  return Math.max(0, points);
}

// Shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create a new room
  socket.on('createRoom', ({ playerName, settings }) => {
    const roomCode = generateRoomCode();
    
    const room = {
      code: roomCode,
      host: socket.id,
      players: new Map(),
      settings: {
        rounds: settings.rounds || 5,
        viewTime: settings.viewTime || 30,
        guessTime: settings.guessTime || 30
      },
      state: 'lobby', // lobby, viewing, guessing, results, final
      currentRound: 0,
      locations: shuffleArray(LOCATIONS),
      currentLocation: null,
      roundGuesses: new Map(),
      timerEnd: null
    };

    room.players.set(socket.id, {
      id: socket.id,
      name: playerName,
      score: 0,
      isHost: true,
      hasGuessed: false
    });

    rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.roomCode = roomCode;

    socket.emit('roomCreated', {
      roomCode,
      players: Array.from(room.players.values()),
      settings: room.settings,
      isHost: true
    });

    console.log(`Room ${roomCode} created by ${playerName}`);
  });

  // Join an existing room
  socket.on('joinRoom', ({ roomCode, playerName }) => {
    const room = rooms.get(roomCode.toUpperCase());

    if (!room) {
      socket.emit('joinError', { message: 'Room not found. Check the code and try again.' });
      return;
    }

    if (room.state !== 'lobby') {
      socket.emit('joinError', { message: 'Game already in progress. Wait for the next game.' });
      return;
    }

    if (room.players.size >= 20) {
      socket.emit('joinError', { message: 'Room is full (max 20 players).' });
      return;
    }

    room.players.set(socket.id, {
      id: socket.id,
      name: playerName,
      score: 0,
      isHost: false,
      hasGuessed: false
    });

    socket.join(roomCode.toUpperCase());
    socket.roomCode = roomCode.toUpperCase();

    socket.emit('roomJoined', {
      roomCode: room.code,
      players: Array.from(room.players.values()),
      settings: room.settings,
      isHost: false
    });

    // Notify all players in the room
    io.to(room.code).emit('playerJoined', {
      players: Array.from(room.players.values())
    });

    console.log(`${playerName} joined room ${roomCode}`);
  });

  // Update room settings (host only)
  socket.on('updateSettings', ({ settings }) => {
    const room = rooms.get(socket.roomCode);
    if (!room || room.host !== socket.id) return;

    room.settings = { ...room.settings, ...settings };
    io.to(room.code).emit('settingsUpdated', { settings: room.settings });
  });

  // Start the game (host only)
  socket.on('startGame', () => {
    const room = rooms.get(socket.roomCode);
    if (!room || room.host !== socket.id) return;
    if (room.players.size < 1) return;

    room.state = 'viewing';
    room.currentRound = 1;
    
    // Prioritize indoor locations (70% indoor, 30% outdoor)
    const indoorLocations = LOCATIONS.filter(loc => loc.indoor);
    const outdoorLocations = LOCATIONS.filter(loc => !loc.indoor);
    
    const numRounds = room.settings.rounds;
    const numIndoor = Math.ceil(numRounds * 0.7);
    const numOutdoor = numRounds - numIndoor;
    
    // Shuffle and pick from each category
    const shuffledIndoor = shuffleArray(indoorLocations).slice(0, numIndoor);
    const shuffledOutdoor = shuffleArray(outdoorLocations).slice(0, numOutdoor);
    
    // Combine and shuffle the final selection
    room.locations = shuffleArray([...shuffledIndoor, ...shuffledOutdoor]);

    startRound(room);
  });

  // Submit a guess
  socket.on('submitGuess', ({ lat, lng }) => {
    const room = rooms.get(socket.roomCode);
    if (!room || room.state !== 'guessing') return;

    const player = room.players.get(socket.id);
    if (!player || player.hasGuessed) return;

    const location = room.currentLocation;
    const distance = calculateDistance(lat, lng, location.lat, location.lng);
    const points = calculatePoints(distance);

    room.roundGuesses.set(socket.id, {
      lat,
      lng,
      distance,
      points
    });

    player.hasGuessed = true;
    player.score += points;

    // Notify the player their guess was received
    socket.emit('guessReceived', { distance, points });

    // Notify everyone of guess count
    const guessCount = room.roundGuesses.size;
    const totalPlayers = room.players.size;
    io.to(room.code).emit('guessUpdate', { guessCount, totalPlayers });

    // If all players have guessed, end the round early
    if (guessCount >= totalPlayers) {
      clearTimeout(room.timer);
      endGuessing(room);
    }
  });

  // Player requests next round (after viewing results)
  socket.on('readyForNext', () => {
    const room = rooms.get(socket.roomCode);
    if (!room) {
      console.log('readyForNext: room not found for', socket.roomCode);
      return;
    }

    // Only process if we're in results state
    if (room.state !== 'results') {
      console.log('readyForNext: wrong state', room.state);
      return;
    }

    const player = room.players.get(socket.id);
    if (player) {
      player.readyForNext = true;
    }

    // Count ready players
    const readyCount = Array.from(room.players.values()).filter(p => p.readyForNext).length;
    const totalPlayers = room.players.size;
    
    console.log(`Ready: ${readyCount}/${totalPlayers}, isHost: ${socket.id === room.host}`);

    // Broadcast ready count to all players
    io.to(room.code).emit('readyUpdate', { readyCount, totalPlayers });

    // Check if all players are ready OR if host clicked
    const allReady = readyCount >= totalPlayers;
    if (allReady || socket.id === room.host) {
      // Reset ready status
      room.players.forEach(p => p.readyForNext = false);
      
      if (room.currentRound >= room.settings.rounds) {
        console.log('Showing final results');
        showFinalResults(room);
      } else {
        room.currentRound++;
        console.log('Starting round', room.currentRound);
        startRound(room);
      }
    }
  });

  // Return to lobby (host only)
  socket.on('returnToLobby', () => {
    const room = rooms.get(socket.roomCode);
    if (!room || room.host !== socket.id) return;

    // Reset game state
    room.state = 'lobby';
    room.currentRound = 0;
    room.roundGuesses.clear();
    room.players.forEach(p => {
      p.score = 0;
      p.hasGuessed = false;
      p.readyForNext = false;
    });

    io.to(room.code).emit('returnedToLobby', {
      players: Array.from(room.players.values()),
      settings: room.settings
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    if (socket.roomCode) {
      const room = rooms.get(socket.roomCode);
      if (room) {
        room.players.delete(socket.id);

        if (room.players.size === 0) {
          // Delete empty room
          rooms.delete(socket.roomCode);
          console.log(`Room ${socket.roomCode} deleted (empty)`);
        } else {
          // If host left, assign new host
          if (room.host === socket.id) {
            const newHost = room.players.keys().next().value;
            room.host = newHost;
            room.players.get(newHost).isHost = true;
          }

          io.to(room.code).emit('playerLeft', {
            players: Array.from(room.players.values())
          });
        }
      }
    }
  });
});

function startRound(room) {
  room.state = 'viewing';
  room.roundGuesses.clear();
  room.players.forEach(p => {
    p.hasGuessed = false;
  });

  room.currentLocation = room.locations[room.currentRound - 1];

  const viewDuration = room.settings.viewTime * 1000;
  room.timerEnd = Date.now() + viewDuration;

  io.to(room.code).emit('roundStart', {
    round: room.currentRound,
    totalRounds: room.settings.rounds,
    location: {
      lat: room.currentLocation.lat,
      lng: room.currentLocation.lng,
      heading: room.currentLocation.heading
    },
    phase: 'viewing',
    timerEnd: room.timerEnd
  });

  room.timer = setTimeout(() => {
    startGuessing(room);
  }, viewDuration);
}

function startGuessing(room) {
  room.state = 'guessing';

  const guessDuration = room.settings.guessTime * 1000;
  room.timerEnd = Date.now() + guessDuration;

  io.to(room.code).emit('phaseChange', {
    phase: 'guessing',
    timerEnd: room.timerEnd
  });

  room.timer = setTimeout(() => {
    endGuessing(room);
  }, guessDuration);
}

function endGuessing(room) {
  room.state = 'results';

  // Compile results
  const results = [];
  room.players.forEach((player, id) => {
    const guess = room.roundGuesses.get(id);
    results.push({
      id,
      name: player.name,
      score: player.score,
      roundPoints: guess ? guess.points : 0,
      distance: guess ? guess.distance : null,
      guess: guess ? { lat: guess.lat, lng: guess.lng } : null
    });
  });

  // Sort by round points
  results.sort((a, b) => b.roundPoints - a.roundPoints);

  io.to(room.code).emit('roundResults', {
    round: room.currentRound,
    totalRounds: room.settings.rounds,
    location: {
      name: room.currentLocation.name,
      lat: room.currentLocation.lat,
      lng: room.currentLocation.lng
    },
    results
  });
}

function showFinalResults(room) {
  room.state = 'final';

  const results = Array.from(room.players.values())
    .map(p => ({
      name: p.name,
      score: p.score
    }))
    .sort((a, b) => b.score - a.score);

  io.to(room.code).emit('gameOver', { results });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`C'ville GeoFinder server running on port ${PORT}`);
  console.log(`Static files served from: ${path.join(__dirname, 'public')}`);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});
