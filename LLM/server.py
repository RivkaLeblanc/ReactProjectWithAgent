import json
import re
import uuid
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

client = OpenAI()
DB_URL = "http://localhost:5000"

tools = [
    {
        "type": "function",
        "function": {
            "name": "add_product_to_db",
            "description": "Saves the confirmed product to the store database. Call this only after the admin explicitly approves the product.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_type": {"type": "string", "enum": ["SKIES", "BOOTS", "GOGGLES"]},
                    "product_id": {"type": "string"},
                    "name": {"type": "string"},
                    "gender": {"type": "string", "enum": ["Men", "Women", "Unisex"]},
                    "price_usd": {"type": "integer"},
                    "description": {"type": "string"},
                    "image_url": {"type": "string"},
                    "id": {"type": "string"},
                    "units_sold": {"type": "integer"}
                },
                "required": ["product_type", "product_id", "name", "gender", "price_usd", "description", "image_url", "id", "units_sold"]
            }
        }
    }
]

SYSTEM_PROMPT = (
    "You are a product data extraction tool for a ski shop. You have one single purpose: build product JSON objects. "
    "You are NOT a chatbot, assistant, or question-answering system. "
    "If the user asks ANYTHING unrelated to adding a product (e.g. questions about weather, coding, opinions, general knowledge, or anything outside of product data), "
    "you MUST respond with exactly: 'I can only help with adding products (from the categories that were defined) to the store.' and nothing else.\n"
    "If the user asks to edit, fix, change, shorten, or update any field of the current product being built, that IS related to product data - handle it and return the updated product.\n\n"
    "Your goal is to build a complete product JSON with these exact fields: "
    "product_type (SKIES/BOOTS/GOGGLES), product_id (e.g. BOOT001), name, gender (Men/Women/Unisex), "
    "price_usd (integer), description, image_url, id (4 random hex chars), units_sold (always 0).\n\n"
    "STEP 1 - Analyze the image carefully before doing anything else. From the image you MUST determine:\n"
    "  - product_type: look at the shape. Skis = long flat boards -> SKIES. Boots = rigid footwear -> BOOTS. Goggles = eyewear -> GOGGLES.\n"
    "  - gender: look at colors, shape, and style. Pink/purple/slim = Women. Dark/wide = Men. Neutral = Unisex.\n"
    "  - description: write a 1-2 sentence professional marketing description based on what you see.\n\n"
    "STEP 2 - Take from the user text: name and price_usd if provided.\n\n"
    "STEP 3 - Generate yourself WITHOUT asking: id (4 hex chars), product_id (prefix + 3 digits e.g. BOOT001), units_sold = 0, "
    "image_url = the EXACT url provided in the input, never change it.\n\n"
    "STEP 4 - Only ask about fields you truly cannot determine after steps 1-3. "
    "The ONLY fields you may ask about are: name and price_usd. "
    "Ask one question per missing field: 'I couldn't determine [field]. Would you like me to generate it, or would you like to provide it?' "
    "Never ask about product_type, gender, description, image_url, units_sold, id, or product_id - always handle these yourself.\n\n"
    "STEP 5 - Once all fields are known, show a friendly summary of the product and ask: "
    "'Does everything look good? Should I add it to the store?' "
    "Then include the full JSON wrapped in ```json ... ```. Do NOT return raw JSON without the summary."
)


def parse_product(text: str):
    try:
        return json.loads(text)
    except Exception:
        match = re.search(r"```json\n?([\s\S]*?)\n?```", text)
        if match:
            try:
                return json.loads(match.group(1))
            except Exception:
                pass
    return None


def run_add_product_tool(args: dict):
    collection = args["product_type"]
    resp = requests.post(f"{DB_URL}/{collection}", json=args)
    resp.raise_for_status()
    return resp.json()


def normalize_product_type(product_type: str) -> str:
    if not product_type:
        return ""
    upper = product_type.strip().upper()
    if upper in {"SKIES", "SKI"}:
        return "SKIES"
    if upper in {"BOOTS", "BOOT"}:
        return "BOOTS"
    if upper in {"GOGGLES", "GOG"}:
        return "GOGGLES"
    return upper


def get_category_prefix(category: str) -> str:
    upper = category.upper()
    if upper == "BOOTS":
        return "BOOT"
    if upper == "SKIES":
        return "SKI"
    if upper == "GOGGLES":
        return "GOG"
    return upper[:3]


def get_next_product_id(category: str, all_products: list) -> str:
    prefix = get_category_prefix(category)
    max_number = 0
    for product in all_products:
        product_id = str(product.get("product_id", ""))
        match = re.match(rf"^{re.escape(prefix)}(\d+)$", product_id, re.IGNORECASE)
        if not match:
            continue
        num = int(match.group(1))
        if num > max_number:
            max_number = num
    return f"{prefix}{str(max_number + 1).zfill(3)}"


