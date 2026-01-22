import { useState } from 'react'

export function useScenarioFilters(initial = {}) {
    const {
        genreFilter: initialGenre = 'all',
        difficultyFilter: initialDifficulty = 'all',
        sortBy: initialSortBy = 'popular',
    } = initial

    const [genreFilter, setGenreFilter] = useState(initialGenre)
    const [difficultyFilter, setDifficultyFilter] = useState(initialDifficulty)
    const [sortBy, setSortBy] = useState(initialSortBy)

    const resetFilters = () => {
        setGenreFilter(initialGenre)
        setDifficultyFilter(initialDifficulty)
        setSortBy(initialSortBy)
    }

    return {
        genreFilter,
        difficultyFilter,
        sortBy,
        setGenreFilter,
        setDifficultyFilter,
        setSortBy,
        resetFilters,
    }
}