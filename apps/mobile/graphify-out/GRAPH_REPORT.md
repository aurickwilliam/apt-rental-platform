# Graph Report - mobile  (2026-08-23)

## Corpus Check
- 447 files · ~636,217 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2001 nodes · 4752 edges · 162 communities (92 shown, 70 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.61)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f879d7b1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- apartment/[apartmentId]/index.tsx
- ScreenWrapper.tsx
- useTheme.ts
- ratings/index.ts
- dashboard.tsx
- edit-profile.tsx
- conversationService.ts
- useFavorites
- fifth-step.tsx
- ScreenWrapper
- devDependencies
- expo
- expo-router
- review-information.tsx
- privateMediaResolver.ts
- paymentService.ts
- (tenant)/chat.tsx
- ai-search.tsx
- usePersonalizationStore.ts
- notifications/index.ts
- useVerificationStore
- chatService.ts
- [conversationId].tsx
- NotificationScreen.tsx
- [destinationId].tsx
- paths
- NotificationToast.tsx
- PaymentMethodSelector.tsx
- apartments/index.ts
- landlordService.ts
- current-apartment.tsx
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
- maintenanceService.ts
- payments/index.ts
- payment/index.tsx
- CustomTabBar.tsx
- audit-fix.characterization.test.ts
- useApplicationActions.test.tsx
- visit-requests/index.tsx
- useLandlordMaintenanceRequests.ts
- applications/index.ts
- useTenancyRealtime.ts
- DocumentCard.tsx
- maintenance-requests/index.tsx
- useTenancy
- useChat.ts
- chatService.pagination.test.ts
- sign-in.tsx
- maintenance-requests/index.ts
- pending.tsx
- request-visit.tsx
- useApplicationFormStore.ts
- auth/index.ts
- useInAppNotificationBanner.tsx
- onboarding.tsx
- visitRequests/index.ts
- ChatBubble.tsx
- useLandlordActionBadges
- DateField.tsx
- applications/[applicationId].tsx
- payment-history.tsx
- captureSequences.ts
- useSubmitApplication.ts
- TenantApplicationCard.tsx
- TabBar.tsx
- live-capture.test.tsx
- tenantApplicationsService.test.ts
- reset-password.tsx
- upload-id.test.tsx
- tenant-applications/[applicationId].tsx
- useNotificationRealtime.ts
- useVisitRequest.ts
- maintenance-requests/[requestId].tsx
- useLandlordUnits.ts
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

