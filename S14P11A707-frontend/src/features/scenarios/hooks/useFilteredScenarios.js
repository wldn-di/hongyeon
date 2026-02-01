import { useMemo } from 'react'

export function useFilteredScenarios(scenarios, filters) {
    const { keyword, genres, difficulties, sortBy } = filters

    return useMemo(() => {
        let result = [...scenarios]

        const normalizedKeyword = String(keyword || '').trim().toLowerCase()
        if (normalizedKeyword) {
            result = result.filter((scenario) => {
                const haystack = `${scenario.title ?? ''} ${scenario.synopsis ?? ''} ${scenario.description ?? ''}`.toLowerCase()
                return haystack.includes(normalizedKeyword)
            })
        }

        // 장르 필터 (멀티)
        if (Array.isArray(genres) && genres.length > 0) {
            const set = new Set(genres.map(String))
            result = result.filter((s) => set.has(String(s.genre)))
        }

        // 난이도 필터 (멀티)
        if (Array.isArray(difficulties) && difficulties.length > 0) {
            const set = new Set(difficulties.map(String))
            result = result.filter((s) => set.has(String(s.difficulty)))
        }

        // 정렬 위치
        result = sortScenarios(result, sortBy)

        return result
    }, [scenarios, keyword, genres, difficulties, sortBy])    
}

function sortScenarios(scenarios, sortBy) {
    const sorted = [...scenarios]

    switch(sortBy) {
        case 'latest' :
            return sorted.sort((a, b) => {
                const aTime = a.createdAt ? new Date(a.createdAt).getTime() : Number(a.id) || 0
                const bTime = b.createdAt ? new Date(b.createdAt).getTime() : Number(b.id) || 0
                return bTime - aTime
            })
        case 'popular' :
            return sorted.sort((a, b) => b.playCount - a.playCount)
        case 'rating':
            return sorted.sort((a, b) => (b.avgRating ?? b.rating ?? 0) - (a.avgRating ?? a.rating ?? 0))
        default:
            return sorted
    }
}
