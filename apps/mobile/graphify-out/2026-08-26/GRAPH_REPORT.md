# Graph Report - mobile  (2026-08-26)

## Corpus Check
- 454 files · ~640,068 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2032 nodes · 4845 edges · 167 communities (98 shown, 69 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.61)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `db8fb69b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- apartment/[apartmentId]/index.tsx
- ScreenWrapper.tsx
- useTheme.ts
- ratings/index.ts
- dashboard.tsx
- upload.tsx
- useConversations.test.tsx
- useFavorites
- useApartmentFormStore
- ScreenWrapper
- devDependencies
- expo
- expo-router
- review-information.tsx
- privateMediaResolver.ts
- paymentService.ts
- saved-methods/index.tsx
- ai-search.tsx
- usePersonalizationStore.ts
- notificationService.ts
- useVerificationStore
- chatService.ts
- [conversationId].tsx
- auth/index.ts
- usePayoutDestinations.ts
- paths
- notifications/index.ts
- payment/index.tsx
- apartments/index.ts
- landlordService.ts
- description/index.tsx
- tenant-applications/index.tsx
- useColors
- upload-id.tsx
- live-capture.tsx
- manage-apartment/[apartmentId]/index.tsx
- units.tsx
- useFrameQualityCheck.ts
- dependencies
- app/_layout.tsx
- queryClient.ts
- payments/index.ts
- history/index.tsx
- paymongoService.ts
- edit-main.tsx
- audit-fix.characterization.test.ts
- applications/index.ts
- visit-requests/index.tsx
- (landlord)/profile.tsx
- ApplicationList.tsx
- useTenancyRealtime.ts
- document-id/index.tsx
- third-process.tsx
- useTenancy
- useChatChannel.ts
- chatService.pagination.test.ts
- sign-in.tsx
- rentals.tsx
- pending.tsx
- RescheduleSheet.tsx
- useApplicationFormStore.ts
- useProfile
- useInAppNotificationBanner.tsx
- onboarding.tsx
- applications/[applicationId].tsx
- ChatBubble.tsx
- useLandlordActionBadges
- fifth-step.tsx
- DocumentRow.tsx
- useLandlordPayments.ts
- captureSequences.ts
- useSubmitApplication.ts
- useCurrentUser.ts
- TabBar.tsx
- live-capture.test.tsx
- tenantApplicationsService.ts
- reset-password.tsx
- upload-id.test.tsx
- tenant-applications/[applicationId].tsx
- useTenancyRealtime.test.ts
- second-step.tsx
- NotificationToast.tsx
- usePublishApartment.ts
- (tenant)/chat.tsx
- maintenance-requests/[requestId].tsx
- useDocumentUrls.ts
- metro.config.js
- Welcome to your Expo app 👋
- playground.tsx
- uniwind-types.d.ts
- ReviewField.tsx
- StatusPill.tsx
- eslint.config.js
- emoji-regex-xs
- expo
- expo-crypto
- expo-dev-client
- expo-device
- expo-document-picker
- expo-file-system
- expo-font
- expo-haptics
- expo-image
- expo-image-manipulator
- expo-image-picker
- expo-linear-gradient
- expo-linking
- @expo/metro-config
- @expo/metro-runtime
- expo-notifications
- expo-splash-screen
- expo-status-bar
- expo-symbols
- expo-system-ui
- @expo/vector-icons
- expo-video
- expo-video-thumbnails
- expo-web-browser
- @giphy/react-native-sdk
- @gorhom/bottom-sheet
- @gorhom/portal
- heroui-native
- lucide-react-native
- @maplibre/maplibre-react-native
- @miblanchard/react-native-slider
- @ptomasroos/react-native-multi-slider
- react
- react-dom
- react-native
- @react-native-async-storage/async-storage
- react-native-awesome-gallery
- react-native-calendars
- conversationService.test.ts
- @react-native-community/slider
- react-native-gifted-charts
- react-native-image-viewing
- react-native-reanimated
- react-native-safe-area-context
- react-native-screens
- react-native-svg
- react-native-web
- react-native-webview
- react-native-worklets
- @react-navigation/bottom-tabs
- @react-navigation/elements
- @react-navigation/native
- @react-navigation/native-stack
- @repo/constants
- @repo/hooks
- @repo/utils
- rn-emoji-keyboard
- @tabler/icons-react-native
- tailwind-merge
- tailwind-variants
- @tanstack/react-query
- uniwind
- zustand
- CR80_ASPECT_RATIO
- useImageUpload.ts
- expo-camera

## God Nodes (most connected - your core abstractions)
1. `useColors()` - 330 edges
2. `expo-router` - 136 edges
3. `ScreenWrapper` - 105 edges
4. `StandardHeader()` - 57 edges
5. `useCurrentUser()` - 48 edges
6. `useProfile()` - 46 edges
7. `useApartmentDetails()` - 23 edges
8. `useTenancy()` - 20 edges
9. `resolvePrivateMediaUrls()` - 20 edges
10. `createMobileQueryClient()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `ResetPassword()` --calls--> `useColors()`  [EXTRACTED]
  app/(auth)/forgot-password/reset-password.tsx → hooks/useTheme.ts
