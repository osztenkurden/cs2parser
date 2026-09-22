// AUTO-GENERATED - DO NOT EDIT
// Generated from demo: 21_09_2026.dem on 2026-09-22 (build: 10896, patch: 14181)

/** Prefixes all keys of T with "P." */
type Prefixed<P extends string, T> = {
	readonly [K in keyof T as K extends string ? `${P}.${K}` : never]: T[K];
};

interface _CBodyComponentBaseAnimGraph {
	readonly "m_animationController.m_flPlaybackRate"?: number;
	readonly "m_animationController.m_flSeqFixedCycle"?: number;
	readonly "m_animationController.m_flSeqStartTime"?: number;
	readonly "m_animationController.m_hGraphDefinitionAG2"?: bigint;
	readonly "m_animationController.m_hSequence"?: bigint;
	readonly "m_animationController.m_nAnimationAlgorithm"?: number;
	readonly "m_animationController.m_nAnimLoopMode"?: number;
	readonly "m_animationController.m_nSecondarySkeletonMasterCount"?: number;
	readonly "m_animationController.m_nSerializePoseRecipeAG2ActiveSlot"?: number;
	readonly "m_animationController.m_nSerializePoseRecipeVersionAG2"?: number;
	readonly "m_animationController.m_nServerGraphInstanceIteration"?: number;
	readonly "m_animationController.m_nServerSerializationContextIteration"?: number;
	readonly "m_animationController.m_primaryGraphId"?: bigint;
	readonly "m_animationController.m_SerializePoseRecipeAG2Dynamic"?: Uint8Array;
	readonly "m_animationController.m_SerializePoseRecipeAG2Slots"?: ReadonlyArray<{ readonly "m_topology"?: Uint8Array }>;
	readonly "m_animationController.m_vecExternalClipIds"?: BigUint64Array;
	readonly "m_animationController.m_vecExternalGraphIds"?: BigUint64Array;
	readonly "m_animationController.m_vecSecondarySkeletons"?: number[];
	readonly "m_animationController.m_vecSecondarySkeletonSlotIDs"?: string[];
	readonly "m_skeletonInstance.m_angRotation"?: [number, number, number];
	readonly "m_skeletonInstance.m_bUseParentRenderBounds"?: boolean;
	readonly "m_skeletonInstance.m_flScale"?: number;
	readonly "m_skeletonInstance.m_hierarchyAttachName"?: number;
	readonly "m_skeletonInstance.m_hParent"?: number;
	readonly "m_skeletonInstance.m_materialGroup"?: number;
	readonly "m_skeletonInstance.m_modelState.m_bClientClothCreationSuppressed"?: boolean;
	readonly "m_skeletonInstance.m_modelState.m_flRootBoneOffset_x"?: number;
	readonly "m_skeletonInstance.m_modelState.m_flRootBoneOffset_y"?: number;
	readonly "m_skeletonInstance.m_modelState.m_flRootBoneOffset_z"?: number;
	readonly "m_skeletonInstance.m_modelState.m_hModel"?: bigint;
	readonly "m_skeletonInstance.m_modelState.m_MeshGroupMask"?: bigint;
	readonly "m_skeletonInstance.m_modelState.m_nAnimStateNoInterpSerialNumber"?: number;
	readonly "m_skeletonInstance.m_modelState.m_nBodyGroupChoices"?: Int32Array;
	readonly "m_skeletonInstance.m_modelState.m_nIdealMotionType"?: number;
	readonly "m_skeletonInstance.m_modelState.m_nRootBoneOffsetResetSerialNumber"?: number;
	readonly "m_skeletonInstance.m_name"?: number;
	readonly "m_skeletonInstance.m_nHitboxSet"?: number;
	readonly "m_skeletonInstance.m_vecOrigin.m_cellX"?: number;
	readonly "m_skeletonInstance.m_vecOrigin.m_cellY"?: number;
	readonly "m_skeletonInstance.m_vecOrigin.m_cellZ"?: number;
	readonly "m_skeletonInstance.m_vecOrigin.m_nOutsideWorld"?: number;
	readonly "m_skeletonInstance.m_vecOrigin.m_vecX"?: number;
	readonly "m_skeletonInstance.m_vecOrigin.m_vecY"?: number;
	readonly "m_skeletonInstance.m_vecOrigin.m_vecZ"?: number;
}

interface _CBodyComponentBaseModelEntity {
	readonly "m_skeletonInstance.m_angRotation"?: [number, number, number];
	readonly "m_skeletonInstance.m_bUseParentRenderBounds"?: boolean;
	readonly "m_skeletonInstance.m_flScale"?: number;
	readonly "m_skeletonInstance.m_hierarchyAttachName"?: number;
	readonly "m_skeletonInstance.m_hParent"?: number;
	readonly "m_skeletonInstance.m_materialGroup"?: number;
	readonly "m_skeletonInstance.m_modelState.m_bClientClothCreationSuppressed"?: boolean;
	readonly "m_skeletonInstance.m_modelState.m_flRootBoneOffset_x"?: number;
	readonly "m_skeletonInstance.m_modelState.m_flRootBoneOffset_y"?: number;
	readonly "m_skeletonInstance.m_modelState.m_flRootBoneOffset_z"?: number;
	readonly "m_skeletonInstance.m_modelState.m_hModel"?: bigint;
	readonly "m_skeletonInstance.m_modelState.m_MeshGroupMask"?: bigint;
	readonly "m_skeletonInstance.m_modelState.m_nAnimStateNoInterpSerialNumber"?: number;
	readonly "m_skeletonInstance.m_modelState.m_nBodyGroupChoices"?: Int32Array;
	readonly "m_skeletonInstance.m_modelState.m_nIdealMotionType"?: number;
	readonly "m_skeletonInstance.m_modelState.m_nRootBoneOffsetResetSerialNumber"?: number;
	readonly "m_skeletonInstance.m_name"?: number;
	readonly "m_skeletonInstance.m_nHitboxSet"?: number;
	readonly "m_skeletonInstance.m_vecOrigin.m_cellX"?: number;
	readonly "m_skeletonInstance.m_vecOrigin.m_cellY"?: number;
	readonly "m_skeletonInstance.m_vecOrigin.m_cellZ"?: number;
	readonly "m_skeletonInstance.m_vecOrigin.m_nOutsideWorld"?: number;
	readonly "m_skeletonInstance.m_vecOrigin.m_vecX"?: number;
	readonly "m_skeletonInstance.m_vecOrigin.m_vecY"?: number;
	readonly "m_skeletonInstance.m_vecOrigin.m_vecZ"?: number;
}

interface _CBodyComponentPoint {
	readonly "m_sceneNode.m_angRotation"?: [number, number, number];
	readonly "m_sceneNode.m_flScale"?: number;
	readonly "m_sceneNode.m_hierarchyAttachName"?: number;
	readonly "m_sceneNode.m_hParent"?: number;
	readonly "m_sceneNode.m_name"?: number;
	readonly "m_sceneNode.m_vecOrigin.m_cellX"?: number;
	readonly "m_sceneNode.m_vecOrigin.m_cellY"?: number;
	readonly "m_sceneNode.m_vecOrigin.m_cellZ"?: number;
	readonly "m_sceneNode.m_vecOrigin.m_nOutsideWorld"?: number;
	readonly "m_sceneNode.m_vecOrigin.m_vecX"?: number;
	readonly "m_sceneNode.m_vecOrigin.m_vecY"?: number;
	readonly "m_sceneNode.m_vecOrigin.m_vecZ"?: number;
}

interface _CCSGameRules {
	readonly "m_arrProhibitedItemIndices"?: Uint16Array;
	readonly "m_arrTournamentActiveCasterAccounts"?: Uint32Array;
	readonly "m_bAnyHostageReached"?: boolean;
	readonly "m_bBombDropped"?: boolean;
	readonly "m_bBombPlanted"?: boolean;
	readonly "m_bCTCantBuy"?: boolean;
	readonly "m_bCTTimeOutActive"?: boolean;
	readonly "m_bFreezePeriod"?: boolean;
	readonly "m_bGamePaused"?: boolean;
	readonly "m_bGameRestart"?: boolean;
	readonly "m_bHasMatchStarted"?: boolean;
	readonly "m_bIsDroppingItems"?: boolean;
	readonly "m_bIsHltvActive"?: boolean;
	readonly "m_bIsQuestEligible"?: boolean;
	readonly "m_bIsQueuedMatchmaking"?: boolean;
	readonly "m_bIsValveDS"?: boolean;
	readonly "m_bLogoMap"?: boolean;
	readonly "m_bMapHasBombTarget"?: boolean;
	readonly "m_bMapHasBuyZone"?: boolean;
	readonly "m_bMapHasRescueZone"?: boolean;
	readonly "m_bMatchWaitingForResume"?: boolean;
	readonly "m_bPlayAllStepSoundsOnServer"?: boolean;
	readonly "m_bRoundEndNoMusic"?: boolean;
	readonly "m_bRoundEndShowTimerDefend"?: boolean;
	readonly "m_bTCantBuy"?: boolean;
	readonly "m_bTeamIntroPeriod"?: boolean;
	readonly "m_bTechnicalTimeOut"?: boolean;
	readonly "m_bTerroristTimeOutActive"?: boolean;
	readonly "m_bWarmupPeriod"?: boolean;
	readonly "m_eRoundEndReason"?: number;
	readonly "m_eRoundWinReason"?: number;
	readonly "m_flCMMItemDropRevealEndTime"?: number;
	readonly "m_flCMMItemDropRevealStartTime"?: number;
	readonly "m_flCTTimeOutRemaining"?: number;
	readonly "m_flGameStartTime"?: number;
	readonly "m_flNextRespawnWave"?: number[];
	readonly "m_flRestartRoundTime"?: number;
	readonly "m_flTerroristTimeOutRemaining"?: number;
	readonly "m_fMatchStartTime"?: number;
	readonly "m_fRoundStartTime"?: number;
	readonly "m_fWarmupPeriodEnd"?: number;
	readonly "m_fWarmupPeriodStart"?: number;
	readonly "m_gamePhase"?: number;
	readonly "m_iFreezeTime"?: number;
	readonly "m_iHostagesRemaining"?: number;
	readonly "m_iMatchStats_PlayersAlive_CT"?: Int32Array;
	readonly "m_iMatchStats_PlayersAlive_T"?: Int32Array;
	readonly "m_iMatchStats_RoundResults"?: Int32Array;
	readonly "m_iNumConsecutiveCTLoses"?: number;
	readonly "m_iNumConsecutiveTerroristLoses"?: number;
	readonly "m_iRoundEndFunFactData1"?: number;
	readonly "m_iRoundEndFunFactData2"?: number;
	readonly "m_iRoundEndFunFactData3"?: number;
	readonly "m_iRoundEndFunFactPlayerSlot"?: number;
	readonly "m_iRoundEndLegacy"?: number;
	readonly "m_iRoundEndPlayerCount"?: number;
	readonly "m_iRoundEndTimerTime"?: number;
	readonly "m_iRoundEndWinnerTeam"?: number;
	readonly "m_iRoundStartRoundNumber"?: number;
	readonly "m_iRoundTime"?: number;
	readonly "m_iRoundWinStatus"?: number;
	readonly "m_iSpectatorSlotCount"?: number;
	readonly "m_MatchDevice"?: number;
	readonly "m_MinimapVerticalSectionHeights"?: Float32Array;
	readonly "m_nCTTeamIntroVariant"?: number;
	readonly "m_nCTTimeOuts"?: number;
	readonly "m_nEndMatchMapGroupVoteOptions"?: Int32Array;
	readonly "m_nEndMatchMapGroupVoteTypes"?: Int32Array;
	readonly "m_nEndMatchMapVoteWinner"?: number;
	readonly "m_nHalloweenMaskListSeed"?: number;
	readonly "m_nMatchAbortedEarlyReason"?: number;
	readonly "m_nMatchEndCount"?: number;
	readonly "m_nNextMapInMapgroup"?: number;
	readonly "m_nOvertimePlaying"?: number;
	readonly "m_nPauseStartTick"?: number;
	readonly "m_nQueuedMatchmakingMode"?: number;
	readonly "m_nRoundEndCount"?: number;
	readonly "m_nRoundsPlayedThisPhase"?: number;
	readonly "m_nRoundStartCount"?: number;
	readonly "m_nTerroristTimeOuts"?: number;
	readonly "m_nTotalPausedTicks"?: number;
	readonly "m_nTournamentPredictionsPct"?: number;
	readonly "m_nTTeamIntroVariant"?: number;
	readonly "m_numBestOfMaps"?: number;
	readonly "m_RetakeRules.m_bBlockersPresent"?: boolean;
	readonly "m_RetakeRules.m_bRoundInProgress"?: boolean;
	readonly "m_RetakeRules.m_hBombPlanter"?: number;
	readonly "m_RetakeRules.m_iBombSite"?: number;
	readonly "m_RetakeRules.m_iFirstSecondHalfRound"?: number;
	readonly "m_RetakeRules.m_nMatchSeed"?: number;
	readonly "m_sRoundEndFunFactToken"?: string;
	readonly "m_sRoundEndMessage"?: string;
	readonly "m_szMatchStatTxt"?: string;
	readonly "m_szTournamentEventName"?: string;
	readonly "m_szTournamentEventStage"?: string;
	readonly "m_szTournamentPredictionsTxt"?: string;
	readonly "m_TeamRespawnWaveTimes"?: Float32Array;
	readonly "m_timeUntilNextPhaseStarts"?: number;
	readonly "m_totalRoundsPlayed"?: number;
	readonly "m_vMinimapMaxs"?: [number, number, number];
	readonly "m_vMinimapMins"?: [number, number, number];
}

interface _CCSObserver_CameraServices {
	readonly "m_audio.localBits"?: number;
	readonly "m_audio.localSound"?: [number, number, number][];
	readonly "m_audio.soundEventHash"?: number;
	readonly "m_audio.soundscapeEntityListIndex"?: number;
	readonly "m_audio.soundscapeIndex"?: number;
	readonly "m_flCsViewPunchAngleTickRatio"?: number;
	readonly "m_flFOVRate"?: number;
	readonly "m_flFOVTime"?: number;
	readonly "m_hColorCorrectionCtrl"?: number;
	readonly "m_hTonemapController"?: number;
	readonly "m_hViewEntity"?: number;
	readonly "m_hZoomOwner"?: number;
	readonly "m_iFOV"?: number;
	readonly "m_iFOVStart"?: number;
	readonly "m_nCsViewPunchAngleTick"?: number;
	readonly "m_PlayerFog.m_hCtrl"?: number;
	readonly "m_PostProcessingVolumes"?: number[];
	readonly "m_vecCsViewPunchAngle"?: [number, number, number];
}

interface _CCSObserver_MovementServices {
	readonly "m_arrForceSubtickMoveWhen"?: Float32Array;
	readonly "m_flMaxspeed"?: number;
	readonly "m_nToggleButtonDownMask"?: bigint;
}

interface _CCSObserver_ObserverServices {
	readonly "m_hObserverTarget"?: number;
	readonly "m_iObserverMode"?: number;
}

interface _CCSPlayer_ActionTrackingServices {
	readonly "m_bIsRescuing"?: boolean;
	readonly "m_weaponPurchasesThisMatch.m_weaponPurchases"?: ReadonlyArray<{ readonly "m_nCount"?: number; readonly "m_nItemDefIndex"?: number }>;
	readonly "m_weaponPurchasesThisRound.m_weaponPurchases"?: ReadonlyArray<{ readonly "m_nCount"?: number; readonly "m_nItemDefIndex"?: number }>;
}

interface _CCSPlayer_AimPunchServices {
	readonly "m_predictableBaseAngle"?: [number, number, number];
	readonly "m_predictableBaseAngleVel"?: [number, number, number];
	readonly "m_predictableBaseTick"?: number;
	readonly "m_predictableBaseTickInterpAmount"?: number;
	readonly "m_unpredictableBaseAngle"?: [number, number, number];
	readonly "m_unpredictableBaseTick"?: number;
}

interface _CCSPlayer_BulletServices {
	readonly "m_totalHitsOnServer"?: number;
}

interface _CCSPlayer_BuyServices {
	readonly "m_vecSellbackPurchaseEntries"?: ReadonlyArray<{ readonly "m_bPrevHelmet"?: boolean; readonly "m_hItem"?: bigint; readonly "m_nCost"?: number; readonly "m_nPrevArmor"?: number; readonly "m_unDefIdx"?: number }>;
}

interface _CCSPlayer_CameraServices {
	readonly "m_audio.localBits"?: number;
	readonly "m_audio.localSound"?: [number, number, number][];
	readonly "m_audio.soundEventHash"?: number;
	readonly "m_audio.soundscapeEntityListIndex"?: number;
	readonly "m_audio.soundscapeIndex"?: number;
	readonly "m_flCsViewPunchAngleTickRatio"?: number;
	readonly "m_flFOVRate"?: number;
	readonly "m_flFOVTime"?: number;
	readonly "m_hColorCorrectionCtrl"?: number;
	readonly "m_hTonemapController"?: number;
	readonly "m_hViewEntity"?: number;
	readonly "m_hZoomOwner"?: number;
	readonly "m_iFOV"?: number;
	readonly "m_iFOVStart"?: number;
	readonly "m_nCsViewPunchAngleTick"?: number;
	readonly "m_PlayerFog.m_hCtrl"?: number;
	readonly "m_PostProcessingVolumes"?: number[];
	readonly "m_vecCsViewPunchAngle"?: [number, number, number];
}

interface _CCSPlayer_HostageServices {
	readonly "m_hCarriedHostage"?: number;
	readonly "m_hCarriedHostageProp"?: number;
}

interface _CCSPlayer_ItemServices {
	readonly "m_bHasDefuser"?: boolean;
	readonly "m_bHasHelmet"?: boolean;
}

interface _CCSPlayer_MovementServices {
	readonly "m_arrForceSubtickMoveWhen"?: Float32Array;
	readonly "m_bDesiresDuck"?: boolean;
	readonly "m_bDucked"?: boolean;
	readonly "m_bDucking"?: boolean;
	readonly "m_bDuckOverride"?: boolean;
	readonly "m_bHasEverProcessedCommand"?: boolean;
	readonly "m_bJumpApexPending"?: boolean;
	readonly "m_bUseFrictionStashedSpeed"?: boolean;
	readonly "m_bUsingGroundTopologyOffset"?: boolean;
	readonly "m_flBombPlantViewOffset"?: number;
	readonly "m_flDuckAmount"?: number;
	readonly "m_flDuckRootOffset"?: number;
	readonly "m_flDuckSpeed"?: number;
	readonly "m_flDuckViewOffset"?: number;
	readonly "m_flFallVelocity"?: number;
	readonly "m_flFrictionStashedSpeed"?: number;
	readonly "m_flLastDuckTime"?: number;
	readonly "m_flLastJumpFrac"?: number;
	readonly "m_flLastJumpVelocityZ"?: number;
	readonly "m_flMaxspeed"?: number;
	readonly "m_flStamina"?: number;
	readonly "m_flUseFrictionStashedSpeedUntilFrac"?: number;
	readonly "m_flUsingGroundTopologyOffsetTransitionSmoothing"?: number;
	readonly "m_fStashGrenadeParameterWhen"?: number;
	readonly "m_LegacyJump.m_bOldJumpPressed"?: boolean;
	readonly "m_ModernJump.m_flLastActualJumpPressFrac"?: number;
	readonly "m_ModernJump.m_flLastLandedFrac"?: number;
	readonly "m_ModernJump.m_flLastLandedVelocityX"?: number;
	readonly "m_ModernJump.m_flLastLandedVelocityY"?: number;
	readonly "m_ModernJump.m_flLastLandedVelocityZ"?: number;
	readonly "m_ModernJump.m_flLastUsableJumpPressFrac"?: number;
	readonly "m_ModernJump.m_nLastActualJumpPressTick"?: number;
	readonly "m_ModernJump.m_nLastLandedTick"?: number;
	readonly "m_ModernJump.m_nLastUsableJumpPressTick"?: number;
	readonly "m_nGameCodeHasMovedPlayerAfterCommand"?: number;
	readonly "m_nLadderSurfacePropIndex"?: number;
	readonly "m_nLastJumpTick"?: number;
	readonly "m_nToggleButtonDownMask"?: bigint;
}

interface _CCSPlayer_PingServices {
	readonly "m_hPlayerPing"?: number;
}

interface _CCSPlayer_WeaponServices {
	readonly "m_bBlockInspectUntilNextGraphUpdate"?: boolean;
	readonly "m_flNextAttack"?: number;
	readonly "m_hActiveWeapon"?: number;
	readonly "m_hLastWeapon"?: number;
	readonly "m_hMyWeapons"?: number[];
	readonly "m_iAmmo"?: Uint16Array;
	readonly "m_networkAnimTiming"?: Uint8Array;
}

interface _CCSPlayerController_ActionTrackingServices {
	readonly "m_flTotalRoundDamageDealt"?: number;
	readonly "m_iNumRoundKills"?: number;
	readonly "m_iNumRoundKillsHeadshots"?: number;
	readonly "m_matchStats.m_iAssists"?: number;
	readonly "m_matchStats.m_iCashEarned"?: number;
	readonly "m_matchStats.m_iDamage"?: number;
	readonly "m_matchStats.m_iDeaths"?: number;
	readonly "m_matchStats.m_iEnemiesFlashed"?: number;
	readonly "m_matchStats.m_iEnemy3Ks"?: number;
	readonly "m_matchStats.m_iEnemy4Ks"?: number;
	readonly "m_matchStats.m_iEnemy5Ks"?: number;
	readonly "m_matchStats.m_iEnemyKnifeKills"?: number;
	readonly "m_matchStats.m_iEnemyTaserKills"?: number;
	readonly "m_matchStats.m_iEquipmentValue"?: number;
	readonly "m_matchStats.m_iHeadShotKills"?: number;
	readonly "m_matchStats.m_iKillReward"?: number;
	readonly "m_matchStats.m_iKills"?: number;
	readonly "m_matchStats.m_iLiveTime"?: number;
	readonly "m_matchStats.m_iMoneySaved"?: number;
	readonly "m_matchStats.m_iObjective"?: number;
	readonly "m_matchStats.m_iUtilityDamage"?: number;
	readonly "m_perRoundStats"?: ReadonlyArray<{ readonly "m_iAssists"?: number; readonly "m_iCashEarned"?: number; readonly "m_iDamage"?: number; readonly "m_iDeaths"?: number; readonly "m_iEnemiesFlashed"?: number; readonly "m_iEquipmentValue"?: number; readonly "m_iHeadShotKills"?: number; readonly "m_iKillReward"?: number; readonly "m_iKills"?: number; readonly "m_iLiveTime"?: number; readonly "m_iMoneySaved"?: number; readonly "m_iObjective"?: number; readonly "m_iUtilityDamage"?: number }>;
}

interface _CCSPlayerController_DamageServices {
	readonly "m_DamageList"?: ReadonlyArray<{ readonly "m_bIsOtherEnemy"?: boolean; readonly "m_DamagerXuid"?: bigint; readonly "m_flActualHealthRemoved"?: number; readonly "m_flDamage"?: number; readonly "m_hPlayerControllerDamager"?: number; readonly "m_hPlayerControllerRecipient"?: number; readonly "m_iLastBulletUpdate"?: number; readonly "m_iNumHits"?: number; readonly "m_killType"?: number; readonly "m_PlayerDamager"?: number; readonly "m_PlayerRecipient"?: number; readonly "m_RecipientXuid"?: bigint; readonly "m_szPlayerDamagerName"?: string; readonly "m_szPlayerRecipientName"?: string }>;
	readonly "m_nSendUpdate"?: number;
}

interface _CCSPlayerController_InGameMoneyServices {
	readonly "m_iAccount"?: number;
	readonly "m_iCashSpentThisRound"?: number;
	readonly "m_iStartAccount"?: number;
	readonly "m_iTotalCashSpent"?: number;
}

interface _CCSPlayerController_InventoryServices {
	readonly "m_nPersonaDataPublicCommendsFriendly"?: number;
	readonly "m_nPersonaDataPublicCommendsLeader"?: number;
	readonly "m_nPersonaDataPublicCommendsTeacher"?: number;
	readonly "m_nPersonaDataPublicLevel"?: number;
	readonly "m_nPersonaDataXpTrailLevel"?: number;
	readonly "m_rank"?: bigint[];
	readonly "m_unMusicID"?: number;
	readonly "m_vecServerAuthoritativeWeaponSlots"?: ReadonlyArray<{ readonly "unClass"?: number; readonly "unItemDefIdx"?: number; readonly "unSlot"?: number }>;
}

interface _CDestructiblePartsComponent {
	readonly "m_hOwner"?: number;
}

interface _CEntityIdentity {
	readonly "m_nameStringTableIndex"?: number;
}

interface _CLightComponent {
	readonly "m_bAllowSSTGeneration"?: boolean;
	readonly "m_bEnabled"?: boolean;
	readonly "m_bFlicker"?: boolean;
	readonly "m_bMixedShadows"?: boolean;
	readonly "m_bPrecomputedFieldsValid"?: boolean;
	readonly "m_bRenderDiffuse"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bRenderTransmissive"?: boolean;
	readonly "m_bUseSecondaryColor"?: boolean;
	readonly "m_bUsesIndexedBakedLighting"?: boolean;
	readonly "m_Color"?: number;
	readonly "m_flAttenuation0"?: number;
	readonly "m_flAttenuation1"?: number;
	readonly "m_flAttenuation2"?: number;
	readonly "m_flBounceScale"?: number;
	readonly "m_flBrightness"?: number;
	readonly "m_flBrightnessMult"?: number;
	readonly "m_flBrightnessScale"?: number;
	readonly "m_flCapsuleLength"?: number;
	readonly "m_flFadeMaxDist"?: number;
	readonly "m_flFadeMinDist"?: number;
	readonly "m_flFalloff"?: number;
	readonly "m_flFogContributionStength"?: number;
	readonly "m_flLightStyleStartTime"?: number;
	readonly "m_flMinRoughness"?: number;
	readonly "m_flNearClipPlane"?: number;
	readonly "m_flOrthoLightHeight"?: number;
	readonly "m_flOrthoLightWidth"?: number;
	readonly "m_flPhi"?: number;
	readonly "m_flPrecomputedMaxRange"?: number;
	readonly "m_flRange"?: number;
	readonly "m_flShadowCascadeCrossFade"?: number;
	readonly "m_flShadowCascadeDistance0"?: number;
	readonly "m_flShadowCascadeDistance1"?: number;
	readonly "m_flShadowCascadeDistance2"?: number;
	readonly "m_flShadowCascadeDistance3"?: number;
	readonly "m_flShadowCascadeDistanceFade"?: number;
	readonly "m_flShadowFadeMaxDist"?: number;
	readonly "m_flShadowFadeMinDist"?: number;
	readonly "m_flSkyIntensity"?: number;
	readonly "m_flTheta"?: number;
	readonly "m_hLightCookie"?: bigint;
	readonly "m_nBakedShadowIndex"?: number;
	readonly "m_nBounceLight"?: number;
	readonly "m_nCascadeRenderStaticObjects"?: number;
	readonly "m_nCascades"?: number;
	readonly "m_nCastShadows"?: number;
	readonly "m_nDirectLight"?: number;
	readonly "m_nFogLightingMode"?: number;
	readonly "m_nLightMapUniqueId"?: number;
	readonly "m_nLightPathUniqueId"?: number;
	readonly "m_nRenderSpecular"?: number;
	readonly "m_nShadowCascadeResolution0"?: number;
	readonly "m_nShadowCascadeResolution1"?: number;
	readonly "m_nShadowCascadeResolution2"?: number;
	readonly "m_nShadowCascadeResolution3"?: number;
	readonly "m_nShadowHeight"?: number;
	readonly "m_nShadowPriority"?: number;
	readonly "m_nShadowWidth"?: number;
	readonly "m_nStyle"?: number;
	readonly "m_Pattern"?: string;
	readonly "m_SecondaryColor"?: number;
	readonly "m_SkyAmbientBounce"?: number;
	readonly "m_SkyColor"?: number;
	readonly "m_vPrecomputedBoundsMaxs"?: [number, number, number];
	readonly "m_vPrecomputedBoundsMins"?: [number, number, number];
	readonly "m_vPrecomputedOBBAngles"?: [number, number, number];
	readonly "m_vPrecomputedOBBExtent"?: [number, number, number];
	readonly "m_vPrecomputedOBBOrigin"?: [number, number, number];
}

