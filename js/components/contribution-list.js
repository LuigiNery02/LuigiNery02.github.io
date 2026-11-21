import { createAreaTag } from "./area-tag.js";
import { createContributionModal, getContributionTabs } from "./contribution-modal.js";
import { formatInline, isSafeUrl, isExternalUrl } from "../systems/rich-text.js";

function groupByPrimaryArea(contributions, areas) {
    const groups = new Map();

    contributions.forEach(contribution => {
        if (!groups.has(contribution.primaryArea)) {
            groups.set(contribution.primaryArea, []);
        }

        groups.get(contribution.primaryArea).push(contribution);
    });

    const orderOf = id => areas.find(area => area.id === id)?.order ?? Infinity;

    return [...groups.entries()].sort(([a], [b]) => orderOf(a) - orderOf(b));
}

function createSkillList(contribution, skillDefinitions) {
    const skills = (contribution.skills ?? [])
        .map(id => skillDefinitions.find(skill => skill.id === id))
        .filter(Boolean);

    if (skills.length === 0) {
        return null;
    }

    const list = document.createElement("ul");
    list.classList.add("contribution-skills");
    list.setAttribute("aria-label", "Skills used");

    skills.forEach(skill => {
        const item = document.createElement("li");
        item.classList.add("contribution-skill", "code-texts");
        item.textContent = skill.name;
        list.appendChild(item);
    });

    return list;
}

function createLinkList(contribution) {
    const links = (contribution.links ?? []).filter(link => link.label && isSafeUrl(link.href));

    if (links.length === 0) {
        return null;
    }

    const list = document.createElement("ul");
    list.classList.add("contribution-links");

    links.forEach(link => {
        const item = document.createElement("li");

        const anchor = document.createElement("a");
        anchor.classList.add("contribution-link", "code-texts");
        anchor.href = link.href;
        anchor.textContent = link.label;

        if (isExternalUrl(link.href)) {
            anchor.target = "_blank";
            anchor.rel = "noopener noreferrer";
        }

        const icon = document.createElement("i");
        icon.className = "fa-solid fa-arrow-up-right-from-square";
        icon.setAttribute("aria-hidden", "true");
        anchor.appendChild(icon);

        item.appendChild(anchor);
        list.appendChild(item);
    });

    return list;
}

function createContributionItem(contribution, areas, skillDefinitions, modal) {
    const item = document.createElement("li");
    item.classList.add("contribution-item");

    const title = document.createElement("h3");
    title.classList.add("contribution-title", "secondary-texts");
    title.textContent = contribution.title;
    item.appendChild(title);

    const relatedAreas = (contribution.relatedAreas ?? [])
        .map(id => areas.find(area => area.id === id))
        .filter(Boolean);

    if (relatedAreas.length > 0) {
        const tags = document.createElement("div");
        tags.classList.add("contribution-related");
        relatedAreas.forEach(area => tags.appendChild(createAreaTag(area, "related")));
        item.appendChild(tags);
    }

    if (contribution.summary) {
        const summary = document.createElement("p");
        summary.classList.add("contribution-summary", "secondary-texts");
        summary.innerHTML = formatInline(contribution.summary);
        item.appendChild(summary);
    }

    const linkList = createLinkList(contribution);

    if (linkList) {
        item.appendChild(linkList);
    }

    const skillList = createSkillList(contribution, skillDefinitions);

    if (skillList) {
        item.appendChild(skillList);
    }

    if (getContributionTabs(contribution).length > 0) {
        item.classList.add("contribution-item-expandable");

        const trigger = document.createElement("button");
        trigger.type = "button";
        trigger.classList.add("contribution-trigger", "code-texts");
        trigger.setAttribute("aria-label", `View details: ${contribution.title}`);
        trigger.addEventListener("click", () => modal.open(contribution));

        const hint = document.createElement("span");
        hint.classList.add("contribution-hint");
        hint.textContent = "// View details";

        const icon = document.createElement("i");
        icon.className = "fa-solid fa-up-right-and-down-left-from-center";
        icon.setAttribute("aria-hidden", "true");

        hint.appendChild(icon);
        trigger.appendChild(hint);
        item.appendChild(trigger);
    }

    return item;
}

export function createContributionList(contributions, areas, skillDefinitions = []) {
    const container = document.createElement("div");
    container.classList.add("contributions");

    const modal = createContributionModal(areas);

    groupByPrimaryArea(contributions, areas).forEach(([areaId, entries]) => {
        const group = document.createElement("div");
        group.classList.add("contribution-group");

        const area = areas.find(item => item.id === areaId);

        if (area) {
            group.appendChild(createAreaTag(area, "primary"));
        }

        const list = document.createElement("ul");
        list.classList.add("contribution-items");
        entries.forEach(entry => list.appendChild(createContributionItem(entry, areas, skillDefinitions, modal)));

        group.appendChild(list);
        container.appendChild(group);
    });

    container.appendChild(modal.element);

    return container;
}
