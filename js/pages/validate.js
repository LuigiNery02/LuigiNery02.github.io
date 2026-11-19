import {
    loadAreas,
    loadTechnologies,
    loadPlatforms,
    loadGenres,
    loadProjectsIndex,
    loadSideProjectsIndex,
    loadSiteContent,
    loadExperience,
    loadAbout
} from "../systems/data-loader.js";

const problems = [];
const fileChecks = [];

const CONTRIBUTION_TABS = ["aboutTheWork", "myRole", "whatILearned"];
const MEDIA_TYPES = ["image", "video"];
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

function report(level, file, message) {
    problems.push({ level, file, message });
}

function error(file, message) {
    report("error", file, message);
}

function warning(file, message) {
    report("warning", file, message);
}

function isText(value) {
    return typeof value === "string" && value.trim().length > 0;
}

function checkFile(file, path, description) {
    if (!isText(path)) {
        error(file, `${description}: path is empty.`);
        return;
    }

    fileChecks.push(
        fetch(path, { method: "HEAD" })
            .then(response => response.ok)
            .catch(() => false)
            .then(exists => {
                if (!exists) {
                    error(file, `${description}: file not found "${path}".`);
                }
            })
    );
}

function checkReferences(file, ids, list, description) {
    if (!Array.isArray(ids)) {
        error(file, `${description} must be a list.`);
        return;
    }

    ids.forEach(id => {
        if (!list.some(item => item.id === id)) {
            error(file, `${description}: "${id}" does not exist.`);
        }
    });
}

function checkMedia(file, items, description) {
    if (!Array.isArray(items)) {
        error(file, `${description} must be a list.`);
        return;
    }

    items.forEach((item, index) => {
        const label = `${description} #${index + 1}`;

        if (!MEDIA_TYPES.includes(item.type)) {
            error(file, `${label}: "type" must be "image" or "video".`);
        }

        checkFile(file, item.src, label);

        if (item.poster) {
            checkFile(file, item.poster, `${label} poster`);
        }
    });
}

function checkContribution(file, contribution, index, areas) {
    const label = `Contribution #${index + 1}${contribution.title ? ` ("${contribution.title}")` : ""}`;

    if (!isText(contribution.title)) {
        error(file, `${label}: "title" is required.`);
    }

    if (!areas.some(area => area.id === contribution.primaryArea)) {
        error(file, `${label}: primaryArea "${contribution.primaryArea}" does not exist in areas.json.`);
    }

    if (contribution.relatedAreas) {
        checkReferences(file, contribution.relatedAreas, areas, `${label} relatedAreas`);
    }

    if (!isText(contribution.summary)) {
        warning(file, `${label}: "summary" is empty.`);
    }

    if (contribution.details) {
        Object.keys(contribution.details).forEach(key => {
            if (!CONTRIBUTION_TABS.includes(key)) {
                warning(file, `${label}: unknown details tab "${key}" (valid: ${CONTRIBUTION_TABS.join(", ")}).`);
            }
        });

        CONTRIBUTION_TABS.forEach(key => {
            const tab = contribution.details[key];

            if (tab?.media) {
                checkMedia(file, tab.media, `${label} ${key} media`);
            }
        });
    }
}

function checkProject(file, project, indexEntry, collection, data) {
    if (project.id !== indexEntry.id) {
        error(file, `"id" is "${project.id}" but the index lists "${indexEntry.id}".`);
    }

    if (!isText(project.title)) {
        error(file, `"title" is required.`);
    }

    checkFile(file, project.cover, "Cover");

    if (!isText(project.classification?.type)) {
        error(file, `"classification.type" is required.`);
    }

    const general = project.general ?? {};

    if (typeof general.year !== "number") {
        error(file, `"general.year" must be a number.`);
    }

    if (!isText(general.status)) {
        error(file, `"general.status" is required.`);
    }

    if (typeof general.teamSize !== "number") {
        error(file, `"general.teamSize" must be a number.`);
    }

    checkReferences(file, general.technologies, data.technologies, "Technology");
    checkReferences(file, general.platforms, data.platforms, "Platform");

    if (general.genres) {
        if (collection === "side-projects") {
            warning(file, `Side projects do not use "general.genres".`);
        } else {
            checkReferences(file, general.genres, data.genres, "Genre");
        }
    }

    if (typeof project.order !== "number") {
        error(file, `"order" must be a number.`);
    } else if (project.order !== indexEntry.order) {
        warning(file, `"order" is ${project.order} but the index has ${indexEntry.order}.`);
    }

    const details = project.details ?? {};

    ["about", "contributions", "learnings"].forEach(key => {
        if (!Array.isArray(details[key])) {
            error(file, `"details.${key}" must be a list (use [] when empty).`);
        }
    });

    (details.contributions ?? []).forEach((contribution, index) => {
        checkContribution(file, contribution, index, data.areas);
    });

    if (!Array.isArray(project.gallery)) {
        error(file, `"gallery" must be a list (use [] when empty).`);
    } else {
        checkMedia(file, project.gallery, "Gallery item");
    }
}

