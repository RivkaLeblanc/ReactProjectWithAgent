import base64
from dotenv import load_dotenv
from openai import OpenAI
from typing import List, Literal
from pydantic import BaseModel, Field

load_dotenv()


# Data structure definition for the product
class Product(BaseModel):
    product_type: Literal["SKIS", "BOOTS", "GOGGLES"] = Field(
        description="The category of the ski product. Deduce this strictly by looking at the provided image."
    )
    product_id: str = Field(
        description="A unique store identifier starting with the type prefix, e.g., GOG002, SKI014, BOOT009. Generate this based on the product type you detected."
    )
    name: str = Field(
        description="The commercial name of the product, extracted from the user's text input."
    )
    gender: Literal["Men", "Women", "Unisex"] = Field(
        description="The target audience for the product. Deduce this by analyzing the style/color/design in the image."
    )
    price_usd: int = Field(
        description="The price of the product in USD integers, extracted from the user's text input."
    )
    description: str = Field(
        description="An engaging, professional marketing description written by you. Combine what you see in the image with the user's text inputs."
    )
    image_url: str = Field(
        description="The exact URL of the product image that was provided in the input."
    )
    id: str = Field(
        description="A unique system ID (e.g., e58f). Generate this automatically."
    )
    units_sold: int = Field(
        default=0,
        description="The number of units sold. This must always start at 0."
    )


client = OpenAI()


def create_product(user_text_input, image_url):
    response = client.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert product manager. Your job is to look closely at the provided image "
                    "to detect the product type and gender, combine it with the manual text info (name, price) "
                    "provided by the user. If the user didn't provide it, generate your own. Structure everything into the required JSON format."
                )
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"Manual Product Info: {user_text_input}"
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_url
                        }
                    }
                ]
            }
        ],
        response_format=Product
    )

    return response.choices[0].message.parsed
