import requests
from dotenv import load_dotenv
from pydantic import BaseModel
from fastapi import FastAPI, File, UploadFile, HTTPException, status

load_dotenv()

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


@app.post("/api/py/generate-caption-plain")
def gen_caption_plain(
    file: UploadFile, hugging_face_api_key: str
) -> alt_text:
    API_URL = "https://router.huggingface.co/hf-inference/models/Salesforce/blip-image-captioning-large"
    headers = {"Authorization": f"Bearer {hugging_face_api_key}"}

    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid image file. Only .jpg, .jpeg and .png are accepted.")
    if file.size > 1000000:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File size is larger than 1MB.")
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
def translate_my(alt_text) -> alt_text_translated:
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
    file: UploadFile, hugging_face_api_key: str
) -> alt_text_translated:
    alt_gen = gen_caption_plain(file, hugging_face_api_key)
    alt_gen_final = translate_my(alt_gen.alt_text)
    return alt_gen_final