interface _CPlayer_CameraServices {
	readonly "m_audio.localBits"?: number;
	readonly "m_audio.localSound"?: [number, number, number][];
	readonly "m_audio.soundEventHash"?: number;
	readonly "m_audio.soundscapeEntityListIndex"?: number;
	readonly "m_audio.soundscapeIndex"?: number;
	readonly "m_flCsViewPunchAngleTickRatio"?: number;
	readonly "m_hColorCorrectionCtrl"?: number;
	readonly "m_hTonemapController"?: number;
	readonly "m_hViewEntity"?: number;
	readonly "m_nCsViewPunchAngleTick"?: number;
	readonly "m_PlayerFog.m_hCtrl"?: number;
	readonly "m_PostProcessingVolumes"?: number[];
	readonly "m_vecCsViewPunchAngle"?: [number, number, number];
}

interface _AnimGraph2SerializedPoseRecipeSlot_tOwn {
	readonly "m_topology"?: Uint8Array;
}

interface _CAK47Own {
	readonly "m_AttributeManager.m_hOuter"?: number;
	readonly "m_AttributeManager.m_iReapplyProvisionParity"?: number;
	readonly "m_AttributeManager.m_Item.m_AttributeList.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_AttributeManager.m_Item.m_bInitialized"?: boolean;
	readonly "m_AttributeManager.m_Item.m_iAccountID"?: number;
	readonly "m_AttributeManager.m_Item.m_iEntityLevel"?: number;
	readonly "m_AttributeManager.m_Item.m_iEntityQuality"?: number;
	readonly "m_AttributeManager.m_Item.m_iInventoryPosition"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemDefinitionIndex"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemIDHigh"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemIDLow"?: number;
	readonly "m_AttributeManager.m_Item.m_NetworkedDynamicAttributes.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_AttributeManager.m_Item.m_szCustomName"?: string;
	readonly "m_AttributeManager.m_ProviderType"?: number;
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bBurstMode"?: boolean;
	readonly "m_bCanBePickedUp"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bDroppedNearBuyZone"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bInReload"?: boolean;
	readonly "m_bInspectPending"?: boolean;
	readonly "m_bInspectShouldLoop"?: boolean;
	readonly "m_bIsHauledBack"?: boolean;
	readonly "m_bNeedsBoltAction"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bSilencerOn"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_bWasActiveWeaponWhenDropped"?: boolean;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fAccuracyPenalty"?: number;
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_fLastShotTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flDroppedAtTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flFallbackWear"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flInspectCancelCompleteTime"?: number;
	readonly "m_flLastShakeTime"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flNextPrimaryAttackTickRatio"?: number;
	readonly "m_flNextSecondaryAttackTickRatio"?: number;
	readonly "m_flPostponeFireReadyFrac"?: number;
	readonly "m_flRecoilIndex"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flTimeSilencerSwitchComplete"?: number;
	readonly "m_flWatTickOffset"?: number;
	readonly "m_flWeaponActionPlaybackRate"?: number;
	readonly "m_flWeaponGameplayAnimStateTimestamp"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_hPrevOwner"?: number;
	readonly "m_iBurstShotsRemaining"?: number;
	readonly "m_iClip1"?: number;
	readonly "m_iClip2"?: number;
	readonly "m_iIronSightMode"?: number;
	readonly "m_iMostRecentTeamNumber"?: number;
	readonly "m_iOriginalTeamNumber"?: number;
	readonly "m_iRecoilIndex"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_iWeaponGameplayAnimState"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nDeployTick"?: number;
	readonly "m_nDropTick"?: number;
	readonly "m_nextPrevOwnerUseTime"?: number;
	readonly "m_nFallbackPaintKit"?: number;
	readonly "m_nFallbackSeed"?: number;
	readonly "m_nFallbackStatTrak"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nNextPrimaryAttackTick"?: number;
	readonly "m_nNextSecondaryAttackTick"?: number;
	readonly "m_nNextThinkTick"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nPostponeFireReadyTicks"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nRevolverCylinderIdx"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_OriginalOwnerXuidHigh"?: number;
	readonly "m_OriginalOwnerXuidLow"?: number;
	readonly "m_pReserveAmmo"?: Int32Array;
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
	readonly "m_weaponMode"?: bigint;
	readonly "m_zoomLevel"?: number;
}

interface _CBarnLightOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bContactShadow"?: boolean;
	readonly "m_bEnabled"?: boolean;
	readonly "m_bForceShadowsEnabled"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bPrecomputedFieldsValid"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_Color"?: number;
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fAlternateColorBrightness"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flBakeSpecularToCubemapsScale"?: number;
	readonly "m_flBounceScale"?: number;
	readonly "m_flBrightness"?: number;
	readonly "m_flBrightnessScale"?: number;
	readonly "m_flColorTemperature"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flFadeSizeEnd"?: number;
	readonly "m_flFadeSizeStart"?: number;
	readonly "m_flFogScale"?: number;
	readonly "m_flFogStrength"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flLightStyleStartTime"?: number;
	readonly "m_flLuminaireAnisotropy"?: number;
	readonly "m_flLuminaireSize"?: number;
	readonly "m_flMinRoughness"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flRange"?: number;
	readonly "m_flShadowFadeSizeEnd"?: number;
	readonly "m_flShadowFadeSizeStart"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flShape"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flSkirt"?: number;
	readonly "m_flSkirtNear"?: number;
	readonly "m_flSoftX"?: number;
	readonly "m_flSoftY"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hLightCookie"?: bigint;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_LightStyleEvents"?: string[];
	readonly "m_LightStyleString"?: string;
	readonly "m_LightStyleTargets"?: number[];
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBakedShadowIndex"?: number;
	readonly "m_nBakeSpecularToCubemaps"?: number;
	readonly "m_nBloodType"?: number;
	readonly "m_nBounceLight"?: number;
	readonly "m_nCastShadows"?: number;
	readonly "m_nColorMode"?: number;
	readonly "m_nDirectLight"?: number;
	readonly "m_nFog"?: number;
	readonly "m_nFogShadows"?: number;
	readonly "m_nLightMapUniqueId"?: number;
	readonly "m_nLightPathUniqueId"?: number;
	readonly "m_nLuminaireShape"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nPrecomputedSubFrusta"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nShadowMapSize"?: number;
	readonly "m_nShadowPriority"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_QueuedLightStyleStrings"?: string[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vAlternateColor"?: [number, number, number];
	readonly "m_vBakeSpecularToCubemapsSize"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
	readonly "m_VisClusters"?: Uint16Array;
	readonly "m_vPrecomputedBoundsMaxs"?: [number, number, number];
	readonly "m_vPrecomputedBoundsMins"?: [number, number, number];
	readonly "m_vPrecomputedOBBAngles"?: [number, number, number];
	readonly "m_vPrecomputedOBBAngles0"?: [number, number, number];
	readonly "m_vPrecomputedOBBAngles1"?: [number, number, number];
	readonly "m_vPrecomputedOBBAngles2"?: [number, number, number];
	readonly "m_vPrecomputedOBBAngles3"?: [number, number, number];
	readonly "m_vPrecomputedOBBAngles4"?: [number, number, number];
	readonly "m_vPrecomputedOBBAngles5"?: [number, number, number];
	readonly "m_vPrecomputedOBBExtent"?: [number, number, number];
	readonly "m_vPrecomputedOBBExtent0"?: [number, number, number];
	readonly "m_vPrecomputedOBBExtent1"?: [number, number, number];
	readonly "m_vPrecomputedOBBExtent2"?: [number, number, number];
	readonly "m_vPrecomputedOBBExtent3"?: [number, number, number];
	readonly "m_vPrecomputedOBBExtent4"?: [number, number, number];
	readonly "m_vPrecomputedOBBExtent5"?: [number, number, number];
	readonly "m_vPrecomputedOBBOrigin"?: [number, number, number];
	readonly "m_vPrecomputedOBBOrigin0"?: [number, number, number];
	readonly "m_vPrecomputedOBBOrigin1"?: [number, number, number];
	readonly "m_vPrecomputedOBBOrigin2"?: [number, number, number];
	readonly "m_vPrecomputedOBBOrigin3"?: [number, number, number];
	readonly "m_vPrecomputedOBBOrigin4"?: [number, number, number];
	readonly "m_vPrecomputedOBBOrigin5"?: [number, number, number];
	readonly "m_vShear"?: [number, number, number];
	readonly "m_vSizeParams"?: [number, number, number];
}

interface _CBaseAnimGraphOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CBaseButtonOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_glowEntity"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_szDisplayText"?: string;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_usable"?: boolean;
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CBaseCombatCharacterOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hMyWearables"?: number[];
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CBaseCSGrenadeProjectileOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bIsLive"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_DmgRadius"?: number;
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_fFlags"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flDamage"?: number;
	readonly "m_flDetonateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_hThrower"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nBounces"?: number;
	readonly "m_nExplodeEffectIndex"?: bigint;
	readonly "m_nExplodeEffectTickBegin"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecExplodeEffectOrigin"?: [number, number, number];
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
	readonly "m_vecVelocity.m_vecX"?: number;
	readonly "m_vecVelocity.m_vecY"?: number;
	readonly "m_vecVelocity.m_vecZ"?: number;
	readonly "m_vInitialPosition"?: [number, number, number];
	readonly "m_vInitialVelocity"?: [number, number, number];
}

interface _CBaseDoorOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bIsUsable"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CBaseEntityOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
}

interface _CBaseGrenadeOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bIsLive"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_DmgRadius"?: number;
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_fFlags"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flDamage"?: number;
	readonly "m_flDetonateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_hThrower"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
	readonly "m_vecVelocity.m_vecX"?: number;
	readonly "m_vecVelocity.m_vecY"?: number;
	readonly "m_vecVelocity.m_vecZ"?: number;
}

interface _CBaseModelEntityOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CBasePlayerControllerOwn {
	readonly "m_bKnownTeamMismatch"?: boolean;
	readonly "m_bNoClipEnabled"?: boolean;
	readonly "m_fFlags"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flFriction"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flTimeScale"?: number;
	readonly "m_hPawn"?: number;
	readonly "m_iConnected"?: number;
	readonly "m_iDesiredFOV"?: number;
	readonly "m_iMostConnected"?: number;
	readonly "m_iszPlayerName"?: string;
	readonly "m_iTeamNum"?: number;
	readonly "m_nNextThinkTick"?: number;
	readonly "m_nTickBase"?: number;
	readonly "m_steamID"?: bigint;
	readonly "m_vecBaseVelocity"?: [number, number, number];
	readonly "m_vecVelocity.m_vecX"?: number;
	readonly "m_vecVelocity.m_vecY"?: number;
	readonly "m_vecVelocity.m_vecZ"?: number;
}

interface _CBasePlayerPawnOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_fFlags"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flDeathTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flFriction"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flTimeScale"?: number;
	readonly "m_flWaterLevel"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hController"?: number;
	readonly "m_hDefaultController"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hGroundEntity"?: number;
	readonly "m_hMyWearables"?: number[];
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iHealth"?: number;
	readonly "m_iHideHUD"?: number;
	readonly "m_iMaxHealth"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_lifeState"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nGroundBodyIndex"?: number;
	readonly "m_nNextThinkTick"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_ServerViewAngleChanges"?: ReadonlyArray<{ readonly "nIndex"?: number; readonly "nType"?: number; readonly "qAngle"?: [number, number, number] }>;
	readonly "m_skybox3d.bClip3DSkyBoxNearToWorldFar"?: boolean;
	readonly "m_skybox3d.flClip3DSkyBoxNearToWorldFarOffset"?: number;
	readonly "m_skybox3d.fog.blend"?: boolean;
	readonly "m_skybox3d.fog.blendtobackground"?: number;
	readonly "m_skybox3d.fog.colorPrimary"?: number;
	readonly "m_skybox3d.fog.colorPrimaryLerpTo"?: number;
	readonly "m_skybox3d.fog.colorSecondary"?: number;
	readonly "m_skybox3d.fog.colorSecondaryLerpTo"?: number;
	readonly "m_skybox3d.fog.dirPrimary"?: [number, number, number];
	readonly "m_skybox3d.fog.duration"?: number;
	readonly "m_skybox3d.fog.enable"?: boolean;
	readonly "m_skybox3d.fog.end"?: number;
	readonly "m_skybox3d.fog.endLerpTo"?: number;
	readonly "m_skybox3d.fog.exponent"?: number;
	readonly "m_skybox3d.fog.farz"?: number;
	readonly "m_skybox3d.fog.HDRColorScale"?: number;
	readonly "m_skybox3d.fog.lerptime"?: number;
	readonly "m_skybox3d.fog.locallightscale"?: number;
	readonly "m_skybox3d.fog.maxdensity"?: number;
	readonly "m_skybox3d.fog.maxdensityLerpTo"?: number;
	readonly "m_skybox3d.fog.scattering"?: number;
	readonly "m_skybox3d.fog.skyboxFogFactor"?: number;
	readonly "m_skybox3d.fog.skyboxFogFactorLerpTo"?: number;
	readonly "m_skybox3d.fog.start"?: number;
	readonly "m_skybox3d.fog.startLerpTo"?: number;
	readonly "m_skybox3d.m_nWorldGroupID"?: number;
	readonly "m_skybox3d.origin"?: [number, number, number];
	readonly "m_skybox3d.scale"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecBaseVelocity"?: [number, number, number];
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
	readonly "m_vecVelocity.m_vecX"?: number;
	readonly "m_vecVelocity.m_vecY"?: number;
	readonly "m_vecVelocity.m_vecZ"?: number;
	readonly "m_vecViewOffset.m_vecX"?: number;
	readonly "m_vecViewOffset.m_vecY"?: number;
	readonly "m_vecViewOffset.m_vecZ"?: number;
}

interface _CBasePlayerWeaponOwn {
	readonly "m_AttributeManager.m_hOuter"?: number;
	readonly "m_AttributeManager.m_iReapplyProvisionParity"?: number;
	readonly "m_AttributeManager.m_Item.m_AttributeList.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_AttributeManager.m_Item.m_bInitialized"?: boolean;
	readonly "m_AttributeManager.m_Item.m_iAccountID"?: number;
	readonly "m_AttributeManager.m_Item.m_iEntityLevel"?: number;
	readonly "m_AttributeManager.m_Item.m_iEntityQuality"?: number;
	readonly "m_AttributeManager.m_Item.m_iInventoryPosition"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemDefinitionIndex"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemIDHigh"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemIDLow"?: number;
	readonly "m_AttributeManager.m_Item.m_NetworkedDynamicAttributes.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_AttributeManager.m_Item.m_szCustomName"?: string;
	readonly "m_AttributeManager.m_ProviderType"?: number;
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flFallbackWear"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flNextPrimaryAttackTickRatio"?: number;
	readonly "m_flNextSecondaryAttackTickRatio"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iClip1"?: number;
	readonly "m_iClip2"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nFallbackPaintKit"?: number;
	readonly "m_nFallbackSeed"?: number;
	readonly "m_nFallbackStatTrak"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nNextPrimaryAttackTick"?: number;
	readonly "m_nNextSecondaryAttackTick"?: number;
	readonly "m_nNextThinkTick"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_OriginalOwnerXuidHigh"?: number;
	readonly "m_OriginalOwnerXuidLow"?: number;
	readonly "m_pReserveAmmo"?: Int32Array;
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CBaseTriggerOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bDisabled"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_spawnflags"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CBeamOwn {
	readonly "m_bTurnedOff"?: boolean;
	readonly "m_clrRender"?: number;
	readonly "m_fAmplitude"?: number;
	readonly "m_fEndWidth"?: number;
	readonly "m_fFadeLength"?: number;
	readonly "m_fHaloScale"?: number;
	readonly "m_flFrame"?: number;
	readonly "m_flFrameRate"?: number;
	readonly "m_flHDRColorScale"?: number;
	readonly "m_fSpeed"?: number;
	readonly "m_fStartFrame"?: number;
	readonly "m_fWidth"?: number;
	readonly "m_hAttachEntity"?: number[];
	readonly "m_hBaseMaterial"?: bigint;
	readonly "m_nAttachIndex"?: bigint[];
	readonly "m_nBeamFlags"?: number;
	readonly "m_nBeamType"?: bigint;
	readonly "m_nHaloIndex"?: bigint;
	readonly "m_nNumBeamEnts"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_vecEndPos"?: [number, number, number];
}

interface _CBodyComponentBaseAnimGraphOwn {
	readonly "m_animationController.m_flPlaybackRate"?: number;
	readonly "m_animationController.m_flSeqFixedCycle"?: number;
	readonly "m_animationController.m_flSeqStartTime"?: number;
	readonly "m_animationController.m_hGraphDefinitionAG2"?: bigint;
	readonly "m_animationController.m_hSequence"?: bigint;
	readonly "m_animationController.m_nAnimationAlgorithm"?: number;
	readonly "m_animationController.m_nAnimLoopMode"?: number;
	readonly "m_animationController.m_nSecondarySkeletonMasterCount"?: number;
	readonly "m_animationController.m_nSerializePoseRecipeAG2ActiveSlot"?: number;
	readonly "m_animationController.m_nSerializePoseRecipeVersionAG2"?: number;
	readonly "m_animationController.m_nServerGraphInstanceIteration"?: number;
	readonly "m_animationController.m_nServerSerializationContextIteration"?: number;
	readonly "m_animationController.m_primaryGraphId"?: bigint;
	readonly "m_animationController.m_SerializePoseRecipeAG2Dynamic"?: Uint8Array;
	readonly "m_animationController.m_SerializePoseRecipeAG2Slots"?: ReadonlyArray<{ readonly "m_topology"?: Uint8Array }>;
	readonly "m_animationController.m_vecExternalClipIds"?: BigUint64Array;
	readonly "m_animationController.m_vecExternalGraphIds"?: BigUint64Array;
	readonly "m_animationController.m_vecSecondarySkeletons"?: number[];
	readonly "m_animationController.m_vecSecondarySkeletonSlotIDs"?: string[];
	readonly "m_skeletonInstance.m_angRotation"?: [number, number, number];
	readonly "m_skeletonInstance.m_bUseParentRenderBounds"?: boolean;
	readonly "m_skeletonInstance.m_flScale"?: number;
	readonly "m_skeletonInstance.m_hierarchyAttachName"?: number;
	readonly "m_skeletonInstance.m_hParent"?: number;
	readonly "m_skeletonInstance.m_materialGroup"?: number;
	readonly "m_skeletonInstance.m_modelState.m_bClientClothCreationSuppressed"?: boolean;
	readonly "m_skeletonInstance.m_modelState.m_flRootBoneOffset_x"?: number;
	readonly "m_skeletonInstance.m_modelState.m_flRootBoneOffset_y"?: number;
	readonly "m_skeletonInstance.m_modelState.m_flRootBoneOffset_z"?: number;
	readonly "m_skeletonInstance.m_modelState.m_hModel"?: bigint;
	readonly "m_skeletonInstance.m_modelState.m_MeshGroupMask"?: bigint;
	readonly "m_skeletonInstance.m_modelState.m_nAnimStateNoInterpSerialNumber"?: number;
	readonly "m_skeletonInstance.m_modelState.m_nBodyGroupChoices"?: Int32Array;
	readonly "m_skeletonInstance.m_modelState.m_nIdealMotionType"?: number;
	readonly "m_skeletonInstance.m_modelState.m_nRootBoneOffsetResetSerialNumber"?: number;
	readonly "m_skeletonInstance.m_name"?: number;
	readonly "m_skeletonInstance.m_nHitboxSet"?: number;
	readonly "m_skeletonInstance.m_vecOrigin.m_cellX"?: number;
	readonly "m_skeletonInstance.m_vecOrigin.m_cellY"?: number;
	readonly "m_skeletonInstance.m_vecOrigin.m_cellZ"?: number;
	readonly "m_skeletonInstance.m_vecOrigin.m_nOutsideWorld"?: number;
	readonly "m_skeletonInstance.m_vecOrigin.m_vecX"?: number;
	readonly "m_skeletonInstance.m_vecOrigin.m_vecY"?: number;
	readonly "m_skeletonInstance.m_vecOrigin.m_vecZ"?: number;
}

interface _CBodyComponentBaseModelEntityOwn {
	readonly "m_skeletonInstance.m_angRotation"?: [number, number, number];
	readonly "m_skeletonInstance.m_bUseParentRenderBounds"?: boolean;
	readonly "m_skeletonInstance.m_flScale"?: number;
	readonly "m_skeletonInstance.m_hierarchyAttachName"?: number;
	readonly "m_skeletonInstance.m_hParent"?: number;
	readonly "m_skeletonInstance.m_materialGroup"?: number;
	readonly "m_skeletonInstance.m_modelState.m_bClientClothCreationSuppressed"?: boolean;
	readonly "m_skeletonInstance.m_modelState.m_flRootBoneOffset_x"?: number;
	readonly "m_skeletonInstance.m_modelState.m_flRootBoneOffset_y"?: number;
	readonly "m_skeletonInstance.m_modelState.m_flRootBoneOffset_z"?: number;
	readonly "m_skeletonInstance.m_modelState.m_hModel"?: bigint;
	readonly "m_skeletonInstance.m_modelState.m_MeshGroupMask"?: bigint;
	readonly "m_skeletonInstance.m_modelState.m_nAnimStateNoInterpSerialNumber"?: number;
	readonly "m_skeletonInstance.m_modelState.m_nBodyGroupChoices"?: Int32Array;
	readonly "m_skeletonInstance.m_modelState.m_nIdealMotionType"?: number;
	readonly "m_skeletonInstance.m_modelState.m_nRootBoneOffsetResetSerialNumber"?: number;
	readonly "m_skeletonInstance.m_name"?: number;
	readonly "m_skeletonInstance.m_nHitboxSet"?: number;
	readonly "m_skeletonInstance.m_vecOrigin.m_cellX"?: number;
	readonly "m_skeletonInstance.m_vecOrigin.m_cellY"?: number;
	readonly "m_skeletonInstance.m_vecOrigin.m_cellZ"?: number;
	readonly "m_skeletonInstance.m_vecOrigin.m_nOutsideWorld"?: number;
	readonly "m_skeletonInstance.m_vecOrigin.m_vecX"?: number;
	readonly "m_skeletonInstance.m_vecOrigin.m_vecY"?: number;
	readonly "m_skeletonInstance.m_vecOrigin.m_vecZ"?: number;
}

interface _CBodyComponentPointOwn {
	readonly "m_sceneNode.m_angRotation"?: [number, number, number];
	readonly "m_sceneNode.m_flScale"?: number;
	readonly "m_sceneNode.m_hierarchyAttachName"?: number;
	readonly "m_sceneNode.m_hParent"?: number;
	readonly "m_sceneNode.m_name"?: number;
	readonly "m_sceneNode.m_vecOrigin.m_cellX"?: number;
	readonly "m_sceneNode.m_vecOrigin.m_cellY"?: number;
	readonly "m_sceneNode.m_vecOrigin.m_cellZ"?: number;
	readonly "m_sceneNode.m_vecOrigin.m_nOutsideWorld"?: number;
	readonly "m_sceneNode.m_vecOrigin.m_vecX"?: number;
	readonly "m_sceneNode.m_vecOrigin.m_vecY"?: number;
	readonly "m_sceneNode.m_vecOrigin.m_vecZ"?: number;
}

interface _CBombTargetOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bBombPlantedHere"?: boolean;
	readonly "m_bDisabled"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_spawnflags"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CC4Own {
	readonly "m_AttributeManager.m_hOuter"?: number;
	readonly "m_AttributeManager.m_iReapplyProvisionParity"?: number;
	readonly "m_AttributeManager.m_Item.m_AttributeList.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_AttributeManager.m_Item.m_bInitialized"?: boolean;
	readonly "m_AttributeManager.m_Item.m_iAccountID"?: number;
	readonly "m_AttributeManager.m_Item.m_iEntityLevel"?: number;
	readonly "m_AttributeManager.m_Item.m_iEntityQuality"?: number;
	readonly "m_AttributeManager.m_Item.m_iInventoryPosition"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemDefinitionIndex"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemIDHigh"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemIDLow"?: number;
	readonly "m_AttributeManager.m_Item.m_NetworkedDynamicAttributes.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_AttributeManager.m_Item.m_szCustomName"?: string;
	readonly "m_AttributeManager.m_ProviderType"?: number;
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bBombPlacedAnimation"?: boolean;
	readonly "m_bBurstMode"?: boolean;
	readonly "m_bCanBePickedUp"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bDroppedNearBuyZone"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bInReload"?: boolean;
	readonly "m_bInspectPending"?: boolean;
	readonly "m_bInspectShouldLoop"?: boolean;
	readonly "m_bIsHauledBack"?: boolean;
	readonly "m_bIsPlantingViaUse"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bSilencerOn"?: boolean;
	readonly "m_bStartedArming"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_bWasActiveWeaponWhenDropped"?: boolean;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_entitySpottedState.m_bSpotted"?: boolean;
	readonly "m_entitySpottedState.m_bSpottedByMask"?: Uint32Array;
	readonly "m_fAccuracyPenalty"?: number;
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fArmedTime"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_fLastShotTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flDroppedAtTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flFallbackWear"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flInspectCancelCompleteTime"?: number;
	readonly "m_flLastShakeTime"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flNextPrimaryAttackTickRatio"?: number;
	readonly "m_flNextSecondaryAttackTickRatio"?: number;
	readonly "m_flPostponeFireReadyFrac"?: number;
	readonly "m_flRecoilIndex"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flTimeSilencerSwitchComplete"?: number;
	readonly "m_flWatTickOffset"?: number;
	readonly "m_flWeaponActionPlaybackRate"?: number;
	readonly "m_flWeaponGameplayAnimStateTimestamp"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_hPrevOwner"?: number;
	readonly "m_iClip1"?: number;
	readonly "m_iClip2"?: number;
	readonly "m_iIronSightMode"?: number;
	readonly "m_iMostRecentTeamNumber"?: number;
	readonly "m_iOriginalTeamNumber"?: number;
	readonly "m_iRecoilIndex"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_iWeaponGameplayAnimState"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nDeployTick"?: number;
	readonly "m_nDropTick"?: number;
	readonly "m_nextPrevOwnerUseTime"?: number;
	readonly "m_nFallbackPaintKit"?: number;
	readonly "m_nFallbackSeed"?: number;
	readonly "m_nFallbackStatTrak"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nNextPrimaryAttackTick"?: number;
	readonly "m_nNextSecondaryAttackTick"?: number;
	readonly "m_nNextThinkTick"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nPostponeFireReadyTicks"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_OriginalOwnerXuidHigh"?: number;
	readonly "m_OriginalOwnerXuidLow"?: number;
	readonly "m_pReserveAmmo"?: Int32Array;
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
	readonly "m_weaponMode"?: bigint;
}

interface _CChickenOwn {
	readonly "m_AttributeManager.m_hOuter"?: number;
	readonly "m_AttributeManager.m_iReapplyProvisionParity"?: number;
	readonly "m_AttributeManager.m_Item.m_AttributeList.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_AttributeManager.m_Item.m_bInitialized"?: boolean;
	readonly "m_AttributeManager.m_Item.m_iAccountID"?: number;
	readonly "m_AttributeManager.m_Item.m_iEntityLevel"?: number;
	readonly "m_AttributeManager.m_Item.m_iEntityQuality"?: number;
	readonly "m_AttributeManager.m_Item.m_iInventoryPosition"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemDefinitionIndex"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemIDHigh"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemIDLow"?: number;
	readonly "m_AttributeManager.m_Item.m_NetworkedDynamicAttributes.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_AttributeManager.m_Item.m_szCustomName"?: string;
	readonly "m_AttributeManager.m_ProviderType"?: number;
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bUseAnimGraph"?: boolean;
	readonly "m_bUseHitboxesForRenderBox"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_leader"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CCitadelSoundOpvarSetOBBOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iszOperatorName"?: string;
	readonly "m_iszOpvarName"?: string;
	readonly "m_iszStackName"?: string;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nAABBDirection"?: number;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vDistanceInnerMaxs"?: [number, number, number];
	readonly "m_vDistanceInnerMins"?: [number, number, number];
	readonly "m_vDistanceOuterMaxs"?: [number, number, number];
	readonly "m_vDistanceOuterMins"?: [number, number, number];
}

interface _CColorCorrectionOwn {
	readonly "m_bClientSide"?: boolean;
	readonly "m_bEnabled"?: boolean;
	readonly "m_bExclusive"?: boolean;
	readonly "m_bMaster"?: boolean;
	readonly "m_flCurWeight"?: number;
	readonly "m_flFadeInDuration"?: number;
	readonly "m_flFadeOutDuration"?: number;
	readonly "m_flMaxWeight"?: number;
	readonly "m_MaxFalloff"?: number;
	readonly "m_MinFalloff"?: number;
	readonly "m_netlookupFilename"?: string;
}

interface _CColorCorrectionVolumeOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bDisabled"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_FadeDuration"?: number;
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_lookupFilename"?: string;
	readonly "m_MaxWeight"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_spawnflags"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
	readonly "m_Weight"?: number;
}

