const express   = require('express');
const http      = require('http');
const { Server } = require('socket.io');
const cors      = require('cors');
const mongoose  = require('mongoose');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// ── MongoDB setup ─────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eventsphere_parking';

const ZoneSchema = new mongoose.Schema({
  zoneId:   { type: String, required: true, unique: true },
  name:     String,
  occupied: { type: Number, default: 0 },
  capacity: { type: Number, default: 100 },
});
const Zone = mongoose.model('ParkingZone', ZoneSchema);

const EventSchema = new mongoose.Schema({
  zone:      String,
  type:      { type: String, enum: ['info','warning','critical'], default: 'info' },
  message:   String,
  timestamp: { type: Date, default: Date.now },
  count:     Number,
});
const ActivityLog = mongoose.model('ParkingActivity', EventSchema);

// ── Seed zones on first run ───────────────────────────────────────────────────
async function seedZones() {
  const count = await Zone.countDocuments();
  if (count === 0) {
    await Zone.insertMany([
      { zoneId: 'A', name: 'Parking Lot A', occupied: 42, capacity: 100 },
      { zoneId: 'B', name: 'Parking Lot B', occupied: 18, capacity: 100 },
    ]);
    console.log('✓ Seeded Parking A + B');
  }
}

// ── In-memory fallback (used if MongoDB offline) ──────────────────────────────
let mem = { A: 42, B: 18 };

function levelFor(occ, cap) {
  const p = (occ / cap) * 100;
  return p >= 95 ? 'critical' : p >= 70 ? 'warning' : 'info';
}

// ── REST routes ───────────────────────────────────────────────────────────────
app.get('/zones', async (req, res) => {
  try {
    const zones = await Zone.find();
    res.json(zones);
  } catch {
    res.json([
      { zoneId:'A', name:'Parking Lot A', occupied: mem.A, capacity: 100 },
      { zoneId:'B', name:'Parking Lot B', occupied: mem.B, capacity: 100 },
    ]);
  }
});

app.post('/event', async (req, res) => {
  const { zone, delta } = req.body;   // delta = +N enter, -N exit
  if (!zone || delta === undefined) return res.status(400).json({ error: 'zone and delta required' });
  try {
    const z    = await Zone.findOne({ zoneId: zone });
    if (!z) return res.status(404).json({ error: 'zone not found' });
    z.occupied = Math.max(0, Math.min(z.capacity, z.occupied + delta));
    await z.save();
    mem[zone]  = z.occupied;
    const msg  = `${Math.abs(delta)} vehicle${Math.abs(delta)>1?'s':''} ${delta>0?'entered':'exited'} Lot ${zone} — ${z.occupied}/${z.capacity}`;
    const type = levelFor(z.occupied, z.capacity);
    const ev   = await ActivityLog.create({ zone, type, message: msg, count: Math.abs(delta) });
    const payload = { A: mem.A, B: mem.B };
    io.emit('zone_update', payload);
    io.emit('activity', { id: ev._id, zone, type, message: msg, timestamp: ev.timestamp, count: Math.abs(delta) });
    res.json({ zone, occupied: z.occupied, capacity: z.capacity });
  } catch (err) {
    // fallback without DB
    mem[zone] = Math.max(0, Math.min(100, (mem[zone] || 0) + delta));
    const msg  = `${Math.abs(delta)} vehicle${Math.abs(delta)>1?'s':''} ${delta>0?'entered':'exited'} Lot ${zone}`;
    const type = levelFor(mem[zone], 100);
    const fev  = { id: Date.now().toString(), zone, type, message: msg, timestamp: new Date(), count: Math.abs(delta) };
    io.emit('zone_update', { A: mem.A, B: mem.B });
    io.emit('activity', fev);
    res.json({ zone, occupied: mem[zone], capacity: 100 });
  }
});

app.post('/reset', async (req, res) => {
  try {
    await Zone.updateMany({}, { occupied: 0 });
  } catch {}
  mem = { A: 0, B: 0 };
  io.emit('zone_update', { A: 0, B: 0 });
  io.emit('activity', { id: Date.now().toString(), zone:'A', type:'info', message:'All zones reset to 0', timestamp: new Date() });
  res.json({ ok: true });
});

app.get('/activity', async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ timestamp: -1 }).limit(50);
    res.json(logs);
  } catch {
    res.json([]);
  }
});

// ── Socket.IO events ──────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('get_zones', async () => {
    try {
      const zones = await Zone.find();
      const data  = { A: zones.find(z=>z.zoneId==='A')?.occupied ?? mem.A,
                      B: zones.find(z=>z.zoneId==='B')?.occupied ?? mem.B };
      socket.emit('zone_update', data);
    } catch {
      socket.emit('zone_update', { A: mem.A, B: mem.B });
    }
  });

  socket.on('update_zone', async ({ zone, occupied }) => {
    try {
      const z = await Zone.findOneAndUpdate({ zoneId: zone }, { occupied }, { new: true });
      if (z) mem[zone] = z.occupied;
      else mem[zone] = occupied;
    } catch {
      mem[zone] = occupied;
    }
    io.emit('zone_update', { A: mem.A, B: mem.B });
  });

  socket.on('reset', async () => {
    try { await Zone.updateMany({}, { occupied: 0 }); } catch {}
    mem = { A: 0, B: 0 };
    io.emit('zone_update', { A: 0, B: 0 });
    io.emit('activity', { id: Date.now().toString(), zone:'A', type:'info', message:'Reset by operator', timestamp: new Date() });
  });

  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
mongoose.connect(MONGO_URI).then(async () => {
  console.log('✓ MongoDB connected');
  await seedZones();
}).catch(() => console.log('⚠ MongoDB offline — running in-memory mode'));

server.listen(PORT, () => {
  console.log(`✓ Parking server running on port ${PORT}`);
});
