import {
    loadAreas,
    loadAreaGroups,
    loadSkillDefinitions,
    loadTechnologies,
    loadPlatforms,
    loadGenres,
    loadStores,
    loadProjectsIndex,
    loadSideProjectsIndex,
    loadSiteContent,
    loadExperience,
    loadAbout
} from "../systems/data-loader.js";
import { getYouTubeId } from "../systems/youtube.js";
import { isSafeUrl } from "../systems/rich-text.js";

const problems = [];
const fileChecks = [];

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

        if (item.type === "youtube") {
            if (!getYouTubeId(item.src)) {
                error(file, `${label}: "${item.src}" is not a valid YouTube link.`);
            }

            if (item.autoplay || item.poster) {
                warning(file, `${label}: "autoplay" and "poster" do not work on YouTube videos.`);
            }

            return;
        }

        if (!MEDIA_TYPES.includes(item.type)) {
            error(file, `${label}: "type" must be "image", "video" or "youtube".`);
        } else if (isText(item.src)) {
            const isVideoFile = /\.(mp4|webm|mov|ogv)$/i.test(item.src);

            if (isVideoFile && item.type !== "video") {
                error(file, `${label}: "${item.src}" is a video file, so "type" must be "video".`);
            } else if (!isVideoFile && item.type === "video") {
                error(file, `${label}: "${item.src}" is not a video file, so "type" must be "image".`);
            }
        }

        if (item.autoplay && item.type !== "video") {
            warning(file, `${label}: "autoplay" only works on videos.`);
        }

        checkFile(file, item.src, label);

        if (item.poster) {
            checkFile(file, item.poster, `${label} poster`);
        }
    });
}

