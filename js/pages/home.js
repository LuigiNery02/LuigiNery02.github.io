import {
    loadProject,
    loadSiteContent,
    loadExperience,
    loadTechnologies,
    loadAreas
} from "../systems/data-loader.js";
import { loadSkills } from "../systems/skills.js";
import { createProjectCard } from "../components/project-card.js";
import { createSkillCard, getSkillLabel } from "../components/skill-card.js";
import { createExperienceTimeline } from "../components/experience-timeline.js";
import "../components/navigation.js";
import "../systems/particles.js";
import "../systems/image-fallback.js";

function createMoreCard(href, label) {
    const moreCard = document.createElement("article");
    moreCard.classList.add("project-card", "project-card-more");

    const moreLink = document.createElement("a");
    moreLink.href = href;
    moreLink.setAttribute("aria-label", label);

    const plusIcon = document.createElement("span");
    plusIcon.classList.add("project-card-more-icon");
    plusIcon.textContent = "+";

    moreLink.appendChild(plusIcon);
    moreCard.appendChild(moreLink);

    return moreCard;
}

function renderCards(container, projects, technologies, areas, featuredId) {
    projects.forEach(project => {
        const card = createProjectCard(project, technologies, areas);

        if (project.id === featuredId) {
            card.classList.add("project-card-featured");
        }

        container.appendChild(card);
    });
}

function renderSkillsOverview(container, selection, skills, areas) {
    [...areas]
        .sort((a, b) => a.order - b.order)
        .forEach(area => {
            (selection[area.id] ?? [])
                .map(id => skills.find(skill => skill.id === id))
                .filter(Boolean)
                .forEach(skill => {
                    const skillArea = areas.find(item => item.id === skill.area) ?? area;
                    container.appendChild(
                        createSkillCard(skill, { area: skillArea, label: getSkillLabel(skill, skillArea) })
                    );
                });
        });
}

async function initializeHome() {
    const siteContent = await loadSiteContent();

    const featuredProjectIds = [
        siteContent.featuredProjects.main,
        ...siteContent.featuredProjects.secondary
    ];

    const [featuredProjects, sideProjects, technologies, areas, skills, experience] = await Promise.all([
        Promise.all(featuredProjectIds.map(id => loadProject(id))),
        Promise.all(siteContent.sideProjects.map(id => loadProject(id))),
        loadTechnologies(),
        loadAreas(),
        loadSkills(),
        loadExperience()
    ]);

    const projectsContainer = document.querySelector(".projects-container");
    renderCards(projectsContainer, featuredProjects, technologies, areas, siteContent.featuredProjects.main);
    projectsContainer.appendChild(createMoreCard("projects.html", "View all projects"));

    const sideProjectsContainer = document.querySelector(".side-projects-container");
    renderCards(sideProjectsContainer, sideProjects, technologies, areas, siteContent.sideProjects[0]);
    sideProjectsContainer.appendChild(createMoreCard("side-projects.html", "View all side projects"));

    renderSkillsOverview(
        document.querySelector(".skills-overview"),
        siteContent.skills,
        skills,
        areas
    );

    document
        .querySelector(".experience-container")
        .appendChild(createExperienceTimeline(experience, areas));
}

initializeHome();
