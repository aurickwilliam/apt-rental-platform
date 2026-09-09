# Graph Report - mobile  (2026-09-09)

## Corpus Check
- 468 files · ~647,896 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2036 nodes · 4833 edges · 188 communities (117 shown, 71 thin omitted)
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
- ratings/index.ts
- dashboardService.ts
- fifth-step.tsx
- useConversations.test.tsx
- search.tsx
- profilesService.ts
- useColors
- devDependencies
- RatingsSection.tsx
- sign-in.tsx
- apartment/[apartmentId]/index.tsx
- privateMediaResolver.ts
- paymentService.ts
- saved-methods/index.tsx
- ai-search.tsx
- usePersonalizationStore.ts
- notificationService.ts
- useVerificationStore
- chatService.ts
- [conversationId].tsx
- useTheme.ts
- paymongoService.ts
- paths
- notifications/index.ts
- PaymentMethodSelector.tsx
- payment-history/index.tsx
- landlordService.ts
- [tenantId].tsx
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
- ApartmentsList.tsx
- dashboard.tsx
- payment/index.tsx
- updateApartmentMain.ts
- audit-fix.characterization.test.ts
- useProfile
- maintenance-requests/index.tsx
- app/_layout.tsx
- ApartmentHeroSection.tsx
- useTenancy
- document-id/index.tsx
- ProfitTrendCard.tsx
- tenantApplicationsService.test.ts
- useChatChannel.ts
- review-information.tsx
- useNotifications.ts
- maintenanceService.ts
- dependencies
- RescheduleSheet.tsx
- LandlordSection.tsx
- useLandlordActionBadges
- NotificationList.tsx
- onboarding.tsx
- queryClient.ts
- ChatBubble.tsx
- captureSequences.ts
- images.ts
- expo-linking
- useLandlordPayments.ts
- useApplicationFormStore.ts
- useInAppNotificationBanner.tsx
- CustomTabBar.tsx
- TabBar.tsx
- live-capture.test.tsx
- rentals.tsx
- edit-profile.tsx
- applications/index.ts
- reset-password.tsx
- app.config.js
- useLeaseAgreement
- visit-requests/index.tsx
- useApplicationActions.test.tsx
- (tenant)/chat.tsx
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
- ReceiptCard.tsx
- expo
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
Cohesion: 0.18
Nodes (15): ApartmentSummary(), ApartmentDetailsSection(), ApartmentDetailsSectionProps, IncludedPerks(), getApartmentDetailsQueryKey(), getApartmentReviewsPreviewQueryKey(), mockFetchApartmentDetails, mockFetchReviewsPreview (+7 more)

### Community 1 - "ScreenWrapper.tsx"
Cohesion: 0.07
Nodes (30): RateApartmentSkeleton(), DirectionMode, ErrorDialogState, FormErrors, TenancyLeasePeriod, DOCUMENT_TYPE_ICONS, TODO: Persist the uploaded document to Supabase Storage and store its, AnalyticsScreen() (+22 more)

### Community 2 - "map-search.tsx"
Cohesion: 0.08
Nodes (46): ApartmentMapViewScreen(), MapPin(), MapPreviewSheet(), Props, INITIAL_REGION, TenantMapSearchScreen(), GoogleMapPin, GoogleMapView() (+38 more)

### Community 3 - "ratings/index.ts"
Cohesion: 0.14
Nodes (22): RatingsPage(), ReviewsPage(), ApartmentReview, formatLeaseDuration(), getApartmentReviewsQueryKey(), getErrorMessage(), RatingBarCountData, ReviewSortOption (+14 more)

### Community 4 - "dashboardService.ts"
Cohesion: 0.17
Nodes (13): Dashboard(), EMPTY_DASHBOARD_DATA, getDashboardDataQueryKey(), getErrorMessage(), useDashboardData(), DashboardData, DashboardStats, fetchDashboardData() (+5 more)

### Community 5 - "fifth-step.tsx"
Cohesion: 0.06
Nodes (35): Amenities(), DEFAULT_COORDS, MAP_STYLE, FourthStep(), FormErrors, Index(), DEFAULT_COORDS, DEFAULT_ROOM_LIMITS (+27 more)

### Community 6 - "useConversations.test.tsx"
Cohesion: 0.11
Nodes (24): getConversationsQueryKey(), NewChatRow, createWrapper(), mockChannelFn, mockFetchConversations, mockGetChannels, mockRemoveChannel, mockUseCurrentUser (+16 more)

