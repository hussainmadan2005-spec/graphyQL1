import {
    loginPage,
    profilePage,
    loginError,
    usernameElement,
    userIdElement,
    xpElement
} from "../dom.js";

export function showLogin() {
    loginPage.classList.remove("hidden");
    profilePage.classList.add("hidden");
}

export function showProfile() {
    loginPage.classList.add("hidden");
    profilePage.classList.remove("hidden");
}

export function setLoginError(message) {
    loginError.textContent = message;
}

export function resetProfileDisplay() {
    usernameElement.textContent = "Loading...";
    userIdElement.textContent = "-";
    xpElement.textContent = "0";
}
