const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Charlottesville/UVA locations
const LOCATIONS = [
  { name: "The Rotunda", lat: 38.0356, lng: -78.5034, heading: 180 },
  { name: "The Corner", lat: 38.0343, lng: -78.5010, heading: 90 },
  { name: "Downtown Mall - East End", lat: 38.0298, lng: -78.4763, heading: 270 },
  { name: "Downtown Mall - West End", lat: 38.0293, lng: -78.4830, heading: 90 },
  { name: "Scott Stadium", lat: 38.0311, lng: -78.5138, heading: 45 },
  { name: "Barracks Road Shopping Center", lat: 38.0453, lng: -78.5057, heading: 180 },
  { name: "UVA Medical Center", lat: 38.0297, lng: -78.5009, heading: 0 },
  { name: "Lambeth Field", lat: 38.0378, lng: -78.5093, heading: 135 },
  { name: "Grounds - Old Cabell Hall", lat: 38.0352, lng: -78.5054, heading: 0 },
  { name: "Charlottesville Amtrak Station", lat: 38.0317, lng: -78.4916, heading: 90 },
  { name: "Dairy Market", lat: 38.0250, lng: -78.4792, heading: 180 },
  { name: "IX Art Park", lat: 38.0242, lng: -78.4795, heading: 270 },
  { name: "Belmont Bridge", lat: 38.0275, lng: -78.4825, heading: 45 },
  { name: "McIntire Park", lat: 38.0420, lng: -78.4870, heading: 180 },
  { name: "Alderman Library", lat: 38.0365, lng: -78.5055, heading: 90 },
  { name: "Memorial Gym", lat: 38.0338, lng: -78.5075, heading: 0 },
  { name: "Newcomb Hall", lat: 38.0355, lng: -78.5070, heading: 270 },
  { name: "Clark Hall", lat: 38.0328, lng: -78.5095, heading: 45 },
  { name: "Rugby Road", lat: 38.0385, lng: -78.5038, heading: 180 },
  { name: "Amphitheater", lat: 38.0348, lng: -78.5020, heading: 90 },
  { name: "John Paul Jones Arena", lat: 38.0461, lng: -78.5068, heading: 0 },
  { name: "Fontaine Research Park", lat: 38.0190, lng: -78.5150, heading: 90 },
  { name: "Stonefield", lat: 38.0570, lng: -78.4980, heading: 180 },
  { name: "Pantops Shopping Center", lat: 38.0350, lng: -78.4570, heading: 270 },
  { name: "Lee Park / Market Street Park", lat: 38.0310, lng: -78.4790, heading: 0 }
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

// Calculate points based on distance
function calculatePoints(distance) {
  // 5000 points max, 0 points at 5 miles
  return Math.max(0, Math.round(5000 * (1 - distance / 5)));
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
    room.locations = shuffleArray(LOCATIONS).slice(0, room.settings.rounds);

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
    if (!room) return;

    const player = room.players.get(socket.id);
    if (player) {
      player.readyForNext = true;
    }

    // Check if all players are ready
    const allReady = Array.from(room.players.values()).every(p => p.readyForNext);
    if (allReady || socket.id === room.host) {
      // Reset ready status
      room.players.forEach(p => p.readyForNext = false);
      
      if (room.currentRound >= room.settings.rounds) {
        showFinalResults(room);
      } else {
        room.currentRound++;
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
});
