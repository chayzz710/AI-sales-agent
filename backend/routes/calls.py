from fastapi import APIRouter, HTTPException, UploadFile, File
from database import db, to_json, valid_id
from models import StartSession, ChatMessage, EndSession
from agent import build_system_prompt, should_end_call, get_reply, summarize_call
from datetime import datetime
import tempfile
import os
import uuid
import random

router = APIRouter(prefix="/calls", tags=["calls"])

# This dictionary holds all active call sessions in memory
# Key is session_id, value is all the session data
sessions = {}

#is where every conversation begins.
@router.post("/start")
def start_call(data: StartSession):

    # Get the customer
    if data.customer_id:
        customer = db.customers.find_one({"_id": valid_id(data.customer_id)})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
    else:
        customer = {
            "name": "Demo Customer",
            "notes": "First time contact",
            "interested_product_ids": []
        }

    # Get the product
    if data.product_id:
        product = db.products.find_one({"_id": valid_id(data.product_id)})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
    else:
        # Pick a product the customer is interested in
        interested = customer.get("interested_product_ids", [])
        if interested:
            random_id = random.choice(interested)
            product = db.products.find_one({"_id": valid_id(random_id)})
        else:
            # Just pick any available product
            product = db.products.find_one({"availability": {"$gt": 0}})

    if not product:
        raise HTTPException(status_code=400, detail="No products available")

    # Build the system prompt for this specific customer and product
    system_prompt = build_system_prompt(product, customer)

    # Get Alex's opening line from Groq
    opening = get_reply([], system_prompt, "__START__")

    # Create a unique session ID
    session_id = str(uuid.uuid4())

    # Store everything in memory
    sessions[session_id] = {
        "customer": customer,
        "product": product,
        "system_prompt": system_prompt,
        "history": [
            {"role": "user", "content": "__START__"},
            {"role": "assistant", "content": opening}
        ],
        "started_at": datetime.utcnow()
    }

    return {
        "session_id": session_id,
        "opening": opening,
        "customer_name": customer.get("name"),
        "product_name": product.get("name")
    }

#is called every time the customer speaks
@router.post("/chat")
def chat(data: ChatMessage):

    session = sessions.get(data.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Check if the customer wants to end the call
    if should_end_call(data.user_text):
        result = summarize_call(session["history"])
        _save_call(data.session_id, session, result)
        sessions.pop(data.session_id, None)
        return {
            "reply": "Thank you for your time, have a great day!",
            "end_call": True,
            "outcome": result["outcome"],
            "summary": result["summary"]
        }

    # Get Alex's reply
    reply = get_reply(session["history"], session["system_prompt"], data.user_text)

    # Add both messages to history
    session["history"].append({"role": "user", "content": data.user_text})
    session["history"].append({"role": "assistant", "content": reply})

    return {
        "reply": reply,
        "end_call": False
    }

#is called when the user clicks Hang Up. It summarizes the call and saves everything.
@router.post("/end")
def end_call(data: EndSession):

    session = sessions.get(data.session_id)
    if not session:
        return {"message": "Session already ended"}

    result = summarize_call(session["history"])
    _save_call(data.session_id, session, result, duration=data.duration_seconds)
    sessions.pop(data.session_id, None)

    return {
        "message": "Call saved",
        "outcome": result["outcome"],
        "summary": result["summary"]
    }

#is a helper that handles all the database writing 
def _save_call(session_id, session, result, duration=None):
    customer = session["customer"]
    product = session["product"]
    outcome = result["outcome"]

    # Save the call log
    db.call_logs.insert_one({
        "session_id": session_id,
        "customer_name": customer.get("name"),
        "customer_phone": customer.get("phone"),
        "product_name": product.get("name"),
        "outcome": outcome,
        "summary": result["summary"],
        "duration_seconds": duration,
        "history": session["history"],
        "timestamp": datetime.utcnow()
    })

    # If it was a sale, record it and reduce stock
    if outcome == "positive":
        price = product.get("price", 0)
        discount = product.get("discount", 0)
        selling_price = price - (price * discount / 100)

        db.sales.insert_one({
            "product_name": product.get("name"),
            "customer_name": customer.get("name"),
            "selling_price": selling_price,
            "timestamp": datetime.utcnow()
        })

        db.products.update_one(
            {"_id": product["_id"]},
            {"$inc": {"availability": -1}}
        )

    # Update customer stats
    customer_id = customer.get("_id")
    if customer_id:
        existing = db.customers.find_one({"_id": customer_id})
        if existing:
            total_calls = existing.get("total_calls", 0) + 1
            old_rate = existing.get("acceptance_rate", 0.0)
            sold = 1 if outcome == "positive" else 0
            new_rate = ((old_rate * (total_calls - 1)) + sold) / total_calls

            db.customers.update_one(
                {"_id": customer_id},
                {"$set": {
                    "total_calls": total_calls,
                    "acceptance_rate": round(new_rate, 3)
                }}
            )

@router.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    from groq import Groq
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    # Save the uploaded audio to a temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        contents = await audio.read()
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as f:
            transcription = client.audio.transcriptions.create(
                model="whisper-large-v3",
                file=f,
                response_format="text"
            )
        return {"text": transcription}
    finally:
        os.unlink(tmp_path)

@router.get("/speak")
async def speak(text: str):
    from gtts import gTTS
    from fastapi.responses import Response
    import io

    tts = gTTS(text=text, lang='en', slow=False)
    buf = io.BytesIO()
    tts.write_to_fp(buf)
    buf.seek(0)

    return Response(content=buf.read(), media_type="audio/mpeg")