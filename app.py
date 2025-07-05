from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import Body
from fastapi.responses import JSONResponse
import base64
import os
from datetime import datetime
from typing import Dict, List
from uuid import uuid4
from similarity_score import calculate_similarity
import random
import string
from db import sessions_col

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

clients = []
user_roles = {}
sessions = {}  # session_id: list of websockets
session_counter = []  # order of session creation

@app.get("/", response_class=HTMLResponse)
async def get_home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/host-session")
async def create_session(data: dict = Body(...)):
    name = data.get("name")

    if not name:
        return JSONResponse(status_code=400, content={"error": "Name is required"})

    # Generate unique session code
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if not sessions_col.find_one({"_id": code}):
            break

    session_doc = {
        "_id": code,
        "internal_id": f"session_{uuid4().hex[:6]}",
        "players": [
            { "name": name, "joined": True }
        ],
        "status": "waiting",
        "created_at": datetime.utcnow()
    }

    sessions_col.insert_one(session_doc)
    print(f"✅ Created session: {code} for {name}")
    return {"session_code": code}
 
@app.post("/join-session")
async def join_session(data: dict = Body(...)):
    name = data.get("name")
    code = data.get("code")

    session = sessions_col.find_one({"_id": code})

    if not session:
        return JSONResponse(status_code=404, content={"error": "Session not found"})

    if len(session["players"]) >= 2:
        return JSONResponse(status_code=400, content={"error": "Session is full"})

    # Add player 2
    sessions_col.update_one(
        { "_id": code },
        { "$push": { "players": { "name": name, "joined": True } },
          "$set": { "status": "active" }
        }
    )

    print(f"🤝 {name} joined session: {code}")
    return {"session_code": code}


@app.get ("/get-session")
def get_session():
    # Try to reuse the last session
    if session_counter:
        print(f"Current sessions: {sessions}")
        last = session_counter[-1]
        if len (sessions.get (last, [])) < 2:
            return {"session_id": last}

    # Otherwise create new session
    new_id = f"session_{uuid4 ().hex[:6]}"
    sessions[new_id] = []
    session_counter.append (new_id)
    return {"session_id": new_id}

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()

    if session_id not in sessions:
        sessions[session_id] = []

    sessions[session_id].append(websocket)
    role = "user1" if len(sessions[session_id]) == 1 else "user2"

    await websocket.send_json({"type": "assign_role", "role": role})

    try:
        while True:
            data = await websocket.receive_text()
            for client in sessions[session_id]:
                if client != websocket:
                    await client.send_text(data)
    except WebSocketDisconnect:
        sessions[session_id] = [ws for ws in sessions[session_id] if ws != websocket]
        if not sessions[session_id]:
            del sessions[session_id]


import json

@app.post("/upload-canvas")
async def upload_canvas(data: dict = Body(...)):
    image_data = data.get("imageData")
    user_id = data.get("user", "unknown")
    session_id = data.get("sessionId", "default_session")

    header, base64_data = image_data.split(",", 1)
    decoded = base64.b64decode(base64_data)

    os.makedirs("saved", exist_ok=True)
    filename = f"{session_id}_{user_id}.png"
    save_path = os.path.join("saved", filename)
    print(f"Saving image to {save_path}")
    with open(save_path, "wb") as f:
        f.write(decoded)

    # Step 1: Calculate score vs main image
    try:
        print ("🧪 Comparing:", save_path)
        score = calculate_similarity(save_path)

    except Exception as e:
        print(f"Error calculating similarity for {filename}: {e}")
    print(f'Similarity score for {filename}: {score}')

    # Step 2: Save or update scores
    os.makedirs("scores", exist_ok=True)
    score_file = os.path.join("scores", f"{session_id}.json")

    scores = {}
    if os.path.exists(score_file):
        with open(score_file, "r") as f:
            scores = json.load(f)

    scores[user_id] = score

    with open(score_file, "w") as f:
        json.dump(scores, f)

    # Step 3: Check if both scores are present
    if "user1" in scores and "user2" in scores:
        winner = "user1" if scores["user1"] > scores["user2"] else "user2"
        return JSONResponse(content={
            "status": "done",
            "message": "Both players finished!",
            "score": score,
            "both_scores": scores,
            "winner": winner
        })
    else:
        return JSONResponse(content={
            "status": "waiting",
            "message": f"Score saved. Waiting for other player.",
            "score": score
        })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)