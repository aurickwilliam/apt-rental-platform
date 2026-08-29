# Graph Report - mobile  (2026-08-29)

## Corpus Check
- 447 files · ~637,598 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1990 nodes · 4722 edges · 169 communities (99 shown, 70 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `10817aac`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- apartments/index.ts
- useTheme.ts
- edit-profile.tsx
- [tenantId].tsx
- dashboard.tsx
- ApartmentCard.tsx
- useConversations.test.tsx
- search.tsx
- fifth-step.tsx
- ErrorDialog.tsx
- devDependencies
- expo
- expo-router
- manage-apartment/[apartmentId]/index.tsx
- privateMediaResolver.ts
- paymentService.ts
- images.ts
- ai-search.tsx
- usePersonalizationStore.ts
- notificationService.ts
- useVerificationStore
- chatService.ts
- [conversationId].tsx
- useNotificationRealtime.ts
- paymongoService.ts
- paths
- notifications/index.ts
- PaymentMethodSelector.tsx
- payment-history/index.tsx
- landlordService.ts
- (landlord)/profile.tsx
- tenant-applications/index.tsx
- useColors
- upload-id.tsx
- live-capture.tsx
- maintenanceService.ts
- units.tsx
- useFrameQualityCheck.ts
- dependencies
- auth/index.ts
- second-step.tsx
- NotificationScreen.tsx
- history/index.tsx
- payment/index.tsx
- edit-main.tsx
- audit-fix.characterization.test.ts
- useApplicationActions.test.tsx
- useLandlordActionBadges
- app/_layout.tsx
- ApplicationList.tsx
- useTenancy
- DocumentCard.tsx
- pending.tsx
- visit-requests/index.tsx
- chat/index.ts
- third-process.tsx
- [landlordId].tsx
- maintenance-requests/index.ts
- expo
- RescheduleSheet.tsx
- review-information.tsx
- chatService.pagination.test.ts
- useInAppNotificationBanner.tsx
- onboarding.tsx
- applications/components/VisitRequestCard.tsx
- ChatBubble.tsx
- maintenance-requests/index.tsx
- usePublishApartment.ts
- useLandlordUnits.ts
- useLandlordPayments.ts
- captureSequences.ts
- visitRequests/index.ts
- useProfile
- TabBar.tsx
- live-capture.test.tsx
- applications/index.ts
- CustomTabBar.tsx
- upload-id.test.tsx
- sign-in.tsx
- UploadDocumentField.tsx
- third-step.tsx
- useLandlordMaintenanceRequests.ts
- useApplicationStatusStyles.ts
- rentals.tsx
- ReceiptCard.tsx
- maintenance-requests/[requestId].tsx
- metro.config.js
- Welcome to your Expo app 👋
- playground.tsx
- uniwind-types.d.ts
- ReviewField.tsx
- StatusPill.tsx
- eslint.config.js
- reset-password.tsx
- TenantApplicationCard.tsx
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
- tenantApplicationsService.test.ts

## God Nodes (most connected - your core abstractions)
1. `useColors()` - 334 edges
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
- `ThirdProcess()` --calls--> `useApplicationFormStore`  [EXTRACTED]
  app/apartment/[apartmentId]/apply/third-process.tsx → stores/useApplicationFormStore.ts

## Import Cycles
- 2-file cycle: `hooks/applications/index.ts -> hooks/applications/useApplicationActions.ts -> hooks/applications/index.ts`
- 2-file cycle: `hooks/applications/index.ts -> service/applications/tenantApplicationsService.ts -> hooks/applications/index.ts`
- 3-file cycle: `hooks/applications/index.ts -> hooks/applications/useTenantApplications.ts -> service/applications/tenantApplicationsService.ts -> hooks/applications/index.ts`
- 3-file cycle: `hooks/payments/index.ts -> hooks/payments/usePayments.ts -> service/payments/paymentService.ts -> hooks/payments/index.ts`

## Communities (169 total, 70 thin omitted)

### Community 0 - "apartments/index.ts"
Cohesion: 0.06
Nodes (41): ApartmentSkeleton(), IconButton(), IconButtonProps, IconComponent, ApartmentDescriptionSection(), ApartmentDescriptionSectionProps, ApartmentDetailsSection(), ApartmentDetailsSectionProps (+33 more)

### Community 1 - "useTheme.ts"
Cohesion: 0.07
Nodes (29): RateApartmentSkeleton(), PerksSectionProps, ErrorDialogState, FormErrors, TenancyLeasePeriod, DOCUMENT_TYPE_ICONS, TODO: Persist the uploaded document to Supabase Storage and store its, AnalyticsScreen() (+21 more)

### Community 2 - "edit-profile.tsx"
Cohesion: 0.11
Nodes (17): FieldErrors, FormErrors, EditProfileForm, EMPTY_FORM, FormErrors, MaintenanceDetails, MaintenanceErrors, SuccessDialog() (+9 more)

### Community 3 - "[tenantId].tsx"
Cohesion: 0.06
Nodes (45): ApartmentScreen(), RatingsPage(), ReviewsPage(), PublicLandlordProfile(), PublicTenantProfile(), TODO: Implement function to handle report tenant, PastApartmentCard(), PastApartmentCardProps (+37 more)

### Community 4 - "dashboard.tsx"
Cohesion: 0.06
Nodes (38): DashboardSkeleton(), chartLabel(), ProfitByPropertyCard(), ProfitByPropertyCardProps, BUILDERS, ChartDatum, FilterOption, filterOptions (+30 more)

### Community 5 - "ApartmentCard.tsx"
Cohesion: 0.16
Nodes (15): ApartmentsList(), ApartmentsListProps, Props, SearchSection(), SearchSectionSkeleton(), Props, SearchSectionsList(), SearchSection (+7 more)

### Community 6 - "useConversations.test.tsx"
Cohesion: 0.10
Nodes (27): Chat(), Chat(), getConversationsQueryKey(), NewChatRow, createWrapper(), mockChannelFn, mockFetchConversations, mockGetChannels (+19 more)

### Community 7 - "search.tsx"
Cohesion: 0.14
Nodes (15): DEFAULT_FILTERS, FilterBottomSheet(), FilterState, Props, ROOM_OPTS, SearchFiltersBar(), SearchFiltersBarProps, SearchHeader() (+7 more)

### Community 8 - "fifth-step.tsx"
Cohesion: 0.15
Nodes (15): Amenities(), DEFAULT_COORDS, FifthStep(), MAP_STYLE, FourthStep(), Index(), DEFAULT_COORDS, MAP_STYLE (+7 more)

### Community 9 - "ErrorDialog.tsx"
Cohesion: 0.14
Nodes (16): AuthCompleteProfile(), ProfileForm, requiredFields, CompleteProfile(), ProfileForm, requiredFields, OTPVerification(), OTPVerification() (+8 more)

### Community 10 - "devDependencies"
Cohesion: 0.05
Nodes (42): eslint, eslint-config-expo, eslint-import-resolver-typescript, expo-doctor, fast-check, jest, jest-expo, metro-minify-terser (+34 more)

### Community 11 - "expo"
Cohesion: 0.05
Nodes (39): backgroundColor, foregroundImage, adaptiveIcon, googleServicesFile, package, permissions, predictiveBackGestureEnabled, softwareKeyboardLayoutMode (+31 more)

### Community 13 - "manage-apartment/[apartmentId]/index.tsx"
Cohesion: 0.14
Nodes (13): PropertyOverviewSkeleton(), EmptyApplicationData(), TenantApplicationDetailsSkeleton(), ConfirmDialog(), Props, DetailField(), DetailFieldProps, DocumentRow() (+5 more)

### Community 14 - "privateMediaResolver.ts"
Cohesion: 0.11
Nodes (28): DocEntry, ResolvedDoc, DocumentEntriesProps, mockResolvePrivateMediaUrls, useDocumentUrls(), cacheKey(), chatMediaRetryKeys, claimChatMediaRetry() (+20 more)

### Community 15 - "paymentService.ts"
Cohesion: 0.17
Nodes (17): getPaymentByReferenceQueryKey(), getPaymentQueryKey(), getPaymentsQueryKey(), usePaymentByReference(), usePayments(), CreateCashPaymentParams, fetchPaymentById(), fetchPaymentByReferenceId() (+9 more)

### Community 16 - "images.ts"
Cohesion: 0.09
Nodes (19): TODO: Implement contact support functionality,, TODO: Fetch and display user's uploaded documents and IDs here. This may…, UploadedDocument, AIHeaderProps, getLastMessageDisplay(), MessageCard(), MessageCardProps, PAYMENT_METHOD_TYPES (+11 more)

### Community 17 - "ai-search.tsx"
Cohesion: 0.10
Nodes (18): AISearchScreen(), SUGGESTION_CHIPS, AIHeader(), EmptyChatState(), MessageBubble(), MessageBubbleProps, MessageComposer(), MessageComposerProps (+10 more)

### Community 18 - "usePersonalizationStore.ts"
Cohesion: 0.12
Nodes (20): CityCheckBox(), CityCheckBoxProps, PersonalizationProgress(), Props, PersonalizationRadioButton(), PersonalizationRadioButtonProps, StepFive(), StepFour() (+12 more)

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
Cohesion: 0.12
Nodes (18): ATTACHMENT_OPTIONS, ChatBox(), ChatBoxProps, StagedAsset, ChatEmptyState(), ChatEmptyStateProps, ChatHeader(), ChatHeaderProps (+10 more)

### Community 23 - "useNotificationRealtime.ts"
Cohesion: 0.19
Nodes (12): MOCK_TOASTS, MockRow, MockToast, NotificationToastDevScreen(), showNotificationToast(), attach(), ChannelEntry, detach() (+4 more)

### Community 24 - "paymongoService.ts"
Cohesion: 0.17
Nodes (11): PaymentVerify(), extractError(), getCheckoutSessionStatus(), invoke(), PaymongoCard, PaymongoCardPaymentResult, PaymongoCheckoutSession, PaymongoEnvelope (+3 more)

### Community 25 - "paths"
Cohesion: 0.09
Nodes (22): ./assets/*, ./components/*, ./constants/*, expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.ts, ./hooks/*, ../../packages/ui/* (+14 more)

### Community 26 - "notifications/index.ts"
Cohesion: 0.25
Nodes (15): NotificationCard(), NotificationCardProps, NotificationSettingsScreen(), NotificationToastContent(), NotificationToastContentProps, NotificationToastOptions, TOAST_VARIANT_BY_TYPE, getNotificationTypeIcon() (+7 more)

### Community 27 - "PaymentMethodSelector.tsx"
Cohesion: 0.13
Nodes (18): CardInformation, CardPaymentForm(), CardPaymentFormProps, CashPaymentErrors, CashPaymentForm(), CashPaymentFormProps, PaymentMethodButton(), PaymentMethodButtonProps (+10 more)

### Community 28 - "payment-history/index.tsx"
Cohesion: 0.27
Nodes (16): PaymentHistoryCard(), PaymentHistoryCardProps, EMPTY_FILTERS, FlatPayment, PaymentHistoryScreen(), toFlatPayment(), LandlordPaymentReceipt(), ReceiptCard() (+8 more)

### Community 29 - "landlordService.ts"
Cohesion: 0.11
Nodes (22): Index(), Index(), getLandlordTenancyQueryKey(), useLandlordTenancy(), DB_TO_DISPLAY_STATUS, DbStatus, DISPLAY_TO_DB_STATUS, fetchLandlordTenancy() (+14 more)

### Community 30 - "(landlord)/profile.tsx"
Cohesion: 0.22
Nodes (11): CompleteProfileCard(), CompleteProfileCardProps, ProfileHeader(), ProfileHeaderProps, AccountStatus, StatusConfig, VerificationStatus(), VerificationStatusProps (+3 more)

### Community 31 - "tenant-applications/index.tsx"
Cohesion: 0.20
Nodes (9): ApplicationFilters, ApplicationFilterSheet(), LOCATION_OPTIONS, Props, STATUS_OPTIONS, EmptyApplications(), EmptySearchResults(), TenantApplicationCardSkeleton() (+1 more)

### Community 32 - "useColors"
Cohesion: 0.07
Nodes (30): RatingBarCount(), RatingBarCountProps, Index(), SignIn(), SignUp(), Failed(), SelectDocument(), Upload() (+22 more)

### Community 33 - "upload-id.tsx"
Cohesion: 0.22
Nodes (13): CaptureStepConfig, CaptureStepSummary(), CaptureStepSummaryProps, UploadId(), CaptureProgress, computeCanContinue(), getCaptureProgress(), IdCaptureResult (+5 more)

### Community 34 - "live-capture.tsx"
Cohesion: 0.16
Nodes (10): getNextCaptureStep(), CapturedPhoto, LiveCapture(), ScreenState, computeFillRatio(), computeGuidedFrameRect(), GuidedFrameOverlay(), GuidedFrameOverlayProps (+2 more)

### Community 35 - "maintenanceService.ts"
Cohesion: 0.23
Nodes (13): MaintenanceHistory(), getMaintenanceRequestHistoryQueryKey(), useMaintenanceRequestHistory(), UseMaintenanceRequestHistoryParams, getLatestMaintenanceRequestQueryKey(), useMaintenanceRequests(), UseMaintenanceRequestsParams, cancelMaintenanceRequest() (+5 more)

### Community 36 - "units.tsx"
Cohesion: 0.12
Nodes (16): QuickActionButton(), QuickActionButtonProps, PropertyCard(), PropertyCardProps, PropertyCardSkeleton(), PropertyFilterSheet(), PropertyFilterSheetProps, SORT_LABELS (+8 more)

### Community 37 - "useFrameQualityCheck.ts"
Cohesion: 0.18
Nodes (13): GuidedFrameRect, CameraPermissionState, useCameraPermission(), UseCameraPermissionResult, evaluateBlurHeuristic(), evaluateGlareHeuristic(), FrameQualityCheckOptions, FrameQualityReason (+5 more)

### Community 38 - "dependencies"
Cohesion: 0.11
Nodes (19): emoji-regex-xs, expo-constants, expo-router, dependencies, emoji-regex-xs, expo-constants, expo-router, react-native-gesture-handler (+11 more)

### Community 39 - "auth/index.ts"
Cohesion: 0.29
Nodes (7): useCurrentUser(), useCurrentUserId(), expo-web-browser, getCurrentUser(), getUserProfileByColumn(), getUserProfileById(), UserProfile

### Community 40 - "second-step.tsx"
Cohesion: 0.18
Nodes (13): plugins, DEFAULT_COORDS, DEFAULT_ROOM_LIMITS, formatLimitMessage(), formatRange(), FormErrors, isZeroRange(), MAP_STYLE (+5 more)

### Community 41 - "NotificationScreen.tsx"
Cohesion: 0.16
Nodes (17): NotificationCardType, NotificationCardSkeleton(), NotificationFilter, NotificationList(), NotificationListProps, NotificationScreen(), NotificationScreenProps, useNotificationActions() (+9 more)

### Community 42 - "history/index.tsx"
Cohesion: 0.17
Nodes (13): PaymentHistoryCard(), PaymentHistoryCardProps, PaymentHistoryItem, PaymentHistoryFilters, PaymentHistoryFilterSheet(), PaymentSort, Props, SORT_OPTIONS (+5 more)

### Community 43 - "payment/index.tsx"
Cohesion: 0.19
Nodes (14): validateCashPayment(), PaymentFooter(), PaymentFooterProps, PaymentSummaryCard(), PaymentSummaryCardProps, formatLeaseDate(), INITIAL_CARD, PaymentCheckout() (+6 more)

### Community 44 - "edit-main.tsx"
Cohesion: 0.21
Nodes (13): ApartmentInformation, DisplayImage, EditMain(), validateForm(), ApartmentMainFields, deleteStorageImage(), ExistingImage, PendingImage (+5 more)

### Community 45 - "audit-fix.characterization.test.ts"
Cohesion: 0.12
Nodes (10): ChatRow, mockChannel, mockChatRows, mockCreateSignedUrls, mockFrom, mockGetUser, mockRemoveChannel, mockStorageFrom (+2 more)

### Community 46 - "useApplicationActions.test.tsx"
Cohesion: 0.18
Nodes (14): getStatusStyle(), TenantApplicationDetails(), createWrapper(), mockEq, mockFrom, mockUpdate, mockUseCurrentUser, useApplicationActions() (+6 more)

### Community 47 - "useLandlordActionBadges"
Cohesion: 0.20
Nodes (11): MaintenanceRequests(), TenantApplications(), Units(), EMPTY_COUNTS, getLandlordBadgesQueryKey(), useLandlordActionBadges(), ActionBadgeCategory, ActionBadgeCounts (+3 more)

### Community 48 - "app/_layout.tsx"
Cohesion: 0.21
Nodes (10): RootLayout(), ThemeInitializer(), Index(), SettingItem, SettingSection, DevBadge(), useTheme(), ThemeMode (+2 more)

### Community 49 - "ApplicationList.tsx"
Cohesion: 0.36
Nodes (3): ApplicationsList(), ApplicationsEmptyState(), ApplicationStatusCardSkeleton()

### Community 50 - "useTenancy"
Cohesion: 0.08
Nodes (33): CurrentApartmentDetails(), formatDateToMonthYear(), History(), getErrorMessage(), getRecordString(), getTenancyQueryKey(), useTenancy(), attachPaymentChannel() (+25 more)

### Community 51 - "DocumentCard.tsx"
Cohesion: 0.33
Nodes (7): DocumentCard(), DocumentCardProps, Index(), DOCUMENT_EXTENSIONS, getExtension(), IMAGE_EXTENSIONS, isImageUri()

### Community 52 - "pending.tsx"
Cohesion: 0.22
Nodes (10): EmptyPending(), DATE_RANGE_OPTIONS, DateRange, Props, STATUS_OPTIONS, VisitRequestFilters, VisitRequestFilterSheet(), EMPTY_FILTERS (+2 more)

### Community 53 - "visit-requests/index.tsx"
Cohesion: 0.18
Nodes (10): EmptyApproved(), VisitRequestCalendar(), VisitRequestCalendarProps, VisitRequestCardSkeleton(), getGroup(), Group, GROUP_ORDER, GroupedItem (+2 more)

### Community 54 - "chat/index.ts"
Cohesion: 0.14
Nodes (14): BroadcastEvent, BroadcastPayload, PresenceJoinEvent, PresenceLeaveEvent, PresenceState, ChannelHandler, MockChannel, mockChannels (+6 more)

### Community 55 - "third-process.tsx"
Cohesion: 0.21
Nodes (8): FormErrors, ThirdProcess(), FormErrors, UploadImageField(), UploadImageFieldProps, ApplicationHeaderProps, CircleProgress(), CircleProgressProps

### Community 56 - "[landlordId].tsx"
Cohesion: 0.29
Nodes (7): SORT_OPTIONS, TODO: Implement function to handle report landlord, RatingCard(), RatingCardProps, RatingCardSkeleton(), StarRating(), StarRatingProps

### Community 57 - "maintenance-requests/index.ts"
Cohesion: 0.17
Nodes (17): MaintenanceRequestCard(), MaintenanceRequestCardProps, MaintenanceRequestDetails(), MaintenanceRequestCard(), MaintenanceRequestCardProps, MaintenanceDetails(), RequestMaintenance(), StatusStyle (+9 more)

### Community 59 - "RescheduleSheet.tsx"
Cohesion: 0.18
Nodes (10): Period, Props, RescheduleSheet(), tomorrow, toSupabaseTime(), HOURS, Period, PERIODS (+2 more)

### Community 60 - "review-information.tsx"
Cohesion: 0.08
Nodes (29): ApartmentSummary(), ReviewAccordionItem(), ReviewAccordionItemProps, ReviewDocumentFile(), ReviewDocumentFileProps, ReviewDocumentImage(), ReviewDocumentImageProps, FirstProcess() (+21 more)

### Community 61 - "chatService.pagination.test.ts"
Cohesion: 0.16
Nodes (9): ChatMessagePlacement, mergeChatMessages(), Message, ChatRow, mockFrom, mockStorageFrom, pageResponses, QueryLog (+1 more)

### Community 62 - "useInAppNotificationBanner.tsx"
Cohesion: 0.24
Nodes (10): NotificationManager(), getOpenChatConversationKey(), shouldSuppressChatToast(), useInAppNotificationBanner(), useNotificationTapHandler(), markNotificationRead(), buildNotificationDeepLink(), NotificationData (+2 more)

### Community 63 - "onboarding.tsx"
Cohesion: 0.21
Nodes (7): { width }, OnBoardingSlide(), OnBoardingSlideProps, Slide, SLIDES, USER_ROLES, UserRole

### Community 64 - "applications/components/VisitRequestCard.tsx"
Cohesion: 0.16
Nodes (11): VisitRequestCard(), VisitRequestCardProps, Props, VisitRequest, VisitRequestCard(), Props, VisitRequestHistoryItem(), FALLBACK_STYLE() (+3 more)

### Community 65 - "ChatBubble.tsx"
Cohesion: 0.27
Nodes (8): calculateImageSize(), ChatBubble(), ChatBubbleProps, mockPlayer, VideoBubble(), VisualMediaBubble(), isEmojiOnly(), MessageType

### Community 66 - "maintenance-requests/index.tsx"
Cohesion: 0.21
Nodes (9): EmptyMaintenanceRequestsList(), MaintenanceRequestCardSkeleton(), LOCATION_OPTIONS, MaintenanceRequestFilters, MaintenanceRequestFilterSheet(), Props, STATUS_OPTIONS, URGENCY_OPTIONS (+1 more)

### Community 67 - "usePublishApartment.ts"
Cohesion: 0.29
Nodes (9): EditProfile(), BUCKET_MAP, UploadTarget, useImageUpload(), uploadBytes(), uploadImage(), buildImageTiers(), compressImageTo() (+1 more)

### Community 68 - "useLandlordUnits.ts"
Cohesion: 0.47
Nodes (5): getLandlordUnitsQueryKey(), useLandlordUnits(), fetchLandlordUnits(), fetchMonthlyProfit(), LandlordUnitApartment

### Community 69 - "useLandlordPayments.ts"
Cohesion: 0.19
Nodes (12): getLandlordPaymentsQueryKey(), useLandlordPaymentConfirmation(), useLandlordPayments(), useLandlordStats(), fetchLandlordPayments(), fetchLandlordStats(), LandlordPaymentRecord, LandlordStats (+4 more)

### Community 70 - "captureSequences.ts"
Cohesion: 0.24
Nodes (8): ALL_SUPPORTED_ID_TYPES, CaptureCameraFacing, CaptureGuideShape, CARD_SEQUENCE, PASSPORT_SEQUENCE, SELFIE_STEP, SEQUENCE_BY_ID_TYPE, NON_PASSPORT_ID_TYPES

### Community 71 - "visitRequests/index.ts"
Cohesion: 0.27
Nodes (8): VisitRequestDetails(), getLandlordVisitRequestsQueryKey(), useLandlordVisitRequests(), useRespondToReschedule(), ActionStatus, useVisitRequestActions(), fetchLandlordVisitRequests(), LandlordVisitRequest

### Community 72 - "useProfile"
Cohesion: 0.21
Nodes (9): RateApartment(), TabsLayout(), RequestVisit(), useProfile(), SubmitReviewParams, SubmitReviewResult, useSubmitReview(), useSubmitVisitRequest() (+1 more)

### Community 73 - "TabBar.tsx"
Cohesion: 0.31
Nodes (6): TabBar(), TabBarIcon(), TabBarIconProps, IconProps, LANDLORDICONS, TENANTICONS

### Community 74 - "live-capture.test.tsx"
Cohesion: 0.25
Nodes (8): captureAndReachReview(), DEFAULT_QUALITY_RESULT, mockBack, mockDismissTo, mockReplace, mockSearchParams, mockTakePictureAsync, setPermission()

### Community 75 - "applications/index.ts"
Cohesion: 0.29
Nodes (10): ApplicationApartment(), useCancelApplication(), getTenantApplicationsQueryKey(), useTenantApplications(), ApplicationDocument, ApplicationDocumentPathKey, ApplicationRow, DOCUMENT_DEFINITIONS (+2 more)

### Community 76 - "CustomTabBar.tsx"
Cohesion: 0.21
Nodes (9): CustomTabBar(), CustomTabConfig, Props, TabItemsProps, TablerIconComponent, LANDLORD_TABS, LandlordTabLayout(), TENANT_TABS (+1 more)

### Community 77 - "upload-id.test.tsx"
Cohesion: 0.25
Nodes (7): BACK_CAPTURE, FRONT_CAPTURE, mockBack, mockPush, mockReplace, mockUseFocusEffect, SELFIE_CAPTURE

### Community 78 - "sign-in.tsx"
Cohesion: 0.33
Nodes (6): AuthButton(), AuthButtonProps, AuthDivider(), AuthDividerProps, RoleTab(), RoleTabProps

### Community 79 - "UploadDocumentField.tsx"
Cohesion: 0.43
Nodes (5): ACCEPTED_FILE_TYPES, UploadDocumentField(), UploadDocumentFieldProps, UploadedDocument, compressImage()

### Community 80 - "third-step.tsx"
Cohesion: 0.33
Nodes (4): FieldErrors, ThirdStep(), UploadFileField(), UploadFileFieldProps

### Community 81 - "useLandlordMaintenanceRequests.ts"
Cohesion: 0.52
Nodes (6): getLandlordMaintenanceRequestsQueryKey(), getNextStatus(), STATUS_FLOW, useLandlordMaintenanceRequests(), fetchLandlordMaintenanceRequests(), updateLandlordMaintenanceStatus()

### Community 82 - "useApplicationStatusStyles.ts"
Cohesion: 0.31
Nodes (7): ApplicationStatusCard(), Props, ApplicationStatus, ApplicationStatusStyle, ChipColor, FALLBACK_STYLE(), useApplicationStatusStyles()

### Community 83 - "rentals.tsx"
Cohesion: 0.14
Nodes (12): ApartmentDescriptionCard(), ApartmentDescriptionCardProps, PaymentSummaryCard(), PaymentSummaryCardProps, RentalsSkeleton(), TenancyEmptyState(), actions, actionsTypes (+4 more)

### Community 84 - "ReceiptCard.tsx"
Cohesion: 0.33
Nodes (4): ReceiptCardProps, STATUS_META, ZigzagEdge(), ZigzagEdgeProps

### Community 85 - "maintenance-requests/[requestId].tsx"
Cohesion: 0.47
Nodes (3): EmptyMaintenanceRequestDetail(), ResolveRequestDialog(), ResolveRequestDialogProps

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

### Community 98 - "TenantApplicationCard.tsx"
Cohesion: 0.40
Nodes (5): getInitials(), STATUS_STYLES, TenantApplicationCard(), TenantApplicationCardProps, TenantApplicationStatus

### Community 165 - "queryClient.ts"
Cohesion: 0.06
Nodes (47): SectionDetail(), transformApartments(), TenantFavorites(), QueryProvider(), QueryProviderProps, createWrapper(), mockFetchApartmentDetails, mockFetchReviewsPreview (+39 more)

### Community 167 - "useVisitRequest.ts"
Cohesion: 0.48
Nodes (5): getVisitRequestQueryKey(), useVisitRequest(), fetchVisitRequest(), VisitRequest, VisitRequestResult

### Community 168 - "tenantApplicationsService.test.ts"
Cohesion: 0.40
Nodes (3): applicationRow, mockFrom, mockResolvePrivateMediaUrls

## Knowledge Gaps
- **637 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+632 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **70 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useColors()` connect `useColors` to `apartments/index.ts`, `useTheme.ts`, `edit-profile.tsx`, `[tenantId].tsx`, `dashboard.tsx`, `ApartmentCard.tsx`, `useConversations.test.tsx`, `search.tsx`, `fifth-step.tsx`, `ErrorDialog.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `images.ts`, `ai-search.tsx`, `usePersonalizationStore.ts`, `notificationService.ts`, `useVerificationStore`, `[conversationId].tsx`, `notifications/index.ts`, `PaymentMethodSelector.tsx`, `payment-history/index.tsx`, `landlordService.ts`, `(landlord)/profile.tsx`, `tenant-applications/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `maintenanceService.ts`, `units.tsx`, `queryClient.ts`, `second-step.tsx`, `history/index.tsx`, `payment/index.tsx`, `useApplicationActions.test.tsx`, `useLandlordActionBadges`, `app/_layout.tsx`, `ApplicationList.tsx`, `useTenancy`, `DocumentCard.tsx`, `pending.tsx`, `visit-requests/index.tsx`, `third-process.tsx`, `[landlordId].tsx`, `maintenance-requests/index.ts`, `RescheduleSheet.tsx`, `review-information.tsx`, `applications/components/VisitRequestCard.tsx`, `ChatBubble.tsx`, `maintenance-requests/index.tsx`, `usePublishApartment.ts`, `visitRequests/index.ts`, `useProfile`, `TabBar.tsx`, `applications/index.ts`, `CustomTabBar.tsx`, `sign-in.tsx`, `UploadDocumentField.tsx`, `third-step.tsx`, `useApplicationStatusStyles.ts`, `rentals.tsx`, `ReceiptCard.tsx`, `maintenance-requests/[requestId].tsx`, `reset-password.tsx`?**
  _High betweenness centrality (0.215) - this node is a cross-community bridge._
- **Why does `expo-router` connect `expo-router` to `apartments/index.ts`, `useTheme.ts`, `edit-profile.tsx`, `[tenantId].tsx`, `dashboard.tsx`, `ApartmentCard.tsx`, `search.tsx`, `fifth-step.tsx`, `ErrorDialog.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `images.ts`, `usePersonalizationStore.ts`, `useVerificationStore`, `[conversationId].tsx`, `paymongoService.ts`, `payment-history/index.tsx`, `(landlord)/profile.tsx`, `tenant-applications/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `units.tsx`, `queryClient.ts`, `useFrameQualityCheck.ts`, `auth/index.ts`, `second-step.tsx`, `NotificationScreen.tsx`, `history/index.tsx`, `payment/index.tsx`, `edit-main.tsx`, `app/_layout.tsx`, `ApplicationList.tsx`, `pending.tsx`, `visit-requests/index.tsx`, `third-process.tsx`, `[landlordId].tsx`, `review-information.tsx`, `useInAppNotificationBanner.tsx`, `onboarding.tsx`, `maintenance-requests/index.tsx`, `useProfile`, `CustomTabBar.tsx`, `sign-in.tsx`, `third-step.tsx`, `useApplicationStatusStyles.ts`, `rentals.tsx`, `maintenance-requests/[requestId].tsx`, `playground.tsx`, `reset-password.tsx`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Why does `ScreenWrapper` connect `useTheme.ts` to `apartments/index.ts`, `edit-profile.tsx`, `[tenantId].tsx`, `dashboard.tsx`, `search.tsx`, `fifth-step.tsx`, `ErrorDialog.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `images.ts`, `ai-search.tsx`, `usePersonalizationStore.ts`, `notificationService.ts`, `useVerificationStore`, `[conversationId].tsx`, `payment-history/index.tsx`, `tenant-applications/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `units.tsx`, `queryClient.ts`, `second-step.tsx`, `NotificationScreen.tsx`, `history/index.tsx`, `payment/index.tsx`, `edit-main.tsx`, `app/_layout.tsx`, `ApplicationList.tsx`, `pending.tsx`, `visit-requests/index.tsx`, `third-process.tsx`, `[landlordId].tsx`, `review-information.tsx`, `maintenance-requests/index.tsx`, `sign-in.tsx`, `third-step.tsx`, `rentals.tsx`, `maintenance-requests/[requestId].tsx`, `reset-password.tsx`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _637 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `apartments/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.056261343012704176 - nodes in this community are weakly interconnected._
- **Should `useTheme.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07462686567164178 - nodes in this community are weakly interconnected._
- **Should `edit-profile.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10591133004926108 - nodes in this community are weakly interconnected._