import openai
import base64
import PIL.Image
import io
from library import config


openai.api_key = config.OPENAI_API_KEY

baseCharacterImage = PIL.Image.open("documents/character_looking.png")
def generate_image(text):
    text = "the same character with a happy smile and standing on the beach"

    # Call the OpenAI API with the combined_input
    # rawImage = open("documents/character_looking.png", "rb")
    #encodedImage = baseCharacterImage.convert("RGBA")

    """
    response = openai.Image.create_edit(
        image=encodedImage,
        prompt="the same character but is standing on the beach and playing with water",
        n=1,
        size="1024x1024"
    )"""

    """
    # blank api to generate image
    response = openai.Image.create(
        prompt="the 'Tatsumaki' in One Punch Man standing on the beach",
        n=1,
        response_format = "url",
        size="1024x1024"
    )

    image_url = response['data'][0]['url']"""
    # Return the generated image

    return baseCharacterImage

    #return baseCharacterImage

