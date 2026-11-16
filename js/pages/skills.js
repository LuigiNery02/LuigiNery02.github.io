import { loadAreas } from "../systems/data-loader.js";
import { loadSkills } from "../systems/skills.js";
import { createSkillGroup } from "../components/skill-card.js";
import "../components/navigation.js";

async function initializeSkillsPage() {
    const [areas, skills] = await Promise.all([loadAreas(), loadSkills()]);
    const container = document.querySelector(".skills-areas");

    [...areas]
        .sort((a, b) => a.order - b.order)
        .forEach(area => {
            const areaSkills = skills.filter(skill => skill.technology.area === area.id);

            if (areaSkills.length > 0) {
                container.appendChild(createSkillGroup(area, areaSkills));
            }
        });
}

initializeSkillsPage();