- `CaptureStepSummary()` --calls--> `useColors()`  [EXTRACTED]
  app/(auth)/verify-account/upload-id.tsx → hooks/useTheme.ts
- `ThirdProcess()` --calls--> `useApplicationFormStore`  [EXTRACTED]
  app/apartment/[apartmentId]/apply/third-process.tsx → stores/useApplicationFormStore.ts
- `Upload()` --calls--> `useColors()`  [EXTRACTED]
  app/document-id/upload.tsx → hooks/useTheme.ts
- `AnalyticsScreen()` --calls--> `useColors()`  [EXTRACTED]
  app/landlord/analytics.tsx → hooks/useTheme.ts

## Import Cycles
- 2-file cycle: `hooks/applications/index.ts -> hooks/applications/useApplicationActions.ts -> hooks/applications/index.ts`
- 2-file cycle: `hooks/applications/index.ts -> service/applications/tenantApplicationsService.ts -> hooks/applications/index.ts`
- 3-file cycle: `hooks/payments/index.ts -> hooks/payments/usePayments.ts -> service/payments/paymentService.ts -> hooks/payments/index.ts`
- 3-file cycle: `hooks/applications/index.ts -> hooks/applications/useTenantApplications.ts -> service/applications/tenantApplicationsService.ts -> hooks/applications/index.ts`

## Communities (167 total, 69 thin omitted)

### Community 0 - "apartment/[apartmentId]/index.tsx"
Cohesion: 0.09
Nodes (20): ApartmentSkeleton(), ApartmentDescriptionSection(), ApartmentDescriptionSectionProps, LandlordSection(), LandlordSectionProps, LeaseAgreementSection(), LeaseAgreementSectionProps, DEFAULT_COORDS (+12 more)

### Community 1 - "ScreenWrapper.tsx"
Cohesion: 0.07
Nodes (21): DEFAULT_COORDS, DirectionMode, MAP_STYLE, DOCUMENT_TYPE_ICONS, AnalyticsScreen(), MAX_AMOUNT, monthlyData, stats (+13 more)

### Community 2 - "useTheme.ts"
Cohesion: 0.14
Nodes (13): SORT_OPTIONS, TODO: Implement function to handle report landlord, TODO: Implement function to handle report tenant, PastApartmentCard(), PastApartmentCardProps, ProfileStat, ProfileStatsCard(), ProfileStatsCardProps (+5 more)

### Community 3 - "ratings/index.ts"
Cohesion: 0.08
Nodes (38): RatingsPage(), ReviewsPage(), PublicLandlordProfile(), PublicTenantProfile(), getPublicLandlordProfileQueryKey(), usePublicLandlordProfile(), getPublicTenantProfileQueryKey(), usePublicTenantProfile() (+30 more)

### Community 4 - "dashboard.tsx"
Cohesion: 0.06
Nodes (40): DashboardSkeleton(), chartLabel(), ProfitByPropertyCard(), ProfitByPropertyCardProps, BUILDERS, ChartDatum, FilterOption, filterOptions (+32 more)

### Community 5 - "upload.tsx"
Cohesion: 0.23
Nodes (10): TODO: Persist the uploaded document to Supabase Storage and store its, Upload(), ACCEPTED_FILE_TYPES, UploadDocumentField(), UploadDocumentFieldProps, UploadedDocument, UploadImageField(), UploadImageFieldProps (+2 more)

### Community 6 - "useConversations.test.tsx"
Cohesion: 0.14
Nodes (21): Chat(), Chat(), getConversationsQueryKey(), NewChatRow, createWrapper(), mockChannelFn, mockFetchConversations, mockGetChannels (+13 more)

### Community 7 - "useFavorites"
Cohesion: 0.08
Nodes (37): ApartmentsList(), ApartmentsListProps, DEFAULT_FILTERS, FilterBottomSheet(), FilterState, Props, ROOM_OPTS, SearchFiltersBar() (+29 more)

### Community 8 - "useApartmentFormStore"
Cohesion: 0.17
Nodes (12): Amenities(), FourthStep(), FormErrors, Index(), DEFAULT_COORDS, MAP_STYLE, MapPin(), ThirdStep() (+4 more)

