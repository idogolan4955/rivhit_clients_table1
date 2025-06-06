import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
from dotenv import load_dotenv

load_dotenv()

API_TOKEN = os.getenv("TOKEN", "E0E85381-BA23-4F50-A987-2BB54330216A")
API_BASE = "https://api.rivhit.co.il/externals/api/v1"

app = FastAPI()

# Allow CORS for local frontend and all origins for now
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def fetch_clients():
    url = "https://api.rivhit.co.il/online/RivhitOnlineAPI.svc/Customer.List"
    payload = {
        "api_token": API_TOKEN,
        "customer_type": 1
    }
    headers = {"Content-Type": "application/json"}
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload, headers=headers)
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail="Failed to fetch clients")
        data = resp.json()
        if data.get("error_code", 1) != 0:
            raise HTTPException(status_code=400, detail=data.get("client_message", "API error"))
        customers = data.get("data", {}).get("customer_list", [])
        mapped = []
        for c in customers:
            agent_number = c.get("agent_name") or c.get("agent_id") or ""
            agent_display = str(agent_number) if agent_number is not None else ""
            mapped.append({
                "id": c.get("customer_id"),
                "Id": c.get("customer_id"),
                "Name": f"{c.get('first_name', '')} {c.get('last_name', '')}".strip(),
                "agent_name": agent_display,
                "balance": c.get("balance", 0.0)
            })
        return mapped

@app.get("/api/clients")
async def get_clients():
    return await fetch_clients() 