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
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const participants = details.participants ?? [];
        const spotsLeft = details.max_participants - participants.length;
        activityCard.dataset.maxParticipants = details.max_participants;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="activity-availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = `Participants (${participants.length})`;
        participantsSection.appendChild(participantsHeading);

        const participantsList = document.createElement("ul");
        participantsList.className = "participant-list";
        participants.forEach((email) => {
          const participant = document.createElement("li");
          participant.className = "participant-item";

          const participantEmail = document.createElement("span");
          participantEmail.className = "participant-email";
          participantEmail.textContent = email;
          participant.appendChild(participantEmail);

          const removeButton = document.createElement("button");
          removeButton.type = "button";
          removeButton.className = "participant-remove";
          removeButton.setAttribute("aria-label", `Unregister ${email} from ${name}`);
          removeButton.title = "Unregister participant";
          removeButton.dataset.activity = name;
          removeButton.dataset.email = email;

          const trashIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          trashIcon.setAttribute("viewBox", "0 0 24 24");
          trashIcon.setAttribute("aria-hidden", "true");
          trashIcon.setAttribute("focusable", "false");
          const trashPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
          trashPath.setAttribute("d", "M3 6h18M8 6V4h8v2m2 0-.9 14H6.9L6 6m4 4v7m4-7v7");
          trashPath.setAttribute("fill", "none");
          trashPath.setAttribute("stroke", "currentColor");
          trashPath.setAttribute("stroke-linecap", "round");
          trashPath.setAttribute("stroke-linejoin", "round");
          trashPath.setAttribute("stroke-width", "1.8");
          trashIcon.appendChild(trashPath);
          removeButton.appendChild(trashIcon);
          participant.appendChild(removeButton);
          participantsList.appendChild(participant);
        });
        participantsSection.appendChild(participantsList);
        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".participant-remove");
    if (!removeButton || removeButton.disabled) return;

    const { activity, email } = removeButton.dataset;
    removeButton.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Unable to unregister participant");
      }

      const card = removeButton.closest(".activity-card");
      removeButton.closest(".participant-item").remove();
      const participantCount = card.querySelectorAll(".participant-item").length;
      card.querySelector(".participants h5").textContent = `Participants (${participantCount})`;
      card.querySelector(".activity-availability").lastChild.textContent =
        ` ${card.dataset.maxParticipants - participantCount} spots left`;
    } catch (error) {
      removeButton.disabled = false;
      messageDiv.textContent = error.message || "Failed to unregister participant";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering participant:", error);
    }
  });

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
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
