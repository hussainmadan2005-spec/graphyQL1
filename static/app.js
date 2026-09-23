import {
    loginButton,
    loginForm,
    logoutButton,
    loginError
} from "./dom.js";
import { signIn } from "./functions/signIn.js";
import { loadProfile } from "./functions/profile.js";
import { showLogin, resetProfileDisplay, setLoginError } from "./functions/ui.js";

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("jwt");

    if (token) {
        console.log("JWT found in localStorage.");
        loadProfile();
    } else {
        console.log("No JWT found.");
        showLogin();
    }
});

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    setLoginError("");

    const identifier = document.getElementById("identifier").value.trim();
    const password = document.getElementById("password").value;

    if (!identifier || !password) {
        setLoginError("Please enter your username/email and password.");
        return;
    }

    loginButton.disabled = true;
    loginButton.textContent = "Logging in...";

    try {
        const token = await signIn(identifier, password);
        localStorage.setItem("jwt", token);
        console.log("JWT saved.");

        await loadProfile();
    } catch (error) {
        console.error("Login error:", error);

        localStorage.removeItem("jwt");
        showLogin();
        setLoginError(error.message);
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Login";
    }
});

logoutButton.addEventListener("click", () => {
    console.log("Logging out...");

    localStorage.removeItem("jwt");
    showLogin();
    resetProfileDisplay();
});
