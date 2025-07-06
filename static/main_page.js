const nameInput = document.getElementById("input_value");
const hostBtn = document.getElementById("btn1");
const joinBtn = document.getElementById("btn2");
const output = document.getElementById("output_text1");
const outputWrapper = document.getElementById("output_text");
let codeInputShown = false;

// HOST PARTY
hostBtn.addEventListener("click", () => {
  outputWrapper.classList.add("show");
  // output.classList.add("show")
  const playerName = nameInput.value.trim();
  output.textContent = ""; // Clear any previous messages

  if (!playerName) {
    output.textContent = "Please enter your name.";
    output.style.color = "red";
    return;
  }

  fetch("http://127.0.0.1:8000/host-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: playerName }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.session_code) {
        output.innerHTML = `Session Created! <br><strong>${data.session_code}</strong>`;
        output.style.color = "green";
        output.style.marginTop = "20px";
        output.style.fontSize = "20px";
      } else if (data.error) {
        output.textContent = `Error: ${data.error}`;
        output.style.color = "red";
      }
    })
    .catch((err) => {
      console.error("Host error:", err);
      output.textContent = "An error occurred while hosting. Please try again.";
      output.style.color = "red";
    });
});

// JOIN PARTY
joinBtn.addEventListener("click", () => {
  outputWrapper.classList.add("show");

  const playerName = nameInput.value.trim();
  output.textContent = ""; // Clear previous

  if (!playerName) {
    output.textContent = "Please enter your name.";
    output.style.color = "red";
    return;
  }

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
    output.textContent = "Please enter the session code.";
    output.style.color = "red";
    return;
  }

  output.textContent = "Joining party...";
  output.style.color = "green";

  fetch("http://127.0.0.1:8000/join-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: playerName, code: sessionCode }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        output.textContent = data.error;
        output.style.color = "red";
      } else if (data.success) {
        output.textContent = data.success;
        output.style.color = "green";
      }
    })
    .catch((err) => {
      console.error("Join error:", err);
      output.textContent = "An error occurred while joining. Please try again.";
      output.style.color = "red";
    });
});
