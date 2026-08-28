# Graph Report - mobile  (2026-08-28)

## Corpus Check
- 441 files · ~635,118 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1970 nodes · 4647 edges · 170 communities (100 shown, 70 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c767f0f0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- apartment/[apartmentId]/index.tsx
- ScreenWrapper.tsx
- reviews/index.tsx
- ratings/index.ts
- dashboard.tsx
- profilesService.ts
- conversationService.ts
- useFavorites
- second-step.tsx
- edit-profile.tsx
- devDependencies
- expo
- expo-router
- review-information.tsx
- privateMediaResolver.ts
- paymentService.ts
- images.ts
- ai-search.tsx
- usePersonalizationStore.ts
- useNotificationPreferences
- useVerificationStore
- chatService.ts
- [conversationId].tsx
- notifications/index.ts
- paymongoService.ts
- paths
- NotificationList.tsx
- PaymentMethodSelector.tsx
- payment-history/[paymentId].tsx
- landlordService.ts
- useTheme.ts
- tenant-applications/index.tsx
- useColors
- upload-id.tsx
- live-capture.tsx
- manage-apartment/[apartmentId]/index.tsx
- units.tsx
- useFrameQualityCheck.ts
- dependencies
- app/_layout.tsx
- createMobileQueryClient
- NotificationScreen.tsx
- history/index.tsx
- payment/index.tsx
- upload.tsx
- audit-fix.characterization.test.ts
- useApplicationActions.test.tsx
- useLandlordActionBadges
- (landlord)/profile.tsx
- ApplicationList.tsx
- useTenancy
- DocumentCard.tsx
- rate-apartment.tsx
- ios
- useChatChannel.ts
- rentals.tsx
- sign-in.tsx
- maintenance-requests/index.ts
- android
- RescheduleSheet.tsx
- useApplicationFormStore.ts
- [landlordId].tsx
- useInAppNotificationBanner.tsx
- onboarding.tsx
- visit-requests/index.tsx
- ChatBubble.tsx
- apartments/index.ts
- map-view.tsx
- useSubmitApplication.ts
- useLandlordPayments.ts
- captureSequences.ts
- useConversations.test.tsx
- auth/index.ts
- TabBar.tsx
- live-capture.test.tsx
- applications/index.ts
- CustomTabBar.tsx
- upload-id.test.tsx
- applications/[applicationId].tsx
- notifications.tsx
- conversationService.test.ts
- NotificationToast.tsx
- useApplicationStatusStyles.ts
- RatingsSection.tsx
- forgot-password/otp-verification.tsx
- useLandlordTenancy.ts
- metro.config.js
- Welcome to your Expo app 👋
- playground.tsx
- uniwind-types.d.ts
- ReviewField.tsx
- StatusPill.tsx
- eslint.config.js
- reset-password.tsx
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
- tenantApplicationsService.test.ts
- ApartmentHeroSection.tsx
- useLandlordStats

## God Nodes (most connected - your core abstractions)
1. `useColors()` - 326 edges
2. `expo-router` - 130 edges
3. `ScreenWrapper` - 99 edges
4. `StandardHeader()` - 51 edges
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
- `ThirdProcess()` --calls--> `useApplicationFormStore`  [EXTRACTED]
  app/apartment/[apartmentId]/apply/third-process.tsx → stores/useApplicationFormStore.ts

## Import Cycles
- 2-file cycle: `hooks/applications/index.ts -> hooks/applications/useApplicationActions.ts -> hooks/applications/index.ts`
- 2-file cycle: `hooks/applications/index.ts -> service/applications/tenantApplicationsService.ts -> hooks/applications/index.ts`
- 3-file cycle: `hooks/payments/index.ts -> hooks/payments/usePayments.ts -> service/payments/paymentService.ts -> hooks/payments/index.ts`
- 3-file cycle: `hooks/applications/index.ts -> hooks/applications/useTenantApplications.ts -> service/applications/tenantApplicationsService.ts -> hooks/applications/index.ts`

## Communities (170 total, 70 thin omitted)

### Community 0 - "apartment/[apartmentId]/index.tsx"
Cohesion: 0.13
Nodes (12): ApartmentSkeleton(), ApartmentDescriptionSection(), ApartmentDescriptionSectionProps, ApartmentDetailsSection(), ApartmentDetailsSectionProps, LandlordSection(), LandlordSectionProps, LeaseAgreementSection() (+4 more)

### Community 1 - "ScreenWrapper.tsx"
Cohesion: 0.08
Nodes (23): RateApartmentSkeleton(), DOCUMENT_TYPE_ICONS, AnalyticsScreen(), MAX_AMOUNT, monthlyData, stats, TenantApplicationDetailsSkeleton(), EmptyRequestData() (+15 more)

### Community 2 - "reviews/index.tsx"
Cohesion: 0.21
Nodes (10): RatingBarCount(), RatingBarCountProps, RatingsPage(), ReviewsPage(), SORT_OPTIONS, RatingCard(), RatingCardProps, StarRating() (+2 more)

### Community 3 - "ratings/index.ts"
Cohesion: 0.16
Nodes (20): ApartmentScreen(), ApartmentReview, formatLeaseDuration(), getApartmentReviewsQueryKey(), getErrorMessage(), RatingBarCountData, useApartmentReviews(), UseApartmentReviewsResult (+12 more)

### Community 4 - "dashboard.tsx"
Cohesion: 0.06
Nodes (36): DashboardSkeleton(), chartLabel(), ProfitByPropertyCard(), ProfitByPropertyCardProps, BUILDERS, ChartDatum, FilterOption, filterOptions (+28 more)

### Community 5 - "profilesService.ts"
Cohesion: 0.20
Nodes (15): PublicTenantProfile(), getPublicLandlordProfileQueryKey(), usePublicLandlordProfile(), getPublicTenantProfileQueryKey(), usePublicTenantProfile(), fetchPublicLandlordProfile(), fetchPublicTenantProfile(), formatMonth() (+7 more)

### Community 6 - "conversationService.ts"
Cohesion: 0.26
Nodes (13): Chat(), getConversationsQueryKey(), NewChatRow, useConversations(), getConversations(), getConversationsV2(), toMessageType(), ChatMetadataRow (+5 more)

### Community 7 - "useFavorites"
Cohesion: 0.08
Nodes (38): ApartmentsList(), ApartmentsListProps, DEFAULT_FILTERS, FilterBottomSheet(), FilterState, Props, ROOM_OPTS, SearchFiltersBar() (+30 more)

### Community 8 - "second-step.tsx"
Cohesion: 0.08
Nodes (28): FormErrors, Amenities(), FourthStep(), FormErrors, Index(), DEFAULT_COORDS, MAP_STYLE, MapPin() (+20 more)

### Community 9 - "edit-profile.tsx"
Cohesion: 0.09
Nodes (27): FieldErrors, AuthCompleteProfile(), ProfileForm, requiredFields, CompleteProfile(), ProfileForm, requiredFields, VerifyMobile() (+19 more)

### Community 10 - "devDependencies"
Cohesion: 0.05
Nodes (42): eslint, eslint-config-expo, eslint-import-resolver-typescript, expo-doctor, fast-check, jest, jest-expo, metro-minify-terser (+34 more)

### Community 11 - "expo"
Cohesion: 0.11
Nodes (18): projectId, reactCompiler, typedRoutes, expo, experiments, extra, icon, name (+10 more)

### Community 13 - "review-information.tsx"
Cohesion: 0.19
Nodes (11): ReviewAccordionItem(), ReviewAccordionItemProps, ReviewDocumentFile(), ReviewDocumentFileProps, ReviewDocumentImage(), ReviewDocumentImageProps, FirstProcess(), ReviewInformation() (+3 more)

### Community 14 - "privateMediaResolver.ts"
Cohesion: 0.11
Nodes (28): DocEntry, ResolvedDoc, DocumentEntriesProps, mockResolvePrivateMediaUrls, useDocumentUrls(), cacheKey(), chatMediaRetryKeys, claimChatMediaRetry() (+20 more)

### Community 15 - "paymentService.ts"
Cohesion: 0.18
Nodes (14): getPaymentByReferenceQueryKey(), getPaymentsQueryKey(), usePayments(), CreateCashPaymentParams, fetchPaymentById(), fetchPaymentByReferenceId(), fetchPayments(), METHOD_LABELS (+6 more)

### Community 16 - "images.ts"
Cohesion: 0.09
Nodes (19): TODO: Implement contact support functionality,, TODO: Fetch and display user's uploaded documents and IDs here. This may…, UploadedDocument, AIHeaderProps, getLastMessageDisplay(), MessageCard(), MessageCardProps, PAYMENT_METHOD_TYPES (+11 more)

### Community 17 - "ai-search.tsx"
Cohesion: 0.10
Nodes (20): AISearchScreen(), SUGGESTION_CHIPS, AIHeader(), EmptyChatState(), MessageBubble(), MessageBubbleProps, MessageComposer(), MessageComposerProps (+12 more)

### Community 18 - "usePersonalizationStore.ts"
Cohesion: 0.12
Nodes (20): CityCheckBox(), CityCheckBoxProps, PersonalizationProgress(), Props, PersonalizationRadioButton(), PersonalizationRadioButtonProps, StepFive(), StepFour() (+12 more)

### Community 19 - "useNotificationPreferences"
Cohesion: 0.18
Nodes (12): NotificationManager(), getNotificationPreferencesQueryKey(), createWrapper(), mockFetchNotificationPreferences, mockUpdateNotificationPreferences, mockUseCurrentUser, useNotificationPreferences(), usePushRegistration() (+4 more)

### Community 20 - "useVerificationStore"
Cohesion: 0.15
Nodes (17): getCaptureSequence(), SelectId(), SelfiePrep(), Success(), UploadSelfie(), StepProgress(), StepProgressProps, useVerificationStore (+9 more)

### Community 21 - "chatService.ts"
Cohesion: 0.09
Nodes (32): Options, ChatMessagePlacement, mergeChatMessages(), AttachmentUploadFailure, buildOlderThanChatMessageFilter(), ChatMessageCursor, ChatMessagePage, EXTENSION_BY_MIME_TYPE (+24 more)

### Community 22 - "[conversationId].tsx"
Cohesion: 0.12
Nodes (18): ATTACHMENT_OPTIONS, ChatBox(), ChatBoxProps, StagedAsset, ChatEmptyState(), ChatEmptyStateProps, ChatHeader(), ChatHeaderProps (+10 more)

### Community 23 - "notifications/index.ts"
Cohesion: 0.30
Nodes (14): useNotificationActions(), useNotificationRealtime(), getErrorMessage(), getNotificationsQueryKey(), getUnreadNotificationsQueryKey(), useNotifications(), useUnreadNotificationCount(), fetchNotifications() (+6 more)

### Community 24 - "paymongoService.ts"
Cohesion: 0.17
Nodes (11): PaymentVerify(), extractError(), getCheckoutSessionStatus(), invoke(), PaymongoCard, PaymongoCardPaymentResult, PaymongoCheckoutSession, PaymongoEnvelope (+3 more)

### Community 25 - "paths"
Cohesion: 0.09
Nodes (22): ./assets/*, ./components/*, ./constants/*, expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.ts, ./hooks/*, ../../packages/ui/* (+14 more)

### Community 26 - "NotificationList.tsx"
Cohesion: 0.22
Nodes (13): NotificationCard(), NotificationCardProps, NotificationCardType, NotificationList(), NotificationListProps, NotificationSettingsScreen(), NotificationToastContent(), getNotificationTypeIcon() (+5 more)

### Community 27 - "PaymentMethodSelector.tsx"
Cohesion: 0.13
Nodes (18): CardInformation, CardPaymentForm(), CardPaymentFormProps, CashPaymentErrors, CashPaymentForm(), CashPaymentFormProps, PaymentMethodButton(), PaymentMethodButtonProps (+10 more)

### Community 28 - "payment-history/[paymentId].tsx"
Cohesion: 0.24
Nodes (15): LandlordPaymentReceipt(), ReceiptCard(), STATUS_META, ZigzagEdge(), ZigzagEdgeProps, toHistoryItem(), PaymentReceipt(), Success() (+7 more)

### Community 29 - "landlordService.ts"
Cohesion: 0.11
Nodes (21): Index(), getLandlordUnitsQueryKey(), useLandlordUnits(), DB_TO_DISPLAY_STATUS, DbStatus, DISPLAY_TO_DB_STATUS, fetchLandlordUnits(), fetchManageApartmentDescription() (+13 more)

### Community 30 - "useTheme.ts"
Cohesion: 0.21
Nodes (8): PerksSectionProps, DEFAULT_COORDS, MAP_STYLE, Divider(), DividerProps, BasePerkItemProps, PerkItem(), PerkItemProps

### Community 31 - "tenant-applications/index.tsx"
Cohesion: 0.14
Nodes (14): ApplicationFilters, ApplicationFilterSheet(), LOCATION_OPTIONS, Props, STATUS_OPTIONS, EmptyApplications(), EmptySearchResults(), getInitials() (+6 more)

### Community 32 - "useColors"
Cohesion: 0.08
Nodes (24): Index(), Failed(), SelectDocument(), MaintenanceRequestCard(), MaintenanceRequestCardProps, PropertyActionMenu(), Props, ApartmentImage (+16 more)

### Community 33 - "upload-id.tsx"
Cohesion: 0.22
Nodes (13): CaptureStepConfig, CaptureStepSummary(), CaptureStepSummaryProps, UploadId(), CaptureProgress, computeCanContinue(), getCaptureProgress(), IdCaptureResult (+5 more)

### Community 34 - "live-capture.tsx"
Cohesion: 0.16
Nodes (10): getNextCaptureStep(), CapturedPhoto, LiveCapture(), ScreenState, computeFillRatio(), computeGuidedFrameRect(), GuidedFrameOverlay(), GuidedFrameOverlayProps (+2 more)

### Community 35 - "manage-apartment/[apartmentId]/index.tsx"
Cohesion: 0.36
Nodes (4): PaymentHistoryCard(), PaymentHistoryCardProps, PropertyOverviewSkeleton(), FlatPayment

### Community 36 - "units.tsx"
Cohesion: 0.13
Nodes (14): PropertyCard(), PropertyCardProps, PropertyCardSkeleton(), PropertyFilterSheet(), PropertyFilterSheetProps, SORT_LABELS, SortOption, sortOptions (+6 more)

### Community 37 - "useFrameQualityCheck.ts"
Cohesion: 0.18
Nodes (13): GuidedFrameRect, CameraPermissionState, useCameraPermission(), UseCameraPermissionResult, evaluateBlurHeuristic(), evaluateGlareHeuristic(), FrameQualityCheckOptions, FrameQualityReason (+5 more)

### Community 38 - "dependencies"
Cohesion: 0.11
Nodes (19): emoji-regex-xs, expo-constants, expo-router, dependencies, emoji-regex-xs, expo-constants, expo-router, react-native-gesture-handler (+11 more)

### Community 39 - "app/_layout.tsx"
Cohesion: 0.18
Nodes (9): RootLayout(), ThemeInitializer(), Index(), DevBadge(), useTheme(), expo-web-browser, ThemeMode, ThemeStore (+1 more)

### Community 40 - "createMobileQueryClient"
Cohesion: 0.14
Nodes (14): createWrapper(), mockFetchApartmentDetails, mockFetchReviewsPreview, createWrapper(), createWrapper(), mockFetchTenantApplications, mockUseCurrentUser, createWrapper() (+6 more)

### Community 41 - "NotificationScreen.tsx"
Cohesion: 0.21
Nodes (6): NotificationFilter, NotificationScreen(), NotificationScreenProps, SearchHeaderProps, DropdownButton(), DropdownButtonProps

### Community 42 - "history/index.tsx"
Cohesion: 0.15
Nodes (15): ReceiptCardProps, PaymentHistoryCard(), PaymentHistoryCardProps, PaymentHistoryItem, PaymentHistoryFilters, PaymentHistoryFilterSheet(), PaymentSort, Props (+7 more)

### Community 43 - "payment/index.tsx"
Cohesion: 0.19
Nodes (14): validateCashPayment(), PaymentFooter(), PaymentFooterProps, PaymentSummaryCard(), PaymentSummaryCardProps, formatLeaseDate(), INITIAL_CARD, PaymentCheckout() (+6 more)

### Community 44 - "upload.tsx"
Cohesion: 0.09
Nodes (30): TODO: Persist the uploaded document to Supabase Storage and store its, Upload(), EditProfile(), FifthStep(), EditMain(), validateForm(), ApartmentMainFields, deleteStorageImage() (+22 more)

### Community 45 - "audit-fix.characterization.test.ts"
Cohesion: 0.12
Nodes (10): ChatRow, mockChannel, mockChatRows, mockCreateSignedUrls, mockFrom, mockGetUser, mockRemoveChannel, mockStorageFrom (+2 more)

### Community 46 - "useApplicationActions.test.tsx"
Cohesion: 0.19
Nodes (13): getStatusStyle(), TenantApplicationDetails(), mockEq, mockFrom, mockUpdate, mockUseCurrentUser, useApplicationActions(), getLandlordApplicationsQueryKey() (+5 more)

### Community 47 - "useLandlordActionBadges"
Cohesion: 0.20
Nodes (11): MaintenanceRequests(), TenantApplications(), Units(), EMPTY_COUNTS, getLandlordBadgesQueryKey(), useLandlordActionBadges(), ActionBadgeCategory, ActionBadgeCounts (+3 more)

### Community 48 - "(landlord)/profile.tsx"
Cohesion: 0.22
Nodes (11): CompleteProfileCard(), CompleteProfileCardProps, ProfileHeader(), ProfileHeaderProps, AccountStatus, StatusConfig, VerificationStatus(), VerificationStatusProps (+3 more)

### Community 49 - "ApplicationList.tsx"
Cohesion: 0.36
Nodes (3): ApplicationsList(), ApplicationsEmptyState(), ApplicationStatusCardSkeleton()

### Community 50 - "useTenancy"
Cohesion: 0.08
Nodes (34): Chat(), CurrentApartmentDetails(), formatDateToMonthYear(), History(), getErrorMessage(), getRecordString(), getTenancyQueryKey(), useTenancy() (+26 more)

### Community 51 - "DocumentCard.tsx"
Cohesion: 0.33
Nodes (7): DocumentCard(), DocumentCardProps, Index(), DOCUMENT_EXTENSIONS, getExtension(), IMAGE_EXTENSIONS, isImageUri()

### Community 52 - "rate-apartment.tsx"
Cohesion: 0.16
Nodes (11): FormErrors, ThirdProcess(), ErrorDialogState, FormErrors, TenancyLeasePeriod, ApartmentInformation, DisplayImage, UploadFileField() (+3 more)

### Community 53 - "ios"
Cohesion: 0.18
Nodes (11): ios, dark, light, tinted, ITSAppUsesNonExemptEncryption, NSCameraUsageDescription, NSPhotoLibraryUsageDescription, bundleIdentifier (+3 more)

### Community 54 - "useChatChannel.ts"
Cohesion: 0.16
Nodes (12): BroadcastEvent, BroadcastPayload, PresenceJoinEvent, PresenceLeaveEvent, PresenceState, ChannelHandler, MockChannel, mockChannels (+4 more)

### Community 55 - "rentals.tsx"
Cohesion: 0.13
Nodes (13): QuickActionButton(), QuickActionButtonProps, ApartmentDescriptionCard(), ApartmentDescriptionCardProps, PaymentSummaryCard(), PaymentSummaryCardProps, TenancyEmptyState(), actions (+5 more)

### Community 56 - "sign-in.tsx"
Cohesion: 0.26
Nodes (9): AuthButton(), AuthButtonProps, AuthDivider(), AuthDividerProps, RoleTab(), RoleTabProps, SignIn(), SignUp() (+1 more)

### Community 57 - "maintenance-requests/index.ts"
Cohesion: 0.07
Nodes (45): EmptyMaintenanceRequestsList(), MaintenanceRequestCard(), MaintenanceRequestCardProps, MaintenanceRequestCardSkeleton(), LOCATION_OPTIONS, MaintenanceRequestFilters, MaintenanceRequestFilterSheet(), Props (+37 more)

### Community 58 - "android"
Cohesion: 0.20
Nodes (10): backgroundColor, foregroundImage, adaptiveIcon, googleServicesFile, package, permissions, predictiveBackGestureEnabled, softwareKeyboardLayoutMode (+2 more)

### Community 59 - "RescheduleSheet.tsx"
Cohesion: 0.18
Nodes (10): Period, Props, RescheduleSheet(), tomorrow, toSupabaseTime(), HOURS, Period, PERIODS (+2 more)

### Community 60 - "useApplicationFormStore.ts"
Cohesion: 0.18
Nodes (10): ApartmentContext, ApplicationFormState, initialApartmentContext, initialDocuments, initialRentalPreferences, initialTenantInformation, initialUploadedPaths, RentalPreferences (+2 more)

### Community 61 - "[landlordId].tsx"
Cohesion: 0.28
Nodes (6): PublicLandlordProfile(), TODO: Implement function to handle report landlord, ProfileStat, ProfileStatsCard(), ProfileStatsCardProps, RatingCardSkeleton()

### Community 62 - "useInAppNotificationBanner.tsx"
Cohesion: 0.26
Nodes (9): getOpenChatConversationKey(), shouldSuppressChatToast(), useInAppNotificationBanner(), useNotificationTapHandler(), markNotificationRead(), buildNotificationDeepLink(), NotificationData, parseConversationKey() (+1 more)

### Community 63 - "onboarding.tsx"
Cohesion: 0.21
Nodes (7): { width }, OnBoardingSlide(), OnBoardingSlideProps, Slide, SLIDES, USER_ROLES, UserRole

### Community 64 - "visit-requests/index.tsx"
Cohesion: 0.05
Nodes (45): EmptyApproved(), EmptyPending(), VisitRequestCalendar(), VisitRequestCalendarProps, VisitRequestCard(), VisitRequestCardProps, VisitRequestCardSkeleton(), DATE_RANGE_OPTIONS (+37 more)

### Community 65 - "ChatBubble.tsx"
Cohesion: 0.27
Nodes (8): calculateImageSize(), ChatBubble(), ChatBubbleProps, mockPlayer, VideoBubble(), VisualMediaBubble(), isEmojiOnly(), MessageType

### Community 66 - "apartments/index.ts"
Cohesion: 0.26
Nodes (12): ApartmentSummary(), IncludedPerks(), RequestVisit(), getApartmentDetailsQueryKey(), getApartmentReviewsPreviewQueryKey(), useApartmentDetails(), UseApartmentDetailsOptions, ApartmentDetails (+4 more)

### Community 67 - "map-view.tsx"
Cohesion: 0.11
Nodes (17): IconButton(), IconButtonProps, IconComponent, DEFAULT_COORDS, DirectionMode, MAP_STYLE, MapPreviewSection(), MapPreviewSectionProps (+9 more)

### Community 68 - "useSubmitApplication.ts"
Cohesion: 0.29
Nodes (7): DocKey, getContentType(), MIME_MAP, SubmitArgs, SubmitResult, uploadDoc(), UploadedDocumentPaths

### Community 69 - "useLandlordPayments.ts"
Cohesion: 0.20
Nodes (12): PaymentHistoryScreen(), toFlatPayment(), getLandlordPaymentsQueryKey(), useLandlordPaymentConfirmation(), useLandlordPayments(), getLandlordTenancyQueryKey(), fetchLandlordPayments(), LandlordPaymentRecord (+4 more)

### Community 70 - "captureSequences.ts"
Cohesion: 0.24
Nodes (8): ALL_SUPPORTED_ID_TYPES, CaptureCameraFacing, CaptureGuideShape, CARD_SEQUENCE, PASSPORT_SEQUENCE, SELFIE_STEP, SEQUENCE_BY_ID_TYPE, NON_PASSPORT_ID_TYPES

### Community 71 - "useConversations.test.tsx"
Cohesion: 0.25
Nodes (6): mockChannelFn, mockFetchConversations, mockGetChannels, mockRemoveChannel, mockUseCurrentUser, seedConversations

### Community 72 - "auth/index.ts"
Cohesion: 0.20
Nodes (14): RateApartment(), TabsLayout(), useCurrentUser(), useCurrentUserId(), useProfile(), SubmitReviewParams, SubmitReviewResult, useSubmitReview() (+6 more)

### Community 73 - "TabBar.tsx"
Cohesion: 0.31
Nodes (6): TabBar(), TabBarIcon(), TabBarIconProps, IconProps, LANDLORDICONS, TENANTICONS

### Community 74 - "live-capture.test.tsx"
Cohesion: 0.25
Nodes (8): captureAndReachReview(), DEFAULT_QUALITY_RESULT, mockBack, mockDismissTo, mockReplace, mockSearchParams, mockTakePictureAsync, setPermission()

### Community 75 - "applications/index.ts"
Cohesion: 0.27
Nodes (11): ApplicationApartment(), ApplicationStatus, useCancelApplication(), getTenantApplicationsQueryKey(), useTenantApplications(), ApplicationDocument, ApplicationDocumentPathKey, ApplicationRow (+3 more)

### Community 76 - "CustomTabBar.tsx"
Cohesion: 0.21
Nodes (9): CustomTabBar(), CustomTabConfig, Props, TabItemsProps, TablerIconComponent, LANDLORD_TABS, LandlordTabLayout(), TENANT_TABS (+1 more)

### Community 77 - "upload-id.test.tsx"
Cohesion: 0.25
Nodes (7): BACK_CAPTURE, FRONT_CAPTURE, mockBack, mockPush, mockReplace, mockUseFocusEffect, SELFIE_CAPTURE

### Community 78 - "applications/[applicationId].tsx"
Cohesion: 0.14
Nodes (14): EmptyMaintenanceRequestDetail(), ResolveRequestDialog(), ResolveRequestDialogProps, EmptyApplicationData(), ConfirmDialog(), Props, DetailField(), DetailFieldProps (+6 more)

### Community 79 - "notifications.tsx"
Cohesion: 0.38
Nodes (5): GENERAL_TOGGLES, GeneralToggleKey, NOTIFICATION_TYPE_LABELS, DEFAULT_NOTIFICATION_PREFERENCES, NotificationPreferenceType

### Community 80 - "conversationService.test.ts"
Cohesion: 0.33
Nodes (6): Conversation, createQuery(), mockFrom, mockLegacyQueries(), mockRpc, seedV2Conversations

### Community 81 - "NotificationToast.tsx"
Cohesion: 0.16
Nodes (15): MOCK_TOASTS, MockRow, MockToast, NotificationToastDevScreen(), NotificationToastContentProps, NotificationToastOptions, showNotificationToast(), TOAST_VARIANT_BY_TYPE (+7 more)

### Community 82 - "useApplicationStatusStyles.ts"
Cohesion: 0.32
Nodes (6): ApplicationStatusCard(), Props, ApplicationStatusStyle, ChipColor, FALLBACK_STYLE(), useApplicationStatusStyles()

### Community 83 - "RatingsSection.tsx"
Cohesion: 0.40
Nodes (4): RatingsSection(), RatingsSectionProps, SmallRatingCard(), SmallRatingCardProps

### Community 84 - "forgot-password/otp-verification.tsx"
Cohesion: 0.40
Nodes (4): OTPVerification(), OTPVerification(), useCountdown(), UseCountdownOptions

### Community 85 - "useLandlordTenancy.ts"
Cohesion: 0.33
Nodes (6): Index(), useLandlordTenancy(), fetchLandlordTenancy(), LandlordTenancyMaintenanceRequest, LandlordTenant, PaymentRecord

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
Cohesion: 0.16
Nodes (13): QueryProvider(), QueryProviderProps, createWrapper(), mockFrom, mockGetUser, profileRecord, CURRENT_USER_QUERY_KEY, queryClient (+5 more)

### Community 167 - "tenantApplicationsService.test.ts"
Cohesion: 0.40
Nodes (3): applicationRow, mockFrom, mockResolvePrivateMediaUrls

### Community 168 - "ApartmentHeroSection.tsx"
Cohesion: 0.50
Nodes (3): ApartmentHeroSection(), ApartmentHeroSectionProps, ApartmentImage

### Community 169 - "useLandlordStats"
Cohesion: 0.67
Nodes (3): useLandlordStats(), fetchLandlordStats(), LandlordStats

## Knowledge Gaps
- **632 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+627 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **70 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useColors()` connect `useColors` to `apartment/[apartmentId]/index.tsx`, `ScreenWrapper.tsx`, `reviews/index.tsx`, `ratings/index.ts`, `dashboard.tsx`, `profilesService.ts`, `conversationService.ts`, `useFavorites`, `second-step.tsx`, `edit-profile.tsx`, `review-information.tsx`, `images.ts`, `ai-search.tsx`, `usePersonalizationStore.ts`, `useVerificationStore`, `[conversationId].tsx`, `NotificationList.tsx`, `PaymentMethodSelector.tsx`, `payment-history/[paymentId].tsx`, `landlordService.ts`, `useTheme.ts`, `tenant-applications/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `units.tsx`, `app/_layout.tsx`, `ApartmentHeroSection.tsx`, `NotificationScreen.tsx`, `history/index.tsx`, `payment/index.tsx`, `upload.tsx`, `useApplicationActions.test.tsx`, `useLandlordActionBadges`, `(landlord)/profile.tsx`, `ApplicationList.tsx`, `useTenancy`, `DocumentCard.tsx`, `rate-apartment.tsx`, `rentals.tsx`, `sign-in.tsx`, `maintenance-requests/index.ts`, `RescheduleSheet.tsx`, `[landlordId].tsx`, `visit-requests/index.tsx`, `ChatBubble.tsx`, `apartments/index.ts`, `map-view.tsx`, `useLandlordPayments.ts`, `auth/index.ts`, `TabBar.tsx`, `applications/index.ts`, `CustomTabBar.tsx`, `applications/[applicationId].tsx`, `notifications.tsx`, `NotificationToast.tsx`, `useApplicationStatusStyles.ts`, `RatingsSection.tsx`, `forgot-password/otp-verification.tsx`, `useLandlordTenancy.ts`, `reset-password.tsx`?**
  _High betweenness centrality (0.212) - this node is a cross-community bridge._
- **Why does `expo-router` connect `expo-router` to `apartment/[apartmentId]/index.tsx`, `ScreenWrapper.tsx`, `reviews/index.tsx`, `dashboard.tsx`, `useFavorites`, `second-step.tsx`, `edit-profile.tsx`, `review-information.tsx`, `images.ts`, `usePersonalizationStore.ts`, `useVerificationStore`, `[conversationId].tsx`, `paymongoService.ts`, `NotificationList.tsx`, `payment-history/[paymentId].tsx`, `useTheme.ts`, `tenant-applications/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `units.tsx`, `useFrameQualityCheck.ts`, `app/_layout.tsx`, `history/index.tsx`, `payment/index.tsx`, `upload.tsx`, `(landlord)/profile.tsx`, `ApplicationList.tsx`, `rate-apartment.tsx`, `rentals.tsx`, `sign-in.tsx`, `maintenance-requests/index.ts`, `[landlordId].tsx`, `useInAppNotificationBanner.tsx`, `onboarding.tsx`, `visit-requests/index.tsx`, `apartments/index.ts`, `map-view.tsx`, `auth/index.ts`, `CustomTabBar.tsx`, `applications/[applicationId].tsx`, `useApplicationStatusStyles.ts`, `forgot-password/otp-verification.tsx`, `playground.tsx`, `reset-password.tsx`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Why does `ScreenWrapper` connect `ScreenWrapper.tsx` to `apartment/[apartmentId]/index.tsx`, `reviews/index.tsx`, `dashboard.tsx`, `useFavorites`, `second-step.tsx`, `edit-profile.tsx`, `review-information.tsx`, `images.ts`, `ai-search.tsx`, `usePersonalizationStore.ts`, `useVerificationStore`, `[conversationId].tsx`, `useTheme.ts`, `tenant-applications/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `units.tsx`, `NotificationScreen.tsx`, `history/index.tsx`, `payment/index.tsx`, `upload.tsx`, `ApplicationList.tsx`, `rate-apartment.tsx`, `rentals.tsx`, `sign-in.tsx`, `maintenance-requests/index.ts`, `[landlordId].tsx`, `visit-requests/index.tsx`, `apartments/index.ts`, `map-view.tsx`, `applications/[applicationId].tsx`, `notifications.tsx`, `forgot-password/otp-verification.tsx`, `reset-password.tsx`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _632 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `apartment/[apartmentId]/index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13157894736842105 - nodes in this community are weakly interconnected._
- **Should `ScreenWrapper.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07616892911010557 - nodes in this community are weakly interconnected._
- **Should `dashboard.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06448979591836734 - nodes in this community are weakly interconnected._