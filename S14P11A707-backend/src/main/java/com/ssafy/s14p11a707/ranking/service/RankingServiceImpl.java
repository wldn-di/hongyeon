package com.ssafy.s14p11a707.ranking.service;

import com.ssafy.s14p11a707.exception.BaseException;
import com.ssafy.s14p11a707.exception.ErrorCode;
import com.ssafy.s14p11a707.ranking.dto.GlobalRankingResponse;
import com.ssafy.s14p11a707.ranking.dto.GlobalRankingResponse.RankEntry;
import com.ssafy.s14p11a707.ranking.dto.MyRankingResponse;
import com.ssafy.s14p11a707.user.entity.User;
import com.ssafy.s14p11a707.user.repository.UserRepository;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RankingServiceImpl implements RankingService {

    private final UserRepository userRepository;

    @Override
    public GlobalRankingResponse getGlobalRanking(String type) {
        List<User> top10Users = getTop10ByType(type);

        AtomicInteger rank = new AtomicInteger(1);
        List<RankEntry> top10 = top10Users.stream()
                .map(user -> new RankEntry(
                        rank.getAndIncrement(),
                        user.getId(),
                        user.getNickname(),
                        getValueByType(user, type)
                ))
                .toList();

        return new GlobalRankingResponse(type, top10, null);
    }

    @Override
    public MyRankingResponse getMyRanking(String type, long userId) {
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new BaseException(ErrorCode.UNAUTHORIZED));
        int myRank = calculateMyRank(currentUser, type);

        return new MyRankingResponse(
                type,
                myRank,
                currentUser.getId(),
                currentUser.getNickname(),
                getValueByType(currentUser, type)
        );
    }

    private List<User> getTop10ByType(String type) {
        return switch (type) {
            case "score" -> userRepository.findTop10ByOrderByTotalScoreDesc();
            case "clears" -> userRepository.findTop10ByOrderByTotalClearsDesc();
            case "time" -> userRepository.findTop10ByOrderByTotalPlayTimeDesc();
            default -> userRepository.findTop10ByOrderByTotalScoreDesc();
        };
    }

    private long getValueByType(User user, String type) {
        return switch (type) {
            case "score" -> user.getTotalScore();
            case "clears" -> user.getTotalClears();
            case "time" -> user.getTotalPlayTime();
            default -> user.getTotalScore();
        };
    }

    private int calculateMyRank(User user, String type) {
        long countAbove = switch (type) {
            case "score" -> userRepository.countByTotalScoreGreaterThan(user.getTotalScore());
            case "clears" -> userRepository.countByTotalClearsGreaterThan(user.getTotalClears());
            case "time" -> userRepository.countByTotalPlayTimeLessThan(user.getTotalPlayTime());
            default -> userRepository.countByTotalScoreGreaterThan(user.getTotalScore());
        };
        return (int) countAbove + 1;
    }
}
