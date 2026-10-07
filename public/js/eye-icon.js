//  code for login page to toggle password visibility

function togglePassword() {
  const passwordInput = document.getElementById("password");
  const toggleIcon = document.getElementById("toggleIcon");

  if (passwordInput.type === "password") {
    // Password dikhao
    passwordInput.type = "text";
    toggleIcon.textContent = "visibility_off";
  } else {
    // Password chhupao
    passwordInput.type = "password";
    toggleIcon.textContent = "visibility";
  }
}

// code for user registration page to toggle password visibility
function toggleField(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);

  // Safety check taake error na aaye
  if (input && icon) {
    if (input.type === "password") {
      input.type = "text";
      icon.textContent = "visibility_off";
    } else {
      input.type = "password";
      icon.textContent = "visibility";
    }
  }
}
