# Graph Report - mobile  (2026-08-29)

## Corpus Check
- 447 files · ~637,567 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1988 nodes · 4717 edges · 163 communities (94 shown, 69 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a8125767`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- apartments/index.ts
- ScreenWrapper.tsx
- edit-profile.tsx
- reviews/index.tsx
- ProfitTrendCard.tsx
- fifth-step.tsx
- conversationService.ts
- search.tsx
- useApartmentFormStore
- ErrorDialog.tsx
- devDependencies
- expo
- expo-router
- createMobileQueryClient
- privateMediaResolver.ts
- paymentService.ts
- (tenant)/chat.tsx
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
- payment-history/[paymentId].tsx
- landlordService.ts
- useTheme.ts
- tenant-applications/index.tsx
- useColors
- upload-id.tsx
- live-capture.tsx
- useTenancy
- units.tsx
- useFrameQualityCheck.ts
- useConversations.test.tsx
- auth/index.ts
- second-step.tsx
- NotificationScreen.tsx
- history/index.tsx
- payment/index.tsx
- edit-main.tsx
- audit-fix.characterization.test.ts
- conversationService.test.ts
- useLandlordActionBadges
- app/_layout.tsx
- useNotificationPreferences.test.tsx
- useTenancyRealtime.ts
- document-id/index.tsx
- pending.tsx
- visit-requests/index.tsx
- useChat.ts
- review-information.tsx
- useLandlordVisitRequests
- rentals.tsx
- dependencies
- RescheduleSheet.tsx
- useApplicationFormStore.ts
- chatService.pagination.test.ts
- useInAppNotificationBanner.tsx
- onboarding.tsx
- visitRequests/index.ts
- ChatBubble.tsx
- maintenance-requests/index.tsx
- useTenancyRealtime.test.ts
- expo-linking
- useLandlordPayments.ts
- captureSequences.ts
- useProfile
- TabBar.tsx
- live-capture.test.tsx
- applications/index.ts
- upload-id.test.tsx
- sign-in.tsx
- upload.tsx
- third-process.tsx
- applications/[applicationId].tsx
- useNotificationRealtime.ts
- ReceiptCard.tsx
- metro.config.js
- Welcome to your Expo app 👋
- playground.tsx
- uniwind-types.d.ts
- ReviewField.tsx
- StatusPill.tsx
- eslint.config.js
- TenantApplicationCard.tsx
- expo-crypto
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
- queryClient.ts
- expo-camera
- useVisitRequest.ts
- react-native-maps
- react-native-svg-transformer
- @repo/supabase

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
- `CaptureStepSummary()` --calls--> `useColors()`  [EXTRACTED]
  app/(auth)/verify-account/upload-id.tsx → hooks/useTheme.ts
- `ThirdProcess()` --calls--> `useApplicationFormStore`  [EXTRACTED]
  app/apartment/[apartmentId]/apply/third-process.tsx → stores/useApplicationFormStore.ts
- `Upload()` --calls--> `useColors()`  [EXTRACTED]
  app/document-id/upload.tsx → hooks/useTheme.ts
- `AnalyticsScreen()` --calls--> `useColors()`  [EXTRACTED]
  app/landlord/analytics.tsx → hooks/useTheme.ts
- `EditPerks()` --calls--> `useColors()`  [EXTRACTED]
  app/landlord/manage-apartment/[apartmentId]/description/edit-perks.tsx → hooks/useTheme.ts

## Import Cycles
- 2-file cycle: `hooks/applications/index.ts -> service/applications/tenantApplicationsService.ts -> hooks/applications/index.ts`
- 2-file cycle: `hooks/applications/index.ts -> hooks/applications/useApplicationActions.ts -> hooks/applications/index.ts`
- 3-file cycle: `hooks/applications/index.ts -> hooks/applications/useTenantApplications.ts -> service/applications/tenantApplicationsService.ts -> hooks/applications/index.ts`
- 3-file cycle: `hooks/payments/index.ts -> hooks/payments/usePayments.ts -> service/payments/paymentService.ts -> hooks/payments/index.ts`

## Communities (163 total, 69 thin omitted)

### Community 0 - "apartments/index.ts"
Cohesion: 0.05
Nodes (44): ApartmentSummary(), ApartmentSkeleton(), IconButton(), IconButtonProps, IconComponent, ApartmentDescriptionSection(), ApartmentDescriptionSectionProps, ApartmentDetailsSection() (+36 more)

### Community 1 - "ScreenWrapper.tsx"
Cohesion: 0.07
Nodes (28): RateApartmentSkeleton(), ErrorDialogState, FormErrors, TenancyLeasePeriod, DOCUMENT_TYPE_ICONS, AnalyticsScreen(), MAX_AMOUNT, monthlyData (+20 more)

### Community 2 - "edit-profile.tsx"
Cohesion: 0.22
Nodes (10): EditProfile(), EditProfileForm, EMPTY_FORM, FormErrors, SuccessDialog(), SuccessDialogProps, BUCKET_MAP, UploadTarget (+2 more)

### Community 3 - "reviews/index.tsx"
Cohesion: 0.05
Nodes (53): RatingBarCount(), RatingBarCountProps, ApartmentScreen(), RateApartment(), RatingsPage(), ReviewsPage(), SORT_OPTIONS, PublicLandlordProfile() (+45 more)

### Community 4 - "ProfitTrendCard.tsx"
Cohesion: 0.08
Nodes (29): chartLabel(), ProfitByPropertyCard(), ProfitByPropertyCardProps, BUILDERS, ChartDatum, FilterOption, filterOptions, ProfitTrendCard() (+21 more)

### Community 5 - "fifth-step.tsx"
Cohesion: 0.13
Nodes (14): PerksSectionProps, DEFAULT_COORDS, MAP_STYLE, EditPerks(), BasePerkButtonProps, PerkButton(), PerkButtonProps, Divider() (+6 more)

### Community 6 - "conversationService.ts"
Cohesion: 0.23
Nodes (14): Chat(), Chat(), getConversationsQueryKey(), NewChatRow, useConversations(), getConversations(), getConversationsV2(), toMessageType() (+6 more)

### Community 7 - "search.tsx"
Cohesion: 0.06
Nodes (50): ApartmentsList(), ApartmentsListProps, DEFAULT_FILTERS, FilterBottomSheet(), FilterState, Props, ROOM_OPTS, SearchFiltersBar() (+42 more)

### Community 8 - "useApartmentFormStore"
Cohesion: 0.15
Nodes (17): Amenities(), FifthStep(), FourthStep(), FormErrors, Index(), DEFAULT_COORDS, MAP_STYLE, MapPin() (+9 more)

### Community 9 - "ErrorDialog.tsx"
Cohesion: 0.12
Nodes (19): AuthCompleteProfile(), ProfileForm, requiredFields, CompleteProfile(), ProfileForm, requiredFields, OTPVerification(), OTPVerification() (+11 more)

### Community 10 - "devDependencies"
Cohesion: 0.05
Nodes (42): eslint, eslint-config-expo, eslint-import-resolver-typescript, expo-doctor, fast-check, jest, jest-expo, metro-minify-terser (+34 more)

### Community 11 - "expo"
Cohesion: 0.05
Nodes (39): backgroundColor, foregroundImage, adaptiveIcon, googleServicesFile, package, permissions, predictiveBackGestureEnabled, softwareKeyboardLayoutMode (+31 more)

### Community 12 - "expo-router"
Cohesion: 0.04
Nodes (8): AIHeaderProps, DashboardSkeleton(), Add(), PAYMENT_METHOD_TYPES, PaymentMethodType, IMAGES, PAYMENT_METHOD_LOGOS, expo-router

### Community 13 - "createMobileQueryClient"
Cohesion: 0.16
Nodes (12): createWrapper(), mockFetchApartmentDetails, mockFetchReviewsPreview, createWrapper(), mockFetchTenantApplications, mockUseCurrentUser, createWrapper(), mockChannel (+4 more)

### Community 14 - "privateMediaResolver.ts"
Cohesion: 0.12
Nodes (27): DocEntry, ResolvedDoc, DocumentEntriesProps, mockResolvePrivateMediaUrls, cacheKey(), chatMediaRetryKeys, claimChatMediaRetry(), clearPrivateMediaUrlCache() (+19 more)

### Community 15 - "paymentService.ts"
Cohesion: 0.17
Nodes (17): getPaymentByReferenceQueryKey(), getPaymentQueryKey(), getPaymentsQueryKey(), usePaymentByReference(), usePayments(), CreateCashPaymentParams, fetchPaymentById(), fetchPaymentByReferenceId() (+9 more)

### Community 16 - "(tenant)/chat.tsx"
Cohesion: 0.19
Nodes (11): getLastMessageDisplay(), MessageCard(), MessageCardProps, getLogoSource(), maskMobileNumber(), PaymentMethod, PaymentMethodCard(), PaymentMethodCardProps (+3 more)

### Community 17 - "ai-search.tsx"
Cohesion: 0.10
Nodes (18): AISearchScreen(), SUGGESTION_CHIPS, AIHeader(), EmptyChatState(), MessageBubble(), MessageBubbleProps, MessageComposer(), MessageComposerProps (+10 more)

### Community 18 - "usePersonalizationStore.ts"
Cohesion: 0.13
Nodes (20): CityCheckBox(), CityCheckBoxProps, PersonalizationProgress(), Props, PersonalizationRadioButton(), PersonalizationRadioButtonProps, StepFive(), StepFour() (+12 more)

### Community 19 - "notificationService.ts"
Cohesion: 0.19
Nodes (14): GENERAL_TOGGLES, GeneralToggleKey, NOTIFICATION_TYPE_LABELS, getNotificationPreferencesQueryKey(), useNotificationPreferences(), DEFAULT_NOTIFICATION_PREFERENCES, deletePushToken(), fetchNotificationPreferences() (+6 more)

### Community 20 - "useVerificationStore"
Cohesion: 0.15
Nodes (17): getCaptureSequence(), SelectId(), SelfiePrep(), Success(), UploadSelfie(), StepProgress(), StepProgressProps, useVerificationStore (+9 more)

### Community 21 - "chatService.ts"
Cohesion: 0.17
Nodes (18): AttachmentUploadFailure, buildOlderThanChatMessageFilter(), ChatMessagePage, EXTENSION_BY_MIME_TYPE, fetchMessagePage(), fetchMessages(), generateId(), getChatAttachmentSignedUrls() (+10 more)

### Community 22 - "[conversationId].tsx"
Cohesion: 0.12
Nodes (17): ATTACHMENT_OPTIONS, ChatBox(), ChatBoxProps, StagedAsset, ChatEmptyState(), ChatEmptyStateProps, ChatHeader(), ChatHeaderProps (+9 more)

### Community 23 - "useNotifications.ts"
Cohesion: 0.26
Nodes (13): NotificationBellButton(), NotificationBellButtonProps, useNotificationActions(), useNotificationRealtime(), getErrorMessage(), getNotificationsQueryKey(), getUnreadNotificationsQueryKey(), useNotifications() (+5 more)

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
Cohesion: 0.11
Nodes (20): CardInformation, CardPaymentForm(), CardPaymentFormProps, CashPaymentErrors, CashPaymentForm(), CashPaymentFormProps, PaymentMethodButton(), PaymentMethodButtonProps (+12 more)

### Community 28 - "payment-history/[paymentId].tsx"
Cohesion: 0.38
Nodes (12): PaymentHistoryCard(), PaymentHistoryCardProps, LandlordPaymentReceipt(), ReceiptCard(), toHistoryItem(), PaymentReceipt(), Success(), usePayment() (+4 more)

### Community 29 - "landlordService.ts"
Cohesion: 0.09
Nodes (28): Index(), getLandlordUnitsQueryKey(), useLandlordUnits(), useLandlordStats(), useLandlordTenancy(), DB_TO_DISPLAY_STATUS, DbStatus, DISPLAY_TO_DB_STATUS (+20 more)

### Community 30 - "useTheme.ts"
Cohesion: 0.15
Nodes (15): TODO: Implement function to handle report landlord, TODO: Implement function to handle report tenant, CompleteProfileCard(), CompleteProfileCardProps, ProfileHeader(), ProfileHeaderProps, AccountStatus, StatusConfig (+7 more)

### Community 31 - "tenant-applications/index.tsx"
Cohesion: 0.18
Nodes (10): ApplicationFilters, ApplicationFilterSheet(), LOCATION_OPTIONS, Props, STATUS_OPTIONS, EmptyApplications(), EmptySearchResults(), TenantApplicationCardSkeleton() (+2 more)

### Community 32 - "useColors"
Cohesion: 0.06
Nodes (35): Index(), ResetPassword(), Failed(), SelectDocument(), MaintenanceRequestCard(), MaintenanceRequestCardProps, PropertyActionMenu(), Props (+27 more)

### Community 33 - "upload-id.tsx"
Cohesion: 0.22
Nodes (13): CaptureStepConfig, CaptureStepSummary(), CaptureStepSummaryProps, UploadId(), CaptureProgress, computeCanContinue(), getCaptureProgress(), IdCaptureResult (+5 more)

### Community 34 - "live-capture.tsx"
Cohesion: 0.16
Nodes (10): getNextCaptureStep(), CapturedPhoto, LiveCapture(), ScreenState, computeFillRatio(), computeGuidedFrameRect(), GuidedFrameOverlay(), GuidedFrameOverlayProps (+2 more)

### Community 35 - "useTenancy"
Cohesion: 0.30
Nodes (10): getErrorMessage(), getRecordString(), getTenancyQueryKey(), useTenancy(), CurrentTenancy, fetchTenancy(), TenancyApartment, TenancyLandlord (+2 more)

### Community 36 - "units.tsx"
Cohesion: 0.10
Nodes (18): QuickActionButton(), QuickActionButtonProps, EmptyProperties(), Props, PropertyCard(), PropertyCardProps, PropertyCardSkeleton(), PropertyFilterSheet() (+10 more)

### Community 37 - "useFrameQualityCheck.ts"
Cohesion: 0.18
Nodes (13): GuidedFrameRect, CameraPermissionState, useCameraPermission(), UseCameraPermissionResult, evaluateBlurHeuristic(), evaluateGlareHeuristic(), FrameQualityCheckOptions, FrameQualityReason (+5 more)

### Community 38 - "useConversations.test.tsx"
Cohesion: 0.22
Nodes (7): createWrapper(), mockChannelFn, mockFetchConversations, mockGetChannels, mockRemoveChannel, mockUseCurrentUser, seedConversations

### Community 39 - "auth/index.ts"
Cohesion: 0.49
Nodes (6): useCurrentUser(), useCurrentUserId(), getCurrentUser(), getUserProfileByColumn(), getUserProfileById(), UserProfile

### Community 40 - "second-step.tsx"
Cohesion: 0.18
Nodes (13): plugins, DEFAULT_COORDS, DEFAULT_ROOM_LIMITS, formatLimitMessage(), formatRange(), FormErrors, isZeroRange(), MAP_STYLE (+5 more)

### Community 41 - "NotificationScreen.tsx"
Cohesion: 0.20
Nodes (7): NotificationCardType, NotificationCardSkeleton(), NotificationFilter, NotificationList(), NotificationListProps, NotificationScreen(), NotificationScreenProps

### Community 42 - "history/index.tsx"
Cohesion: 0.18
Nodes (12): EMPTY_FILTERS, FlatPayment, PaymentHistoryScreen(), toFlatPayment(), PaymentHistoryFilters, PaymentHistoryFilterSheet(), PaymentSort, Props (+4 more)

### Community 43 - "payment/index.tsx"
Cohesion: 0.19
Nodes (14): validateCashPayment(), PaymentFooter(), PaymentFooterProps, PaymentSummaryCard(), PaymentSummaryCardProps, formatLeaseDate(), INITIAL_CARD, PaymentCheckout() (+6 more)

### Community 44 - "edit-main.tsx"
Cohesion: 0.21
Nodes (13): ApartmentInformation, DisplayImage, EditMain(), validateForm(), ApartmentMainFields, deleteStorageImage(), ExistingImage, PendingImage (+5 more)

### Community 45 - "audit-fix.characterization.test.ts"
Cohesion: 0.12
Nodes (10): ChatRow, mockChannel, mockChatRows, mockCreateSignedUrls, mockFrom, mockGetUser, mockRemoveChannel, mockStorageFrom (+2 more)

### Community 46 - "conversationService.test.ts"
Cohesion: 0.33
Nodes (6): Conversation, createQuery(), mockFrom, mockLegacyQueries(), mockRpc, seedV2Conversations

### Community 47 - "useLandlordActionBadges"
Cohesion: 0.22
Nodes (10): MaintenanceRequests(), Units(), EMPTY_COUNTS, getLandlordBadgesQueryKey(), useLandlordActionBadges(), ActionBadgeCategory, ActionBadgeCounts, fetchLandlordApartmentIds() (+2 more)

### Community 48 - "app/_layout.tsx"
Cohesion: 0.15
Nodes (13): NotificationManager(), RootLayout(), ThemeInitializer(), Index(), DevBadge(), useInAppNotificationBanner(), useNotificationTapHandler(), usePushRegistration() (+5 more)

### Community 49 - "useNotificationPreferences.test.tsx"
Cohesion: 0.40
Nodes (4): createWrapper(), mockFetchNotificationPreferences, mockUpdateNotificationPreferences, mockUseCurrentUser

### Community 50 - "useTenancyRealtime.ts"
Cohesion: 0.24
Nodes (13): attachPaymentChannel(), attachSubscriber(), attachTenantChannel(), Channel, createRefSubscriber(), detachSubscriber(), getRecordString(), paymentChannels (+5 more)

### Community 51 - "document-id/index.tsx"
Cohesion: 0.23
Nodes (11): DocumentCard(), DocumentCardProps, Index(), TODO: Implement contact support functionality,, TODO: Fetch and display user's uploaded documents and IDs here. This may…, UploadedDocument, DOCUMENT_EXTENSIONS, getExtension() (+3 more)

### Community 52 - "pending.tsx"
Cohesion: 0.22
Nodes (10): EmptyPending(), DATE_RANGE_OPTIONS, DateRange, Props, STATUS_OPTIONS, VisitRequestFilters, VisitRequestFilterSheet(), EMPTY_FILTERS (+2 more)

### Community 53 - "visit-requests/index.tsx"
Cohesion: 0.18
Nodes (10): EmptyApproved(), VisitRequestCalendar(), VisitRequestCalendarProps, VisitRequestCardSkeleton(), getGroup(), Group, GROUP_ORDER, GroupedItem (+2 more)

### Community 54 - "useChat.ts"
Cohesion: 0.11
Nodes (23): Options, useChat(), BroadcastEvent, BroadcastPayload, PresenceJoinEvent, PresenceLeaveEvent, PresenceState, ChannelHandler (+15 more)

### Community 55 - "review-information.tsx"
Cohesion: 0.13
Nodes (17): ReviewAccordionItem(), ReviewAccordionItemProps, ReviewDocumentFile(), ReviewDocumentFileProps, ReviewDocumentImage(), ReviewDocumentImageProps, FieldErrors, FirstProcess() (+9 more)

### Community 56 - "useLandlordVisitRequests"
Cohesion: 0.60
Nodes (4): getLandlordVisitRequestsQueryKey(), useLandlordVisitRequests(), fetchLandlordVisitRequests(), LandlordVisitRequest

### Community 57 - "rentals.tsx"
Cohesion: 0.06
Nodes (53): EmptyMaintenanceRequestDetail(), MaintenanceRequestCard(), MaintenanceRequestCardProps, ResolveRequestDialog(), ResolveRequestDialogProps, MaintenanceRequestDetails(), ApartmentDescriptionCard(), ApartmentDescriptionCardProps (+45 more)

### Community 58 - "dependencies"
Cohesion: 0.12
Nodes (17): emoji-regex-xs, expo, expo-dev-client, heroui-native, dependencies, emoji-regex-xs, expo, expo-dev-client (+9 more)

### Community 59 - "RescheduleSheet.tsx"
Cohesion: 0.18
Nodes (10): Period, Props, RescheduleSheet(), tomorrow, toSupabaseTime(), HOURS, Period, PERIODS (+2 more)

### Community 60 - "useApplicationFormStore.ts"
Cohesion: 0.12
Nodes (17): DocKey, getContentType(), MIME_MAP, SubmitArgs, SubmitResult, uploadDoc(), ApartmentContext, ApplicationFormState (+9 more)

### Community 61 - "chatService.pagination.test.ts"
Cohesion: 0.20
Nodes (6): ChatRow, mockFrom, mockStorageFrom, pageResponses, QueryLog, queryLogs

### Community 62 - "useInAppNotificationBanner.tsx"
Cohesion: 0.28
Nodes (6): getOpenChatConversationKey(), shouldSuppressChatToast(), buildNotificationDeepLink(), NotificationData, parseConversationKey(), Role

### Community 63 - "onboarding.tsx"
Cohesion: 0.21
Nodes (7): { width }, OnBoardingSlide(), OnBoardingSlideProps, Slide, SLIDES, USER_ROLES, UserRole

### Community 64 - "visitRequests/index.ts"
Cohesion: 0.23
Nodes (11): VisitRequestCard(), VisitRequestCardProps, VisitRequestDetails(), Props, VisitRequestHistoryItem(), ActionStatus, useVisitRequestActions(), FALLBACK_STYLE() (+3 more)

### Community 65 - "ChatBubble.tsx"
Cohesion: 0.27
Nodes (8): calculateImageSize(), ChatBubble(), ChatBubbleProps, mockPlayer, VideoBubble(), VisualMediaBubble(), isEmojiOnly(), MessageType

### Community 66 - "maintenance-requests/index.tsx"
Cohesion: 0.21
Nodes (9): EmptyMaintenanceRequestsList(), MaintenanceRequestCardSkeleton(), LOCATION_OPTIONS, MaintenanceRequestFilters, MaintenanceRequestFilterSheet(), Props, STATUS_OPTIONS, URGENCY_OPTIONS (+1 more)

### Community 67 - "useTenancyRealtime.test.ts"
Cohesion: 0.20
Nodes (7): MockChannel, mockChannelFactory, MockChannelHandler, mockChannelsByName, MockPayload, MockPostgresFilter, mockRemoveChannel

### Community 69 - "useLandlordPayments.ts"
Cohesion: 0.24
Nodes (10): getLandlordPaymentsQueryKey(), useLandlordPaymentConfirmation(), useLandlordPayments(), getLandlordTenancyQueryKey(), fetchLandlordPayments(), LandlordPaymentRecord, mockFrom, QueryResult (+2 more)

### Community 70 - "captureSequences.ts"
Cohesion: 0.24
Nodes (8): ALL_SUPPORTED_ID_TYPES, CaptureCameraFacing, CaptureGuideShape, CARD_SEQUENCE, PASSPORT_SEQUENCE, SELFIE_STEP, SEQUENCE_BY_ID_TYPE, NON_PASSPORT_ID_TYPES

### Community 72 - "useProfile"
Cohesion: 0.32
Nodes (6): Index(), TabsLayout(), RequestVisit(), useProfile(), useSubmitVisitRequest(), VisitRequestPayload

### Community 73 - "TabBar.tsx"
Cohesion: 0.31
Nodes (6): TabBar(), TabBarIcon(), TabBarIconProps, IconProps, LANDLORDICONS, TENANTICONS

### Community 74 - "live-capture.test.tsx"
Cohesion: 0.25
Nodes (8): captureAndReachReview(), DEFAULT_QUALITY_RESULT, mockBack, mockDismissTo, mockReplace, mockSearchParams, mockTakePictureAsync, setPermission()

### Community 75 - "applications/index.ts"
Cohesion: 0.06
Nodes (44): getStatusStyle(), TenantApplicationDetails(), EmptyApplicationData(), TenantApplicationDetailsSkeleton(), ApplicationsList(), ApplicationsEmptyState(), ApplicationStatusCard(), Props (+36 more)

### Community 77 - "upload-id.test.tsx"
Cohesion: 0.25
Nodes (7): BACK_CAPTURE, FRONT_CAPTURE, mockBack, mockPush, mockReplace, mockUseFocusEffect, SELFIE_CAPTURE

### Community 78 - "sign-in.tsx"
Cohesion: 0.21
Nodes (12): AuthButton(), AuthButtonProps, AuthDivider(), AuthDividerProps, RoleTab(), RoleTabProps, SignIn(), SignUp() (+4 more)

### Community 79 - "upload.tsx"
Cohesion: 0.23
Nodes (10): TODO: Persist the uploaded document to Supabase Storage and store its, Upload(), ACCEPTED_FILE_TYPES, UploadDocumentField(), UploadDocumentFieldProps, UploadedDocument, UploadImageField(), UploadImageFieldProps (+2 more)

### Community 80 - "third-process.tsx"
Cohesion: 0.24
Nodes (6): FormErrors, ThirdProcess(), FieldErrors, ThirdStep(), UploadFileField(), UploadFileFieldProps

### Community 82 - "applications/[applicationId].tsx"
Cohesion: 0.19
Nodes (6): ApplicationApartment(), Props, VisitRequest, VisitRequestCard(), useCancelApplication(), useRespondToReschedule()

### Community 83 - "useNotificationRealtime.ts"
Cohesion: 0.19
Nodes (12): MOCK_TOASTS, MockRow, MockToast, NotificationToastDevScreen(), showNotificationToast(), attach(), ChannelEntry, detach() (+4 more)

### Community 84 - "ReceiptCard.tsx"
Cohesion: 0.18
Nodes (10): ReceiptCardProps, STATUS_META, ZigzagEdge(), ZigzagEdgeProps, PaymentHistoryCard(), PaymentHistoryCardProps, PaymentHistoryItem, PaymentStatus (+2 more)

### Community 86 - "metro.config.js"
Cohesion: 0.33
Nodes (5): config, { getDefaultConfig }, monorepoRoot, path, { withUniwindConfig }

### Community 87 - "Welcome to your Expo app 👋"
Cohesion: 0.33
Nodes (5): Get a fresh project, Get started, Join the community, Learn more, Welcome to your Expo app 👋

### Community 89 - "uniwind-types.d.ts"
Cohesion: 0.50
Nodes (3): NOTE: This file is generated by uniwind and it should not be edited manually., uniwind, UniwindConfig

### Community 98 - "TenantApplicationCard.tsx"
Cohesion: 0.40
Nodes (5): getInitials(), STATUS_STYLES, TenantApplicationCard(), TenantApplicationCardProps, TenantApplicationStatus

### Community 165 - "queryClient.ts"
Cohesion: 0.16
Nodes (13): QueryProvider(), QueryProviderProps, createWrapper(), mockFrom, mockGetUser, profileRecord, CURRENT_USER_QUERY_KEY, queryClient (+5 more)

### Community 167 - "useVisitRequest.ts"
Cohesion: 0.48
Nodes (5): getVisitRequestQueryKey(), useVisitRequest(), fetchVisitRequest(), VisitRequest, VisitRequestResult

## Knowledge Gaps
- **636 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+631 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **69 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useColors()` connect `useColors` to `apartments/index.ts`, `ScreenWrapper.tsx`, `edit-profile.tsx`, `reviews/index.tsx`, `ProfitTrendCard.tsx`, `fifth-step.tsx`, `conversationService.ts`, `search.tsx`, `useApartmentFormStore`, `ErrorDialog.tsx`, `expo-router`, `(tenant)/chat.tsx`, `ai-search.tsx`, `usePersonalizationStore.ts`, `notificationService.ts`, `useVerificationStore`, `[conversationId].tsx`, `useNotifications.ts`, `notifications/index.ts`, `PaymentMethodSelector.tsx`, `payment-history/[paymentId].tsx`, `landlordService.ts`, `useTheme.ts`, `tenant-applications/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `units.tsx`, `second-step.tsx`, `history/index.tsx`, `payment/index.tsx`, `useLandlordActionBadges`, `app/_layout.tsx`, `document-id/index.tsx`, `pending.tsx`, `visit-requests/index.tsx`, `review-information.tsx`, `rentals.tsx`, `RescheduleSheet.tsx`, `visitRequests/index.ts`, `ChatBubble.tsx`, `maintenance-requests/index.tsx`, `useProfile`, `TabBar.tsx`, `applications/index.ts`, `sign-in.tsx`, `upload.tsx`, `third-process.tsx`, `applications/[applicationId].tsx`, `ReceiptCard.tsx`?**
  _High betweenness centrality (0.213) - this node is a cross-community bridge._
- **Why does `expo-router` connect `expo-router` to `apartments/index.ts`, `ScreenWrapper.tsx`, `reviews/index.tsx`, `fifth-step.tsx`, `search.tsx`, `useApartmentFormStore`, `ErrorDialog.tsx`, `(tenant)/chat.tsx`, `usePersonalizationStore.ts`, `useVerificationStore`, `[conversationId].tsx`, `useNotifications.ts`, `paymongoService.ts`, `payment-history/[paymentId].tsx`, `useTheme.ts`, `tenant-applications/index.tsx`, `useColors`, `upload-id.tsx`, `live-capture.tsx`, `units.tsx`, `useFrameQualityCheck.ts`, `second-step.tsx`, `NotificationScreen.tsx`, `history/index.tsx`, `payment/index.tsx`, `edit-main.tsx`, `app/_layout.tsx`, `document-id/index.tsx`, `pending.tsx`, `visit-requests/index.tsx`, `review-information.tsx`, `rentals.tsx`, `useInAppNotificationBanner.tsx`, `onboarding.tsx`, `maintenance-requests/index.tsx`, `useProfile`, `applications/index.ts`, `sign-in.tsx`, `upload.tsx`, `third-process.tsx`, `applications/[applicationId].tsx`, `ReceiptCard.tsx`, `playground.tsx`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **Why does `ScreenWrapper` connect `ScreenWrapper.tsx` to `apartments/index.ts`, `edit-profile.tsx`, `reviews/index.tsx`, `fifth-step.tsx`, `search.tsx`, `useApartmentFormStore`, `ErrorDialog.tsx`, `expo-router`, `(tenant)/chat.tsx`, `ai-search.tsx`, `usePersonalizationStore.ts`, `notificationService.ts`, `useVerificationStore`, `[conversationId].tsx`, `useTheme.ts`, `tenant-applications/index.tsx`, `useColors`, `upload-id.tsx`, `live-capture.tsx`, `units.tsx`, `second-step.tsx`, `NotificationScreen.tsx`, `history/index.tsx`, `payment/index.tsx`, `edit-main.tsx`, `document-id/index.tsx`, `pending.tsx`, `visit-requests/index.tsx`, `review-information.tsx`, `rentals.tsx`, `maintenance-requests/index.tsx`, `applications/index.ts`, `sign-in.tsx`, `upload.tsx`, `third-process.tsx`, `applications/[applicationId].tsx`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _636 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `apartments/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.050595238095238096 - nodes in this community are weakly interconnected._
- **Should `ScreenWrapper.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07086197778952935 - nodes in this community are weakly interconnected._
- **Should `reviews/index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05432595573440644 - nodes in this community are weakly interconnected._