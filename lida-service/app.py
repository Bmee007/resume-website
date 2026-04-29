import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from lida import Manager, llm

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# Dark theme matching the resume website palette
DARK_STYLE = {
    'figure.facecolor':  '#0d0d0a',
    'axes.facecolor':    '#0d0d0a',
    'savefig.facecolor': '#0d0d0a',
    'figure.edgecolor':  '#0d0d0a',
    'text.color':        '#e8e0cc',
    'axes.labelcolor':   '#e8e0cc',
    'xtick.color':       '#a09880',
    'ytick.color':       '#a09880',
    'axes.edgecolor':    '#2a2520',
    'grid.color':        '#1a1a14',
    'axes.grid':         True,
    'axes.prop_cycle':   plt.cycler(color=['#d49820', '#5b8fd9', '#4caf88', '#e07030']),
}

lida = Manager(text_gen=llm("openai", api_key=os.environ["OPENAI_API_KEY"]))


class GenerateRequest(BaseModel):
    data: list[dict]    # [{"label": "A", "value": 100}, ...]
    goal: str           # natural language description of desired visualization
    chart_type: str = "bar"
    title: str = ""
    unit: str = ""


@app.post("/generate")
async def generate(req: GenerateRequest):
    try:
        matplotlib.rcParams.update(DARK_STYLE)

        df = pd.DataFrame(req.data)
        summary = lida.summarize(df, n_samples=0)

        from lida.datamodel import Goal
        goal = Goal(
            question=req.goal,
            visualization=f"{req.chart_type} chart showing {req.title or req.goal}",
            rationale="Enterprise AI metrics infographic for professional portfolio",
        )

        charts = lida.visualize(summary=summary, goal=goal, library="matplotlib")

        if not charts:
            raise HTTPException(status_code=500, detail="No visualization returned by LIDA")
        if not charts[0].status or not charts[0].raster:
            raise HTTPException(status_code=500, detail=f"Visualization failed: {charts[0].error}")

        # charts[0].raster is already a base64 PNG string
        return {"image": charts[0].raster}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}