## God Nodes (most connected - your core abstractions)
1. `useColors()` - 324 edges
2. `expo-router` - 133 edges
3. `ScreenWrapper` - 103 edges
4. `StandardHeader()` - 55 edges
5. `useCurrentUser()` - 48 edges
6. `useProfile()` - 44 edges
7. `useApartmentDetails()` - 23 edges
8. `useTenancy()` - 20 edges
9. `resolvePrivateMediaUrls()` - 20 edges
10. `createMobileQueryClient()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `CaptureStepSummary()` --calls--> `useColors()`  [EXTRACTED]
  app/(auth)/verify-account/upload-id.tsx → hooks/useTheme.ts
- `LandlordTabLayout()` --calls--> `useColors()`  [EXTRACTED]
  app/(tabs)/(landlord)/_layout.tsx → hooks/useTheme.ts
- `TenantTabLayout()` --calls--> `useColors()`  [EXTRACTED]
  app/(tabs)/(tenant)/_layout.tsx → hooks/useTheme.ts
- `SecondProcess()` --calls--> `useApplicationFormStore`  [EXTRACTED]
  app/apartment/[apartmentId]/apply/second-process.tsx → stores/useApplicationFormStore.ts
- `Upload()` --calls--> `useColors()`  [EXTRACTED]
  app/document-id/upload.tsx → hooks/useTheme.ts

## Import Cycles
- 2-file cycle: `hooks/applications/index.ts -> hooks/applications/useApplicationActions.ts -> hooks/applications/index.ts`
- 2-file cycle: `hooks/applications/index.ts -> service/applications/tenantApplicationsService.ts -> hooks/applications/index.ts`
- 3-file cycle: `hooks/payments/index.ts -> hooks/payments/usePayments.ts -> service/payments/paymentService.ts -> hooks/payments/index.ts`
- 3-file cycle: `hooks/applications/index.ts -> hooks/applications/useTenantApplications.ts -> service/applications/tenantApplicationsService.ts -> hooks/applications/index.ts`

## Communities (162 total, 70 thin omitted)

### Community 0 - "apartment/[apartmentId]/index.tsx"
Cohesion: 0.09
Nodes (18): ApartmentSkeleton(), ApartmentDescriptionSection(), ApartmentDescriptionSectionProps, ApartmentDetailsSection(), ApartmentDetailsSectionProps, ApartmentHeroSection(), ApartmentHeroSectionProps, ApartmentImage (+10 more)

### Community 1 - "ScreenWrapper.tsx"
Cohesion: 0.08
Nodes (21): RateApartmentSkeleton(), DEFAULT_COORDS, DirectionMode, MAP_STYLE, DOCUMENT_TYPE_ICONS, AnalyticsScreen(), MAX_AMOUNT, monthlyData (+13 more)

### Community 2 - "useTheme.ts"
Cohesion: 0.13
Nodes (15): RatingBarCount(), RatingBarCountProps, SORT_OPTIONS, TODO: Implement function to handle report landlord, TODO: Implement function to handle report tenant, PastApartmentCard(), PastApartmentCardProps, ProfileStat (+7 more)

### Community 3 - "ratings/index.ts"
Cohesion: 0.08
Nodes (39): ApartmentScreen(), RatingsPage(), ReviewsPage(), PublicLandlordProfile(), PublicTenantProfile(), getPublicLandlordProfileQueryKey(), usePublicLandlordProfile(), getPublicTenantProfileQueryKey() (+31 more)

### Community 4 - "dashboard.tsx"
Cohesion: 0.06
Nodes (38): DashboardSkeleton(), chartLabel(), ProfitByPropertyCard(), ProfitByPropertyCardProps, BUILDERS, ChartDatum, FilterOption, filterOptions (+30 more)

### Community 5 - "edit-profile.tsx"
Cohesion: 0.08
Nodes (36): TODO: Persist the uploaded document to Supabase Storage and store its, Upload(), EditProfile(), EditProfileForm, EMPTY_FORM, FormErrors, ApartmentInformation, DisplayImage (+28 more)

### Community 6 - "conversationService.ts"
Cohesion: 0.11
Nodes (25): Chat(), getConversationsQueryKey(), NewChatRow, createWrapper(), mockChannelFn, mockFetchConversations, mockRemoveChannel, mockUseCurrentUser (+17 more)

### Community 7 - "useFavorites"
Cohesion: 0.08
Nodes (37): ApartmentsList(), ApartmentsListProps, DEFAULT_FILTERS, FilterBottomSheet(), FilterState, Props, ROOM_OPTS, SearchFiltersBar() (+29 more)

### Community 8 - "fifth-step.tsx"
Cohesion: 0.07
Nodes (35): FormErrors, plugins, Amenities(), DEFAULT_COORDS, FifthStep(), MAP_STYLE, FormErrors, Index() (+27 more)

### Community 9 - "ScreenWrapper"
Cohesion: 0.13
Nodes (18): FieldErrors, AuthCompleteProfile(), ProfileForm, requiredFields, CompleteProfile(), ProfileForm, requiredFields, OTPVerification() (+10 more)

### Community 10 - "devDependencies"
Cohesion: 0.05
Nodes (42): eslint, eslint-config-expo, eslint-import-resolver-typescript, expo-doctor, fast-check, jest, jest-expo, metro-minify-terser (+34 more)

### Community 11 - "expo"
Cohesion: 0.05
Nodes (39): backgroundColor, foregroundImage, adaptiveIcon, googleServicesFile, package, permissions, predictiveBackGestureEnabled, softwareKeyboardLayoutMode (+31 more)

### Community 12 - "expo-router"
Cohesion: 0.04
Nodes (12): TODO: Implement contact support functionality,, TODO: Fetch and display user's uploaded documents and IDs here. This may…, UploadedDocument, AIHeaderProps, EWalletRedirect(), PAYMENT_METHOD_TYPES, PaymentMethodType, IMAGES (+4 more)

### Community 13 - "review-information.tsx"
Cohesion: 0.19
Nodes (11): ReviewAccordionItem(), ReviewAccordionItemProps, ReviewDocumentFile(), ReviewDocumentFileProps, ReviewDocumentImage(), ReviewDocumentImageProps, FirstProcess(), ReviewInformation() (+3 more)

### Community 14 - "privateMediaResolver.ts"
Cohesion: 0.11
Nodes (28): DocEntry, ResolvedDoc, DocumentEntriesProps, mockResolvePrivateMediaUrls, useDocumentUrls(), cacheKey(), chatMediaRetryKeys, claimChatMediaRetry() (+20 more)

### Community 15 - "paymentService.ts"
Cohesion: 0.12
Nodes (33): PaymentHistoryCard(), PaymentHistoryCardProps, ReceiptCard(), toHistoryItem(), PaymentReceipt(), Success(), getPaymentQueryKey(), getRefundsQueryKey() (+25 more)

### Community 16 - "(tenant)/chat.tsx"
Cohesion: 0.21
Nodes (10): getLastMessageDisplay(), MessageCard(), MessageCardProps, getLogoSource(), maskMobileNumber(), PaymentMethod, PaymentMethodCard(), PaymentMethodCardProps (+2 more)

### Community 17 - "ai-search.tsx"
Cohesion: 0.10
Nodes (18): AISearchScreen(), SUGGESTION_CHIPS, AIHeader(), EmptyChatState(), MessageBubble(), MessageBubbleProps, MessageComposer(), MessageComposerProps (+10 more)

### Community 18 - "usePersonalizationStore.ts"
Cohesion: 0.12
Nodes (20): CityCheckBox(), CityCheckBoxProps, PersonalizationProgress(), Props, PersonalizationRadioButton(), PersonalizationRadioButtonProps, StepFive(), StepFour() (+12 more)

### Community 19 - "notifications/index.ts"
Cohesion: 0.17
Nodes (18): GENERAL_TOGGLES, GeneralToggleKey, NOTIFICATION_TYPE_LABELS, getNotificationPreferencesQueryKey(), mockFetchNotificationPreferences, mockUpdateNotificationPreferences, mockUseCurrentUser, useNotificationPreferences() (+10 more)

### Community 20 - "useVerificationStore"
Cohesion: 0.15
Nodes (17): getCaptureSequence(), SelectId(), SelfiePrep(), Success(), UploadSelfie(), StepProgress(), StepProgressProps, useVerificationStore (+9 more)

### Community 21 - "chatService.ts"
Cohesion: 0.17
Nodes (18): AttachmentUploadFailure, buildOlderThanChatMessageFilter(), ChatMessagePage, EXTENSION_BY_MIME_TYPE, fetchMessagePage(), fetchMessages(), generateId(), getChatAttachmentSignedUrls() (+10 more)

### Community 22 - "[conversationId].tsx"
Cohesion: 0.12
Nodes (17): ATTACHMENT_OPTIONS, ChatBox(), ChatBoxProps, StagedAsset, ChatEmptyState(), ChatEmptyStateProps, ChatHeader(), ChatHeaderProps (+9 more)

### Community 23 - "NotificationScreen.tsx"
Cohesion: 0.15
Nodes (18): NotificationCardType, NotificationFilter, NotificationList(), NotificationListProps, NotificationScreen(), NotificationScreenProps, NotificationBellButton(), NotificationBellButtonProps (+10 more)

### Community 24 - "[destinationId].tsx"
Cohesion: 0.15
Nodes (22): FormErrors, PayoutAccountForm(), PayoutAccount(), SuccessDialog(), SuccessDialogProps, CreatePayoutDestinationParams, getPayoutDestinationsQueryKey(), UpdatePayoutDestinationParams (+14 more)

### Community 25 - "paths"
Cohesion: 0.09
Nodes (22): ./assets/*, ./components/*, ./constants/*, expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.ts, ./hooks/*, ../../packages/ui/* (+14 more)

### Community 26 - "NotificationToast.tsx"
Cohesion: 0.17
Nodes (16): MOCK_TOASTS, MockRow, MockToast, NotificationToastDevScreen(), NotificationCard(), NotificationCardProps, NotificationSettingsScreen(), NotificationToastContent() (+8 more)

### Community 27 - "PaymentMethodSelector.tsx"
Cohesion: 0.12
Nodes (17): CardInformation, CardPaymentForm(), CardPaymentFormProps, CashPaymentErrors, PaymentMethodButton(), PaymentMethodButtonProps, PaymentMethodButtonVariant, getSelectedMethod() (+9 more)

### Community 28 - "apartments/index.ts"
Cohesion: 0.18
Nodes (15): ApartmentSummary(), RatingsSectionProps, IncludedPerks(), ApartmentMapViewScreen(), SmallRatingCard(), SmallRatingCardProps, getApartmentDetailsQueryKey(), getApartmentReviewsPreviewQueryKey() (+7 more)

### Community 29 - "landlordService.ts"
Cohesion: 0.10
Nodes (21): Index(), useLandlordStats(), asNullableString(), DB_TO_DISPLAY_STATUS, DbStatus, DISPLAY_TO_DB_STATUS, fetchLandlordStats(), fetchManageApartmentDescription() (+13 more)

### Community 30 - "current-apartment.tsx"
Cohesion: 0.14
Nodes (13): PerksSection(), PerksSectionProps, FourthStep(), BasePerkButtonProps, PerkButton(), PerkButtonProps, CurrentApartmentDetails(), formatDateToMonthYear() (+5 more)

### Community 31 - "tenant-applications/index.tsx"
Cohesion: 0.20
Nodes (9): ApplicationFilters, ApplicationFilterSheet(), LOCATION_OPTIONS, Props, STATUS_OPTIONS, EmptyApplications(), EmptySearchResults(), TenantApplicationCardSkeleton() (+1 more)

### Community 32 - "useColors"
Cohesion: 0.07
Nodes (31): IconButton(), IconButtonProps, IconComponent, LandlordSection(), LandlordSectionProps, Index(), ResetPassword(), Failed() (+23 more)

### Community 33 - "upload-id.tsx"
Cohesion: 0.22
Nodes (13): CaptureStepConfig, CaptureStepSummary(), CaptureStepSummaryProps, UploadId(), CaptureProgress, computeCanContinue(), getCaptureProgress(), IdCaptureResult (+5 more)

### Community 34 - "live-capture.tsx"
Cohesion: 0.16
Nodes (10): getNextCaptureStep(), CapturedPhoto, LiveCapture(), ScreenState, computeFillRatio(), computeGuidedFrameRect(), GuidedFrameOverlay(), GuidedFrameOverlayProps (+2 more)

### Community 35 - "manage-apartment/[apartmentId]/index.tsx"
Cohesion: 0.12
Nodes (17): MaintenanceRequestCard(), MaintenanceRequestCardProps, PropertyActionMenu(), Props, ApartmentImage, PropertyOverview(), Props, PropertyOverviewSkeleton() (+9 more)

### Community 36 - "units.tsx"
Cohesion: 0.13
Nodes (14): PropertyCard(), PropertyCardProps, PropertyCardSkeleton(), PropertyFilterSheet(), PropertyFilterSheetProps, SORT_LABELS, SortOption, sortOptions (+6 more)

### Community 37 - "useFrameQualityCheck.ts"
Cohesion: 0.18
Nodes (13): GuidedFrameRect, CameraPermissionState, useCameraPermission(), UseCameraPermissionResult, evaluateBlurHeuristic(), evaluateGlareHeuristic(), FrameQualityCheckOptions, FrameQualityReason (+5 more)

### Community 38 - "dependencies"
Cohesion: 0.11
Nodes (19): expo-camera, expo-constants, expo-router, dependencies, expo-camera, expo-constants, expo-router, react-native-gesture-handler (+11 more)

### Community 39 - "app/_layout.tsx"
Cohesion: 0.15
Nodes (13): NotificationManager(), RootLayout(), ThemeInitializer(), Index(), DevBadge(), useInAppNotificationBanner(), useNotificationTapHandler(), useTheme() (+5 more)

### Community 40 - "queryClient.ts"
Cohesion: 0.06
Nodes (37): CompleteProfileCard(), CompleteProfileCardProps, ProfileHeader(), ProfileHeaderProps, AccountStatus, StatusConfig, VerificationStatus(), VerificationStatusProps (+29 more)

### Community 41 - "maintenanceService.ts"
Cohesion: 0.23
Nodes (13): MaintenanceHistory(), getMaintenanceRequestHistoryQueryKey(), useMaintenanceRequestHistory(), UseMaintenanceRequestHistoryParams, getLatestMaintenanceRequestQueryKey(), useMaintenanceRequests(), UseMaintenanceRequestsParams, cancelMaintenanceRequest() (+5 more)

### Community 42 - "payments/index.ts"
Cohesion: 0.13
Nodes (17): ReceiptCardProps, STATUS_META, ZigzagEdge(), ZigzagEdgeProps, PaymentHistoryCard(), PaymentHistoryCardProps, PaymentHistoryItem, PaymentHistoryFilters (+9 more)

### Community 43 - "payment/index.tsx"
Cohesion: 0.11
Nodes (24): validateCashPayment(), PaymentFooter(), PaymentFooterProps, PaymentSummaryCard(), PaymentSummaryCardProps, formatLeaseDate(), INITIAL_CARD, PaymentCheckout() (+16 more)

### Community 44 - "CustomTabBar.tsx"
Cohesion: 0.21
Nodes (9): CustomTabBar(), CustomTabConfig, Props, TabItemsProps, TablerIconComponent, LANDLORD_TABS, LandlordTabLayout(), TENANT_TABS (+1 more)

### Community 45 - "audit-fix.characterization.test.ts"
Cohesion: 0.12
Nodes (10): ChatRow, mockChannel, mockChatRows, mockCreateSignedUrls, mockFrom, mockGetUser, mockRemoveChannel, mockStorageFrom (+2 more)

### Community 46 - "useApplicationActions.test.tsx"
Cohesion: 0.21
Nodes (12): getStatusStyle(), TenantApplicationDetails(), createWrapper(), mockEq, mockFrom, mockUpdate, mockUseCurrentUser, useApplicationActions() (+4 more)

### Community 47 - "visit-requests/index.tsx"
Cohesion: 0.15
Nodes (14): EmptyApproved(), VisitRequestCalendar(), VisitRequestCalendarProps, getGroup(), Group, GROUP_ORDER, GroupedItem, PastToggle() (+6 more)

### Community 48 - "useLandlordMaintenanceRequests.ts"
Cohesion: 0.43
Nodes (7): getLandlordMaintenanceRequestsQueryKey(), getNextStatus(), STATUS_FLOW, useLandlordMaintenanceRequests(), fetchLandlordMaintenanceRequests(), LandlordMaintenanceRequest, updateLandlordMaintenanceStatus()

### Community 49 - "applications/index.ts"
Cohesion: 0.14
Nodes (18): ApplicationsList(), ApplicationsEmptyState(), ApplicationStatusCard(), Props, ApplicationStatusCardSkeleton(), ApplicationStatus, ApplicationStatusStyle, ChipColor (+10 more)

### Community 50 - "useTenancyRealtime.ts"
Cohesion: 0.12
Nodes (20): attachPaymentChannel(), attachSubscriber(), attachTenantChannel(), Channel, createRefSubscriber(), detachSubscriber(), getRecordString(), paymentChannels (+12 more)

### Community 51 - "DocumentCard.tsx"
Cohesion: 0.33
Nodes (7): DocumentCard(), DocumentCardProps, Index(), DOCUMENT_EXTENSIONS, getExtension(), IMAGE_EXTENSIONS, isImageUri()

### Community 52 - "maintenance-requests/index.tsx"
Cohesion: 0.19
Nodes (10): EmptyMaintenanceRequestsList(), MaintenanceRequestCardSkeleton(), LOCATION_OPTIONS, MaintenanceRequestFilters, MaintenanceRequestFilterSheet(), Props, STATUS_OPTIONS, URGENCY_OPTIONS (+2 more)

### Community 53 - "useTenancy"
Cohesion: 0.24
Nodes (12): Chat(), History(), getErrorMessage(), getRecordString(), getTenancyQueryKey(), useTenancy(), CurrentTenancy, fetchTenancy() (+4 more)

### Community 54 - "useChat.ts"
Cohesion: 0.11
Nodes (23): Options, useChat(), BroadcastEvent, BroadcastPayload, PresenceJoinEvent, PresenceLeaveEvent, PresenceState, ChannelHandler (+15 more)

### Community 55 - "chatService.pagination.test.ts"
Cohesion: 0.20
Nodes (6): ChatRow, mockFrom, mockStorageFrom, pageResponses, QueryLog, queryLogs

### Community 56 - "sign-in.tsx"
Cohesion: 0.26
Nodes (9): AuthButton(), AuthButtonProps, AuthDivider(), AuthDividerProps, RoleTab(), RoleTabProps, SignIn(), SignUp() (+1 more)

### Community 57 - "maintenance-requests/index.ts"
Cohesion: 0.18
Nodes (16): MaintenanceRequestCard(), MaintenanceRequestCardProps, MaintenanceRequestDetails(), MaintenanceRequestCard(), MaintenanceRequestCardProps, MaintenanceDetails(), RequestMaintenance(), StatusStyle (+8 more)

### Community 58 - "pending.tsx"
Cohesion: 0.19
Nodes (11): EmptyPending(), VisitRequestCardSkeleton(), DATE_RANGE_OPTIONS, DateRange, Props, STATUS_OPTIONS, VisitRequestFilters, VisitRequestFilterSheet() (+3 more)

### Community 59 - "request-visit.tsx"
Cohesion: 0.13
Nodes (14): Period, Props, RescheduleSheet(), tomorrow, toSupabaseTime(), RequestVisit(), Props, QuantityField() (+6 more)

### Community 60 - "useApplicationFormStore.ts"
Cohesion: 0.18
Nodes (10): ApartmentContext, ApplicationFormState, initialApartmentContext, initialDocuments, initialRentalPreferences, initialTenantInformation, initialUploadedPaths, RentalPreferences (+2 more)

### Community 61 - "auth/index.ts"
Cohesion: 0.18
Nodes (14): RateApartment(), TabsLayout(), UseCountdownOptions, useCurrentUser(), useCurrentUserId(), useProfile(), SubmitReviewParams, SubmitReviewResult (+6 more)

### Community 62 - "useInAppNotificationBanner.tsx"
Cohesion: 0.30
Nodes (6): getOpenChatConversationKey(), shouldSuppressChatToast(), buildNotificationDeepLink(), NotificationData, parseConversationKey(), Role

### Community 63 - "onboarding.tsx"
Cohesion: 0.21
Nodes (7): { width }, OnBoardingSlide(), OnBoardingSlideProps, Slide, SLIDES, USER_ROLES, UserRole

### Community 64 - "visitRequests/index.ts"
Cohesion: 0.17
Nodes (12): VisitRequestCard(), VisitRequestCardProps, VisitRequestDetails(), Props, VisitRequest, VisitRequestCard(), ActionStatus, useVisitRequestActions() (+4 more)

### Community 65 - "ChatBubble.tsx"
Cohesion: 0.27
Nodes (8): calculateImageSize(), ChatBubble(), ChatBubbleProps, mockPlayer, VideoBubble(), VisualMediaBubble(), isEmojiOnly(), MessageType

### Community 66 - "useLandlordActionBadges"
Cohesion: 0.22
Nodes (10): TenantApplications(), Units(), EMPTY_COUNTS, getLandlordBadgesQueryKey(), useLandlordActionBadges(), ActionBadgeCategory, ActionBadgeCounts, fetchLandlordApartmentIds() (+2 more)

### Community 67 - "DateField.tsx"
Cohesion: 0.28
Nodes (6): FormErrors, SecondProcess(), CashPaymentForm(), CashPaymentFormProps, DateField(), DateFieldProps

### Community 68 - "applications/[applicationId].tsx"
Cohesion: 0.20
Nodes (9): ApplicationApartment(), Props, VisitRequestHistoryItem(), DocumentRow(), DocumentRowProps, getExtension(), IMAGE_EXTENSIONS, useCancelApplication() (+1 more)

### Community 69 - "payment-history.tsx"
Cohesion: 0.17
Nodes (14): FlatPayment, PaymentHistoryScreen(), toFlatPayment(), ConfirmDialog(), Props, getLandlordPaymentsQueryKey(), useLandlordPaymentConfirmation(), useLandlordPayments() (+6 more)

### Community 70 - "captureSequences.ts"
Cohesion: 0.24
Nodes (8): ALL_SUPPORTED_ID_TYPES, CaptureCameraFacing, CaptureGuideShape, CARD_SEQUENCE, PASSPORT_SEQUENCE, SELFIE_STEP, SEQUENCE_BY_ID_TYPE, NON_PASSPORT_ID_TYPES

### Community 71 - "useSubmitApplication.ts"
Cohesion: 0.29
Nodes (7): DocKey, getContentType(), MIME_MAP, SubmitArgs, SubmitResult, uploadDoc(), UploadedDocumentPaths

### Community 72 - "TenantApplicationCard.tsx"
Cohesion: 0.40
Nodes (5): getInitials(), STATUS_STYLES, TenantApplicationCard(), TenantApplicationCardProps, TenantApplicationStatus

### Community 73 - "TabBar.tsx"
Cohesion: 0.31
Nodes (6): TabBar(), TabBarIcon(), TabBarIconProps, IconProps, LANDLORDICONS, TENANTICONS

### Community 74 - "live-capture.test.tsx"
Cohesion: 0.25
Nodes (8): captureAndReachReview(), DEFAULT_QUALITY_RESULT, mockBack, mockDismissTo, mockReplace, mockSearchParams, mockTakePictureAsync, setPermission()

### Community 75 - "tenantApplicationsService.test.ts"
Cohesion: 0.40
Nodes (3): applicationRow, mockFrom, mockResolvePrivateMediaUrls

### Community 77 - "upload-id.test.tsx"
Cohesion: 0.25
Nodes (7): BACK_CAPTURE, FRONT_CAPTURE, mockBack, mockPush, mockReplace, mockUseFocusEffect, SELFIE_CAPTURE

### Community 78 - "tenant-applications/[applicationId].tsx"
Cohesion: 0.13
Nodes (14): ErrorDialogState, FormErrors, TenancyLeasePeriod, EmptyApplicationData(), TenantApplicationDetailsSkeleton(), EmptyRequestData(), MaintenanceDetails, MaintenanceErrors (+6 more)

### Community 81 - "useNotificationRealtime.ts"
Cohesion: 0.36
Nodes (7): attach(), ChannelEntry, detach(), handleEvent(), NotificationRealtimeCallbacks, registry, NotificationRow

### Community 83 - "useVisitRequest.ts"
Cohesion: 0.48
Nodes (5): getVisitRequestQueryKey(), useVisitRequest(), fetchVisitRequest(), VisitRequest, VisitRequestResult

### Community 84 - "maintenance-requests/[requestId].tsx"
Cohesion: 0.47
Nodes (3): EmptyMaintenanceRequestDetail(), ResolveRequestDialog(), ResolveRequestDialogProps

### Community 85 - "useLandlordUnits.ts"
Cohesion: 0.47
Nodes (5): getLandlordUnitsQueryKey(), useLandlordUnits(), fetchLandlordUnits(), fetchMonthlyProfit(), LandlordUnitApartment

### Community 86 - "metro.config.js"
Cohesion: 0.33
Nodes (5): config, { getDefaultConfig }, monorepoRoot, path, { withUniwindConfig }

### Community 87 - "Welcome to your Expo app 👋"
Cohesion: 0.33
Nodes (5): Get a fresh project, Get started, Join the community, Learn more, Welcome to your Expo app 👋

### Community 89 - "uniwind-types.d.ts"
Cohesion: 0.50
Nodes (3): NOTE: This file is generated by uniwind and it should not be edited manually., uniwind, UniwindConfig

## Knowledge Gaps
- **636 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+631 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **70 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useColors()` connect `useColors` to `apartment/[apartmentId]/index.tsx`, `ScreenWrapper.tsx`, `useTheme.ts`, `ratings/index.ts`, `dashboard.tsx`, `edit-profile.tsx`, `conversationService.ts`, `useFavorites`, `fifth-step.tsx`, `ScreenWrapper`, `expo-router`, `review-information.tsx`, `paymentService.ts`, `(tenant)/chat.tsx`, `ai-search.tsx`, `usePersonalizationStore.ts`, `notifications/index.ts`, `useVerificationStore`, `[conversationId].tsx`, `NotificationScreen.tsx`, `[destinationId].tsx`, `NotificationToast.tsx`, `PaymentMethodSelector.tsx`, `apartments/index.ts`, `landlordService.ts`, `current-apartment.tsx`, `tenant-applications/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `units.tsx`, `app/_layout.tsx`, `queryClient.ts`, `maintenanceService.ts`, `payments/index.ts`, `CustomTabBar.tsx`, `useApplicationActions.test.tsx`, `visit-requests/index.tsx`, `applications/index.ts`, `DocumentCard.tsx`, `maintenance-requests/index.tsx`, `useTenancy`, `sign-in.tsx`, `maintenance-requests/index.ts`, `pending.tsx`, `request-visit.tsx`, `auth/index.ts`, `visitRequests/index.ts`, `ChatBubble.tsx`, `useLandlordActionBadges`, `DateField.tsx`, `applications/[applicationId].tsx`, `payment-history.tsx`, `TabBar.tsx`, `reset-password.tsx`, `tenant-applications/[applicationId].tsx`, `maintenance-requests/[requestId].tsx`?**
  _High betweenness centrality (0.209) - this node is a cross-community bridge._
- **Why does `expo-router` connect `expo-router` to `apartment/[apartmentId]/index.tsx`, `ScreenWrapper.tsx`, `useTheme.ts`, `dashboard.tsx`, `edit-profile.tsx`, `useFavorites`, `fifth-step.tsx`, `ScreenWrapper`, `review-information.tsx`, `paymentService.ts`, `(tenant)/chat.tsx`, `usePersonalizationStore.ts`, `useVerificationStore`, `[conversationId].tsx`, `NotificationScreen.tsx`, `[destinationId].tsx`, `PaymentMethodSelector.tsx`, `apartments/index.ts`, `current-apartment.tsx`, `tenant-applications/index.tsx`, `useColors`, `upload-id.tsx`, `live-capture.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `units.tsx`, `useFrameQualityCheck.ts`, `app/_layout.tsx`, `queryClient.ts`, `payments/index.ts`, `payment/index.tsx`, `CustomTabBar.tsx`, `visit-requests/index.tsx`, `applications/index.ts`, `maintenance-requests/index.tsx`, `sign-in.tsx`, `pending.tsx`, `request-visit.tsx`, `auth/index.ts`, `useInAppNotificationBanner.tsx`, `onboarding.tsx`, `DateField.tsx`, `applications/[applicationId].tsx`, `payment-history.tsx`, `reset-password.tsx`, `tenant-applications/[applicationId].tsx`, `maintenance-requests/[requestId].tsx`, `playground.tsx`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Why does `ScreenWrapper` connect `ScreenWrapper` to `apartment/[apartmentId]/index.tsx`, `ScreenWrapper.tsx`, `useTheme.ts`, `dashboard.tsx`, `edit-profile.tsx`, `useFavorites`, `fifth-step.tsx`, `expo-router`, `review-information.tsx`, `(tenant)/chat.tsx`, `ai-search.tsx`, `usePersonalizationStore.ts`, `notifications/index.ts`, `useVerificationStore`, `[conversationId].tsx`, `NotificationScreen.tsx`, `[destinationId].tsx`, `PaymentMethodSelector.tsx`, `apartments/index.ts`, `current-apartment.tsx`, `tenant-applications/index.tsx`, `useColors`, `upload-id.tsx`, `live-capture.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `units.tsx`, `payments/index.ts`, `payment/index.tsx`, `visit-requests/index.tsx`, `applications/index.ts`, `maintenance-requests/index.tsx`, `sign-in.tsx`, `pending.tsx`, `request-visit.tsx`, `DateField.tsx`, `applications/[applicationId].tsx`, `payment-history.tsx`, `reset-password.tsx`, `tenant-applications/[applicationId].tsx`, `maintenance-requests/[requestId].tsx`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _636 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `apartment/[apartmentId]/index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09401709401709402 - nodes in this community are weakly interconnected._
- **Should `ScreenWrapper.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07535460992907801 - nodes in this community are weakly interconnected._
- **Should `useTheme.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12698412698412698 - nodes in this community are weakly interconnected._