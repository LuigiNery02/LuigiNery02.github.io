import { fitTextToWidth } from "../systems/fit-text.js";
import { getProjectAreas } from "../systems/project-data.js";

export function createProjectCard(project, technologies, areas) {
    const card = document.createElement("article");
    const projectLink = document.createElement("a");
    projectLink.href = `project.html?id=${project.id}`;
    projectLink.setAttribute(
        "aria-label",
        `View details of ${project.title}`
    );

    card.classList.add("project-card");

    const imageContainer = document.createElement("div");
    imageContainer.classList.add("project-card-image");

    const technologyContainer = document.createElement("div");
    technologyContainer.classList.add("project-card-technologies");

    const mainTechnology = project.general.technologies
        .map(technologyId => technologies.find(item => item.id === technologyId))
        .find(technology => technology?.icon);

    if (mainTechnology) {
        const icon = document.createElement("img");
        icon.src = mainTechnology.icon;
        icon.alt = mainTechnology.name;
        icon.title = mainTechnology.name;

        technologyContainer.appendChild(icon);
    }

    const infoContainer = document.createElement("div");
    infoContainer.classList.add("project-card-info");

    const areaContainer = document.createElement("div");
    areaContainer.classList.add("project-card-areas");

    getProjectAreas(project).forEach(areaId => {
        const area = areas.find(item => item.id === areaId);

        if (area) {
            const tag = document.createElement("span");
            tag.classList.add("project-card-area");
            tag.textContent = area.name;
            tag.style.backgroundColor = area.color;

            areaContainer.appendChild(tag);
        }
    });

    const metaContainer = document.createElement("div");
    metaContainer.classList.add("project-card-meta");

    const projectType = document.createElement("span");
    projectType.classList.add("project-card-type");
    projectType.textContent = project.classification.type;

    metaContainer.appendChild(projectType);

    if (project.organization?.name) {
        const organization = document.createElement("span");
        organization.classList.add("project-card-organization");
        organization.textContent = project.organization.name;

        metaContainer.appendChild(organization);
    }

    const image = document.createElement("img");
    image.src = project.cover;
    image.alt = project.title;

    const title = document.createElement("h3");
    title.classList.add("project-card-title");
    title.textContent = project.title;

    const overlayTitle = document.createElement("h3");
    overlayTitle.classList.add("project-card-overlay-title");
    overlayTitle.textContent = project.title;
    overlayTitle.setAttribute("aria-hidden", "true");

    imageContainer.append(image, technologyContainer, overlayTitle);

    infoContainer.append(title, metaContainer, areaContainer);

    fitTextToWidth(title, metaContainer, areaContainer);

    projectLink.append(imageContainer, infoContainer);
    card.appendChild(projectLink);

    return card;
}