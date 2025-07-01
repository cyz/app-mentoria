document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const createActivityForm = document.getElementById("create-activity-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and select options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Selecione a atividade --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "card mb-4 activity-card";

        const spotsLeft = details.max_participants - details.current_participants;
        
        // Create participants list HTML
        let participantsHTML = '';
        if (details.participants.length > 0) {
          const participantsList = details.participants.map(email => 
            `<li>
              <span class="participant-email">${email}</span>
              <button class="delete-participant" onclick="cancelParticipant('${name}', '${email}')" title="Cancelar inscrição">
                🗑️
              </button>
            </li>`
          ).join('');
          participantsHTML = `
            <div class="participants-section">
              <h5>Participantes inscritos:</h5>
              <ul class="participants-list">
                ${participantsList}
              </ul>
            </div>
          `;
        } else {
          participantsHTML = `
            <div class="participants-section">
              <h5>Participantes inscritos:</h5>
              <p class="no-participants">Nenhum participante inscrito ainda</p>
            </div>
          `;
        }

        // Create soft skills badges
        const skillsBadges = details.soft_skills_focus?.map(skill => 
          `<span class="badge bg-secondary me-1">${skill}</span>`
        ).join('') || '';

        activityCard.innerHTML = `
          <div class="card-header d-flex justify-content-between align-items-center">
            <h4 class='card-title mb-0'>${name}</h4>
            <small class="text-muted">👩‍🏫 ${details.mentor_name}</small>
          </div>
          <div class="card-body">
            <p class='card-text'>${details.description}</p>
            <div class="mb-2">
              <strong>📅 Horário:</strong> ${details.schedule}
            </div>
            <div class="mb-2">
              <strong>👥 Disponibilidade:</strong> ${spotsLeft} vagas livres (${details.current_participants}/${details.max_participants})
            </div>
            ${skillsBadges ? `<div class="mb-2"><strong>🎯 Soft Skills:</strong><br>${skillsBadges}</div>` : ''}
            ${details.requirements ? `<div class="mb-2"><strong>📋 Pré-requisitos:</strong> ${details.requirements}</div>` : ''}
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Falha ao carregar as atividades. Tente novamente mais tarde.</p>";
      console.error("Erro ao buscar atividades:", error);
    }
  }

  // Function to cancel participant signup
  async function cancelParticipant(activityName, email) {
    if (!confirm(`Tem certeza que deseja cancelar a inscrição de ${email} na atividade "${activityName}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/cancel?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, 'success');
        fetchActivities(); // Refresh activities list
      } else {
        showMessage(result.detail || "Erro ao cancelar inscrição", 'error');
      }
    } catch (error) {
      showMessage("Falha ao cancelar inscrição. Tente novamente.", 'error');
      console.error("Erro ao cancelar inscrição:", error);
    }
  }

  // Make cancelParticipant function globally available
  window.cancelParticipant = cancelParticipant;

  // Handle signup form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, 'success');
        signupForm.reset();
        fetchActivities(); // Refresh activities list
      } else {
        showMessage(result.detail || "Ocorreu um erro", 'error');
      }
    } catch (error) {
      showMessage("Falha ao cadastrar. Tente novamente.", 'error');
      console.error("Erro ao inscrever-se:", error);
    }
  });

  // Handle create activity form submission
  createActivityForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(createActivityForm);
    const softSkillsInput = document.getElementById("soft-skills").value;
    
    const activityData = {
      title: document.getElementById("title").value,
      description: document.getElementById("description").value,
      mentor_name: document.getElementById("mentor-name").value,
      mentor_email: document.getElementById("mentor-email").value,
      max_participants: parseInt(document.getElementById("max-participants").value),
      schedule: document.getElementById("schedule").value,
      soft_skills_focus: softSkillsInput.split(',').map(skill => skill.trim()).filter(skill => skill),
      requirements: document.getElementById("requirements").value || null
    };

    await createActivity(activityData);
  });

  // Function to show notification message
  function showMessage(text, type = 'success') {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");
    
    // Hide message after 5 seconds
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to create new activity
  async function createActivity(activityData) {
    try {
      const response = await fetch("/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(activityData),
      });

      const result = await response.json();

      if (response.ok) {
        showMessage(`Turma "${activityData.title}" criada com sucesso!`, 'success');
        createActivityForm.reset();
        
        // Collapse the form
        const collapseElement = document.getElementById("admin-form");
        const bsCollapse = new bootstrap.Collapse(collapseElement, { hide: true });
        
        // Refresh activities list
        fetchActivities();
      } else {
        showMessage(result.detail || "Erro ao criar turma", 'error');
      }
    } catch (error) {
      showMessage("Falha ao criar turma. Tente novamente.", 'error');
      console.error("Erro ao criar atividade:", error);
    }
  }

  // Initialize app
  fetchActivities();
});