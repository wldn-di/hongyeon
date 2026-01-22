import { useMemo } from 'react'

export function useFilteredScenarios(scenarios, filters) {
    const { genreFilter, difficultyFilter, sortBy } = filters

    return useMemo(() => {
        let result = [...scenarios]

        // TODO: 장르 필터 이후 필요에 따라 구현
        if (genreFilter !== 'all') {
            // result = result.filter(s => s.genre === genreFilter)
        }

        // 난이도 필터 기능
        if (difficultyFilter !== 'all') {
            result = result.filter((s) => s.difficulty === difficultyFilter)
        }

        // 정렬 위치
        result = sortScenarios(result, sortBy)

        return result
    }, [scenarios, genreFilter, difficultyFilter, sortBy])    
}

function sortScenarios(scenarios, sortBy) {
    const sorted = [...scenarios]

    switch(sortBy) {
        case 'popular' :
            return sorted.sort((a, b) => b.playCount - a.playCount)
        case 'views' :
            return sorted.sort((a, b) => b.playCount - a.playCount)
        case 'rating':
            return sorted.sort((a, b) => b.rating - a.rating)
        default:
            return sorted
    }
}