import { loadProjects, loadTechnologies, loadSkillDefinitions } from "./data-loader.js";
import { getProjectSkills } from "./project-data.js";

export function calculateProgress(projectCount, config) {
    const increase = Math.max(0, config.increasePerLevel ?? 0);
    let step = Math.max(1, config.initialProjects ?? 1);
    let nextStep = Math.max(1, config.baseProjectsPerLevel ?? 1);
    let level = 1;
    let levelStart = 0;

    while (projectCount >= levelStart + step) {
        levelStart += step;
        level++;
        step = nextStep;
        nextStep += increase;
    }

    return {
        level,
        projectCount,
        levelStart,
        nextLevelAt: levelStart + step,
        current: projectCount - levelStart,
        required: step,
        ratio: (projectCount - levelStart) / step
    };
}

function buildEntries(items, kind, getProjectIds, projects) {
    return [...items]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map(item => {
            const enabled = item.xp?.enabled === true;

            const entry = {
                id: item.id,
                kind,
                name: item.name,
                icon: item.icon ?? null,
                category: item.category ?? null,
                area: item.area,
                subarea: item.subarea ?? null,
                enabled,
                progress: null
            };

            if (enabled) {
                const projectCount = projects.filter(project =>
                    getProjectIds(project).includes(item.id)
                ).length;

                entry.progress = calculateProgress(projectCount, item.xp);
            }

            return entry;
        });
}

export function buildSkills(technologies, skillDefinitions, projects) {
    return [
        ...buildEntries(technologies, "technology", project => project.general.technologies, projects),
        ...buildEntries(skillDefinitions, "skill", getProjectSkills, projects)
    ];
}

export async function loadSkills() {
    const [technologies, skillDefinitions, projects, sideProjects] = await Promise.all([
        loadTechnologies(),
        loadSkillDefinitions(),
        loadProjects("projects"),
        loadProjects("side-projects")
    ]);

    return buildSkills(technologies, skillDefinitions, [...projects, ...sideProjects]);
}
