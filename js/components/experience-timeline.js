const monthFormatter = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" });

function parseMonth(value) {
    const [year, month] = value.split("-").map(Number);
    return new Date(year, month - 1);
}

function formatPeriod(experience) {
    const start = parseMonth(experience.start);
    const end = experience.end ? parseMonth(experience.end) : new Date();

    const months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth()) + 1;

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    const parts = [];

    if (years > 0) {
        parts.push(`${years} ${years === 1 ? "yr" : "yrs"}`);
    }

    if (remainingMonths > 0) {
        parts.push(`${remainingMonths} ${remainingMonths === 1 ? "mo" : "mos"}`);
    }

    const endLabel = experience.end ? monthFormatter.format(end) : "Present";

    return `${monthFormatter.format(start)} – ${endLabel} · ${parts.join(" ")}`;
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

function createPreview() {
    const preview = createElement("div", "experience-preview");

    const imageContainer = createElement("div", "experience-preview-image");
    const image = createElement("img");
    imageContainer.appendChild(image);

    const title = createElement("h3", "experience-preview-title title-texts");
    const meta = createElement("p", "experience-preview-meta secondary-texts");
    const period = createElement("p", "experience-preview-period code-texts");
    const summary = createElement("p", "experience-preview-summary secondary-texts");

    const link = createElement("a", "experience-preview-link code-texts", "// View project");
    link.hidden = true;

    preview.append(imageContainer, title, meta, period, summary, link);

    function show(experience) {
        image.src = experience.image;
        image.alt = experience.project;
        title.textContent = experience.project;
        meta.textContent = `${experience.role} · ${experience.organization}`;
        period.textContent = formatPeriod(experience);
        summary.textContent = experience.summary ?? "";
        summary.hidden = !experience.summary;

        link.hidden = !experience.projectId;

        if (experience.projectId) {
            link.href = `project.html?id=${experience.projectId}`;
        }
    }

    return { element: preview, show };
}

export function createExperienceTimeline(experiences, areas) {
    const sorted = [...experiences].sort((a, b) => parseMonth(b.start) - parseMonth(a.start));

    const container = createElement("div", "experience");
    const preview = createPreview();

    const timeline = createElement("ol", "experience-timeline");
    const entries = [];
    let previousYear = null;

    sorted.forEach(experience => {
        const year = experience.start.split("-")[0];
        const area = areas.find(item => item.id === experience.area);

        const entry = createElement("li", "experience-entry");

        if (area) {
            entry.style.setProperty("--accent-color", area.color);
        }

        const yearLabel = createElement("span", "experience-year code-texts", year === previousYear ? "" : year);
        previousYear = year;

        const button = createElement("button", "experience-entry-button");
        button.type = "button";
        button.setAttribute("aria-pressed", "false");

        button.append(
            createElement("span", "experience-entry-type code-texts", `${experience.type} · ${experience.organization}`),
            createElement("span", "experience-entry-title secondary-texts", experience.project),
            createElement("span", "experience-entry-detail secondary-texts", experience.role)
        );

        button.addEventListener("click", () => select(entries.indexOf(entry)));

        entry.append(yearLabel, button);
        timeline.appendChild(entry);
        entries.push(entry);
    });

    function select(index) {
        entries.forEach((entry, entryIndex) => {
            const active = entryIndex === index;
            entry.classList.toggle("experience-entry-active", active);
            entry.querySelector("button").setAttribute("aria-pressed", String(active));
        });

        preview.show(sorted[index]);
    }

    timeline.addEventListener("keydown", event => {
        const currentIndex = entries.findIndex(entry => entry.contains(document.activeElement));

        if (currentIndex === -1) {
            return;
        }

        let nextIndex = null;

        if (event.key === "ArrowDown") {
            nextIndex = Math.min(currentIndex + 1, entries.length - 1);
        } else if (event.key === "ArrowUp") {
            nextIndex = Math.max(currentIndex - 1, 0);
        }

        if (nextIndex !== null) {
            event.preventDefault();
            entries[nextIndex].querySelector("button").focus();
            select(nextIndex);
        }
    });

    container.append(preview.element, timeline);

    if (sorted.length > 0) {
        select(0);
    }

    return container;
}
