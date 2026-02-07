package com.ssafy.s14p11a707.game.v2.service;

public record SuspectChatV2Context(
        long sessionId,
        long suspectId,
        String conversationId,
        String scenarioContext,
        String suspectName,
        int suspectAge,
        String suspectGender,
        String suspectOccupation,
        String suspectOneLiner,
        String suspectMotive,
        boolean suspectCulprit,
        String personality,
        String speechStyle,
        String level1Lie,
        String level2Weak,
        Long weaknessClueId,
        int currentInterrogationLevel,
        int promptInterrogationLevel,
        String userMessage,
        Long usedClueId,
        String usedClueName,
        String usedClueDescription,
        String usedClueOwnershipStatus,
        String usedClueOwnershipReason,
        int currentHealth
) {
}