async function checkCollection(collection, index, data) {
    const indexFile = `js/data/${collection}/index.json`;
    const ids = new Set();
    const loaded = [];

    for (const entry of index) {
        if (ids.has(entry.id)) {
            error(indexFile, `Duplicated id "${entry.id}".`);
        }

        ids.add(entry.id);

        const file = `js/data/${collection}/${entry.id}.json`;

        try {
            const response = await fetch(file);

            if (!response.ok) {
                error(indexFile, `"${entry.id}" is listed but ${file} was not found.`);
                continue;
            }

            const project = await response.json();
            checkProject(file, project, entry, collection, data);
            loaded.push(project);
        } catch {
            error(file, "Invalid JSON (check commas, quotes and brackets).");
        }
    }

    return loaded;
}

function checkTechnologies(technologies, areas) {
    const file = "js/data/technologies.json";
    const ids = new Set();

    technologies.forEach(technology => {
        const label = `Technology "${technology.id}"`;

        if (ids.has(technology.id)) {
            error(file, `Duplicated id "${technology.id}".`);
        }

        ids.add(technology.id);

        if (!isText(technology.name)) {
            error(file, `${label}: "name" is required.`);
        }

        if (!areas.some(area => area.id === technology.area)) {
            error(file, `${label}: area "${technology.area}" does not exist in areas.json.`);
        }

        if (technology.icon) {
            checkFile(file, technology.icon, `${label} icon`);
        }

        const skill = technology.skill;

        if (!skill || typeof skill.enabled !== "boolean") {
            error(file, `${label}: "skill.enabled" must be true or false.`);
        } else if (skill.enabled) {
            ["initialProjects", "baseProjectsPerLevel", "increasePerLevel"].forEach(key => {
                if (typeof skill[key] !== "number") {
                    error(file, `${label}: "skill.${key}" must be a number when XP is enabled.`);
                }
            });
        }
    });
}

function checkAreas(areas) {
    const file = "js/data/areas.json";

    areas.forEach(area => {
        if (!COLOR_PATTERN.test(area.color ?? "")) {
            error(file, `Area "${area.id}": "color" must look like #4A90E2.`);
        }

        if (typeof area.order !== "number") {
            error(file, `Area "${area.id}": "order" must be a number.`);
        }
    });
}

function checkSiteContent(siteContent, projectsIndex, sideProjectsIndex, data) {
    const file = "js/data/site-content.json";
    const featured = siteContent.featuredProjects ?? {};

    checkReferences(file, [featured.main], projectsIndex, "featuredProjects.main");
    checkReferences(file, featured.secondary ?? [], projectsIndex, "featuredProjects.secondary");

    if ((featured.secondary ?? []).length !== 3) {
        warning(file, `The Home layout is designed for 3 "featuredProjects.secondary" (currently ${(featured.secondary ?? []).length}).`);
    }

    checkReferences(file, siteContent.sideProjects ?? [], sideProjectsIndex, "sideProjects");

    if ((siteContent.sideProjects ?? []).length !== 2) {
        warning(file, `The Home layout is designed for 2 "sideProjects" (currently ${(siteContent.sideProjects ?? []).length}).`);
    }

    Object.entries(siteContent.skills ?? {}).forEach(([areaId, technologyIds]) => {
        if (!data.areas.some(area => area.id === areaId)) {
            error(file, `skills: area "${areaId}" does not exist in areas.json.`);
        }

        checkReferences(file, technologyIds, data.technologies, `skills.${areaId}`);
    });
}

function checkExperience(experience, projectsIndex, sideProjectsIndex, areas) {
    const file = "js/data/experience.json";
    const allProjects = [...projectsIndex, ...sideProjectsIndex];

    experience.forEach((item, index) => {
        const label = `Experience #${index + 1}${item.project ? ` ("${item.project}")` : ""}`;

        ["project", "organization", "role", "type"].forEach(key => {
            if (!isText(item[key])) {
                error(file, `${label}: "${key}" is required.`);
            }
        });

        if (!MONTH_PATTERN.test(item.start ?? "")) {
            error(file, `${label}: "start" must be "YYYY-MM".`);
        }

        if (item.end !== null && item.end !== undefined) {
            if (!MONTH_PATTERN.test(item.end)) {
                error(file, `${label}: "end" must be "YYYY-MM" or null.`);
            } else if (item.end < item.start) {
                error(file, `${label}: "end" is before "start".`);
            }
        }

        if (item.area && !areas.some(area => area.id === item.area)) {
            error(file, `${label}: area "${item.area}" does not exist in areas.json.`);
        }

        checkFile(file, item.image, `${label} image`);

        if (item.projectId && !allProjects.some(project => project.id === item.projectId)) {
            error(file, `${label}: projectId "${item.projectId}" does not exist.`);
        }
    });
}