interface _CCSCustomHudLayoutOwn {
	readonly "m_bObservable"?: boolean;
	readonly "m_globalLayoutState.m_bInputCaptureEnabled"?: boolean;
	readonly "m_globalLayoutState.m_vecDialogVariableStrings"?: ReadonlyArray<{ readonly "m_bIsSet"?: boolean; readonly "m_nDialogVariableIndex"?: number; readonly "m_nPanelIdIndex"?: number; readonly "m_sValue"?: string }>;
	readonly "m_globalLayoutState.m_vecHasClasses"?: ReadonlyArray<{ readonly "m_eClassStatus"?: number; readonly "m_nClassNameIndex"?: number; readonly "m_nPanelIdIndex"?: number }>;
	readonly "m_strLayout"?: string;
	readonly "m_vecClassNames"?: string[];
	readonly "m_vecDialogVariableNames"?: string[];
	readonly "m_vecPanelIds"?: string[];
	readonly "m_vecPlayerLayoutStates"?: ReadonlyArray<{ readonly "m_bInputCaptureEnabled"?: boolean; readonly "m_bIsSet"?: boolean; readonly "m_eClassStatus"?: number; readonly "m_nClassNameIndex"?: number; readonly "m_nDialogVariableIndex"?: number; readonly "m_nPanelIdIndex"?: number; readonly "m_sValue"?: string }>;
}

interface _CCSCustomHudLayoutStateOwn {
	readonly "m_bInputCaptureEnabled"?: boolean;
	readonly "m_vecDialogVariableStrings"?: ReadonlyArray<{ readonly "m_bIsSet"?: boolean; readonly "m_nDialogVariableIndex"?: number; readonly "m_nPanelIdIndex"?: number; readonly "m_sValue"?: string }>;
	readonly "m_vecHasClasses"?: ReadonlyArray<{ readonly "m_eClassStatus"?: number; readonly "m_nClassNameIndex"?: number; readonly "m_nPanelIdIndex"?: number }>;
}

interface _CCSCustomPlayerCameraOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bClipCameraOffset"?: boolean;
	readonly "m_bFollowEyes"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCameraOffsetReturnStrength"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hFollowEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_hPawn"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nCameraMode"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecCameraOffset"?: [number, number, number];
	readonly "m_vecFollowOffset"?: [number, number, number];
}

interface _CCSGameModeRules_ArmsRaceOwn {
	readonly "m_WeaponSequence"?: string[];
}

interface _CCSGameModeRules_DeathmatchOwn {
	readonly "m_flDMBonusStartTime"?: number;
	readonly "m_flDMBonusTimeLength"?: number;
	readonly "m_sDMBonusWeapon"?: string;
}

interface _CCSGameRulesOwn {
	readonly "m_arrProhibitedItemIndices"?: Uint16Array;
	readonly "m_arrTournamentActiveCasterAccounts"?: Uint32Array;
	readonly "m_bAnyHostageReached"?: boolean;
	readonly "m_bBombDropped"?: boolean;
	readonly "m_bBombPlanted"?: boolean;
	readonly "m_bCTCantBuy"?: boolean;
	readonly "m_bCTTimeOutActive"?: boolean;
	readonly "m_bFreezePeriod"?: boolean;
	readonly "m_bGamePaused"?: boolean;
	readonly "m_bGameRestart"?: boolean;
	readonly "m_bHasMatchStarted"?: boolean;
	readonly "m_bIsDroppingItems"?: boolean;
	readonly "m_bIsHltvActive"?: boolean;
	readonly "m_bIsQuestEligible"?: boolean;
	readonly "m_bIsQueuedMatchmaking"?: boolean;
	readonly "m_bIsValveDS"?: boolean;
	readonly "m_bLogoMap"?: boolean;
	readonly "m_bMapHasBombTarget"?: boolean;
	readonly "m_bMapHasBuyZone"?: boolean;
	readonly "m_bMapHasRescueZone"?: boolean;
	readonly "m_bMatchWaitingForResume"?: boolean;
	readonly "m_bPlayAllStepSoundsOnServer"?: boolean;
	readonly "m_bRoundEndNoMusic"?: boolean;
	readonly "m_bRoundEndShowTimerDefend"?: boolean;
	readonly "m_bTCantBuy"?: boolean;
	readonly "m_bTeamIntroPeriod"?: boolean;
	readonly "m_bTechnicalTimeOut"?: boolean;
	readonly "m_bTerroristTimeOutActive"?: boolean;
	readonly "m_bWarmupPeriod"?: boolean;
	readonly "m_eRoundEndReason"?: number;
	readonly "m_eRoundWinReason"?: number;
	readonly "m_flCMMItemDropRevealEndTime"?: number;
	readonly "m_flCMMItemDropRevealStartTime"?: number;
	readonly "m_flCTTimeOutRemaining"?: number;
	readonly "m_flGameStartTime"?: number;
	readonly "m_flNextRespawnWave"?: number[];
	readonly "m_flRestartRoundTime"?: number;
	readonly "m_flTerroristTimeOutRemaining"?: number;
	readonly "m_fMatchStartTime"?: number;
	readonly "m_fRoundStartTime"?: number;
	readonly "m_fWarmupPeriodEnd"?: number;
	readonly "m_fWarmupPeriodStart"?: number;
	readonly "m_gamePhase"?: number;
	readonly "m_iFreezeTime"?: number;
	readonly "m_iHostagesRemaining"?: number;
	readonly "m_iMatchStats_PlayersAlive_CT"?: Int32Array;
	readonly "m_iMatchStats_PlayersAlive_T"?: Int32Array;
	readonly "m_iMatchStats_RoundResults"?: Int32Array;
	readonly "m_iNumConsecutiveCTLoses"?: number;
	readonly "m_iNumConsecutiveTerroristLoses"?: number;
	readonly "m_iRoundEndFunFactData1"?: number;
	readonly "m_iRoundEndFunFactData2"?: number;
	readonly "m_iRoundEndFunFactData3"?: number;
	readonly "m_iRoundEndFunFactPlayerSlot"?: number;
	readonly "m_iRoundEndLegacy"?: number;
	readonly "m_iRoundEndPlayerCount"?: number;
	readonly "m_iRoundEndTimerTime"?: number;
	readonly "m_iRoundEndWinnerTeam"?: number;
	readonly "m_iRoundStartRoundNumber"?: number;
	readonly "m_iRoundTime"?: number;
	readonly "m_iRoundWinStatus"?: number;
	readonly "m_iSpectatorSlotCount"?: number;
	readonly "m_MatchDevice"?: number;
	readonly "m_MinimapVerticalSectionHeights"?: Float32Array;
	readonly "m_nCTTeamIntroVariant"?: number;
	readonly "m_nCTTimeOuts"?: number;
	readonly "m_nEndMatchMapGroupVoteOptions"?: Int32Array;
	readonly "m_nEndMatchMapGroupVoteTypes"?: Int32Array;
	readonly "m_nEndMatchMapVoteWinner"?: number;
	readonly "m_nHalloweenMaskListSeed"?: number;
	readonly "m_nMatchAbortedEarlyReason"?: number;
	readonly "m_nMatchEndCount"?: number;
	readonly "m_nNextMapInMapgroup"?: number;
	readonly "m_nOvertimePlaying"?: number;
	readonly "m_nPauseStartTick"?: number;
	readonly "m_nQueuedMatchmakingMode"?: number;
	readonly "m_nRoundEndCount"?: number;
	readonly "m_nRoundsPlayedThisPhase"?: number;
	readonly "m_nRoundStartCount"?: number;
	readonly "m_nTerroristTimeOuts"?: number;
	readonly "m_nTotalPausedTicks"?: number;
	readonly "m_nTournamentPredictionsPct"?: number;
	readonly "m_nTTeamIntroVariant"?: number;
	readonly "m_numBestOfMaps"?: number;
	readonly "m_RetakeRules.m_bBlockersPresent"?: boolean;
	readonly "m_RetakeRules.m_bRoundInProgress"?: boolean;
	readonly "m_RetakeRules.m_hBombPlanter"?: number;
	readonly "m_RetakeRules.m_iBombSite"?: number;
	readonly "m_RetakeRules.m_iFirstSecondHalfRound"?: number;
	readonly "m_RetakeRules.m_nMatchSeed"?: number;
	readonly "m_sRoundEndFunFactToken"?: string;
	readonly "m_sRoundEndMessage"?: string;
	readonly "m_szMatchStatTxt"?: string;
	readonly "m_szTournamentEventName"?: string;
	readonly "m_szTournamentEventStage"?: string;
	readonly "m_szTournamentPredictionsTxt"?: string;
	readonly "m_TeamRespawnWaveTimes"?: Float32Array;
	readonly "m_timeUntilNextPhaseStarts"?: number;
	readonly "m_totalRoundsPlayed"?: number;
	readonly "m_vMinimapMaxs"?: [number, number, number];
	readonly "m_vMinimapMins"?: [number, number, number];
}

interface _CCSGO_TeamIntroCounterTerroristPositionOwn {
	readonly "m_agentItem.m_AttributeList.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_agentItem.m_bInitialized"?: boolean;
	readonly "m_agentItem.m_iAccountID"?: number;
	readonly "m_agentItem.m_iEntityLevel"?: number;
	readonly "m_agentItem.m_iEntityQuality"?: number;
	readonly "m_agentItem.m_iInventoryPosition"?: number;
	readonly "m_agentItem.m_iItemDefinitionIndex"?: number;
	readonly "m_agentItem.m_iItemIDHigh"?: number;
	readonly "m_agentItem.m_iItemIDLow"?: number;
	readonly "m_agentItem.m_NetworkedDynamicAttributes.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_agentItem.m_szCustomName"?: string;
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_glovesItem.m_AttributeList.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_glovesItem.m_bInitialized"?: boolean;
	readonly "m_glovesItem.m_iAccountID"?: number;
	readonly "m_glovesItem.m_iEntityLevel"?: number;
	readonly "m_glovesItem.m_iEntityQuality"?: number;
	readonly "m_glovesItem.m_iInventoryPosition"?: number;
	readonly "m_glovesItem.m_iItemDefinitionIndex"?: number;
	readonly "m_glovesItem.m_iItemIDHigh"?: number;
	readonly "m_glovesItem.m_iItemIDLow"?: number;
	readonly "m_glovesItem.m_NetworkedDynamicAttributes.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_glovesItem.m_szCustomName"?: string;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nOrdinal"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRandom"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_nVariant"?: number;
	readonly "m_sWeaponName"?: string;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_weaponItem.m_AttributeList.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_weaponItem.m_bInitialized"?: boolean;
	readonly "m_weaponItem.m_iAccountID"?: number;
	readonly "m_weaponItem.m_iEntityLevel"?: number;
	readonly "m_weaponItem.m_iEntityQuality"?: number;
	readonly "m_weaponItem.m_iInventoryPosition"?: number;
	readonly "m_weaponItem.m_iItemDefinitionIndex"?: number;
	readonly "m_weaponItem.m_iItemIDHigh"?: number;
	readonly "m_weaponItem.m_iItemIDLow"?: number;
	readonly "m_weaponItem.m_NetworkedDynamicAttributes.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_weaponItem.m_szCustomName"?: string;
	readonly "m_xuid"?: bigint;
}

interface _CCSObserver_CameraServicesOwn {
	readonly "m_audio.localBits"?: number;
	readonly "m_audio.localSound"?: [number, number, number][];
	readonly "m_audio.soundEventHash"?: number;
	readonly "m_audio.soundscapeEntityListIndex"?: number;
	readonly "m_audio.soundscapeIndex"?: number;
	readonly "m_flCsViewPunchAngleTickRatio"?: number;
	readonly "m_flFOVRate"?: number;
	readonly "m_flFOVTime"?: number;
	readonly "m_hColorCorrectionCtrl"?: number;
	readonly "m_hTonemapController"?: number;
	readonly "m_hViewEntity"?: number;
	readonly "m_hZoomOwner"?: number;
	readonly "m_iFOV"?: number;
	readonly "m_iFOVStart"?: number;
	readonly "m_nCsViewPunchAngleTick"?: number;
	readonly "m_PlayerFog.m_hCtrl"?: number;
	readonly "m_PostProcessingVolumes"?: number[];
	readonly "m_vecCsViewPunchAngle"?: [number, number, number];
}

interface _CCSObserver_MovementServicesOwn {
	readonly "m_arrForceSubtickMoveWhen"?: Float32Array;
	readonly "m_flMaxspeed"?: number;
	readonly "m_nToggleButtonDownMask"?: bigint;
}

interface _CCSObserver_ObserverServicesOwn {
	readonly "m_hObserverTarget"?: number;
	readonly "m_iObserverMode"?: number;
}

interface _CCSObserverPawnOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bHasMovedSinceSpawn"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_fFlags"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flDeathTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flFlashDuration"?: number;
	readonly "m_flFlashMaxAlpha"?: number;
	readonly "m_flFriction"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flProgressBarStartTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flTimeScale"?: number;
	readonly "m_flWaterLevel"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hController"?: number;
	readonly "m_hDefaultController"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hGroundEntity"?: number;
	readonly "m_hMyWearables"?: number[];
	readonly "m_hOriginalController"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iHealth"?: number;
	readonly "m_iHideHUD"?: number;
	readonly "m_iMaxHealth"?: number;
	readonly "m_iPlayerState"?: bigint;
	readonly "m_iProgressBarDuration"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_lifeState"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nGroundBodyIndex"?: number;
	readonly "m_nNextThinkTick"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_ServerViewAngleChanges"?: ReadonlyArray<{ readonly "nIndex"?: number; readonly "nType"?: number; readonly "qAngle"?: [number, number, number] }>;
	readonly "m_skybox3d.bClip3DSkyBoxNearToWorldFar"?: boolean;
	readonly "m_skybox3d.flClip3DSkyBoxNearToWorldFarOffset"?: number;
	readonly "m_skybox3d.fog.blend"?: boolean;
	readonly "m_skybox3d.fog.blendtobackground"?: number;
	readonly "m_skybox3d.fog.colorPrimary"?: number;
	readonly "m_skybox3d.fog.colorPrimaryLerpTo"?: number;
	readonly "m_skybox3d.fog.colorSecondary"?: number;
	readonly "m_skybox3d.fog.colorSecondaryLerpTo"?: number;
	readonly "m_skybox3d.fog.dirPrimary"?: [number, number, number];
	readonly "m_skybox3d.fog.duration"?: number;
	readonly "m_skybox3d.fog.enable"?: boolean;
	readonly "m_skybox3d.fog.end"?: number;
	readonly "m_skybox3d.fog.endLerpTo"?: number;
	readonly "m_skybox3d.fog.exponent"?: number;
	readonly "m_skybox3d.fog.farz"?: number;
	readonly "m_skybox3d.fog.HDRColorScale"?: number;
	readonly "m_skybox3d.fog.lerptime"?: number;
	readonly "m_skybox3d.fog.locallightscale"?: number;
	readonly "m_skybox3d.fog.maxdensity"?: number;
	readonly "m_skybox3d.fog.maxdensityLerpTo"?: number;
	readonly "m_skybox3d.fog.scattering"?: number;
	readonly "m_skybox3d.fog.skyboxFogFactor"?: number;
	readonly "m_skybox3d.fog.skyboxFogFactorLerpTo"?: number;
	readonly "m_skybox3d.fog.start"?: number;
	readonly "m_skybox3d.fog.startLerpTo"?: number;
	readonly "m_skybox3d.m_nWorldGroupID"?: number;
	readonly "m_skybox3d.origin"?: [number, number, number];
	readonly "m_skybox3d.scale"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecBaseVelocity"?: [number, number, number];
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
	readonly "m_vecVelocity.m_vecX"?: number;
	readonly "m_vecVelocity.m_vecY"?: number;
	readonly "m_vecVelocity.m_vecZ"?: number;
	readonly "m_vecViewOffset.m_vecX"?: number;
	readonly "m_vecViewOffset.m_vecY"?: number;
	readonly "m_vecViewOffset.m_vecZ"?: number;
}

interface _CCSPlayer_ActionTrackingServicesOwn {
	readonly "m_bIsRescuing"?: boolean;
	readonly "m_weaponPurchasesThisMatch.m_weaponPurchases"?: ReadonlyArray<{ readonly "m_nCount"?: number; readonly "m_nItemDefIndex"?: number }>;
	readonly "m_weaponPurchasesThisRound.m_weaponPurchases"?: ReadonlyArray<{ readonly "m_nCount"?: number; readonly "m_nItemDefIndex"?: number }>;
}

interface _CCSPlayer_AimPunchServicesOwn {
	readonly "m_predictableBaseAngle"?: [number, number, number];
	readonly "m_predictableBaseAngleVel"?: [number, number, number];
	readonly "m_predictableBaseTick"?: number;
	readonly "m_predictableBaseTickInterpAmount"?: number;
	readonly "m_unpredictableBaseAngle"?: [number, number, number];
	readonly "m_unpredictableBaseTick"?: number;
}

interface _CCSPlayer_BulletServicesOwn {
	readonly "m_totalHitsOnServer"?: number;
}

interface _CCSPlayer_BuyServicesOwn {
	readonly "m_vecSellbackPurchaseEntries"?: ReadonlyArray<{ readonly "m_bPrevHelmet"?: boolean; readonly "m_hItem"?: bigint; readonly "m_nCost"?: number; readonly "m_nPrevArmor"?: number; readonly "m_unDefIdx"?: number }>;
}

interface _CCSPlayer_HostageServicesOwn {
	readonly "m_hCarriedHostage"?: number;
	readonly "m_hCarriedHostageProp"?: number;
}

interface _CCSPlayer_ItemServicesOwn {
	readonly "m_bHasDefuser"?: boolean;
	readonly "m_bHasHelmet"?: boolean;
}

interface _CCSPlayer_MovementServicesOwn {
	readonly "m_arrForceSubtickMoveWhen"?: Float32Array;
	readonly "m_bDesiresDuck"?: boolean;
	readonly "m_bDucked"?: boolean;
	readonly "m_bDucking"?: boolean;
	readonly "m_bDuckOverride"?: boolean;
	readonly "m_bHasEverProcessedCommand"?: boolean;
	readonly "m_bJumpApexPending"?: boolean;
	readonly "m_bUseFrictionStashedSpeed"?: boolean;
	readonly "m_bUsingGroundTopologyOffset"?: boolean;
	readonly "m_flBombPlantViewOffset"?: number;
	readonly "m_flDuckAmount"?: number;
	readonly "m_flDuckRootOffset"?: number;
	readonly "m_flDuckSpeed"?: number;
	readonly "m_flDuckViewOffset"?: number;
	readonly "m_flFallVelocity"?: number;
	readonly "m_flFrictionStashedSpeed"?: number;
	readonly "m_flLastDuckTime"?: number;
	readonly "m_flLastJumpFrac"?: number;
	readonly "m_flLastJumpVelocityZ"?: number;
	readonly "m_flMaxspeed"?: number;
	readonly "m_flStamina"?: number;
	readonly "m_flUseFrictionStashedSpeedUntilFrac"?: number;
	readonly "m_flUsingGroundTopologyOffsetTransitionSmoothing"?: number;
	readonly "m_fStashGrenadeParameterWhen"?: number;
	readonly "m_LegacyJump.m_bOldJumpPressed"?: boolean;
	readonly "m_ModernJump.m_flLastActualJumpPressFrac"?: number;
	readonly "m_ModernJump.m_flLastLandedFrac"?: number;
	readonly "m_ModernJump.m_flLastLandedVelocityX"?: number;
	readonly "m_ModernJump.m_flLastLandedVelocityY"?: number;
	readonly "m_ModernJump.m_flLastLandedVelocityZ"?: number;
	readonly "m_ModernJump.m_flLastUsableJumpPressFrac"?: number;
	readonly "m_ModernJump.m_nLastActualJumpPressTick"?: number;
	readonly "m_ModernJump.m_nLastLandedTick"?: number;
	readonly "m_ModernJump.m_nLastUsableJumpPressTick"?: number;
	readonly "m_nGameCodeHasMovedPlayerAfterCommand"?: number;
	readonly "m_nLadderSurfacePropIndex"?: number;
	readonly "m_nLastJumpTick"?: number;
	readonly "m_nToggleButtonDownMask"?: bigint;
}

interface _CCSPlayer_PingServicesOwn {
	readonly "m_hPlayerPing"?: number;
}

interface _CCSPlayer_WeaponServicesOwn {
	readonly "m_bBlockInspectUntilNextGraphUpdate"?: boolean;
	readonly "m_flNextAttack"?: number;
	readonly "m_hActiveWeapon"?: number;
	readonly "m_hLastWeapon"?: number;
	readonly "m_hMyWeapons"?: number[];
	readonly "m_iAmmo"?: Uint16Array;
	readonly "m_networkAnimTiming"?: Uint8Array;
}

interface _CCSPlayerControllerOwn {
	readonly "m_bCanControlObservedBot"?: boolean;
	readonly "m_bControllingBot"?: boolean;
	readonly "m_bEverPlayedOnTeam"?: boolean;
	readonly "m_bFireBulletsSeedSynchronized"?: boolean;
	readonly "m_bHasCommunicationAbuseMute"?: boolean;
	readonly "m_bHasControlledBotThisRound"?: boolean;
	readonly "m_bKnownTeamMismatch"?: boolean;
	readonly "m_bMvpNoMusic"?: boolean;
	readonly "m_bNoClipEnabled"?: boolean;
	readonly "m_bPawnHasDefuser"?: boolean;
	readonly "m_bPawnHasHelmet"?: boolean;
	readonly "m_bPawnIsAlive"?: boolean;
	readonly "m_eMvpReason"?: number;
	readonly "m_fFlags"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flForceTeamTime"?: number;
	readonly "m_flFriction"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flTimeScale"?: number;
	readonly "m_hObserverPawn"?: number;
	readonly "m_hOriginalControllerOfCurrentPawn"?: number;
	readonly "m_hPawn"?: number;
	readonly "m_hPlayerPawn"?: number;
	readonly "m_iCoachingTeam"?: number;
	readonly "m_iCompetitiveRanking"?: number;
	readonly "m_iCompetitiveRankingPredicted_Loss"?: number;
	readonly "m_iCompetitiveRankingPredicted_Tie"?: number;
	readonly "m_iCompetitiveRankingPredicted_Win"?: number;
	readonly "m_iCompetitiveRankType"?: number;
	readonly "m_iCompetitiveWins"?: number;
	readonly "m_iCompTeammateColor"?: number;
	readonly "m_iConnected"?: number;
	readonly "m_iDesiredFOV"?: number;
	readonly "m_iMostConnected"?: number;
	readonly "m_iMusicKitID"?: number;
	readonly "m_iMusicKitMVPs"?: number;
	readonly "m_iMVPs"?: number;
	readonly "m_iPawnArmor"?: number;
	readonly "m_iPawnBotDifficulty"?: number;
	readonly "m_iPawnHealth"?: number;
	readonly "m_iPawnLifetimeEnd"?: number;
	readonly "m_iPawnLifetimeStart"?: number;
	readonly "m_iPendingTeamNum"?: number;
	readonly "m_iPing"?: number;
	readonly "m_iScore"?: number;
	readonly "m_iszPlayerName"?: string;
	readonly "m_iTeamNum"?: number;
	readonly "m_nDisconnectionTick"?: number;
	readonly "m_nEndMatchNextMapVote"?: number;
	readonly "m_nFirstKill"?: number;
	readonly "m_nKillCount"?: number;
	readonly "m_nNextThinkTick"?: number;
	readonly "m_nPawnCharacterDefIndex"?: number;
	readonly "m_nPlayerDominated"?: bigint;
	readonly "m_nPlayerDominatingMe"?: bigint;
	readonly "m_nQuestProgressReason"?: bigint;
	readonly "m_nTickBase"?: number;
	readonly "m_recentKillQueue"?: Uint8Array;
	readonly "m_rtActiveMissionPeriod"?: number;
	readonly "m_steamID"?: bigint;
	readonly "m_szClan"?: string;
	readonly "m_szCrosshairCodes"?: string;
	readonly "m_uiCommunicationMuteFlags"?: number;
	readonly "m_unActiveQuestId"?: number;
	readonly "m_unPlayerTvControlFlags"?: number;
	readonly "m_vecBaseVelocity"?: [number, number, number];
	readonly "m_vecVelocity.m_vecX"?: number;
	readonly "m_vecVelocity.m_vecY"?: number;
	readonly "m_vecVelocity.m_vecZ"?: number;
}

interface _CCSPlayerController_ActionTrackingServicesOwn {
	readonly "m_flTotalRoundDamageDealt"?: number;
	readonly "m_iNumRoundKills"?: number;
	readonly "m_iNumRoundKillsHeadshots"?: number;
	readonly "m_matchStats.m_iAssists"?: number;
	readonly "m_matchStats.m_iCashEarned"?: number;
	readonly "m_matchStats.m_iDamage"?: number;
	readonly "m_matchStats.m_iDeaths"?: number;
	readonly "m_matchStats.m_iEnemiesFlashed"?: number;
	readonly "m_matchStats.m_iEnemy3Ks"?: number;
	readonly "m_matchStats.m_iEnemy4Ks"?: number;
	readonly "m_matchStats.m_iEnemy5Ks"?: number;
	readonly "m_matchStats.m_iEnemyKnifeKills"?: number;
	readonly "m_matchStats.m_iEnemyTaserKills"?: number;
	readonly "m_matchStats.m_iEquipmentValue"?: number;
	readonly "m_matchStats.m_iHeadShotKills"?: number;
	readonly "m_matchStats.m_iKillReward"?: number;
	readonly "m_matchStats.m_iKills"?: number;
	readonly "m_matchStats.m_iLiveTime"?: number;
	readonly "m_matchStats.m_iMoneySaved"?: number;
	readonly "m_matchStats.m_iObjective"?: number;
	readonly "m_matchStats.m_iUtilityDamage"?: number;
	readonly "m_perRoundStats"?: ReadonlyArray<{ readonly "m_iAssists"?: number; readonly "m_iCashEarned"?: number; readonly "m_iDamage"?: number; readonly "m_iDeaths"?: number; readonly "m_iEnemiesFlashed"?: number; readonly "m_iEquipmentValue"?: number; readonly "m_iHeadShotKills"?: number; readonly "m_iKillReward"?: number; readonly "m_iKills"?: number; readonly "m_iLiveTime"?: number; readonly "m_iMoneySaved"?: number; readonly "m_iObjective"?: number; readonly "m_iUtilityDamage"?: number }>;
}

interface _CCSPlayerController_DamageServicesOwn {
	readonly "m_DamageList"?: ReadonlyArray<{ readonly "m_bIsOtherEnemy"?: boolean; readonly "m_DamagerXuid"?: bigint; readonly "m_flActualHealthRemoved"?: number; readonly "m_flDamage"?: number; readonly "m_hPlayerControllerDamager"?: number; readonly "m_hPlayerControllerRecipient"?: number; readonly "m_iLastBulletUpdate"?: number; readonly "m_iNumHits"?: number; readonly "m_killType"?: number; readonly "m_PlayerDamager"?: number; readonly "m_PlayerRecipient"?: number; readonly "m_RecipientXuid"?: bigint; readonly "m_szPlayerDamagerName"?: string; readonly "m_szPlayerRecipientName"?: string }>;
	readonly "m_nSendUpdate"?: number;
}

interface _CCSPlayerController_InGameMoneyServicesOwn {
	readonly "m_iAccount"?: number;
	readonly "m_iCashSpentThisRound"?: number;
	readonly "m_iStartAccount"?: number;
	readonly "m_iTotalCashSpent"?: number;
}

interface _CCSPlayerController_InventoryServicesOwn {
	readonly "m_nPersonaDataPublicCommendsFriendly"?: number;
	readonly "m_nPersonaDataPublicCommendsLeader"?: number;
	readonly "m_nPersonaDataPublicCommendsTeacher"?: number;
	readonly "m_nPersonaDataPublicLevel"?: number;
	readonly "m_nPersonaDataXpTrailLevel"?: number;
	readonly "m_rank"?: bigint[];
	readonly "m_unMusicID"?: number;
	readonly "m_vecServerAuthoritativeWeaponSlots"?: ReadonlyArray<{ readonly "unClass"?: number; readonly "unItemDefIdx"?: number; readonly "unSlot"?: number }>;
}

