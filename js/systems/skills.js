import { loadProjects, loadTechnologies } from "./data-loader.js";

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

export function buildSkills(technologies, projects) {
    return [...technologies]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map(technology => {
            const enabled = technology.skill?.enabled === true;

            if (!enabled) {
                return { technology, enabled, progress: null };
            }

            const projectCount = projects.filter(project =>
                new Set(project.general.technologies).has(technology.id)
            ).length;

            return {
                technology,
                enabled,
                progress: calculateProgress(projectCount, technology.skill)
            };
        });
}

export async function loadSkills() {
    const [technologies, projects, sideProjects] = await Promise.all([
        loadTechnologies(),
        loadProjects("projects"),
        loadProjects("side-projects")
    ]);

    return buildSkills(technologies, [...projects, ...sideProjects]);
}
