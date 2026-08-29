# Graph Report - mobile  (2026-08-28)

## Corpus Check
- 447 files · ~637,725 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1992 nodes · 4722 edges · 162 communities (92 shown, 70 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `db3db822`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- apartment/[apartmentId]/index.tsx
- ScreenWrapper.tsx
- RatingsSection.tsx
- reviews/index.tsx
- dashboardService.ts
- saved-methods/index.tsx
- useConversations.test.tsx
- search.tsx
- fifth-step.tsx
- edit-profile.tsx
- devDependencies
- expo
- expo-router
- rate-apartment.tsx
- privateMediaResolver.ts
- paymentService.ts
- images.ts
- ai-search.tsx
- usePersonalizationStore.ts
- notificationService.ts
- useVerificationStore
- chatService.ts
- [conversationId].tsx
- useNotifications.ts
- paymongoService.ts
- paths
- notifications/index.ts
- PaymentMethodSelector.tsx
- payment-history/index.tsx
- landlordService.ts
- description/index.tsx
- tenant-applications/index.tsx
- useColors
- upload-id.tsx
- live-capture.tsx
- ProfitTrendCard.tsx
- units.tsx
- useFrameQualityCheck.ts
- dependencies
- ProfitByPropertyCard.tsx
- MapPreviewSection.tsx
- NotificationScreen.tsx
- history/index.tsx
- payment/index.tsx
- edit-main.tsx
- audit-fix.characterization.test.ts
- useApplicationActions.test.tsx
- useLandlordActionBadges
- DocumentRow.tsx
- ApplicationList.tsx
- useTenancy
- DocumentCard.tsx
- pending.tsx
- visit-requests/index.tsx
- useChat.ts
- dashboard.tsx
- useLandlordUnits.ts
- rentals.tsx
- emoji-regex-xs
- RescheduleSheet.tsx
- useApplicationFormStore.ts
- chatService.pagination.test.ts
- useInAppNotificationBanner.tsx
- onboarding.tsx
- applications/[applicationId].tsx
- ChatBubble.tsx
- apartments/index.ts
- map-view.tsx
- useLandlordPayments.ts
- captureSequences.ts
- auth/index.ts
- TabBar.tsx
- live-capture.test.tsx
- useTenantApplications
- CustomTabBar.tsx
- upload-id.test.tsx
- useNotificationRealtime.ts
- applications/index.ts
- LandlordSection.tsx
- ReceiptCard.tsx
- metro.config.js
- Welcome to your Expo app 👋
- playground.tsx
- uniwind-types.d.ts
- ReviewField.tsx
- StatusPill.tsx
- eslint.config.js
- reset-password.tsx
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
- @react-native-community/datetimepicker
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
- queryClient.ts
- expo-camera
- useVisitRequest.ts
- useLandlordStats

## God Nodes (most connected - your core abstractions)
1. `useColors()` - 332 edges
2. `expo-router` - 132 edges
3. `ScreenWrapper` - 100 edges
4. `StandardHeader()` - 52 edges
5. `useCurrentUser()` - 48 edges
6. `useProfile()` - 42 edges
7. `useApartmentDetails()` - 23 edges
8. `useTenancy()` - 20 edges
9. `resolvePrivateMediaUrls()` - 20 edges
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

## Communities (162 total, 70 thin omitted)

### Community 0 - "apartment/[apartmentId]/index.tsx"
Cohesion: 0.12
Nodes (13): ApartmentSkeleton(), ApartmentDescriptionSection(), ApartmentDescriptionSectionProps, ApartmentDetailsSection(), ApartmentDetailsSectionProps, ApartmentHeroSection(), ApartmentHeroSectionProps, ApartmentImage (+5 more)

### Community 1 - "ScreenWrapper.tsx"
Cohesion: 0.07
Nodes (27): DOCUMENT_TYPE_ICONS, TODO: Persist the uploaded document to Supabase Storage and store its, AnalyticsScreen(), MAX_AMOUNT, monthlyData, stats, TenantApplicationDetailsSkeleton(), EmptyRequestData() (+19 more)

### Community 2 - "RatingsSection.tsx"
Cohesion: 0.40
Nodes (4): RatingsSection(), RatingsSectionProps, SmallRatingCard(), SmallRatingCardProps

### Community 3 - "reviews/index.tsx"
Cohesion: 0.06
Nodes (47): RatingBarCount(), RatingBarCountProps, ApartmentScreen(), RatingsPage(), ReviewsPage(), SORT_OPTIONS, DropdownButton(), DropdownButtonProps (+39 more)

### Community 4 - "dashboardService.ts"
Cohesion: 0.17
Nodes (13): Dashboard(), EMPTY_DASHBOARD_DATA, getDashboardDataQueryKey(), getErrorMessage(), useDashboardData(), DashboardData, DashboardStats, fetchDashboardData() (+5 more)

### Community 5 - "saved-methods/index.tsx"
Cohesion: 0.19
Nodes (11): Add(), PAYMENT_METHOD_TYPES, PaymentMethodType, getLogoSource(), maskMobileNumber(), PaymentMethod, PaymentMethodCard(), PaymentMethodCardProps (+3 more)

### Community 6 - "useConversations.test.tsx"
Cohesion: 0.10
Nodes (27): Chat(), Chat(), getConversationsQueryKey(), NewChatRow, createWrapper(), mockChannelFn, mockFetchConversations, mockGetChannels (+19 more)

### Community 7 - "search.tsx"
Cohesion: 0.06
Nodes (50): ApartmentsList(), ApartmentsListProps, DEFAULT_FILTERS, FilterBottomSheet(), FilterState, Props, ROOM_OPTS, SearchFiltersBar() (+42 more)

### Community 8 - "fifth-step.tsx"
Cohesion: 0.07
Nodes (31): FieldErrors, FormErrors, Amenities(), DEFAULT_COORDS, MAP_STYLE, FourthStep(), FormErrors, Index() (+23 more)

### Community 9 - "edit-profile.tsx"
Cohesion: 0.10
Nodes (25): AuthCompleteProfile(), ProfileForm, requiredFields, CompleteProfile(), ProfileForm, requiredFields, OTPVerification(), OTPVerification() (+17 more)

### Community 10 - "devDependencies"
Cohesion: 0.05
Nodes (42): eslint, eslint-config-expo, eslint-import-resolver-typescript, expo-doctor, fast-check, jest, jest-expo, metro-minify-terser (+34 more)

### Community 11 - "expo"
Cohesion: 0.05
Nodes (39): backgroundColor, foregroundImage, adaptiveIcon, googleServicesFile, package, permissions, predictiveBackGestureEnabled, softwareKeyboardLayoutMode (+31 more)

### Community 13 - "rate-apartment.tsx"
Cohesion: 0.10
Nodes (17): ReviewAccordionItem(), ReviewAccordionItemProps, ReviewDocumentFile(), ReviewDocumentFileProps, ReviewDocumentImage(), ReviewDocumentImageProps, FormErrors, RateApartmentSkeleton() (+9 more)

### Community 14 - "privateMediaResolver.ts"
Cohesion: 0.11
Nodes (28): DocEntry, ResolvedDoc, DocumentEntriesProps, mockResolvePrivateMediaUrls, useDocumentUrls(), cacheKey(), chatMediaRetryKeys, claimChatMediaRetry() (+20 more)

### Community 15 - "paymentService.ts"
Cohesion: 0.18
Nodes (15): getPaymentByReferenceQueryKey(), getPaymentsQueryKey(), usePayments(), CreateCashPaymentParams, fetchPaymentById(), fetchPaymentByReferenceId(), fetchPayments(), METHOD_LABELS (+7 more)

### Community 16 - "images.ts"
Cohesion: 0.08
Nodes (22): AuthButton(), AuthButtonProps, AuthDivider(), AuthDividerProps, RoleTab(), RoleTabProps, SignIn(), SignUp() (+14 more)

### Community 17 - "ai-search.tsx"
Cohesion: 0.10
Nodes (18): AISearchScreen(), SUGGESTION_CHIPS, AIHeader(), EmptyChatState(), MessageBubble(), MessageBubbleProps, MessageComposer(), MessageComposerProps (+10 more)

### Community 18 - "usePersonalizationStore.ts"
Cohesion: 0.12
Nodes (20): CityCheckBox(), CityCheckBoxProps, PersonalizationProgress(), Props, PersonalizationRadioButton(), PersonalizationRadioButtonProps, StepFive(), StepFour() (+12 more)

### Community 19 - "notificationService.ts"
Cohesion: 0.20
Nodes (14): GENERAL_TOGGLES, GeneralToggleKey, NOTIFICATION_TYPE_LABELS, getNotificationPreferencesQueryKey(), useNotificationPreferences(), usePushRegistration(), DEFAULT_NOTIFICATION_PREFERENCES, deletePushToken() (+6 more)

### Community 20 - "useVerificationStore"
Cohesion: 0.15
Nodes (17): getCaptureSequence(), SelectId(), SelfiePrep(), Success(), UploadSelfie(), StepProgress(), StepProgressProps, useVerificationStore (+9 more)

### Community 21 - "chatService.ts"
Cohesion: 0.17
Nodes (18): AttachmentUploadFailure, buildOlderThanChatMessageFilter(), ChatMessagePage, EXTENSION_BY_MIME_TYPE, fetchMessagePage(), fetchMessages(), generateId(), getChatAttachmentSignedUrls() (+10 more)

### Community 22 - "[conversationId].tsx"
Cohesion: 0.15
Nodes (14): ATTACHMENT_OPTIONS, ChatBox(), ChatBoxProps, StagedAsset, ChatEmptyState(), ChatEmptyStateProps, ChatLoadingSkeleton(), ChatScreen() (+6 more)

### Community 23 - "useNotifications.ts"
Cohesion: 0.33
Nodes (11): useNotificationActions(), useNotificationRealtime(), getErrorMessage(), getNotificationsQueryKey(), getUnreadNotificationsQueryKey(), useNotifications(), useUnreadNotificationCount(), fetchNotifications() (+3 more)

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
Nodes (18): CardInformation, CardPaymentForm(), CardPaymentFormProps, CashPaymentErrors, CashPaymentForm(), CashPaymentFormProps, PaymentMethodButton(), PaymentMethodButtonProps (+10 more)

### Community 28 - "payment-history/index.tsx"
Cohesion: 0.26
Nodes (16): PaymentHistoryCard(), PaymentHistoryCardProps, EMPTY_FILTERS, FlatPayment, PaymentHistoryScreen(), toFlatPayment(), LandlordPaymentReceipt(), PaymentReceipt() (+8 more)

### Community 29 - "landlordService.ts"
Cohesion: 0.11
Nodes (22): Index(), Index(), useLandlordTenancy(), DB_TO_DISPLAY_STATUS, DbStatus, DISPLAY_TO_DB_STATUS, fetchLandlordTenancy(), fetchManageApartmentDescription() (+14 more)

### Community 30 - "description/index.tsx"
Cohesion: 0.13
Nodes (14): PerksSectionProps, EditPerks(), BasePerkButtonProps, PerkButton(), PerkButtonProps, CurrentApartmentDetails(), formatDateToMonthYear(), Divider() (+6 more)

### Community 31 - "tenant-applications/index.tsx"
Cohesion: 0.14
Nodes (14): ApplicationFilters, ApplicationFilterSheet(), LOCATION_OPTIONS, Props, STATUS_OPTIONS, EmptyApplications(), EmptySearchResults(), getInitials() (+6 more)

### Community 32 - "useColors"
Cohesion: 0.06
Nodes (43): Index(), Failed(), SelectDocument(), Upload(), EmptyMaintenanceRequestDetail(), ResolveRequestDialog(), ResolveRequestDialogProps, MaintenanceRequestCard() (+35 more)

### Community 33 - "upload-id.tsx"
Cohesion: 0.22
Nodes (13): CaptureStepConfig, CaptureStepSummary(), CaptureStepSummaryProps, UploadId(), CaptureProgress, computeCanContinue(), getCaptureProgress(), IdCaptureResult (+5 more)

### Community 34 - "live-capture.tsx"
Cohesion: 0.16
Nodes (10): getNextCaptureStep(), CapturedPhoto, LiveCapture(), ScreenState, computeFillRatio(), computeGuidedFrameRect(), GuidedFrameOverlay(), GuidedFrameOverlayProps (+2 more)

### Community 35 - "ProfitTrendCard.tsx"
Cohesion: 0.20
Nodes (9): BUILDERS, ChartDatum, FilterOption, filterOptions, ProfitTrendCard(), ProfitTrendCardProps, toMonthly(), monthLabel() (+1 more)

### Community 36 - "units.tsx"
Cohesion: 0.12
Nodes (16): QuickActionButton(), QuickActionButtonProps, PropertyCard(), PropertyCardProps, PropertyCardSkeleton(), PropertyFilterSheet(), PropertyFilterSheetProps, SORT_LABELS (+8 more)

### Community 37 - "useFrameQualityCheck.ts"
Cohesion: 0.18
Nodes (13): GuidedFrameRect, CameraPermissionState, useCameraPermission(), UseCameraPermissionResult, evaluateBlurHeuristic(), evaluateGlareHeuristic(), FrameQualityCheckOptions, FrameQualityReason (+5 more)

### Community 38 - "dependencies"
Cohesion: 0.11
Nodes (19): expo, expo-constants, expo-router, dependencies, expo, expo-constants, expo-router, react-native-gesture-handler (+11 more)

### Community 39 - "ProfitByPropertyCard.tsx"
Cohesion: 0.31
Nodes (7): chartLabel(), ProfitByPropertyCard(), ProfitByPropertyCardProps, MONTHS, EmptyState(), EmptyStateProps, PropertyRevenue

### Community 40 - "MapPreviewSection.tsx"
Cohesion: 0.33
Nodes (5): DEFAULT_COORDS, DirectionMode, MAP_STYLE, MapPreviewSection(), MapPreviewSectionProps

### Community 41 - "NotificationScreen.tsx"
Cohesion: 0.20
Nodes (7): NotificationCardType, NotificationCardSkeleton(), NotificationFilter, NotificationList(), NotificationListProps, NotificationScreen(), NotificationScreenProps

### Community 42 - "history/index.tsx"
Cohesion: 0.15
Nodes (14): PaymentHistoryCard(), PaymentHistoryCardProps, PaymentHistoryItem, PaymentHistoryFilters, PaymentHistoryFilterSheet(), PaymentSort, Props, SORT_OPTIONS (+6 more)

### Community 43 - "payment/index.tsx"
Cohesion: 0.19
Nodes (14): validateCashPayment(), PaymentFooter(), PaymentFooterProps, PaymentSummaryCard(), PaymentSummaryCardProps, formatLeaseDate(), INITIAL_CARD, PaymentCheckout() (+6 more)

### Community 44 - "edit-main.tsx"
Cohesion: 0.08
Nodes (32): EditProfile(), FifthStep(), ApartmentInformation, DisplayImage, EditMain(), validateForm(), ApartmentMainFields, deleteStorageImage() (+24 more)

### Community 45 - "audit-fix.characterization.test.ts"
Cohesion: 0.12
Nodes (10): ChatRow, mockChannel, mockChatRows, mockCreateSignedUrls, mockFrom, mockGetUser, mockRemoveChannel, mockStorageFrom (+2 more)

### Community 46 - "useApplicationActions.test.tsx"
Cohesion: 0.18
Nodes (14): getStatusStyle(), TenantApplicationDetails(), createWrapper(), mockEq, mockFrom, mockUpdate, mockUseCurrentUser, useApplicationActions() (+6 more)

### Community 47 - "useLandlordActionBadges"
Cohesion: 0.22
Nodes (10): TenantApplications(), Units(), EMPTY_COUNTS, getLandlordBadgesQueryKey(), useLandlordActionBadges(), ActionBadgeCategory, ActionBadgeCounts, fetchLandlordApartmentIds() (+2 more)

### Community 48 - "DocumentRow.tsx"
Cohesion: 0.50
Nodes (4): DocumentRow(), DocumentRowProps, getExtension(), IMAGE_EXTENSIONS

### Community 49 - "ApplicationList.tsx"
Cohesion: 0.36
Nodes (3): ApplicationsList(), ApplicationsEmptyState(), ApplicationStatusCardSkeleton()

### Community 50 - "useTenancy"
Cohesion: 0.09
Nodes (30): getErrorMessage(), getRecordString(), getTenancyQueryKey(), useTenancy(), attachPaymentChannel(), attachSubscriber(), attachTenantChannel(), Channel (+22 more)

### Community 51 - "DocumentCard.tsx"
Cohesion: 0.33
Nodes (7): DocumentCard(), DocumentCardProps, Index(), DOCUMENT_EXTENSIONS, getExtension(), IMAGE_EXTENSIONS, isImageUri()

### Community 52 - "pending.tsx"
Cohesion: 0.19
Nodes (11): EmptyPending(), VisitRequestCardSkeleton(), DATE_RANGE_OPTIONS, DateRange, Props, STATUS_OPTIONS, VisitRequestFilters, VisitRequestFilterSheet() (+3 more)

### Community 53 - "visit-requests/index.tsx"
Cohesion: 0.15
Nodes (14): EmptyApproved(), VisitRequestCalendar(), VisitRequestCalendarProps, getGroup(), Group, GROUP_ORDER, GroupedItem, PastToggle() (+6 more)

### Community 54 - "useChat.ts"
Cohesion: 0.11
Nodes (23): Options, useChat(), BroadcastEvent, BroadcastPayload, PresenceJoinEvent, PresenceLeaveEvent, PresenceState, ChannelHandler (+15 more)

### Community 55 - "dashboard.tsx"
Cohesion: 0.23
Nodes (7): DashboardSkeleton(), RentDueCard(), RentDueCardProps, NotificationBellButton(), NotificationBellButtonProps, EmptyProperties(), Props

### Community 56 - "useLandlordUnits.ts"
Cohesion: 0.47
Nodes (5): getLandlordUnitsQueryKey(), useLandlordUnits(), fetchLandlordUnits(), fetchMonthlyProfit(), LandlordUnitApartment

### Community 57 - "rentals.tsx"
Cohesion: 0.05
Nodes (56): EmptyMaintenanceRequestsList(), MaintenanceRequestCard(), MaintenanceRequestCardProps, MaintenanceRequestCardSkeleton(), LOCATION_OPTIONS, MaintenanceRequestFilters, MaintenanceRequestFilterSheet(), Props (+48 more)

### Community 59 - "RescheduleSheet.tsx"
Cohesion: 0.18
Nodes (10): Period, Props, RescheduleSheet(), tomorrow, toSupabaseTime(), HOURS, Period, PERIODS (+2 more)

### Community 60 - "useApplicationFormStore.ts"
Cohesion: 0.10
Nodes (23): FirstProcess(), ReviewInformation(), SecondProcess(), ThirdProcess(), DocKey, getContentType(), MIME_MAP, SubmitArgs (+15 more)

### Community 61 - "chatService.pagination.test.ts"
Cohesion: 0.20
Nodes (6): ChatRow, mockFrom, mockStorageFrom, pageResponses, QueryLog, queryLogs

### Community 62 - "useInAppNotificationBanner.tsx"
Cohesion: 0.24
Nodes (10): NotificationManager(), getOpenChatConversationKey(), shouldSuppressChatToast(), useInAppNotificationBanner(), useNotificationTapHandler(), markNotificationRead(), buildNotificationDeepLink(), NotificationData (+2 more)

### Community 63 - "onboarding.tsx"
Cohesion: 0.21
Nodes (7): { width }, OnBoardingSlide(), OnBoardingSlideProps, Slide, SLIDES, USER_ROLES, UserRole

### Community 64 - "applications/[applicationId].tsx"
Cohesion: 0.14
Nodes (15): VisitRequestCard(), VisitRequestCardProps, VisitRequestDetails(), Props, VisitRequest, VisitRequestCard(), Props, VisitRequestHistoryItem() (+7 more)

### Community 65 - "ChatBubble.tsx"
Cohesion: 0.27
Nodes (8): calculateImageSize(), ChatBubble(), ChatBubbleProps, mockPlayer, VideoBubble(), VisualMediaBubble(), isEmojiOnly(), MessageType

### Community 66 - "apartments/index.ts"
Cohesion: 0.26
Nodes (12): ApartmentSummary(), IncludedPerks(), RequestVisit(), getApartmentDetailsQueryKey(), getApartmentReviewsPreviewQueryKey(), useApartmentDetails(), UseApartmentDetailsOptions, ApartmentDetails (+4 more)

### Community 67 - "map-view.tsx"
Cohesion: 0.25
Nodes (7): IconButton(), IconButtonProps, IconComponent, ApartmentMapViewScreen(), DEFAULT_COORDS, DirectionMode, MAP_STYLE

### Community 69 - "useLandlordPayments.ts"
Cohesion: 0.24
Nodes (10): getLandlordPaymentsQueryKey(), useLandlordPaymentConfirmation(), useLandlordPayments(), getLandlordTenancyQueryKey(), fetchLandlordPayments(), LandlordPaymentRecord, mockFrom, QueryResult (+2 more)

### Community 70 - "captureSequences.ts"
Cohesion: 0.24
Nodes (8): ALL_SUPPORTED_ID_TYPES, CaptureCameraFacing, CaptureGuideShape, CARD_SEQUENCE, PASSPORT_SEQUENCE, SELFIE_STEP, SEQUENCE_BY_ID_TYPE, NON_PASSPORT_ID_TYPES

### Community 72 - "auth/index.ts"
Cohesion: 0.17
Nodes (15): RateApartment(), TabsLayout(), UseCountdownOptions, useCurrentUser(), useCurrentUserId(), useProfile(), SubmitReviewParams, SubmitReviewResult (+7 more)

### Community 73 - "TabBar.tsx"
Cohesion: 0.31
Nodes (6): TabBar(), TabBarIcon(), TabBarIconProps, IconProps, LANDLORDICONS, TENANTICONS

### Community 74 - "live-capture.test.tsx"
Cohesion: 0.25
Nodes (8): captureAndReachReview(), DEFAULT_QUALITY_RESULT, mockBack, mockDismissTo, mockReplace, mockSearchParams, mockTakePictureAsync, setPermission()

### Community 75 - "useTenantApplications"
Cohesion: 0.20
Nodes (11): getTenantApplicationsQueryKey(), useTenantApplications(), ApplicationDocument, ApplicationDocumentPathKey, ApplicationRow, DOCUMENT_DEFINITIONS, fetchTenantApplications(), TenantApplication (+3 more)

### Community 76 - "CustomTabBar.tsx"
Cohesion: 0.21
Nodes (9): CustomTabBar(), CustomTabConfig, Props, TabItemsProps, TablerIconComponent, LANDLORD_TABS, LandlordTabLayout(), TENANT_TABS (+1 more)

### Community 77 - "upload-id.test.tsx"
Cohesion: 0.25
Nodes (7): BACK_CAPTURE, FRONT_CAPTURE, mockBack, mockPush, mockReplace, mockUseFocusEffect, SELFIE_CAPTURE

### Community 81 - "useNotificationRealtime.ts"
Cohesion: 0.19
Nodes (12): MOCK_TOASTS, MockRow, MockToast, NotificationToastDevScreen(), showNotificationToast(), attach(), ChannelEntry, detach() (+4 more)

### Community 82 - "applications/index.ts"
Cohesion: 0.28
Nodes (9): ApplicationStatusCard(), Props, ApplicationApartment(), ApplicationStatus, ApplicationStatusStyle, ChipColor, FALLBACK_STYLE(), useApplicationStatusStyles() (+1 more)

### Community 83 - "LandlordSection.tsx"
Cohesion: 0.33
Nodes (4): LandlordSection(), LandlordSectionProps, LandlordCard(), LandlordCardProps

### Community 84 - "ReceiptCard.tsx"
Cohesion: 0.28
Nodes (6): ReceiptCard(), ReceiptCardProps, STATUS_META, ZigzagEdge(), ZigzagEdgeProps, PaymentStatus

### Community 86 - "metro.config.js"
Cohesion: 0.33
Nodes (5): config, { getDefaultConfig }, monorepoRoot, path, { withUniwindConfig }

### Community 87 - "Welcome to your Expo app 👋"
Cohesion: 0.33
Nodes (5): Get a fresh project, Get started, Join the community, Learn more, Welcome to your Expo app 👋

### Community 89 - "uniwind-types.d.ts"
Cohesion: 0.50
Nodes (3): NOTE: This file is generated by uniwind and it should not be edited manually., uniwind, UniwindConfig

### Community 97 - "reset-password.tsx"
Cohesion: 0.50
Nodes (3): ResetPassword(), AppInput(), AppInputProps

### Community 165 - "queryClient.ts"
Cohesion: 0.05
Nodes (43): plugins, RootLayout(), ThemeInitializer(), Index(), DevBadge(), QueryProvider(), QueryProviderProps, createWrapper() (+35 more)

### Community 167 - "useVisitRequest.ts"
Cohesion: 0.48
Nodes (5): getVisitRequestQueryKey(), useVisitRequest(), fetchVisitRequest(), VisitRequest, VisitRequestResult

### Community 169 - "useLandlordStats"
Cohesion: 0.67
Nodes (3): useLandlordStats(), fetchLandlordStats(), LandlordStats

## Knowledge Gaps
- **638 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+633 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **70 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useColors()` connect `useColors` to `apartment/[apartmentId]/index.tsx`, `ScreenWrapper.tsx`, `RatingsSection.tsx`, `reviews/index.tsx`, `dashboardService.ts`, `saved-methods/index.tsx`, `useConversations.test.tsx`, `search.tsx`, `fifth-step.tsx`, `edit-profile.tsx`, `rate-apartment.tsx`, `images.ts`, `ai-search.tsx`, `usePersonalizationStore.ts`, `notificationService.ts`, `useVerificationStore`, `[conversationId].tsx`, `notifications/index.ts`, `PaymentMethodSelector.tsx`, `payment-history/index.tsx`, `landlordService.ts`, `description/index.tsx`, `tenant-applications/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `ProfitTrendCard.tsx`, `units.tsx`, `queryClient.ts`, `ProfitByPropertyCard.tsx`, `MapPreviewSection.tsx`, `history/index.tsx`, `payment/index.tsx`, `edit-main.tsx`, `useApplicationActions.test.tsx`, `useLandlordActionBadges`, `DocumentRow.tsx`, `ApplicationList.tsx`, `DocumentCard.tsx`, `pending.tsx`, `visit-requests/index.tsx`, `dashboard.tsx`, `rentals.tsx`, `RescheduleSheet.tsx`, `applications/[applicationId].tsx`, `ChatBubble.tsx`, `apartments/index.ts`, `map-view.tsx`, `auth/index.ts`, `TabBar.tsx`, `CustomTabBar.tsx`, `applications/index.ts`, `LandlordSection.tsx`, `ReceiptCard.tsx`, `reset-password.tsx`?**
  _High betweenness centrality (0.209) - this node is a cross-community bridge._
- **Why does `expo-router` connect `expo-router` to `apartment/[apartmentId]/index.tsx`, `ScreenWrapper.tsx`, `reviews/index.tsx`, `saved-methods/index.tsx`, `search.tsx`, `fifth-step.tsx`, `edit-profile.tsx`, `rate-apartment.tsx`, `images.ts`, `usePersonalizationStore.ts`, `useVerificationStore`, `[conversationId].tsx`, `paymongoService.ts`, `payment-history/index.tsx`, `description/index.tsx`, `tenant-applications/index.tsx`, `useColors`, `upload-id.tsx`, `live-capture.tsx`, `units.tsx`, `queryClient.ts`, `useFrameQualityCheck.ts`, `NotificationScreen.tsx`, `history/index.tsx`, `payment/index.tsx`, `edit-main.tsx`, `ApplicationList.tsx`, `pending.tsx`, `visit-requests/index.tsx`, `dashboard.tsx`, `rentals.tsx`, `useInAppNotificationBanner.tsx`, `onboarding.tsx`, `applications/[applicationId].tsx`, `apartments/index.ts`, `map-view.tsx`, `auth/index.ts`, `CustomTabBar.tsx`, `applications/index.ts`, `playground.tsx`, `reset-password.tsx`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **Why does `ScreenWrapper` connect `ScreenWrapper.tsx` to `apartment/[apartmentId]/index.tsx`, `reviews/index.tsx`, `saved-methods/index.tsx`, `search.tsx`, `fifth-step.tsx`, `edit-profile.tsx`, `rate-apartment.tsx`, `images.ts`, `ai-search.tsx`, `usePersonalizationStore.ts`, `notificationService.ts`, `useVerificationStore`, `[conversationId].tsx`, `payment-history/index.tsx`, `description/index.tsx`, `tenant-applications/index.tsx`, `useColors`, `upload-id.tsx`, `live-capture.tsx`, `units.tsx`, `NotificationScreen.tsx`, `history/index.tsx`, `payment/index.tsx`, `edit-main.tsx`, `ApplicationList.tsx`, `pending.tsx`, `visit-requests/index.tsx`, `dashboard.tsx`, `rentals.tsx`, `applications/[applicationId].tsx`, `apartments/index.ts`, `map-view.tsx`, `reset-password.tsx`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _638 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `apartment/[apartmentId]/index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12380952380952381 - nodes in this community are weakly interconnected._
- **Should `ScreenWrapper.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.073224043715847 - nodes in this community are weakly interconnected._
- **Should `reviews/index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06299603174603174 - nodes in this community are weakly interconnected._