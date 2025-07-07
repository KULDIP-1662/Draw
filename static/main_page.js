const name_input = document.getElementById("name_input");
const host_btn = document.getElementById("host_btn");
const join_btn = document.getElementById("join_btn");
const help_text = document.getElementById("help_text");
const help_area = document.getElementById("help_area");
let codeInputShown = false;

// HOST PARTY
host_btn.addEventListener("click", () => {

  help_area.classList.add("show");
  // help_text.classList.add("show")
  const user_name = name_input.value.trim();
  help_text.textContent = ""; // Clear any previous messages

  if (!user_name) {
    help_text.textContent = "Please enter your name.";
    help_text.style.color = "red";
    return;
  }

  join_btn.disabled = true; // Disable join button while hosting
  help_text.textContent = "Creating session..."; // Show loading message
  help_text.style.color = "green"
  // help_text.style.transition = "pink 0.3s ease";
  // help_text.style.transitionDuration = "10s";

  fetch("http://127.0.0.1:8000/host-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: user_name }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.session_code) {
        help_text.innerHTML = `Session Created! <br><strong>${data.session_code}</strong>`;
        help_text.style.color = "green";
        help_text.style.marginTop = "20px";
        help_text.style.fontSize = "20px";
        startPollingForJoin(data.internal_id, user_name);
      } else if (data.error) {
        help_text.textContent = `Error: ${data.error}`;
        help_text.style.color = "red";
      }
    })
    .catch((err) => {
      console.error("Host error:", err);
      help_text.textContent = "An error occurred while hosting. Please try again.";
      help_text.style.color = "red";
    });
});

// JOIN PARTY
join_btn.addEventListener("click", () => {
  help_area.classList.add("show");

  const user_name = name_input.value.trim();
  help_text.textContent = ""; // Clear previous

  if (!user_name) {
    help_text.textContent = "Please enter your name.";
    help_text.style.color = "red";
    return;
  }

  host_btn.disabled = true;

  if (!codeInputShown) {
    const codeBox = document.getElementById("code_box");
    codeBox.classList.add("show");

    setTimeout(() => {
      document.getElementById("party_code").focus();
    }, 300);

    codeInputShown = true;
    return;
  }

  const sessionCode = document.getElementById("party_code").value.trim();

  if (!sessionCode) {
    help_text.textContent = "Please enter the session code.";
    help_text.style.color = "red";
    return;
  }

  // help_text.textContent = "Joining party...";
  // help_text.style.color = "green";

  fetch("http://127.0.0.1:8000/join-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: user_name, code: sessionCode }),
  })
    .then((res) => res.json())
    .then((data) => {
      
      if (data.error) {
        help_text.textContent = data.error;
        help_text.style.color = "red";
      } else if (data.internal_id) {
          window.location.href = `/play?code=${data.internal_id}&name=${encodeURIComponent(data.name)}`;
      }
    })
    .catch((err) => {
      console.error("Join error:", err);
      help_text.textContent = "An error occurred while joining. Please try again.";
      help_text.style.color = "red";
    });
    
});

function startPollingForJoin(internal_id, name) {
  const interval = setInterval(async () => {
    const res = await fetch(`/session-status/${internal_id}`);
    const data = await res.json();
    let i = 0;
    if (data.status === "active") {
      clearInterval(interval);

      // ✅ Redirect to play page
      window.location.href = `/play?code=${internal_id}&name=${encodeURIComponent(name)}`;
    }
    console.log("Session try: ", i);
    i++;
  }, 1000); // check every 1 second
}