function checkContribution(file, contribution, index, areas, skillDefinitions) {
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

    if (contribution.skills) {
        checkReferences(file, contribution.skills, skillDefinitions, `${label} skills (skills.json)`);
    }

    if (contribution.links !== undefined) {
        if (!Array.isArray(contribution.links)) {
            error(file, `${label}: "links" must be a list.`);
        } else {
            contribution.links.forEach((link, linkIndex) => {
                const linkLabel = `${label} link #${linkIndex + 1}`;

                if (!isText(link.label)) {
                    error(file, `${linkLabel}: "label" is required.`);
                }

                if (!isSafeUrl(link.href)) {
                    error(file, `${linkLabel}: "href" must start with https://, mailto: or be a page of the site (e.g. project.html?id=...).`);
                } else if (/example\.com/i.test(link.href)) {
                    report("info", file, `${linkLabel}: placeholder URL "${link.href}".`);
                }
            });
        }
    }

    if (!isText(contribution.summary)) {
        warning(file, `${label}: "summary" is empty.`);
    }

    if (contribution.details) {
        error(file, `${label}: "details" is the old format. Use "tabs": [{ "title": "...", "content": [...], "media": [...] }].`);
    }

    if (contribution.tabs !== undefined) {
        if (!Array.isArray(contribution.tabs)) {
            error(file, `${label}: "tabs" must be a list.`);
        } else {
            contribution.tabs.forEach((tab, tabIndex) => {
                const tabLabel = `${label} tab #${tabIndex + 1}`;

                if (!isText(tab.title)) {
                    error(file, `${tabLabel}: "title" is required.`);
                }

                if (tab.content !== undefined && !Array.isArray(tab.content)) {
                    error(file, `${tabLabel}: "content" must be a list.`);
                }

                if (!(tab.content?.length > 0) && !(tab.media?.length > 0)) {
                    warning(file, `${tabLabel}: has no content or media and will be hidden.`);
                }

                if (tab.media) {
                    checkMedia(file, tab.media, `${tabLabel} media`);
                }
            });
        }
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

    if (project.playLinks !== undefined) {
        if (!Array.isArray(project.playLinks)) {
            error(file, `"playLinks" must be a list.`);
        } else {
            project.playLinks.forEach((link, index) => {
                const label = `Play link #${index + 1}`;

                if (!data.stores.some(store => store.id === link.store)) {
                    warning(file, `${label}: store "${link.store}" does not exist in stores.json (a generic icon will be used).`);
                }

                if (!isSafeUrl(link.href)) {
                    error(file, `${label}: "href" must start with https:// or be a file of the site.`);
                } else if (/example\.com/i.test(link.href)) {
                    report("info", file, `${label}: placeholder URL "${link.href}".`);
                }
            });
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
        checkContribution(file, contribution, index, data.areas, data.skillDefinitions);
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

        checkXp(file, label, technology.xp);
    });
}

function checkXp(file, label, xp) {
    if (!xp || typeof xp.enabled !== "boolean") {
        error(file, `${label}: "xp.enabled" must be true or false.`);
    } else if (xp.enabled) {
        ["initialProjects", "baseProjectsPerLevel", "increasePerLevel"].forEach(key => {
            if (typeof xp[key] !== "number") {
                error(file, `${label}: "xp.${key}" must be a number when XP is enabled.`);
            }
        });
    }
}

function checkSkillDefinitions(skillDefinitions, areas, technologies) {
    const file = "js/data/skills.json";
    const ids = new Set();

    skillDefinitions.forEach(skill => {
        const label = `Skill "${skill.id}"`;

        if (ids.has(skill.id)) {
            error(file, `Duplicated id "${skill.id}".`);
        }

        ids.add(skill.id);

        if (technologies.some(technology => technology.id === skill.id)) {
            error(file, `${label}: the same id exists in technologies.json. Ids must be unique.`);
        }

        if (!isText(skill.name)) {
            error(file, `${label}: "name" is required.`);
        }

        const area = areas.find(item => item.id === skill.area);

        if (!area) {
            error(file, `${label}: area "${skill.area}" does not exist in areas.json.`);
        } else if (skill.subarea && !(area.subareas ?? []).some(subarea => subarea.id === skill.subarea)) {
            error(file, `${label}: subarea "${skill.subarea}" does not exist in the "${area.id}" area.`);
        }

        if (skill.icon) {
            checkFile(file, skill.icon, `${label} icon`);
        }

        checkXp(file, label, skill.xp);
    });
}

function checkAreas(areas, areaGroups) {
    const file = "js/data/areas.json";

    areas.forEach(area => {
        if (!COLOR_PATTERN.test(area.color ?? "")) {
            error(file, `Area "${area.id}": "color" must look like #4A90E2.`);
        }

        if (typeof area.order !== "number") {
            error(file, `Area "${area.id}": "order" must be a number.`);
        }

        if (area.group && !areaGroups.some(group => group.id === area.group)) {
            error(file, `Area "${area.id}": group "${area.group}" does not exist in area-groups.json.`);
        }

        const subareaIds = new Set();

        (area.subareas ?? []).forEach(subarea => {
            if (subareaIds.has(subarea.id)) {
                error(file, `Area "${area.id}": duplicated subarea "${subarea.id}".`);
            }

            subareaIds.add(subarea.id);

            if (!isText(subarea.name)) {
                error(file, `Area "${area.id}": subarea "${subarea.id}" needs a "name".`);
            }
        });
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

    Object.entries(siteContent.skills ?? {}).forEach(([areaId, ids]) => {
        if (!data.areas.some(area => area.id === areaId)) {
            error(file, `skills: area "${areaId}" does not exist in areas.json.`);
        }

        checkReferences(
            file,
            ids,
            [...data.technologies, ...data.skillDefinitions],
            `skills.${areaId} (technologies.json or skills.json)`
        );
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
    const [stores, areas, areaGroups, skillDefinitions, technologies, platforms, genres, projectsIndex, sideProjectsIndex, siteContent, experience, about] =
        await Promise.all([
            loadSafely(loadStores, "js/data/stores.json"),
            loadSafely(loadAreas, "js/data/areas.json"),
            loadSafely(loadAreaGroups, "js/data/area-groups.json"),
            loadSafely(loadSkillDefinitions, "js/data/skills.json"),
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
        stores: stores ?? [],
        skillDefinitions: skillDefinitions ?? [],
        technologies: technologies ?? [],
        platforms: platforms ?? [],
        genres: genres ?? []
    };

    if (areas) {
        checkAreas(areas, areaGroups ?? []);
    }

    if (technologies) {
        checkTechnologies(technologies, data.areas);
    }

    if (skillDefinitions) {
        checkSkillDefinitions(skillDefinitions, data.areas, data.technologies);
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
