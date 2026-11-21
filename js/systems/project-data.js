export function getProjectAreas(project) {
    return [
        ...new Set(
            project.details.contributions.map(
                contribution => contribution.primaryArea
            )
        )
    ];
}

export function getProjectSkills(project) {
    return [
        ...new Set(
            project.details.contributions.flatMap(
                contribution => contribution.skills ?? []
            )
        )
    ];
}