interface _CCSPlayerPawnOwn {
	readonly "m_angEyeAngles"?: [number, number, number];
	readonly "m_ArmorValue"?: number;
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bGunGameImmunity"?: boolean;
	readonly "m_bHasFemaleVoice"?: boolean;
	readonly "m_bHasMovedSinceSpawn"?: boolean;
	readonly "m_bInBombZone"?: boolean;
	readonly "m_bInBuyZone"?: boolean;
	readonly "m_bInHostageRescueZone"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bInNoDefuseArea"?: boolean;
	readonly "m_bIsBuyMenuOpen"?: boolean;
	readonly "m_bIsDefusing"?: boolean;
	readonly "m_bIsGrabbingHostage"?: boolean;
	readonly "m_bIsScoped"?: boolean;
	readonly "m_bIsWalking"?: boolean;
	readonly "m_bKilledByHeadshot"?: boolean;
	readonly "m_bLeftHanded"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollDamageHeadshot"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bResumeZoom"?: boolean;
	readonly "m_bRetakesHasDefuseKit"?: boolean;
	readonly "m_bRetakesMVPLastRound"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_bWaitForNoAttack"?: boolean;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_EconGloves.m_AttributeList.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_EconGloves.m_bInitialized"?: boolean;
	readonly "m_EconGloves.m_iAccountID"?: number;
	readonly "m_EconGloves.m_iEntityLevel"?: number;
	readonly "m_EconGloves.m_iEntityQuality"?: number;
	readonly "m_EconGloves.m_iInventoryPosition"?: number;
	readonly "m_EconGloves.m_iItemDefinitionIndex"?: number;
	readonly "m_EconGloves.m_iItemIDHigh"?: number;
	readonly "m_EconGloves.m_iItemIDLow"?: number;
	readonly "m_EconGloves.m_NetworkedDynamicAttributes.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_EconGloves.m_szCustomName"?: string;
	readonly "m_entitySpottedState.m_bSpotted"?: boolean;
	readonly "m_entitySpottedState.m_bSpottedByMask"?: Uint32Array;
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_fFlags"?: number;
	readonly "m_fImmuneToGunGameDamageTime"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flDeathTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flEmitSoundTime"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flFlashDuration"?: number;
	readonly "m_flFlashMaxAlpha"?: number;
	readonly "m_flFlinchStack"?: number;
	readonly "m_flFriction"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flHealthShotBoostExpirationTime"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flNextSprayDecalTime"?: number;
	readonly "m_flProgressBarStartTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flTimeOfLastInjury"?: number;
	readonly "m_flTimeScale"?: number;
	readonly "m_flVelocityModifier"?: number;
	readonly "m_flViewmodelFOV"?: number;
	readonly "m_flViewmodelOffsetX"?: number;
	readonly "m_flViewmodelOffsetY"?: number;
	readonly "m_flViewmodelOffsetZ"?: number;
	readonly "m_flWaterLevel"?: number;
	readonly "m_fMolotovDamageTime"?: number;
	readonly "m_fSwitchedHandednessTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_GunGameImmunityColor"?: number;
	readonly "m_hController"?: number;
	readonly "m_hDefaultController"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hGroundEntity"?: number;
	readonly "m_hMyWearables"?: number[];
	readonly "m_hOriginalController"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iBlockingUseActionInProgress"?: bigint;
	readonly "m_iHealth"?: number;
	readonly "m_iHideHUD"?: number;
	readonly "m_iMaxHealth"?: number;
	readonly "m_iPlayerState"?: bigint;
	readonly "m_iProgressBarDuration"?: number;
	readonly "m_iRetakesMVPBoostItem"?: number;
	readonly "m_iRetakesOffering"?: number;
	readonly "m_iRetakesOfferingCard"?: number;
	readonly "m_iShotsFired"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_lifeState"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nEconGlovesChanged"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nGroundBodyIndex"?: number;
	readonly "m_nLastKillerIndex"?: bigint;
	readonly "m_nNextThinkTick"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRagdollDamageBone"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_nWhichBombZone"?: number;
	readonly "m_qDeathEyeAngles"?: [number, number, number];
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_RetakesMVPBoostExtraUtility"?: number;
	readonly "m_ServerViewAngleChanges"?: ReadonlyArray<{ readonly "nIndex"?: number; readonly "nType"?: number; readonly "qAngle"?: [number, number, number] }>;
	readonly "m_skybox3d.bClip3DSkyBoxNearToWorldFar"?: boolean;
	readonly "m_skybox3d.flClip3DSkyBoxNearToWorldFarOffset"?: number;
	readonly "m_skybox3d.fog.blend"?: boolean;
	readonly "m_skybox3d.fog.blendtobackground"?: number;
	readonly "m_skybox3d.fog.colorPrimary"?: number;
	readonly "m_skybox3d.fog.colorPrimaryLerpTo"?: number;
	readonly "m_skybox3d.fog.colorSecondary"?: number;
	readonly "m_skybox3d.fog.colorSecondaryLerpTo"?: number;
	readonly "m_skybox3d.fog.dirPrimary"?: [number, number, number];
	readonly "m_skybox3d.fog.duration"?: number;
	readonly "m_skybox3d.fog.enable"?: boolean;
	readonly "m_skybox3d.fog.end"?: number;
	readonly "m_skybox3d.fog.endLerpTo"?: number;
	readonly "m_skybox3d.fog.exponent"?: number;
	readonly "m_skybox3d.fog.farz"?: number;
	readonly "m_skybox3d.fog.HDRColorScale"?: number;
	readonly "m_skybox3d.fog.lerptime"?: number;
	readonly "m_skybox3d.fog.locallightscale"?: number;
	readonly "m_skybox3d.fog.maxdensity"?: number;
	readonly "m_skybox3d.fog.maxdensityLerpTo"?: number;
	readonly "m_skybox3d.fog.scattering"?: number;
	readonly "m_skybox3d.fog.skyboxFogFactor"?: number;
	readonly "m_skybox3d.fog.skyboxFogFactorLerpTo"?: number;
	readonly "m_skybox3d.fog.start"?: number;
	readonly "m_skybox3d.fog.startLerpTo"?: number;
	readonly "m_skybox3d.m_nWorldGroupID"?: number;
	readonly "m_skybox3d.origin"?: [number, number, number];
	readonly "m_skybox3d.scale"?: number;
	readonly "m_szLastPlaceName"?: string;
	readonly "m_szRagdollDamageWeaponName"?: string;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_unCurrentEquipmentValue"?: number;
	readonly "m_unFreezetimeEndEquipmentValue"?: number;
	readonly "m_unRoundStartEquipmentValue"?: number;
	readonly "m_vecBaseVelocity"?: [number, number, number];
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecPlayerPatchEconIndices"?: Uint32Array;
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
	readonly "m_vecVelocity.m_vecX"?: number;
	readonly "m_vecVelocity.m_vecY"?: number;
	readonly "m_vecVelocity.m_vecZ"?: number;
	readonly "m_vecViewOffset.m_vecX"?: number;
	readonly "m_vecViewOffset.m_vecY"?: number;
	readonly "m_vecViewOffset.m_vecZ"?: number;
	readonly "m_vRagdollDamageForce"?: [number, number, number];
	readonly "m_vRagdollServerOrigin"?: [number, number, number];
}

interface _CCSPlayerResourceOwn {
	readonly "m_bEndMatchNextMapAllVoted"?: boolean;
	readonly "m_bHostageAlive"?: boolean[];
	readonly "m_bombsiteCenterA"?: [number, number, number];
	readonly "m_bombsiteCenterB"?: [number, number, number];
	readonly "m_hostageRescueX"?: Int32Array;
	readonly "m_hostageRescueY"?: Int32Array;
	readonly "m_hostageRescueZ"?: Int32Array;
	readonly "m_iHostageEntityIDs"?: bigint[];
	readonly "m_isHostageFollowingSomeone"?: boolean[];
}

interface _CCSTeamOwn {
	readonly "m_aPawns"?: number[];
	readonly "m_aPlayers"?: number[];
	readonly "m_bSurrendered"?: boolean;
	readonly "m_iClanID"?: number;
	readonly "m_iScore"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_numMapVictories"?: number;
	readonly "m_scoreFirstHalf"?: number;
	readonly "m_scoreOvertime"?: number;
	readonly "m_scoreSecondHalf"?: number;
	readonly "m_szClanTeamname"?: string;
	readonly "m_szTeamFlagImage"?: string;
	readonly "m_szTeamLogoImage"?: string;
	readonly "m_szTeamMatchStat"?: string;
	readonly "m_szTeamname"?: string;
}

interface _CCSWeaponBaseShotgunOwn {
	readonly "m_AttributeManager.m_hOuter"?: number;
	readonly "m_AttributeManager.m_iReapplyProvisionParity"?: number;
	readonly "m_AttributeManager.m_Item.m_AttributeList.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_AttributeManager.m_Item.m_bInitialized"?: boolean;
	readonly "m_AttributeManager.m_Item.m_iAccountID"?: number;
	readonly "m_AttributeManager.m_Item.m_iEntityLevel"?: number;
	readonly "m_AttributeManager.m_Item.m_iEntityQuality"?: number;
	readonly "m_AttributeManager.m_Item.m_iInventoryPosition"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemDefinitionIndex"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemIDHigh"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemIDLow"?: number;
	readonly "m_AttributeManager.m_Item.m_NetworkedDynamicAttributes.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_AttributeManager.m_Item.m_szCustomName"?: string;
	readonly "m_AttributeManager.m_ProviderType"?: number;
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bBurstMode"?: boolean;
	readonly "m_bCanBePickedUp"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bDroppedNearBuyZone"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bInReload"?: boolean;
	readonly "m_bInspectPending"?: boolean;
	readonly "m_bInspectShouldLoop"?: boolean;
	readonly "m_bIsHauledBack"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bSilencerOn"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_bWasActiveWeaponWhenDropped"?: boolean;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fAccuracyPenalty"?: number;
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_fLastShotTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flDroppedAtTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flFallbackWear"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flInspectCancelCompleteTime"?: number;
	readonly "m_flLastShakeTime"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flNextPrimaryAttackTickRatio"?: number;
	readonly "m_flNextSecondaryAttackTickRatio"?: number;
	readonly "m_flPostponeFireReadyFrac"?: number;
	readonly "m_flRecoilIndex"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flTimeSilencerSwitchComplete"?: number;
	readonly "m_flWatTickOffset"?: number;
	readonly "m_flWeaponActionPlaybackRate"?: number;
	readonly "m_flWeaponGameplayAnimStateTimestamp"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_hPrevOwner"?: number;
	readonly "m_iClip1"?: number;
	readonly "m_iClip2"?: number;
	readonly "m_iIronSightMode"?: number;
	readonly "m_iMostRecentTeamNumber"?: number;
	readonly "m_iOriginalTeamNumber"?: number;
	readonly "m_iRecoilIndex"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_iWeaponGameplayAnimState"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nDeployTick"?: number;
	readonly "m_nDropTick"?: number;
	readonly "m_nextPrevOwnerUseTime"?: number;
	readonly "m_nFallbackPaintKit"?: number;
	readonly "m_nFallbackSeed"?: number;
	readonly "m_nFallbackStatTrak"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nNextPrimaryAttackTick"?: number;
	readonly "m_nNextSecondaryAttackTick"?: number;
	readonly "m_nNextThinkTick"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nPostponeFireReadyTicks"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_OriginalOwnerXuidHigh"?: number;
	readonly "m_OriginalOwnerXuidLow"?: number;
	readonly "m_pReserveAmmo"?: Int32Array;
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
	readonly "m_weaponMode"?: bigint;
}

interface _CDamageRecordOwn {
	readonly "m_bIsOtherEnemy"?: boolean;
	readonly "m_DamagerXuid"?: bigint;
	readonly "m_flActualHealthRemoved"?: number;
	readonly "m_flDamage"?: number;
	readonly "m_hPlayerControllerDamager"?: number;
	readonly "m_hPlayerControllerRecipient"?: number;
	readonly "m_iLastBulletUpdate"?: number;
	readonly "m_iNumHits"?: number;
	readonly "m_killType"?: number;
	readonly "m_PlayerDamager"?: number;
	readonly "m_PlayerRecipient"?: number;
	readonly "m_RecipientXuid"?: bigint;
	readonly "m_szPlayerDamagerName"?: string;
	readonly "m_szPlayerRecipientName"?: string;
}

interface _CDecoyGrenadeOwn {
	readonly "m_AttributeManager.m_hOuter"?: number;
	readonly "m_AttributeManager.m_iReapplyProvisionParity"?: number;
	readonly "m_AttributeManager.m_Item.m_AttributeList.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_AttributeManager.m_Item.m_bInitialized"?: boolean;
	readonly "m_AttributeManager.m_Item.m_iAccountID"?: number;
	readonly "m_AttributeManager.m_Item.m_iEntityLevel"?: number;
	readonly "m_AttributeManager.m_Item.m_iEntityQuality"?: number;
	readonly "m_AttributeManager.m_Item.m_iInventoryPosition"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemDefinitionIndex"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemIDHigh"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemIDLow"?: number;
	readonly "m_AttributeManager.m_Item.m_NetworkedDynamicAttributes.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_AttributeManager.m_Item.m_szCustomName"?: string;
	readonly "m_AttributeManager.m_ProviderType"?: number;
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bBurstMode"?: boolean;
	readonly "m_bCanBePickedUp"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bDroppedNearBuyZone"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bInReload"?: boolean;
	readonly "m_bInspectPending"?: boolean;
	readonly "m_bInspectShouldLoop"?: boolean;
	readonly "m_bIsHauledBack"?: boolean;
	readonly "m_bIsHeldByPlayer"?: boolean;
	readonly "m_bJumpThrow"?: boolean;
	readonly "m_bJustPulledPin"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bPinPulled"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRedraw"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bSilencerOn"?: boolean;
	readonly "m_bThrowAnimating"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_bWasActiveWeaponWhenDropped"?: boolean;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fAccuracyPenalty"?: number;
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fDropTime"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_fLastShotTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flDroppedAtTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flFallbackWear"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flInspectCancelCompleteTime"?: number;
	readonly "m_flLastShakeTime"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flNextHoldFrac"?: number;
	readonly "m_flNextPrimaryAttackTickRatio"?: number;
	readonly "m_flNextSecondaryAttackTickRatio"?: number;
	readonly "m_flPostponeFireReadyFrac"?: number;
	readonly "m_flRecoilIndex"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flThrowStrength"?: number;
	readonly "m_flTimeSilencerSwitchComplete"?: number;
	readonly "m_flWatTickOffset"?: number;
	readonly "m_flWeaponActionPlaybackRate"?: number;
	readonly "m_flWeaponGameplayAnimStateTimestamp"?: number;
	readonly "m_fPinPullTime"?: number;
	readonly "m_fThrowTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_hPrevOwner"?: number;
	readonly "m_hSwitchToWeaponAfterThrow"?: number;
	readonly "m_iClip1"?: number;
	readonly "m_iClip2"?: number;
	readonly "m_iIronSightMode"?: number;
	readonly "m_iMostRecentTeamNumber"?: number;
	readonly "m_iOriginalTeamNumber"?: number;
	readonly "m_iRecoilIndex"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_iWeaponGameplayAnimState"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nDeployTick"?: number;
	readonly "m_nDropTick"?: number;
	readonly "m_nextPrevOwnerUseTime"?: number;
	readonly "m_nFallbackPaintKit"?: number;
	readonly "m_nFallbackSeed"?: number;
	readonly "m_nFallbackStatTrak"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nNextHoldTick"?: number;
	readonly "m_nNextPrimaryAttackTick"?: number;
	readonly "m_nNextSecondaryAttackTick"?: number;
	readonly "m_nNextThinkTick"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nPostponeFireReadyTicks"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_OriginalOwnerXuidHigh"?: number;
	readonly "m_OriginalOwnerXuidLow"?: number;
	readonly "m_pReserveAmmo"?: Int32Array;
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
	readonly "m_weaponMode"?: bigint;
}

interface _CDecoyProjectileOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bIsLive"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_DmgRadius"?: number;
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_fFlags"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flDamage"?: number;
	readonly "m_flDetonateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_hThrower"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nBounces"?: number;
	readonly "m_nDecoyShotTick"?: number;
	readonly "m_nExplodeEffectIndex"?: bigint;
	readonly "m_nExplodeEffectTickBegin"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecExplodeEffectOrigin"?: [number, number, number];
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
	readonly "m_vecVelocity.m_vecX"?: number;
	readonly "m_vecVelocity.m_vecY"?: number;
	readonly "m_vecVelocity.m_vecZ"?: number;
	readonly "m_vInitialPosition"?: [number, number, number];
	readonly "m_vInitialVelocity"?: [number, number, number];
}

interface _CDestructiblePartsComponentOwn {
	readonly "m_hOwner"?: number;
}

interface _CDynamicLightOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_Exponent"?: number;
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_Flags"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_InnerAngle"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_LightStyle"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_OuterAngle"?: number;
	readonly "m_Radius"?: number;
	readonly "m_SpotRadius"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CDynamicPropOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bUseAnimGraph"?: boolean;
	readonly "m_bUseHitboxesForRenderBox"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CEconEntityOwn {
	readonly "m_AttributeManager.m_hOuter"?: number;
	readonly "m_AttributeManager.m_iReapplyProvisionParity"?: number;
	readonly "m_AttributeManager.m_Item.m_AttributeList.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_AttributeManager.m_Item.m_bInitialized"?: boolean;
	readonly "m_AttributeManager.m_Item.m_iAccountID"?: number;
	readonly "m_AttributeManager.m_Item.m_iEntityLevel"?: number;
	readonly "m_AttributeManager.m_Item.m_iEntityQuality"?: number;
	readonly "m_AttributeManager.m_Item.m_iInventoryPosition"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemDefinitionIndex"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemIDHigh"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemIDLow"?: number;
	readonly "m_AttributeManager.m_Item.m_NetworkedDynamicAttributes.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_AttributeManager.m_Item.m_szCustomName"?: string;
	readonly "m_AttributeManager.m_ProviderType"?: number;
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flFallbackWear"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nFallbackPaintKit"?: number;
	readonly "m_nFallbackSeed"?: number;
	readonly "m_nFallbackStatTrak"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_OriginalOwnerXuidHigh"?: number;
	readonly "m_OriginalOwnerXuidLow"?: number;
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CEconItemAttributeOwn {
	readonly "m_bSetBonus"?: boolean;
	readonly "m_flInitialValue"?: number;
	readonly "m_iAttributeDefinitionIndex"?: number;
	readonly "m_iRawValue32"?: number;
	readonly "m_nRefundableCurrency"?: number;
}

interface _CEntityDissolveOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeInLength"?: number;
	readonly "m_flFadeInStart"?: number;
	readonly "m_flFadeOutLength"?: number;
	readonly "m_flFadeOutModelLength"?: number;
	readonly "m_flFadeOutModelStart"?: number;
	readonly "m_flFadeOutStart"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flStartTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nDissolveType"?: number;
	readonly "m_nMagnitude"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vDissolverOrigin"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CEntityFlameOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bCheapEffect"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hEntAttached"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
}

interface _CEntityIdentityOwn {
	readonly "m_nameStringTableIndex"?: number;
}

interface _CEnvCombinedLightProbeVolumeOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_Entity_bCustomCubemapTexture"?: boolean;
	readonly "m_Entity_bEnabled"?: boolean;
	readonly "m_Entity_bMoveable"?: boolean;
	readonly "m_Entity_bStartDisabled"?: boolean;
	readonly "m_Entity_Color"?: number;
	readonly "m_Entity_flBrightness"?: number;
	readonly "m_Entity_flEdgeFadeDist"?: number;
	readonly "m_Entity_hCubemapTexture"?: bigint;
	readonly "m_Entity_hLightProbeDirectLightIndicesTexture"?: bigint;
	readonly "m_Entity_hLightProbeDirectLightScalarsTexture"?: bigint;
	readonly "m_Entity_hLightProbeDirectLightShadowsTexture"?: bigint;
	readonly "m_Entity_hLightProbeTexture_AmbientCube"?: bigint;
	readonly "m_Entity_hLightProbeTexture_SDF"?: bigint;
	readonly "m_Entity_hLightProbeTexture_SH2_B"?: bigint;
	readonly "m_Entity_hLightProbeTexture_SH2_DC"?: bigint;
	readonly "m_Entity_hLightProbeTexture_SH2_G"?: bigint;
	readonly "m_Entity_hLightProbeTexture_SH2_R"?: bigint;
	readonly "m_Entity_nEnvCubeMapArrayIndex"?: number;
	readonly "m_Entity_nHandshake"?: number;
	readonly "m_Entity_nLightProbeAtlasX"?: number;
	readonly "m_Entity_nLightProbeAtlasY"?: number;
	readonly "m_Entity_nLightProbeAtlasZ"?: number;
	readonly "m_Entity_nLightProbeSizeX"?: number;
	readonly "m_Entity_nLightProbeSizeY"?: number;
	readonly "m_Entity_nLightProbeSizeZ"?: number;
	readonly "m_Entity_nPriority"?: number;
	readonly "m_Entity_vBoxMaxs"?: [number, number, number];
	readonly "m_Entity_vBoxMins"?: [number, number, number];
	readonly "m_Entity_vEdgeFadeDists"?: [number, number, number];
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
}

interface _CEnvCubemapOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_Entity_bCopyDiffuseFromDefaultCubemap"?: boolean;
	readonly "m_Entity_bCustomCubemapTexture"?: boolean;
	readonly "m_Entity_bDefaultEnvMap"?: boolean;
	readonly "m_Entity_bDefaultSpecEnvMap"?: boolean;
	readonly "m_Entity_bEnabled"?: boolean;
	readonly "m_Entity_bIndoorCubeMap"?: boolean;
	readonly "m_Entity_bMoveable"?: boolean;
	readonly "m_Entity_bStartDisabled"?: boolean;
	readonly "m_Entity_flDiffuseScale"?: number;
	readonly "m_Entity_flEdgeFadeDist"?: number;
	readonly "m_Entity_flInfluenceRadius"?: number;
	readonly "m_Entity_hCubemapTexture"?: bigint;
	readonly "m_Entity_nEnvCubeMapArrayIndex"?: number;
	readonly "m_Entity_nHandshake"?: number;
	readonly "m_Entity_nPriority"?: number;
	readonly "m_Entity_vBoxProjectMaxs"?: [number, number, number];
	readonly "m_Entity_vBoxProjectMins"?: [number, number, number];
	readonly "m_Entity_vEdgeFadeDists"?: [number, number, number];
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
}

interface _CEnvCubemapFogOwn {
	readonly "m_bActive"?: boolean;
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bHasHeightFogEnd"?: boolean;
	readonly "m_bHeightFogEnabled"?: boolean;
	readonly "m_bStartDisabled"?: boolean;
	readonly "m_DistanceFogCurveString"?: string;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flEndDistance"?: number;
	readonly "m_flFogFalloffExponent"?: number;
	readonly "m_flFogHeightEnd"?: number;
	readonly "m_flFogHeightExponent"?: number;
	readonly "m_flFogHeightStart"?: number;
	readonly "m_flFogHeightWidth"?: number;
	readonly "m_flFogMaxOpacity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flLODBias"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flStartDistance"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_HeightFogCurveString"?: string;
	readonly "m_hFogCubemapTexture"?: bigint;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_hSkyMaterial"?: bigint;
	readonly "m_iszSkyEntity"?: string;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nCubemapSourceType"?: number;
	readonly "m_nDistanceFogType"?: number;
	readonly "m_nFogHeightBlendMode"?: number;
	readonly "m_nFogHeightCoordinateSpace"?: number;
	readonly "m_nHeightFogType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
}

interface _CEnvDecalOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bProjectOnCharacters"?: boolean;
	readonly "m_bProjectOnWater"?: boolean;
	readonly "m_bProjectOnWorld"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flDepth"?: number;
	readonly "m_flDepthSortBias"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flHeight"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flWidth"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hDecalMaterial"?: bigint;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nRenderOrder"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CEnvDetailControllerOwn {
	readonly "m_flFadeEndDist"?: number;
	readonly "m_flFadeStartDist"?: number;
}

interface _CEnvLightProbeVolumeOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_Entity_bEnabled"?: boolean;
	readonly "m_Entity_bMoveable"?: boolean;
	readonly "m_Entity_bStartDisabled"?: boolean;
	readonly "m_Entity_hLightProbeDirectLightIndicesTexture"?: bigint;
	readonly "m_Entity_hLightProbeDirectLightScalarsTexture"?: bigint;
	readonly "m_Entity_hLightProbeDirectLightShadowsTexture"?: bigint;
	readonly "m_Entity_hLightProbeTexture_AmbientCube"?: bigint;
	readonly "m_Entity_hLightProbeTexture_SDF"?: bigint;
	readonly "m_Entity_hLightProbeTexture_SH2_B"?: bigint;
	readonly "m_Entity_hLightProbeTexture_SH2_DC"?: bigint;
	readonly "m_Entity_hLightProbeTexture_SH2_G"?: bigint;
	readonly "m_Entity_hLightProbeTexture_SH2_R"?: bigint;
	readonly "m_Entity_nHandshake"?: number;
	readonly "m_Entity_nLightProbeAtlasX"?: number;
	readonly "m_Entity_nLightProbeAtlasY"?: number;
	readonly "m_Entity_nLightProbeAtlasZ"?: number;
	readonly "m_Entity_nLightProbeSizeX"?: number;
	readonly "m_Entity_nLightProbeSizeY"?: number;
	readonly "m_Entity_nLightProbeSizeZ"?: number;
	readonly "m_Entity_nPriority"?: number;
	readonly "m_Entity_vBoxMaxs"?: [number, number, number];
	readonly "m_Entity_vBoxMins"?: [number, number, number];
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
}

interface _CEnvParticleGlowOwn {
	readonly "m_bActive"?: boolean;
	readonly "m_bAnimateDuringGameplayPause"?: boolean;
	readonly "m_bDataStringLocalized"?: boolean;
	readonly "m_bFrozen"?: boolean;
	readonly "m_bNoFreeze"?: boolean;
	readonly "m_bNoRamp"?: boolean;
	readonly "m_bNoSave"?: boolean;
	readonly "m_ColorTint"?: number;
	readonly "m_flAlphaScale"?: number;
	readonly "m_flFreezeTransitionDuration"?: number;
	readonly "m_flPreSimTime"?: number;
	readonly "m_flRadiusScale"?: number;
	readonly "m_flSelfIllumScale"?: number;
	readonly "m_flStartTime"?: number;
	readonly "m_hControlPointEnts"?: number[];
	readonly "m_hOwnerEntity"?: number;
	readonly "m_hTextureOverride"?: bigint;
	readonly "m_iEffectIndex"?: bigint;
	readonly "m_iServerControlPointAssignments"?: Uint8Array;
	readonly "m_nStopType"?: number;
	readonly "m_strDataString"?: string;
	readonly "m_szSnapshotFileName"?: string;
	readonly "m_vServerControlPoints"?: [number, number, number][];
}

interface _CEnvSkyOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bEnabled"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bStartDisabled"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flBrightnessScale"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flFogMaxEnd"?: number;
	readonly "m_flFogMaxStart"?: number;
	readonly "m_flFogMinEnd"?: number;
	readonly "m_flFogMinStart"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_hSkyMaterial"?: bigint;
	readonly "m_hSkyMaterialLightingOnly"?: bigint;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nFogType"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
	readonly "m_vTintColor"?: number;
	readonly "m_vTintColorLightingOnly"?: number;
}

interface _CEnvVolumetricFogControllerOwn {
	readonly "m_bActive"?: boolean;
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bEnableIndirect"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bIsMaster"?: boolean;
	readonly "m_bStartDisabled"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_fFirstVolumeSliceThickness"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flAnisotropy"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flDefaultAnisotropy"?: number;
	readonly "m_flDefaultDrawDistance"?: number;
	readonly "m_flDefaultScattering"?: number;
	readonly "m_flDrawDistance"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeInEnd"?: number;
	readonly "m_flFadeInStart"?: number;
	readonly "m_flFadeSpeed"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flIndirectStrength"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flScattering"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flStartAnisoTime"?: number;
	readonly "m_flStartAnisotropy"?: number;
	readonly "m_flStartDrawDistance"?: number;
	readonly "m_flStartDrawDistanceTime"?: number;
	readonly "m_flStartScattering"?: number;
	readonly "m_flStartScatterTime"?: number;
	readonly "m_fNoiseSpeed"?: number;
	readonly "m_fNoiseStrength"?: number;
	readonly "m_fWindSpeed"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hFogIndirectTexture"?: bigint;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nForceRefreshCount"?: number;
	readonly "m_nIndirectTextureDimX"?: number;
	readonly "m_nIndirectTextureDimY"?: number;
	readonly "m_nIndirectTextureDimZ"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_nVolumeDepth"?: number;
	readonly "m_TintColor"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vBoxMaxs"?: [number, number, number];
	readonly "m_vBoxMins"?: [number, number, number];
	readonly "m_vNoiseScale"?: [number, number, number];
	readonly "m_vWindDirection"?: [number, number, number];
}