### Community 9 - "ScreenWrapper"
Cohesion: 0.09
Nodes (27): FieldErrors, FormErrors, AuthCompleteProfile(), ProfileForm, requiredFields, CompleteProfile(), ProfileForm, requiredFields (+19 more)

### Community 10 - "devDependencies"
Cohesion: 0.05
Nodes (42): eslint, eslint-config-expo, eslint-import-resolver-typescript, expo-doctor, fast-check, jest, jest-expo, metro-minify-terser (+34 more)

### Community 11 - "expo"
Cohesion: 0.05
Nodes (39): backgroundColor, foregroundImage, adaptiveIcon, googleServicesFile, package, permissions, predictiveBackGestureEnabled, softwareKeyboardLayoutMode (+31 more)

### Community 12 - "expo-router"
Cohesion: 0.04
Nodes (8): AIHeaderProps, EWalletRedirect(), PAYMENT_METHOD_TYPES, PaymentMethodType, IMAGES, PAYMENT_METHOD_LOGOS, expo-router, getCheckoutSessionStatus()

### Community 13 - "review-information.tsx"
Cohesion: 0.27
Nodes (6): ReviewAccordionItem(), ReviewAccordionItemProps, ReviewDocumentFile(), ReviewDocumentFileProps, ReviewDocumentImage(), ReviewDocumentImageProps

### Community 14 - "privateMediaResolver.ts"
Cohesion: 0.15
Nodes (22): cacheKey(), chatMediaRetryKeys, claimChatMediaRetry(), clearPrivateMediaUrlCache(), getCachedPrivateMediaUrl(), getPrivateMediaCacheGeneration(), isPrivateMediaCacheGenerationCurrent(), setCachedPrivateMediaUrl() (+14 more)

### Community 15 - "paymentService.ts"
Cohesion: 0.11
Nodes (36): PaymentHistoryCard(), PaymentHistoryCardProps, FlatPayment, PaymentHistoryScreen(), toFlatPayment(), ReceiptCard(), toHistoryItem(), PaymentReceipt() (+28 more)

### Community 16 - "saved-methods/index.tsx"
Cohesion: 0.33
Nodes (7): getLogoSource(), maskMobileNumber(), PaymentMethod, PaymentMethodCard(), PaymentMethodCardProps, Index(), INITIAL_PAYMENT_METHODS

### Community 17 - "ai-search.tsx"
Cohesion: 0.10
Nodes (20): AISearchScreen(), SUGGESTION_CHIPS, AIHeader(), EmptyChatState(), MessageBubble(), MessageBubbleProps, MessageComposer(), MessageComposerProps (+12 more)

### Community 18 - "usePersonalizationStore.ts"
Cohesion: 0.12
Nodes (20): CityCheckBox(), CityCheckBoxProps, PersonalizationProgress(), Props, PersonalizationRadioButton(), PersonalizationRadioButtonProps, StepFive(), StepFour() (+12 more)

### Community 19 - "notificationService.ts"
Cohesion: 0.20
Nodes (14): getNotificationPreferencesQueryKey(), createWrapper(), mockFetchNotificationPreferences, mockUpdateNotificationPreferences, mockUseCurrentUser, useNotificationPreferences(), usePushRegistration(), DEFAULT_NOTIFICATION_PREFERENCES (+6 more)

### Community 20 - "useVerificationStore"
Cohesion: 0.15
Nodes (17): getCaptureSequence(), SelectId(), SelfiePrep(), Success(), UploadSelfie(), StepProgress(), StepProgressProps, useVerificationStore (+9 more)

### Community 21 - "chatService.ts"
Cohesion: 0.14
Nodes (23): Options, AttachmentUploadFailure, buildOlderThanChatMessageFilter(), ChatMessageCursor, ChatMessagePage, EXTENSION_BY_MIME_TYPE, fetchMessagePage(), fetchMessages() (+15 more)

### Community 22 - "[conversationId].tsx"
Cohesion: 0.12
Nodes (18): ATTACHMENT_OPTIONS, ChatBox(), ChatBoxProps, StagedAsset, ChatEmptyState(), ChatEmptyStateProps, ChatHeader(), ChatHeaderProps (+10 more)

### Community 23 - "auth/index.ts"
Cohesion: 0.17
Nodes (17): NotificationFilter, NotificationList(), NotificationListProps, NotificationScreen(), NotificationScreenProps, UseCountdownOptions, useCurrentUser(), useNotificationActions() (+9 more)

