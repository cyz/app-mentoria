from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
from pathlib import Path

app = FastAPI(title="WoMakersCode",
              description="API para organização de turmas de mentoria de soft skills")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")

# In-memory activity database - Updated structure
activities = {
    "Comunicação Eficaz": {
        "description": "Desenvolva habilidades de comunicação assertiva e escuta ativa para ambientes de tecnologia.",
        "mentor_name": "Maria Silva",
        "mentor_email": "maria.silva@womakerscode.org",
        "schedule": "Quartas-feiras, 19:00 - 20:30",
        "max_participants": 25,
        "soft_skills_focus": ["comunicação", "escuta ativa", "assertividade"],
        "requirements": "Interesse em melhorar habilidades interpessoais",
        "participants": ["ana@womakerscode.org", "bruna@womakerscode.org"]
    },
    "Liderança Feminina": {
        "description": "Aprenda técnicas de liderança, influência e gestão de equipes diversas no setor de tecnologia.",
        "mentor_name": "Ana Costa",
        "mentor_email": "ana.costa@womakerscode.org",
        "schedule": "Sábados, 10:00 - 11:30",
        "max_participants": 20,
        "soft_skills_focus": ["liderança", "gestão de equipes", "influência"],
        "requirements": "Experiência mínima de 2 anos no mercado de trabalho",
        "participants": ["carla@womakerscode.org", "daniela@womakerscode.org"]
    },
    "Gestão do Tempo e Produtividade": {
        "description": "Dicas práticas para organização, priorização de tarefas e equilíbrio entre vida pessoal e profissional.",
        "mentor_name": "Beatriz Oliveira",
        "mentor_email": "beatriz.oliveira@womakerscode.org",
        "schedule": "Terças-feiras, 18:30 - 20:00",
        "max_participants": 30,
        "soft_skills_focus": ["gestão do tempo", "produtividade", "organização"],
        "requirements": None,
        "participants": ["elisa@womakerscode.org", "claudia@womakerscode.org"]
    },
    "Preparação para Entrevistas Técnicas": {
        "description": "Simulações de entrevistas, dicas de apresentação e resolução de problemas para processos seletivos em tecnologia.",
        "mentor_name": "Carla Santos",
        "mentor_email": "carla.santos@womakerscode.org",
        "schedule": "Quintas-feiras, 20:00 - 21:30",
        "max_participants": 15,
        "soft_skills_focus": ["comunicação", "confiança", "resolução de problemas"],
        "requirements": "Conhecimentos básicos em alguma linguagem de programação",
        "participants": ["fernanda@womakerscode.org"]
    },
    "Construção de Currículo e LinkedIn": {
        "description": "Orientações para criar um currículo atrativo e otimizar o perfil no LinkedIn para oportunidades em tecnologia.",
        "mentor_name": "Diana Ferreira",
        "mentor_email": "diana.ferreira@womakerscode.org",
        "schedule": "Segundas-feiras, 19:30 - 21:00",
        "max_participants": 20,
        "soft_skills_focus": ["marketing pessoal", "comunicação escrita", "networking"],
        "requirements": None,
        "participants": ["juliana@womakerscode.org"]
    },
    "Planejamento de Estudos para Carreira Tech": {
        "description": "Estratégias para montar um plano de estudos eficiente focado em tecnologia.",
        "mentor_name": "Eduarda Lima",
        "mentor_email": "eduarda.lima@womakerscode.org",
        "schedule": "Domingos, 17:00 - 18:30",
        "max_participants": 25,
        "soft_skills_focus": ["planejamento", "disciplina", "autogestão"],
        "requirements": None,
        "participants": []
    },
    "Técnicas de Aprendizagem Ativa": {
        "description": "Métodos para potencializar o aprendizado e retenção de conteúdos técnicos.",
        "mentor_name": "Fernanda Rocha",
        "mentor_email": "fernanda.rocha@womakerscode.org",
        "schedule": "Quartas-feiras, 18:00 - 19:00",
        "max_participants": 20,
        "soft_skills_focus": ["aprendizagem", "concentração", "método de estudos"],
        "requirements": None,
        "participants": []
    },
    "Organização de Rotina de Estudos": {
        "description": "Dicas práticas para criar e manter uma rotina de estudos produtiva.",
        "mentor_name": "Gabriela Moreira",
        "mentor_email": "gabriela.moreira@womakerscode.org",
        "schedule": "Sextas-feiras, 19:00 - 20:00",
        "max_participants": 30,
        "soft_skills_focus": ["organização", "disciplina", "hábitos"],
        "requirements": None,
        "participants": []
    }
}

