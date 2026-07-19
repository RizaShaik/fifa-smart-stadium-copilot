import asyncio
import time
import os
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from app.routers import demo_controller, telemetry
from app.services.stadium_manager import manager

logger = logging.getLogger("uvicorn")

app = FastAPI(
    title="FIFA Smart Stadium Copilot AI OS Backend",
    description="Central Stadium Operations Simulator and AI decision telemetry router.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check registry status
health_status = {
    "firebase": "degraded",
    "gemini": "degraded",
    "websocket": "ready",
    "simulation": "running",
    "orchestrator": "ready",
    "database": "in_memory_nominal",
    "overall_status": "degraded"
}

# REST API Latency measurement middleware
@app.middleware("http")
async def measure_api_latency(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000.0
    manager.add_metric(manager.api_latencies, duration_ms)
    return response

# Expose health endpoint
@app.get("/api/system/health")
async def get_system_health():
    return health_status

# Register routes
app.include_router(demo_controller.router)
app.include_router(telemetry.router)

@app.websocket("/api/stadium/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data.startswith("pong:"):
                try:
                    parts = data.split(":")
                    sent_time = float(parts[1])
                    ws_latency = (time.time() - sent_time) * 1000.0
                    manager.add_metric(manager.websocket_latencies, ws_latency)
                except Exception:
                    pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)

async def websocket_ping_loop():
    """
    Periodic keep-alive ping loop to detect and prune stale websocket connections.
    """
    while True:
        await asyncio.sleep(10.0)
        if manager.active_connections:
            ts = time.time()
            ping_msg = f"ping:{ts}"
            for ws in list(manager.active_connections):
                try:
                    await ws.send_text(ping_msg)
                except Exception:
                    manager.disconnect(ws)
                    logger.info("Cleaned up stale WebSocket connection during ping broadcast.")

@app.on_event("startup")
async def startup_event():
    """
    Launch simulator loop and perform startup validations.
    """
    logger.info("=== STARTUP INTEGRATION VALIDATIONS ===")
    
    # 1. Check Firebase
    fb_key = os.getenv("NEXT_PUBLIC_FIREBASE_API_KEY")
    if fb_key and not fb_key.startswith("mock"):
        health_status["firebase"] = "healthy"
        logger.info("  ✓ Firebase Config: verified")
    else:
        health_status["firebase"] = "degraded (mock configuration)"
        logger.warning("  ⚠ Firebase Config: unconfigured (fallback client mocks enabled)")
        
    # 2. Check Gemini
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key and not gemini_key.startswith("mock"):
        health_status["gemini"] = "healthy"
        logger.info("  ✓ Gemini API Key: verified")
    else:
        health_status["gemini"] = "degraded (missing key, heuristics mode active)"
        logger.warning("  ⚠ Gemini API Key: missing! Heuristic AI recommendations active.")
        
    # 3. Check WebSocket registry
    if hasattr(manager, "active_connections"):
        health_status["websocket"] = "healthy"
        logger.info("  ✓ WebSocket registry: verified")
    else:
        health_status["websocket"] = "failed"
        logger.error("  ✗ WebSocket registry: failed")
        
    # 4. Check Simulation Engine
    if manager:
        health_status["simulation"] = "healthy"
        logger.info("  ✓ Simulation Engine: verified")
    else:
        health_status["simulation"] = "failed"
        logger.error("  ✗ Simulation Engine: failed")
        
    # 5. Check AI Orchestrator
    try:
        from app.services.ai.ai_orchestrator import ai_orchestrator
        if ai_orchestrator and hasattr(ai_orchestrator, "_agents") and len(ai_orchestrator._agents) >= 9:
            health_status["orchestrator"] = "healthy"
            logger.info("  ✓ AI Orchestrator & Agents: verified")
        else:
            health_status["orchestrator"] = "degraded"
            logger.error("  ✗ AI Orchestrator: missing or uninitialized agents")
    except Exception as e:
        health_status["orchestrator"] = f"failed ({str(e)})"
        logger.error(f"  ✗ AI Orchestrator initialization error: {str(e)}")
        
    # Determine overall status
    if (health_status["websocket"] == "healthy" and 
        health_status["simulation"] == "healthy" and 
        health_status["orchestrator"] == "healthy" and
        health_status["gemini"] == "healthy"):
        health_status["overall_status"] = "healthy"
    else:
        health_status["overall_status"] = "degraded"
        
    logger.info(f"Startup validations complete. Overall Status: {health_status['overall_status'].upper()}")
    logger.info("=======================================")
    
    # Spawn background tasks
    asyncio.create_task(manager.run_loop())
    asyncio.create_task(websocket_ping_loop())

@app.get("/")
async def root():
    return {
        "status": "online",
        "app": "FIFA Smart Stadium Copilot AI OS Backend",
        "active_scenario": manager.scenario
    }