### Community 24 - "usePayoutDestinations.ts"
Cohesion: 0.23
Nodes (16): PayoutAccountForm(), getPayoutDestinationsQueryKey(), useCreatePayoutDestination(), useDeletePayoutDestination(), usePayoutDestinations(), useUpdatePayoutDestination(), createPayoutDestination(), deletePayoutDestination() (+8 more)

### Community 25 - "paths"
Cohesion: 0.09
Nodes (22): ./assets/*, ./components/*, ./constants/*, expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.ts, ./hooks/*, ../../packages/ui/* (+14 more)

### Community 26 - "notifications/index.ts"
Cohesion: 0.20
Nodes (14): NotificationCard(), NotificationCardProps, NotificationCardType, GENERAL_TOGGLES, GeneralToggleKey, NotificationSettingsScreen(), NotificationToastContent(), NOTIFICATION_TYPE_LABELS (+6 more)

### Community 27 - "payment/index.tsx"
Cohesion: 0.09
Nodes (32): CardInformation, CardPaymentForm(), CardPaymentFormProps, CashPaymentErrors, CashPaymentForm(), CashPaymentFormProps, validateCashPayment(), PaymentFooter() (+24 more)

### Community 28 - "apartments/index.ts"
Cohesion: 0.16
Nodes (17): ApartmentSummary(), ApartmentDetailsSection(), ApartmentDetailsSectionProps, ApartmentHeroSection(), ApartmentHeroSectionProps, ApartmentImage, IncludedPerks(), ApartmentMapViewScreen() (+9 more)

### Community 29 - "landlordService.ts"
Cohesion: 0.10
Nodes (26): Index(), getLandlordUnitsQueryKey(), useLandlordUnits(), getLandlordVisitRequestsQueryKey(), useLandlordVisitRequests(), DB_TO_DISPLAY_STATUS, DbStatus, DISPLAY_TO_DB_STATUS (+18 more)

### Community 30 - "description/index.tsx"
Cohesion: 0.18
Nodes (8): PerksSectionProps, Divider(), DividerProps, BasePerkItemProps, PerkItem(), PerkItemProps, Perk, PERKS

### Community 31 - "tenant-applications/index.tsx"
Cohesion: 0.13
Nodes (15): ApplicationFilters, ApplicationFilterSheet(), LOCATION_OPTIONS, Props, STATUS_OPTIONS, EmptyApplications(), EmptySearchResults(), getInitials() (+7 more)

### Community 32 - "useColors"
Cohesion: 0.08
Nodes (28): IconButton(), IconButtonProps, IconComponent, RatingBarCount(), RatingBarCountProps, Index(), Failed(), SelectDocument() (+20 more)

### Community 33 - "upload-id.tsx"
Cohesion: 0.22
Nodes (13): CaptureStepConfig, CaptureStepSummary(), CaptureStepSummaryProps, UploadId(), CaptureProgress, computeCanContinue(), getCaptureProgress(), IdCaptureResult (+5 more)

### Community 34 - "live-capture.tsx"
Cohesion: 0.16
Nodes (10): getNextCaptureStep(), CapturedPhoto, LiveCapture(), ScreenState, computeFillRatio(), computeGuidedFrameRect(), GuidedFrameOverlay(), GuidedFrameOverlayProps (+2 more)

### Community 35 - "manage-apartment/[apartmentId]/index.tsx"
Cohesion: 0.12
Nodes (18): MaintenanceRequestCard(), MaintenanceRequestCardProps, PropertyActionMenu(), Props, ApartmentImage, PropertyOverview(), Props, PropertyOverviewSkeleton() (+10 more)

### Community 36 - "units.tsx"
Cohesion: 0.13
Nodes (14): PropertyCard(), PropertyCardProps, PropertyCardSkeleton(), PropertyFilterSheet(), PropertyFilterSheetProps, SORT_LABELS, SortOption, sortOptions (+6 more)

### Community 37 - "useFrameQualityCheck.ts"
Cohesion: 0.18
Nodes (13): GuidedFrameRect, CameraPermissionState, useCameraPermission(), UseCameraPermissionResult, evaluateBlurHeuristic(), evaluateGlareHeuristic(), FrameQualityCheckOptions, FrameQualityReason (+5 more)

### Community 38 - "dependencies"
Cohesion: 0.11
Nodes (19): expo-constants, expo-router, dependencies, expo-constants, expo-router, @react-native-community/datetimepicker, react-native-gesture-handler, react-native-keyboard-aware-scroll-view (+11 more)

### Community 39 - "app/_layout.tsx"
Cohesion: 0.18
Nodes (9): RootLayout(), ThemeInitializer(), Index(), DevBadge(), useTheme(), expo-web-browser, ThemeMode, ThemeStore (+1 more)

### Community 40 - "queryClient.ts"
Cohesion: 0.09
Nodes (24): QueryProvider(), QueryProviderProps, createWrapper(), mockFetchApartmentDetails, mockFetchReviewsPreview, createWrapper(), mockFetchTenantApplications, mockUseCurrentUser (+16 more)

### Community 41 - "payments/index.ts"
Cohesion: 0.14
Nodes (24): PayoutHistoryCard(), Props, PayoutsIndex(), PayoutDetail(), Balances, fetchBalances(), getPayoutBalancesQueryKey(), usePayoutBalances() (+16 more)

### Community 42 - "history/index.tsx"
Cohesion: 0.11
Nodes (19): ReceiptCardProps, STATUS_META, ZigzagEdge(), ZigzagEdgeProps, PaymentHistoryCard(), PaymentHistoryCardProps, PaymentHistoryItem, PaymentHistoryFilters (+11 more)

### Community 43 - "paymongoService.ts"
Cohesion: 0.20
Nodes (9): extractError(), invoke(), PaymongoCard, PaymongoCardPaymentResult, PaymongoCheckoutSession, PaymongoEnvelope, PaymongoError, PaymongoSessionStatus (+1 more)

### Community 44 - "edit-main.tsx"
Cohesion: 0.21
Nodes (13): ApartmentInformation, DisplayImage, EditMain(), validateForm(), ApartmentMainFields, deleteStorageImage(), ExistingImage, PendingImage (+5 more)

### Community 45 - "audit-fix.characterization.test.ts"
Cohesion: 0.12
Nodes (10): ChatRow, mockChannel, mockChatRows, mockCreateSignedUrls, mockFrom, mockGetUser, mockRemoveChannel, mockStorageFrom (+2 more)

### Community 46 - "applications/index.ts"
Cohesion: 0.14
Nodes (18): getStatusStyle(), TenantApplicationDetails(), createWrapper(), mockEq, mockFrom, mockUpdate, mockUseCurrentUser, useApplicationActions() (+10 more)

### Community 47 - "visit-requests/index.tsx"
Cohesion: 0.21
Nodes (9): EmptyApproved(), VisitRequestCalendar(), VisitRequestCalendarProps, getGroup(), Group, GROUP_ORDER, GroupedItem, PastToggle() (+1 more)

### Community 48 - "(landlord)/profile.tsx"
Cohesion: 0.22
Nodes (11): CompleteProfileCard(), CompleteProfileCardProps, ProfileHeader(), ProfileHeaderProps, AccountStatus, StatusConfig, VerificationStatus(), VerificationStatusProps (+3 more)

### Community 49 - "ApplicationList.tsx"
Cohesion: 0.23
Nodes (6): ApplicationsList(), ApplicationsEmptyState(), ApplicationStatusCard(), Props, ApplicationStatusCardSkeleton(), ApplicationStatus

### Community 50 - "useTenancyRealtime.ts"
Cohesion: 0.24
Nodes (13): attachPaymentChannel(), attachSubscriber(), attachTenantChannel(), Channel, createRefSubscriber(), detachSubscriber(), getRecordString(), paymentChannels (+5 more)

### Community 51 - "document-id/index.tsx"
Cohesion: 0.23
Nodes (11): DocumentCard(), DocumentCardProps, Index(), TODO: Implement contact support functionality,, TODO: Fetch and display user's uploaded documents and IDs here. This may…, UploadedDocument, DOCUMENT_EXTENSIONS, getExtension() (+3 more)

### Community 52 - "third-process.tsx"
Cohesion: 0.19
Nodes (8): FormErrors, ThirdProcess(), FieldErrors, UploadFileField(), UploadFileFieldProps, ApplicationHeaderProps, CircleProgress(), CircleProgressProps

### Community 53 - "useTenancy"
Cohesion: 0.24
Nodes (12): CurrentApartmentDetails(), formatDateToMonthYear(), getErrorMessage(), getRecordString(), getTenancyQueryKey(), useTenancy(), CurrentTenancy, fetchTenancy() (+4 more)

### Community 54 - "useChatChannel.ts"
Cohesion: 0.16
Nodes (12): BroadcastEvent, BroadcastPayload, PresenceJoinEvent, PresenceLeaveEvent, PresenceState, ChannelHandler, MockChannel, mockChannels (+4 more)

### Community 55 - "chatService.pagination.test.ts"
Cohesion: 0.16
Nodes (9): ChatMessagePlacement, mergeChatMessages(), Message, ChatRow, mockFrom, mockStorageFrom, pageResponses, QueryLog (+1 more)

### Community 56 - "sign-in.tsx"
Cohesion: 0.26
Nodes (9): AuthButton(), AuthButtonProps, AuthDivider(), AuthDividerProps, RoleTab(), RoleTabProps, SignIn(), SignUp() (+1 more)

### Community 57 - "rentals.tsx"
Cohesion: 0.05
Nodes (57): EmptyMaintenanceRequestsList(), MaintenanceRequestCard(), MaintenanceRequestCardProps, MaintenanceRequestCardSkeleton(), LOCATION_OPTIONS, MaintenanceRequestFilters, MaintenanceRequestFilterSheet(), Props (+49 more)

### Community 58 - "pending.tsx"
Cohesion: 0.19
Nodes (11): EmptyPending(), VisitRequestCardSkeleton(), DATE_RANGE_OPTIONS, DateRange, Props, STATUS_OPTIONS, VisitRequestFilters, VisitRequestFilterSheet() (+3 more)

### Community 59 - "RescheduleSheet.tsx"
Cohesion: 0.18
Nodes (10): Period, Props, RescheduleSheet(), tomorrow, toSupabaseTime(), HOURS, Period, PERIODS (+2 more)

### Community 60 - "useApplicationFormStore.ts"
Cohesion: 0.18
Nodes (10): ApartmentContext, ApplicationFormState, initialApartmentContext, initialDocuments, initialRentalPreferences, initialTenantInformation, initialUploadedPaths, RentalPreferences (+2 more)

### Community 61 - "useProfile"
Cohesion: 0.19
Nodes (10): RateApartment(), PayoutAccount(), TabsLayout(), RequestVisit(), useProfile(), SubmitReviewParams, SubmitReviewResult, useSubmitReview() (+2 more)

### Community 62 - "useInAppNotificationBanner.tsx"
Cohesion: 0.24
Nodes (10): NotificationManager(), getOpenChatConversationKey(), shouldSuppressChatToast(), useInAppNotificationBanner(), useNotificationTapHandler(), markNotificationRead(), buildNotificationDeepLink(), NotificationData (+2 more)

### Community 63 - "onboarding.tsx"
Cohesion: 0.21
Nodes (7): { width }, OnBoardingSlide(), OnBoardingSlideProps, Slide, SLIDES, USER_ROLES, UserRole

### Community 64 - "applications/[applicationId].tsx"
Cohesion: 0.11
Nodes (22): VisitRequestCard(), VisitRequestCardProps, VisitRequestDetails(), ApplicationApartment(), Props, VisitRequest, VisitRequestCard(), Props (+14 more)

### Community 65 - "ChatBubble.tsx"
Cohesion: 0.27
Nodes (8): calculateImageSize(), ChatBubble(), ChatBubbleProps, mockPlayer, VideoBubble(), VisualMediaBubble(), isEmojiOnly(), MessageType

### Community 66 - "useLandlordActionBadges"
Cohesion: 0.24
Nodes (9): Units(), EMPTY_COUNTS, getLandlordBadgesQueryKey(), useLandlordActionBadges(), ActionBadgeCategory, ActionBadgeCounts, fetchLandlordApartmentIds(), fetchLandlordBadges() (+1 more)

### Community 67 - "fifth-step.tsx"
Cohesion: 0.18
Nodes (9): plugins, DEFAULT_COORDS, MAP_STYLE, LandlordCard(), LandlordCardProps, expo-font, expo-video, @maplibre/maplibre-react-native (+1 more)

### Community 68 - "DocumentRow.tsx"
Cohesion: 0.50
Nodes (4): DocumentRow(), DocumentRowProps, getExtension(), IMAGE_EXTENSIONS

### Community 69 - "useLandlordPayments.ts"
Cohesion: 0.18
Nodes (11): getLandlordPaymentsQueryKey(), useLandlordPayments(), useLandlordStats(), fetchLandlordPayments(), fetchLandlordStats(), LandlordPaymentRecord, LandlordStats, mockFrom (+3 more)

### Community 70 - "captureSequences.ts"
Cohesion: 0.24
Nodes (8): ALL_SUPPORTED_ID_TYPES, CaptureCameraFacing, CaptureGuideShape, CARD_SEQUENCE, PASSPORT_SEQUENCE, SELFIE_STEP, SEQUENCE_BY_ID_TYPE, NON_PASSPORT_ID_TYPES

### Community 71 - "useSubmitApplication.ts"
Cohesion: 0.21
Nodes (12): FirstProcess(), ReviewInformation(), SecondProcess(), DocKey, getContentType(), MIME_MAP, SubmitArgs, SubmitResult (+4 more)

### Community 72 - "useCurrentUser.ts"
Cohesion: 0.36
Nodes (7): useCurrentUserId(), getCurrentUser(), getUserProfileByColumn(), getUserProfileById(), UserProfile, setPrivateMediaCacheUser(), CURRENT_USER_QUERY_KEY

### Community 73 - "TabBar.tsx"
Cohesion: 0.31
Nodes (6): TabBar(), TabBarIcon(), TabBarIconProps, IconProps, LANDLORDICONS, TENANTICONS

### Community 74 - "live-capture.test.tsx"
Cohesion: 0.25
Nodes (8): captureAndReachReview(), DEFAULT_QUALITY_RESULT, mockBack, mockDismissTo, mockReplace, mockSearchParams, mockTakePictureAsync, setPermission()

### Community 75 - "tenantApplicationsService.ts"
Cohesion: 0.20
Nodes (11): getTenantApplicationsQueryKey(), useTenantApplications(), ApplicationDocument, ApplicationDocumentPathKey, ApplicationRow, DOCUMENT_DEFINITIONS, fetchTenantApplications(), TenantApplication (+3 more)

### Community 76 - "reset-password.tsx"
Cohesion: 0.50
Nodes (3): ResetPassword(), AppInput(), AppInputProps

### Community 77 - "upload-id.test.tsx"
Cohesion: 0.25
Nodes (7): BACK_CAPTURE, FRONT_CAPTURE, mockBack, mockPush, mockReplace, mockUseFocusEffect, SELFIE_CAPTURE

### Community 78 - "tenant-applications/[applicationId].tsx"
Cohesion: 0.12
Nodes (18): RateApartmentSkeleton(), ErrorDialogState, FormErrors, TenancyLeasePeriod, EmptyApplicationData(), FormErrors, MaintenanceDetails, MaintenanceErrors (+10 more)

### Community 79 - "useTenancyRealtime.test.ts"
Cohesion: 0.20
Nodes (7): MockChannel, mockChannelFactory, MockChannelHandler, mockChannelsByName, MockPayload, MockPostgresFilter, mockRemoveChannel

### Community 80 - "second-step.tsx"
Cohesion: 0.31
Nodes (8): DEFAULT_COORDS, DEFAULT_ROOM_LIMITS, formatLimitMessage(), formatRange(), FormErrors, isZeroRange(), MAP_STYLE, SecondStep()

### Community 81 - "NotificationToast.tsx"
Cohesion: 0.16
Nodes (15): MOCK_TOASTS, MockRow, MockToast, NotificationToastDevScreen(), NotificationToastContentProps, NotificationToastOptions, showNotificationToast(), TOAST_VARIANT_BY_TYPE (+7 more)

### Community 82 - "usePublishApartment.ts"
Cohesion: 0.48
Nodes (6): FifthStep(), getMimeType(), uploadBytes(), uploadImage(), usePublishApartment(), buildImageTiers()

### Community 83 - "(tenant)/chat.tsx"
Cohesion: 0.48
Nodes (4): getLastMessageDisplay(), MessageCard(), MessageCardProps, EMPTY_STATE_IMAGES

### Community 84 - "maintenance-requests/[requestId].tsx"
Cohesion: 0.47
Nodes (3): EmptyMaintenanceRequestDetail(), ResolveRequestDialog(), ResolveRequestDialogProps

### Community 85 - "useDocumentUrls.ts"
Cohesion: 0.33
Nodes (5): DocEntry, ResolvedDoc, DocumentEntriesProps, mockResolvePrivateMediaUrls, useDocumentUrls()

### Community 86 - "metro.config.js"
Cohesion: 0.33
Nodes (5): config, { getDefaultConfig }, monorepoRoot, path, { withUniwindConfig }

### Community 87 - "Welcome to your Expo app 👋"
Cohesion: 0.33
Nodes (5): Get a fresh project, Get started, Join the community, Learn more, Welcome to your Expo app 👋

### Community 89 - "uniwind-types.d.ts"
Cohesion: 0.50
Nodes (3): NOTE: This file is generated by uniwind and it should not be edited manually., uniwind, UniwindConfig

### Community 136 - "conversationService.test.ts"
Cohesion: 0.33
Nodes (6): Conversation, createQuery(), mockFrom, mockLegacyQueries(), mockRpc, seedV2Conversations

### Community 165 - "useImageUpload.ts"
Cohesion: 0.47
Nodes (5): EditProfile(), BUCKET_MAP, UploadTarget, useImageUpload(), invalidateCurrentUser()

## Knowledge Gaps
- **642 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+637 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **69 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useColors()` connect `useColors` to `apartment/[apartmentId]/index.tsx`, `ScreenWrapper.tsx`, `useTheme.ts`, `ratings/index.ts`, `dashboard.tsx`, `upload.tsx`, `useConversations.test.tsx`, `useFavorites`, `useApartmentFormStore`, `ScreenWrapper`, `expo-router`, `review-information.tsx`, `paymentService.ts`, `saved-methods/index.tsx`, `ai-search.tsx`, `usePersonalizationStore.ts`, `useVerificationStore`, `[conversationId].tsx`, `notifications/index.ts`, `payment/index.tsx`, `apartments/index.ts`, `landlordService.ts`, `description/index.tsx`, `tenant-applications/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `units.tsx`, `useImageUpload.ts`, `app/_layout.tsx`, `payments/index.ts`, `history/index.tsx`, `applications/index.ts`, `visit-requests/index.tsx`, `(landlord)/profile.tsx`, `ApplicationList.tsx`, `document-id/index.tsx`, `third-process.tsx`, `useTenancy`, `sign-in.tsx`, `rentals.tsx`, `pending.tsx`, `RescheduleSheet.tsx`, `useProfile`, `applications/[applicationId].tsx`, `ChatBubble.tsx`, `fifth-step.tsx`, `DocumentRow.tsx`, `TabBar.tsx`, `reset-password.tsx`, `tenant-applications/[applicationId].tsx`, `second-step.tsx`, `NotificationToast.tsx`, `usePublishApartment.ts`, `(tenant)/chat.tsx`, `maintenance-requests/[requestId].tsx`?**
  _High betweenness centrality (0.220) - this node is a cross-community bridge._
- **Why does `expo-router` connect `expo-router` to `apartment/[apartmentId]/index.tsx`, `ScreenWrapper.tsx`, `useTheme.ts`, `dashboard.tsx`, `upload.tsx`, `useFavorites`, `useApartmentFormStore`, `ScreenWrapper`, `review-information.tsx`, `paymentService.ts`, `saved-methods/index.tsx`, `usePersonalizationStore.ts`, `useVerificationStore`, `[conversationId].tsx`, `auth/index.ts`, `payment/index.tsx`, `apartments/index.ts`, `description/index.tsx`, `tenant-applications/index.tsx`, `useColors`, `upload-id.tsx`, `live-capture.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `units.tsx`, `useFrameQualityCheck.ts`, `app/_layout.tsx`, `payments/index.ts`, `history/index.tsx`, `edit-main.tsx`, `visit-requests/index.tsx`, `(landlord)/profile.tsx`, `ApplicationList.tsx`, `document-id/index.tsx`, `third-process.tsx`, `sign-in.tsx`, `rentals.tsx`, `pending.tsx`, `useProfile`, `useInAppNotificationBanner.tsx`, `onboarding.tsx`, `applications/[applicationId].tsx`, `fifth-step.tsx`, `reset-password.tsx`, `tenant-applications/[applicationId].tsx`, `second-step.tsx`, `(tenant)/chat.tsx`, `maintenance-requests/[requestId].tsx`, `playground.tsx`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Why does `ScreenWrapper` connect `ScreenWrapper` to `apartment/[apartmentId]/index.tsx`, `ScreenWrapper.tsx`, `useTheme.ts`, `dashboard.tsx`, `upload.tsx`, `useFavorites`, `useApartmentFormStore`, `expo-router`, `review-information.tsx`, `paymentService.ts`, `saved-methods/index.tsx`, `ai-search.tsx`, `usePersonalizationStore.ts`, `useVerificationStore`, `[conversationId].tsx`, `auth/index.ts`, `notifications/index.ts`, `payment/index.tsx`, `apartments/index.ts`, `description/index.tsx`, `tenant-applications/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `units.tsx`, `payments/index.ts`, `history/index.tsx`, `edit-main.tsx`, `visit-requests/index.tsx`, `ApplicationList.tsx`, `document-id/index.tsx`, `third-process.tsx`, `sign-in.tsx`, `rentals.tsx`, `pending.tsx`, `applications/[applicationId].tsx`, `fifth-step.tsx`, `reset-password.tsx`, `tenant-applications/[applicationId].tsx`, `second-step.tsx`, `(tenant)/chat.tsx`, `maintenance-requests/[requestId].tsx`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _642 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `apartment/[apartmentId]/index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08505747126436781 - nodes in this community are weakly interconnected._
- **Should `ScreenWrapper.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07092198581560284 - nodes in this community are weakly interconnected._
- **Should `useTheme.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14333333333333334 - nodes in this community are weakly interconnected._