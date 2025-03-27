# Hurai
A simple alt text generator with Malaysian Language

[demo site](https://hurai.iwa.my/)

## Methodology
Image Caption Model: [Salesforce/blip-image-captioning-large](https://huggingface.co/Salesforce/blip-image-captioning-large) 

Translation Model: [Mesolitica Translation Public](https://mesolitica.com/translation)

## Getting Started

First, create and activate a virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate
```

Then, install the dependencies:

```bash
npm install
# or
yarn
# or
pnpm install
```

Then, run the development server(python dependencies will be installed automatically here):

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The FastApi server will be running on [http://127.0.0.1:8000](http://127.0.0.1:8000)