import { createAreaTag } from "./area-tag.js";

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

export function createSkillCard(skill, area) {
    const { technology, enabled, progress } = skill;

    const card = createElement("article", "skill-card");

    if (area) {
        card.style.setProperty("--area-color", area.color);
    }

    const header = createElement("div", "skill-card-header");

    const icon = createElement("div", "skill-card-icon");

    if (technology.icon) {
        const image = createElement("img");
        image.src = technology.icon;
        image.alt = "";
        icon.appendChild(image);
    } else {
        icon.textContent = technology.name.charAt(0);
    }

    const names = createElement("div", "skill-card-names");
    names.appendChild(createElement("h3", "skill-card-name secondary-texts", technology.name));

    if (technology.category) {
        names.appendChild(createElement("span", "skill-card-category code-texts", technology.category));
    }

    header.append(icon, names);

    if (enabled) {
        header.appendChild(createElement("span", "skill-card-level title-texts", `LVL ${progress.level}`));
    }

    card.appendChild(header);

    if (!enabled) {
        card.appendChild(createElement("p", "skill-card-untracked code-texts", "// XP not tracked"));
        return card;
    }

    const bar = createElement("div", "skill-card-bar");
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-label", `${technology.name} progress to level ${progress.level + 1}`);
    bar.setAttribute("aria-valuemin", "0");
    bar.setAttribute("aria-valuemax", String(progress.required));
    bar.setAttribute("aria-valuenow", String(progress.current));

    const fill = createElement("span", "skill-card-bar-fill");
    fill.style.width = `${progress.ratio * 100}%`;
    bar.appendChild(fill);

    const xp = createElement("div", "skill-card-xp code-texts");
    const projectLabel = progress.projectCount === 1 ? "project" : "projects";
    xp.append(
        createElement("span", "", `${progress.projectCount} ${projectLabel}`),
        createElement("span", "", `${progress.current} / ${progress.required} to LVL ${progress.level + 1}`)
    );

    card.append(bar, xp);

    return card;
}

export function createSkillGroup(area, skills) {
    const group = createElement("section", "skill-group");
    group.style.setProperty("--area-color", area.color);

    const header = createElement("div", "skill-group-header");
    const title = createElement("h3", "skill-group-title");
    title.appendChild(createAreaTag(area, "primary"));
    header.appendChild(title);
    header.appendChild(createElement("span", "skill-group-count code-texts", `${skills.length} ${skills.length === 1 ? "skill" : "skills"}`));

    const cards = createElement("div", "skill-group-cards");
    skills.forEach(skill => cards.appendChild(createSkillCard(skill)));

    group.append(header, cards);

    return group;
}
