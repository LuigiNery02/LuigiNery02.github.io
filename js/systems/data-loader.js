const AREAS_URL = new URL("../data/areas.json", import.meta.url);
const TECHNOLOGIES_URL = new URL("../data/technologies.json", import.meta.url);
const PLATFORMS_URL = new URL("../data/platforms.json", import.meta.url);
const GENRES_URL = new URL("../data/genres.json", import.meta.url);
const PROJECTS_INDEX_URL = new URL("../data/projects/index.json", import.meta.url);
const SIDE_PROJECTS_INDEX_URL = new URL("../data/side-projects/index.json", import.meta.url);
const SITE_CONTENT_URL = new URL("../data/site-content.json", import.meta.url);
const EXPERIENCE_URL = new URL("../data/experience.json", import.meta.url);
const ABOUT_URL = new URL("../data/about.json", import.meta.url);

async function fetchJson(url, label) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to load ${label}: ${response.status}`);
    }

    return await response.json();
}

export function loadAreas() {
    return fetchJson(AREAS_URL, "areas");
}

export function loadTechnologies() {
    return fetchJson(TECHNOLOGIES_URL, "technologies");
}

export function loadPlatforms() {
    return fetchJson(PLATFORMS_URL, "platforms");
}

export function loadGenres() {
    return fetchJson(GENRES_URL, "genres");
}

export function loadProjectsIndex() {
    return fetchJson(PROJECTS_INDEX_URL, "projects index");
}

export function loadSideProjectsIndex() {
    return fetchJson(SIDE_PROJECTS_INDEX_URL, "side projects index");
}

function fetchProject(collection, id) {
    const projectURL = new URL(
        `../data/${collection}/${id}.json`,
        import.meta.url
    );

    return fetchJson(projectURL, `project "${id}"`);
}

export async function findProjectCollection(id) {
    const [projects, sideProjects] = await Promise.all([
        loadProjectsIndex(),
        loadSideProjectsIndex()
    ]);

    if (projects.some(project => project.id === id)) {
        return "projects";
    }

    if (sideProjects.some(project => project.id === id)) {
        return "side-projects";
    }

    throw new Error(`Project not found: ${id}`);
}

export async function loadProject(id) {
    const collection = await findProjectCollection(id);
    return await fetchProject(collection, id);
}

export async function loadProjects(collection) {
    let index;

    if (collection === "projects") {
        index = await loadProjectsIndex();
    } else if (collection === "side-projects") {
        index = await loadSideProjectsIndex();
    } else {
        throw new Error(`Invalid collection: ${collection}`);
    }

    const projects = await Promise.all(
        index.map(item => fetchProject(collection, item.id))
    );

    return projects;
}

export function loadSiteContent() {
    return fetchJson(SITE_CONTENT_URL, "site content");
}

export function loadExperience() {
    return fetchJson(EXPERIENCE_URL, "experience");
}

export function loadAbout() {
    return fetchJson(ABOUT_URL, "about");
}
