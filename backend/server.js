require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
//-middleware-
app.use(cors());
app.use(express.json());
//-routes-
const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);
//-error-handling-
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: 'Szerver hiba' });

})
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api/users`);
})