def validate_product(p: dict):
    errors = []
    if not p.get("name", "").strip():
        errors.append("name cannot be empty")
    if p.get("price_usd", -1) < 0:
        errors.append("price_usd cannot be negative")
    if p.get("price_usd", 0) == 0:
        errors.append("price_usd cannot be 0")
    if p.get("product_type") not in ["SKIES", "BOOTS", "GOGGLES"]:
        errors.append("product_type must be SKIES, BOOTS, or GOGGLES")
    if p.get("gender") not in ["Men", "Women", "Unisex"]:
        errors.append("gender must be Men, Women, or Unisex")
    if not p.get("image_url", "").strip():
        errors.append("image_url cannot be empty")
    if not p.get("description", "").strip():
        errors.append("description cannot be empty")
    return errors


class AnalyzeRequest(BaseModel):
    image_url: str
    user_text: str
    admin_notes: str = ""


class ConfirmRequest(BaseModel):
    product: dict
    conversation: list


class MessageRequest(BaseModel):
    message: str
    conversation: list = []


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": f"image_url: {req.image_url}\nProduct info: {req.user_text}" + (f"\nAdmin notes: {req.admin_notes}" if req.admin_notes else "")},
                {"type": "image_url", "image_url": {"url": req.image_url}}
            ]
        }
    ]

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        tools=tools,
        tool_choice="none"
    )

    reply = response.choices[0].message
    messages.append({"role": "assistant", "content": reply.content})
    product = parse_product(reply.content)

    # If the agent returned a product JSON, ensure product_id, id, and units_sold
    # are computed/normalized on the backend so the frontend sees the correct values.
    if product:
        product["product_type"] = normalize_product_type(product.get("product_type", ""))
        try:
            db_res = requests.get(f"{DB_URL}/{product['product_type']}")
            db_res.raise_for_status()
            product["product_id"] = get_next_product_id(product["product_type"], db_res.json())
        except Exception:
            # If DB lookup fails, leave whatever the agent provided.
            pass
        if not product.get("id"):
            product["id"] = uuid.uuid4().hex[:4]
        if product.get("units_sold") is None:
            product["units_sold"] = 0

        # Show the perfect JSON and ask for confirmation
        product_json = json.dumps(product, indent=2)
        assistant_content = f"Here is the product ready to be added to the database:\n\n```json\n{product_json}\n```\n\nDoes everything look good? Would you like to add this product or make any changes?"
        messages.append({"role": "assistant", "content": assistant_content})
        return {"message": assistant_content, "conversation": messages, "product": product}

    return {"message": reply.content, "conversation": messages, "product": product}


@app.post("/message")
def admin_message(req: MessageRequest):
    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + req.conversation + [
        {"role": "user", "content": req.message}
    ]

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        tools=tools,
        tool_choice="none"
    )

    reply = response.choices[0].message
    messages.append({"role": "assistant", "content": reply.content})
    product = parse_product(reply.content)

    if product:
        product["product_type"] = normalize_product_type(product.get("product_type", ""))
        try:
            db_res = requests.get(f"{DB_URL}/{product['product_type']}")
            db_res.raise_for_status()
            product["product_id"] = get_next_product_id(product["product_type"], db_res.json())
        except Exception:
            pass
        if not product.get("id"):
            product["id"] = uuid.uuid4().hex[:4]
        if product.get("units_sold") is None:
            product["units_sold"] = 0

        product_json = json.dumps(product, indent=2)
        assistant_content = f"Here is the updated product ready to be added to the database:\n\n```json\n{product_json}\n```\n\nDoes everything look good now? Would you like to add this product or make any more changes?"
        messages.append({"role": "assistant", "content": assistant_content})
        return {"message": assistant_content, "conversation": messages, "product": product}

    return {"message": reply.content, "conversation": messages, "product": product}


@app.post("/confirm")
def confirm(req: ConfirmRequest):
    req.product["product_type"] = normalize_product_type(req.product.get("product_type", ""))
    if req.product["product_type"] not in ["SKIES", "BOOTS", "GOGGLES"]:
        raise HTTPException(status_code=422, detail=["product_type must be SKIES, BOOTS, or GOGGLES"])

    db_res = requests.get(f"{DB_URL}/{req.product['product_type']}")
    db_res.raise_for_status()
    req.product["product_id"] = get_next_product_id(req.product["product_type"], db_res.json())

    if not req.product.get("id"):
        req.product["id"] = uuid.uuid4().hex[:4]
    if req.product.get("units_sold") is None:
        req.product["units_sold"] = 0

    errors = validate_product(req.product)
    if errors:
        raise HTTPException(status_code=422, detail=errors)

    messages = req.conversation + [
        {
            "role": "user",
            "content": f"The admin has approved the product. Please call add_product_to_db with exactly these details: {json.dumps(req.product)}"
        }
    ]

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        tools=tools,
        tool_choice={"type": "function", "function": {"name": "add_product_to_db"}}
    )

    tool_call = response.choices[0].message.tool_calls[0]
    args = json.loads(tool_call.function.arguments)
    saved = run_add_product_tool(args)
    return {"success": True, "saved_product": saved}