interface _CEnvVolumetricFogVolumeOwn {
	readonly "m_bActive"?: boolean;
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bIndirectUseLPVs"?: boolean;
	readonly "m_bOverrideIndirectLightStrength"?: boolean;
	readonly "m_bOverrideNoiseStrength"?: boolean;
	readonly "m_bOverrideSunLightStrength"?: boolean;
	readonly "m_bOverrideTintColor"?: boolean;
	readonly "m_bStartDisabled"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_fHeightFogEdgeWidth"?: number;
	readonly "m_fIndirectLightStrength"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFalloffExponent"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flHeightFogDepth"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flStrength"?: number;
	readonly "m_fNoiseStrength"?: number;
	readonly "m_fSunLightStrength"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nFalloffShape"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_TintColor"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vBoxMaxs"?: [number, number, number];
	readonly "m_vBoxMins"?: [number, number, number];
}

interface _CEnvWindOwn {
	readonly "m_EnvWindShared.m_flGustDuration"?: number;
	readonly "m_EnvWindShared.m_flInitialWindSpeed"?: number;
	readonly "m_EnvWindShared.m_flMaxGustDelay"?: number;
	readonly "m_EnvWindShared.m_flMinGustDelay"?: number;
	readonly "m_EnvWindShared.m_flStartTime"?: number;
	readonly "m_EnvWindShared.m_iGustDirChange"?: number;
	readonly "m_EnvWindShared.m_iInitialWindDir"?: number;
	readonly "m_EnvWindShared.m_iMaxGust"?: number;
	readonly "m_EnvWindShared.m_iMaxWind"?: number;
	readonly "m_EnvWindShared.m_iMinGust"?: number;
	readonly "m_EnvWindShared.m_iMinWind"?: number;
	readonly "m_EnvWindShared.m_iWindSeed"?: number;
	readonly "m_EnvWindShared.m_location"?: [number, number, number];
	readonly "m_EnvWindShared.m_windRadius"?: number;
}

interface _CEnvWindControllerOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bIsMaster"?: boolean;
	readonly "m_EnvWindShared.m_flGustDuration"?: number;
	readonly "m_EnvWindShared.m_flInitialWindSpeed"?: number;
	readonly "m_EnvWindShared.m_flMaxGustDelay"?: number;
	readonly "m_EnvWindShared.m_flMinGustDelay"?: number;
	readonly "m_EnvWindShared.m_flStartTime"?: number;
	readonly "m_EnvWindShared.m_iGustDirChange"?: number;
	readonly "m_EnvWindShared.m_iInitialWindDir"?: number;
	readonly "m_EnvWindShared.m_iMaxGust"?: number;
	readonly "m_EnvWindShared.m_iMaxWind"?: number;
	readonly "m_EnvWindShared.m_iMinGust"?: number;
	readonly "m_EnvWindShared.m_iMinWind"?: number;
	readonly "m_EnvWindShared.m_iWindSeed"?: number;
	readonly "m_EnvWindShared.m_location"?: [number, number, number];
	readonly "m_EnvWindShared.m_windRadius"?: number;
	readonly "m_fDirectionVariation"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_fSpeedVariation"?: number;
	readonly "m_fTurbulence"?: number;
	readonly "m_fVolumeHalfExtentXY"?: number;
	readonly "m_fVolumeHalfExtentZ"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nClipmapLevels"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_nVolumeResolutionXY"?: number;
	readonly "m_nVolumeResolutionZ"?: number;
	readonly "m_ubInterpolationFrame"?: number;
}

interface _CEnvWindVolumeOwn {
	readonly "m_bActive"?: boolean;
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bStartDisabled"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_fWindDirectionVariationMultiplier"?: number;
	readonly "m_fWindSpeedMultiplier"?: number;
	readonly "m_fWindSpeedVariationMultiplier"?: number;
	readonly "m_fWindTurbulenceMultiplier"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nShape"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vBoxMaxs"?: [number, number, number];
	readonly "m_vBoxMins"?: [number, number, number];
}

interface _CFireCrackerBlastOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bFireIsBurning"?: boolean[];
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bInPostEffectTime"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_BurnNormal"?: [number, number, number][];
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_fireCount"?: number;
	readonly "m_fireParentPositions"?: [number, number, number][];
	readonly "m_firePositions"?: [number, number, number][];
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nFireEffectTickBegin"?: number;
	readonly "m_nFireLifetime"?: number;
	readonly "m_nInfernoType"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CFishOwn {
	readonly "m_angle"?: number;
	readonly "m_lifeState"?: number;
	readonly "m_poolOrigin"?: [number, number, number];
	readonly "m_waterLevel"?: number;
	readonly "m_x"?: number;
	readonly "m_y"?: number;
	readonly "m_z"?: number;
}

interface _CFogControllerOwn {
	readonly "m_fog.blend"?: boolean;
	readonly "m_fog.blendtobackground"?: number;
	readonly "m_fog.colorPrimary"?: number;
	readonly "m_fog.colorPrimaryLerpTo"?: number;
	readonly "m_fog.colorSecondary"?: number;
	readonly "m_fog.colorSecondaryLerpTo"?: number;
	readonly "m_fog.dirPrimary"?: [number, number, number];
	readonly "m_fog.duration"?: number;
	readonly "m_fog.enable"?: boolean;
	readonly "m_fog.end"?: number;
	readonly "m_fog.endLerpTo"?: number;
	readonly "m_fog.exponent"?: number;
	readonly "m_fog.farz"?: number;
	readonly "m_fog.HDRColorScale"?: number;
	readonly "m_fog.lerptime"?: number;
	readonly "m_fog.locallightscale"?: number;
	readonly "m_fog.maxdensity"?: number;
	readonly "m_fog.maxdensityLerpTo"?: number;
	readonly "m_fog.scattering"?: number;
	readonly "m_fog.skyboxFogFactor"?: number;
	readonly "m_fog.skyboxFogFactorLerpTo"?: number;
	readonly "m_fog.start"?: number;
	readonly "m_fog.startLerpTo"?: number;
}

interface _CFootstepControlOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bDisabled"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_destination"?: string;
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_source"?: string;
	readonly "m_spawnflags"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CFuncConveyorOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_fFlags"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flTargetSpeed"?: number;
	readonly "m_flTransitionStartSpeed"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hConveyorModels"?: number[];
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_nTransitionDurationTicks"?: number;
	readonly "m_nTransitionStartTick"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecMoveDirEntitySpace"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CFuncElectrifiedVolumeOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_EffectName"?: string;
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CFuncLadderOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bFakeLadder"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flAutoRideSpeed"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecLadderDir"?: [number, number, number];
	readonly "m_vecPlayerMountPositionBottom"?: [number, number, number];
	readonly "m_vecPlayerMountPositionTop"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CFuncMonitorOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bDraw3DSkybox"?: boolean;
	readonly "m_bEnabled"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRenderShadows"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_brushModelName"?: string;
	readonly "m_bUseUniqueColorTarget"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_hTargetCamera"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nResolutionEnum"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_targetCamera"?: string;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CFuncMoveLinearOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_fFlags"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
	readonly "m_vecVelocity.m_vecX"?: number;
	readonly "m_vecVelocity.m_vecY"?: number;
	readonly "m_vecVelocity.m_vecZ"?: number;
}

interface _CGradientFogOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bHeightFogEnabled"?: boolean;
	readonly "m_bIsEnabled"?: boolean;
	readonly "m_bStartDisabled"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeTime"?: number;
	readonly "m_flFarZ"?: number;
	readonly "m_flFogEndDistance"?: number;
	readonly "m_flFogEndHeight"?: number;
	readonly "m_flFogFalloffExponent"?: number;
	readonly "m_flFogMaxOpacity"?: number;
	readonly "m_flFogStartDistance"?: number;
	readonly "m_flFogStartHeight"?: number;
	readonly "m_flFogStrength"?: number;
	readonly "m_flFogVerticalExponent"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_fogColor"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hGradientFogTexture"?: bigint;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
}

interface _CHandleTestOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bSendHandle"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Handle"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
}

interface _CHostageOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bHandsHaveBeenCut"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_entitySpottedState.m_bSpotted"?: boolean;
	readonly "m_entitySpottedState.m_bSpottedByMask"?: Uint32Array;
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_fFlags"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flDropStartTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGrabSuccessTime"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flRescueStartTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hHostageGrabber"?: number;
	readonly "m_hMyWearables"?: number[];
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iHealth"?: number;
	readonly "m_iMaxHealth"?: number;
	readonly "m_isRescued"?: boolean;
	readonly "m_iTeamNum"?: number;
	readonly "m_jumpedThisFrame"?: boolean;
	readonly "m_leader"?: number;
	readonly "m_lifeState"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nHostageState"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_reuseTimer.m_duration"?: number;
	readonly "m_reuseTimer.m_nWorldGroupId"?: number;
	readonly "m_reuseTimer.m_timescale"?: number;
	readonly "m_reuseTimer.m_timestamp"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
	readonly "m_vecViewOffset.m_vecX"?: number;
	readonly "m_vecViewOffset.m_vecY"?: number;
	readonly "m_vecViewOffset.m_vecZ"?: number;
	readonly "m_vel"?: [number, number, number];
}

interface _CInfoFanOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_FanForceCurveString"?: string;
	readonly "m_fEffects"?: number;
	readonly "m_fFanForceMaxRadius"?: number;
	readonly "m_fFanForceMinRadius"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flCurveDistRange"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
}

interface _CInfoOffscreenPanoramaTextureOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bDisabled"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nResolutionX"?: number;
	readonly "m_nResolutionY"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_nTargetChangeCount"?: number;
	readonly "m_RenderAttrName"?: string;
	readonly "m_szLayoutFileName"?: string;
	readonly "m_szPanelType"?: string;
	readonly "m_TargetEntities"?: number[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecCSSClasses"?: string[];
}

interface _CInfoVisibilityBoxOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bEnabled"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nMode"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vBoxSize"?: [number, number, number];
}

interface _CInfoWorldLayerOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bEntitiesSpawned"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bWorldLayerVisible"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_layerName"?: string;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_worldName"?: string;
}

interface _CItem_HealthshotOwn {
	readonly "m_AttributeManager.m_hOuter"?: number;
	readonly "m_AttributeManager.m_iReapplyProvisionParity"?: number;
	readonly "m_AttributeManager.m_Item.m_AttributeList.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_AttributeManager.m_Item.m_bInitialized"?: boolean;
	readonly "m_AttributeManager.m_Item.m_iAccountID"?: number;
	readonly "m_AttributeManager.m_Item.m_iEntityLevel"?: number;
	readonly "m_AttributeManager.m_Item.m_iEntityQuality"?: number;
	readonly "m_AttributeManager.m_Item.m_iInventoryPosition"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemDefinitionIndex"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemIDHigh"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemIDLow"?: number;
	readonly "m_AttributeManager.m_Item.m_NetworkedDynamicAttributes.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_AttributeManager.m_Item.m_szCustomName"?: string;
	readonly "m_AttributeManager.m_ProviderType"?: number;
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bBurstMode"?: boolean;
	readonly "m_bCanBePickedUp"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bDroppedNearBuyZone"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bInReload"?: boolean;
	readonly "m_bInspectPending"?: boolean;
	readonly "m_bInspectShouldLoop"?: boolean;
	readonly "m_bIsHauledBack"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRedraw"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bSequenceInProgress"?: boolean;
	readonly "m_bSilencerOn"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_bWasActiveWeaponWhenDropped"?: boolean;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fAccuracyPenalty"?: number;
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_fLastShotTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flDroppedAtTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flFallbackWear"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flInspectCancelCompleteTime"?: number;
	readonly "m_flLastShakeTime"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flNextPrimaryAttackTickRatio"?: number;
	readonly "m_flNextSecondaryAttackTickRatio"?: number;
	readonly "m_flPostponeFireReadyFrac"?: number;
	readonly "m_flRecoilIndex"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flTimeSilencerSwitchComplete"?: number;
	readonly "m_flWatTickOffset"?: number;
	readonly "m_flWeaponActionPlaybackRate"?: number;
	readonly "m_flWeaponGameplayAnimStateTimestamp"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_hPrevOwner"?: number;
	readonly "m_iClip1"?: number;
	readonly "m_iClip2"?: number;
	readonly "m_iIronSightMode"?: number;
	readonly "m_iMostRecentTeamNumber"?: number;
	readonly "m_iOriginalTeamNumber"?: number;
	readonly "m_iRecoilIndex"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_iWeaponGameplayAnimState"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nDeployTick"?: number;
	readonly "m_nDropTick"?: number;
	readonly "m_nextPrevOwnerUseTime"?: number;
	readonly "m_nFallbackPaintKit"?: number;
	readonly "m_nFallbackSeed"?: number;
	readonly "m_nFallbackStatTrak"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nNextPrimaryAttackTick"?: number;
	readonly "m_nNextSecondaryAttackTick"?: number;
	readonly "m_nNextThinkTick"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nPostponeFireReadyTicks"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_OriginalOwnerXuidHigh"?: number;
	readonly "m_OriginalOwnerXuidLow"?: number;
	readonly "m_pReserveAmmo"?: Int32Array;
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
	readonly "m_weaponMode"?: bigint;
}

interface _CItemDogtagsOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_KillingPlayer"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_OwningPlayer"?: number;
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CKnifeOwn {
	readonly "m_AttributeManager.m_hOuter"?: number;
	readonly "m_AttributeManager.m_iReapplyProvisionParity"?: number;
	readonly "m_AttributeManager.m_Item.m_AttributeList.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_AttributeManager.m_Item.m_bInitialized"?: boolean;
	readonly "m_AttributeManager.m_Item.m_iAccountID"?: number;
	readonly "m_AttributeManager.m_Item.m_iEntityLevel"?: number;
	readonly "m_AttributeManager.m_Item.m_iEntityQuality"?: number;
	readonly "m_AttributeManager.m_Item.m_iInventoryPosition"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemDefinitionIndex"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemIDHigh"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemIDLow"?: number;
	readonly "m_AttributeManager.m_Item.m_NetworkedDynamicAttributes.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_AttributeManager.m_Item.m_szCustomName"?: string;
	readonly "m_AttributeManager.m_ProviderType"?: number;
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bBurstMode"?: boolean;
	readonly "m_bCanBePickedUp"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bDroppedNearBuyZone"?: boolean;
	readonly "m_bFirstAttack"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bInReload"?: boolean;
	readonly "m_bInspectPending"?: boolean;
	readonly "m_bInspectShouldLoop"?: boolean;
	readonly "m_bIsHauledBack"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bSilencerOn"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_bWasActiveWeaponWhenDropped"?: boolean;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fAccuracyPenalty"?: number;
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_fLastShotTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flDroppedAtTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flFallbackWear"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flInspectCancelCompleteTime"?: number;
	readonly "m_flLastShakeTime"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flNextPrimaryAttackTickRatio"?: number;
	readonly "m_flNextSecondaryAttackTickRatio"?: number;
	readonly "m_flPostponeFireReadyFrac"?: number;
	readonly "m_flRecoilIndex"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flTimeSilencerSwitchComplete"?: number;
	readonly "m_flWatTickOffset"?: number;
	readonly "m_flWeaponActionPlaybackRate"?: number;
	readonly "m_flWeaponGameplayAnimStateTimestamp"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_hPrevOwner"?: number;
	readonly "m_iClip1"?: number;
	readonly "m_iClip2"?: number;
	readonly "m_iIronSightMode"?: number;
	readonly "m_iMostRecentTeamNumber"?: number;
	readonly "m_iOriginalTeamNumber"?: number;
	readonly "m_iRecoilIndex"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_iWeaponGameplayAnimState"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nDeployTick"?: number;
	readonly "m_nDropTick"?: number;
	readonly "m_nextPrevOwnerUseTime"?: number;
	readonly "m_nFallbackPaintKit"?: number;
	readonly "m_nFallbackSeed"?: number;
	readonly "m_nFallbackStatTrak"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nNextPrimaryAttackTick"?: number;
	readonly "m_nNextSecondaryAttackTick"?: number;
	readonly "m_nNextThinkTick"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nPostponeFireReadyTicks"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_OriginalOwnerXuidHigh"?: number;
	readonly "m_OriginalOwnerXuidLow"?: number;
	readonly "m_pReserveAmmo"?: Int32Array;
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
	readonly "m_weaponMode"?: bigint;
}

interface _CLightComponentOwn {
	readonly "m_bAllowSSTGeneration"?: boolean;
	readonly "m_bEnabled"?: boolean;
	readonly "m_bFlicker"?: boolean;
	readonly "m_bMixedShadows"?: boolean;
	readonly "m_bPrecomputedFieldsValid"?: boolean;
	readonly "m_bRenderDiffuse"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bRenderTransmissive"?: boolean;
	readonly "m_bUseSecondaryColor"?: boolean;
	readonly "m_bUsesIndexedBakedLighting"?: boolean;
	readonly "m_Color"?: number;
	readonly "m_flAttenuation0"?: number;
	readonly "m_flAttenuation1"?: number;
	readonly "m_flAttenuation2"?: number;
	readonly "m_flBounceScale"?: number;
	readonly "m_flBrightness"?: number;
	readonly "m_flBrightnessMult"?: number;
	readonly "m_flBrightnessScale"?: number;
	readonly "m_flCapsuleLength"?: number;
	readonly "m_flFadeMaxDist"?: number;
	readonly "m_flFadeMinDist"?: number;
	readonly "m_flFalloff"?: number;
	readonly "m_flFogContributionStength"?: number;
	readonly "m_flLightStyleStartTime"?: number;
	readonly "m_flMinRoughness"?: number;
	readonly "m_flNearClipPlane"?: number;
	readonly "m_flOrthoLightHeight"?: number;
	readonly "m_flOrthoLightWidth"?: number;
	readonly "m_flPhi"?: number;
	readonly "m_flPrecomputedMaxRange"?: number;
	readonly "m_flRange"?: number;
	readonly "m_flShadowCascadeCrossFade"?: number;
	readonly "m_flShadowCascadeDistance0"?: number;
	readonly "m_flShadowCascadeDistance1"?: number;
	readonly "m_flShadowCascadeDistance2"?: number;
	readonly "m_flShadowCascadeDistance3"?: number;
	readonly "m_flShadowCascadeDistanceFade"?: number;
	readonly "m_flShadowFadeMaxDist"?: number;
	readonly "m_flShadowFadeMinDist"?: number;
	readonly "m_flSkyIntensity"?: number;
	readonly "m_flTheta"?: number;
	readonly "m_hLightCookie"?: bigint;
	readonly "m_nBakedShadowIndex"?: number;
	readonly "m_nBounceLight"?: number;
	readonly "m_nCascadeRenderStaticObjects"?: number;
	readonly "m_nCascades"?: number;
	readonly "m_nCastShadows"?: number;
	readonly "m_nDirectLight"?: number;
	readonly "m_nFogLightingMode"?: number;
	readonly "m_nLightMapUniqueId"?: number;
	readonly "m_nLightPathUniqueId"?: number;
	readonly "m_nRenderSpecular"?: number;
	readonly "m_nShadowCascadeResolution0"?: number;
	readonly "m_nShadowCascadeResolution1"?: number;
	readonly "m_nShadowCascadeResolution2"?: number;
	readonly "m_nShadowCascadeResolution3"?: number;
	readonly "m_nShadowHeight"?: number;
	readonly "m_nShadowPriority"?: number;
	readonly "m_nShadowWidth"?: number;
	readonly "m_nStyle"?: number;
	readonly "m_Pattern"?: string;
	readonly "m_SecondaryColor"?: number;
	readonly "m_SkyAmbientBounce"?: number;
	readonly "m_SkyColor"?: number;
	readonly "m_vPrecomputedBoundsMaxs"?: [number, number, number];
	readonly "m_vPrecomputedBoundsMins"?: [number, number, number];
	readonly "m_vPrecomputedOBBAngles"?: [number, number, number];
	readonly "m_vPrecomputedOBBExtent"?: [number, number, number];
	readonly "m_vPrecomputedOBBOrigin"?: [number, number, number];
}

interface _CMapVetoPickControllerOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nAccountIDs"?: Int32Array;
	readonly "m_nBloodType"?: number;
	readonly "m_nCurrentPhase"?: number;
	readonly "m_nDraftType"?: number;
	readonly "m_nMapId0"?: Int32Array;
	readonly "m_nMapId1"?: Int32Array;
	readonly "m_nMapId2"?: Int32Array;
	readonly "m_nMapId3"?: Int32Array;
	readonly "m_nMapId4"?: Int32Array;
	readonly "m_nMapId5"?: Int32Array;
	readonly "m_nPhaseDurationTicks"?: number;
	readonly "m_nPhaseStartTick"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nStartingSide0"?: Int32Array;
	readonly "m_nSubclassID"?: number;
	readonly "m_nTeamWinningCoinToss"?: number;
	readonly "m_nTeamWithFirstChoice"?: Int32Array;
	readonly "m_nVoteMapIdsList"?: Int32Array;
	readonly "m_ubInterpolationFrame"?: number;
}

interface _CMolotovProjectileOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bIsIncGrenade"?: boolean;
	readonly "m_bIsLive"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_DmgRadius"?: number;
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_fFlags"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flDamage"?: number;
	readonly "m_flDetonateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_hThrower"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nBounces"?: number;
	readonly "m_nExplodeEffectIndex"?: bigint;
	readonly "m_nExplodeEffectTickBegin"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecExplodeEffectOrigin"?: [number, number, number];
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
	readonly "m_vecVelocity.m_vecX"?: number;
	readonly "m_vecVelocity.m_vecY"?: number;
	readonly "m_vecVelocity.m_vecZ"?: number;
	readonly "m_vInitialPosition"?: [number, number, number];
	readonly "m_vInitialVelocity"?: [number, number, number];
}

interface _COmniLightOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bContactShadow"?: boolean;
	readonly "m_bEnabled"?: boolean;
	readonly "m_bForceShadowsEnabled"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bPrecomputedFieldsValid"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bShowLight"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_Color"?: number;
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fAlternateColorBrightness"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flBakeSpecularToCubemapsScale"?: number;
	readonly "m_flBounceScale"?: number;
	readonly "m_flBrightness"?: number;
	readonly "m_flBrightnessScale"?: number;
	readonly "m_flColorTemperature"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flFadeSizeEnd"?: number;
	readonly "m_flFadeSizeStart"?: number;
	readonly "m_flFogScale"?: number;
	readonly "m_flFogStrength"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flInnerAngle"?: number;
	readonly "m_flLightStyleStartTime"?: number;
	readonly "m_flLuminaireAnisotropy"?: number;
	readonly "m_flLuminaireSize"?: number;
	readonly "m_flMinRoughness"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flOuterAngle"?: number;
	readonly "m_flRange"?: number;
	readonly "m_flShadowFadeSizeEnd"?: number;
	readonly "m_flShadowFadeSizeStart"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flShape"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flSkirt"?: number;
	readonly "m_flSkirtNear"?: number;
	readonly "m_flSoftX"?: number;
	readonly "m_flSoftY"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hLightCookie"?: bigint;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_LightStyleEvents"?: string[];
	readonly "m_LightStyleString"?: string;
	readonly "m_LightStyleTargets"?: number[];
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBakedShadowIndex"?: number;
	readonly "m_nBakeSpecularToCubemaps"?: number;
	readonly "m_nBloodType"?: number;
	readonly "m_nBounceLight"?: number;
	readonly "m_nCastShadows"?: number;
	readonly "m_nColorMode"?: number;
	readonly "m_nDirectLight"?: number;
	readonly "m_nFog"?: number;
	readonly "m_nFogShadows"?: number;
	readonly "m_nLightMapUniqueId"?: number;
	readonly "m_nLightPathUniqueId"?: number;
	readonly "m_nLuminaireShape"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nPrecomputedSubFrusta"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nShadowMapSize"?: number;
	readonly "m_nShadowPriority"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_QueuedLightStyleStrings"?: string[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vAlternateColor"?: [number, number, number];
	readonly "m_vBakeSpecularToCubemapsSize"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
	readonly "m_VisClusters"?: Uint16Array;
	readonly "m_vPrecomputedBoundsMaxs"?: [number, number, number];
	readonly "m_vPrecomputedBoundsMins"?: [number, number, number];
	readonly "m_vPrecomputedOBBAngles"?: [number, number, number];
	readonly "m_vPrecomputedOBBAngles0"?: [number, number, number];
	readonly "m_vPrecomputedOBBAngles1"?: [number, number, number];
	readonly "m_vPrecomputedOBBAngles2"?: [number, number, number];
	readonly "m_vPrecomputedOBBAngles3"?: [number, number, number];
	readonly "m_vPrecomputedOBBAngles4"?: [number, number, number];
	readonly "m_vPrecomputedOBBAngles5"?: [number, number, number];
	readonly "m_vPrecomputedOBBExtent"?: [number, number, number];
	readonly "m_vPrecomputedOBBExtent0"?: [number, number, number];
	readonly "m_vPrecomputedOBBExtent1"?: [number, number, number];
	readonly "m_vPrecomputedOBBExtent2"?: [number, number, number];
	readonly "m_vPrecomputedOBBExtent3"?: [number, number, number];
	readonly "m_vPrecomputedOBBExtent4"?: [number, number, number];
	readonly "m_vPrecomputedOBBExtent5"?: [number, number, number];
	readonly "m_vPrecomputedOBBOrigin"?: [number, number, number];
	readonly "m_vPrecomputedOBBOrigin0"?: [number, number, number];
	readonly "m_vPrecomputedOBBOrigin1"?: [number, number, number];
	readonly "m_vPrecomputedOBBOrigin2"?: [number, number, number];
	readonly "m_vPrecomputedOBBOrigin3"?: [number, number, number];
	readonly "m_vPrecomputedOBBOrigin4"?: [number, number, number];
	readonly "m_vPrecomputedOBBOrigin5"?: [number, number, number];
	readonly "m_vShear"?: [number, number, number];
	readonly "m_vSizeParams"?: [number, number, number];
}

interface _CParticleSystemOwn {
	readonly "m_bActive"?: boolean;
	readonly "m_bAnimateDuringGameplayPause"?: boolean;
	readonly "m_bDataStringLocalized"?: boolean;
	readonly "m_bFrozen"?: boolean;
	readonly "m_bNoFreeze"?: boolean;
	readonly "m_bNoRamp"?: boolean;
	readonly "m_bNoSave"?: boolean;
	readonly "m_flFreezeTransitionDuration"?: number;
	readonly "m_flPreSimTime"?: number;
	readonly "m_flStartTime"?: number;
	readonly "m_hControlPointEnts"?: number[];
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iEffectIndex"?: bigint;
	readonly "m_iServerControlPointAssignments"?: Uint8Array;
	readonly "m_nStopType"?: number;
	readonly "m_strDataString"?: string;
	readonly "m_szSnapshotFileName"?: string;
	readonly "m_vServerControlPoints"?: [number, number, number][];
}

interface _CPathNodeOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_strParentPathUniqueID"?: string;
	readonly "m_strPathNodeParameter"?: string;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vInTangentLocal"?: [number, number, number];
	readonly "m_vOutTangentLocal"?: [number, number, number];
}

interface _CPathParticleRopeOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_ColorTint"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flParticleSpacing"?: number;
	readonly "m_flRadius"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flSlack"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iEffectIndex"?: bigint;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nEffectState"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_PathNodes_Color"?: number[];
	readonly "m_PathNodes_PinEnabled"?: boolean[];
	readonly "m_PathNodes_Position"?: number[];
	readonly "m_PathNodes_RadiusScale"?: Float32Array;
	readonly "m_PathNodes_TangentIn"?: number[];
	readonly "m_PathNodes_TangentOut"?: number[];
	readonly "m_ubInterpolationFrame"?: number;
}

interface _CPathSimpleOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_pathString"?: string;
	readonly "m_ubInterpolationFrame"?: number;
}

interface _CPathWithDynamicNodesOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_pathString"?: string;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecPathNodes"?: number[];
	readonly "m_xInitialPathWorldToLocal"?: unknown;
}

