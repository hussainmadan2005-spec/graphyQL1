import { GRAPHQL_URL } from "../config.js";

export async function graphqlRequest(query, variables = {}) {
    const token = localStorage.getItem("jwt");

    if (!token) {
        throw new Error("No JWT found.");
    }

    console.log("Sending authenticated GraphQL request...");

    const response = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            query,
            variables
        })
    });

    const responseText = await response.text();

    console.log("GraphQL status:", response.status);
    console.log("GraphQL response:", responseText);

    if (!response.ok) {
        throw new Error(`GraphQL request failed (${response.status}).`);
    }

    let result;

    try {
        result = JSON.parse(responseText);
    } catch (error) {
        throw new Error("GraphQL returned invalid JSON.");
    }

    if (result.errors) {
        console.error("GraphQL errors:", result.errors);
        throw new Error(result.errors[0]?.message || "GraphQL request failed.");
    }

    return result.data;
}