### Community 7 - "search.tsx"
Cohesion: 0.13
Nodes (16): DEFAULT_FILTERS, FilterBottomSheet(), FilterState, Props, ROOM_OPTS, SearchFiltersBar(), SearchFiltersBarProps, SearchHeader() (+8 more)

### Community 8 - "profilesService.ts"
Cohesion: 0.22
Nodes (14): getPublicLandlordProfileQueryKey(), usePublicLandlordProfile(), getPublicTenantProfileQueryKey(), usePublicTenantProfile(), fetchPublicLandlordProfile(), fetchPublicTenantProfile(), formatMonth(), formatYear() (+6 more)

### Community 9 - "useColors"
Cohesion: 0.08
Nodes (33): IconButton(), IconButtonProps, IconComponent, AuthCompleteProfile(), ProfileForm, requiredFields, CompleteProfile(), ProfileForm (+25 more)

### Community 10 - "devDependencies"
Cohesion: 0.05
Nodes (42): eslint, eslint-config-expo, eslint-import-resolver-typescript, expo-doctor, fast-check, jest, jest-expo, metro-minify-terser (+34 more)

### Community 11 - "RatingsSection.tsx"
Cohesion: 0.15
Nodes (13): ApartmentSkeleton(), ApartmentDescriptionSection(), ApartmentDescriptionSectionProps, LeaseAgreementSection(), LeaseAgreementSectionProps, PerksSection(), PerksSectionProps, RatingsSection() (+5 more)

### Community 12 - "sign-in.tsx"
Cohesion: 0.26
Nodes (9): AuthButton(), AuthButtonProps, AuthDivider(), AuthDividerProps, RoleTab(), RoleTabProps, SignIn(), SignUp() (+1 more)

### Community 13 - "apartment/[apartmentId]/index.tsx"
Cohesion: 0.16
Nodes (22): ApartmentScreen(), TenantFavorites(), getErrorMessage(), getFavoriteApartmentsQueryKey(), getFavoritesQueryKey(), createWrapper(), mockDeleteFavorite, mockFetchApartmentsByIds (+14 more)

### Community 14 - "privateMediaResolver.ts"
Cohesion: 0.15
Nodes (22): cacheKey(), chatMediaRetryKeys, claimChatMediaRetry(), clearPrivateMediaUrlCache(), getCachedPrivateMediaUrl(), getPrivateMediaCacheGeneration(), isPrivateMediaCacheGenerationCurrent(), setCachedPrivateMediaUrl() (+14 more)

### Community 15 - "paymentService.ts"
Cohesion: 0.18
Nodes (15): getPaymentByReferenceQueryKey(), getPaymentsQueryKey(), usePayments(), CreateCashPaymentParams, fetchPaymentById(), fetchPaymentByReferenceId(), fetchPayments(), METHOD_LABELS (+7 more)

### Community 16 - "saved-methods/index.tsx"
Cohesion: 0.19
Nodes (11): Add(), PAYMENT_METHOD_TYPES, PaymentMethodType, getLogoSource(), maskMobileNumber(), PaymentMethod, PaymentMethodCard(), PaymentMethodCardProps (+3 more)

### Community 17 - "ai-search.tsx"
Cohesion: 0.12
Nodes (17): AISearchScreen(), SUGGESTION_CHIPS, MessageBubble(), MessageBubbleProps, MessageComposer(), MessageComposerProps, ScrollToBottomButton(), ScrollToBottomButtonProps (+9 more)

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
Cohesion: 0.09
Nodes (32): Options, ChatMessagePlacement, mergeChatMessages(), AttachmentUploadFailure, buildOlderThanChatMessageFilter(), ChatMessageCursor, ChatMessagePage, EXTENSION_BY_MIME_TYPE (+24 more)

### Community 22 - "[conversationId].tsx"
Cohesion: 0.13
Nodes (16): ATTACHMENT_OPTIONS, ChatBox(), ChatBoxProps, StagedAsset, ChatEmptyState(), ChatEmptyStateProps, ChatLoadingSkeleton(), ChatScreen() (+8 more)

### Community 23 - "useTheme.ts"
Cohesion: 0.12
Nodes (18): RatingBarCount(), RatingBarCountProps, SORT_OPTIONS, NotificationScreenProps, PublicLandlordProfile(), TODO: Implement function to handle report landlord, BEDROOM_OPTIONS, FAMILY_OPTIONS (+10 more)