interface _CPhysicsPropOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bAwake"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_spawnflags"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CPlantedC4Own {
	readonly "m_AttributeManager.m_hOuter"?: number;
	readonly "m_AttributeManager.m_iReapplyProvisionParity"?: number;
	readonly "m_AttributeManager.m_Item.m_AttributeList.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_AttributeManager.m_Item.m_bInitialized"?: boolean;
	readonly "m_AttributeManager.m_Item.m_iAccountID"?: number;
	readonly "m_AttributeManager.m_Item.m_iEntityLevel"?: number;
	readonly "m_AttributeManager.m_Item.m_iEntityQuality"?: number;
	readonly "m_AttributeManager.m_Item.m_iInventoryPosition"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemDefinitionIndex"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemIDHigh"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemIDLow"?: number;
	readonly "m_AttributeManager.m_Item.m_NetworkedDynamicAttributes.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_AttributeManager.m_Item.m_szCustomName"?: string;
	readonly "m_AttributeManager.m_ProviderType"?: number;
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bBeingDefused"?: boolean;
	readonly "m_bBombDefused"?: boolean;
	readonly "m_bBombTicking"?: boolean;
	readonly "m_bCannotBeDefused"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bHasExploded"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_entitySpottedState.m_bSpotted"?: boolean;
	readonly "m_entitySpottedState.m_bSpottedByMask"?: Uint32Array;
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flC4Blow"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flDefuseCountDown"?: number;
	readonly "m_flDefuseLength"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flTimerLength"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hBombDefuser"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nBombSite"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSourceSoundscapeHash"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CPlayer_CameraServicesOwn {
	readonly "m_audio.localBits"?: number;
	readonly "m_audio.localSound"?: [number, number, number][];
	readonly "m_audio.soundEventHash"?: number;
	readonly "m_audio.soundscapeEntityListIndex"?: number;
	readonly "m_audio.soundscapeIndex"?: number;
	readonly "m_flCsViewPunchAngleTickRatio"?: number;
	readonly "m_hColorCorrectionCtrl"?: number;
	readonly "m_hTonemapController"?: number;
	readonly "m_hViewEntity"?: number;
	readonly "m_nCsViewPunchAngleTick"?: number;
	readonly "m_PlayerFog.m_hCtrl"?: number;
	readonly "m_PostProcessingVolumes"?: number[];
	readonly "m_vecCsViewPunchAngle"?: [number, number, number];
}

interface _CPlayerPingOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bUrgent"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_hPingedEntity"?: number;
	readonly "m_hPlayer"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_iType"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_szPlaceName"?: string;
	readonly "m_ubInterpolationFrame"?: number;
}

interface _CPlayerSprayDecalOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flCreationTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nEntity"?: number;
	readonly "m_nHitbox"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nPlayer"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_nTintID"?: number;
	readonly "m_nUniqueID"?: number;
	readonly "m_nVersion"?: number;
	readonly "m_rtGcTime"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_ubSignature"?: Uint8Array;
	readonly "m_unAccountID"?: number;
	readonly "m_unTraceID"?: number;
	readonly "m_vecEndPos"?: [number, number, number];
	readonly "m_vecLeft"?: [number, number, number];
	readonly "m_vecNormal"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
	readonly "m_vecStart"?: [number, number, number];
}

interface _CPlayerVisibilityOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bIsEnabled"?: boolean;
	readonly "m_bStartDisabled"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeTime"?: number;
	readonly "m_flFogDistanceMultiplier"?: number;
	readonly "m_flFogMaxDensityMultiplier"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flVisibilityStrength"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
}

interface _CPointCameraOwn {
	readonly "m_bActive"?: boolean;
	readonly "m_bAlignWithParent"?: boolean;
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bCanHLTVUse"?: boolean;
	readonly "m_bDofEnabled"?: boolean;
	readonly "m_bFogEnable"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bNoSky"?: boolean;
	readonly "m_bUseScreenAspectRatio"?: boolean;
	readonly "m_fBrightness"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flAspectRatio"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flDofFarBlurry"?: number;
	readonly "m_flDofFarCrisp"?: number;
	readonly "m_flDofNearBlurry"?: number;
	readonly "m_flDofNearCrisp"?: number;
	readonly "m_flDofTiltToGround"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFogEnd"?: number;
	readonly "m_flFogMaxDensity"?: number;
	readonly "m_flFogStart"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flZFar"?: number;
	readonly "m_flZNear"?: number;
	readonly "m_FogColor"?: number;
	readonly "m_FOV"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_Resolution"?: number;
	readonly "m_ubInterpolationFrame"?: number;
}

interface _CPointClientUIDialogOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bEnabled"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_DialogXMLName"?: string;
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hActivator"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_PanelClassName"?: string;
	readonly "m_PanelID"?: string;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CPointClientUIWorldPanelOwn {
	readonly "m_bAllowInteractionFromAllSceneWorlds"?: boolean;
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bDisableMipGen"?: boolean;
	readonly "m_bEnabled"?: boolean;
	readonly "m_bExcludeFromSaveGames"?: boolean;
	readonly "m_bFollowPlayerAcrossTeleport"?: boolean;
	readonly "m_bGrabbable"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bIgnoreInput"?: boolean;
	readonly "m_bIgnoreParentOrientation"?: boolean;
	readonly "m_bLit"?: boolean;
	readonly "m_bNoDepth"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bOnlyRenderToTexture"?: boolean;
	readonly "m_bOpaque"?: boolean;
	readonly "m_bRenderBackface"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bUseOffScreenIndicator"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_bVisibleWhenParentNoDraw"?: boolean;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_DialogXMLName"?: string;
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flDepthOffset"?: number;
	readonly "m_flDPI"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flHeight"?: number;
	readonly "m_flInteractDistance"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flWidth"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nExplicitImageLayout"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_PanelClassName"?: string;
	readonly "m_PanelID"?: string;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_unHorizontalAlign"?: number;
	readonly "m_unOrientation"?: number;
	readonly "m_unOwnerContext"?: number;
	readonly "m_unVerticalAlign"?: number;
	readonly "m_vecCSSClasses"?: string[];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CPointClientUIWorldTextPanelOwn {
	readonly "m_bAllowInteractionFromAllSceneWorlds"?: boolean;
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bDisableMipGen"?: boolean;
	readonly "m_bEnabled"?: boolean;
	readonly "m_bExcludeFromSaveGames"?: boolean;
	readonly "m_bFollowPlayerAcrossTeleport"?: boolean;
	readonly "m_bGrabbable"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bIgnoreInput"?: boolean;
	readonly "m_bIgnoreParentOrientation"?: boolean;
	readonly "m_bLit"?: boolean;
	readonly "m_bNoDepth"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bOnlyRenderToTexture"?: boolean;
	readonly "m_bOpaque"?: boolean;
	readonly "m_bRenderBackface"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bUseOffScreenIndicator"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_bVisibleWhenParentNoDraw"?: boolean;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_DialogXMLName"?: string;
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flDepthOffset"?: number;
	readonly "m_flDPI"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flHeight"?: number;
	readonly "m_flInteractDistance"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flWidth"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_messageText"?: string;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nExplicitImageLayout"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_PanelClassName"?: string;
	readonly "m_PanelID"?: string;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_unHorizontalAlign"?: number;
	readonly "m_unOrientation"?: number;
	readonly "m_unOwnerContext"?: number;
	readonly "m_unVerticalAlign"?: number;
	readonly "m_vecCSSClasses"?: string[];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CPointCommentaryNodeOwn {
	readonly "m_bActive"?: boolean;
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bListenedTo"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flStartTime"?: number;
	readonly "m_flStartTimeInCommentary"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_hViewPosition"?: number;
	readonly "m_iNodeNumber"?: number;
	readonly "m_iNodeNumberMax"?: number;
	readonly "m_iszCommentaryFile"?: string;
	readonly "m_iszSpeakers"?: string;
	readonly "m_iszTitle"?: string;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CPointValueRemapperOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bDisabled"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bRequiresUseKey"?: boolean;
	readonly "m_bUpdateOnClient"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flDisengageDistance"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flEngageDistance"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flInputOffset"?: number;
	readonly "m_flMaximumChangePerSecond"?: number;
	readonly "m_flMomentumModifier"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flSnapValue"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOutputEntities"?: number[];
	readonly "m_hOwnerEntity"?: number;
	readonly "m_hRemapLineEnd"?: number;
	readonly "m_hRemapLineStart"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nHapticsType"?: number;
	readonly "m_nInputType"?: number;
	readonly "m_nMomentumType"?: number;
	readonly "m_nOutputType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRatchetType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
}

interface _CPointWorldTextOwn {
	readonly "m_BackgroundMaterialName"?: string;
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bDrawBackground"?: boolean;
	readonly "m_bEnabled"?: boolean;
	readonly "m_bFullbright"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_Color"?: number;
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flBackgroundBorderHeight"?: number;
	readonly "m_flBackgroundBorderWidth"?: number;
	readonly "m_flBackgroundWorldToUV"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flDepthOffset"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flFontSize"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flWorldUnitsPerPx"?: number;
	readonly "m_FontName"?: string;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_messageText"?: string;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nJustifyHorizontal"?: number;
	readonly "m_nJustifyVertical"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nReorientMode"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CPostProcessingVolumeOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bDisabled"?: boolean;
	readonly "m_bExposureControl"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bMaster"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flExposureCompensation"?: number;
	readonly "m_flExposureFadeSpeedDown"?: number;
	readonly "m_flExposureFadeSpeedUp"?: number;
	readonly "m_flFadeDuration"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flMaxExposure"?: number;
	readonly "m_flMaxLogExposure"?: number;
	readonly "m_flMinExposure"?: number;
	readonly "m_flMinLogExposure"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flTonemapEVSmoothingRange"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_hPostSettings"?: bigint;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_spawnflags"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CPropDoorRotatingOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bLocked"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bNoNPCs"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bUseAnimGraph"?: boolean;
	readonly "m_bUseHitboxesForRenderBox"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_closedAngles"?: [number, number, number];
	readonly "m_closedPosition"?: [number, number, number];
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_eDoorState"?: bigint;
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hMaster"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_spawnflags"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CPulseGameBlackboardOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_strGraphName"?: string;
	readonly "m_strStateBlob"?: string;
	readonly "m_ubInterpolationFrame"?: number;
}

interface _CRagdollManagerOwn {
	readonly "m_iCurrentMaxRagdollCount"?: number;
}

interface _CRagdollPropOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flBlendWeight"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_ragAngles"?: number[];
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_ragEnabled"?: boolean[];
	readonly "m_ragPos"?: number[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CRagdollPropAttachedOwn {
	readonly "m_attachmentPointBoneSpace"?: [number, number, number];
	readonly "m_attachmentPointRagdollSpace"?: [number, number, number];
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_boneIndexAttached"?: number;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flBlendWeight"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_ragAngles"?: number[];
	readonly "m_ragdollAttachedObjectIndex"?: number;
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_ragEnabled"?: boolean[];
	readonly "m_ragPos"?: number[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CRectLightOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bContactShadow"?: boolean;
	readonly "m_bEnabled"?: boolean;
	readonly "m_bForceShadowsEnabled"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bPrecomputedFieldsValid"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bShowLight"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_Color"?: number;
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fAlternateColorBrightness"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flBakeSpecularToCubemapsScale"?: number;
	readonly "m_flBounceScale"?: number;
	readonly "m_flBrightness"?: number;
	readonly "m_flBrightnessScale"?: number;
	readonly "m_flColorTemperature"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flFadeSizeEnd"?: number;
	readonly "m_flFadeSizeStart"?: number;
	readonly "m_flFogScale"?: number;
	readonly "m_flFogStrength"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flLightStyleStartTime"?: number;
	readonly "m_flLuminaireAnisotropy"?: number;
	readonly "m_flLuminaireSize"?: number;
	readonly "m_flMinRoughness"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flRange"?: number;
	readonly "m_flShadowFadeSizeEnd"?: number;
	readonly "m_flShadowFadeSizeStart"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flShape"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flSkirt"?: number;
	readonly "m_flSkirtNear"?: number;
	readonly "m_flSoftX"?: number;
	readonly "m_flSoftY"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hLightCookie"?: bigint;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_LightStyleEvents"?: string[];
	readonly "m_LightStyleString"?: string;
	readonly "m_LightStyleTargets"?: number[];
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBakedShadowIndex"?: number;
	readonly "m_nBakeSpecularToCubemaps"?: number;
	readonly "m_nBloodType"?: number;
	readonly "m_nBounceLight"?: number;
	readonly "m_nCastShadows"?: number;
	readonly "m_nColorMode"?: number;
	readonly "m_nDirectLight"?: number;
	readonly "m_nFog"?: number;
	readonly "m_nFogShadows"?: number;
	readonly "m_nLightMapUniqueId"?: number;
	readonly "m_nLightPathUniqueId"?: number;
	readonly "m_nLuminaireShape"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nPrecomputedSubFrusta"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nShadowMapSize"?: number;
	readonly "m_nShadowPriority"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_QueuedLightStyleStrings"?: string[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vAlternateColor"?: [number, number, number];
	readonly "m_vBakeSpecularToCubemapsSize"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
	readonly "m_VisClusters"?: Uint16Array;
	readonly "m_vPrecomputedBoundsMaxs"?: [number, number, number];
	readonly "m_vPrecomputedBoundsMins"?: [number, number, number];
	readonly "m_vPrecomputedOBBAngles"?: [number, number, number];
	readonly "m_vPrecomputedOBBAngles0"?: [number, number, number];
	readonly "m_vPrecomputedOBBAngles1"?: [number, number, number];
	readonly "m_vPrecomputedOBBAngles2"?: [number, number, number];
	readonly "m_vPrecomputedOBBAngles3"?: [number, number, number];
	readonly "m_vPrecomputedOBBAngles4"?: [number, number, number];
	readonly "m_vPrecomputedOBBAngles5"?: [number, number, number];
	readonly "m_vPrecomputedOBBExtent"?: [number, number, number];
	readonly "m_vPrecomputedOBBExtent0"?: [number, number, number];
	readonly "m_vPrecomputedOBBExtent1"?: [number, number, number];
	readonly "m_vPrecomputedOBBExtent2"?: [number, number, number];
	readonly "m_vPrecomputedOBBExtent3"?: [number, number, number];
	readonly "m_vPrecomputedOBBExtent4"?: [number, number, number];
	readonly "m_vPrecomputedOBBExtent5"?: [number, number, number];
	readonly "m_vPrecomputedOBBOrigin"?: [number, number, number];
	readonly "m_vPrecomputedOBBOrigin0"?: [number, number, number];
	readonly "m_vPrecomputedOBBOrigin1"?: [number, number, number];
	readonly "m_vPrecomputedOBBOrigin2"?: [number, number, number];
	readonly "m_vPrecomputedOBBOrigin3"?: [number, number, number];
	readonly "m_vPrecomputedOBBOrigin4"?: [number, number, number];
	readonly "m_vPrecomputedOBBOrigin5"?: [number, number, number];
	readonly "m_vShear"?: [number, number, number];
	readonly "m_vSizeParams"?: [number, number, number];
}

interface _CRopeKeyframeOwn {
	readonly "m_bConstrainBetweenEndpoints"?: boolean;
	readonly "m_fLockedPoints"?: number;
	readonly "m_flScrollSpeed"?: number;
	readonly "m_hEndPoint"?: number;
	readonly "m_hStartPoint"?: number;
	readonly "m_iEndAttachment"?: bigint;
	readonly "m_iRopeMaterialModelIndex"?: bigint;
	readonly "m_iStartAttachment"?: bigint;
	readonly "m_nChangeCount"?: number;
	readonly "m_nSegments"?: number;
	readonly "m_RopeFlags"?: number;
	readonly "m_RopeLength"?: number;
	readonly "m_Slack"?: number;
	readonly "m_Subdiv"?: number;
	readonly "m_TextureScale"?: number;
	readonly "m_Width"?: number;
}

interface _CSceneEntityOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAutogenerated"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bIsPlayingBack"?: boolean;
	readonly "m_bMultiplayer"?: boolean;
	readonly "m_bPaused"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flForceClientTime"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_hActorList"?: number[];
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSceneStringIndex"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
}

interface _CShatterGlassShardPhysicsOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_ShardDesc.m_bHasParent"?: boolean;
	readonly "m_ShardDesc.m_bParentFrozen"?: boolean;
	readonly "m_ShardDesc.m_flGlassHalfThickness"?: number;
	readonly "m_ShardDesc.m_hMaterialBase"?: bigint;
	readonly "m_ShardDesc.m_hMaterialDamageOverlay"?: bigint;
	readonly "m_ShardDesc.m_nModelID"?: number;
	readonly "m_ShardDesc.m_solid"?: number;
	readonly "m_ShardDesc.m_SurfacePropStringToken"?: number;
	readonly "m_ShardDesc.m_vecPanelSize"?: [number, number, number];
	readonly "m_ShardDesc.m_vecPanelVertices"?: number[];
	readonly "m_ShardDesc.m_vecStressPositionA"?: [number, number, number];
	readonly "m_ShardDesc.m_vecStressPositionB"?: [number, number, number];
	readonly "m_ShardDesc.m_vInitialPanelVertices"?: number[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CSkyCameraOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_skyboxData.bClip3DSkyBoxNearToWorldFar"?: boolean;
	readonly "m_skyboxData.flClip3DSkyBoxNearToWorldFarOffset"?: number;
	readonly "m_skyboxData.fog.blend"?: boolean;
	readonly "m_skyboxData.fog.blendtobackground"?: number;
	readonly "m_skyboxData.fog.colorPrimary"?: number;
	readonly "m_skyboxData.fog.colorPrimaryLerpTo"?: number;
	readonly "m_skyboxData.fog.colorSecondary"?: number;
	readonly "m_skyboxData.fog.colorSecondaryLerpTo"?: number;
	readonly "m_skyboxData.fog.dirPrimary"?: [number, number, number];
	readonly "m_skyboxData.fog.duration"?: number;
	readonly "m_skyboxData.fog.enable"?: boolean;
	readonly "m_skyboxData.fog.end"?: number;
	readonly "m_skyboxData.fog.endLerpTo"?: number;
	readonly "m_skyboxData.fog.exponent"?: number;
	readonly "m_skyboxData.fog.farz"?: number;
	readonly "m_skyboxData.fog.HDRColorScale"?: number;
	readonly "m_skyboxData.fog.lerptime"?: number;
	readonly "m_skyboxData.fog.locallightscale"?: number;
	readonly "m_skyboxData.fog.maxdensity"?: number;
	readonly "m_skyboxData.fog.maxdensityLerpTo"?: number;
	readonly "m_skyboxData.fog.scattering"?: number;
	readonly "m_skyboxData.fog.skyboxFogFactor"?: number;
	readonly "m_skyboxData.fog.skyboxFogFactorLerpTo"?: number;
	readonly "m_skyboxData.fog.start"?: number;
	readonly "m_skyboxData.fog.startLerpTo"?: number;
	readonly "m_skyboxData.m_nWorldGroupID"?: number;
	readonly "m_skyboxData.origin"?: [number, number, number];
	readonly "m_skyboxData.scale"?: number;
	readonly "m_skyboxSlotToken"?: number;
	readonly "m_ubInterpolationFrame"?: number;
}

interface _CSmokeGrenadeProjectileOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bDidSmokeEffect"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bIsLive"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_DmgRadius"?: number;
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_fFlags"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flDamage"?: number;
	readonly "m_flDetonateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_hThrower"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nBounces"?: number;
	readonly "m_nExplodeEffectIndex"?: bigint;
	readonly "m_nExplodeEffectTickBegin"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRandomSeed"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSmokeEffectTickBegin"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_nVoxelFrameDataSize"?: number;
	readonly "m_nVoxelUpdate"?: number;
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecExplodeEffectOrigin"?: [number, number, number];
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
	readonly "m_vecVelocity.m_vecX"?: number;
	readonly "m_vecVelocity.m_vecY"?: number;
	readonly "m_vecVelocity.m_vecZ"?: number;
	readonly "m_vInitialPosition"?: [number, number, number];
	readonly "m_vInitialVelocity"?: [number, number, number];
	readonly "m_VoxelFrameData"?: Uint8Array;
	readonly "m_vSmokeColor"?: [number, number, number];
	readonly "m_vSmokeDetonationPos"?: [number, number, number];
}

interface _CSoundAreaEntityOrientedBoxOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bDisabled"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iszSoundAreaType"?: string;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vMax"?: [number, number, number];
	readonly "m_vMin"?: [number, number, number];
	readonly "m_vPos"?: [number, number, number];
}

interface _CSoundAreaEntitySphereOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bDisabled"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flRadius"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iszSoundAreaType"?: string;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vPos"?: [number, number, number];
}

interface _CSoundEventAABBEntityOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vMaxs"?: [number, number, number];
	readonly "m_vMins"?: [number, number, number];
}

interface _CSoundEventPathCornerEntityOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecCornerPairsNetworked"?: ReadonlyArray<{ readonly "flP1Pct"?: number; readonly "flP2Pct"?: number; readonly "flPathLengthSqr"?: number; readonly "vP1"?: [number, number, number]; readonly "vP2"?: [number, number, number] }>;
}

interface _CSoundEventSphereEntityOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flRadius"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
}

interface _CSoundOpvarSetAABBEntityOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bFastRefresh"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bUseAutoCompare"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iOpvarIndex"?: number;
	readonly "m_iszOperatorName"?: string;
	readonly "m_iszOpvarName"?: string;
	readonly "m_iszStackName"?: string;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
}

interface _CSPerRoundStats_tOwn {
	readonly "m_iAssists"?: number;
	readonly "m_iCashEarned"?: number;
	readonly "m_iDamage"?: number;
	readonly "m_iDeaths"?: number;
	readonly "m_iEnemiesFlashed"?: number;
	readonly "m_iEquipmentValue"?: number;
	readonly "m_iHeadShotKills"?: number;
	readonly "m_iKillReward"?: number;
	readonly "m_iKills"?: number;
	readonly "m_iLiveTime"?: number;
	readonly "m_iMoneySaved"?: number;
	readonly "m_iObjective"?: number;
	readonly "m_iUtilityDamage"?: number;
}

interface _CSpotlightEndOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flLightScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_Radius"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CSpriteOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_bWorldSpaceScale"?: boolean;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flBrightnessDuration"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flFrame"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGlowProxySize"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flHDRColorScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flScaleDuration"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flSpriteFramerate"?: number;
	readonly "m_flSpriteScale"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hAttachedToEntity"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_hSpriteMaterial"?: bigint;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nAttachment"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nBrightness"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CTeamOwn {
	readonly "m_aPawns"?: number[];
	readonly "m_aPlayers"?: number[];
	readonly "m_iScore"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_szTeamname"?: string;
}

interface _CTextureBasedAnimatableOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bLoop"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flFPS"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flStartFrame"?: number;
	readonly "m_flStartTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_hPositionKeys"?: bigint;
	readonly "m_hRotationKeys"?: bigint;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vAnimationBoundsMax"?: [number, number, number];
	readonly "m_vAnimationBoundsMin"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CTonemapController2Own {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flAutoExposureMax"?: number;
	readonly "m_flAutoExposureMin"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flExposureAdaptationSpeedDown"?: number;
	readonly "m_flExposureAdaptationSpeedUp"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flTonemapEVSmoothingRange"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_ubInterpolationFrame"?: number;
}

interface _CTriggerBuoyancyOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bDisabled"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flFluidDensity"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_spawnflags"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CTriggerFanOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bDisabled"?: boolean;
	readonly "m_bFalloff"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bPushAwayFromInfoTarget"?: boolean;
	readonly "m_bPushTowardsInfoTarget"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flForce"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hInfoFan"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_qNoiseDelta"?: number;
	readonly "m_RampTimer.m_duration"?: number;
	readonly "m_RampTimer.m_nWorldGroupId"?: number;
	readonly "m_RampTimer.m_timescale"?: number;
	readonly "m_RampTimer.m_timestamp"?: number;
	readonly "m_spawnflags"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vDirection"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
	readonly "m_vFanOriginOffset"?: [number, number, number];
}

interface _CTriggerPhysicsOwn {
	readonly "m_angularDamping"?: number;
	readonly "m_angularLimit"?: number;
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bCollapseToForcePoint"?: boolean;
	readonly "m_bConvertToDebrisWhenPossible"?: boolean;
	readonly "m_bDisabled"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flDampingRatio"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flFrequency"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_gravityScale"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_linearDamping"?: number;
	readonly "m_linearForce"?: number;
	readonly "m_linearLimit"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nSubclassID"?: number;
	readonly "m_spawnflags"?: number;
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecLinearForceDirection"?: [number, number, number];
	readonly "m_vecLinearForcePointAt"?: [number, number, number];
	readonly "m_vecLinearForcePointAtWorld"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
}

interface _CVoteControllerOwn {
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bIsYesNoVote"?: boolean;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_iActiveIssueIndex"?: number;
	readonly "m_iOnlyTeamToVote"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nPotentialVotes"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_nVoteOptionCount"?: Int32Array;
	readonly "m_ubInterpolationFrame"?: number;
}

interface _CWeaponCZ75aOwn {
	readonly "m_AttributeManager.m_hOuter"?: number;
	readonly "m_AttributeManager.m_iReapplyProvisionParity"?: number;
	readonly "m_AttributeManager.m_Item.m_AttributeList.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_AttributeManager.m_Item.m_bInitialized"?: boolean;
	readonly "m_AttributeManager.m_Item.m_iAccountID"?: number;
	readonly "m_AttributeManager.m_Item.m_iEntityLevel"?: number;
	readonly "m_AttributeManager.m_Item.m_iEntityQuality"?: number;
	readonly "m_AttributeManager.m_Item.m_iInventoryPosition"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemDefinitionIndex"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemIDHigh"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemIDLow"?: number;
	readonly "m_AttributeManager.m_Item.m_NetworkedDynamicAttributes.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_AttributeManager.m_Item.m_szCustomName"?: string;
	readonly "m_AttributeManager.m_ProviderType"?: number;
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bBurstMode"?: boolean;
	readonly "m_bCanBePickedUp"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bDroppedNearBuyZone"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bInReload"?: boolean;
	readonly "m_bInspectPending"?: boolean;
	readonly "m_bInspectShouldLoop"?: boolean;
	readonly "m_bIsHauledBack"?: boolean;
	readonly "m_bMagazineRemoved"?: boolean;
	readonly "m_bNeedsBoltAction"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bSilencerOn"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_bWasActiveWeaponWhenDropped"?: boolean;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fAccuracyPenalty"?: number;
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_fLastShotTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flDroppedAtTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flFallbackWear"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flInspectCancelCompleteTime"?: number;
	readonly "m_flLastShakeTime"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flNextPrimaryAttackTickRatio"?: number;
	readonly "m_flNextSecondaryAttackTickRatio"?: number;
	readonly "m_flPostponeFireReadyFrac"?: number;
	readonly "m_flRecoilIndex"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flTimeSilencerSwitchComplete"?: number;
	readonly "m_flWatTickOffset"?: number;
	readonly "m_flWeaponActionPlaybackRate"?: number;
	readonly "m_flWeaponGameplayAnimStateTimestamp"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_hPrevOwner"?: number;
	readonly "m_iBurstShotsRemaining"?: number;
	readonly "m_iClip1"?: number;
	readonly "m_iClip2"?: number;
	readonly "m_iIronSightMode"?: number;
	readonly "m_iMostRecentTeamNumber"?: number;
	readonly "m_iOriginalTeamNumber"?: number;
	readonly "m_iRecoilIndex"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_iWeaponGameplayAnimState"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nDeployTick"?: number;
	readonly "m_nDropTick"?: number;
	readonly "m_nextPrevOwnerUseTime"?: number;
	readonly "m_nFallbackPaintKit"?: number;
	readonly "m_nFallbackSeed"?: number;
	readonly "m_nFallbackStatTrak"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nNextPrimaryAttackTick"?: number;
	readonly "m_nNextSecondaryAttackTick"?: number;
	readonly "m_nNextThinkTick"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nPostponeFireReadyTicks"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nRevolverCylinderIdx"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_OriginalOwnerXuidHigh"?: number;
	readonly "m_OriginalOwnerXuidLow"?: number;
	readonly "m_pReserveAmmo"?: Int32Array;
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
	readonly "m_weaponMode"?: bigint;
	readonly "m_zoomLevel"?: number;
}

