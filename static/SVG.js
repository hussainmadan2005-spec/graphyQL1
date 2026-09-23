export function renderAuditRatioChart(done, received, ratio) {
    const container = document.getElementById("xpGraph");

    if (!container) {
        return;
    }

    const formatXP = (xp) => {
        if (xp >= 1000000) {
            return `${(xp / 1000000).toFixed(2)} MB`;
        }

        if (xp >= 1000) {
            return `${(xp / 1000).toFixed(2)} kB`;
        }

        return xp.toString();
    };

    const safeDone = Number.isFinite(done) ? Math.max(done, 0) : 0;
    const safeReceived = Number.isFinite(received) ? Math.max(received, 0) : 0;
    const safeRatio = Number.isFinite(ratio) ? ratio : 0;
    const doneInDisplay = safeDone / 1000000;
    const receivedInDisplay = safeReceived / 1000000;
    const maxValue = Math.max(doneInDisplay, receivedInDisplay, 1);

    const leftX = 120;
    const rightX = 300;
    const baseY = 150;
    const graphHeight = 90;
    const yDone = baseY - (doneInDisplay / maxValue) * graphHeight;
    const yReceived = baseY - (receivedInDisplay / maxValue) * graphHeight;
    const ratioLabelY = 35;

    container.innerHTML = `
        <svg class="chart-svg" viewBox="0 0 420 220" role="img" aria-label="Audit ratio chart">
            <defs>
                <linearGradient id="auditLineGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stop-color="#22c55e" />
                    <stop offset="100%" stop-color="#f97316" />
                </linearGradient>
            </defs>

            <g opacity="0.22" stroke="#94a3b8" stroke-width="1">
                <line x1="40" y1="45" x2="380" y2="45" />
                <line x1="40" y1="90" x2="380" y2="90" />
                <line x1="40" y1="135" x2="380" y2="135" />
                <line x1="40" y1="180" x2="380" y2="180" />
            </g>

            <path
                d="M ${leftX} ${yDone} L ${rightX} ${yReceived}"
                fill="none"
                stroke="url(#auditLineGradient)"
                stroke-width="5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />

            <circle cx="${leftX}" cy="${yDone}" r="8" fill="#22c55e" />
            <circle cx="${rightX}" cy="${yReceived}" r="8" fill="#f97316" />

            <text x="${leftX}" y="205" text-anchor="middle" fill="#dbeafe" font-size="13" font-weight="700">Done</text>
            <text x="${leftX}" y="${yDone - 12}" text-anchor="middle" fill="#a7f3d0" font-size="12" font-weight="700">${formatXP(safeDone)}</text>

            <text x="${rightX}" y="205" text-anchor="middle" fill="#fed7aa" font-size="13" font-weight="700">Received</text>
            <text x="${rightX}" y="${yReceived - 12}" text-anchor="middle" fill="#fdba74" font-size="12" font-weight="700">${formatXP(safeReceived)}</text>

            <rect x="130" y="12" width="160" height="28" rx="14" fill="#0f172a" opacity="0.82" />
            <text x="210" y="${ratioLabelY}" text-anchor="middle" fill="#f8fafc" font-size="13" font-weight="700">Ratio ${safeRatio.toFixed(1)}</text>
        </svg>
    `;
}

