const nameInput = document.getElementById("input_value");
const host_btn = document.getElementById("btn1");
// const joinCodeInput = document.getElementById("join_code");
// const join_btn = document.getElementById("btn2");

host_btn.addEventListener("click", () => {
  const player_name = nameInput.value;

  const output = document.getElementById("output_text");

  if (!player_name) {
    output.textContent = "Please enter your name.";
    output.style.color = "red";
    return;
  }

  console.log("in event", player_name);

  fetch("http://127.0.0.1:8000/host-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: player_name }),
  })
    .then((response) => {
      console.log("Fetch response:", response);
      return response.json(); // if your backend returns JSON
    })
    .then((data) => {
      console.log("Parsed data:", data);
      const output = document.getElementById("output_text");
      if (data.session_code) {
        output.innerHTML = `<div>Session Created!</div><div>${data.session_code}</div>`;
        output.style.marginTop = "20px";
        output.style.fontWeight = "bold";
        output.style.border = "none";
        output.style.padding = "16px 40px";
        output.style.marginLeft = "30px";
        output.style.width = "8.9cm";
        output.style.borderRadius = "50px";
        output.style.fontSize = "20px";
        output.style.backgroundColor = "red";
        output.style.color = "white";
        output.style.textAlign = "center";
      } else if (data.error) {
        output.textContent = `Error: ${data.error}`;
        output.style.color = "red";
      }
    })
    .catch((error) => {
      console.error("Fetch error:", error);
      output.textContent = "An error occurred. Please try again.";
      output.style.color = "red";
    });
});

// const nameInput = document.getElementById("input_value");
const joinBtn = document.getElementById("btn2");
const output = document.getElementById("output_text1");

let codeInputShown = false;

joinBtn.addEventListener("click", () => {
  const player_name = nameInput.value.trim();
    if (!player_name) {
    output.textContent = "Please enter name";
    output.style.color = "red";
    return;
  }

  if (!codeInputShown) {
    // First click: show code input field
    const codeInput = document.createElement("input");
    codeInput.type = "text";
    codeInput.placeholder = "Enter Session Code";
    codeInput.id = "code_input";

    const box = document.querySelector(".box");
    box.insertBefore(codeInput, joinBtn.parentElement); // insert above the buttons

    codeInputShown = true;
    return; // Exit here; don't call API yet
  }

  // Second click: get code and call API
  const joinCodeInput = document.getElementById("code_input");
  const join_code = joinCodeInput.value.trim();

  if (!join_code) {
    output.textContent = "Please enter code.";
    output.style.color = "red";
    return;
  }

  // Call the API
  fetch("http://127.0.0.1:8000/join-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: player_name, code: join_code }),
  })
    .then((response) => response.json())
    .then((data) => {
        if (data['error']){
            output.textContent = data['error'];
            output.style.color = "red";
        }
        console.log("before if", data)
        if(data['success']){
            console.log("after if", data)
            output.textContent = data['success'];
            output.style.color = "green";
        }

    })
    .catch((error) => {
      console.error("Fetch error:", error);
      output.textContent = "An error while calling api occurred. Please try again.";
      output.style.color = "red";
    });
});
