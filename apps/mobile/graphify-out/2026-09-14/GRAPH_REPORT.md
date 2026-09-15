# Graph Report - mobile  (2026-09-14)

## Corpus Check
- 468 files · ~651,501 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2054 nodes · 4870 edges · 194 communities (122 shown, 72 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f9eb6089`
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
- FilterBottomSheet.tsx
- profilesService.ts
- ErrorDialog.tsx
- devDependencies
- apartment/[apartmentId]/index.tsx
- sign-in.tsx
- useFavorites
- applications/index.ts
- paymentService.ts
- images.ts
- ai-search.tsx
- usePersonalizationStore.ts
- notificationService.ts
- useVerificationStore
- chatService.ts
- [conversationId].tsx
- reviews/index.tsx
- paymongoService.ts
- paths
- notifications/index.ts
- PaymentMethodSelector.tsx
- payment-history/[paymentId].tsx
- landlordService.ts
- [landlordId].tsx
- tenant-applications/index.tsx
- useTheme.ts
- upload-id.tsx
- live-capture.tsx
- useColors
- units.tsx
- useFrameQualityCheck.ts
- maintenance-requests/index.ts
- auth/index.ts
- MoveInCostFooterSection.tsx
- applications/[applicationId].tsx
- dashboard.tsx
- payment/index.tsx
- updateApartmentMain.ts
- audit-fix.characterization.test.ts
- useProfile
- maintenance-requests/index.tsx
- app/_layout.tsx
- ApplicationHeader.tsx
- useTenancyRealtime.ts
- document-id/index.tsx
- ProfitTrendCard.tsx
- useChat.ts
- useChatChannel.ts
- review-information.tsx
- useNotifications.ts
- maintenanceService.ts
- dependencies
- RescheduleSheet.tsx
- useTenancy
- useLandlordActionBadges
- NotificationScreen.tsx
- onboarding.tsx
- queryClient.ts
- ChatBubble.tsx
- captureSequences.ts
- useInAppNotificationBanner.tsx
- expo-linking
- useLandlordPayments.ts
- useApplicationFormStore.ts
- notification-toast.tsx
- CustomTabBar.tsx
- TabBar.tsx
- live-capture.test.tsx
- rentals.tsx
- edit-profile.tsx
- rate-apartment.tsx
- reset-password.tsx
- app.config.js
- useTenancyRealtime.test.ts
- visit-requests/index.tsx
- useApplicationActions.test.tsx
- chatService.pagination.test.ts
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
- search.tsx
- expo-device
- expo-document-picker
- expo-file-system
- second-step.tsx
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
- useLandlordTenancy.ts
- @maplibre/maplibre-react-native
- @miblanchard/react-native-slider
- @ptomasroos/react-native-multi-slider
- react
- react-dom
- useSubmitApplication.ts
- @react-native-async-storage/async-storage
- react-native-awesome-gallery
- useLandlordMaintenanceRequests.ts
- @react-native-community/datetimepicker
- @react-native-community/slider
- react-native-gifted-charts
- react-native-image-viewing
- useRentalPreferencesForm.ts
- DropdownButton.tsx
- react-native-screens
- react-native-svg
- react-native-webview
- react-native-worklets
- @react-navigation/bottom-tabs
- analytics.tsx
- emoji-regex-xs
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
- expo-blur
- expo-camera
- expo-clipboard
- ReceiptCard.tsx
- expo
- expo-dev-client
- expo-location
- heroui-native
- react-native
- react-native-web
- rn-emoji-keyboard
- tailwind-variants
- expo-notifications
- react-native-keyboard-aware-scroll-view
- react-native-linear-gradient
- react-native-maps
- react-native-svg-transformer
- @repo/supabase

## God Nodes (most connected - your core abstractions)
1. `useColors()` - 343 edges
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
- `SecondProcess()` --calls--> `useApplicationFormStore`  [EXTRACTED]
  app/apartment/[apartmentId]/apply/second-process.tsx → stores/useApplicationFormStore.ts

## Import Cycles
- 2-file cycle: `hooks/applications/index.ts -> hooks/applications/useApplicationActions.ts -> hooks/applications/index.ts`
- 2-file cycle: `hooks/applications/index.ts -> service/applications/tenantApplicationsService.ts -> hooks/applications/index.ts`
- 3-file cycle: `hooks/applications/index.ts -> hooks/applications/useTenantApplications.ts -> service/applications/tenantApplicationsService.ts -> hooks/applications/index.ts`
- 3-file cycle: `hooks/payments/index.ts -> hooks/payments/usePayments.ts -> service/payments/paymentService.ts -> hooks/payments/index.ts`

## Communities (194 total, 72 thin omitted)

### Community 0 - "apartments/index.ts"
Cohesion: 0.17
Nodes (16): ApartmentSummary(), ApartmentDetailsSection(), ApartmentDetailsSectionProps, ApartmentHeroSection(), ApartmentHeroSectionProps, ApartmentImage, IncludedPerks(), getApartmentDetailsQueryKey() (+8 more)

### Community 1 - "ScreenWrapper.tsx"
Cohesion: 0.07
Nodes (23): DirectionMode, DOCUMENT_TYPE_ICONS, TODO: Persist the uploaded document to Supabase Storage and store its, developers, socials, faqs, SettingItem, SettingSection (+15 more)

### Community 2 - "map-search.tsx"
Cohesion: 0.08
Nodes (46): ApartmentMapViewScreen(), MapPin(), MapPreviewSheet(), Props, INITIAL_REGION, TenantMapSearchScreen(), GoogleMapPin, GoogleMapView() (+38 more)

### Community 3 - "ratings/index.ts"
Cohesion: 0.15
Nodes (21): ReviewsPage(), ApartmentReview, formatLeaseDuration(), getApartmentReviewsQueryKey(), getErrorMessage(), RatingBarCountData, ReviewSortOption, useApartmentReviews() (+13 more)

### Community 4 - "dashboardService.ts"
Cohesion: 0.17
Nodes (13): Dashboard(), EMPTY_DASHBOARD_DATA, getDashboardDataQueryKey(), getErrorMessage(), useDashboardData(), DashboardData, DashboardStats, fetchDashboardData() (+5 more)

### Community 5 - "fifth-step.tsx"
Cohesion: 0.17
Nodes (15): Amenities(), DEFAULT_COORDS, FifthStep(), MAP_STYLE, FourthStep(), Index(), ThirdStep(), getMimeType() (+7 more)

### Community 6 - "useConversations.test.tsx"
Cohesion: 0.09
Nodes (29): Chat(), Chat(), getConversationsQueryKey(), getErrorMessage(), NewChatRow, OldChatRow, createWrapper(), mockChannelFn (+21 more)

### Community 7 - "FilterBottomSheet.tsx"
Cohesion: 0.16
Nodes (11): DEFAULT_FILTERS, FilterBottomSheet(), FilterState, Props, ROOM_OPTS, CITIES, mockFrom, mockIsFavorite (+3 more)

### Community 8 - "profilesService.ts"
Cohesion: 0.19
Nodes (16): PublicLandlordProfile(), PublicTenantProfile(), getPublicLandlordProfileQueryKey(), usePublicLandlordProfile(), getPublicTenantProfileQueryKey(), usePublicTenantProfile(), fetchPublicLandlordProfile(), fetchPublicTenantProfile() (+8 more)

### Community 9 - "ErrorDialog.tsx"
Cohesion: 0.12
Nodes (19): AuthCompleteProfile(), ProfileForm, requiredFields, CompleteProfile(), ProfileForm, requiredFields, OTPVerification(), OTPVerification() (+11 more)

### Community 10 - "devDependencies"
Cohesion: 0.05
Nodes (42): eslint, eslint-config-expo, eslint-import-resolver-typescript, expo-doctor, fast-check, jest, jest-expo, metro-minify-terser (+34 more)

### Community 11 - "apartment/[apartmentId]/index.tsx"
Cohesion: 0.10
Nodes (22): ApartmentSkeleton(), ApartmentDescriptionSection(), ApartmentDescriptionSectionProps, LandlordSection(), LandlordSectionProps, LeaseAgreementSection(), LeaseAgreementSectionProps, DirectionMode (+14 more)

### Community 12 - "sign-in.tsx"
Cohesion: 0.24
Nodes (9): AuthButton(), AuthButtonProps, AuthDivider(), AuthDividerProps, RoleTab(), RoleTabProps, SignIn(), SignUp() (+1 more)

### Community 13 - "useFavorites"
Cohesion: 0.16
Nodes (22): ApartmentScreen(), TenantFavorites(), getErrorMessage(), getFavoriteApartmentsQueryKey(), getFavoritesQueryKey(), createWrapper(), mockDeleteFavorite, mockFetchApartmentsByIds (+14 more)

### Community 14 - "applications/index.ts"
Cohesion: 0.05
Nodes (52): ApplicationsList(), ApplicationsEmptyState(), ApplicationStatusCard(), Props, ApplicationStatusCardSkeleton(), ApplicationApartment(), UseLeaseAgreementOptions, ApplicationStatus (+44 more)

### Community 15 - "paymentService.ts"
Cohesion: 0.17
Nodes (16): getPaymentByReferenceQueryKey(), getPaymentQueryKey(), getPaymentsQueryKey(), usePaymentByReference(), CreateCashPaymentParams, fetchPaymentById(), fetchPaymentByReferenceId(), fetchPayments() (+8 more)

### Community 16 - "images.ts"
Cohesion: 0.17
Nodes (13): getLastMessageDisplay(), MessageCard(), MessageCardProps, PAYMENT_METHOD_TYPES, PaymentMethodType, getLogoSource(), maskMobileNumber(), PaymentMethod (+5 more)

### Community 17 - "ai-search.tsx"
Cohesion: 0.10
Nodes (19): AISearchScreen(), SUGGESTION_CHIPS, AIHeader(), AIHeaderProps, EmptyChatState(), MessageBubble(), MessageBubbleProps, MessageComposer() (+11 more)

### Community 18 - "usePersonalizationStore.ts"
Cohesion: 0.12
Nodes (20): CityCheckBox(), CityCheckBoxProps, PersonalizationProgress(), Props, PersonalizationRadioButton(), PersonalizationRadioButtonProps, StepFive(), StepFour() (+12 more)

### Community 19 - "notificationService.ts"
Cohesion: 0.19
Nodes (15): NotificationManager(), GENERAL_TOGGLES, GeneralToggleKey, NOTIFICATION_TYPE_LABELS, getNotificationPreferencesQueryKey(), useNotificationPreferences(), usePushRegistration(), DEFAULT_NOTIFICATION_PREFERENCES (+7 more)

### Community 20 - "useVerificationStore"
Cohesion: 0.15
Nodes (17): getCaptureSequence(), SelectId(), SelfiePrep(), Success(), UploadSelfie(), StepProgress(), StepProgressProps, useVerificationStore (+9 more)

### Community 21 - "chatService.ts"
Cohesion: 0.16
Nodes (19): AttachmentUploadFailure, buildOlderThanChatMessageFilter(), ChatMessagePage, EXTENSION_BY_MIME_TYPE, fetchMessagePage(), fetchMessages(), generateId(), getChatAttachmentSignedUrls() (+11 more)

### Community 22 - "[conversationId].tsx"
Cohesion: 0.11
Nodes (20): ATTACHMENT_OPTIONS, ChatBox(), ChatBoxProps, getSnippet(), StagedAsset, ChatEmptyState(), ChatEmptyStateProps, ChatHeader() (+12 more)

### Community 23 - "reviews/index.tsx"
Cohesion: 0.18
Nodes (11): RatingBarCount(), RatingBarCountProps, RatingsPage(), SORT_OPTIONS, RatingCard(), RatingCardProps, RatingCardSkeleton(), SmallRatingCard() (+3 more)

### Community 24 - "paymongoService.ts"
Cohesion: 0.17
Nodes (11): PaymentVerify(), extractError(), getCheckoutSessionStatus(), invoke(), PaymongoCard, PaymongoCardPaymentResult, PaymongoCheckoutSession, PaymongoEnvelope (+3 more)

### Community 25 - "paths"
Cohesion: 0.09
Nodes (22): ./assets/*, ./components/*, ./constants/*, expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.ts, ./hooks/*, ../../packages/ui/* (+14 more)

### Community 26 - "notifications/index.ts"
Cohesion: 0.21
Nodes (17): NotificationCard(), NotificationCardProps, NotificationCardType, NotificationSettingsScreen(), NotificationToastContent(), NotificationToastContentProps, NotificationToastOptions, TOAST_VARIANT_BY_TYPE (+9 more)

### Community 27 - "PaymentMethodSelector.tsx"
Cohesion: 0.13
Nodes (18): CardInformation, CardPaymentForm(), CardPaymentFormProps, CashPaymentErrors, CashPaymentForm(), CashPaymentFormProps, PaymentMethodButton(), PaymentMethodButtonProps (+10 more)

### Community 28 - "payment-history/[paymentId].tsx"
Cohesion: 0.38
Nodes (12): PaymentHistoryCard(), PaymentHistoryCardProps, LandlordPaymentReceipt(), ReceiptCard(), toHistoryItem(), PaymentReceipt(), Success(), usePayment() (+4 more)

### Community 29 - "landlordService.ts"
Cohesion: 0.11
Nodes (21): Index(), EMPTY_COUNTS, ActionBadgeCategory, ActionBadgeCounts, DB_TO_DISPLAY_STATUS, DbStatus, DISPLAY_TO_DB_STATUS, fetchLandlordApartmentIds() (+13 more)

### Community 30 - "[landlordId].tsx"
Cohesion: 0.24
Nodes (7): TODO: Implement function to handle report landlord, TODO: Implement function to handle report tenant, PastApartmentCard(), PastApartmentCardProps, ProfileStat, ProfileStatsCard(), ProfileStatsCardProps

### Community 31 - "tenant-applications/index.tsx"
Cohesion: 0.14
Nodes (14): ApplicationFilters, ApplicationFilterSheet(), LOCATION_OPTIONS, Props, STATUS_OPTIONS, EmptyApplications(), EmptySearchResults(), getInitials() (+6 more)

### Community 32 - "useTheme.ts"
Cohesion: 0.17
Nodes (10): MaintenanceRequestCard(), MaintenanceRequestCardProps, PropertyActionMenu(), Props, PropertyOverviewSkeleton(), TenantCard(), TenantCardProps, BEDROOM_OPTIONS (+2 more)

### Community 33 - "upload-id.tsx"
Cohesion: 0.22
Nodes (13): CaptureStepConfig, CaptureStepSummary(), CaptureStepSummaryProps, UploadId(), CaptureProgress, computeCanContinue(), getCaptureProgress(), IdCaptureResult (+5 more)

### Community 34 - "live-capture.tsx"
Cohesion: 0.16
Nodes (10): getNextCaptureStep(), CapturedPhoto, LiveCapture(), ScreenState, computeFillRatio(), computeGuidedFrameRect(), GuidedFrameOverlay(), GuidedFrameOverlayProps (+2 more)

### Community 35 - "useColors"
Cohesion: 0.08
Nodes (23): IconButton(), IconButtonProps, IconComponent, Index(), Failed(), SelectDocument(), Upload(), EmptyMaintenanceRequestDetail() (+15 more)

### Community 36 - "units.tsx"
Cohesion: 0.10
Nodes (18): QuickActionButton(), QuickActionButtonProps, EmptyProperties(), Props, PropertyCard(), PropertyCardProps, PropertyCardSkeleton(), PropertyFilterSheet() (+10 more)

### Community 37 - "useFrameQualityCheck.ts"
Cohesion: 0.18
Nodes (13): GuidedFrameRect, CameraPermissionState, useCameraPermission(), UseCameraPermissionResult, evaluateBlurHeuristic(), evaluateGlareHeuristic(), FrameQualityCheckOptions, FrameQualityReason (+5 more)

### Community 38 - "maintenance-requests/index.ts"
Cohesion: 0.16
Nodes (17): MaintenanceRequestCard(), MaintenanceRequestCardProps, ResolveRequestDialog(), ResolveRequestDialogProps, MaintenanceRequestDetails(), MaintenanceRequestCard(), MaintenanceRequestCardProps, MaintenanceDetails() (+9 more)

### Community 39 - "auth/index.ts"
Cohesion: 0.31
Nodes (8): UseCountdownOptions, useCurrentUser(), useCurrentUserId(), useNotificationTapHandler(), getCurrentUser(), getUserProfileByColumn(), getUserProfileById(), UserProfile

### Community 40 - "MoveInCostFooterSection.tsx"
Cohesion: 0.27
Nodes (7): MoveInCostFooterProps, MoveInCostFooterSection(), AppDialog(), AppDialogProps, formatOrNone(), MoveInCostBreakdown(), MoveInCostBreakdownProps

### Community 41 - "applications/[applicationId].tsx"
Cohesion: 0.14
Nodes (13): EmptyApplicationData(), TenantApplicationDetailsSkeleton(), EmptyRequestData(), ConfirmDialog(), Props, DetailField(), DetailFieldProps, DocumentRow() (+5 more)

### Community 42 - "dashboard.tsx"
Cohesion: 0.19
Nodes (11): DashboardSkeleton(), chartLabel(), ProfitByPropertyCard(), ProfitByPropertyCardProps, ProfitTrendCard(), RentDueCard(), RentDueCardProps, MONTHS (+3 more)

### Community 43 - "payment/index.tsx"
Cohesion: 0.18
Nodes (16): Rentals(), validateCashPayment(), PaymentFooter(), PaymentFooterProps, PaymentSummaryCard(), PaymentSummaryCardProps, formatLeaseDate(), INITIAL_CARD (+8 more)

### Community 44 - "updateApartmentMain.ts"
Cohesion: 0.12
Nodes (23): EditProfile(), EditMain(), validateForm(), ApartmentMainFields, deleteStorageImage(), ExistingImage, PendingImage, thumbPathFor() (+15 more)

### Community 45 - "audit-fix.characterization.test.ts"
Cohesion: 0.12
Nodes (10): ChatRow, mockChannel, mockChatRows, mockCreateSignedUrls, mockFrom, mockGetUser, mockRemoveChannel, mockStorageFrom (+2 more)

### Community 46 - "useProfile"
Cohesion: 0.24
Nodes (8): FieldErrors, FirstProcess(), RateApartment(), TabsLayout(), useProfile(), SubmitReviewParams, SubmitReviewResult, useSubmitReview()

### Community 47 - "maintenance-requests/index.tsx"
Cohesion: 0.21
Nodes (9): EmptyMaintenanceRequestsList(), MaintenanceRequestCardSkeleton(), LOCATION_OPTIONS, MaintenanceRequestFilters, MaintenanceRequestFilterSheet(), Props, STATUS_OPTIONS, URGENCY_OPTIONS (+1 more)

### Community 48 - "app/_layout.tsx"
Cohesion: 0.27
Nodes (8): RootLayout(), ThemeInitializer(), Index(), DevBadge(), useTheme(), ThemeMode, ThemeStore, useThemeStore

### Community 49 - "ApplicationHeader.tsx"
Cohesion: 0.16
Nodes (11): FormErrors, SecondProcess(), FormErrors, ThirdProcess(), FieldErrors, UploadFileField(), UploadFileFieldProps, ApplicationHeader() (+3 more)

### Community 50 - "useTenancyRealtime.ts"
Cohesion: 0.24
Nodes (13): attachPaymentChannel(), attachSubscriber(), attachTenantChannel(), Channel, createRefSubscriber(), detachSubscriber(), getRecordString(), paymentChannels (+5 more)

### Community 51 - "document-id/index.tsx"
Cohesion: 0.23
Nodes (11): DocumentCard(), DocumentCardProps, Index(), TODO: Implement contact support functionality,, TODO: Fetch and display user's uploaded documents and IDs here. This may…, UploadedDocument, DOCUMENT_EXTENSIONS, getExtension() (+3 more)

### Community 52 - "ProfitTrendCard.tsx"
Cohesion: 0.22
Nodes (8): BUILDERS, ChartDatum, FilterOption, filterOptions, ProfitTrendCardProps, toMonthly(), monthLabel(), MonthlyRevenuePoint

### Community 53 - "useChat.ts"
Cohesion: 0.24
Nodes (11): Options, useChat(), useChatChannel(), Options, useChatTyping(), ChatMessagePlacement, mergeChatMessages(), ChatMessageCursor (+3 more)

### Community 54 - "useChatChannel.ts"
Cohesion: 0.12
Nodes (17): ChatBubbleContentProps, ChatBubbleProps, BroadcastEvent, BroadcastPayload, DeleteEvent, DeletePayload, PresenceJoinEvent, PresenceLeaveEvent (+9 more)

### Community 55 - "review-information.tsx"
Cohesion: 0.23
Nodes (9): ReviewAccordionItem(), ReviewAccordionItemProps, ReviewDocumentFile(), ReviewDocumentFileProps, ReviewDocumentImage(), ReviewDocumentImageProps, ReviewInformation(), useSubmitApplication() (+1 more)

### Community 56 - "useNotifications.ts"
Cohesion: 0.20
Nodes (15): NotificationBellButton(), NotificationBellButtonProps, attach(), ChannelEntry, detach(), handleEvent(), NotificationRealtimeCallbacks, registry (+7 more)

### Community 57 - "maintenanceService.ts"
Cohesion: 0.21
Nodes (14): MaintenanceHistory(), getMaintenanceRequestHistoryQueryKey(), useMaintenanceRequestHistory(), UseMaintenanceRequestHistoryParams, getLatestMaintenanceRequestQueryKey(), useMaintenanceRequests(), UseMaintenanceRequestsParams, cancelMaintenanceRequest() (+6 more)

### Community 58 - "dependencies"
Cohesion: 0.11
Nodes (19): expo-constants, expo-font, expo-router, dependencies, expo-constants, expo-font, expo-router, react-native-calendars (+11 more)

### Community 59 - "RescheduleSheet.tsx"
Cohesion: 0.18
Nodes (10): Period, Props, RescheduleSheet(), tomorrow, toSupabaseTime(), HOURS, Period, PERIODS (+2 more)

### Community 60 - "useTenancy"
Cohesion: 0.27
Nodes (11): History(), getErrorMessage(), getRecordString(), getTenancyQueryKey(), useTenancy(), CurrentTenancy, fetchTenancy(), TenancyApartment (+3 more)

### Community 61 - "useLandlordActionBadges"
Cohesion: 0.22
Nodes (10): MaintenanceRequests(), TenantApplications(), Units(), getLandlordBadgesQueryKey(), useLandlordActionBadges(), getLandlordUnitsQueryKey(), useLandlordUnits(), fetchLandlordUnits() (+2 more)

### Community 62 - "NotificationScreen.tsx"
Cohesion: 0.18
Nodes (10): NotificationCardSkeleton(), NotificationFilter, NotificationList(), NotificationListProps, NotificationScreen(), NotificationScreenProps, useNotificationActions(), getNotificationsQueryKey() (+2 more)

### Community 63 - "onboarding.tsx"
Cohesion: 0.21
Nodes (7): { width }, OnBoardingSlide(), OnBoardingSlideProps, Slide, SLIDES, USER_ROLES, UserRole

### Community 64 - "queryClient.ts"
Cohesion: 0.06
Nodes (39): CompleteProfileCard(), CompleteProfileCardProps, ProfileHeader(), ProfileHeaderProps, AccountStatus, StatusConfig, VerificationStatus(), VerificationStatusProps (+31 more)

### Community 65 - "ChatBubble.tsx"
Cohesion: 0.22
Nodes (11): BlurBackdrop(), BubbleLayout, calculateImageSize(), ChatBubble(), ChatBubbleContent(), formatHoldDate(), getReplySnippet(), mockPlayer (+3 more)

### Community 66 - "captureSequences.ts"
Cohesion: 0.24
Nodes (8): ALL_SUPPORTED_ID_TYPES, CaptureCameraFacing, CaptureGuideShape, CARD_SEQUENCE, PASSPORT_SEQUENCE, SELFIE_STEP, SEQUENCE_BY_ID_TYPE, NON_PASSPORT_ID_TYPES

### Community 67 - "useInAppNotificationBanner.tsx"
Cohesion: 0.29
Nodes (7): getOpenChatConversationKey(), shouldSuppressChatToast(), useInAppNotificationBanner(), buildNotificationDeepLink(), NotificationData, parseConversationKey(), Role

### Community 69 - "useLandlordPayments.ts"
Cohesion: 0.19
Nodes (12): getLandlordPaymentsQueryKey(), useLandlordPaymentConfirmation(), useLandlordPayments(), useLandlordStats(), fetchLandlordPayments(), fetchLandlordStats(), LandlordPaymentRecord, LandlordStats (+4 more)

### Community 70 - "useApplicationFormStore.ts"
Cohesion: 0.18
Nodes (10): ApartmentContext, ApplicationFormState, initialApartmentContext, initialDocuments, initialRentalPreferences, initialTenantInformation, initialUploadedPaths, RentalPreferences (+2 more)

### Community 71 - "notification-toast.tsx"
Cohesion: 0.40
Nodes (5): MOCK_TOASTS, MockRow, MockToast, NotificationToastDevScreen(), showNotificationToast()

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
Cohesion: 0.19
Nodes (8): ApartmentDescriptionCard(), ApartmentDescriptionCardProps, PaymentSummaryCard(), PaymentSummaryCardProps, RentalsSkeleton(), TenancyEmptyState(), actions, actionsTypes

### Community 76 - "edit-profile.tsx"
Cohesion: 0.17
Nodes (10): EditProfileForm, EMPTY_FORM, FormErrors, MaintenanceDetails, MaintenanceErrors, SuccessDialog(), SuccessDialogProps, DropdownField() (+2 more)

### Community 77 - "rate-apartment.tsx"
Cohesion: 0.17
Nodes (9): RateApartmentSkeleton(), ErrorDialogState, FormErrors, TenancyLeasePeriod, FormErrors, ApartmentInformation, DisplayImage, UploadImageField() (+1 more)

### Community 78 - "reset-password.tsx"
Cohesion: 0.50
Nodes (3): ResetPassword(), AppInput(), AppInputProps

### Community 80 - "useTenancyRealtime.test.ts"
Cohesion: 0.20
Nodes (7): MockChannel, mockChannelFactory, MockChannelHandler, mockChannelsByName, MockPayload, MockPostgresFilter, mockRemoveChannel

### Community 81 - "visit-requests/index.tsx"
Cohesion: 0.05
Nodes (47): EmptyApproved(), EmptyPending(), VisitRequestCalendar(), VisitRequestCalendarProps, VisitRequestCard(), VisitRequestCardProps, VisitRequestCardSkeleton(), DATE_RANGE_OPTIONS (+39 more)

### Community 82 - "useApplicationActions.test.tsx"
Cohesion: 0.18
Nodes (14): getStatusStyle(), TenantApplicationDetails(), createWrapper(), mockEq, mockFrom, mockUpdate, mockUseCurrentUser, useApplicationActions() (+6 more)

### Community 83 - "chatService.pagination.test.ts"
Cohesion: 0.20
Nodes (6): ChatRow, mockFrom, mockStorageFrom, pageResponses, QueryLog, queryLogs

### Community 84 - "history/index.tsx"
Cohesion: 0.20
Nodes (11): EMPTY_FILTERS, FlatPayment, PaymentHistoryScreen(), toFlatPayment(), PaymentHistoryFilters, PaymentHistoryFilterSheet(), PaymentSort, Props (+3 more)

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

### Community 100 - "search.tsx"
Cohesion: 0.12
Nodes (27): SectionDetail(), ApartmentsList(), ApartmentsListProps, SearchFiltersBar(), SearchFiltersBarProps, Props, SearchGridSkeleton(), SearchSection() (+19 more)

### Community 104 - "second-step.tsx"
Cohesion: 0.36
Nodes (7): DEFAULT_COORDS, DEFAULT_ROOM_LIMITS, formatLimitMessage(), formatRange(), FormErrors, isZeroRange(), SecondStep()

### Community 125 - "useLandlordTenancy.ts"
Cohesion: 0.32
Nodes (7): Index(), getLandlordTenancyQueryKey(), useLandlordTenancy(), fetchLandlordTenancy(), LandlordTenancyMaintenanceRequest, LandlordTenant, PaymentRecord

### Community 132 - "useSubmitApplication.ts"
Cohesion: 0.29
Nodes (7): DocKey, getContentType(), MIME_MAP, SubmitArgs, SubmitResult, uploadDoc(), UploadedDocumentPaths

### Community 135 - "useLandlordMaintenanceRequests.ts"
Cohesion: 0.43
Nodes (7): getLandlordMaintenanceRequestsQueryKey(), getNextStatus(), STATUS_FLOW, useLandlordMaintenanceRequests(), fetchLandlordMaintenanceRequests(), LandlordMaintenanceRequest, updateLandlordMaintenanceStatus()

### Community 140 - "useRentalPreferencesForm.ts"
Cohesion: 0.33
Nodes (6): RentalPreferences(), DEFAULT_PREFS, prefsEqual(), useRentalPreferencesForm(), TenantPreferences, CURRENT_USER_QUERY_KEY

### Community 141 - "DropdownButton.tsx"
Cohesion: 0.38
Nodes (5): SearchHeader(), SearchHeaderProps, DropdownButton(), DropdownButtonProps, formatMultiDisplay()

### Community 148 - "analytics.tsx"
Cohesion: 0.40
Nodes (4): AnalyticsScreen(), MAX_AMOUNT, monthlyData, stats

### Community 172 - "ReceiptCard.tsx"
Cohesion: 0.18
Nodes (10): ReceiptCardProps, STATUS_META, ZigzagEdge(), ZigzagEdgeProps, PaymentHistoryCard(), PaymentHistoryCardProps, PaymentHistoryItem, PaymentStatus (+2 more)

## Knowledge Gaps
- **625 isolated node(s):** `googleMapsKey`, `ProfileForm`, `requiredFields`, `ProfileForm`, `requiredFields` (+620 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **72 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useColors()` connect `useColors` to `apartments/index.ts`, `ScreenWrapper.tsx`, `map-search.tsx`, `ratings/index.ts`, `dashboardService.ts`, `fifth-step.tsx`, `useConversations.test.tsx`, `FilterBottomSheet.tsx`, `profilesService.ts`, `ErrorDialog.tsx`, `apartment/[apartmentId]/index.tsx`, `sign-in.tsx`, `useFavorites`, `useRentalPreferencesForm.ts`, `applications/index.ts`, `DropdownButton.tsx`, `ai-search.tsx`, `usePersonalizationStore.ts`, `notificationService.ts`, `useVerificationStore`, `analytics.tsx`, `[conversationId].tsx`, `reviews/index.tsx`, `images.ts`, `notifications/index.ts`, `PaymentMethodSelector.tsx`, `payment-history/[paymentId].tsx`, `landlordService.ts`, `[landlordId].tsx`, `tenant-applications/index.tsx`, `useTheme.ts`, `upload-id.tsx`, `live-capture.tsx`, `units.tsx`, `maintenance-requests/index.ts`, `applications/[applicationId].tsx`, `dashboard.tsx`, `payment/index.tsx`, `updateApartmentMain.ts`, `ReceiptCard.tsx`, `useProfile`, `maintenance-requests/index.tsx`, `app/_layout.tsx`, `ApplicationHeader.tsx`, `document-id/index.tsx`, `ProfitTrendCard.tsx`, `review-information.tsx`, `useNotifications.ts`, `maintenanceService.ts`, `RescheduleSheet.tsx`, `useTenancy`, `useLandlordActionBadges`, `queryClient.ts`, `ChatBubble.tsx`, `CustomTabBar.tsx`, `TabBar.tsx`, `rentals.tsx`, `edit-profile.tsx`, `rate-apartment.tsx`, `reset-password.tsx`, `visit-requests/index.tsx`, `useApplicationActions.test.tsx`, `history/index.tsx`, `search.tsx`, `second-step.tsx`, `useLandlordTenancy.ts`?**
  _High betweenness centrality (0.293) - this node is a cross-community bridge._
- **Why does `ScreenWrapper` connect `ScreenWrapper.tsx` to `apartments/index.ts`, `map-search.tsx`, `fifth-step.tsx`, `ErrorDialog.tsx`, `apartment/[apartmentId]/index.tsx`, `sign-in.tsx`, `useFavorites`, `applications/index.ts`, `images.ts`, `ai-search.tsx`, `usePersonalizationStore.ts`, `notificationService.ts`, `useVerificationStore`, `analytics.tsx`, `[conversationId].tsx`, `reviews/index.tsx`, `[landlordId].tsx`, `tenant-applications/index.tsx`, `useTheme.ts`, `upload-id.tsx`, `live-capture.tsx`, `units.tsx`, `maintenance-requests/index.ts`, `applications/[applicationId].tsx`, `dashboard.tsx`, `payment/index.tsx`, `useProfile`, `maintenance-requests/index.tsx`, `ApplicationHeader.tsx`, `document-id/index.tsx`, `review-information.tsx`, `NotificationScreen.tsx`, `rentals.tsx`, `edit-profile.tsx`, `rate-apartment.tsx`, `reset-password.tsx`, `visit-requests/index.tsx`, `history/index.tsx`, `search.tsx`, `second-step.tsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `useCurrentUser()` connect `auth/index.ts` to `ratings/index.ts`, `dashboardService.ts`, `useConversations.test.tsx`, `profilesService.ts`, `useRentalPreferencesForm.ts`, `useFavorites`, `applications/index.ts`, `notificationService.ts`, `landlordService.ts`, `[landlordId].tsx`, `payment/index.tsx`, `useProfile`, `useChat.ts`, `useNotifications.ts`, `useTenancy`, `useLandlordActionBadges`, `NotificationScreen.tsx`, `queryClient.ts`, `useInAppNotificationBanner.tsx`, `useApplicationActions.test.tsx`, `search.tsx`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `googleMapsKey`, `ProfileForm`, `requiredFields` to the rest of the system?**
  _625 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ScreenWrapper.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06845238095238096 - nodes in this community are weakly interconnected._
- **Should `map-search.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07595628415300547 - nodes in this community are weakly interconnected._
- **Should `useConversations.test.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09243697478991597 - nodes in this community are weakly interconnected._