# Pydantic models for request/response
class CreateActivityRequest(BaseModel):
    title: str
    description: str
    mentor_name: str
    mentor_email: str
    max_participants: int
    schedule: str
    soft_skills_focus: List[str]
    requirements: Optional[str] = None

class UpdateActivityRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    mentor_name: Optional[str] = None
    mentor_email: Optional[str] = None
    max_participants: Optional[int] = None
    schedule: Optional[str] = None
    soft_skills_focus: Optional[List[str]] = None
    requirements: Optional[str] = None

class ActivityResponse(BaseModel):
    title: str
    description: str
    mentor_name: str
    mentor_email: str
    max_participants: int
    schedule: str
    soft_skills_focus: List[str]
    requirements: Optional[str]
    participants: List[str]
    current_participants: int

@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")


@app.get("/activities")
def get_activities():
    """Lista todas as turmas de mentoria disponíveis"""
    formatted_activities = {}
    for title, activity in activities.items():
        formatted_activities[title] = {
            **activity,
            "current_participants": len(activity["participants"])
        }
    return formatted_activities


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


@app.post("/activities", response_model=ActivityResponse)
def create_activity(activity: CreateActivityRequest):
    """Criar uma nova turma de mentoria"""
    # Check if activity with this title already exists
    if activity.title in activities:
        raise HTTPException(status_code=400, detail="Já existe uma atividade com este título")
    
    # Create new activity
    new_activity = {
        "description": activity.description,
        "mentor_name": activity.mentor_name,
        "mentor_email": activity.mentor_email,
        "schedule": activity.schedule,
        "max_participants": activity.max_participants,
        "soft_skills_focus": activity.soft_skills_focus,
        "requirements": activity.requirements,
        "participants": []
    }
    
    activities[activity.title] = new_activity
    
    return ActivityResponse(
        title=activity.title,
        **new_activity,
        current_participants=0
    )


@app.get("/activities/{activity_title}", response_model=ActivityResponse)
def get_activity(activity_title: str):
    """Obter detalhes de uma turma específica"""
    if activity_title not in activities:
        raise HTTPException(status_code=404, detail="Atividade não encontrada")
    
    activity = activities[activity_title]
    return ActivityResponse(
        title=activity_title,
        **activity,
        current_participants=len(activity["participants"])
    )


@app.put("/activities/{activity_title}", response_model=ActivityResponse)
def update_activity(activity_title: str, updates: UpdateActivityRequest):
    """Atualizar uma turma de mentoria existente"""
    if activity_title not in activities:
        raise HTTPException(status_code=404, detail="Atividade não encontrada")
    
    activity = activities[activity_title]
    
    # Update only provided fields
    update_data = updates.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field in activity:
            activity[field] = value
    
    return ActivityResponse(
        title=activity_title,
        **activity,
        current_participants=len(activity["participants"])
    )


@app.delete("/activities/{activity_title}")
def delete_activity(activity_title: str):
    """Deletar uma turma de mentoria"""
    if activity_title not in activities:
        raise HTTPException(status_code=404, detail="Atividade não encontrada")
    
    # Check if there are participants
    if len(activities[activity_title]["participants"]) > 0:
        raise HTTPException(
            status_code=400, 
            detail="Não é possível deletar uma atividade com participantes inscritas"
        )
    
    del activities[activity_title]
    return {"message": f"Atividade '{activity_title}' foi deletada com sucesso"}