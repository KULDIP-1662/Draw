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

@app.get ("/get-session")
def get_session():
    # Try to reuse the last session
    if session_counter:
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

    user_index = len(sessions[session_id])
    role = f"user{user_index + 1}"

    sessions[session_id].append(websocket)
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

    with open(save_path, "wb") as f:
        f.write(decoded)

    return JSONResponse(content={"message": "✅ Saved", "filename": filename})

# @app.post("/find_score")
# async def