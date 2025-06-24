from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
import os
from pathlib import Path

app = FastAPI(title="Mergington High School API",
              description="API for viewing and signing up for extracurricular activities")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")

# In-memory activity database
activities = {
    "Comunicação Eficaz": {
        "description": "Desenvolva habilidades de comunicação assertiva e escuta ativa para ambientes de tecnologia.",
        "schedule": "Quartas-feiras, 19:00 - 20:30",
        "max_participants": 25,
        "participants": ["ana@womakerscode.org", "bruna@womakerscode.org"]
    },
    "Liderança Feminina": {
        "description": "Aprenda técnicas de liderança, influência e gestão de equipes diversas no setor de tecnologia.",
        "schedule": "Sábados, 10:00 - 11:30",
        "max_participants": 20,
        "participants": ["carla@womakerscode.org", "daniela@womakerscode.org"]
    },
    "Gestão do Tempo e Produtividade": {
        "description": "Dicas práticas para organização, priorização de tarefas e equilíbrio entre vida pessoal e profissional.",
        "schedule": "Terças-feiras, 18:30 - 20:00",
        "max_participants": 30,
        "participants": ["elisa@womakerscode.org", "claudia@womakerscode.org"]
    }
}

@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")


@app.get("/activities")
def get_activities():
    return activities


@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, email: str):
    """Sign up a student for an activity"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Add student
    activity["participants"].append(email)
    return {"message": f"Signed up {email} for {activity_name}"}