// static/script.js

const yourCanvas = document.getElementById('yourCanvas');
const yourCtx = yourCanvas.getContext('2d');
const friendCanvas = document.getElementById('friendCanvas');
const friendCtx = friendCanvas.getContext('2d');
const saveYourBtn = document.getElementById('saveYourBtn');

let drawing = false;
let socket = null;
let userRole = null;
let sessionId = sessionStorage.getItem("draw_session_id");

// Load background image
const backgroundImage = new Image();
backgroundImage.src = "/static/given_image.png";

backgroundImage.onload = () => {
  drawBackground(yourCtx);
  drawBackground(friendCtx);
};

function drawBackground(ctx) {
  ctx.drawImage(backgroundImage, 0, 0, yourCanvas.width, yourCanvas.height);
}

// Get session from server
if (!sessionId) {
  fetch('/get-session')
    .then(res => res.json())
    .then(data => {
      sessionId = data.session_id;
      sessionStorage.setItem("draw_session_id", sessionId);
      initWebSocket();
    });
} else {
  initWebSocket();
}

function initWebSocket() {
  socket = new WebSocket(`ws://${location.host}/ws/${sessionId}`);

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "assign_role") {
      userRole = data.role;
      console.log("🎭 Assigned as", userRole);
    } else {
      drawRemote(data.type, data.x, data.y);
    }
  };

  socket.onopen = () => console.log("✅ WebSocket connected");
  socket.onerror = (e) => {
    console.error("❌ WebSocket error", e);
    alert("WebSocket connection error.");
  };
}

yourCanvas.addEventListener('mousedown', (e) => {
  drawing = true;
  const { x, y } = getXY(e);
  drawLocal(x, y);
  socket.send(JSON.stringify({ type: 'start', x, y }));
});

yourCanvas.addEventListener('mouseup', () => {
  if (!drawing) return;
  drawing = false;
  yourCtx.beginPath();
  socket.send(JSON.stringify({ type: 'stop' }));
});

yourCanvas.addEventListener('mousemove', (e) => {
  if (!drawing) return;
  const { x, y } = getXY(e);
  drawLocal(x, y);
  socket.send(JSON.stringify({ type: 'draw', x, y }));
});

function getXY(e) {
  const rect = yourCanvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function drawLocal(x, y) {
  yourCtx.lineWidth = 2;
  yourCtx.lineCap = 'round';
  yourCtx.strokeStyle = 'blue';
  yourCtx.lineTo(x, y);
  yourCtx.stroke();
  yourCtx.beginPath();
  yourCtx.moveTo(x, y);
}

function drawRemote(type, x, y) {
  friendCtx.lineWidth = 2;
  friendCtx.lineCap = 'round';
  friendCtx.strokeStyle = 'green';

  if (type === 'start') {
    friendCtx.beginPath();
    friendCtx.moveTo(x, y);
  } else if (type === 'draw') {
    friendCtx.lineTo(x, y);
    friendCtx.stroke();
    friendCtx.beginPath();
    friendCtx.moveTo(x, y);
  } else if (type === 'stop') {
    friendCtx.beginPath();
  }
}

saveYourBtn.addEventListener('click', () => {
  if (!userRole || !sessionId) {
    alert("❌ You're not assigned yet.");
    return;
  }

  const imgData = yourCanvas.toDataURL("image/png");

  fetch('/upload-canvas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageData: imgData,
      user: userRole,
      sessionId: sessionId
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "waiting") {
        alert(`✅ Score Saved: ${data.score}%\nWaiting for your opponent...`);
      } else if (data.status === "done") {
        const yourScore = data.both_scores[userRole];
        const otherUser = userRole === 'user1' ? 'user2' : 'user1';
        const opponentScore = data.both_scores[otherUser];
        const isWinner = data.winner === userRole;

        alert(`🎯 Game Over!\nYou scored: ${yourScore}%\nOpponent scored: ${opponentScore}%\n🏆 ${isWinner ? "You win!" : "Opponent wins!"}`);
      }
    })
    .catch(err => {
      alert("❌ Save failed");
      console.error(err);
    });
});
