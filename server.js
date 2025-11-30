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

// Charlottesville/UVA locations - focused on campus and surrounding areas
const LOCATIONS = [
  // UVA Grounds - Core
  { name: "The Rotunda", lat: 38.03565, lng: -78.50355 },
  { name: "The Lawn - North", lat: 38.03465, lng: -78.50350 },
  { name: "The Lawn - South", lat: 38.03350, lng: -78.50350 },
  { name: "Old Cabell Hall", lat: 38.03318, lng: -78.50459 },
  { name: "Alderman Library", lat: 38.03692, lng: -78.50573 },
  { name: "Clemons Library", lat: 38.03629, lng: -78.50632 },
  { name: "Newcomb Hall", lat: 38.03538, lng: -78.50699 },
  { name: "Memorial Gym", lat: 38.03374, lng: -78.50766 },
  { name: "The Amphitheatre", lat: 38.03308, lng: -78.50336 },
  { name: "Pavilion Gardens", lat: 38.03414, lng: -78.50280 },
  
  // UVA Grounds - Academic
  { name: "Clark Hall", lat: 38.03293, lng: -78.50948 },
  { name: "Thornton Hall (Engineering)", lat: 38.03322, lng: -78.50999 },
  { name: "Rice Hall", lat: 38.03188, lng: -78.51089 },
  { name: "Olsson Hall", lat: 38.03263, lng: -78.51103 },
  { name: "Chemistry Building", lat: 38.03335, lng: -78.50842 },
  { name: "Physics Building", lat: 38.03383, lng: -78.50858 },
  { name: "Gilmer Hall (Bio)", lat: 38.03268, lng: -78.50696 },
  { name: "Bryan Hall", lat: 38.03439, lng: -78.50448 },
  { name: "Rouss Hall", lat: 38.03506, lng: -78.50433 },
  { name: "Minor Hall", lat: 38.03350, lng: -78.50590 },
  
  // UVA - Athletics
  { name: "Scott Stadium", lat: 38.03116, lng: -78.51387 },
  { name: "John Paul Jones Arena", lat: 38.04611, lng: -78.50680 },
  { name: "Davenport Field (Baseball)", lat: 38.04646, lng: -78.51161 },
  { name: "Klöckner Stadium (Soccer)", lat: 38.04493, lng: -78.51285 },
  { name: "Aquatic & Fitness Center", lat: 38.03210, lng: -78.51479 },
  { name: "Lambeth Field", lat: 38.03791, lng: -78.50941 },
  { name: "Carr's Hill Field", lat: 38.03627, lng: -78.50189 },
  { name: "Nameless Field", lat: 38.03876, lng: -78.50721 },
  
  // UVA - Residential & Other
  { name: "Hereford College", lat: 38.02984, lng: -78.51696 },
  { name: "Gooch/Dillard Dorms", lat: 38.02855, lng: -78.51404 },
  { name: "Observatory Hill", lat: 38.03112, lng: -78.52012 },
  { name: "Brandon Ave Dorms", lat: 38.03010, lng: -78.50928 },
  { name: "Lambeth Apartments", lat: 38.03753, lng: -78.51033 },
  { name: "Rugby Road", lat: 38.03867, lng: -78.50396 },
  { name: "Madison Bowl", lat: 38.03706, lng: -78.50435 },
  { name: "Beta Bridge", lat: 38.03629, lng: -78.50180 },
  { name: "UVA Chapel", lat: 38.03591, lng: -78.50302 },
  { name: "Peabody Hall", lat: 38.03475, lng: -78.50534 },
  
  // The Corner & Nearby
  { name: "The Corner - Main", lat: 38.03356, lng: -78.50052 },
  { name: "The Corner - Bodo's", lat: 38.03403, lng: -78.49979 },
  { name: "The Corner - Trinity Irish Pub", lat: 38.03327, lng: -78.50131 },
  { name: "The Corner - Christian's Pizza", lat: 38.03367, lng: -78.50108 },
  { name: "Elliewood Avenue", lat: 38.03470, lng: -78.49965 },
  { name: "Wertland Street", lat: 38.03615, lng: -78.49859 },
  { name: "14th Street", lat: 38.03502, lng: -78.49786 },
  { name: "JPA & Rugby Intersection", lat: 38.03904, lng: -78.50505 },
  
  // UVA Medical Center Area
  { name: "UVA Hospital - Main", lat: 38.02991, lng: -78.50093 },
  { name: "Emily Couric Cancer Center", lat: 38.02849, lng: -78.50012 },
  { name: "UVA Children's Hospital", lat: 38.03025, lng: -78.50201 },
  { name: "Medical School", lat: 38.03137, lng: -78.50148 },
  { name: "Lee Street", lat: 38.03008, lng: -78.49843 },
  
  // Downtown Charlottesville
  { name: "Downtown Mall - East", lat: 38.02980, lng: -78.47655 },
  { name: "Downtown Mall - West", lat: 38.02933, lng: -78.48219 },
  { name: "Downtown Mall - Center", lat: 38.02960, lng: -78.47969 },
  { name: "Charlottesville Pavilion", lat: 38.02873, lng: -78.47853 },
  { name: "City Hall", lat: 38.02978, lng: -78.47666 },
  { name: "Main Street (off mall)", lat: 38.03028, lng: -78.48463 },
  { name: "Water Street", lat: 38.02887, lng: -78.47737 },
  { name: "Market Street", lat: 38.03106, lng: -78.47923 },
  
  // Belmont
  { name: "Belmont Bridge", lat: 38.02743, lng: -78.48248 },
  { name: "Dairy Market", lat: 38.02509, lng: -78.47893 },
  { name: "IX Art Park", lat: 38.02432, lng: -78.47922 },
  { name: "Avon Street", lat: 38.02347, lng: -78.47796 },
  { name: "Monticello Road", lat: 38.02541, lng: -78.48054 },
  
  // Other Charlottesville
  { name: "Barracks Road", lat: 38.04530, lng: -78.50573 },
  { name: "Stonefield", lat: 38.05692, lng: -78.49841 },
  { name: "Emmet Street", lat: 38.04243, lng: -78.50242 },
  { name: "Preston Ave", lat: 38.04120, lng: -78.48935 },
  { name: "Cherry Avenue", lat: 38.02671, lng: -78.49175 },
  { name: "Fontaine Ave", lat: 38.02318, lng: -78.50851 },
  { name: "5th Street", lat: 38.02438, lng: -78.48833 },
  { name: "Ridge Street", lat: 38.02711, lng: -78.48541 },
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

// Calculate year bonus points
function calculateYearPoints(guessedYear, actualYear) {
  if (!guessedYear || !actualYear) return 0;
  const diff = Math.abs(guessedYear - actualYear);
  if (diff === 0) return 1000;
  if (diff === 1) return 700;
  if (diff === 2) return 400;
  if (diff === 3) return 100;
  return 0;
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
    
    // Shuffle and pick locations for this game
    room.locations = shuffleArray(LOCATIONS).slice(0, room.settings.rounds);

    startRound(room);
  });

  // Submit a guess
  socket.on('submitGuess', ({ lat, lng, year }) => {
    const room = rooms.get(socket.roomCode);
    if (!room || room.state !== 'guessing') return;

    const player = room.players.get(socket.id);
    if (!player || player.hasGuessed) return;

    const location = room.currentLocation;
    const distance = calculateDistance(lat, lng, location.lat, location.lng);
    const distancePoints = calculatePoints(distance);
    const yearPoints = calculateYearPoints(year, room.currentYear);
    const totalPoints = distancePoints + yearPoints;

    room.roundGuesses.set(socket.id, {
      lat,
      lng,
      year,
      distance,
      distancePoints,
      yearPoints,
      points: totalPoints
    });

    player.hasGuessed = true;
    player.score += totalPoints;

    // Notify the player their guess was received
    socket.emit('guessReceived', { distance, distancePoints, yearPoints, points: totalPoints });

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

  // Host reports the actual year of the Street View imagery
  socket.on('reportYear', ({ year }) => {
    const room = rooms.get(socket.roomCode);
    if (!room || socket.id !== room.host) return;
    room.currentYear = year;
    console.log(`Round ${room.currentRound} year set to: ${year}`);
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
  room.currentYear = null; // Will be set when client reports the actual year

  const viewDuration = room.settings.viewTime * 1000;
  room.timerEnd = Date.now() + viewDuration;

  io.to(room.code).emit('roundStart', {
    round: room.currentRound,
    totalRounds: room.settings.rounds,
    location: {
      lat: room.currentLocation.lat,
      lng: room.currentLocation.lng
    },
    phase: 'viewing',
    timerEnd: room.timerEnd
  });

  room.timer = setTimeout(() => {
    startGuessing(room);
  }, viewDuration);
}

// Host reports the actual year of the Street View imagery
function handleYearReport(socket, year) {
  const room = rooms.get(socket.roomCode);
  if (!room || socket.id !== room.host) return;
  room.currentYear = year;
  console.log(`Round ${room.currentRound} year set to: ${year}`);
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
      distancePoints: guess ? guess.distancePoints : 0,
      yearPoints: guess ? guess.yearPoints : 0,
      distance: guess ? guess.distance : null,
      guessedYear: guess ? guess.year : null,
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
    actualYear: room.currentYear,
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
