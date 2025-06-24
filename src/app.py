from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
import os
from pathlib import Path

app = FastAPI(title="WoMakersCode",
              description="API para organização de turmas de mentoria de soft skills")

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
    },
    # Atividades de empregabilidade na tecnologia
    "Preparação para Entrevistas Técnicas": {
        "description": "Simulações de entrevistas, dicas de apresentação e resolução de problemas para processos seletivos em tecnologia.",
        "schedule": "Quintas-feiras, 20:00 - 21:30",
        "max_participants": 15,
        "participants": ["fernanda@womakerscode.org"]
    },
    "Construção de Currículo e LinkedIn": {
        "description": "Orientações para criar um currículo atrativo e otimizar o perfil no LinkedIn para oportunidades em tecnologia.",
        "schedule": "Segundas-feiras, 19:30 - 21:00",
        "max_participants": 20,
        "participants": ["juliana@womakerscode.org"]
    },
    # Atividades para organização de estudos
    "Planejamento de Estudos para Carreira Tech": {
        "description": "Estratégias para montar um plano de estudos eficiente focado em tecnologia.",
        "schedule": "Domingos, 17:00 - 18:30",
        "max_participants": 25,
        "participants": []
    },
    "Técnicas de Aprendizagem Ativa": {
        "description": "Métodos para potencializar o aprendizado e retenção de conteúdos técnicos.",
        "schedule": "Quartas-feiras, 18:00 - 19:00",
        "max_participants": 20,
        "participants": []
    },
    "Organização de Rotina de Estudos": {
        "description": "Dicas práticas para criar e manter uma rotina de estudos produtiva.",
        "schedule": "Sextas-feiras, 19:00 - 20:00",
        "max_participants": 30,
        "participants": []
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
    """Inscreva uma aluna para uma mentoria"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Atividade não encontrada")

    # Get the specific activity
    activity = activities[activity_name]

    # Check if student is already registered
    if email in activity["participants"]:
        raise HTTPException(status_code=400, detail="Aluna já está inscrita nesta atividade")
    
    # Check if activity is full
    if len(activity["participants"]) >= activity["max_participants"]:
        raise HTTPException(status_code=400, detail="Atividade está lotada")

    # Add student
    activity["participants"].append(email)
    return {"message": f"A aluna {email} foi inscrita na atividade: {activity_name}"}


@app.delete("/activities/{activity_name}/cancel")
def cancel_activity_signup(activity_name: str, email: str):
    """Cancele a inscrição de uma aluna para uma mentoria"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Atividade não encontrada")

    # Get the specific activity
    activity = activities[activity_name]

    # Check if student is registered
    if email not in activity["participants"]:
        raise HTTPException(status_code=400, detail="Aluna não está inscrita nesta atividade")

    # Remove student
    activity["participants"].remove(email)
    return {"message": f"A inscrição da aluna {email} foi cancelada da atividade: {activity_name}"}