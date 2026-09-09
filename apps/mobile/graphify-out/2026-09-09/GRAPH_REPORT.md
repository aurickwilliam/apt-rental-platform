# Graph Report - mobile  (2026-09-09)

## Corpus Check
- 468 files · ~647,859 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2036 nodes · 4835 edges · 188 communities (117 shown, 71 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0ca140c7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- apartments/index.ts
- ScreenWrapper.tsx
- map-search.tsx
- reviews/index.tsx
- dashboardService.ts
- useApartmentFormStore
- useConversations.test.tsx
- search.tsx
- profilesService.ts
- ErrorDialog.tsx
- devDependencies
- RatingsSection.tsx
- sign-in.tsx
- apartment/[apartmentId]/index.tsx
- privateMediaResolver.ts
- paymentService.ts
- images.ts
- ai-search.tsx
- usePersonalizationStore.ts
- notificationService.ts
- useVerificationStore
- chatService.ts
- [conversationId].tsx
- NotificationList.tsx
- paymongoService.ts
- paths
- notifications/index.ts
- PaymentMethodSelector.tsx
- payments/index.ts
- landlordService.ts
- useColors
- tenant-applications/index.tsx
- manage-apartment/[apartmentId]/index.tsx
- upload-id.tsx
- live-capture.tsx
- ProfitByPropertyCard.tsx
- units.tsx
- useFrameQualityCheck.ts
- maintenance-requests/index.ts
- auth/index.ts
- MapPreviewSection.tsx
- favorites.tsx
- dashboard.tsx
- payment/index.tsx
- queryClient.ts
- audit-fix.characterization.test.ts
- useLandlordMaintenanceRequests.ts
- MaintenanceRequestFilterSheet.tsx
- app/_layout.tsx
- components/index.ts
- useTenancy
- document-id/index.tsx
- ProfitTrendCard.tsx
- tenantApplicationsService.test.ts
- useChatChannel.ts
- second-step.tsx
- useNotifications.ts
- maintenanceService.ts
- dependencies
- RescheduleSheet.tsx
- fifth-step.tsx
- useLandlordActionBadges
- useInAppNotificationBanner.tsx
- onboarding.tsx
- useLandlordTenancy.ts
- ChatBubble.tsx
- captureSequences.ts
- chatService.pagination.test.ts
- expo-linking
- useLandlordPayments.ts
- maintenance-requests/index.tsx
- useLandlordUnits.ts
- CustomTabBar.tsx
- TabBar.tsx
- live-capture.test.tsx
- rentals.tsx
- landlordService.test.ts
- applications/index.ts
- reset-password.tsx
- app.config.js
- useLeaseAgreement
- visit-requests/index.tsx
- useApplicationActions.test.tsx
- notification-toast.tsx
- history/index.tsx
- metro.config.js
- Welcome to your Expo app 👋
- playground.tsx
- uniwind-types.d.ts
- ReviewField.tsx
- StatusPill.tsx
- eslint.config.js
- upload-id.test.tsx
- expo-crypto
- [sectionId].tsx
- expo-device
- expo-document-picker
- expo-file-system
- expo-font
- expo-haptics
- expo-image
- expo-image-manipulator
- expo-image-picker
- expo-linear-gradient
- @expo/metro-config
- @expo/metro-runtime
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
- ApplicationList.tsx
- @maplibre/maplibre-react-native
- @miblanchard/react-native-slider
- @ptomasroos/react-native-multi-slider
- react
- react-dom
- expo-router
- @react-native-async-storage/async-storage
- react-native-awesome-gallery
- react-native-calendars
- @react-native-community/datetimepicker
- @react-native-community/slider
- react-native-gifted-charts
- react-native-image-viewing
- react-native-reanimated
- react-native-safe-area-context
- react-native-screens
- react-native-svg
- react-native-webview
- react-native-worklets
- @react-navigation/bottom-tabs
- @react-navigation/elements
- @react-navigation/native
- @react-navigation/native-stack
- @repo/constants
- @repo/hooks
- @repo/utils
- @tabler/icons-react-native
- tailwind-merge
- @tanstack/react-query
- uniwind
- zustand
- CR80_ASPECT_RATIO
- useDocumentUrls.ts
- expo-camera
- request-visit.tsx
- rate-apartment.tsx
- emoji-regex-xs
- expo-dev-client
- expo-location
- heroui-native
- react-native
- react-native-web
- rn-emoji-keyboard
- tailwind-variants

## God Nodes (most connected - your core abstractions)
1. `useColors()` - 342 edges
2. `ScreenWrapper` - 101 edges
3. `StandardHeader()` - 53 edges
4. `useCurrentUser()` - 52 edges
5. `useProfile()` - 42 edges
6. `useApartmentDetails()` - 23 edges
7. `resolvePrivateMediaUrls()` - 22 edges
8. `useFavorites()` - 20 edges
9. `useTenancy()` - 20 edges
10. `createMobileQueryClient()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `ResetPassword()` --calls--> `useColors()`  [EXTRACTED]
  app/(auth)/forgot-password/reset-password.tsx → hooks/useTheme.ts
- `CaptureStepSummary()` --calls--> `useColors()`  [EXTRACTED]
  app/(auth)/verify-account/upload-id.tsx → hooks/useTheme.ts
- `LandlordTabLayout()` --calls--> `useColors()`  [EXTRACTED]
  app/(tabs)/(landlord)/_layout.tsx → hooks/useTheme.ts
- `TenantTabLayout()` --calls--> `useColors()`  [EXTRACTED]
  app/(tabs)/(tenant)/_layout.tsx → hooks/useTheme.ts
- `AnalyticsScreen()` --calls--> `useColors()`  [EXTRACTED]
  app/landlord/analytics.tsx → hooks/useTheme.ts

## Import Cycles
- 2-file cycle: `hooks/applications/index.ts -> hooks/applications/useApplicationActions.ts -> hooks/applications/index.ts`
- 2-file cycle: `hooks/applications/index.ts -> service/applications/tenantApplicationsService.ts -> hooks/applications/index.ts`
- 3-file cycle: `hooks/applications/index.ts -> hooks/applications/useTenantApplications.ts -> service/applications/tenantApplicationsService.ts -> hooks/applications/index.ts`
- 3-file cycle: `hooks/payments/index.ts -> hooks/payments/usePayments.ts -> service/payments/paymentService.ts -> hooks/payments/index.ts`

## Communities (188 total, 71 thin omitted)

### Community 0 - "apartments/index.ts"
Cohesion: 0.23
Nodes (12): ApartmentSummary(), IncludedPerks(), getApartmentDetailsQueryKey(), getApartmentReviewsPreviewQueryKey(), mockFetchApartmentDetails, mockFetchReviewsPreview, useApartmentDetails(), UseApartmentDetailsOptions (+4 more)

### Community 1 - "ScreenWrapper.tsx"
Cohesion: 0.07
Nodes (27): DOCUMENT_TYPE_ICONS, TODO: Persist the uploaded document to Supabase Storage and store its, AnalyticsScreen(), MAX_AMOUNT, monthlyData, stats, TenantApplicationDetailsSkeleton(), EmptyRequestData() (+19 more)

### Community 2 - "map-search.tsx"
Cohesion: 0.07
Nodes (50): IconButton(), IconButtonProps, IconComponent, ApartmentMapViewScreen(), DirectionMode, MapPin(), MapPreviewSheet(), Props (+42 more)

### Community 3 - "reviews/index.tsx"
Cohesion: 0.10
Nodes (29): RatingsPage(), ReviewsPage(), SORT_OPTIONS, RatingCard(), RatingCardProps, RatingCardSkeleton(), SmallRatingCardProps, StarRating() (+21 more)

### Community 4 - "dashboardService.ts"
Cohesion: 0.17
Nodes (13): Dashboard(), EMPTY_DASHBOARD_DATA, getDashboardDataQueryKey(), getErrorMessage(), useDashboardData(), DashboardData, DashboardStats, fetchDashboardData() (+5 more)

### Community 5 - "useApartmentFormStore"
Cohesion: 0.09
Nodes (23): Amenities(), FourthStep(), FormErrors, Index(), FieldErrors, ThirdStep(), EditPerks(), BasePerkButtonProps (+15 more)

### Community 6 - "useConversations.test.tsx"
Cohesion: 0.11
Nodes (26): Chat(), getConversationsQueryKey(), NewChatRow, createWrapper(), mockChannelFn, mockFetchConversations, mockGetChannels, mockRemoveChannel (+18 more)

### Community 7 - "search.tsx"
Cohesion: 0.15
Nodes (14): DEFAULT_FILTERS, FilterBottomSheet(), FilterState, Props, ROOM_OPTS, SearchFiltersBar(), SearchFiltersBarProps, CITIES (+6 more)

### Community 8 - "profilesService.ts"
Cohesion: 0.22
Nodes (14): getPublicLandlordProfileQueryKey(), usePublicLandlordProfile(), getPublicTenantProfileQueryKey(), usePublicTenantProfile(), fetchPublicLandlordProfile(), fetchPublicTenantProfile(), formatMonth(), formatYear() (+6 more)

### Community 9 - "ErrorDialog.tsx"
Cohesion: 0.15
Nodes (15): AuthCompleteProfile(), ProfileForm, requiredFields, CompleteProfile(), ProfileForm, requiredFields, VerifyMobile(), ErrorDialog() (+7 more)

### Community 10 - "devDependencies"
Cohesion: 0.05
Nodes (42): eslint, eslint-config-expo, eslint-import-resolver-typescript, expo-doctor, fast-check, jest, jest-expo, metro-minify-terser (+34 more)

### Community 11 - "RatingsSection.tsx"
Cohesion: 0.16
Nodes (12): ApartmentDescriptionSection(), ApartmentDescriptionSectionProps, LeaseAgreementSection(), LeaseAgreementSectionProps, PerksSection(), PerksSectionProps, RatingsSection(), RatingsSectionProps (+4 more)

### Community 12 - "sign-in.tsx"
Cohesion: 0.25
Nodes (8): AuthButton(), AuthButtonProps, AuthDivider(), AuthDividerProps, RoleTab(), RoleTabProps, SignUp(), useGoogleAuth()

### Community 13 - "apartment/[apartmentId]/index.tsx"
Cohesion: 0.16
Nodes (22): ApartmentScreen(), TenantFavorites(), getErrorMessage(), getFavoriteApartmentsQueryKey(), getFavoritesQueryKey(), createWrapper(), mockDeleteFavorite, mockFetchApartmentsByIds (+14 more)

### Community 14 - "privateMediaResolver.ts"
Cohesion: 0.15
Nodes (22): cacheKey(), chatMediaRetryKeys, claimChatMediaRetry(), clearPrivateMediaUrlCache(), getCachedPrivateMediaUrl(), getPrivateMediaCacheGeneration(), isPrivateMediaCacheGenerationCurrent(), setCachedPrivateMediaUrl() (+14 more)

### Community 15 - "paymentService.ts"
Cohesion: 0.18
Nodes (14): getPaymentByReferenceQueryKey(), getPaymentsQueryKey(), CreateCashPaymentParams, fetchPaymentById(), fetchPaymentByReferenceId(), fetchPayments(), METHOD_LABELS, PaymentRecord (+6 more)

### Community 16 - "images.ts"
Cohesion: 0.09
Nodes (18): AIHeader(), AIHeaderProps, getLastMessageDisplay(), MessageCard(), MessageCardProps, Add(), PAYMENT_METHOD_TYPES, PaymentMethodType (+10 more)

### Community 17 - "ai-search.tsx"
Cohesion: 0.11
Nodes (18): AISearchScreen(), SUGGESTION_CHIPS, EmptyChatState(), MessageBubble(), MessageBubbleProps, MessageComposer(), MessageComposerProps, ScrollToBottomButton() (+10 more)

### Community 18 - "usePersonalizationStore.ts"
Cohesion: 0.13
Nodes (19): CityCheckBox(), CityCheckBoxProps, PersonalizationProgress(), Props, PersonalizationRadioButton(), PersonalizationRadioButtonProps, StepFour(), StepOne() (+11 more)

### Community 19 - "notificationService.ts"
Cohesion: 0.15
Nodes (18): GENERAL_TOGGLES, GeneralToggleKey, NOTIFICATION_TYPE_LABELS, getNotificationPreferencesQueryKey(), createWrapper(), mockFetchNotificationPreferences, mockUpdateNotificationPreferences, mockUseCurrentUser (+10 more)

### Community 20 - "useVerificationStore"
Cohesion: 0.15
Nodes (17): getCaptureSequence(), SelectId(), SelfiePrep(), Success(), UploadSelfie(), StepProgress(), StepProgressProps, useVerificationStore (+9 more)

### Community 21 - "chatService.ts"
Cohesion: 0.14
Nodes (23): Options, AttachmentUploadFailure, buildOlderThanChatMessageFilter(), ChatMessageCursor, ChatMessagePage, EXTENSION_BY_MIME_TYPE, fetchMessagePage(), fetchMessages() (+15 more)

### Community 22 - "[conversationId].tsx"
Cohesion: 0.11
Nodes (19): ATTACHMENT_OPTIONS, ChatBox(), ChatBoxProps, StagedAsset, ChatEmptyState(), ChatEmptyStateProps, ChatHeader(), ChatHeaderProps (+11 more)

### Community 23 - "NotificationList.tsx"
Cohesion: 0.40
Nodes (4): NotificationCardSkeleton(), NotificationFilter, NotificationList(), NotificationListProps

### Community 24 - "paymongoService.ts"
Cohesion: 0.17
Nodes (11): PaymentVerify(), extractError(), getCheckoutSessionStatus(), invoke(), PaymongoCard, PaymongoCardPaymentResult, PaymongoCheckoutSession, PaymongoEnvelope (+3 more)

### Community 25 - "paths"
Cohesion: 0.09
Nodes (22): ./assets/*, ./components/*, ./constants/*, expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.ts, ./hooks/*, ../../packages/ui/* (+14 more)

### Community 26 - "notifications/index.ts"
Cohesion: 0.23
Nodes (16): NotificationCard(), NotificationCardProps, NotificationCardType, NotificationSettingsScreen(), NotificationToastContent(), NotificationToastContentProps, NotificationToastOptions, TOAST_VARIANT_BY_TYPE (+8 more)

### Community 27 - "PaymentMethodSelector.tsx"
Cohesion: 0.13
Nodes (17): CardInformation, CardPaymentForm(), CardPaymentFormProps, CashPaymentErrors, CashPaymentForm(), PaymentMethodButton(), PaymentMethodButtonProps, PaymentMethodButtonVariant (+9 more)

### Community 28 - "payments/index.ts"
Cohesion: 0.26
Nodes (13): LandlordPaymentReceipt(), ReceiptCard(), STATUS_META, ZigzagEdge(), ZigzagEdgeProps, PaymentReceipt(), Success(), getPaymentQueryKey() (+5 more)

### Community 29 - "landlordService.ts"
Cohesion: 0.11
Nodes (19): FifthStep(), Index(), useLandlordStats(), DB_TO_DISPLAY_STATUS, DbStatus, DISPLAY_TO_DB_STATUS, fetchLandlordStats(), fetchManageApartmentDescription() (+11 more)

### Community 30 - "useColors"
Cohesion: 0.08
Nodes (37): RatingBarCount(), RatingBarCountProps, Index(), OTPVerification(), OTPVerification(), SignIn(), Failed(), SelectDocument() (+29 more)

### Community 31 - "tenant-applications/index.tsx"
Cohesion: 0.14
Nodes (14): ApplicationFilters, ApplicationFilterSheet(), LOCATION_OPTIONS, Props, STATUS_OPTIONS, EmptyApplications(), EmptySearchResults(), getInitials() (+6 more)

### Community 32 - "manage-apartment/[apartmentId]/index.tsx"
Cohesion: 0.14
Nodes (12): MaintenanceRequestCard(), MaintenanceRequestCardProps, PropertyActionMenu(), Props, ApartmentImage, PropertyOverview(), Props, PropertyOverviewSkeleton() (+4 more)

### Community 33 - "upload-id.tsx"
Cohesion: 0.22
Nodes (13): CaptureStepConfig, CaptureStepSummary(), CaptureStepSummaryProps, UploadId(), CaptureProgress, computeCanContinue(), getCaptureProgress(), IdCaptureResult (+5 more)

### Community 34 - "live-capture.tsx"
Cohesion: 0.16
Nodes (10): getNextCaptureStep(), CapturedPhoto, LiveCapture(), ScreenState, computeFillRatio(), computeGuidedFrameRect(), GuidedFrameOverlay(), GuidedFrameOverlayProps (+2 more)

### Community 35 - "ProfitByPropertyCard.tsx"
Cohesion: 0.22
Nodes (10): chartLabel(), ProfitByPropertyCard(), ProfitByPropertyCardProps, SearchHeader(), SearchHeaderProps, MONTHS, DropdownButton(), DropdownButtonProps (+2 more)

### Community 36 - "units.tsx"
Cohesion: 0.13
Nodes (14): PropertyCard(), PropertyCardProps, PropertyCardSkeleton(), PropertyFilterSheet(), PropertyFilterSheetProps, SORT_LABELS, SortOption, sortOptions (+6 more)

### Community 37 - "useFrameQualityCheck.ts"
Cohesion: 0.18
Nodes (13): GuidedFrameRect, CameraPermissionState, useCameraPermission(), UseCameraPermissionResult, evaluateBlurHeuristic(), evaluateGlareHeuristic(), FrameQualityCheckOptions, FrameQualityReason (+5 more)

### Community 38 - "maintenance-requests/index.ts"
Cohesion: 0.11
Nodes (25): MaintenanceRequestCard(), MaintenanceRequestCardProps, ResolveRequestDialog(), ResolveRequestDialogProps, MaintenanceRequestDetails(), MaintenanceRequestCard(), MaintenanceRequestCardProps, MaintenanceDetails() (+17 more)

### Community 39 - "auth/index.ts"
Cohesion: 0.10
Nodes (24): RateApartment(), StepFive(), RentalPreferences(), TabsLayout(), UseCountdownOptions, mockFrom, mockGetUser, profileRecord (+16 more)

### Community 40 - "MapPreviewSection.tsx"
Cohesion: 0.17
Nodes (10): DirectionMode, MapPreviewSection(), MapPreviewSectionProps, MoveInCostFooterProps, MoveInCostFooterSection(), AppDialog(), AppDialogProps, formatOrNone() (+2 more)

### Community 41 - "favorites.tsx"
Cohesion: 0.19
Nodes (13): ApartmentsList(), ApartmentsListProps, Props, SearchGridSkeleton(), SearchSection(), SearchSectionSkeleton(), Props, SearchSectionsList() (+5 more)

### Community 42 - "dashboard.tsx"
Cohesion: 0.21
Nodes (8): DashboardSkeleton(), ProfitTrendCard(), RentDueCard(), RentDueCardProps, NotificationBellButton(), NotificationBellButtonProps, EmptyProperties(), Props

### Community 43 - "payment/index.tsx"
Cohesion: 0.18
Nodes (16): Rentals(), validateCashPayment(), PaymentFooter(), PaymentFooterProps, PaymentSummaryCard(), PaymentSummaryCardProps, formatLeaseDate(), INITIAL_CARD (+8 more)

### Community 44 - "queryClient.ts"
Cohesion: 0.05
Nodes (49): EditProfile(), EditProfileForm, EMPTY_FORM, FormErrors, EditMain(), validateForm(), ApartmentMainFields, deleteStorageImage() (+41 more)

### Community 45 - "audit-fix.characterization.test.ts"
Cohesion: 0.12
Nodes (10): ChatRow, mockChannel, mockChatRows, mockCreateSignedUrls, mockFrom, mockGetUser, mockRemoveChannel, mockStorageFrom (+2 more)

### Community 46 - "useLandlordMaintenanceRequests.ts"
Cohesion: 0.43
Nodes (7): getLandlordMaintenanceRequestsQueryKey(), getNextStatus(), STATUS_FLOW, useLandlordMaintenanceRequests(), fetchLandlordMaintenanceRequests(), LandlordMaintenanceRequest, updateLandlordMaintenanceStatus()

### Community 47 - "MaintenanceRequestFilterSheet.tsx"
Cohesion: 0.29
Nodes (6): LOCATION_OPTIONS, MaintenanceRequestFilters, MaintenanceRequestFilterSheet(), Props, STATUS_OPTIONS, URGENCY_OPTIONS

### Community 48 - "app/_layout.tsx"
Cohesion: 0.22
Nodes (11): NotificationManager(), RootLayout(), ThemeInitializer(), Index(), DevBadge(), useInAppNotificationBanner(), usePushRegistration(), useTheme() (+3 more)

### Community 49 - "components/index.ts"
Cohesion: 0.20
Nodes (7): ApartmentSkeleton(), ApartmentDetailsSection(), ApartmentDetailsSectionProps, ApartmentHeroSection(), ApartmentHeroSectionProps, ApartmentImage, ApartmentDetails

### Community 50 - "useTenancy"
Cohesion: 0.09
Nodes (31): Chat(), getErrorMessage(), getRecordString(), getTenancyQueryKey(), useTenancy(), attachPaymentChannel(), attachSubscriber(), attachTenantChannel() (+23 more)

### Community 51 - "document-id/index.tsx"
Cohesion: 0.23
Nodes (11): DocumentCard(), DocumentCardProps, Index(), TODO: Implement contact support functionality,, TODO: Fetch and display user's uploaded documents and IDs here. This may…, UploadedDocument, DOCUMENT_EXTENSIONS, getExtension() (+3 more)

### Community 52 - "ProfitTrendCard.tsx"
Cohesion: 0.22
Nodes (8): BUILDERS, ChartDatum, FilterOption, filterOptions, ProfitTrendCardProps, toMonthly(), monthLabel(), MonthlyRevenuePoint

### Community 53 - "tenantApplicationsService.test.ts"
Cohesion: 0.40
Nodes (3): applicationRow, mockFrom, mockResolvePrivateMediaUrls

### Community 54 - "useChatChannel.ts"
Cohesion: 0.16
Nodes (12): BroadcastEvent, BroadcastPayload, PresenceJoinEvent, PresenceLeaveEvent, PresenceState, ChannelHandler, MockChannel, mockChannels (+4 more)

### Community 55 - "second-step.tsx"
Cohesion: 0.05
Nodes (45): ReviewAccordionItem(), ReviewAccordionItemProps, ReviewDocumentFile(), ReviewDocumentFileProps, ReviewDocumentImage(), ReviewDocumentImageProps, FieldErrors, FirstProcess() (+37 more)

### Community 56 - "useNotifications.ts"
Cohesion: 0.16
Nodes (17): NotificationScreen(), useNotificationActions(), attach(), ChannelEntry, detach(), handleEvent(), NotificationRealtimeCallbacks, registry (+9 more)

### Community 57 - "maintenanceService.ts"
Cohesion: 0.23
Nodes (12): MaintenanceHistory(), getMaintenanceRequestHistoryQueryKey(), useMaintenanceRequestHistory(), UseMaintenanceRequestHistoryParams, getLatestMaintenanceRequestQueryKey(), useMaintenanceRequests(), UseMaintenanceRequestsParams, cancelMaintenanceRequest() (+4 more)

### Community 58 - "dependencies"
Cohesion: 0.11
Nodes (19): expo, expo-constants, expo-notifications, dependencies, expo, expo-constants, expo-notifications, react-native-gesture-handler (+11 more)

### Community 59 - "RescheduleSheet.tsx"
Cohesion: 0.18
Nodes (10): Period, Props, RescheduleSheet(), tomorrow, toSupabaseTime(), HOURS, Period, PERIODS (+2 more)

### Community 60 - "fifth-step.tsx"
Cohesion: 0.24
Nodes (6): LandlordSection(), LandlordSectionProps, DEFAULT_COORDS, MAP_STYLE, LandlordCard(), LandlordCardProps

### Community 61 - "useLandlordActionBadges"
Cohesion: 0.22
Nodes (10): TenantApplications(), Units(), EMPTY_COUNTS, getLandlordBadgesQueryKey(), useLandlordActionBadges(), ActionBadgeCategory, ActionBadgeCounts, fetchLandlordApartmentIds() (+2 more)

### Community 62 - "useInAppNotificationBanner.tsx"
Cohesion: 0.26
Nodes (8): getOpenChatConversationKey(), shouldSuppressChatToast(), useNotificationTapHandler(), markNotificationRead(), buildNotificationDeepLink(), NotificationData, parseConversationKey(), Role

### Community 63 - "onboarding.tsx"
Cohesion: 0.21
Nodes (7): { width }, OnBoardingSlide(), OnBoardingSlideProps, Slide, SLIDES, USER_ROLES, UserRole

### Community 64 - "useLandlordTenancy.ts"
Cohesion: 0.32
Nodes (7): Index(), getLandlordTenancyQueryKey(), useLandlordTenancy(), fetchLandlordTenancy(), LandlordTenancyMaintenanceRequest, LandlordTenant, PaymentRecord

### Community 65 - "ChatBubble.tsx"
Cohesion: 0.27
Nodes (8): calculateImageSize(), ChatBubble(), ChatBubbleProps, mockPlayer, VideoBubble(), VisualMediaBubble(), isEmojiOnly(), MessageType

### Community 66 - "captureSequences.ts"
Cohesion: 0.24
Nodes (8): ALL_SUPPORTED_ID_TYPES, CaptureCameraFacing, CaptureGuideShape, CARD_SEQUENCE, PASSPORT_SEQUENCE, SELFIE_STEP, SEQUENCE_BY_ID_TYPE, NON_PASSPORT_ID_TYPES

### Community 67 - "chatService.pagination.test.ts"
Cohesion: 0.16
Nodes (9): ChatMessagePlacement, mergeChatMessages(), Message, ChatRow, mockFrom, mockStorageFrom, pageResponses, QueryLog (+1 more)

### Community 69 - "useLandlordPayments.ts"
Cohesion: 0.57
Nodes (5): getLandlordPaymentsQueryKey(), useLandlordPaymentConfirmation(), useLandlordPayments(), fetchLandlordPayments(), updateLandlordPaymentStatus()

### Community 70 - "maintenance-requests/index.tsx"
Cohesion: 0.38
Nodes (4): EmptyMaintenanceRequestsList(), MaintenanceRequestCardSkeleton(), EMPTY_FILTERS, MaintenanceRequests()

### Community 71 - "useLandlordUnits.ts"
Cohesion: 0.47
Nodes (5): getLandlordUnitsQueryKey(), useLandlordUnits(), fetchLandlordUnits(), fetchMonthlyProfit(), LandlordUnitApartment

### Community 72 - "CustomTabBar.tsx"
Cohesion: 0.21
Nodes (9): CustomTabBar(), CustomTabConfig, Props, TabItemsProps, TablerIconComponent, LANDLORD_TABS, LandlordTabLayout(), TENANT_TABS (+1 more)

### Community 73 - "TabBar.tsx"
Cohesion: 0.31
Nodes (6): TabBar(), TabBarIcon(), TabBarIconProps, IconProps, LANDLORDICONS, TENANTICONS

### Community 74 - "live-capture.test.tsx"
Cohesion: 0.25
Nodes (8): captureAndReachReview(), DEFAULT_QUALITY_RESULT, mockBack, mockDismissTo, mockReplace, mockSearchParams, mockTakePictureAsync, setPermission()

### Community 75 - "rentals.tsx"
Cohesion: 0.15
Nodes (10): QuickActionButton(), QuickActionButtonProps, ApartmentDescriptionCard(), ApartmentDescriptionCardProps, PaymentSummaryCard(), PaymentSummaryCardProps, RentalsSkeleton(), TenancyEmptyState() (+2 more)

### Community 76 - "landlordService.test.ts"
Cohesion: 0.33
Nodes (4): LandlordPaymentRecord, mockFrom, QueryResult, ROW

### Community 77 - "applications/index.ts"
Cohesion: 0.18
Nodes (17): ApplicationStatusCard(), Props, ApplicationApartment(), ApplicationStatus, ApplicationStatusStyle, ChipColor, FALLBACK_STYLE(), useApplicationStatusStyles() (+9 more)

### Community 78 - "reset-password.tsx"
Cohesion: 0.50
Nodes (3): ResetPassword(), AppInput(), AppInputProps

### Community 81 - "visit-requests/index.tsx"
Cohesion: 0.05
Nodes (48): EmptyApproved(), EmptyPending(), VisitRequestCalendar(), VisitRequestCalendarProps, VisitRequestCard(), VisitRequestCardProps, VisitRequestCardSkeleton(), DATE_RANGE_OPTIONS (+40 more)

### Community 82 - "useApplicationActions.test.tsx"
Cohesion: 0.18
Nodes (14): getStatusStyle(), TenantApplicationDetails(), createWrapper(), mockEq, mockFrom, mockUpdate, mockUseCurrentUser, useApplicationActions() (+6 more)

### Community 83 - "notification-toast.tsx"
Cohesion: 0.40
Nodes (5): MOCK_TOASTS, MockRow, MockToast, NotificationToastDevScreen(), showNotificationToast()

### Community 84 - "history/index.tsx"
Cohesion: 0.12
Nodes (23): PaymentHistoryCard(), PaymentHistoryCardProps, EMPTY_FILTERS, FlatPayment, PaymentHistoryScreen(), toFlatPayment(), ReceiptCardProps, PaymentHistoryCard() (+15 more)

### Community 86 - "metro.config.js"
Cohesion: 0.33
Nodes (5): config, { getDefaultConfig }, monorepoRoot, path, { withUniwindConfig }

### Community 87 - "Welcome to your Expo app 👋"
Cohesion: 0.33
Nodes (5): Get a fresh project, Get started, Join the community, Learn more, Welcome to your Expo app 👋

### Community 89 - "uniwind-types.d.ts"
Cohesion: 0.50
Nodes (3): NOTE: This file is generated by uniwind and it should not be edited manually., uniwind, UniwindConfig

### Community 98 - "upload-id.test.tsx"
Cohesion: 0.25
Nodes (7): BACK_CAPTURE, FRONT_CAPTURE, mockBack, mockPush, mockReplace, mockUseFocusEffect, SELFIE_CAPTURE

### Community 100 - "[sectionId].tsx"
Cohesion: 0.22
Nodes (14): SectionDetail(), scorePreferences(), SECTION_DEFS, SectionId, transformApartments(), useSearchSections(), UseSearchSectionsParams, hasPersonalization() (+6 more)

### Community 125 - "ApplicationList.tsx"
Cohesion: 0.36
Nodes (3): ApplicationsList(), ApplicationsEmptyState(), ApplicationStatusCardSkeleton()

### Community 165 - "useDocumentUrls.ts"
Cohesion: 0.33
Nodes (5): DocEntry, ResolvedDoc, DocumentEntriesProps, mockResolvePrivateMediaUrls, useDocumentUrls()

### Community 167 - "request-visit.tsx"
Cohesion: 0.47
Nodes (4): RequestVisit(), Props, QuantityField(), useSubmitVisitRequest()

### Community 172 - "rate-apartment.tsx"
Cohesion: 0.16
Nodes (11): FormErrors, RateApartmentSkeleton(), ErrorDialogState, FormErrors, TenancyLeasePeriod, ApartmentInformation, DisplayImage, UploadFileField() (+3 more)

## Knowledge Gaps
- **619 isolated node(s):** `googleMapsKey`, `ProfileForm`, `requiredFields`, `ProfileForm`, `requiredFields` (+614 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **71 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useColors()` connect `useColors` to `apartments/index.ts`, `ScreenWrapper.tsx`, `map-search.tsx`, `reviews/index.tsx`, `dashboardService.ts`, `useApartmentFormStore`, `useConversations.test.tsx`, `search.tsx`, `ErrorDialog.tsx`, `RatingsSection.tsx`, `sign-in.tsx`, `apartment/[apartmentId]/index.tsx`, `images.ts`, `ai-search.tsx`, `usePersonalizationStore.ts`, `notificationService.ts`, `useVerificationStore`, `[conversationId].tsx`, `notifications/index.ts`, `PaymentMethodSelector.tsx`, `payments/index.ts`, `landlordService.ts`, `tenant-applications/index.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `ProfitByPropertyCard.tsx`, `units.tsx`, `maintenance-requests/index.ts`, `auth/index.ts`, `MapPreviewSection.tsx`, `favorites.tsx`, `dashboard.tsx`, `payment/index.tsx`, `rate-apartment.tsx`, `queryClient.ts`, `app/_layout.tsx`, `components/index.ts`, `useTenancy`, `document-id/index.tsx`, `ProfitTrendCard.tsx`, `second-step.tsx`, `maintenanceService.ts`, `RescheduleSheet.tsx`, `fifth-step.tsx`, `useLandlordActionBadges`, `useLandlordTenancy.ts`, `ChatBubble.tsx`, `maintenance-requests/index.tsx`, `CustomTabBar.tsx`, `TabBar.tsx`, `rentals.tsx`, `applications/index.ts`, `reset-password.tsx`, `visit-requests/index.tsx`, `useApplicationActions.test.tsx`, `history/index.tsx`, `[sectionId].tsx`, `ApplicationList.tsx`?**
  _High betweenness centrality (0.273) - this node is a cross-community bridge._
- **Why does `ScreenWrapper` connect `ScreenWrapper.tsx` to `apartments/index.ts`, `map-search.tsx`, `reviews/index.tsx`, `useApartmentFormStore`, `search.tsx`, `ErrorDialog.tsx`, `sign-in.tsx`, `apartment/[apartmentId]/index.tsx`, `images.ts`, `ai-search.tsx`, `usePersonalizationStore.ts`, `notificationService.ts`, `useVerificationStore`, `[conversationId].tsx`, `useColors`, `tenant-applications/index.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `units.tsx`, `maintenance-requests/index.ts`, `auth/index.ts`, `request-visit.tsx`, `favorites.tsx`, `dashboard.tsx`, `payment/index.tsx`, `rate-apartment.tsx`, `queryClient.ts`, `components/index.ts`, `document-id/index.tsx`, `second-step.tsx`, `fifth-step.tsx`, `maintenance-requests/index.tsx`, `rentals.tsx`, `reset-password.tsx`, `visit-requests/index.tsx`, `history/index.tsx`, `[sectionId].tsx`, `ApplicationList.tsx`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `useCurrentUser()` connect `auth/index.ts` to `ScreenWrapper.tsx`, `reviews/index.tsx`, `dashboardService.ts`, `useConversations.test.tsx`, `apartment/[apartmentId]/index.tsx`, `notificationService.ts`, `chatService.ts`, `[conversationId].tsx`, `NotificationList.tsx`, `useColors`, `payment/index.tsx`, `app/_layout.tsx`, `useTenancy`, `useNotifications.ts`, `useLandlordActionBadges`, `useInAppNotificationBanner.tsx`, `useLandlordUnits.ts`, `applications/index.ts`, `useApplicationActions.test.tsx`, `[sectionId].tsx`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `googleMapsKey`, `ProfileForm`, `requiredFields` to the rest of the system?**
  _619 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ScreenWrapper.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07231638418079096 - nodes in this community are weakly interconnected._
- **Should `map-search.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06919945725915876 - nodes in this community are weakly interconnected._
- **Should `reviews/index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09615384615384616 - nodes in this community are weakly interconnected._