const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const moment = require('moment');

// Store the expiration time for each user
const userExpirationTimes = new Map();

// Set the trial duration (in minutes)
const TRIAL_DURATION = 1440; // 24 hours

// Middleware
app.use(express.json());

// API endpoint to start the trial for a user
app.post('/api/start-trial', (req, res) => {
    const { userId } = req.body;
  
    // Check if the trial has already started for the user
    if (userExpirationTimes.has(userId)) {
      const expirationTime = userExpirationTimes.get(userId);
      const now = moment();
      const remainingTime = moment(expirationTime).diff(now, 'seconds');
  
      if (remainingTime <= 0) {
        return res.json({ message: 'Trial has expired', remainingTime: 0 });
      } else {
        const formattedRemainingTime = formatRemainingTime(remainingTime);
        return res.json({ message: 'Trial has already started', remainingTime: formattedRemainingTime, expirationTime: formatExpirationTime(expirationTime) });
      }
    }
  
    // Calculate the expiration time for the user
    const now = moment();
    const expirationTime = now.add(TRIAL_DURATION, 'minutes').toDate();
  
    // Store the expiration time for the user
    userExpirationTimes.set(userId, expirationTime);
  
    // Send the remaining time to the connected client for the user
    const remainingTime = formatRemainingTime(expirationTime);
    io.to(userId).emit('remaining_time', remainingTime);
  
    res.json({ message: 'Trial started successfully', remainingTime, expirationTime: formatExpirationTime(expirationTime) });
  });
// API endpoint to check the remaining trial time for a user
app.get('/api/remaining-time/:userId', (req, res) => {
  const { userId } = req.params;

  // Check if the trial has started for the user
  if (!userExpirationTimes.has(userId)) {
    return res.status(400).json({ error: 'Trial has not started for the user' });
  }

  const expirationTime = userExpirationTimes.get(userId);
  const now = moment();
  const remainingTime = moment(expirationTime).diff(now, 'seconds');

  if (remainingTime <= 0) {
    return res.json({ remainingTime: 0 });
  }

  res.json({ remainingTime });
});

// Socket.IO connection event
io.on('connection', (socket) => {
  console.log('Client connected');

  // Associate the socket with the user ID
  socket.on('subscribe', (userId) => {
    socket.join(userId);
    console.log(`Client subscribed to user ${userId}`);

    // Send the remaining time to the newly connected client for the user
    sendRemainingTime(userId, socket);
  });

  // Heartbeat mechanism
  socket.on('ping', () => {
    socket.emit('pong');
  });

  // Handle client disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Function to send the remaining time to connected clients for a user
function sendRemainingTime(userId, socket) {
  if (userExpirationTimes.has(userId)) {
    const expirationTime = userExpirationTimes.get(userId);
    const now = moment();
    const remainingTime = moment(expirationTime).diff(now, 'seconds');

    if (remainingTime <= 0) {
      socket.emit('is_expired', true);
    } else {
      const formattedRemainingTime = formatRemainingTime(remainingTime);
      socket.emit('remaining_time', formattedRemainingTime);
    }
  }
}

// Function to check if the trial has expired for all users
function checkTrialExpirations() {
  userExpirationTimes.forEach((expirationTime, userId) => {
    const now = moment();
    const remainingTime = moment(expirationTime).diff(now, 'seconds');

    if (remainingTime <= 0) {
      io.to(userId).emit('is_expired', true);
      userExpirationTimes.delete(userId);
    } else {
      io.to(userId).emit('remaining_time', formatRemainingTime(remainingTime));
    }
  });
}

// Start checking for trial expiration every minute
setInterval(checkTrialExpirations, 60000);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Helper function to format expiration time
function formatExpirationTime(date) {
  return moment(date).format('YYYY-MM-DD HH:mm');
}

// Helper function to format remaining time
function formatRemainingTime(remainingSeconds) {
  const duration = moment.duration(remainingSeconds, 'seconds');
  const days = duration.days();
  const hours = duration.hours();
  const minutes = duration.minutes();
  const seconds = duration.seconds();

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// Start the server
const port = process.env.PORT || 3001;
const ipAddress = '0.0.0.0'; // Listen on all available network interfaces
server.listen(port, ipAddress, () => {
  console.log(`Server is running on IP ${ipAddress} and port ${port}`);
});