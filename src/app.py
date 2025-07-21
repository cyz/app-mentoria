from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
import os
from pathlib import Path
from .data_manager import data_manager

app = FastAPI(title="WoMakersCode", 
              description="API for organizing soft skills mentoring classes")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")

@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")


@app.get("/users/current")
def get_current_user():
    """Gets current user information"""
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
    """Switch user profile (simulation)"""
    try:
        result = data_manager.switch_user_profile(profile_name)
        
        if result:
            new_user = data_manager.get_current_user()
            return {"message": f"Profile changed to {profile_name}", "user": new_user}
        else:
            raise HTTPException(status_code=400, detail="Failed to change profile")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@app.get("/users/profiles")
def get_profiles():
    """Gets all available profiles"""
    users_data = data_manager.load_users()
    return users_data.get("profiles", {})

@app.get("/activities")
def get_activities():
    return data_manager.refresh_activities()


@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, name: str = None, email: str = None):
    """Enroll a student in a mentorship"""
    current_user = data_manager.get_current_user()

    # If participant, use own user data
    if "self_manage" in data_manager.get_user_permissions():
        name = current_user.get("name", "")
        email = current_user.get("email", "")
        if not name or not email:
            raise HTTPException(status_code=400, detail="User data is incomplete")
    else:
        # For other profiles, check permissions
        if not data_manager.has_permission("manage_participants") and not data_manager.has_permission("create"):
            raise HTTPException(status_code=403, detail="No permission to enroll participants")

        if not name or not email:
            raise HTTPException(status_code=400, detail="Name and email are required")

    # Validate activity exists
    if not data_manager.activity_exists(activity_name):
        raise HTTPException(status_code=404, detail="Activity not found")

    # Check if student is already registered
    if data_manager.is_participant_registered(activity_name, email):
        raise HTTPException(status_code=400, detail="Student is already registered for this activity")

    # Check if activity is full
    if data_manager.is_activity_full(activity_name):
        raise HTTPException(status_code=400, detail="Activity is full")

    # Check if student has another activity on the same day
    if data_manager.has_activity_on_same_day(activity_name, email):
        existing_activity = data_manager.get_user_activity_same_day(activity_name, email)
        raise HTTPException(
            status_code=400, 
            detail=f"You already have a mentorship on the same day: '{existing_activity}'. It is not possible to enroll in more than one mentorship per week."
        )

    # Add student
    data_manager.add_participant(activity_name, name, email)
    return {"message": f"Student {name} has been registered for the activity: {activity_name}"}


@app.delete("/activities/{activity_name}/cancel")
def cancel_activity_signup(activity_name: str, email: str = None):
    """Cancel a student's registration for a mentorship"""
    current_user = data_manager.get_current_user()

    # If participant, can only cancel own registration
    if "self_manage" in data_manager.get_user_permissions():
        email = current_user.get("email", "")
        if not email:
            raise HTTPException(status_code=400, detail="User email not found")
    else:
        # For other profiles, check permissions
        if not data_manager.has_permission("manage_participants") and not data_manager.has_permission("delete"):
            raise HTTPException(status_code=403, detail="No permission to remove participants")
        
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")
        
    # Validate activity exists
    if not data_manager.activity_exists(activity_name):
        raise HTTPException(status_code=404, detail="Activity not found")

    # Check if student is registered
    if not data_manager.is_participant_registered(activity_name, email):
        raise HTTPException(status_code=400, detail="Student is not registered for this activity")

    # Remove student
    data_manager.remove_participant(activity_name, email)
    return {"message": f"Registration has been canceled from the activity: {activity_name}"}


class NewActivity(BaseModel):
    name: str
    description: str
    schedule: str
    max_participants: int

@app.post("/activities")
def create_activity(activity: NewActivity):
    """Create a new mentorship"""
    # Check permissions
    if not data_manager.has_permission("create"):
        raise HTTPException(status_code=403, detail="No permission to create mentorship")

    activities = data_manager.load_activities()
    
    # Check if activity already exists
    if activity.name in activities:
        raise HTTPException(status_code=400, detail="Mentorship with this name already exists")

    # Add new activity
    activities[activity.name] = {
        "description": activity.description,
        "schedule": activity.schedule,
        "max_participants": activity.max_participants,
        "participants": []
    }
    
    # Update the data manager's activities and save
    data_manager._activities = activities
    data_manager.save_activities()
    
    return {"message": f"Mentorship '{activity.name}' successfully created"}

class ActivityUpdate(BaseModel):
    max_participants: int | None = None
    description: str | None = None
    schedule: str | None = None

@app.put("/activities/{activity_name}")
def update_activity(activity_name: str, updates: ActivityUpdate):
    """Update an existing mentorship"""
    # Check permissions
    if not data_manager.has_permission("create") and not data_manager.has_permission("manage_participants"):
        raise HTTPException(status_code=403, detail="No permission to update mentorship")

    # Check if activity exists
    if not data_manager.activity_exists(activity_name):
        raise HTTPException(status_code=404, detail="Mentorship not found")

    # Prepare updates dict (only include non-None values)
    update_dict = {}
    if updates.max_participants is not None:
        update_dict["max_participants"] = updates.max_participants
    if updates.description is not None:
        update_dict["description"] = updates.description
    if updates.schedule is not None:
        update_dict["schedule"] = updates.schedule
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No updates provided")
    
    # Update activity
    success = data_manager.update_activity(activity_name, update_dict)
    if success:
        return {"message": f"Mentorship '{activity_name}' successfully updated"}
    else:
        raise HTTPException(status_code=500, detail="Error updating mentorship")

@app.delete("/activities/{activity_name}")
def delete_activity(activity_name: str):
    """Delete a mentorship"""
    # Check permissions
    if not data_manager.has_permission("delete"):
        raise HTTPException(status_code=403, detail="No permission to delete mentorship")

    activities = data_manager.load_activities()
    
    # Check if activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Mentorship not found")
    
    # Remove activity
    del activities[activity_name]
    
    # Update the data manager's activities
    data_manager._activities = activities
    data_manager.save_activities()

    return {"message": f"Mentorship '{activity_name}' successfully deleted"}

@app.get("/users/activities")
def get_current_user_activities():
    """Gets the activities the current user is subscribed to"""
    activities = data_manager.get_current_user_activities()
    return {"activities": activities}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)