import {
    loadProjects,
    loadTechnologies,
    loadAreas,
    loadPlatforms
} from "../systems/data-loader.js";
import { getProjectAreas } from "../systems/project-data.js";
import { createProjectCard } from "../components/project-card.js";
import { createProjectFilter } from "../components/project-filter.js";
import "../components/navigation.js";

function buildOptions(projects, getValues, source) {
    const counts = new Map();

    projects.forEach(project => {
        new Set(getValues(project)).forEach(value => {
            counts.set(value, (counts.get(value) ?? 0) + 1);
        });
    });

    if (!source) {
        return [...counts.keys()].sort().map(id => ({
            id,
            name: id.charAt(0).toUpperCase() + id.slice(1),
            count: counts.get(id)
        }));
    }

    return source
        .filter(item => counts.has(item.id))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map(item => ({
            id: item.id,
            name: item.name,
            count: counts.get(item.id)
        }));
}

function matchesSelection(project, criteria, selection) {
    return criteria.every(criterion => {
        const selected = selection.get(criterion.key);

        if (!selected || selected.size === 0) {
            return true;
        }

        return criterion.getValues(project).some(value => selected.has(value));
    });
}

async function initializeProjectsPage() {
    const grid = document.querySelector(".projects-grid");
    const emptyMessage = document.querySelector(".projects-empty");
    const collection = grid.dataset.collection;

    const [projects, technologies, areas, platforms] = await Promise.all([
        loadProjects(collection),
        loadTechnologies(),
        loadAreas(),
        loadPlatforms()
    ]);

    projects.sort((a, b) => a.order - b.order);

    const criteria = [
        {
            key: "area",
            label: "Area",
            source: areas,
            getValues: project => getProjectAreas(project)
        },
        {
            key: "technology",
            label: "Technology",
            source: technologies,
            getValues: project => project.general.technologies
        },
        {
            key: "type",
            label: "Type",
            source: null,
            getValues: project => [project.classification.type]
        },
        {
            key: "platform",
            label: "Platform",
            source: platforms,
            getValues: project => project.general.platforms
        }
    ];

    const groups = criteria
        .map(criterion => ({
            key: criterion.key,
            label: criterion.label,
            options: buildOptions(projects, criterion.getValues, criterion.source)
        }))
        .filter(group => group.options.length > 0);

    const entries = projects.map(project => {
        const card = createProjectCard(project, technologies, areas);
        grid.appendChild(card);
        return { project, card };
    });

    const filter = createProjectFilter(groups, selection => {
        let visibleCount = 0;

        entries.forEach(({ project, card }) => {
            const visible = matchesSelection(project, criteria, selection);
            card.hidden = !visible;

            if (visible) {
                visibleCount++;
            }
        });

        emptyMessage.hidden = visibleCount > 0;
    });

    document.querySelector(".projects-sidebar").appendChild(filter);
}

initializeProjectsPage();
