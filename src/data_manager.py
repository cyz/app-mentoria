import json
import os
from pathlib import Path
from typing import Dict, Any

class DataManager:
    def __init__(self):
        self.data_dir = Path(__file__).parent / "data"
        self.activities_file = self.data_dir / "activities.json"
        self.users_file = self.data_dir / "users.json"
        self._activities = None
        self._users = None
    
    def load_activities(self) -> Dict[str, Any]:
        """Carrega as atividades do arquivo JSON"""
        if self._activities is None:
            try:
                with open(self.activities_file, 'r', encoding='utf-8') as f:
                    self._activities = json.load(f)
            except FileNotFoundError:
                self._activities = {}
        return self._activities
    
    def refresh_activities(self) -> Dict[str, Any]:
        """Force refresh activities from file"""
        self._activities = None
        return self.load_activities()
    
    def update_activity(self, activity_name: str, updates: Dict[str, Any]) -> bool:
        """Update an existing activity with new data"""
        activities = self.load_activities()
        if activity_name in activities:
            activities[activity_name].update(updates)
            self._activities = activities
            self.save_activities()
            return True
        return False
    
    def save_activities(self) -> None:
        """Salva as atividades no arquivo JSON"""
        if self._activities is not None:
            # Certifica que o diretório existe
            self.data_dir.mkdir(exist_ok=True)
            with open(self.activities_file, 'w', encoding='utf-8') as f:
                json.dump(self._activities, f, ensure_ascii=False, indent=4)
            # Clear cache to force reload on next access
            self._activities = None
    
    def load_users(self) -> Dict[str, Any]:
        """Carrega os dados de usuários do arquivo JSON"""
        if self._users is None:
            try:
                with open(self.users_file, 'r', encoding='utf-8') as f:
                    self._users = json.load(f)
            except FileNotFoundError:
                self._users = {"profiles": {}, "current_user": {}}
        return self._users
    
    def save_users(self) -> None:
        """Salva os dados de usuários no arquivo JSON"""
        if self._users is not None:
            self.data_dir.mkdir(exist_ok=True)
            with open(self.users_file, 'w', encoding='utf-8') as f:
                json.dump(self._users, f, ensure_ascii=False, indent=4)
    
    def get_activity(self, activity_name: str) -> Dict[str, Any] | None:
        """Obtém uma atividade específica"""
        activities = self.load_activities()
        return activities.get(activity_name)
    
    def activity_exists(self, activity_name: str) -> bool:
        """Verifica se uma atividade existe"""
        activities = self.load_activities()
        return activity_name in activities
    
    def add_participant(self, activity_name: str, name: str, email: str) -> bool:
        """Adiciona um participante a uma atividade"""
        activities = self.load_activities()
        if activity_name in activities:
            activity = activities[activity_name]
            # Verifica se já existe um participante com este email
            existing_participant = next((
                p for p in activity["participants"] 
                if (p.get("email") == email if isinstance(p, dict) else p == email)
            ), None)
            if not existing_participant:
                activity["participants"].append({"name": name, "email": email})
                self.save_activities()
                return True
        return False
    
    def remove_participant(self, activity_name: str, email: str) -> bool:
        """Remove um participante de uma atividade"""
        activities = self.load_activities()
        if activity_name in activities:
            activity = activities[activity_name]
            activity["participants"] = [
                p for p in activity["participants"] 
                if not (p.get("email") == email if isinstance(p, dict) else p == email)
            ]
            self.save_activities()
            return True
        return False
    
    def is_participant_registered(self, activity_name: str, email: str) -> bool:
        """Verifica se um participante está registrado em uma atividade"""
        activity = self.get_activity(activity_name)
        if activity:
            return any(
                (p.get("email") == email if isinstance(p, dict) else p == email)
                for p in activity["participants"]
            )
        return False
    
    def is_activity_full(self, activity_name: str) -> bool:
        """Verifica se uma atividade está lotada"""
        activity = self.get_activity(activity_name)
        if activity:
            return len(activity["participants"]) >= activity["max_participants"]
        return False
    
    def get_participant_activities_by_day(self, email: str) -> Dict[str, list]:
        """Obtém todas as atividades de um participante agrupadas por dia da semana"""
        activities = self.load_activities()
        participant_activities_by_day = {}
        
        for activity_name, activity_data in activities.items():
            # Verifica se o participante está inscrito (compatível com ambos os formatos)
            is_registered = any(
                (p.get("email") == email if isinstance(p, dict) else p == email)
                for p in activity_data["participants"]
            )
            if is_registered:
                day = self._extract_day_from_schedule(activity_data["schedule"])
                if day:
                    if day not in participant_activities_by_day:
                        participant_activities_by_day[day] = []
                    participant_activities_by_day[day].append(activity_name)
        
        return participant_activities_by_day
    
    def _extract_day_from_schedule(self, schedule: str) -> str | None:
        """Extrai o dia da semana do horário"""
        schedule_lower = schedule.lower()
        days = {
            'segunda': 'segunda',
            'segund': 'segunda',
            'terça': 'terca',
            'terç': 'terca',
            'quarta': 'quarta',
            'quart': 'quarta',
            'quinta': 'quinta',
            'quint': 'quinta',
            'sexta': 'sexta',
            'sext': 'sexta',
            'sábado': 'sabado',
            'sabad': 'sabado',
            'domingo': 'domingo',
            'doming': 'domingo'
        }
        
        for day_key, day_value in days.items():
            if day_key in schedule_lower:
                return day_value
        return None
    
    def has_activity_on_same_day(self, activity_name: str, email: str) -> bool:
        """Verifica se o participante já tem uma atividade no mesmo dia"""
        activity = self.get_activity(activity_name)
        if not activity:
            return False
            
        activity_day = self._extract_day_from_schedule(activity["schedule"])
        if not activity_day:
            return False
            
        participant_activities_by_day = self.get_participant_activities_by_day(email)
        
        # Verifica se já tem alguma atividade no mesmo dia
        return activity_day in participant_activities_by_day and len(participant_activities_by_day[activity_day]) > 0
    
    def get_current_user(self) -> Dict[str, Any]:
        """Obtém o usuário atual"""
        users_data = self.load_users()
        return users_data.get("current_user", {})
    
    def get_user_permissions(self) -> list:
        """Obtém as permissões do usuário atual"""
        users_data = self.load_users()
        current_user = users_data.get("current_user", {})
        profile_name = current_user.get("profile", "participant")
        profiles = users_data.get("profiles", {})
        profile = profiles.get(profile_name, {})
        return profile.get("permissions", ["read"])
    
    def has_permission(self, permission: str) -> bool:
        """Verifica se o usuário atual tem uma permissão específica"""
        permissions = self.get_user_permissions()
        return permission in permissions
    
    def switch_user_profile(self, profile_name: str) -> bool:
        """Alterna o perfil do usuário atual (simulação) e muda o usuário"""
        try:
            # Recarrega os dados do arquivo
            with open(self.users_file, 'r', encoding='utf-8') as f:
                users_data = json.load(f)
            
            profiles = users_data.get("profiles", {})
            users = users_data.get("users", {})
            
            if profile_name in profiles and profile_name in users:
                # Muda para o usuário específico deste perfil
                users_data["current_user"] = users[profile_name].copy()
                
                # Salva as alterações
                with open(self.users_file, 'w', encoding='utf-8') as f:
                    json.dump(users_data, f, ensure_ascii=False, indent=4)
                
                # Limpa o cache
                self._users = None
                return True
            return False
        except Exception as e:
            print(f"Error in switch_user_profile: {str(e)}")
            return False
    
    def get_current_user_activities(self) -> list:
        """Obtém as atividades em que o usuário atual está inscrito"""
        current_user = self.get_current_user()
        email = current_user.get("email", "")
        
        if not email:
            return []
            
        activities = self.load_activities()
        user_activities = []
        
        for activity_name, activity_data in activities.items():
            is_registered = any(
                (p.get("email") == email if isinstance(p, dict) else p == email)
                for p in activity_data["participants"]
            )
            if is_registered:
                user_activities.append(activity_name)
                
        return user_activities
    
    def get_user_activity_same_day(self, activity_name: str, user_email: str) -> str:
        """Retorna o nome da atividade que o usuário já tem no mesmo dia"""
        activities_by_day = self.get_participant_activities_by_day(user_email)
        activity = self.get_activity(activity_name)
        
        if not activity:
            return ""
            
        activity_day = self._extract_day_from_schedule(activity["schedule"])
        if not activity_day:
            return ""
            
        existing_activities = activities_by_day.get(activity_day, [])
        return existing_activities[0] if existing_activities else ""

# Instância global do gerenciador de dados
data_manager = DataManager()