export function renderXpProgressChart(points, totalXP) {
    const container = document.getElementById("xpProgressChart");

    if (!container) {
        return;
    }

    const safePoints = Array.isArray(points)
        ? points
            .filter((point) => point && Number.isFinite(point.xp) && point.xp >= 0 && point.createdAt)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        : [];

    if (safePoints.length === 0) {
        container.innerHTML = '<p class="loading">No XP progress data.</p>';
        return;
    }

    const formatValue = (value) => {
        const v = Number(value || 0);
        if (v >= 1000) {
           return `${Math.round(v / 1000)} kB`;

        }
        return `${Math.round(v)} XP`;
    };

    const width = 1200;
    const height = 360;
    const margin = { top: 18, right: 30, bottom: 42, left: 58 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const values = safePoints.map((point) => point.xp);
    const maxValue = Math.max(...values, 1);
    const lastValue = safePoints[safePoints.length - 1].xp;
    const totalDisplay = Number.isFinite(totalXP) ? totalXP : lastValue;

    const xForIndex = (index) => {
        if (safePoints.length === 1) {
            return margin.left + chartWidth / 2;
        }
        return margin.left + (index / (safePoints.length - 1)) * chartWidth;
    };

    const yForValue = (value) => {
        const ratio = value / maxValue;
        return margin.top + chartHeight - ratio * chartHeight;
    };

    const linePath = safePoints.map((point, index) => {
        const x = xForIndex(index);
        const y = yForValue(point.xp);
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");

    const gridValues = [0, 0.25, 0.5, 0.75, 1].map((ratio) => maxValue * ratio).reverse();
    const gridLines = gridValues.map((value) => {
        const y = yForValue(value);
        return `
            <g>
                <line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="#334155" stroke-width="1" opacity="0.75" />
                <text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" fill="#cbd5e1" font-size="11" font-weight="700">${formatValue(value)}</text>
            </g>
        `;
    }).join("");

    const dates = safePoints.filter((_, index) => {
        const total = safePoints.length - 1;
        return index === 0 || index === Math.round(total * 0.25) || index === Math.round(total * 0.5) || index === Math.round(total * 0.75) || index === total;
    });

    const xLabels = dates.map((point) => {
        const index = safePoints.indexOf(point);
        const date = new Date(point.createdAt);
        const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const x = xForIndex(index);
        return `
            <g>
                <text x="${x}" y="${height - 14}" text-anchor="middle" fill="#a5b4fc" font-size="11" font-weight="600">${label}</text>
            </g>
        `;
    }).join("");

    const lastX = xForIndex(safePoints.length - 1);
    const lastY = yForValue(lastValue);
    const lastBadge = `
        <g>
            <rect x="${width - 120}" y="${margin.top - 12}" width="104" height="30" rx="8" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(148, 163, 184, 0.2)" />
            <text x="${width - 68}" y="${margin.top + 9}" text-anchor="middle" fill="#f8fafc" font-size="12" font-weight="700">${formatValue(totalDisplay)}</text>
        </g>
    `;

    container.innerHTML = `
        <svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="XP progress chart">
            <rect x="0" y="0" width="${width}" height="${height}" fill="#0f172a" opacity="0.2" />
            ${gridLines}
            <path d="${linePath}" fill="none" stroke="#3dd9f2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="${lastX}" cy="${lastY}" r="7" fill="#3dd9f2" stroke="#dffcff" stroke-width="2" />
            ${xLabels}
            <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#475569" stroke-width="1" />
            ${lastBadge}
        </svg>
    `;
}

export function renderPassFailChart(passCount, failCount) {
    const container = document.getElementById("passFailGraph");

    if (!container) {
        return;
    }

    const safePass = Number.isFinite(passCount) ? Math.max(passCount, 0) : 0;
    const safeFail = Number.isFinite(failCount) ? Math.max(failCount, 0) : 0;
    const maxVisualValue = Math.max(safePass, safeFail, 15);

    const chartBottom = 190;
    const chartHeight = 150;
    const leftBarX = 85;
    const rightBarX = 200;
    const barWidth = 80;

    const leftHeight = (safePass / maxVisualValue) * chartHeight;
    const rightHeight = (safeFail / maxVisualValue) * chartHeight;

    const passLabel = String(Math.round(safePass));
    const failLabel = String(Math.round(safeFail));

    container.innerHTML = `
        <svg class="chart-svg" viewBox="0 0 340 220" role="img" aria-label="Pass fail project chart">
            <g opacity="0.18" stroke="#94a3b8" stroke-width="1">
                <line x1="58" y1="30" x2="300" y2="30" />
                <line x1="58" y1="70" x2="300" y2="70" />
                <line x1="58" y1="110" x2="300" y2="110" />
                <line x1="58" y1="150" x2="300" y2="150" />
                <line x1="58" y1="190" x2="300" y2="190" />
            </g>

            <line x1="58" y1="30" x2="58" y2="190" stroke="#94a3b8" stroke-width="1.5" opacity="0.5" />
            <line x1="58" y1="190" x2="300" y2="190" stroke="#94a3b8" stroke-width="1.5" opacity="0.5" />

            <rect x="${leftBarX}" y="${chartBottom - leftHeight}" width="${barWidth}" height="${leftHeight}" rx="6" fill="#6ecce6" />
            <rect x="${rightBarX}" y="${chartBottom - rightHeight}" width="${barWidth}" height="${rightHeight}" rx="6" fill="#f4a261" />

            <text x="${leftBarX + barWidth / 2}" y="${chartBottom - leftHeight - 8}" text-anchor="middle" fill="#f8fafc" font-size="13" font-weight="700">${passLabel}</text>
            <text x="${rightBarX + barWidth / 2}" y="${chartBottom - rightHeight - 8}" text-anchor="middle" fill="#f8fafc" font-size="13" font-weight="700">${failLabel}</text>

            <text x="${leftBarX + barWidth / 2}" y="205" text-anchor="middle" fill="#f8fafc" font-size="14" font-weight="600">Pass</text>
            <text x="${rightBarX + barWidth / 2}" y="205" text-anchor="middle" fill="#f8fafc" font-size="14" font-weight="600">Fail</text>
        </svg>
    `;
}

export function renderXpPerProjectChart(projects, totalXP) {
    const container = document.getElementById("xpPerProjectGraph");

    if (!container) {
        return;
    }

    const safeProjects = Array.isArray(projects) ? projects.filter((project) => project && Number.isFinite(project.amount) && project.amount > 0) : [];

    if (safeProjects.length === 0) {
        container.innerHTML = '<p class="loading">No XP project data.</p>';
        return;
    }

    const formatXP = (xp) => {
        if (xp >= 1000000) {
            return `${(xp / 1000000).toFixed(2)} MB`;
        }

        if (xp >= 1000) {
            return `${(xp / 1000).toFixed(2)} kB`;
        }

        return `${Math.round(xp)} XP`;
    };

    const total = safeProjects.reduce((sum, project) => sum + project.amount, 0) || 1;
    const totalDisplay = Number.isFinite(totalXP) ? totalXP : total;
    const colors = ["#4aa3ff", "#f4c95d", "#f57f6c", "#4ade80", "#f472b6", "#a78bfa", "#fb7185", "#38bdf8"];
    const centerX = 150;
    const centerY = 92;
    const radius = 62;
    const strokeWidth = 38;
    const circumference = 2 * Math.PI * radius;

    let offset = 0;
    const segments = safeProjects.map((project, index) => {
        const percent = project.amount / total;
        const dash = `${(percent * circumference).toFixed(2)} ${(circumference - percent * circumference).toFixed(2)}`;
        const segment = {
            ...project,
            percent,
            color: colors[index % colors.length],
            dash,
            dashOffset: (-(offset))
        };
        offset += percent * circumference;
        return segment;
    });

    const labelRadius = 100;
    const labelEntries = segments.map((segment, index) => {
        const angle = -Math.PI / 2 + (segments.slice(0, index + 1).reduce((sum, item) => sum + item.percent, 0) - segment.percent / 2) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * labelRadius;
        const y = centerY + Math.sin(angle) * labelRadius;
        const fullName = segment.name || "Project";

        return {
            ...segment,
            labelX: x,
            labelY: y,
            labelText: `${fullName}: ${formatXP(segment.amount)}`
        };
    });

    container.innerHTML = `
        <svg class="chart-svg" viewBox="0 0 300 220" role="img" aria-label="XP per project chart">
            <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="#1f2937" stroke-width="${strokeWidth}" opacity="0.35" />
            ${segments.map((segment) => `
                <circle
                    cx="${centerX}"
                    cy="${centerY}"
                    r="${radius}"
                    fill="none"
                    stroke="${segment.color}"
                    stroke-width="${strokeWidth}"
                    stroke-linecap="round"
                    stroke-dasharray="${segment.dash}"
                    stroke-dashoffset="${segment.dashOffset}"
                    transform="rotate(-90 ${centerX} ${centerY})"
                />
            `).join("")}

            ${labelEntries.map((label) => `
                <text x="${label.labelX}" y="${label.labelY}" text-anchor="middle" fill="#e2e8f0" font-size="11" font-weight="700">${label.labelText}</text>
            `).join("")}

            <circle cx="${centerX}" cy="${centerY}" r="42" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
            <text x="${centerX}" y="${centerY - 4}" text-anchor="middle" fill="#f8fafc" font-size="12" font-weight="700">Total XP</text>
            <text x="${centerX}" y="${centerY + 18}" text-anchor="middle" fill="#38bdf8" font-size="15" font-weight="800">${formatXP(totalDisplay)}</text>
        </svg>
    `;
}

