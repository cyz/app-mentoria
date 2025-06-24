document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "card mb-4 activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        
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

        activityCard.innerHTML = `
          <h4 class='card-title'>${name}</h4>
          <p class='card-text'>${details.description}</p>
          <ul><li><strong>Agenda:</strong> ${details.schedule}</li>
          <li><strong>Disponibilidade:</strong> ${spotsLeft} vagas livres</li></ul>
          ${participantsHTML}
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
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        
        // Refresh activities list to reflect changes
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "Erro ao cancelar inscrição";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Falha ao cancelar inscrição. Tente novamente.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Erro ao cancelar inscrição:", error);
    }
  }

  // Make cancelParticipant function globally available
  window.cancelParticipant = cancelParticipant;

  // Handle form submission
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
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        
        // Refresh activities list to reflect changes
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "Ocorreu um erro";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Falha ao cadastrar. Tente novamente.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Erro ao inscrever-se:", error);
    }
  });

  // Initialize app
  fetchActivities();
});