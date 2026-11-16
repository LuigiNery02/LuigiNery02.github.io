import {
    loadProject,
    loadSiteContent,
    loadTechnologies,
    loadAreas
} from "../systems/data-loader.js";
import { createProjectCard } from "../components/project-card.js";
import "../components/navigation.js";

async function initializeHome() {
    const siteContent = await loadSiteContent();

    const featuredProjectIds = [
        siteContent.featuredProjects.main,
        ...siteContent.featuredProjects.secondary
    ];

    const featuredProjects = await Promise.all(
        featuredProjectIds.map(id => loadProject(id))
    );

    const projectsContainer = document.querySelector(".projects-container");

    const technologies = await loadTechnologies();

    const areas = await loadAreas();

    featuredProjects.forEach(project => {
        const card = createProjectCard(project, technologies, areas);

        if (project.order === 1) {
            card.classList.add("project-card-featured");
        }

        projectsContainer.appendChild(card);
    });

    const moreCard = document.createElement("article");
    moreCard.classList.add("project-card", "project-card-more");

    const moreLink = document.createElement("a");
    moreLink.href = "projects.html";
    moreLink.setAttribute("aria-label", "View all projects");

    const plusIcon = document.createElement("span");
    plusIcon.classList.add("project-card-more-icon");
    plusIcon.textContent = "+";

    moreLink.appendChild(plusIcon);
    moreCard.appendChild(moreLink);

    projectsContainer.appendChild(moreCard);
}

initializeHome();