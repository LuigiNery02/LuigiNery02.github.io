import { loadAreas, loadAreaGroups } from "../systems/data-loader.js";
import { loadSkills } from "../systems/skills.js";
import { createSkillGroup } from "../components/skill-card.js";
import "../components/navigation.js";
import "../systems/particles.js";
import "../systems/image-fallback.js";

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);

function createAreaGroupSection(areaGroup, areaElements) {
    const section = document.createElement("section");
    section.classList.add("skills-area-group");

    const title = document.createElement("h2");
    title.classList.add("skills-area-group-title", "title-texts");
    title.textContent = areaGroup.name;

    const list = document.createElement("div");
    list.classList.add("skills-area-group-list");
    list.append(...areaElements);

    section.append(title, list);

    return section;
}

async function initializeSkillsPage() {
    const [areas, areaGroups, skills] = await Promise.all([
        loadAreas(),
        loadAreaGroups(),
        loadSkills()
    ]);

    const container = document.querySelector(".skills-areas");
    const fallbackGroup = [...areaGroups].sort(byOrder)[0]?.id;

    [...areaGroups].sort(byOrder).forEach(areaGroup => {
        const areaElements = [...areas]
            .filter(area => (area.group ?? fallbackGroup) === areaGroup.id)
            .sort(byOrder)
            .map(area => ({ area, items: skills.filter(skill => skill.area === area.id) }))
            .filter(({ items }) => items.length > 0)
            .map(({ area, items }) => createSkillGroup(area, items));

        if (areaElements.length > 0) {
            container.appendChild(createAreaGroupSection(areaGroup, areaElements));
        }
    });
}

initializeSkillsPage();
