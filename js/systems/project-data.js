export function getProjectAreas(project) {
    return [
        ...new Set(
            project.details.contributions.map(
                contribution => contribution.primaryArea
            )
        )
    ];
}