interface _CWeaponTaserOwn {
	readonly "m_AttributeManager.m_hOuter"?: number;
	readonly "m_AttributeManager.m_iReapplyProvisionParity"?: number;
	readonly "m_AttributeManager.m_Item.m_AttributeList.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_AttributeManager.m_Item.m_bInitialized"?: boolean;
	readonly "m_AttributeManager.m_Item.m_iAccountID"?: number;
	readonly "m_AttributeManager.m_Item.m_iEntityLevel"?: number;
	readonly "m_AttributeManager.m_Item.m_iEntityQuality"?: number;
	readonly "m_AttributeManager.m_Item.m_iInventoryPosition"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemDefinitionIndex"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemIDHigh"?: number;
	readonly "m_AttributeManager.m_Item.m_iItemIDLow"?: number;
	readonly "m_AttributeManager.m_Item.m_NetworkedDynamicAttributes.m_Attributes"?: ReadonlyArray<{ readonly "m_bSetBonus"?: boolean; readonly "m_flInitialValue"?: number; readonly "m_iAttributeDefinitionIndex"?: number; readonly "m_iRawValue32"?: number; readonly "m_nRefundableCurrency"?: number }>;
	readonly "m_AttributeManager.m_Item.m_szCustomName"?: string;
	readonly "m_AttributeManager.m_ProviderType"?: number;
	readonly "m_bAnimatedEveryTick"?: boolean;
	readonly "m_bAnimGraphUpdateEnabled"?: boolean;
	readonly "m_bBurstMode"?: boolean;
	readonly "m_bCanBePickedUp"?: boolean;
	readonly "m_bClientSideRagdoll"?: boolean;
	readonly "m_bDroppedNearBuyZone"?: boolean;
	readonly "m_bGravityDisabled"?: boolean;
	readonly "m_bInitiallyPopulateInterpHistory"?: boolean;
	readonly "m_bInReload"?: boolean;
	readonly "m_bInspectPending"?: boolean;
	readonly "m_bInspectShouldLoop"?: boolean;
	readonly "m_bIsHauledBack"?: boolean;
	readonly "m_bNeedsBoltAction"?: boolean;
	readonly "m_bNoInterpolate"?: boolean;
	readonly "m_bRagdollClientSide"?: boolean;
	readonly "m_bRagdollEnabled"?: boolean;
	readonly "m_bRenderToCubemaps"?: boolean;
	readonly "m_bSilencerOn"?: boolean;
	readonly "m_bvDisabledHitGroups"?: Uint32Array;
	readonly "m_bWasActiveWeaponWhenDropped"?: boolean;
	readonly "m_clrRender"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionFunctionMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nCollisionGroup"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMask"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nDetailLayerMaskType"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nEntityId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nHierarchyId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsAs"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsExclude"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nInteractsWith"?: bigint;
	readonly "m_Collision.m_collisionAttribute.m_nOwnerId"?: number;
	readonly "m_Collision.m_collisionAttribute.m_nTargetDetailLayer"?: number;
	readonly "m_Collision.m_CollisionGroup"?: number;
	readonly "m_Collision.m_flCapsuleRadius"?: number;
	readonly "m_Collision.m_nEnablePhysics"?: number;
	readonly "m_Collision.m_nSolidType"?: bigint;
	readonly "m_Collision.m_nSurroundType"?: bigint;
	readonly "m_Collision.m_triggerBloat"?: number;
	readonly "m_Collision.m_usSolidFlags"?: number;
	readonly "m_Collision.m_vCapsuleCenter1"?: [number, number, number];
	readonly "m_Collision.m_vCapsuleCenter2"?: [number, number, number];
	readonly "m_Collision.m_vecMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecMins"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMaxs"?: [number, number, number];
	readonly "m_Collision.m_vecSpecifiedSurroundingMins"?: [number, number, number];
	readonly "m_fAccuracyPenalty"?: number;
	readonly "m_fadeMaxDist"?: number;
	readonly "m_fadeMinDist"?: number;
	readonly "m_fEffects"?: number;
	readonly "m_fFireTime"?: number;
	readonly "m_flAnimTime"?: number;
	readonly "m_fLastShotTime"?: number;
	readonly "m_flCreateTime"?: number;
	readonly "m_flDroppedAtTime"?: number;
	readonly "m_flElasticity"?: number;
	readonly "m_flFadeScale"?: number;
	readonly "m_flFallbackWear"?: number;
	readonly "m_flGlowBackfaceMult"?: number;
	readonly "m_flGravityScale"?: number;
	readonly "m_flInspectCancelCompleteTime"?: number;
	readonly "m_flLastShakeTime"?: number;
	readonly "m_flNavIgnoreUntilTime"?: number;
	readonly "m_flNextPrimaryAttackTickRatio"?: number;
	readonly "m_flNextSecondaryAttackTickRatio"?: number;
	readonly "m_flPostponeFireReadyFrac"?: number;
	readonly "m_flRecoilIndex"?: number;
	readonly "m_flShadowStrength"?: number;
	readonly "m_flSimulationTime"?: number;
	readonly "m_flTimeSilencerSwitchComplete"?: number;
	readonly "m_flWatTickOffset"?: number;
	readonly "m_flWeaponActionPlaybackRate"?: number;
	readonly "m_flWeaponGameplayAnimStateTimestamp"?: number;
	readonly "m_Glow.m_bEligibleForScreenHighlight"?: boolean;
	readonly "m_Glow.m_bFlashing"?: boolean;
	readonly "m_Glow.m_flGlowStartTime"?: number;
	readonly "m_Glow.m_flGlowTime"?: number;
	readonly "m_Glow.m_glowColorOverride"?: number;
	readonly "m_Glow.m_iGlowTeam"?: number;
	readonly "m_Glow.m_iGlowType"?: number;
	readonly "m_Glow.m_nGlowRange"?: number;
	readonly "m_Glow.m_nGlowRangeMin"?: number;
	readonly "m_hEffectEntity"?: number;
	readonly "m_hOwnerEntity"?: number;
	readonly "m_hPrevOwner"?: number;
	readonly "m_iBurstShotsRemaining"?: number;
	readonly "m_iClip1"?: number;
	readonly "m_iClip2"?: number;
	readonly "m_iIronSightMode"?: number;
	readonly "m_iMostRecentTeamNumber"?: number;
	readonly "m_iOriginalTeamNumber"?: number;
	readonly "m_iRecoilIndex"?: number;
	readonly "m_iTeamNum"?: number;
	readonly "m_iWeaponGameplayAnimState"?: number;
	readonly "m_MoveCollide"?: bigint;
	readonly "m_MoveType"?: bigint;
	readonly "m_nBloodType"?: number;
	readonly "m_nDeployTick"?: number;
	readonly "m_nDropTick"?: number;
	readonly "m_nextPrevOwnerUseTime"?: number;
	readonly "m_nFallbackPaintKit"?: number;
	readonly "m_nFallbackSeed"?: number;
	readonly "m_nFallbackStatTrak"?: number;
	readonly "m_nForceBone"?: number;
	readonly "m_nNextPrimaryAttackTick"?: number;
	readonly "m_nNextSecondaryAttackTick"?: number;
	readonly "m_nNextThinkTick"?: number;
	readonly "m_nObjectCulling"?: number;
	readonly "m_nPlatformType"?: number;
	readonly "m_nPostponeFireReadyTicks"?: number;
	readonly "m_nRenderFX"?: bigint;
	readonly "m_nRenderMode"?: bigint;
	readonly "m_nRevolverCylinderIdx"?: number;
	readonly "m_nSubclassID"?: number;
	readonly "m_OriginalOwnerXuidHigh"?: number;
	readonly "m_OriginalOwnerXuidLow"?: number;
	readonly "m_pReserveAmmo"?: Int32Array;
	readonly "m_RagdollPose.m_hOwner"?: number;
	readonly "m_RagdollPose.m_Transforms"?: unknown[];
	readonly "m_ubInterpolationFrame"?: number;
	readonly "m_vecForce"?: [number, number, number];
	readonly "m_vecRenderAttributes"?: ReadonlyArray<{ readonly "m_ID"?: number; readonly "m_Values"?: [number, number, number] }>;
	readonly "m_weaponMode"?: bigint;
	readonly "m_zoomLevel"?: number;
}

interface _EntityRenderAttribute_tOwn {
	readonly "m_ID"?: number;
	readonly "m_Values"?: [number, number, number];
}

interface _HUDPanelDialogVariableString_tOwn {
	readonly "m_bIsSet"?: boolean;
	readonly "m_nDialogVariableIndex"?: number;
	readonly "m_nPanelIdIndex"?: number;
	readonly "m_sValue"?: string;
}

interface _HUDPanelHasClass_tOwn {
	readonly "m_eClassStatus"?: number;
	readonly "m_nClassNameIndex"?: number;
	readonly "m_nPanelIdIndex"?: number;
}

interface _SellbackPurchaseEntry_tOwn {
	readonly "m_bPrevHelmet"?: boolean;
	readonly "m_hItem"?: bigint;
	readonly "m_nCost"?: number;
	readonly "m_nPrevArmor"?: number;
	readonly "m_unDefIdx"?: number;
}

interface _ServerAuthoritativeWeaponSlot_tOwn {
	readonly "unClass"?: number;
	readonly "unItemDefIdx"?: number;
	readonly "unSlot"?: number;
}

interface _SoundeventPathCornerPairNetworked_tOwn {
	readonly "flP1Pct"?: number;
	readonly "flP2Pct"?: number;
	readonly "flPathLengthSqr"?: number;
	readonly "vP1"?: [number, number, number];
	readonly "vP2"?: [number, number, number];
}

interface _ViewAngleServerChange_tOwn {
	readonly "nIndex"?: number;
	readonly "nType"?: number;
	readonly "qAngle"?: [number, number, number];
}

interface _WeaponPurchaseCount_tOwn {
	readonly "m_nCount"?: number;
	readonly "m_nItemDefIndex"?: number;
}

export type IAnimGraph2SerializedPoseRecipeSlot_t = Prefixed<"AnimGraph2SerializedPoseRecipeSlot_t", _AnimGraph2SerializedPoseRecipeSlot_tOwn>;

export type ICAK47 = Prefixed<"CAK47",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICBarnLight = Prefixed<"CBarnLight",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBarnLightOwn
>;

export type ICBaseAnimGraph = Prefixed<"CBaseAnimGraph",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseAnimGraphOwn
>;

export type ICBaseButton = Prefixed<"CBaseButton",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseButtonOwn
>;

export type ICBaseCombatCharacter = Prefixed<"CBaseCombatCharacter",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseCombatCharacterOwn
>;

export type ICBaseCSGrenadeProjectile = Prefixed<"CBaseCSGrenadeProjectile",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseCSGrenadeProjectileOwn
>;

export type ICBaseDoor = Prefixed<"CBaseDoor",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseDoorOwn
>;

export type ICBaseEntity = Prefixed<"CBaseEntity",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseEntityOwn
>;

export type ICBaseGrenade = Prefixed<"CBaseGrenade",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseGrenadeOwn
>;

export type ICBaseModelEntity = Prefixed<"CBaseModelEntity",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseModelEntityOwn
>;

export type ICBasePlayerController = Prefixed<"CBasePlayerController",
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBasePlayerControllerOwn
>;

export type ICBasePlayerPawn = Prefixed<"CBasePlayerPawn",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	Prefixed<"CPlayer_CameraServices", _CPlayer_CameraServices> &
	_CBasePlayerPawnOwn
>;

export type ICBasePlayerWeapon = Prefixed<"CBasePlayerWeapon",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBasePlayerWeaponOwn
>;

export type ICBaseToggle = Prefixed<"CBaseToggle",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseModelEntityOwn
>;

export type ICBaseTrigger = Prefixed<"CBaseTrigger",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseTriggerOwn
>;

export type ICBeam = Prefixed<"CBeam",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	_CBeamOwn
>;

export type ICBodyComponentBaseAnimGraph = Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraphOwn>;

export type ICBodyComponentBaseModelEntity = Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntityOwn>;

export type ICBodyComponentPoint = Prefixed<"CBodyComponentPoint", _CBodyComponentPointOwn>;

export type ICBombTarget = Prefixed<"CBombTarget",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBombTargetOwn
>;

export type ICBreakable = Prefixed<"CBreakable",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseModelEntityOwn
>;

export type ICBreakableProp = Prefixed<"CBreakableProp",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseAnimGraphOwn
>;

export type ICC4 = Prefixed<"CC4",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CC4Own
>;

export type ICCashStack = Prefixed<"CCashStack",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseModelEntityOwn
>;

export type ICChicken = Prefixed<"CChicken",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CChickenOwn
>;

export type ICCitadelSoundOpvarSetOBB = Prefixed<"CCitadelSoundOpvarSetOBB",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CCitadelSoundOpvarSetOBBOwn
>;

export type ICColorCorrection = Prefixed<"CColorCorrection",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	_CColorCorrectionOwn
>;

export type ICColorCorrectionVolume = Prefixed<"CColorCorrectionVolume",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CColorCorrectionVolumeOwn
>;

export type ICCSCustomHudLayout = Prefixed<"CCSCustomHudLayout", _CCSCustomHudLayoutOwn>;

export type ICCSCustomHudLayoutState = Prefixed<"CCSCustomHudLayoutState", _CCSCustomHudLayoutStateOwn>;

export type ICCSCustomPlayerCamera = Prefixed<"CCSCustomPlayerCamera",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CCSCustomPlayerCameraOwn
>;

export type ICCSGameModeRules_ArmsRace = Prefixed<"CCSGameModeRules_ArmsRace", _CCSGameModeRules_ArmsRaceOwn>;

export type ICCSGameModeRules_Deathmatch = Prefixed<"CCSGameModeRules_Deathmatch", _CCSGameModeRules_DeathmatchOwn>;

export type ICCSGameRules = Prefixed<"CCSGameRules", _CCSGameRulesOwn>;

export type ICCSGameRulesProxy = Prefixed<"CCSGameRulesProxy", Prefixed<"CCSGameRules", _CCSGameRules>>;

export type ICCSGO_EndOfMatchLineupEnd = Prefixed<"CCSGO_EndOfMatchLineupEnd",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseEntityOwn
>;

export type ICCSGO_EndOfMatchLineupStart = Prefixed<"CCSGO_EndOfMatchLineupStart",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseEntityOwn
>;

export type ICCSGO_TeamIntroCounterTerroristPosition = Prefixed<"CCSGO_TeamIntroCounterTerroristPosition",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CCSGO_TeamIntroCounterTerroristPositionOwn
>;

export type ICCSGO_TeamIntroTerroristPosition = Prefixed<"CCSGO_TeamIntroTerroristPosition",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CCSGO_TeamIntroCounterTerroristPositionOwn
>;

export type ICCSGO_TeamSelectCounterTerroristPosition = Prefixed<"CCSGO_TeamSelectCounterTerroristPosition",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CCSGO_TeamIntroCounterTerroristPositionOwn
>;

export type ICCSGO_TeamSelectTerroristPosition = Prefixed<"CCSGO_TeamSelectTerroristPosition",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CCSGO_TeamIntroCounterTerroristPositionOwn
>;

export type ICCSGO_WingmanIntroCounterTerroristPosition = Prefixed<"CCSGO_WingmanIntroCounterTerroristPosition",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CCSGO_TeamIntroCounterTerroristPositionOwn
>;

export type ICCSGO_WingmanIntroTerroristPosition = Prefixed<"CCSGO_WingmanIntroTerroristPosition",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CCSGO_TeamIntroCounterTerroristPositionOwn
>;

export type ICCSMinimapBoundary = Prefixed<"CCSMinimapBoundary",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseEntityOwn
>;

export type ICCSObserver_CameraServices = Prefixed<"CCSObserver_CameraServices", _CCSObserver_CameraServicesOwn>;

export type ICCSObserver_MovementServices = Prefixed<"CCSObserver_MovementServices", _CCSObserver_MovementServicesOwn>;

export type ICCSObserver_ObserverServices = Prefixed<"CCSObserver_ObserverServices", _CCSObserver_ObserverServicesOwn>;

export type ICCSObserverPawn = Prefixed<"CCSObserverPawn",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CCSObserver_CameraServices", _CCSObserver_CameraServices> &
	Prefixed<"CCSObserver_MovementServices", _CCSObserver_MovementServices> &
	Prefixed<"CCSObserver_ObserverServices", _CCSObserver_ObserverServices> &
	Prefixed<"CCSPlayer_PingServices", _CCSPlayer_PingServices> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CCSObserverPawnOwn
>;

export type ICCSPetPlacement = Prefixed<"CCSPetPlacement",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseEntityOwn
>;

export type ICCSPlayer_ActionTrackingServices = Prefixed<"CCSPlayer_ActionTrackingServices", _CCSPlayer_ActionTrackingServicesOwn>;

export type ICCSPlayer_AimPunchServices = Prefixed<"CCSPlayer_AimPunchServices", _CCSPlayer_AimPunchServicesOwn>;

export type ICCSPlayer_BulletServices = Prefixed<"CCSPlayer_BulletServices", _CCSPlayer_BulletServicesOwn>;

export type ICCSPlayer_BuyServices = Prefixed<"CCSPlayer_BuyServices", _CCSPlayer_BuyServicesOwn>;

export type ICCSPlayer_CameraServices = Prefixed<"CCSPlayer_CameraServices", _CCSObserver_CameraServicesOwn>;

export type ICCSPlayer_HostageServices = Prefixed<"CCSPlayer_HostageServices", _CCSPlayer_HostageServicesOwn>;

export type ICCSPlayer_ItemServices = Prefixed<"CCSPlayer_ItemServices", _CCSPlayer_ItemServicesOwn>;

export type ICCSPlayer_MovementServices = Prefixed<"CCSPlayer_MovementServices", _CCSPlayer_MovementServicesOwn>;

export type ICCSPlayer_PingServices = Prefixed<"CCSPlayer_PingServices", _CCSPlayer_PingServicesOwn>;

export type ICCSPlayer_WeaponServices = Prefixed<"CCSPlayer_WeaponServices", _CCSPlayer_WeaponServicesOwn>;

export type ICCSPlayerCamera = Prefixed<"CCSPlayerCamera",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CCSCustomPlayerCameraOwn
>;

export type ICCSPlayerController = Prefixed<"CCSPlayerController",
	Prefixed<"CCSPlayerController_ActionTrackingServices", _CCSPlayerController_ActionTrackingServices> &
	Prefixed<"CCSPlayerController_DamageServices", _CCSPlayerController_DamageServices> &
	Prefixed<"CCSPlayerController_InGameMoneyServices", _CCSPlayerController_InGameMoneyServices> &
	Prefixed<"CCSPlayerController_InventoryServices", _CCSPlayerController_InventoryServices> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CCSPlayerControllerOwn
>;

export type ICCSPlayerController_ActionTrackingServices = Prefixed<"CCSPlayerController_ActionTrackingServices", _CCSPlayerController_ActionTrackingServicesOwn>;

export type ICCSPlayerController_DamageServices = Prefixed<"CCSPlayerController_DamageServices", _CCSPlayerController_DamageServicesOwn>;

export type ICCSPlayerController_InGameMoneyServices = Prefixed<"CCSPlayerController_InGameMoneyServices", _CCSPlayerController_InGameMoneyServicesOwn>;

export type ICCSPlayerController_InventoryServices = Prefixed<"CCSPlayerController_InventoryServices", _CCSPlayerController_InventoryServicesOwn>;

export type ICCSPlayerPawn = Prefixed<"CCSPlayerPawn",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CCSPlayer_ActionTrackingServices", _CCSPlayer_ActionTrackingServices> &
	Prefixed<"CCSPlayer_AimPunchServices", _CCSPlayer_AimPunchServices> &
	Prefixed<"CCSPlayer_BulletServices", _CCSPlayer_BulletServices> &
	Prefixed<"CCSPlayer_BuyServices", _CCSPlayer_BuyServices> &
	Prefixed<"CCSPlayer_CameraServices", _CCSPlayer_CameraServices> &
	Prefixed<"CCSPlayer_HostageServices", _CCSPlayer_HostageServices> &
	Prefixed<"CCSPlayer_ItemServices", _CCSPlayer_ItemServices> &
	Prefixed<"CCSPlayer_MovementServices", _CCSPlayer_MovementServices> &
	Prefixed<"CCSPlayer_PingServices", _CCSPlayer_PingServices> &
	Prefixed<"CCSPlayer_WeaponServices", _CCSPlayer_WeaponServices> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CCSPlayerPawnOwn
>;

export type ICCSPlayerPawnBase = Prefixed<"CCSPlayerPawnBase",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CCSPlayer_PingServices", _CCSPlayer_PingServices> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	Prefixed<"CPlayer_CameraServices", _CPlayer_CameraServices> &
	_CCSObserverPawnOwn
>;

export type ICCSPlayerResource = Prefixed<"CCSPlayerResource", _CCSPlayerResourceOwn>;

export type ICCSTeam = Prefixed<"CCSTeam", _CCSTeamOwn>;

export type ICCSWeaponBaseGun = Prefixed<"CCSWeaponBaseGun",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICCSWeaponBaseShotgun = Prefixed<"CCSWeaponBaseShotgun",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CCSWeaponBaseShotgunOwn
>;

export type ICDamageRecord = Prefixed<"CDamageRecord", _CDamageRecordOwn>;

export type ICDEagle = Prefixed<"CDEagle",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICDecoyGrenade = Prefixed<"CDecoyGrenade",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CDecoyGrenadeOwn
>;

export type ICDecoyProjectile = Prefixed<"CDecoyProjectile",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CDecoyProjectileOwn
>;

export type ICDestructiblePartsComponent = Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponentOwn>;

export type ICDynamicLight = Prefixed<"CDynamicLight",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CDynamicLightOwn
>;

export type ICDynamicProp = Prefixed<"CDynamicProp",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CDynamicPropOwn
>;

export type ICEconEntity = Prefixed<"CEconEntity",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CEconEntityOwn
>;

export type ICEconItemAttribute = Prefixed<"CEconItemAttribute", _CEconItemAttributeOwn>;

export type ICEconWearable = Prefixed<"CEconWearable",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CEconEntityOwn
>;

export type ICEntityDissolve = Prefixed<"CEntityDissolve",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CEntityDissolveOwn
>;

export type ICEntityFlame = Prefixed<"CEntityFlame",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CEntityFlameOwn
>;

export type ICEntityIdentity = Prefixed<"CEntityIdentity", _CEntityIdentityOwn>;

export type ICEnvCombinedLightProbeVolume = Prefixed<"CEnvCombinedLightProbeVolume",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CEnvCombinedLightProbeVolumeOwn
>;

export type ICEnvCubemap = Prefixed<"CEnvCubemap",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CEnvCubemapOwn
>;

export type ICEnvCubemapBox = Prefixed<"CEnvCubemapBox",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CEnvCubemapOwn
>;

export type ICEnvCubemapFog = Prefixed<"CEnvCubemapFog",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CEnvCubemapFogOwn
>;

export type ICEnvDecal = Prefixed<"CEnvDecal",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CEnvDecalOwn
>;

export type ICEnvDetailController = Prefixed<"CEnvDetailController", _CEnvDetailControllerOwn>;

export type ICEnvLightProbeVolume = Prefixed<"CEnvLightProbeVolume",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CEnvLightProbeVolumeOwn
>;

export type ICEnvParticleGlow = Prefixed<"CEnvParticleGlow",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CEnvParticleGlowOwn
>;

export type ICEnvSky = Prefixed<"CEnvSky",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CEnvSkyOwn
>;

export type ICEnvVolumetricFogController = Prefixed<"CEnvVolumetricFogController",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CEnvVolumetricFogControllerOwn
>;

export type ICEnvVolumetricFogVolume = Prefixed<"CEnvVolumetricFogVolume",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CEnvVolumetricFogVolumeOwn
>;

export type ICEnvWind = Prefixed<"CEnvWind", _CEnvWindOwn>;

export type ICEnvWindController = Prefixed<"CEnvWindController",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CEnvWindControllerOwn
>;

export type ICEnvWindVolume = Prefixed<"CEnvWindVolume",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CEnvWindVolumeOwn
>;

export type ICFireCrackerBlast = Prefixed<"CFireCrackerBlast",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CFireCrackerBlastOwn
>;

export type ICFish = Prefixed<"CFish", _CFishOwn>;

export type ICFlashbang = Prefixed<"CFlashbang",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CDecoyGrenadeOwn
>;

export type ICFlashbangProjectile = Prefixed<"CFlashbangProjectile",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseCSGrenadeProjectileOwn
>;

export type ICFogController = Prefixed<"CFogController", _CFogControllerOwn>;

export type ICFootstepControl = Prefixed<"CFootstepControl",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CFootstepControlOwn
>;

export type ICFuncBrush = Prefixed<"CFuncBrush",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseModelEntityOwn
>;

export type ICFuncConveyor = Prefixed<"CFuncConveyor",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CFuncConveyorOwn
>;

export type ICFuncElectrifiedVolume = Prefixed<"CFuncElectrifiedVolume",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CFuncElectrifiedVolumeOwn
>;

export type ICFuncLadder = Prefixed<"CFuncLadder",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CFuncLadderOwn
>;

export type ICFuncMonitor = Prefixed<"CFuncMonitor",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CFuncMonitorOwn
>;

export type ICFuncMoveLinear = Prefixed<"CFuncMoveLinear",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CFuncMoveLinearOwn
>;

export type ICFuncMover = Prefixed<"CFuncMover",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseModelEntityOwn
>;

export type ICFuncRetakeBarrier = Prefixed<"CFuncRetakeBarrier",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CDynamicPropOwn
>;

export type ICFuncRotating = Prefixed<"CFuncRotating",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseModelEntityOwn
>;

export type ICFuncTrackTrain = Prefixed<"CFuncTrackTrain",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseModelEntityOwn
>;

export type ICFuncWater = Prefixed<"CFuncWater",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseModelEntityOwn
>;

export type ICGradientFog = Prefixed<"CGradientFog",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CGradientFogOwn
>;

export type ICHandleTest = Prefixed<"CHandleTest",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CHandleTestOwn
>;

export type ICHEGrenade = Prefixed<"CHEGrenade",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CDecoyGrenadeOwn
>;

export type ICHEGrenadeProjectile = Prefixed<"CHEGrenadeProjectile",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseCSGrenadeProjectileOwn
>;

export type ICHostage = Prefixed<"CHostage",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CHostageOwn
>;

export type ICHostageCarriableProp = Prefixed<"CHostageCarriableProp",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseAnimGraphOwn
>;

export type ICHostageRescueZone = Prefixed<"CHostageRescueZone",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseTriggerOwn
>;

export type ICIncendiaryGrenade = Prefixed<"CIncendiaryGrenade",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CDecoyGrenadeOwn
>;

export type ICInferno = Prefixed<"CInferno",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CFireCrackerBlastOwn
>;

export type ICInfoFan = Prefixed<"CInfoFan",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CInfoFanOwn
>;

export type ICInfoInstructorHintHostageRescueZone = Prefixed<"CInfoInstructorHintHostageRescueZone",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseEntityOwn
>;

export type ICInfoLadderDismount = Prefixed<"CInfoLadderDismount",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseEntityOwn
>;

export type ICInfoOffscreenPanoramaTexture = Prefixed<"CInfoOffscreenPanoramaTexture",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CInfoOffscreenPanoramaTextureOwn
>;

export type ICInfoVisibilityBox = Prefixed<"CInfoVisibilityBox",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CInfoVisibilityBoxOwn
>;

export type ICInfoWorldLayer = Prefixed<"CInfoWorldLayer",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CInfoWorldLayerOwn
>;

export type ICItem_Healthshot = Prefixed<"CItem_Healthshot",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CItem_HealthshotOwn
>;

export type ICItemDogtags = Prefixed<"CItemDogtags",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CItemDogtagsOwn
>;

export type ICKnife = Prefixed<"CKnife",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CKnifeOwn
>;

export type ICLightComponent = Prefixed<"CLightComponent", _CLightComponentOwn>;

export type ICLightDirectionalEntity = Prefixed<"CLightDirectionalEntity",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	Prefixed<"CLightComponent", _CLightComponent> &
	_CBaseModelEntityOwn
>;

export type ICLightEntity = Prefixed<"CLightEntity",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	Prefixed<"CLightComponent", _CLightComponent> &
	_CBaseModelEntityOwn
>;

export type ICLightEnvironmentEntity = Prefixed<"CLightEnvironmentEntity",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	Prefixed<"CLightComponent", _CLightComponent> &
	_CBaseModelEntityOwn
>;

export type ICLightOrthoEntity = Prefixed<"CLightOrthoEntity",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	Prefixed<"CLightComponent", _CLightComponent> &
	_CBaseModelEntityOwn
>;

export type ICLightSpotEntity = Prefixed<"CLightSpotEntity",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	Prefixed<"CLightComponent", _CLightComponent> &
	_CBaseModelEntityOwn
>;

export type ICMapVetoPickController = Prefixed<"CMapVetoPickController",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CMapVetoPickControllerOwn
>;

export type ICModelPointEntity = Prefixed<"CModelPointEntity",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseModelEntityOwn
>;

export type ICMolotovGrenade = Prefixed<"CMolotovGrenade",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CDecoyGrenadeOwn
>;

export type ICMolotovProjectile = Prefixed<"CMolotovProjectile",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CMolotovProjectileOwn
>;

export type ICOmniLight = Prefixed<"COmniLight",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_COmniLightOwn
>;

export type ICParticleSystem = Prefixed<"CParticleSystem",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CParticleSystemOwn
>;

export type ICPathNode = Prefixed<"CPathNode",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CPathNodeOwn
>;

export type ICPathParticleRope = Prefixed<"CPathParticleRope",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CPathParticleRopeOwn
>;

export type ICPathSimple = Prefixed<"CPathSimple",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CPathSimpleOwn
>;

