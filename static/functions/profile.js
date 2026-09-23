import { graphqlRequest } from "./graphqlRequest.js";
import {
    USER_QUERY,
    XP_QUERY,
    TOTAL_AUDITS_QUERY,
    CURRENT_LEVEL_QUERY,
    PASS_FAIL_QUERY,
    XP_PER_PROJECT_QUERY,
    XP_PROGRESS_QUERY
} from "../queries.js";
import {
    loginError,
    usernameElement,
    fullnameElement,
    phoneNumberElement,
    degreeElement,
    userIdElement,
    projectLevelElement,
    auditRatioElement
} from "../dom.js";
import { renderAuditRatioChart, renderPassFailChart, renderXpPerProjectChart, renderXpProgressChart } from "../SVG.js";
import { showLogin, showProfile } from "./ui.js";

export async function loadProfile() {
    try {
        const data = await graphqlRequest(USER_QUERY);

        console.log("User data:", data);

        if (!data || !data.user || data.user.length === 0) {
            throw new Error("No user data returned.");
        }

        const user = data.user[0];
        const attrs = user.attrs || {};
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.login;
        const degree = attrs.Degree ?? attrs.degree ?? "Not provided";
        const phoneNumber = attrs.PhoneNumber ?? attrs.phoneNumber ?? "Not provided";

        usernameElement.textContent = user.login;
        fullnameElement.textContent = fullName;
        phoneNumberElement.textContent = phoneNumber;
        degreeElement.textContent = degree;
        userIdElement.textContent = user.id;

        showProfile();

        await loadXP();
        await loadXpProgress();
        await loadCurrentLevel();
        await loadAuditRatio();
        await loadPassFailStatus();
        await loadXpPerProject();
    } catch (error) {
        console.error("Profile loading failed:", error);

        localStorage.removeItem("jwt");
        showLogin();
        loginError.textContent = "Authentication failed: " + error.message;
    }
}

export function formatXP(xp) {
    if (xp >= 1000000) {
        return `${(xp / 1000000).toFixed(2)} MB`;
    }

    if (xp >= 1000) {
        return `${(xp / 1000).toFixed(2)} kB`;
    }

    return xp.toString();
}

export function formatAuditRatio(ratio) {
    const numericRatio = Number(ratio);

    if (!Number.isFinite(numericRatio)) {
        return "0.0";
    }

    return numericRatio.toFixed(1);
}

export async function loadXP() {
    try {
        const data = await graphqlRequest(XP_QUERY);
        const totalXP = Number(data.transaction_aggregate?.aggregate?.sum?.amount ?? 0);

        document.getElementById("xp").textContent = formatXP(totalXP);
        window.totalXPValue = totalXP;

        console.log("Total XP:", totalXP);
    } catch (error) {
        console.error("Could not load XP:", error);
        document.getElementById("xp").textContent = "Error";
        window.totalXPValue = 0;
    }
}

export async function loadXpProgress() {
    try {
        const data = await graphqlRequest(XP_PROGRESS_QUERY);
        const transactions = Array.isArray(data?.transaction) ? data.transaction : [];
        const totalXP = Number(data?.transaction_aggregate?.aggregate?.sum?.amount ?? 0);
        const points = [];
        let runningTotal = 0;

        const sorted = [...transactions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        for (const item of sorted) {
            const amount = Number(item?.amount ?? 0);
            const createdAt = item?.createdAt;

            if (!createdAt || !Number.isFinite(amount)) {
                continue;
            }

            runningTotal += Math.max(amount, 0);
            points.push({
                createdAt,
                xp: runningTotal
            });
        }

        if (points.length === 0) {
            const target = document.getElementById("xpProgressChart");
            if (target) target.innerHTML = '<p class="loading">No XP progress data.</p>';
            return;
        }

        renderXpProgressChart(points, totalXP);
        console.log("XP progress points:", points.length, "totalXP:", totalXP);
    } catch (error) {
        console.error("Could not load XP progress:", error);
        const target = document.getElementById("xpProgressChart");
        if (target) {
            target.innerHTML = '<p class="loading">Unable to load XP progress.</p>';
        }
    }
}

export async function loadCurrentLevel() {
    try {
        const data = await graphqlRequest(CURRENT_LEVEL_QUERY);
        const level = Number(data.transaction?.[0]?.amount ?? 0);

        projectLevelElement.textContent = Number.isFinite(level) ? String(level) : "0";
        console.log("Current level:", level);
    } catch (error) {
        console.error("Could not load current level:", error);
        projectLevelElement.textContent = "Error";
    }
}

export async function loadAuditRatio() {
    try {
        const data = await graphqlRequest(TOTAL_AUDITS_QUERY);

        const done = Number(data.done?.aggregate?.sum?.amount ?? 0);
        const received = Number(data.received?.aggregate?.sum?.amount ?? 0);
        const ratio = received === 0 ? 0 : done / received;

        renderAuditRatioChart(done, received, ratio, formatXP);
        auditRatioElement.textContent = formatAuditRatio(ratio);
        console.log("Audit ratio:", ratio);
    } catch (error) {
        console.error("Could not load audit ratio:", error);
        document.getElementById("xpGraph").innerHTML = '<p class="loading">Unable to load audit graph.</p>';
        auditRatioElement.textContent = "Error";
    }
}

export async function loadPassFailStatus() {
    try {
        const data = await graphqlRequest(PASS_FAIL_QUERY);
        const results = Array.isArray(data?.result) ? data.result : [];

        let passCount = 0;
        let failCount = 0;

        for (const item of results) {
            const grade = Number(item?.grade ?? 0);

            if (grade > 1) {
                passCount += 1;
            } else {
                failCount += 1;
            }
        }

        renderPassFailChart(passCount, failCount);
        console.log("Pass/fail projects:", { passCount, failCount });
    } catch (error) {
        console.error("Could not load pass/fail status:", error);
        const target = document.getElementById("passFailGraph");

        if (target) {
            target.innerHTML = '<p class="loading">Unable to load project status.</p>';
        }
    }
}

export async function loadXpPerProject() {
    try {
        const data = await graphqlRequest(XP_PER_PROJECT_QUERY);
        const results = Array.isArray(data?.transaction) ? data.transaction : [];
        const totals = new Map();

        for (const item of results) {
            const projectName = item?.object?.name || "Unknown";
            const amount = Number(item?.amount ?? 0);

            if (!Number.isFinite(amount) || amount <= 0) {
                continue;
            }

            totals.set(projectName, (totals.get(projectName) || 0) + amount);
        }

        const allProjects = [...totals.entries()]
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount);

        const totalXP = Number(window.totalXPValue ?? 0);
        const topProjects = allProjects.slice(0, 3);
        const topProjectsTotal = topProjects.reduce((sum, project) => sum + project.amount, 0);
        const otherProjectTotal = Math.max(totalXP - topProjectsTotal, 0);
        const projects = [...topProjects];

        if (otherProjectTotal > 0) {
            projects.push({ name: "Others", amount: otherProjectTotal });
        }

        renderXpPerProjectChart(projects, totalXP);
        console.log("Top 3 projects + others:", projects, "totalXP:", totalXP);
    } catch (error) {
        console.error("Could not load XP per project:", error);
        const target = document.getElementById("xpPerProjectGraph");

        if (target) {
            target.innerHTML = '<p class="loading">Unable to load XP graph.</p>';
        }
    }
}
