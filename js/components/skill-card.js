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

function pluralize(count, word) {
    return `${count} ${count === 1 ? word : `${word}s`}`;
}

export function getSkillLabel(skill, area) {
    if (skill.kind === "technology") {
        return skill.category;
    }

    return area?.subareas?.find(subarea => subarea.id === skill.subarea)?.name ?? "skill";
}

export function createSkillCard(skill, options = {}) {
    const { area, label } = options;
    const { name, icon, enabled, progress } = skill;

    const card = createElement("article", `skill-card skill-card-${skill.kind}`);

    if (area) {
        card.style.setProperty("--area-color", area.color);
    }

    const header = createElement("div", "skill-card-header");

    const iconContainer = createElement("div", "skill-card-icon");

    if (icon) {
        const image = createElement("img");
        image.src = icon;
        image.alt = "";
        iconContainer.appendChild(image);
    } else {
        iconContainer.textContent = name.charAt(0);
    }

    const names = createElement("div", "skill-card-names");
    names.appendChild(createElement("h3", "skill-card-name secondary-texts", name));

    if (label) {
        names.appendChild(createElement("span", "skill-card-category code-texts", label));
    }

    header.append(iconContainer, names);

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
    bar.setAttribute("aria-label", `${name} progress to level ${progress.level + 1}`);
    bar.setAttribute("aria-valuemin", "0");
    bar.setAttribute("aria-valuemax", String(progress.required));
    bar.setAttribute("aria-valuenow", String(progress.current));

    const fill = createElement("span", "skill-card-bar-fill");
    fill.style.width = `${progress.ratio * 100}%`;
    bar.appendChild(fill);

    const xp = createElement("div", "skill-card-xp code-texts");
    xp.append(
        createElement("span", "", pluralize(progress.projectCount, "project")),
        createElement("span", "", `${progress.current} / ${progress.required} to LVL ${progress.level + 1}`)
    );

    card.append(bar, xp);

    return card;
}

function createSkillSection(title, skills, getLabel) {
    const section = createElement("div", "skill-section");
    section.appendChild(createElement("h4", "skill-section-title code-texts", `// ${title}`));

    const cards = createElement("div", "skill-group-cards");
    skills.forEach(skill => cards.appendChild(createSkillCard(skill, { label: getLabel(skill) })));

    section.appendChild(cards);

    return section;
}

export function createSkillGroup(area, skills) {
    const group = createElement("section", "skill-group");
    group.style.setProperty("--area-color", area.color);

    const tools = skills.filter(skill => skill.kind === "technology");
    const abilities = skills.filter(skill => skill.kind === "skill");

    const header = createElement("div", "skill-group-header");
    const title = createElement("h3", "skill-group-title");
    title.appendChild(createAreaTag(area, "primary"));
    header.appendChild(title);

    const counts = [];

    if (tools.length > 0) {
        counts.push(pluralize(tools.length, "tool"));
    }

    if (abilities.length > 0) {
        counts.push(pluralize(abilities.length, "skill"));
    }

    header.appendChild(createElement("span", "skill-group-count code-texts", counts.join(" · ")));
    group.appendChild(header);

    const body = createElement("div", "skill-group-body");

    if (tools.length > 0) {
        body.appendChild(createSkillSection("Tools", tools, skill => skill.category));
    }

    const subareas = area.subareas ?? [];

    subareas.forEach(subarea => {
        const items = abilities.filter(skill => skill.subarea === subarea.id);

        if (items.length > 0) {
            body.appendChild(createSkillSection(subarea.name, items, () => null));
        }
    });

    const general = abilities.filter(
        skill => !subareas.some(subarea => subarea.id === skill.subarea)
    );

    if (general.length > 0) {
        body.appendChild(createSkillSection("Skills", general, () => null));
    }

    group.appendChild(body);

    return group;
}
