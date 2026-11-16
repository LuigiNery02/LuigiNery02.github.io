import {
    loadProject,
    loadTechnologies,
    loadAreas,
    loadPlatforms,
    loadGenres
} from "../systems/data-loader.js";
import { getProjectAreas } from "../systems/project-data.js";
import "../components/navigation.js";

function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
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

function createAreaTag(area) {
    const tag = createElement("span", "area-tag", area.name);
    tag.style.backgroundColor = area.color;
    return tag;
}

function findById(list, id) {
    return list.find(item => item.id === id);
}

function showSection(name) {
    document.querySelector(`[data-section="${name}"]`).hidden = false;
}

function renderHeading(project) {
    const cover = document.querySelector(".project-cover img");
    cover.src = project.cover;
    cover.alt = project.title;

    document.querySelector(".project-title").textContent = project.title;

    const meta = document.querySelector(".project-meta");
    meta.appendChild(
        createElement("span", "project-type", project.classification.type)
    );

    if (project.organization?.name) {
        meta.appendChild(
            createElement("span", "project-organization", project.organization.name)
        );
    }
}

function renderAbout(project) {
    const paragraphs = project.details.about;

    if (paragraphs.length === 0) {
        return;
    }

    const container = document.querySelector(".project-about");
    paragraphs.forEach(text => container.appendChild(createElement("p", "", text)));
    showSection("about");
}

function renderContributions(project, areas) {
    const contributions = project.details.contributions;

    if (contributions.length === 0) {
        return;
    }

    const container = document.querySelector(".project-contributions");

    contributions.forEach(contribution => {
        const group = createElement("li", "project-contribution");
        const area = findById(areas, contribution.primaryArea);

        if (area) {
            group.appendChild(createAreaTag(area));
        }

        const items = createElement("ul", "project-contribution-items");

        contribution.items.forEach(entry => {
            const item = createElement("li", "project-contribution-item");

            item.appendChild(
                createElement("h3", "project-contribution-title secondary-texts", entry.title)
            );

            if (entry.description) {
                item.appendChild(
                    createElement("p", "project-contribution-description secondary-texts", entry.description)
                );
            }

            items.appendChild(item);
        });

        group.appendChild(items);
        container.appendChild(group);
    });

    showSection("contributions");
}

function renderLearnings(project) {
    const learnings = project.details.learnings;

    if (learnings.length === 0) {
        return;
    }

    const list = document.querySelector(".project-learnings");
    learnings.forEach(text => list.appendChild(createElement("li", "", text)));
    showSection("learnings");
}

function renderGallery(project) {
    if (project.gallery.length === 0) {
        return;
    }

    showSection("gallery");
}

function addInfoRow(list, label, content) {
    const row = createElement("div", "project-info-row");
    row.appendChild(createElement("dt", "code-texts", label));

    const value = createElement("dd");

    if (typeof content === "string" || typeof content === "number") {
        value.textContent = content;
    } else {
        value.appendChild(content);
    }

    row.appendChild(value);
    list.appendChild(row);
}

function renderInfo(project, data) {
    const list = document.querySelector(".project-info");
    const general = project.general;

    addInfoRow(list, "Year", general.year);
    addInfoRow(list, "Status", capitalize(general.status));
    addInfoRow(list, "Team", general.teamSize === 1 ? "Solo" : `${general.teamSize} people`);

    const platforms = general.platforms
        .map(id => findById(data.platforms, id)?.name)
        .filter(Boolean);

    if (platforms.length > 0) {
        addInfoRow(list, "Platforms", platforms.join(", "));
    }

    const genres = (general.genres ?? [])
        .map(id => findById(data.genres, id)?.name)
        .filter(Boolean);

    if (genres.length > 0) {
        addInfoRow(list, "Genres", genres.join(", "));
    }

    const technologies = general.technologies
        .map(id => findById(data.technologies, id))
        .filter(Boolean);

    if (technologies.length > 0) {
        const container = createElement("div", "project-technologies");

        technologies.forEach(technology => {
            const item = createElement("span", "project-technology");

            if (technology.icon) {
                const icon = createElement("img");
                icon.src = technology.icon;
                icon.alt = "";
                item.appendChild(icon);
            }

            item.appendChild(document.createTextNode(technology.name));
            container.appendChild(item);
        });

        addInfoRow(list, "Technologies", container);
    }

    const areas = getProjectAreas(project)
        .map(id => findById(data.areas, id))
        .filter(Boolean);

    if (areas.length > 0) {
        const container = createElement("div", "project-areas");
        areas.forEach(area => container.appendChild(createAreaTag(area)));
        addInfoRow(list, "Areas", container);
    }
}

function showNotFound() {
    document.querySelector(".project-not-found").hidden = false;
}

async function initializeProjectPage() {
    const id = new URLSearchParams(window.location.search).get("id");

    if (!id) {
        showNotFound();
        return;
    }

    let project;

    try {
        project = await loadProject(id);
    } catch (error) {
        console.error(error);
        showNotFound();
        return;
    }

    const [technologies, areas, platforms, genres] = await Promise.all([
        loadTechnologies(),
        loadAreas(),
        loadPlatforms(),
        loadGenres()
    ]);

    document.title = `${project.title} | Luigi Nery Portfolio`;

    renderHeading(project);
    renderAbout(project);
    renderContributions(project, areas);
    renderLearnings(project);
    renderGallery(project);
    renderInfo(project, { technologies, areas, platforms, genres });

    document.querySelector(".project-body").hidden = false;
}

initializeProjectPage();
