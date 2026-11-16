import { createAreaTag } from "./area-tag.js";
import { createContributionModal, getContributionTabs } from "./contribution-modal.js";

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

function createContributionItem(contribution, areas, modal) {
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
        summary.textContent = contribution.summary;
        item.appendChild(summary);
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

export function createContributionList(contributions, areas) {
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
        entries.forEach(entry => list.appendChild(createContributionItem(entry, areas, modal)));

        group.appendChild(list);
        container.appendChild(group);
    });

    container.appendChild(modal.element);

    return container;
}
