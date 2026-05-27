from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

#gives the agent a personality
SYSTEM_PROMPT = """You are Alex, a friendly and professional sales representative on a phone call.

Your goal is to have a natural conversation and close a sale where appropriate.

RULES:
- Keep responses SHORT, 2-3 sentences max. This is a voice call.
- Be warm and conversational, never robotic.
- Address the customer by name occasionally, not every sentence.
- If they show interest, move toward closing the sale.
- If they raise objections, respond with empathy then reframe the value.
- If they are not interested, be gracious and end politely.
- Never be pushy or repeat the same pitch twice.

PRODUCT YOU ARE SELLING:
{product_details}

CUSTOMER INFO:
{customer_details}

Begin by introducing yourself and the product in one sentence, then listen."""

#list of things a customer might say to end the call. check for these after every message
END_PHRASES = [
    "bye", "goodbye", "not interested", "leave me alone",
    "stop calling", "hang up", "no thank you", "no thanks",
    "remove me", "do not call"
]

#takes the product and customer from the database and fills them into the system prompt template
def build_system_prompt(product, customer):
    price = product.get("price", 0)
    discount = product.get("discount", 0)
    final_price = price - (price * discount / 100)

    product_details = f"""Name: {product.get("name")}
Description: {product.get("description")}
Price: Rs.{price}""" + (f" -> Rs.{final_price:.0f} ({discount}% off today)" if discount > 0 else "")

    customer_details = f"""Name: {customer.get("name")}
Notes: {customer.get("notes", "First time contact")}"""

    return SYSTEM_PROMPT.format(
        product_details=product_details,
        customer_details=customer_details
    )

#checks if the customer said any end phrases
def should_end_call(text):
    text_lower = text.lower()
    return any(phrase in text_lower for phrase in END_PHRASES)

#takes the convo history, the prompt and the new message from customer - sends to groq- get's the reply
def get_reply(history, system_prompt, user_text):
    messages = history.copy()
    messages.append({"role": "user", "content": user_text})

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=150,
        messages=[{"role": "system", "content": system_prompt}] + messages
    )

    return response.choices[0].message.content.strip()

#called at the end of evry call - makes a summary - classifies as pos, neg, neutral
def summarize_call(history):
    conversation = "\n".join(
        f"{'Agent' if m['role'] == 'assistant' else 'Customer'}: {m['content']}"
        for m in history
        if m.get("content") != "__START__"
    )

    prompt = f"""Here is a sales call transcript:

{conversation}

Write a 2 sentence summary of what happened.
Then on a new line write exactly one of:
OUTCOME: positive
OUTCOME: negative
OUTCOME: neutral

positive = customer agreed to buy or showed strong interest
negative = customer clearly refused
neutral = call ended without a clear decision"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}]
    )

    text = response.choices[0].message.content.strip()

    outcome = "neutral"
    if "OUTCOME: positive" in text:
        outcome = "positive"
    elif "OUTCOME: negative" in text:
        outcome = "negative"

    summary = text.replace("OUTCOME: positive", "").replace(
        "OUTCOME: negative", "").replace("OUTCOME: neutral", "").strip()

    return {"summary": summary, "outcome": outcome}