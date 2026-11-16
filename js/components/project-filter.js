export function createProjectFilter(groups, onChange) {
    const selection = new Map(groups.map(group => [group.key, new Set()]));
    const checkboxes = [];

    const filter = document.createElement("div");
    filter.classList.add("project-filter", "side-panel");

    const header = document.createElement("div");
    header.classList.add("project-filter-header");

    const title = document.createElement("h2");
    title.classList.add("side-panel-title", "title-texts");
    title.textContent = "Filters";

    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.classList.add("project-filter-clear", "code-texts");
    clearButton.textContent = "// Clear";
    clearButton.hidden = true;

    header.append(title, clearButton);
    filter.appendChild(header);

    function notify() {
        const hasSelection = [...selection.values()].some(set => set.size > 0);
        clearButton.hidden = !hasSelection;
        onChange(selection);
    }

    groups.forEach(group => {
        const details = document.createElement("details");
        details.classList.add("project-filter-group");
        details.open = true;

        const summary = document.createElement("summary");
        summary.classList.add("project-filter-label", "secondary-texts");
        summary.textContent = group.label;

        const options = document.createElement("ul");
        options.classList.add("project-filter-options");

        group.options.forEach(option => {
            const item = document.createElement("li");

            const label = document.createElement("label");
            label.classList.add("project-filter-option", "secondary-texts");

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = option.id;

            checkbox.addEventListener("change", () => {
                const selected = selection.get(group.key);

                if (checkbox.checked) {
                    selected.add(option.id);
                } else {
                    selected.delete(option.id);
                }

                notify();
            });

            const name = document.createElement("span");
            name.classList.add("project-filter-option-name");
            name.textContent = option.name;

            const count = document.createElement("span");
            count.classList.add("project-filter-option-count", "code-texts");
            count.textContent = option.count;

            label.append(checkbox, name, count);
            item.appendChild(label);
            options.appendChild(item);
            checkboxes.push(checkbox);
        });

        details.append(summary, options);
        filter.appendChild(details);
    });

    clearButton.addEventListener("click", () => {
        selection.forEach(set => set.clear());
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        notify();
    });

    return filter;
}
