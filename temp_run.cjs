const { io } = require("socket.io-client");
const URL = "http://localhost:3001";

async function run() {
  const socket = io(URL, { transports: ["websocket"], timeout: 10000 });
  await new Promise((resolve, reject) => {
    socket.on("connect", resolve);
    setTimeout(() => reject(new Error("timeout")), 10000);
  });
  console.log("Connected:", socket.id);

  const createResult = await new Promise((resolve) => {
    socket.emit("create_room", { playerName: "Maverick", problemStatement: "如何设计更好的3D卡片UI？" }, resolve);
  });
  console.log("ROOM:" + createResult.roomCode + "|PID:" + createResult.playerId);

  await new Promise(r => socket.once("game_state", r));
  socket.emit("player_ready", { ready: true });
  await new Promise(r => setTimeout(r, 300));
  socket.emit("start_game");

  const gs2 = await new Promise(r => socket.once("game_state", r));
  console.log("PHASE:" + gs2.phase);

  socket.emit("submit_idea", { text: "利用视差滚动和CSS 3D变换打造沉浸式卡片UI", inspirationCard: 0 });
  const gs3 = await new Promise(r => socket.once("game_state", r));
  console.log("PHASE:" + gs3.phase + " IDEAS:" + gs3.ideas.length);

  // Advance only to r1_guess
  socket.emit("next_phase");
  const gs4 = await new Promise(r => socket.once("game_state", r));
  console.log("PHASE:" + gs4.phase);

  // Advance to r2_adapt
  socket.emit("next_phase");
  const gs5 = await new Promise(r => socket.once("game_state", r));
  console.log("PHASE:" + gs5.phase);

  // Advance to r3_challenge
  socket.emit("next_phase");
  const gs6 = await new Promise(r => socket.once("game_state", r));
  console.log("PHASE:" + gs6.phase);

  // Advance to finished
  socket.emit("next_phase");
  const gs7 = await new Promise(r => socket.once("game_state", r));
  console.log("PHASE:" + gs7.phase);

  console.log("DONE");
  socket.disconnect();
}

run().catch(e => { console.error("ERROR:", e.message); process.exit(1); });