### Community 24 - "paymongoService.ts"
Cohesion: 0.17
Nodes (11): PaymentVerify(), extractError(), getCheckoutSessionStatus(), invoke(), PaymongoCard, PaymongoCardPaymentResult, PaymongoCheckoutSession, PaymongoEnvelope (+3 more)

### Community 25 - "paths"
Cohesion: 0.09
Nodes (22): ./assets/*, ./components/*, ./constants/*, expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.ts, ./hooks/*, ../../packages/ui/* (+14 more)

### Community 26 - "notifications/index.ts"
Cohesion: 0.27
Nodes (14): NotificationCard(), NotificationCardProps, NotificationSettingsScreen(), NotificationToastContent(), NotificationToastContentProps, NotificationToastOptions, TOAST_VARIANT_BY_TYPE, getNotificationTypeIcon() (+6 more)

### Community 27 - "PaymentMethodSelector.tsx"
Cohesion: 0.13
Nodes (17): CardInformation, CardPaymentForm(), CardPaymentFormProps, CashPaymentErrors, CashPaymentForm(), PaymentMethodButton(), PaymentMethodButtonProps, PaymentMethodButtonVariant (+9 more)

### Community 28 - "payment-history/index.tsx"
Cohesion: 0.26
Nodes (16): PaymentHistoryCard(), PaymentHistoryCardProps, EMPTY_FILTERS, FlatPayment, PaymentHistoryScreen(), toFlatPayment(), LandlordPaymentReceipt(), PaymentReceipt() (+8 more)

### Community 29 - "landlordService.ts"
Cohesion: 0.08
Nodes (30): FifthStep(), Index(), Index(), useLandlordStats(), getLandlordTenancyQueryKey(), useLandlordTenancy(), DB_TO_DISPLAY_STATUS, DbStatus (+22 more)

### Community 30 - "[tenantId].tsx"
Cohesion: 0.12
Nodes (18): PublicTenantProfile(), TODO: Implement function to handle report tenant, CompleteProfileCard(), CompleteProfileCardProps, ProfileHeader(), ProfileHeaderProps, AccountStatus, StatusConfig (+10 more)

### Community 31 - "tenant-applications/index.tsx"
Cohesion: 0.13
Nodes (15): ApplicationFilters, ApplicationFilterSheet(), LOCATION_OPTIONS, Props, STATUS_OPTIONS, EmptyApplications(), EmptySearchResults(), getInitials() (+7 more)

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
Cohesion: 0.47
Nodes (5): chartLabel(), ProfitByPropertyCard(), ProfitByPropertyCardProps, MONTHS, PropertyRevenue

### Community 36 - "units.tsx"
Cohesion: 0.12
Nodes (16): QuickActionButton(), QuickActionButtonProps, PropertyCard(), PropertyCardProps, PropertyCardSkeleton(), PropertyFilterSheet(), PropertyFilterSheetProps, SORT_LABELS (+8 more)

### Community 37 - "useFrameQualityCheck.ts"
Cohesion: 0.18
Nodes (13): GuidedFrameRect, CameraPermissionState, useCameraPermission(), UseCameraPermissionResult, evaluateBlurHeuristic(), evaluateGlareHeuristic(), FrameQualityCheckOptions, FrameQualityReason (+5 more)

### Community 38 - "maintenance-requests/index.ts"
Cohesion: 0.12
Nodes (24): EmptyMaintenanceRequestDetail(), MaintenanceRequestCard(), MaintenanceRequestCardProps, ResolveRequestDialog(), ResolveRequestDialogProps, MaintenanceRequestDetails(), MaintenanceRequestCard(), MaintenanceRequestCardProps (+16 more)

### Community 39 - "auth/index.ts"
Cohesion: 0.19
Nodes (13): RentalPreferences(), UseCountdownOptions, useCurrentUser(), useCurrentUserId(), DEFAULT_PREFS, prefsEqual(), useRentalPreferencesForm(), getCurrentUser() (+5 more)

### Community 40 - "MapPreviewSection.tsx"
Cohesion: 0.17
Nodes (10): DirectionMode, MapPreviewSection(), MapPreviewSectionProps, MoveInCostFooterProps, MoveInCostFooterSection(), AppDialog(), AppDialogProps, formatOrNone() (+2 more)

### Community 41 - "ApartmentsList.tsx"
Cohesion: 0.18
Nodes (13): ApartmentsList(), ApartmentsListProps, Props, SearchGridSkeleton(), SearchSection(), SearchSectionSkeleton(), Props, SearchSectionsList() (+5 more)

### Community 42 - "dashboard.tsx"
Cohesion: 0.27
Nodes (6): DashboardSkeleton(), ProfitTrendCard(), RentDueCard(), RentDueCardProps, EmptyProperties(), Props

### Community 43 - "payment/index.tsx"
Cohesion: 0.21
Nodes (12): validateCashPayment(), PaymentFooter(), PaymentFooterProps, PaymentSummaryCard(), PaymentSummaryCardProps, formatLeaseDate(), INITIAL_CARD, PaymentCheckout() (+4 more)

### Community 44 - "updateApartmentMain.ts"
Cohesion: 0.13
Nodes (22): EditMain(), validateForm(), ApartmentMainFields, deleteStorageImage(), ExistingImage, PendingImage, thumbPathFor(), updateApartmentMain() (+14 more)

### Community 45 - "audit-fix.characterization.test.ts"
Cohesion: 0.12
Nodes (10): ChatRow, mockChannel, mockChatRows, mockCreateSignedUrls, mockFrom, mockGetUser, mockRemoveChannel, mockStorageFrom (+2 more)

### Community 46 - "useProfile"
Cohesion: 0.15
Nodes (15): RateApartment(), StepFive(), TabsLayout(), useProfile(), getLandlordMaintenanceRequestsQueryKey(), getNextStatus(), STATUS_FLOW, useLandlordMaintenanceRequests() (+7 more)

### Community 47 - "maintenance-requests/index.tsx"
Cohesion: 0.19
Nodes (10): EmptyMaintenanceRequestsList(), MaintenanceRequestCardSkeleton(), LOCATION_OPTIONS, MaintenanceRequestFilters, MaintenanceRequestFilterSheet(), Props, STATUS_OPTIONS, URGENCY_OPTIONS (+2 more)

### Community 48 - "app/_layout.tsx"
Cohesion: 0.15
Nodes (15): MOCK_TOASTS, MockRow, MockToast, NotificationToastDevScreen(), NotificationManager(), RootLayout(), ThemeInitializer(), Index() (+7 more)

### Community 49 - "ApartmentHeroSection.tsx"
Cohesion: 0.50
Nodes (3): ApartmentHeroSection(), ApartmentHeroSectionProps, ApartmentImage

### Community 50 - "useTenancy"
Cohesion: 0.09
Nodes (32): CurrentApartmentDetails(), formatDateToMonthYear(), getErrorMessage(), getRecordString(), getTenancyQueryKey(), useTenancy(), attachPaymentChannel(), attachSubscriber() (+24 more)

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

### Community 55 - "review-information.tsx"
Cohesion: 0.12
Nodes (19): ReviewAccordionItem(), ReviewAccordionItemProps, ReviewDocumentFile(), ReviewDocumentFileProps, ReviewDocumentImage(), ReviewDocumentImageProps, FieldErrors, FirstProcess() (+11 more)

### Community 56 - "useNotifications.ts"
Cohesion: 0.17
Nodes (13): NotificationScreen(), NotificationBellButton(), NotificationBellButtonProps, useNotificationActions(), getErrorMessage(), getNotificationsQueryKey(), getUnreadNotificationsQueryKey(), useNotifications() (+5 more)

### Community 57 - "maintenanceService.ts"
Cohesion: 0.23
Nodes (12): MaintenanceHistory(), getMaintenanceRequestHistoryQueryKey(), useMaintenanceRequestHistory(), UseMaintenanceRequestHistoryParams, getLatestMaintenanceRequestQueryKey(), useMaintenanceRequests(), UseMaintenanceRequestsParams, cancelMaintenanceRequest() (+4 more)

### Community 58 - "dependencies"
Cohesion: 0.11
Nodes (19): emoji-regex-xs, expo-constants, expo-notifications, dependencies, emoji-regex-xs, expo-constants, expo-notifications, react-native-gesture-handler (+11 more)

### Community 59 - "RescheduleSheet.tsx"
Cohesion: 0.18
Nodes (10): Period, Props, RescheduleSheet(), tomorrow, toSupabaseTime(), HOURS, Period, PERIODS (+2 more)

### Community 60 - "LandlordSection.tsx"
Cohesion: 0.33
Nodes (4): LandlordSection(), LandlordSectionProps, LandlordCard(), LandlordCardProps

### Community 61 - "useLandlordActionBadges"
Cohesion: 0.16
Nodes (14): Units(), EMPTY_COUNTS, getLandlordBadgesQueryKey(), useLandlordActionBadges(), getLandlordUnitsQueryKey(), useLandlordUnits(), ActionBadgeCategory, ActionBadgeCounts (+6 more)

### Community 62 - "NotificationList.tsx"
Cohesion: 0.21
Nodes (10): NotificationCardType, NotificationCardSkeleton(), NotificationFilter, NotificationList(), NotificationListProps, useNotificationTapHandler(), markNotificationRead(), buildNotificationDeepLink() (+2 more)

### Community 63 - "onboarding.tsx"
Cohesion: 0.21
Nodes (7): { width }, OnBoardingSlide(), OnBoardingSlideProps, Slide, SLIDES, USER_ROLES, UserRole

### Community 64 - "queryClient.ts"
Cohesion: 0.10
Nodes (22): QueryProvider(), QueryProviderProps, createWrapper(), createWrapper(), mockFetchTenantApplications, mockUseCurrentUser, createWrapper(), mockFrom (+14 more)

### Community 65 - "ChatBubble.tsx"
Cohesion: 0.27
Nodes (8): calculateImageSize(), ChatBubble(), ChatBubbleProps, mockPlayer, VideoBubble(), VisualMediaBubble(), isEmojiOnly(), MessageType

### Community 66 - "captureSequences.ts"
Cohesion: 0.24
Nodes (8): ALL_SUPPORTED_ID_TYPES, CaptureCameraFacing, CaptureGuideShape, CARD_SEQUENCE, PASSPORT_SEQUENCE, SELFIE_STEP, SEQUENCE_BY_ID_TYPE, NON_PASSPORT_ID_TYPES

### Community 67 - "images.ts"
Cohesion: 0.15
Nodes (7): ChatHeader(), ChatHeaderProps, AIHeader(), AIHeaderProps, EmptyChatState(), DEFAULT_IMAGES, IMAGES

### Community 69 - "useLandlordPayments.ts"
Cohesion: 0.57
Nodes (5): getLandlordPaymentsQueryKey(), useLandlordPaymentConfirmation(), useLandlordPayments(), fetchLandlordPayments(), updateLandlordPaymentStatus()

### Community 70 - "useApplicationFormStore.ts"
Cohesion: 0.12
Nodes (17): DocKey, getContentType(), MIME_MAP, SubmitArgs, SubmitResult, uploadDoc(), ApartmentContext, ApplicationFormState (+9 more)

### Community 71 - "useInAppNotificationBanner.tsx"
Cohesion: 0.22
Nodes (11): getOpenChatConversationKey(), shouldSuppressChatToast(), attach(), ChannelEntry, detach(), handleEvent(), NotificationRealtimeCallbacks, registry (+3 more)

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
Cohesion: 0.16
Nodes (11): ApartmentDescriptionCard(), ApartmentDescriptionCardProps, PaymentSummaryCard(), PaymentSummaryCardProps, RentalsSkeleton(), TenancyEmptyState(), actions, actionsTypes (+3 more)

### Community 76 - "edit-profile.tsx"
Cohesion: 0.22
Nodes (10): EditProfile(), EditProfileForm, EMPTY_FORM, FormErrors, SuccessDialog(), SuccessDialogProps, BUCKET_MAP, UploadTarget (+2 more)

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

### Community 83 - "(tenant)/chat.tsx"
Cohesion: 0.36
Nodes (7): getLastMessageDisplay(), MessageCard(), MessageCardProps, Chat(), Chat(), EMPTY_STATE_IMAGES, useConversations()

### Community 84 - "history/index.tsx"
Cohesion: 0.15
Nodes (15): PaymentHistoryCard(), PaymentHistoryCardProps, PaymentHistoryItem, PaymentHistoryFilters, PaymentHistoryFilterSheet(), PaymentSort, Props, SORT_OPTIONS (+7 more)

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

### Community 172 - "ReceiptCard.tsx"
Cohesion: 0.29
Nodes (5): ReceiptCard(), ReceiptCardProps, STATUS_META, ZigzagEdge(), ZigzagEdgeProps

## Knowledge Gaps
- **619 isolated node(s):** `googleMapsKey`, `ProfileForm`, `requiredFields`, `ProfileForm`, `requiredFields` (+614 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **71 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useColors()` connect `useColors` to `apartments/index.ts`, `ScreenWrapper.tsx`, `map-search.tsx`, `ratings/index.ts`, `dashboardService.ts`, `fifth-step.tsx`, `search.tsx`, `RatingsSection.tsx`, `sign-in.tsx`, `apartment/[apartmentId]/index.tsx`, `saved-methods/index.tsx`, `ai-search.tsx`, `usePersonalizationStore.ts`, `notificationService.ts`, `useVerificationStore`, `[conversationId].tsx`, `useTheme.ts`, `notifications/index.ts`, `PaymentMethodSelector.tsx`, `payment-history/index.tsx`, `landlordService.ts`, `[tenantId].tsx`, `tenant-applications/index.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `ProfitByPropertyCard.tsx`, `units.tsx`, `maintenance-requests/index.ts`, `auth/index.ts`, `MapPreviewSection.tsx`, `ApartmentsList.tsx`, `dashboard.tsx`, `payment/index.tsx`, `ReceiptCard.tsx`, `updateApartmentMain.ts`, `useProfile`, `maintenance-requests/index.tsx`, `app/_layout.tsx`, `ApartmentHeroSection.tsx`, `useTenancy`, `document-id/index.tsx`, `ProfitTrendCard.tsx`, `review-information.tsx`, `useNotifications.ts`, `maintenanceService.ts`, `RescheduleSheet.tsx`, `LandlordSection.tsx`, `ChatBubble.tsx`, `images.ts`, `CustomTabBar.tsx`, `TabBar.tsx`, `rentals.tsx`, `edit-profile.tsx`, `applications/index.ts`, `reset-password.tsx`, `visit-requests/index.tsx`, `useApplicationActions.test.tsx`, `(tenant)/chat.tsx`, `history/index.tsx`, `[sectionId].tsx`, `ApplicationList.tsx`?**
  _High betweenness centrality (0.274) - this node is a cross-community bridge._
- **Why does `ScreenWrapper` connect `ScreenWrapper.tsx` to `apartments/index.ts`, `map-search.tsx`, `fifth-step.tsx`, `search.tsx`, `useColors`, `RatingsSection.tsx`, `sign-in.tsx`, `apartment/[apartmentId]/index.tsx`, `saved-methods/index.tsx`, `ai-search.tsx`, `usePersonalizationStore.ts`, `notificationService.ts`, `useVerificationStore`, `[conversationId].tsx`, `useTheme.ts`, `payment-history/index.tsx`, `[tenantId].tsx`, `tenant-applications/index.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `units.tsx`, `maintenance-requests/index.ts`, `request-visit.tsx`, `dashboard.tsx`, `payment/index.tsx`, `useProfile`, `maintenance-requests/index.tsx`, `document-id/index.tsx`, `review-information.tsx`, `images.ts`, `rentals.tsx`, `edit-profile.tsx`, `reset-password.tsx`, `visit-requests/index.tsx`, `(tenant)/chat.tsx`, `history/index.tsx`, `[sectionId].tsx`, `ApplicationList.tsx`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `useCurrentUser()` connect `auth/index.ts` to `ratings/index.ts`, `dashboardService.ts`, `useConversations.test.tsx`, `apartment/[apartmentId]/index.tsx`, `notificationService.ts`, `chatService.ts`, `[conversationId].tsx`, `useTheme.ts`, `[tenantId].tsx`, `payment/index.tsx`, `useProfile`, `app/_layout.tsx`, `useTenancy`, `useNotifications.ts`, `useLandlordActionBadges`, `NotificationList.tsx`, `queryClient.ts`, `useInAppNotificationBanner.tsx`, `applications/index.ts`, `useApplicationActions.test.tsx`, `(tenant)/chat.tsx`, `[sectionId].tsx`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `googleMapsKey`, `ProfileForm`, `requiredFields` to the rest of the system?**
  _619 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ScreenWrapper.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0673903211216644 - nodes in this community are weakly interconnected._
- **Should `map-search.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07595628415300547 - nodes in this community are weakly interconnected._
- **Should `ratings/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._