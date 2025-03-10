import os
import requests
from dotenv import load_dotenv
from pydantic import BaseModel
from fastapi import FastAPI, File, UploadFile, HTTPException, Security, status
from fastapi.security import APIKeyHeader

load_dotenv()

api_key_header = APIKeyHeader(name="X-API-Key")
### Create FastAPI instance with custom docs and openapi url
app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")


class alt_text(BaseModel):
    alt_text: str

    model_config = {
        "json_schema_extra": {"examples": [{"alt_text": "A rabbit in a grass field"}]}
    }

class dual_lang(BaseModel):
    ms: str
    en: str

class alt_text_translated(BaseModel):
    alt_text: dual_lang

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "alt_text": {"ms":"Seekor arnab di padang rumput",
                                 "en":"A rabbit in a grass field"}
                }
            ]
        }
    }


def get_api_key(api_key_header: str = Security(api_key_header)) -> str:
    api_keys = os.getenv("API_KEYS").split(",")
    if api_key_header in api_keys:
        return api_key_header
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing API Key",
    )


@app.post("/api/py/generate-caption-plain")
def gen_caption_plain(
    file: UploadFile, api_key: str = Security(get_api_key)
) -> alt_text:
    API_URL = "https://router.huggingface.co/hf-inference/models/Salesforce/blip-image-captioning-base"
    headers = {"Authorization": f"Bearer {os.getenv('HUGGINGFACE_INF_KEY')}"}
    try:
        contents = file.file.read()
        # with open(file.filename, 'wb') as f:
        #     f.write(contents)
    except Exception:
        raise HTTPException(status_code=500, detail="Something went wrong")
    finally:
        file.file.close()

    response = requests.post(API_URL, headers=headers, data=contents)
    return alt_text(alt_text=response.json()[0]["generated_text"])


@app.post("/api/py/translate-my")
def translate_my(alt_text, api_key: str = Security(get_api_key)) -> alt_text_translated:
    API_URL = "https://api.mesolitica.com/translation/public"
    headers = {"Content-Type": "application/json"}

    payload = {
        "input": alt_text,
        "to_lang": "ms",
        "model": "small",
        "top_k": 1,
        "top_p": 1,
        "repetition_penalty": 1.1,
        "temperature": 0,
    }

    response = requests.post(API_URL, headers=headers, json=payload)
    return alt_text_translated(alt_text={"ms":response.json()["result"], "en": alt_text})


@app.post("/api/py/generate-caption")
def gen_caption(
    file: UploadFile, api_key: str = Security(get_api_key)
) -> alt_text_translated:
    alt_gen = gen_caption_plain(file)
    alt_gen_final = translate_my(alt_gen.alt_text)
    return alt_gen_final
