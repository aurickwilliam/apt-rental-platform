# Graph Report - mobile  (2026-09-03)

## Corpus Check
- 461 files · ~646,143 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2061 nodes · 4947 edges · 176 communities (107 shown, 69 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cf37116d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- apartments/index.ts
- ScreenWrapper.tsx
- map-view.tsx
- ratings/index.ts
- ProfitTrendCard.tsx
- fifth-step.tsx
- useConversations.test.tsx
- search.tsx
- useApartmentFormStore
- ErrorDialog.tsx
- devDependencies
- expo
- expo-router
- queryClient.ts
- privateMediaResolver.ts
- paymentService.ts
- add.tsx
- ai-search.tsx
- step-five.tsx
- notifications.tsx
- useVerificationStore
- chatService.ts
- [conversationId].tsx
- NotificationScreen.tsx
- paymongoService.ts
- paths
- notifications/index.ts
- PaymentMethodSelector.tsx
- payment-history/[paymentId].tsx
- landlordService.ts
- [tenantId].tsx
- tenant-applications/index.tsx
- useColors
- upload-id.tsx
- live-capture.tsx
- [landlordId].tsx
- units.tsx
- useFrameQualityCheck.ts
- applications/[applicationId].tsx
- auth/index.ts
- plugins
- useTheme.ts
- payment-history/index.tsx
- payment/index.tsx
- edit-main.tsx
- audit-fix.characterization.test.ts
- maintenance-requests/index.ts
- maintenance-requests/index.tsx
- app/_layout.tsx
- android
- useTenancy
- document-id/index.tsx
- infoPlist
- useTenantApplications
- useChat.ts
- review-information.tsx
- notificationService.ts
- maintenanceService.ts
- dependencies
- RescheduleSheet.tsx
- useApplicationFormStore.ts
- useLandlordActionBadges
- useInAppNotificationBanner.tsx
- onboarding.tsx
- visit-requests/index.tsx
- ChatBubble.tsx
- captureSequences.ts
- chatService.pagination.test.ts
- expo-linking
- useLandlordPayments.ts
- useRentalPreferencesForm.ts
- pending.tsx
- CustomTabBar.tsx
- TabBar.tsx
- live-capture.test.tsx
- rentals.tsx
- visitRequests/index.ts
- applications/index.ts
- usePersonalizationStore.ts
- useSubmitApplication.ts
- ApplicationHeader.tsx
- applications/components/VisitRequestCard.tsx
- tenant-applications/[applicationId].tsx
- useNotificationRealtime.ts
- history/index.tsx
- web
- metro.config.js
- Welcome to your Expo app 👋
- playground.tsx
- uniwind-types.d.ts
- ReviewField.tsx
- StatusPill.tsx
- eslint.config.js
- ios
- upload-id.test.tsx
- expo-crypto
- useSearchSections.ts
- expo-device
- expo-document-picker
- expo-file-system
- expo-font
- expo-haptics
- expo-image
- expo-image-manipulator
- expo-image-picker
- expo-linear-gradient
- second-step.tsx
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
- ApplicationList.tsx
- expo-constants
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
- react-native-gesture-handler
- react-native-webview
- react-native-worklets
- @react-navigation/bottom-tabs
- @react-navigation/elements
- @react-navigation/native
- @react-navigation/native-stack
- @repo/constants
- @repo/hooks
- @repo/utils
- react-native-keyboard-aware-scroll-view
- @tabler/icons-react-native
- tailwind-merge
- react-native-linear-gradient
- @tanstack/react-query
- uniwind
- zustand
- CR80_ASPECT_RATIO
- useDocumentUrls.ts
- expo-camera
- useProfile
- permissions
- react-native-maps
- react-native-svg-transformer
- @repo/supabase
- third-process.tsx
- experiments
- useVisitRequest.ts
- extra

## God Nodes (most connected - your core abstractions)
1. `useColors()` - 340 edges
2. `expo-router` - 134 edges
3. `ScreenWrapper` - 101 edges
4. `StandardHeader()` - 53 edges
5. `useCurrentUser()` - 52 edges
6. `useProfile()` - 42 edges
7. `useApartmentDetails()` - 23 edges
8. `useFavorites()` - 20 edges
9. `useTenancy()` - 20 edges
10. `resolvePrivateMediaUrls()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `CaptureStepSummary()` --calls--> `useColors()`  [EXTRACTED]
  app/(auth)/verify-account/upload-id.tsx → hooks/useTheme.ts
- `LandlordTabLayout()` --calls--> `useColors()`  [EXTRACTED]
  app/(tabs)/(landlord)/_layout.tsx → hooks/useTheme.ts
- `TenantTabLayout()` --calls--> `useColors()`  [EXTRACTED]
  app/(tabs)/(tenant)/_layout.tsx → hooks/useTheme.ts
- `SecondProcess()` --calls--> `useApplicationFormStore`  [EXTRACTED]
  app/apartment/[apartmentId]/apply/second-process.tsx → stores/useApplicationFormStore.ts
- `ThirdProcess()` --calls--> `useApplicationFormStore`  [EXTRACTED]
  app/apartment/[apartmentId]/apply/third-process.tsx → stores/useApplicationFormStore.ts

## Import Cycles
- 2-file cycle: `hooks/applications/index.ts -> hooks/applications/useApplicationActions.ts -> hooks/applications/index.ts`
- 2-file cycle: `hooks/applications/index.ts -> service/applications/tenantApplicationsService.ts -> hooks/applications/index.ts`
- 3-file cycle: `hooks/applications/index.ts -> hooks/applications/useTenantApplications.ts -> service/applications/tenantApplicationsService.ts -> hooks/applications/index.ts`
- 3-file cycle: `hooks/payments/index.ts -> hooks/payments/usePayments.ts -> service/payments/paymentService.ts -> hooks/payments/index.ts`

## Communities (176 total, 69 thin omitted)

### Community 0 - "apartments/index.ts"
Cohesion: 0.07
Nodes (33): ApartmentSummary(), ApartmentSkeleton(), ApartmentDescriptionSection(), ApartmentDescriptionSectionProps, ApartmentDetailsSection(), ApartmentDetailsSectionProps, ApartmentHeroSection(), ApartmentHeroSectionProps (+25 more)

### Community 1 - "ScreenWrapper.tsx"
Cohesion: 0.06
Nodes (31): FieldErrors, DOCUMENT_TYPE_ICONS, TODO: Persist the uploaded document to Supabase Storage and store its, EditProfileForm, EMPTY_FORM, FormErrors, AnalyticsScreen(), MAX_AMOUNT (+23 more)

### Community 2 - "map-view.tsx"
Cohesion: 0.07
Nodes (46): IconButton(), IconButtonProps, IconComponent, DirectionMode, MapPreviewSection(), MapPreviewSectionProps, ApartmentMapViewScreen(), DirectionMode (+38 more)

### Community 3 - "ratings/index.ts"
Cohesion: 0.07
Nodes (42): RateApartment(), RatingsPage(), ReviewsPage(), PublicLandlordProfile(), PublicTenantProfile(), getPublicLandlordProfileQueryKey(), usePublicLandlordProfile(), getPublicTenantProfileQueryKey() (+34 more)

### Community 4 - "ProfitTrendCard.tsx"
Cohesion: 0.10
Nodes (22): BUILDERS, ChartDatum, FilterOption, filterOptions, ProfitTrendCard(), ProfitTrendCardProps, toMonthly(), Dashboard() (+14 more)

### Community 5 - "fifth-step.tsx"
Cohesion: 0.13
Nodes (14): PerksSectionProps, DEFAULT_COORDS, MAP_STYLE, EditPerks(), BasePerkButtonProps, PerkButton(), PerkButtonProps, Divider() (+6 more)

### Community 6 - "useConversations.test.tsx"
Cohesion: 0.11
Nodes (26): Chat(), getConversationsQueryKey(), NewChatRow, createWrapper(), mockChannelFn, mockFetchConversations, mockGetChannels, mockRemoveChannel (+18 more)

### Community 7 - "search.tsx"
Cohesion: 0.12
Nodes (17): ApartmentsList(), DEFAULT_FILTERS, FilterBottomSheet(), FilterState, Props, ROOM_OPTS, SearchFiltersBar(), SearchFiltersBarProps (+9 more)

### Community 8 - "useApartmentFormStore"
Cohesion: 0.19
Nodes (10): Amenities(), FourthStep(), FormErrors, Index(), FieldErrors, ThirdStep(), ApartmentFormActions, ApartmentFormData (+2 more)

### Community 9 - "ErrorDialog.tsx"
Cohesion: 0.16
Nodes (15): AuthCompleteProfile(), ProfileForm, requiredFields, CompleteProfile(), ProfileForm, requiredFields, OTPVerification(), OTPVerification() (+7 more)

### Community 10 - "devDependencies"
Cohesion: 0.05
Nodes (42): eslint, eslint-config-expo, eslint-import-resolver-typescript, expo-doctor, fast-check, jest, jest-expo, metro-minify-terser (+34 more)

### Community 11 - "expo"
Cohesion: 0.22
Nodes (8): expo, icon, name, orientation, scheme, slug, userInterfaceStyle, version

### Community 12 - "expo-router"
Cohesion: 0.04
Nodes (12): AuthButton(), AuthButtonProps, AuthDivider(), AuthDividerProps, RoleTab(), RoleTabProps, SignIn(), SignUp() (+4 more)

### Community 13 - "queryClient.ts"
Cohesion: 0.06
Nodes (48): TenantFavorites(), QueryProvider(), QueryProviderProps, createWrapper(), mockFetchApartmentDetails, mockFetchReviewsPreview, createWrapper(), mockFetchTenantApplications (+40 more)

### Community 14 - "privateMediaResolver.ts"
Cohesion: 0.15
Nodes (23): cacheKey(), chatMediaRetryKeys, claimChatMediaRetry(), clearPrivateMediaUrlCache(), getCachedPrivateMediaUrl(), getPrivateMediaCacheGeneration(), isPrivateMediaCacheGenerationCurrent(), setCachedPrivateMediaUrl() (+15 more)

### Community 15 - "paymentService.ts"
Cohesion: 0.17
Nodes (17): getPaymentByReferenceQueryKey(), getPaymentQueryKey(), getPaymentsQueryKey(), usePaymentByReference(), usePayments(), CreateCashPaymentParams, fetchPaymentById(), fetchPaymentByReferenceId() (+9 more)

### Community 16 - "add.tsx"
Cohesion: 0.22
Nodes (9): Add(), PAYMENT_METHOD_TYPES, PaymentMethodType, getLogoSource(), maskMobileNumber(), PaymentMethod, PaymentMethodCard(), PaymentMethodCardProps (+1 more)

### Community 17 - "ai-search.tsx"
Cohesion: 0.10
Nodes (18): AISearchScreen(), SUGGESTION_CHIPS, AIHeader(), EmptyChatState(), MessageBubble(), MessageBubbleProps, MessageComposer(), MessageComposerProps (+10 more)

### Community 18 - "step-five.tsx"
Cohesion: 0.19
Nodes (12): CityCheckBox(), CityCheckBoxProps, PersonalizationProgress(), Props, PersonalizationRadioButton(), PersonalizationRadioButtonProps, StepFive(), StepFour() (+4 more)

### Community 19 - "notifications.tsx"
Cohesion: 0.16
Nodes (14): GENERAL_TOGGLES, GeneralToggleKey, NotificationSettingsScreen(), NOTIFICATION_TYPE_LABELS, getNotificationPreferencesQueryKey(), useNotificationPreferences(), usePushRegistration(), DEFAULT_NOTIFICATION_PREFERENCES (+6 more)

### Community 20 - "useVerificationStore"
Cohesion: 0.15
Nodes (17): getCaptureSequence(), SelectId(), SelfiePrep(), Success(), UploadSelfie(), StepProgress(), StepProgressProps, useVerificationStore (+9 more)

### Community 21 - "chatService.ts"
Cohesion: 0.18
Nodes (16): AttachmentUploadFailure, ChatMessagePage, EXTENSION_BY_MIME_TYPE, fetchOtherUserProfile(), generateId(), getChatAttachmentSignedUrls(), insertAttachmentMessagesBatch(), mapMessages() (+8 more)

### Community 22 - "[conversationId].tsx"
Cohesion: 0.12
Nodes (17): ATTACHMENT_OPTIONS, ChatBox(), ChatBoxProps, StagedAsset, ChatEmptyState(), ChatEmptyStateProps, ChatHeader(), ChatHeaderProps (+9 more)

### Community 23 - "NotificationScreen.tsx"
Cohesion: 0.23
Nodes (7): NotificationCardSkeleton(), NotificationFilter, NotificationList(), NotificationListProps, NotificationScreen(), NotificationScreenProps, useNotificationActions()

### Community 24 - "paymongoService.ts"
Cohesion: 0.17
Nodes (11): PaymentVerify(), extractError(), getCheckoutSessionStatus(), invoke(), PaymongoCard, PaymongoCardPaymentResult, PaymongoCheckoutSession, PaymongoEnvelope (+3 more)

### Community 25 - "paths"
Cohesion: 0.09
Nodes (22): ./assets/*, ./components/*, ./constants/*, expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.ts, ./hooks/*, ../../packages/ui/* (+14 more)

### Community 26 - "notifications/index.ts"
Cohesion: 0.26
Nodes (14): NotificationCard(), NotificationCardProps, NotificationCardType, NotificationToastContent(), NotificationToastContentProps, NotificationToastOptions, TOAST_VARIANT_BY_TYPE, getNotificationTypeIcon() (+6 more)

### Community 27 - "PaymentMethodSelector.tsx"
Cohesion: 0.13
Nodes (18): CardInformation, CardPaymentForm(), CardPaymentFormProps, CashPaymentErrors, CashPaymentForm(), CashPaymentFormProps, PaymentMethodButton(), PaymentMethodButtonProps (+10 more)

### Community 28 - "payment-history/[paymentId].tsx"
Cohesion: 0.38
Nodes (12): PaymentHistoryCard(), PaymentHistoryCardProps, LandlordPaymentReceipt(), ReceiptCard(), toHistoryItem(), PaymentReceipt(), Success(), usePayment() (+4 more)

### Community 29 - "landlordService.ts"
Cohesion: 0.10
Nodes (26): Index(), Index(), getLandlordUnitsQueryKey(), useLandlordUnits(), useLandlordTenancy(), DB_TO_DISPLAY_STATUS, DbStatus, DISPLAY_TO_DB_STATUS (+18 more)

### Community 30 - "[tenantId].tsx"
Cohesion: 0.13
Nodes (17): TODO: Implement function to handle report tenant, CompleteProfileCard(), CompleteProfileCardProps, ProfileHeader(), ProfileHeaderProps, AccountStatus, StatusConfig, VerificationStatus() (+9 more)

### Community 31 - "tenant-applications/index.tsx"
Cohesion: 0.13
Nodes (15): ApplicationFilters, ApplicationFilterSheet(), LOCATION_OPTIONS, Props, STATUS_OPTIONS, EmptyApplications(), EmptySearchResults(), getInitials() (+7 more)

### Community 32 - "useColors"
Cohesion: 0.07
Nodes (33): Index(), ResetPassword(), Failed(), SelectDocument(), Upload(), EmptyMaintenanceRequestDetail(), MaintenanceRequestCard(), ResolveRequestDialog() (+25 more)

### Community 33 - "upload-id.tsx"
Cohesion: 0.22
Nodes (13): CaptureStepConfig, CaptureStepSummary(), CaptureStepSummaryProps, UploadId(), CaptureProgress, computeCanContinue(), getCaptureProgress(), IdCaptureResult (+5 more)

### Community 34 - "live-capture.tsx"
Cohesion: 0.16
Nodes (10): getNextCaptureStep(), CapturedPhoto, LiveCapture(), ScreenState, computeFillRatio(), computeGuidedFrameRect(), GuidedFrameOverlay(), GuidedFrameOverlayProps (+2 more)

### Community 35 - "[landlordId].tsx"
Cohesion: 0.14
Nodes (15): RatingBarCount(), RatingBarCountProps, SORT_OPTIONS, TODO: Implement function to handle report landlord, BEDROOM_OPTIONS, FAMILY_OPTIONS, NO_PARKING_OPTIONS, DropdownButton() (+7 more)

### Community 36 - "units.tsx"
Cohesion: 0.10
Nodes (18): QuickActionButton(), QuickActionButtonProps, EmptyProperties(), Props, PropertyCard(), PropertyCardProps, PropertyCardSkeleton(), PropertyFilterSheet() (+10 more)

### Community 37 - "useFrameQualityCheck.ts"
Cohesion: 0.18
Nodes (13): GuidedFrameRect, CameraPermissionState, useCameraPermission(), UseCameraPermissionResult, evaluateBlurHeuristic(), evaluateGlareHeuristic(), FrameQualityCheckOptions, FrameQualityReason (+5 more)

### Community 38 - "applications/[applicationId].tsx"
Cohesion: 0.12
Nodes (17): RateApartmentSkeleton(), ErrorDialogState, FormErrors, TenancyLeasePeriod, EmptyRequestData(), MaintenanceDetails, MaintenanceErrors, RequestMaintenance() (+9 more)

### Community 39 - "auth/index.ts"
Cohesion: 0.36
Nodes (7): UseCountdownOptions, useCurrentUser(), useCurrentUserId(), getCurrentUser(), getUserProfileByColumn(), getUserProfileById(), UserProfile

### Community 40 - "plugins"
Cohesion: 0.40
Nodes (5): plugins, expo-font, expo-video, @maplibre/maplibre-react-native, @react-native-community/datetimepicker

### Community 41 - "useTheme.ts"
Cohesion: 0.14
Nodes (19): DashboardSkeleton(), chartLabel(), ProfitByPropertyCard(), ProfitByPropertyCardProps, RentDueCard(), RentDueCardProps, ApartmentsListProps, Props (+11 more)

### Community 42 - "payment-history/index.tsx"
Cohesion: 0.24
Nodes (9): EMPTY_FILTERS, FlatPayment, PaymentHistoryScreen(), toFlatPayment(), PaymentHistoryFilters, PaymentHistoryFilterSheet(), PaymentSort, Props (+1 more)

### Community 43 - "payment/index.tsx"
Cohesion: 0.18
Nodes (15): Rentals(), validateCashPayment(), PaymentFooter(), PaymentFooterProps, PaymentSummaryCard(), PaymentSummaryCardProps, formatLeaseDate(), INITIAL_CARD (+7 more)

### Community 44 - "edit-main.tsx"
Cohesion: 0.10
Nodes (29): EditProfile(), ApartmentInformation, DisplayImage, EditMain(), validateForm(), ApartmentMainFields, deleteStorageImage(), ExistingImage (+21 more)

### Community 45 - "audit-fix.characterization.test.ts"
Cohesion: 0.12
Nodes (11): ChatRow, mockChannel, mockChatRows, mockCreateSignedUrls, mockFrom, mockGetUser, mockRemoveChannel, mockStorageFrom (+3 more)

### Community 46 - "maintenance-requests/index.ts"
Cohesion: 0.23
Nodes (12): MaintenanceRequestCardProps, getLandlordMaintenanceRequestsQueryKey(), getNextStatus(), STATUS_FLOW, useLandlordMaintenanceRequests(), MaintenanceCategorySlug, MaintenanceUrgencySlug, SubmitMaintenanceRequestInput (+4 more)

### Community 47 - "maintenance-requests/index.tsx"
Cohesion: 0.21
Nodes (9): EmptyMaintenanceRequestsList(), MaintenanceRequestCardSkeleton(), LOCATION_OPTIONS, MaintenanceRequestFilters, MaintenanceRequestFilterSheet(), Props, STATUS_OPTIONS, URGENCY_OPTIONS (+1 more)

### Community 48 - "app/_layout.tsx"
Cohesion: 0.18
Nodes (9): RootLayout(), ThemeInitializer(), Index(), DevBadge(), useTheme(), expo-web-browser, ThemeMode, ThemeStore (+1 more)

### Community 49 - "android"
Cohesion: 0.18
Nodes (11): backgroundColor, foregroundImage, adaptiveIcon, config, googleServicesFile, package, predictiveBackGestureEnabled, softwareKeyboardLayoutMode (+3 more)

### Community 50 - "useTenancy"
Cohesion: 0.08
Nodes (33): Chat(), CurrentApartmentDetails(), formatDateToMonthYear(), getErrorMessage(), getRecordString(), getTenancyQueryKey(), useTenancy(), attachPaymentChannel() (+25 more)

### Community 51 - "document-id/index.tsx"
Cohesion: 0.23
Nodes (11): DocumentCard(), DocumentCardProps, Index(), TODO: Implement contact support functionality,, TODO: Fetch and display user's uploaded documents and IDs here. This may…, UploadedDocument, DOCUMENT_EXTENSIONS, getExtension() (+3 more)

### Community 52 - "infoPlist"
Cohesion: 0.33
Nodes (6): ITSAppUsesNonExemptEncryption, NSCameraUsageDescription, NSLocationAlwaysAndWhenInUseUsageDescription, NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, infoPlist

### Community 53 - "useTenantApplications"
Cohesion: 0.20
Nodes (11): getTenantApplicationsQueryKey(), useTenantApplications(), ApplicationDocument, ApplicationDocumentPathKey, ApplicationRow, DOCUMENT_DEFINITIONS, fetchTenantApplications(), TenantApplication (+3 more)

### Community 54 - "useChat.ts"
Cohesion: 0.11
Nodes (24): Options, useChat(), BroadcastEvent, BroadcastPayload, PresenceJoinEvent, PresenceLeaveEvent, PresenceState, ChannelHandler (+16 more)

### Community 55 - "review-information.tsx"
Cohesion: 0.21
Nodes (10): ReviewAccordionItem(), ReviewAccordionItemProps, ReviewDocumentFile(), ReviewDocumentFileProps, ReviewDocumentImage(), ReviewDocumentImageProps, FirstProcess(), ReviewInformation() (+2 more)

### Community 56 - "notificationService.ts"
Cohesion: 0.25
Nodes (13): NotificationBellButton(), NotificationBellButtonProps, useNotificationRealtime(), getErrorMessage(), getNotificationsQueryKey(), getUnreadNotificationsQueryKey(), useNotifications(), useUnreadNotificationCount() (+5 more)

### Community 57 - "maintenanceService.ts"
Cohesion: 0.19
Nodes (15): MaintenanceHistory(), StatusStyle, getMaintenanceRequestHistoryQueryKey(), useMaintenanceRequestHistory(), UseMaintenanceRequestHistoryParams, getLatestMaintenanceRequestQueryKey(), useMaintenanceRequests(), UseMaintenanceRequestsParams (+7 more)

### Community 58 - "dependencies"
Cohesion: 0.12
Nodes (17): emoji-regex-xs, expo, expo-dev-client, heroui-native, dependencies, emoji-regex-xs, expo, expo-dev-client (+9 more)

### Community 59 - "RescheduleSheet.tsx"
Cohesion: 0.18
Nodes (10): Period, Props, RescheduleSheet(), tomorrow, toSupabaseTime(), HOURS, Period, PERIODS (+2 more)

### Community 60 - "useApplicationFormStore.ts"
Cohesion: 0.18
Nodes (10): ApartmentContext, ApplicationFormState, initialApartmentContext, initialDocuments, initialRentalPreferences, initialTenantInformation, initialUploadedPaths, RentalPreferences (+2 more)

### Community 61 - "useLandlordActionBadges"
Cohesion: 0.22
Nodes (10): MaintenanceRequests(), Units(), EMPTY_COUNTS, getLandlordBadgesQueryKey(), useLandlordActionBadges(), ActionBadgeCategory, ActionBadgeCounts, fetchLandlordApartmentIds() (+2 more)

### Community 62 - "useInAppNotificationBanner.tsx"
Cohesion: 0.24
Nodes (10): NotificationManager(), getOpenChatConversationKey(), shouldSuppressChatToast(), useInAppNotificationBanner(), useNotificationTapHandler(), markNotificationRead(), buildNotificationDeepLink(), NotificationData (+2 more)

### Community 63 - "onboarding.tsx"
Cohesion: 0.21
Nodes (7): { width }, OnBoardingSlide(), OnBoardingSlideProps, Slide, SLIDES, USER_ROLES, UserRole

### Community 64 - "visit-requests/index.tsx"
Cohesion: 0.18
Nodes (10): EmptyApproved(), VisitRequestCalendar(), VisitRequestCalendarProps, VisitRequestCardSkeleton(), getGroup(), Group, GROUP_ORDER, GroupedItem (+2 more)

### Community 65 - "ChatBubble.tsx"
Cohesion: 0.27
Nodes (8): calculateImageSize(), ChatBubble(), ChatBubbleProps, mockPlayer, VideoBubble(), VisualMediaBubble(), isEmojiOnly(), MessageType

### Community 66 - "captureSequences.ts"
Cohesion: 0.24
Nodes (8): ALL_SUPPORTED_ID_TYPES, CaptureCameraFacing, CaptureGuideShape, CARD_SEQUENCE, PASSPORT_SEQUENCE, SELFIE_STEP, SEQUENCE_BY_ID_TYPE, NON_PASSPORT_ID_TYPES

### Community 67 - "chatService.pagination.test.ts"
Cohesion: 0.20
Nodes (6): ChatRow, mockFrom, mockStorageFrom, pageResponses, QueryLog, queryLogs

### Community 69 - "useLandlordPayments.ts"
Cohesion: 0.17
Nodes (14): FifthStep(), getLandlordPaymentsQueryKey(), useLandlordPaymentConfirmation(), useLandlordPayments(), useLandlordStats(), getLandlordTenancyQueryKey(), fetchLandlordPayments(), fetchLandlordStats() (+6 more)

### Community 70 - "useRentalPreferencesForm.ts"
Cohesion: 0.38
Nodes (6): RentalPreferences(), DEFAULT_PREFS, prefsEqual(), useRentalPreferencesForm(), parsePreferences(), CURRENT_USER_QUERY_KEY

### Community 71 - "pending.tsx"
Cohesion: 0.22
Nodes (10): EmptyPending(), DATE_RANGE_OPTIONS, DateRange, Props, STATUS_OPTIONS, VisitRequestFilters, VisitRequestFilterSheet(), EMPTY_FILTERS (+2 more)

### Community 72 - "CustomTabBar.tsx"
Cohesion: 0.15
Nodes (13): getLastMessageDisplay(), MessageCard(), MessageCardProps, CustomTabBar(), CustomTabConfig, Props, TabItemsProps, TablerIconComponent (+5 more)

### Community 73 - "TabBar.tsx"
Cohesion: 0.31
Nodes (6): TabBar(), TabBarIcon(), TabBarIconProps, IconProps, LANDLORDICONS, TENANTICONS

### Community 74 - "live-capture.test.tsx"
Cohesion: 0.25
Nodes (8): captureAndReachReview(), DEFAULT_QUALITY_RESULT, mockBack, mockDismissTo, mockReplace, mockSearchParams, mockTakePictureAsync, setPermission()

### Community 75 - "rentals.tsx"
Cohesion: 0.19
Nodes (8): ApartmentDescriptionCard(), ApartmentDescriptionCardProps, PaymentSummaryCard(), PaymentSummaryCardProps, RentalsSkeleton(), TenancyEmptyState(), actions, actionsTypes

### Community 76 - "visitRequests/index.ts"
Cohesion: 0.27
Nodes (8): VisitRequestDetails(), getLandlordVisitRequestsQueryKey(), useLandlordVisitRequests(), useRespondToReschedule(), ActionStatus, useVisitRequestActions(), fetchLandlordVisitRequests(), LandlordVisitRequest

### Community 77 - "applications/index.ts"
Cohesion: 0.18
Nodes (15): ApplicationStatusCard(), Props, ApplicationApartment(), ApplicationStatus, ApplicationStatusStyle, ChipColor, FALLBACK_STYLE(), useApplicationStatusStyles() (+7 more)

### Community 78 - "usePersonalizationStore.ts"
Cohesion: 0.22
Nodes (8): DEFAULT_STATE, PersonalizationActions, PersonalizationState, PersonalizationStep1, PersonalizationStep2, PersonalizationStep3, PersonalizationStep4, PersonalizationStep5

### Community 79 - "useSubmitApplication.ts"
Cohesion: 0.29
Nodes (7): DocKey, getContentType(), MIME_MAP, SubmitArgs, SubmitResult, uploadDoc(), UploadedDocumentPaths

### Community 80 - "ApplicationHeader.tsx"
Cohesion: 0.28
Nodes (6): FormErrors, SecondProcess(), ApplicationHeader(), ApplicationHeaderProps, CircleProgress(), CircleProgressProps

### Community 81 - "applications/components/VisitRequestCard.tsx"
Cohesion: 0.16
Nodes (11): VisitRequestCard(), VisitRequestCardProps, Props, VisitRequest, VisitRequestCard(), Props, VisitRequestHistoryItem(), FALLBACK_STYLE() (+3 more)

### Community 82 - "tenant-applications/[applicationId].tsx"
Cohesion: 0.12
Nodes (17): getStatusStyle(), TenantApplicationDetails(), EmptyApplicationData(), TenantApplicationDetailsSkeleton(), DocumentRow(), DocumentRowProps, getExtension(), IMAGE_EXTENSIONS (+9 more)

### Community 83 - "useNotificationRealtime.ts"
Cohesion: 0.19
Nodes (12): MOCK_TOASTS, MockRow, MockToast, NotificationToastDevScreen(), showNotificationToast(), attach(), ChannelEntry, detach() (+4 more)

### Community 84 - "history/index.tsx"
Cohesion: 0.15
Nodes (13): ReceiptCardProps, STATUS_META, ZigzagEdge(), ZigzagEdgeProps, PaymentHistoryCard(), PaymentHistoryCardProps, PaymentHistoryItem, EMPTY_FILTERS (+5 more)

### Community 85 - "web"
Cohesion: 0.50
Nodes (4): web, bundler, favicon, output

### Community 86 - "metro.config.js"
Cohesion: 0.33
Nodes (5): config, { getDefaultConfig }, monorepoRoot, path, { withUniwindConfig }

### Community 87 - "Welcome to your Expo app 👋"
Cohesion: 0.33
Nodes (5): Get a fresh project, Get started, Join the community, Learn more, Welcome to your Expo app 👋

### Community 89 - "uniwind-types.d.ts"
Cohesion: 0.50
Nodes (3): NOTE: This file is generated by uniwind and it should not be edited manually., uniwind, UniwindConfig

### Community 97 - "ios"
Cohesion: 0.22
Nodes (9): googleMapsApiKey, ios, dark, light, tinted, bundleIdentifier, config, icon (+1 more)

### Community 98 - "upload-id.test.tsx"
Cohesion: 0.25
Nodes (7): BACK_CAPTURE, FRONT_CAPTURE, mockBack, mockPush, mockReplace, mockUseFocusEffect, SELFIE_CAPTURE

### Community 100 - "useSearchSections.ts"
Cohesion: 0.19
Nodes (14): SectionDetail(), scorePreferences(), SearchSection, SECTION_DEFS, SectionId, transformApartments(), useSearchSections(), UseSearchSectionsParams (+6 more)

### Community 110 - "second-step.tsx"
Cohesion: 0.36
Nodes (7): DEFAULT_COORDS, DEFAULT_ROOM_LIMITS, formatLimitMessage(), formatRange(), FormErrors, isZeroRange(), SecondStep()

### Community 125 - "ApplicationList.tsx"
Cohesion: 0.36
Nodes (3): ApplicationsList(), ApplicationsEmptyState(), ApplicationStatusCardSkeleton()

### Community 165 - "useDocumentUrls.ts"
Cohesion: 0.33
Nodes (4): DocEntry, ResolvedDoc, DocumentEntriesProps, mockResolvePrivateMediaUrls

### Community 167 - "useProfile"
Cohesion: 0.38
Nodes (5): TabsLayout(), RequestVisit(), useProfile(), useSubmitVisitRequest(), VisitRequestPayload

### Community 168 - "permissions"
Cohesion: 0.50
Nodes (4): permissions, android.permission.ACCESS_COARSE_LOCATION, android.permission.ACCESS_FINE_LOCATION, android.permission.CAMERA

### Community 172 - "third-process.tsx"
Cohesion: 0.40
Nodes (4): FormErrors, ThirdProcess(), UploadFileField(), UploadFileFieldProps

### Community 173 - "experiments"
Cohesion: 0.67
Nodes (3): reactCompiler, typedRoutes, experiments

### Community 174 - "useVisitRequest.ts"
Cohesion: 0.48
Nodes (5): getVisitRequestQueryKey(), useVisitRequest(), fetchVisitRequest(), VisitRequest, VisitRequestResult

### Community 177 - "extra"
Cohesion: 0.67
Nodes (3): projectId, extra, eas

## Knowledge Gaps
- **646 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+641 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **69 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useColors()` connect `useColors` to `apartments/index.ts`, `ScreenWrapper.tsx`, `map-view.tsx`, `ratings/index.ts`, `ProfitTrendCard.tsx`, `fifth-step.tsx`, `useConversations.test.tsx`, `search.tsx`, `useApartmentFormStore`, `ErrorDialog.tsx`, `expo-router`, `queryClient.ts`, `add.tsx`, `ai-search.tsx`, `step-five.tsx`, `notifications.tsx`, `useVerificationStore`, `[conversationId].tsx`, `notifications/index.ts`, `PaymentMethodSelector.tsx`, `payment-history/[paymentId].tsx`, `landlordService.ts`, `[tenantId].tsx`, `tenant-applications/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `[landlordId].tsx`, `units.tsx`, `applications/[applicationId].tsx`, `useTheme.ts`, `payment-history/index.tsx`, `payment/index.tsx`, `edit-main.tsx`, `third-process.tsx`, `maintenance-requests/index.ts`, `maintenance-requests/index.tsx`, `app/_layout.tsx`, `useTenancy`, `document-id/index.tsx`, `review-information.tsx`, `notificationService.ts`, `maintenanceService.ts`, `RescheduleSheet.tsx`, `useLandlordActionBadges`, `visit-requests/index.tsx`, `ChatBubble.tsx`, `useLandlordPayments.ts`, `useRentalPreferencesForm.ts`, `pending.tsx`, `CustomTabBar.tsx`, `TabBar.tsx`, `rentals.tsx`, `visitRequests/index.ts`, `applications/index.ts`, `ApplicationHeader.tsx`, `applications/components/VisitRequestCard.tsx`, `tenant-applications/[applicationId].tsx`, `history/index.tsx`, `useSearchSections.ts`, `second-step.tsx`, `ApplicationList.tsx`?**
  _High betweenness centrality (0.229) - this node is a cross-community bridge._
- **Why does `expo-router` connect `expo-router` to `apartments/index.ts`, `ScreenWrapper.tsx`, `map-view.tsx`, `fifth-step.tsx`, `search.tsx`, `useApartmentFormStore`, `ErrorDialog.tsx`, `add.tsx`, `step-five.tsx`, `useVerificationStore`, `[conversationId].tsx`, `NotificationScreen.tsx`, `paymongoService.ts`, `payment-history/[paymentId].tsx`, `[tenantId].tsx`, `tenant-applications/index.tsx`, `useColors`, `upload-id.tsx`, `live-capture.tsx`, `[landlordId].tsx`, `units.tsx`, `useFrameQualityCheck.ts`, `applications/[applicationId].tsx`, `useProfile`, `plugins`, `useTheme.ts`, `payment-history/index.tsx`, `payment/index.tsx`, `third-process.tsx`, `edit-main.tsx`, `maintenance-requests/index.tsx`, `app/_layout.tsx`, `document-id/index.tsx`, `review-information.tsx`, `notificationService.ts`, `useInAppNotificationBanner.tsx`, `onboarding.tsx`, `visit-requests/index.tsx`, `pending.tsx`, `CustomTabBar.tsx`, `rentals.tsx`, `applications/index.ts`, `ApplicationHeader.tsx`, `tenant-applications/[applicationId].tsx`, `history/index.tsx`, `playground.tsx`, `second-step.tsx`, `ApplicationList.tsx`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Why does `ScreenWrapper` connect `ScreenWrapper.tsx` to `apartments/index.ts`, `map-view.tsx`, `fifth-step.tsx`, `search.tsx`, `useApartmentFormStore`, `ErrorDialog.tsx`, `expo-router`, `add.tsx`, `ai-search.tsx`, `step-five.tsx`, `notifications.tsx`, `useVerificationStore`, `[conversationId].tsx`, `NotificationScreen.tsx`, `[tenantId].tsx`, `tenant-applications/index.tsx`, `useColors`, `upload-id.tsx`, `live-capture.tsx`, `[landlordId].tsx`, `units.tsx`, `applications/[applicationId].tsx`, `useTheme.ts`, `payment-history/index.tsx`, `payment/index.tsx`, `third-process.tsx`, `edit-main.tsx`, `maintenance-requests/index.tsx`, `document-id/index.tsx`, `review-information.tsx`, `visit-requests/index.tsx`, `pending.tsx`, `CustomTabBar.tsx`, `rentals.tsx`, `ApplicationHeader.tsx`, `tenant-applications/[applicationId].tsx`, `history/index.tsx`, `second-step.tsx`, `ApplicationList.tsx`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _646 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `apartments/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06938775510204082 - nodes in this community are weakly interconnected._
- **Should `ScreenWrapper.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06180733162830349 - nodes in this community are weakly interconnected._
- **Should `map-view.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07191961924907457 - nodes in this community are weakly interconnected._