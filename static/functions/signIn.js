import { SIGNIN_URL } from "../config.js";

export async function signIn(identifier, password) {
    const credentials = btoa(`${identifier}:${password}`);

    console.log("Sending signin request...");

    const response = await fetch(SIGNIN_URL, {
        method: "POST",
        headers: {
            Authorization: `Basic ${credentials}`
        }
    });

    console.log("Signin status:", response.status);

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Signin error:", errorText);

        if (response.status === 401) {
            throw new Error("Invalid username/email or password.");
        }

        throw new Error(`Login failed (${response.status}).`);
    }

    let token = await response.text();
    token = token.trim();
    token = token.replace(/^"|"$/g, "");

    if (!token) {
        throw new Error("Server did not return a JWT.");
    }

    const jwtParts = token.split(".");
    console.log("JWT parts:", jwtParts.length);

    if (jwtParts.length !== 3) {
        console.error("Unexpected token received.");
        throw new Error("The signin server returned an invalid JWT.");
    }

    console.log("JWT received.");

    return token;
}
