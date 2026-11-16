import {
    findProjectCollection,
    loadProject,
    loadTechnologies,
    loadAreas,
    loadPlatforms,
    loadGenres
} from "../systems/data-loader.js";
import { getProjectAreas } from "../systems/project-data.js";
import { createGallery } from "../components/gallery.js";
import { createAreaTag } from "../components/area-tag.js";
import { createContributionList } from "../components/contribution-list.js";
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

    document
        .querySelector(".project-contributions")
        .appendChild(createContributionList(contributions, areas));

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

    document.querySelector(".project-gallery").appendChild(createGallery(project.gallery));
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
        const collection = await findProjectCollection(id);
        project = await loadProject(id);

        if (collection === "side-projects") {
            const backLink = document.querySelector(".project-back");
            backLink.href = "side-projects.html";
            backLink.textContent = "// Back to Side Projects";
        }
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
