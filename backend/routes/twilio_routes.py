import os
import random
from datetime import datetime
from fastapi import APIRouter, Request, Form
from fastapi.responses import Response
from twilio.twiml.voice_response import VoiceResponse, Gather
from twilio.rest import Client
from database import db, valid_id
from agent import build_system_prompt, should_end_call, get_reply, summarize_call
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/twilio", tags=["twilio"])

TWILIO_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")
BASE_URL = os.getenv("BASE_URL")

twilio_client = Client(TWILIO_SID, TWILIO_TOKEN) if TWILIO_SID else None

# Active call sessions keyed by Twilio CallSid
call_sessions = {}


def get_or_create_session(call_sid, phone=None):
    if call_sid not in call_sessions and phone:
        customer = db.customers.find_one({"phone": phone})
        if not customer:
            customer = {
                "name": "Unknown",
                "notes": "Called via phone",
                "interested_product_ids": []
            }

        ids = customer.get("interested_product_ids", [])
        product = None
        if ids:
            product = db.products.find_one({"_id": valid_id(random.choice(ids))})
        if not product:
            product = db.products.find_one({"availability": {"$gt": 0}})

        system_prompt = build_system_prompt(product, customer)
        opening = get_reply([], system_prompt, "__START__")

        call_sessions[call_sid] = {
            "customer": customer,
            "product": product,
            "system_prompt": system_prompt,
            "history": [
                {"role": "user", "content": "__START__"},
                {"role": "assistant", "content": opening}
            ],
            "opening": opening,
            "started_at": datetime.utcnow()
        }

    return call_sessions.get(call_sid)


@router.post("/call")
async def incoming_call(request: Request):
    form = await request.form()
    call_sid = form.get("CallSid")
    phone = form.get("From")

    session = get_or_create_session(call_sid, phone)
    opening = session["opening"] if session else "Hello, I am calling about a special offer."

    response = VoiceResponse()
    response.say(opening, voice="Polly.Joanna")
    response.redirect(f"{BASE_URL}/twilio/listen?call_sid={call_sid}")

    return Response(content=str(response), media_type="application/xml")


@router.post("/listen")
async def listen(request: Request):
    call_sid = request.query_params.get("call_sid")

    response = VoiceResponse()
    gather = Gather(
        input="speech",
        timeout=5,
        speech_timeout="auto",
        action=f"{BASE_URL}/twilio/respond?call_sid={call_sid}",
        method="POST"
    )
    response.append(gather)
    response.redirect(f"{BASE_URL}/twilio/listen?call_sid={call_sid}")

    return Response(content=str(response), media_type="application/xml")


@router.post("/respond")
async def respond(request: Request):
    call_sid = request.query_params.get("call_sid")
    form = await request.form()
    speech = form.get("SpeechResult", "")

    session = call_sessions.get(call_sid)
    response = VoiceResponse()

    if not session or not speech:
        response.say("Sorry, I didn't catch that.", voice="Polly.Joanna")
        response.redirect(f"{BASE_URL}/twilio/listen?call_sid={call_sid}")
        return Response(content=str(response), media_type="application/xml")

    if should_end_call(speech):
        result = summarize_call(session["history"])
        _save_call(call_sid, session, result)
        call_sessions.pop(call_sid, None)
        response.say("Thank you for your time, have a great day!", voice="Polly.Joanna")
        response.hangup()
        return Response(content=str(response), media_type="application/xml")

    reply = get_reply(session["history"], session["system_prompt"], speech)
    session["history"].append({"role": "user", "content": speech})
    session["history"].append({"role": "assistant", "content": reply})

    response.say(reply, voice="Polly.Joanna")
    response.redirect(f"{BASE_URL}/twilio/listen?call_sid={call_sid}")

    return Response(content=str(response), media_type="application/xml")


@router.post("/make-call")
async def make_call(phone: str = Form(...)):
    if not twilio_client:
        return {"error": "Twilio not configured"}

    call = twilio_client.calls.create(
        to=phone,
        from_=TWILIO_NUMBER,
        url=f"{BASE_URL}/twilio/call"
    )

    return {"status": "calling", "call_sid": call.sid, "to": phone}


def _save_call(call_sid, session, result):
    customer = session["customer"]
    product = session["product"]
    outcome = result["outcome"]

    db.call_logs.insert_one({
        "session_id": call_sid,
        "customer_name": customer.get("name"),
        "customer_phone": customer.get("phone"),
        "product_name": product.get("name") if product else "Unknown",
        "outcome": outcome,
        "summary": result["summary"],
        "duration_seconds": None,
        "history": session["history"],
        "timestamp": datetime.utcnow()
    })

    if outcome == "positive" and product:
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