function checkAbout(about) {
    const file = "js/data/about.json";

    (about.slides ?? []).forEach((slide, index) => {
        checkFile(file, slide.photo, `Slide #${index + 1} photo`);

        if (!Array.isArray(slide.content)) {
            error(file, `Slide #${index + 1}: "content" must be a list.`);
        }
    });

    (about.contacts ?? []).forEach((contact, index) => {
        ["label", "value", "href"].forEach(key => {
            if (!isText(contact[key])) {
                error(file, `Contact #${index + 1}: "${key}" is required.`);
            }
        });
    });

    if (about.resume?.href) {
        checkFile(file, about.resume.href, "Resume");
    }
}

function findPlaceholders(file, value, path = "") {
    if (typeof value === "string") {
        if (/\[(Placeholder|Example)\]/.test(value)) {
            report("info", file, `Placeholder text at "${path}".`);
        }
    } else if (Array.isArray(value)) {
        value.forEach((item, index) => findPlaceholders(file, item, `${path}[${index}]`));
    } else if (value && typeof value === "object") {
        Object.entries(value).forEach(([key, item]) => {
            findPlaceholders(file, item, path ? `${path}.${key}` : key);
        });
    }
}

async function loadSafely(loader, file) {
    try {
        return await loader();
    } catch (cause) {
        error(file, `Could not load or parse the file (${cause.message}). Check commas, quotes and brackets.`);
        return null;
    }
}

function render() {
    const summary = document.querySelector(".validate-summary");
    const list = document.querySelector(".validate-results");

    const order = { error: 0, warning: 1, info: 2 };
    const counts = { error: 0, warning: 0, info: 0 };
    problems.forEach(problem => counts[problem.level]++);

    summary.className = `validate-summary validate-summary-${counts.error > 0 ? "error" : counts.warning > 0 ? "warning" : "ok"}`;
    summary.textContent = counts.error + counts.warning === 0
        ? `Everything looks good.${counts.info > 0 ? ` (${counts.info} placeholder texts left)` : ""}`
        : `${counts.error} errors · ${counts.warning} warnings · ${counts.info} placeholders`;

    const byFile = new Map();

    [...problems]
        .sort((a, b) => order[a.level] - order[b.level])
        .forEach(problem => {
            if (!byFile.has(problem.file)) {
                byFile.set(problem.file, []);
            }

            byFile.get(problem.file).push(problem);
        });

    byFile.forEach((items, file) => {
        const group = document.createElement("section");
        group.className = "validate-group";

        const title = document.createElement("h2");
        title.className = "validate-file code-texts";
        title.textContent = file;
        group.appendChild(title);

        const entries = document.createElement("ul");

        items.forEach(problem => {
            const item = document.createElement("li");
            item.className = `validate-item validate-item-${problem.level}`;

            const badge = document.createElement("span");
            badge.className = "validate-badge code-texts";
            badge.textContent = problem.level;

            const message = document.createElement("span");
            message.textContent = problem.message;

            item.append(badge, message);
            entries.appendChild(item);
        });

        group.appendChild(entries);
        list.appendChild(group);
    });
}

async function validate() {
    const [areas, technologies, platforms, genres, projectsIndex, sideProjectsIndex, siteContent, experience, about] =
        await Promise.all([
            loadSafely(loadAreas, "js/data/areas.json"),
            loadSafely(loadTechnologies, "js/data/technologies.json"),
            loadSafely(loadPlatforms, "js/data/platforms.json"),
            loadSafely(loadGenres, "js/data/genres.json"),
            loadSafely(loadProjectsIndex, "js/data/projects/index.json"),
            loadSafely(loadSideProjectsIndex, "js/data/side-projects/index.json"),
            loadSafely(loadSiteContent, "js/data/site-content.json"),
            loadSafely(loadExperience, "js/data/experience.json"),
            loadSafely(loadAbout, "js/data/about.json")
        ]);

    const data = {
        areas: areas ?? [],
        technologies: technologies ?? [],
        platforms: platforms ?? [],
        genres: genres ?? []
    };

    if (areas) {
        checkAreas(areas);
    }

    if (technologies) {
        checkTechnologies(technologies, data.areas);
    }

    const projects = projectsIndex ? await checkCollection("projects", projectsIndex, data) : [];
    const sideProjects = sideProjectsIndex ? await checkCollection("side-projects", sideProjectsIndex, data) : [];

    (projectsIndex ?? []).forEach(project => {
        if ((sideProjectsIndex ?? []).some(side => side.id === project.id)) {
            error("js/data/side-projects/index.json", `"${project.id}" also exists in projects. Ids must be unique.`);
        }
    });

    if (siteContent) {
        checkSiteContent(siteContent, projectsIndex ?? [], sideProjectsIndex ?? [], data);
    }

    if (experience) {
        checkExperience(experience, projectsIndex ?? [], sideProjectsIndex ?? [], data.areas);
        findPlaceholders("js/data/experience.json", experience);
    }

    if (about) {
        checkAbout(about);
        findPlaceholders("js/data/about.json", about);
    }

    projects.forEach(project => findPlaceholders(`js/data/projects/${project.id}.json`, project));
    sideProjects.forEach(project => findPlaceholders(`js/data/side-projects/${project.id}.json`, project));

    await Promise.all(fileChecks);
    render();
}

validate();
