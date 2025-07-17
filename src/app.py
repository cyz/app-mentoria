from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
import os
from pathlib import Path
from .data_manager import data_manager

app = FastAPI(title="WoMakersCode",
              description="API para organização de turmas de mentoria de soft skills")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")

@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")


@app.get("/users/current")
def get_current_user():
    """Obtém informações do usuário atual"""
    current_user = data_manager.get_current_user()
    users_data = data_manager.load_users()
    profile_name = current_user.get("profile", "participant")
    profile_info = users_data.get("profiles", {}).get(profile_name, {})
    
    return {
        "user": current_user,
        "profile_info": profile_info,
        "permissions": data_manager.get_user_permissions()
    }

@app.post("/users/switch-profile")
def switch_profile(profile_name: str):
    """Alterna o perfil do usuário (simulação)"""
    try:
        result = data_manager.switch_user_profile(profile_name)
        
        if result:
            new_user = data_manager.get_current_user()
            return {"message": f"Perfil alterado para {profile_name}", "user": new_user}
        else:
            raise HTTPException(status_code=400, detail="Falha ao alterar perfil")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@app.get("/users/profiles")
def get_profiles():
    """Obtém todos os perfis disponíveis"""
    users_data = data_manager.load_users()
    return users_data.get("profiles", {})

@app.get("/activities")
def get_activities():
    return data_manager.load_activities()


@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, name: str = None, email: str = None):
    """Inscreva uma aluna para uma mentoria"""
    current_user = data_manager.get_current_user()
    
    # Se é participante, use os dados do próprio usuário
    if "self_manage" in data_manager.get_user_permissions():
        name = current_user.get("name", "")
        email = current_user.get("email", "")
        if not name or not email:
            raise HTTPException(status_code=400, detail="Dados do usuário incompletos")
    else:
        # Para outros perfis, verificar permissões
        if not data_manager.has_permission("manage_participants") and not data_manager.has_permission("create"):
            raise HTTPException(status_code=403, detail="Sem permissão para inscrever participantes")
        
        if not name or not email:
            raise HTTPException(status_code=400, detail="Nome e email são obrigatórios")
        
    # Validate activity exists
    if not data_manager.activity_exists(activity_name):
        raise HTTPException(status_code=404, detail="Atividade não encontrada")

    # Check if student is already registered
    if data_manager.is_participant_registered(activity_name, email):
        raise HTTPException(status_code=400, detail="Aluna já está inscrita nesta atividade")
    
    # Check if activity is full
    if data_manager.is_activity_full(activity_name):
        raise HTTPException(status_code=400, detail="Atividade está lotada")

    # Check if student has another activity on the same day
    if data_manager.has_activity_on_same_day(activity_name, email):
        existing_activity = data_manager.get_user_activity_same_day(activity_name, email)
        raise HTTPException(
            status_code=400, 
            detail=f"Você já possui uma mentoria no mesmo dia: '{existing_activity}'. Não é possível se inscrever em mais de uma mentoria por semana."
        )

    # Add student
    data_manager.add_participant(activity_name, name, email)
    return {"message": f"A aluna {name} foi inscrita na atividade: {activity_name}"}


@app.delete("/activities/{activity_name}/cancel")
def cancel_activity_signup(activity_name: str, email: str = None):
    """Cancele a inscrição de uma aluna para uma mentoria"""
    current_user = data_manager.get_current_user()
    
    # Se é participante, só pode cancelar própria inscrição
    if "self_manage" in data_manager.get_user_permissions():
        email = current_user.get("email", "")
        if not email:
            raise HTTPException(status_code=400, detail="Email do usuário não encontrado")
    else:
        # Para outros perfis, verificar permissões
        if not data_manager.has_permission("manage_participants") and not data_manager.has_permission("delete"):
            raise HTTPException(status_code=403, detail="Sem permissão para remover participantes")
        
        if not email:
            raise HTTPException(status_code=400, detail="Email é obrigatório")
        
    # Validate activity exists
    if not data_manager.activity_exists(activity_name):
        raise HTTPException(status_code=404, detail="Atividade não encontrada")

    # Check if student is registered
    if not data_manager.is_participant_registered(activity_name, email):
        raise HTTPException(status_code=400, detail="Aluna não está inscrita nesta atividade")

    # Remove student
    data_manager.remove_participant(activity_name, email)
    return {"message": f"A inscrição foi cancelada da atividade: {activity_name}"}


class NewActivity(BaseModel):
    name: str
    description: str
    schedule: str
    max_participants: int

@app.post("/activities")
def create_activity(activity: NewActivity):
    """Criar uma nova mentoria"""
    # Check permissions
    if not data_manager.has_permission("create"):
        raise HTTPException(status_code=403, detail="Sem permissão para criar mentorias")
        
    activities = data_manager.load_activities()
    
    # Check if activity already exists
    if activity.name in activities:
        raise HTTPException(status_code=400, detail="Mentoria com este nome já existe")
    
    # Add new activity
    activities[activity.name] = {
        "description": activity.description,
        "schedule": activity.schedule,
        "max_participants": activity.max_participants,
        "participants": []
    }
    
    # Update the data manager's activities
    data_manager._activities = activities
    data_manager.save_activities()
    
    return {"message": f"Mentoria '{activity.name}' criada com sucesso"}

@app.delete("/activities/{activity_name}")
def delete_activity(activity_name: str):
    """Deletar uma mentoria"""
    # Check permissions
    if not data_manager.has_permission("delete"):
        raise HTTPException(status_code=403, detail="Sem permissão para deletar mentorias")
        
    activities = data_manager.load_activities()
    
    # Check if activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Mentoria não encontrada")
    
    # Remove activity
    del activities[activity_name]
    
    # Update the data manager's activities
    data_manager._activities = activities
    data_manager.save_activities()
    
    return {"message": f"Mentoria '{activity_name}' deletada com sucesso"}

@app.get("/users/activities")
def get_current_user_activities():
    """Obtém as atividades em que o usuário atual está inscrito"""
    activities = data_manager.get_current_user_activities()
    return {"activities": activities}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)