export type ICPathWithDynamicNodes = Prefixed<"CPathWithDynamicNodes",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CPathWithDynamicNodesOwn
>;

export type ICPhysBox = Prefixed<"CPhysBox",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseModelEntityOwn
>;

export type ICPhysicsProp = Prefixed<"CPhysicsProp",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CPhysicsPropOwn
>;

export type ICPhysicsPropMultiplayer = Prefixed<"CPhysicsPropMultiplayer",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CPhysicsPropOwn
>;

export type ICPhysMagnet = Prefixed<"CPhysMagnet",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseAnimGraphOwn
>;

export type ICPlantedC4 = Prefixed<"CPlantedC4",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CPlantedC4Own
>;

export type ICPlayer_CameraServices = Prefixed<"CPlayer_CameraServices", _CPlayer_CameraServicesOwn>;

export type ICPlayerPing = Prefixed<"CPlayerPing",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CPlayerPingOwn
>;

export type ICPlayerSprayDecal = Prefixed<"CPlayerSprayDecal",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CPlayerSprayDecalOwn
>;

export type ICPlayerVisibility = Prefixed<"CPlayerVisibility",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CPlayerVisibilityOwn
>;

export type ICPointCamera = Prefixed<"CPointCamera",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CPointCameraOwn
>;

export type ICPointClientUIDialog = Prefixed<"CPointClientUIDialog",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CPointClientUIDialogOwn
>;

export type ICPointClientUIWorldPanel = Prefixed<"CPointClientUIWorldPanel",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CPointClientUIWorldPanelOwn
>;

export type ICPointClientUIWorldTextPanel = Prefixed<"CPointClientUIWorldTextPanel",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CPointClientUIWorldTextPanelOwn
>;

export type ICPointCommentaryNode = Prefixed<"CPointCommentaryNode",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CPointCommentaryNodeOwn
>;

export type ICPointEntity = Prefixed<"CPointEntity",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseEntityOwn
>;

export type ICPointOrient = Prefixed<"CPointOrient",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseEntityOwn
>;

export type ICPointValueRemapper = Prefixed<"CPointValueRemapper",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CPointValueRemapperOwn
>;

export type ICPointWorldText = Prefixed<"CPointWorldText",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CPointWorldTextOwn
>;

export type ICPostProcessingVolume = Prefixed<"CPostProcessingVolume",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CPostProcessingVolumeOwn
>;

export type ICPrecipitation = Prefixed<"CPrecipitation",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseTriggerOwn
>;

export type ICPrecipitationBlocker = Prefixed<"CPrecipitationBlocker",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseModelEntityOwn
>;

export type ICPropDoorRotating = Prefixed<"CPropDoorRotating",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CPropDoorRotatingOwn
>;

export type ICPulseGameBlackboard = Prefixed<"CPulseGameBlackboard",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CPulseGameBlackboardOwn
>;

export type ICRagdollManager = Prefixed<"CRagdollManager", _CRagdollManagerOwn>;

export type ICRagdollProp = Prefixed<"CRagdollProp",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CRagdollPropOwn
>;

export type ICRagdollPropAttached = Prefixed<"CRagdollPropAttached",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CRagdollPropAttachedOwn
>;

export type ICRectLight = Prefixed<"CRectLight",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CRectLightOwn
>;

export type ICRopeKeyframe = Prefixed<"CRopeKeyframe",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	_CRopeKeyframeOwn
>;

export type ICSceneEntity = Prefixed<"CSceneEntity",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CSceneEntityOwn
>;

export type ICShatterGlassShardPhysics = Prefixed<"CShatterGlassShardPhysics",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CShatterGlassShardPhysicsOwn
>;

export type ICSkyCamera = Prefixed<"CSkyCamera",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CSkyCameraOwn
>;

export type ICSmokeGrenade = Prefixed<"CSmokeGrenade",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CDecoyGrenadeOwn
>;

export type ICSmokeGrenadeProjectile = Prefixed<"CSmokeGrenadeProjectile",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CSmokeGrenadeProjectileOwn
>;

export type ICSoundAreaEntityOrientedBox = Prefixed<"CSoundAreaEntityOrientedBox",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CSoundAreaEntityOrientedBoxOwn
>;

export type ICSoundAreaEntitySphere = Prefixed<"CSoundAreaEntitySphere",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CSoundAreaEntitySphereOwn
>;

export type ICSoundEventAABBEntity = Prefixed<"CSoundEventAABBEntity",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CSoundEventAABBEntityOwn
>;

export type ICSoundEventConeEntity = Prefixed<"CSoundEventConeEntity",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseEntityOwn
>;

export type ICSoundEventEntity = Prefixed<"CSoundEventEntity",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseEntityOwn
>;

export type ICSoundEventOBBEntity = Prefixed<"CSoundEventOBBEntity",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CSoundEventAABBEntityOwn
>;

export type ICSoundEventPathCornerEntity = Prefixed<"CSoundEventPathCornerEntity",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CSoundEventPathCornerEntityOwn
>;

export type ICSoundEventSphereEntity = Prefixed<"CSoundEventSphereEntity",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CSoundEventSphereEntityOwn
>;

export type ICSoundOpvarSetAABBEntity = Prefixed<"CSoundOpvarSetAABBEntity",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CSoundOpvarSetAABBEntityOwn
>;

export type ICSoundOpvarSetAutoRoomEntity = Prefixed<"CSoundOpvarSetAutoRoomEntity",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CSoundOpvarSetAABBEntityOwn
>;

export type ICSoundOpvarSetOBBEntity = Prefixed<"CSoundOpvarSetOBBEntity",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CSoundOpvarSetAABBEntityOwn
>;

export type ICSoundOpvarSetOBBWindEntity = Prefixed<"CSoundOpvarSetOBBWindEntity",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CSoundOpvarSetAABBEntityOwn
>;

export type ICSoundOpvarSetPathCornerEntity = Prefixed<"CSoundOpvarSetPathCornerEntity",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CSoundOpvarSetAABBEntityOwn
>;

export type ICSoundOpvarSetPointBase = Prefixed<"CSoundOpvarSetPointBase",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CSoundOpvarSetAABBEntityOwn
>;

export type ICSoundOpvarSetPointEntity = Prefixed<"CSoundOpvarSetPointEntity",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CSoundOpvarSetAABBEntityOwn
>;

export type ICSPerRoundStats_t = Prefixed<"CSPerRoundStats_t", _CSPerRoundStats_tOwn>;

export type ICSpotlightEnd = Prefixed<"CSpotlightEnd",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CSpotlightEndOwn
>;

export type ICSprite = Prefixed<"CSprite",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CSpriteOwn
>;

export type ICSpriteOriented = Prefixed<"CSpriteOriented",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CSpriteOwn
>;

export type ICTeam = Prefixed<"CTeam", _CTeamOwn>;

export type ICTextureBasedAnimatable = Prefixed<"CTextureBasedAnimatable",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CTextureBasedAnimatableOwn
>;

export type ICTonemapController2 = Prefixed<"CTonemapController2",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CTonemapController2Own
>;

export type ICTriggerBuoyancy = Prefixed<"CTriggerBuoyancy",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CTriggerBuoyancyOwn
>;

export type ICTriggerFan = Prefixed<"CTriggerFan",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CTriggerFanOwn
>;

export type ICTriggerPhysics = Prefixed<"CTriggerPhysics",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CTriggerPhysicsOwn
>;

export type ICTriggerVolume = Prefixed<"CTriggerVolume",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseModelEntityOwn
>;

export type ICVoteController = Prefixed<"CVoteController",
	Prefixed<"CBodyComponentPoint", _CBodyComponentPoint> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CVoteControllerOwn
>;

export type ICWaterBullet = Prefixed<"CWaterBullet",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseAnimGraphOwn
>;

export type ICWeaponAug = Prefixed<"CWeaponAug",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICWeaponAWP = Prefixed<"CWeaponAWP",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICWeaponBizon = Prefixed<"CWeaponBizon",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICWeaponCZ75a = Prefixed<"CWeaponCZ75a",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CWeaponCZ75aOwn
>;

export type ICWeaponElite = Prefixed<"CWeaponElite",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICWeaponFamas = Prefixed<"CWeaponFamas",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICWeaponFiveSeven = Prefixed<"CWeaponFiveSeven",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICWeaponG3SG1 = Prefixed<"CWeaponG3SG1",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICWeaponGalilAR = Prefixed<"CWeaponGalilAR",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICWeaponGlock = Prefixed<"CWeaponGlock",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICWeaponHKP2000 = Prefixed<"CWeaponHKP2000",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICWeaponM249 = Prefixed<"CWeaponM249",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICWeaponM4A1 = Prefixed<"CWeaponM4A1",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICWeaponM4A1Silencer = Prefixed<"CWeaponM4A1Silencer",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICWeaponMAC10 = Prefixed<"CWeaponMAC10",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICWeaponMag7 = Prefixed<"CWeaponMag7",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICWeaponMP5SD = Prefixed<"CWeaponMP5SD",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICWeaponMP7 = Prefixed<"CWeaponMP7",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICWeaponMP9 = Prefixed<"CWeaponMP9",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICWeaponNegev = Prefixed<"CWeaponNegev",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICWeaponNOVA = Prefixed<"CWeaponNOVA",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CCSWeaponBaseShotgunOwn
>;

export type ICWeaponP250 = Prefixed<"CWeaponP250",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICWeaponP90 = Prefixed<"CWeaponP90",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICWeaponRevolver = Prefixed<"CWeaponRevolver",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICWeaponSawedoff = Prefixed<"CWeaponSawedoff",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CCSWeaponBaseShotgunOwn
>;

export type ICWeaponSCAR20 = Prefixed<"CWeaponSCAR20",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICWeaponSG556 = Prefixed<"CWeaponSG556",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICWeaponSSG08 = Prefixed<"CWeaponSSG08",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICWeaponTaser = Prefixed<"CWeaponTaser",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CWeaponTaserOwn
>;

export type ICWeaponTec9 = Prefixed<"CWeaponTec9",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICWeaponUMP45 = Prefixed<"CWeaponUMP45",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICWeaponUSPSilencer = Prefixed<"CWeaponUSPSilencer",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CAK47Own
>;

export type ICWeaponXM1014 = Prefixed<"CWeaponXM1014",
	Prefixed<"CBodyComponentBaseAnimGraph", _CBodyComponentBaseAnimGraph> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CCSWeaponBaseShotgunOwn
>;

export type ICWorld = Prefixed<"CWorld",
	Prefixed<"CBodyComponentBaseModelEntity", _CBodyComponentBaseModelEntity> &
	Prefixed<"CDestructiblePartsComponent", _CDestructiblePartsComponent> &
	Prefixed<"CEntityIdentity", _CEntityIdentity> &
	_CBaseModelEntityOwn
>;

export type IEntityRenderAttribute_t = Prefixed<"EntityRenderAttribute_t", _EntityRenderAttribute_tOwn>;

export type IHUDPanelDialogVariableString_t = Prefixed<"HUDPanelDialogVariableString_t", _HUDPanelDialogVariableString_tOwn>;

export type IHUDPanelHasClass_t = Prefixed<"HUDPanelHasClass_t", _HUDPanelHasClass_tOwn>;

export type ISellbackPurchaseEntry_t = Prefixed<"SellbackPurchaseEntry_t", _SellbackPurchaseEntry_tOwn>;

export type IServerAuthoritativeWeaponSlot_t = Prefixed<"ServerAuthoritativeWeaponSlot_t", _ServerAuthoritativeWeaponSlot_tOwn>;

export type ISoundeventPathCornerPairNetworked_t = Prefixed<"SoundeventPathCornerPairNetworked_t", _SoundeventPathCornerPairNetworked_tOwn>;

export type IViewAngleServerChange_t = Prefixed<"ViewAngleServerChange_t", _ViewAngleServerChange_tOwn>;

export type IWeaponPurchaseCount_t = Prefixed<"WeaponPurchaseCount_t", _WeaponPurchaseCount_tOwn>;

/** Maps entity className to its typed properties interface */
export interface EntityTypeMap {
	AnimGraph2SerializedPoseRecipeSlot_t: IAnimGraph2SerializedPoseRecipeSlot_t;
	CAK47: ICAK47;
	CBarnLight: ICBarnLight;
	CBaseAnimGraph: ICBaseAnimGraph;
	CBaseButton: ICBaseButton;
	CBaseCombatCharacter: ICBaseCombatCharacter;
	CBaseCSGrenadeProjectile: ICBaseCSGrenadeProjectile;
	CBaseDoor: ICBaseDoor;
	CBaseEntity: ICBaseEntity;
	CBaseGrenade: ICBaseGrenade;
	CBaseModelEntity: ICBaseModelEntity;
	CBasePlayerController: ICBasePlayerController;
	CBasePlayerPawn: ICBasePlayerPawn;
	CBasePlayerWeapon: ICBasePlayerWeapon;
	CBaseToggle: ICBaseToggle;
	CBaseTrigger: ICBaseTrigger;
	CBeam: ICBeam;
	CBodyComponentBaseAnimGraph: ICBodyComponentBaseAnimGraph;
	CBodyComponentBaseModelEntity: ICBodyComponentBaseModelEntity;
	CBodyComponentPoint: ICBodyComponentPoint;
	CBombTarget: ICBombTarget;
	CBreakable: ICBreakable;
	CBreakableProp: ICBreakableProp;
	CC4: ICC4;
	CCashStack: ICCashStack;
	CChicken: ICChicken;
	CCitadelSoundOpvarSetOBB: ICCitadelSoundOpvarSetOBB;
	CColorCorrection: ICColorCorrection;
	CColorCorrectionVolume: ICColorCorrectionVolume;
	CCSCustomHudLayout: ICCSCustomHudLayout;
	CCSCustomHudLayoutState: ICCSCustomHudLayoutState;
	CCSCustomPlayerCamera: ICCSCustomPlayerCamera;
	CCSGameModeRules_ArmsRace: ICCSGameModeRules_ArmsRace;
	CCSGameModeRules_Deathmatch: ICCSGameModeRules_Deathmatch;
	CCSGameRules: ICCSGameRules;
	CCSGameRulesProxy: ICCSGameRulesProxy;
	CCSGO_EndOfMatchLineupEnd: ICCSGO_EndOfMatchLineupEnd;
	CCSGO_EndOfMatchLineupStart: ICCSGO_EndOfMatchLineupStart;
	CCSGO_TeamIntroCounterTerroristPosition: ICCSGO_TeamIntroCounterTerroristPosition;
	CCSGO_TeamIntroTerroristPosition: ICCSGO_TeamIntroTerroristPosition;
	CCSGO_TeamSelectCounterTerroristPosition: ICCSGO_TeamSelectCounterTerroristPosition;
	CCSGO_TeamSelectTerroristPosition: ICCSGO_TeamSelectTerroristPosition;
	CCSGO_WingmanIntroCounterTerroristPosition: ICCSGO_WingmanIntroCounterTerroristPosition;
	CCSGO_WingmanIntroTerroristPosition: ICCSGO_WingmanIntroTerroristPosition;
	CCSMinimapBoundary: ICCSMinimapBoundary;
	CCSObserver_CameraServices: ICCSObserver_CameraServices;
	CCSObserver_MovementServices: ICCSObserver_MovementServices;
	CCSObserver_ObserverServices: ICCSObserver_ObserverServices;
	CCSObserverPawn: ICCSObserverPawn;
	CCSPetPlacement: ICCSPetPlacement;
	CCSPlayer_ActionTrackingServices: ICCSPlayer_ActionTrackingServices;
	CCSPlayer_AimPunchServices: ICCSPlayer_AimPunchServices;
	CCSPlayer_BulletServices: ICCSPlayer_BulletServices;
	CCSPlayer_BuyServices: ICCSPlayer_BuyServices;
	CCSPlayer_CameraServices: ICCSPlayer_CameraServices;
	CCSPlayer_HostageServices: ICCSPlayer_HostageServices;
	CCSPlayer_ItemServices: ICCSPlayer_ItemServices;
	CCSPlayer_MovementServices: ICCSPlayer_MovementServices;
	CCSPlayer_PingServices: ICCSPlayer_PingServices;
	CCSPlayer_WeaponServices: ICCSPlayer_WeaponServices;
	CCSPlayerCamera: ICCSPlayerCamera;
	CCSPlayerController: ICCSPlayerController;
	CCSPlayerController_ActionTrackingServices: ICCSPlayerController_ActionTrackingServices;
	CCSPlayerController_DamageServices: ICCSPlayerController_DamageServices;
	CCSPlayerController_InGameMoneyServices: ICCSPlayerController_InGameMoneyServices;
	CCSPlayerController_InventoryServices: ICCSPlayerController_InventoryServices;
	CCSPlayerPawn: ICCSPlayerPawn;
	CCSPlayerPawnBase: ICCSPlayerPawnBase;
	CCSPlayerResource: ICCSPlayerResource;
	CCSTeam: ICCSTeam;
	CCSWeaponBaseGun: ICCSWeaponBaseGun;
	CCSWeaponBaseShotgun: ICCSWeaponBaseShotgun;
	CDamageRecord: ICDamageRecord;
	CDEagle: ICDEagle;
	CDecoyGrenade: ICDecoyGrenade;
	CDecoyProjectile: ICDecoyProjectile;
	CDestructiblePartsComponent: ICDestructiblePartsComponent;
	CDynamicLight: ICDynamicLight;
	CDynamicProp: ICDynamicProp;
	CEconEntity: ICEconEntity;
	CEconItemAttribute: ICEconItemAttribute;
	CEconWearable: ICEconWearable;
	CEntityDissolve: ICEntityDissolve;
	CEntityFlame: ICEntityFlame;
	CEntityIdentity: ICEntityIdentity;
	CEnvCombinedLightProbeVolume: ICEnvCombinedLightProbeVolume;
	CEnvCubemap: ICEnvCubemap;
	CEnvCubemapBox: ICEnvCubemapBox;
	CEnvCubemapFog: ICEnvCubemapFog;
	CEnvDecal: ICEnvDecal;
	CEnvDetailController: ICEnvDetailController;
	CEnvLightProbeVolume: ICEnvLightProbeVolume;
	CEnvParticleGlow: ICEnvParticleGlow;
	CEnvSky: ICEnvSky;
	CEnvVolumetricFogController: ICEnvVolumetricFogController;
	CEnvVolumetricFogVolume: ICEnvVolumetricFogVolume;
	CEnvWind: ICEnvWind;
	CEnvWindController: ICEnvWindController;
	CEnvWindVolume: ICEnvWindVolume;
	CFireCrackerBlast: ICFireCrackerBlast;
	CFish: ICFish;
	CFlashbang: ICFlashbang;
	CFlashbangProjectile: ICFlashbangProjectile;
	CFogController: ICFogController;
	CFootstepControl: ICFootstepControl;
	CFuncBrush: ICFuncBrush;
	CFuncConveyor: ICFuncConveyor;
	CFuncElectrifiedVolume: ICFuncElectrifiedVolume;
	CFuncLadder: ICFuncLadder;
	CFuncMonitor: ICFuncMonitor;
	CFuncMoveLinear: ICFuncMoveLinear;
	CFuncMover: ICFuncMover;
	CFuncRetakeBarrier: ICFuncRetakeBarrier;
	CFuncRotating: ICFuncRotating;
	CFuncTrackTrain: ICFuncTrackTrain;
	CFuncWater: ICFuncWater;
	CGradientFog: ICGradientFog;
	CHandleTest: ICHandleTest;
	CHEGrenade: ICHEGrenade;
	CHEGrenadeProjectile: ICHEGrenadeProjectile;
	CHostage: ICHostage;
	CHostageCarriableProp: ICHostageCarriableProp;
	CHostageRescueZone: ICHostageRescueZone;
	CIncendiaryGrenade: ICIncendiaryGrenade;
	CInferno: ICInferno;
	CInfoFan: ICInfoFan;
	CInfoInstructorHintHostageRescueZone: ICInfoInstructorHintHostageRescueZone;
	CInfoLadderDismount: ICInfoLadderDismount;
	CInfoOffscreenPanoramaTexture: ICInfoOffscreenPanoramaTexture;
	CInfoVisibilityBox: ICInfoVisibilityBox;
	CInfoWorldLayer: ICInfoWorldLayer;
	CItem_Healthshot: ICItem_Healthshot;
	CItemDogtags: ICItemDogtags;
	CKnife: ICKnife;
	CLightComponent: ICLightComponent;
	CLightDirectionalEntity: ICLightDirectionalEntity;
	CLightEntity: ICLightEntity;
	CLightEnvironmentEntity: ICLightEnvironmentEntity;
	CLightOrthoEntity: ICLightOrthoEntity;
	CLightSpotEntity: ICLightSpotEntity;
	CMapVetoPickController: ICMapVetoPickController;
	CModelPointEntity: ICModelPointEntity;
	CMolotovGrenade: ICMolotovGrenade;
	CMolotovProjectile: ICMolotovProjectile;
	COmniLight: ICOmniLight;
	CParticleSystem: ICParticleSystem;
	CPathNode: ICPathNode;
	CPathParticleRope: ICPathParticleRope;
	CPathSimple: ICPathSimple;
	CPathWithDynamicNodes: ICPathWithDynamicNodes;
	CPhysBox: ICPhysBox;
	CPhysicsProp: ICPhysicsProp;
	CPhysicsPropMultiplayer: ICPhysicsPropMultiplayer;
	CPhysMagnet: ICPhysMagnet;
	CPlantedC4: ICPlantedC4;
	CPlayer_CameraServices: ICPlayer_CameraServices;
	CPlayerPing: ICPlayerPing;
	CPlayerSprayDecal: ICPlayerSprayDecal;
	CPlayerVisibility: ICPlayerVisibility;
	CPointCamera: ICPointCamera;
	CPointClientUIDialog: ICPointClientUIDialog;
	CPointClientUIWorldPanel: ICPointClientUIWorldPanel;
	CPointClientUIWorldTextPanel: ICPointClientUIWorldTextPanel;
	CPointCommentaryNode: ICPointCommentaryNode;
	CPointEntity: ICPointEntity;
	CPointOrient: ICPointOrient;
	CPointValueRemapper: ICPointValueRemapper;
	CPointWorldText: ICPointWorldText;
	CPostProcessingVolume: ICPostProcessingVolume;
	CPrecipitation: ICPrecipitation;
	CPrecipitationBlocker: ICPrecipitationBlocker;
	CPropDoorRotating: ICPropDoorRotating;
	CPulseGameBlackboard: ICPulseGameBlackboard;
	CRagdollManager: ICRagdollManager;
	CRagdollProp: ICRagdollProp;
	CRagdollPropAttached: ICRagdollPropAttached;
	CRectLight: ICRectLight;
	CRopeKeyframe: ICRopeKeyframe;
	CSceneEntity: ICSceneEntity;
	CShatterGlassShardPhysics: ICShatterGlassShardPhysics;
	CSkyCamera: ICSkyCamera;
	CSmokeGrenade: ICSmokeGrenade;
	CSmokeGrenadeProjectile: ICSmokeGrenadeProjectile;
	CSoundAreaEntityOrientedBox: ICSoundAreaEntityOrientedBox;
	CSoundAreaEntitySphere: ICSoundAreaEntitySphere;
	CSoundEventAABBEntity: ICSoundEventAABBEntity;
	CSoundEventConeEntity: ICSoundEventConeEntity;
	CSoundEventEntity: ICSoundEventEntity;
	CSoundEventOBBEntity: ICSoundEventOBBEntity;
	CSoundEventPathCornerEntity: ICSoundEventPathCornerEntity;
	CSoundEventSphereEntity: ICSoundEventSphereEntity;
	CSoundOpvarSetAABBEntity: ICSoundOpvarSetAABBEntity;
	CSoundOpvarSetAutoRoomEntity: ICSoundOpvarSetAutoRoomEntity;
	CSoundOpvarSetOBBEntity: ICSoundOpvarSetOBBEntity;
	CSoundOpvarSetOBBWindEntity: ICSoundOpvarSetOBBWindEntity;
	CSoundOpvarSetPathCornerEntity: ICSoundOpvarSetPathCornerEntity;
	CSoundOpvarSetPointBase: ICSoundOpvarSetPointBase;
	CSoundOpvarSetPointEntity: ICSoundOpvarSetPointEntity;
	CSPerRoundStats_t: ICSPerRoundStats_t;
	CSpotlightEnd: ICSpotlightEnd;
	CSprite: ICSprite;
	CSpriteOriented: ICSpriteOriented;
	CTeam: ICTeam;
	CTextureBasedAnimatable: ICTextureBasedAnimatable;
	CTonemapController2: ICTonemapController2;
	CTriggerBuoyancy: ICTriggerBuoyancy;
	CTriggerFan: ICTriggerFan;
	CTriggerPhysics: ICTriggerPhysics;
	CTriggerVolume: ICTriggerVolume;
	CVoteController: ICVoteController;
	CWaterBullet: ICWaterBullet;
	CWeaponAug: ICWeaponAug;
	CWeaponAWP: ICWeaponAWP;
	CWeaponBizon: ICWeaponBizon;
	CWeaponCZ75a: ICWeaponCZ75a;
	CWeaponElite: ICWeaponElite;
	CWeaponFamas: ICWeaponFamas;
	CWeaponFiveSeven: ICWeaponFiveSeven;
	CWeaponG3SG1: ICWeaponG3SG1;
	CWeaponGalilAR: ICWeaponGalilAR;
	CWeaponGlock: ICWeaponGlock;
	CWeaponHKP2000: ICWeaponHKP2000;
	CWeaponM249: ICWeaponM249;
	CWeaponM4A1: ICWeaponM4A1;
	CWeaponM4A1Silencer: ICWeaponM4A1Silencer;
	CWeaponMAC10: ICWeaponMAC10;
	CWeaponMag7: ICWeaponMag7;
	CWeaponMP5SD: ICWeaponMP5SD;
	CWeaponMP7: ICWeaponMP7;
	CWeaponMP9: ICWeaponMP9;
	CWeaponNegev: ICWeaponNegev;
	CWeaponNOVA: ICWeaponNOVA;
	CWeaponP250: ICWeaponP250;
	CWeaponP90: ICWeaponP90;
	CWeaponRevolver: ICWeaponRevolver;
	CWeaponSawedoff: ICWeaponSawedoff;
	CWeaponSCAR20: ICWeaponSCAR20;
	CWeaponSG556: ICWeaponSG556;
	CWeaponSSG08: ICWeaponSSG08;
	CWeaponTaser: ICWeaponTaser;
	CWeaponTec9: ICWeaponTec9;
	CWeaponUMP45: ICWeaponUMP45;
	CWeaponUSPSilencer: ICWeaponUSPSilencer;
	CWeaponXM1014: ICWeaponXM1014;
	CWorld: ICWorld;
	EntityRenderAttribute_t: IEntityRenderAttribute_t;
	HUDPanelDialogVariableString_t: IHUDPanelDialogVariableString_t;
	HUDPanelHasClass_t: IHUDPanelHasClass_t;
	SellbackPurchaseEntry_t: ISellbackPurchaseEntry_t;
	ServerAuthoritativeWeaponSlot_t: IServerAuthoritativeWeaponSlot_t;
	SoundeventPathCornerPairNetworked_t: ISoundeventPathCornerPairNetworked_t;
	ViewAngleServerChange_t: IViewAngleServerChange_t;
	WeaponPurchaseCount_t: IWeaponPurchaseCount_t;
}

/** Base entity shape used at runtime */
export interface BaseEntity {
	className: string;
	classId: number;
	entityType: number;
	properties: Record<string, unknown>;
}

/** All known entity class names */
export type KnownClassName = keyof EntityTypeMap;

/** Get typed properties for a known entity class name */
export type EntityProperties<T extends KnownClassName> = Partial<EntityTypeMap[T]>;

/**
 * Typed entity wrapper — narrows to a specific known className.
 *
 * With no type argument, distributes over every known className, producing a
 * discriminated union suitable for narrowing on `entity.className`.
 *
 * @example
 * type Controller = TypedEntity<'CCSPlayerController'>;
 * type AnyKnown = TypedEntity; // discriminated union of all known classes
 */
export type TypedEntity<K extends KnownClassName = KnownClassName> = K extends KnownClassName
	? { className: K; classId: number; entityType: number; properties: Partial<EntityTypeMap[K]> }
	: never;

/**
 * Any entity slot — a known {@link TypedEntity} when className is in {@link EntityTypeMap},
 * or {@link BaseEntity} for classes outside the generated map.
 */
export type AnyEntity = TypedEntity | BaseEntity;

/** Narrow an entity slot to a specific typed entity */
export function isEntityClass<T extends KnownClassName>(
	entity: AnyEntity | undefined,
	className: T
): entity is TypedEntity<T> {
	return entity?.className === className;
}
