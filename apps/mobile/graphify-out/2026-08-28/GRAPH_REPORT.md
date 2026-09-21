# Graph Report - mobile  (2026-08-28)

## Corpus Check
- 443 files · ~636,155 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1975 nodes · 4672 edges · 169 communities (99 shown, 70 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fcbf72c4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- apartment/[apartmentId]/index.tsx
- ScreenWrapper.tsx
- [landlordId].tsx
- [tenantId].tsx
- dashboard.tsx
- useApartmentFormStore
- useConversations.test.tsx
- useFavorites
- third-process.tsx
- useTheme.ts
- devDependencies
- expo
- expo-router
- review-information.tsx
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
- fifth-step.tsx
- tenant-applications/index.tsx
- useColors
- upload-id.tsx
- live-capture.tsx
- manage-apartment/[apartmentId]/index.tsx
- units.tsx
- useFrameQualityCheck.ts
- dependencies
- app/_layout.tsx
- maintenance-requests/index.tsx
- NotificationScreen.tsx
- history/index.tsx
- payment/index.tsx
- UploadDocumentField.tsx
- audit-fix.characterization.test.ts
- useApplicationActions.test.tsx
- useLandlordActionBadges
- useProfile
- ApplicationList.tsx
- useTenancy
- DocumentCard.tsx
- pending.tsx
- visit-requests/index.tsx
- useChatChannel.ts
- rentals.tsx
- sign-in.tsx
- maintenanceService.ts
- maintenance-requests/index.ts
- RescheduleSheet.tsx
- useApplicationFormStore.ts
- chatService.pagination.test.ts
- useInAppNotificationBanner.tsx
- onboarding.tsx
- visitRequests/index.ts
- ChatBubble.tsx
- apartments/index.ts
- map-view.tsx
- updateApartmentMain.ts
- useLandlordPayments.ts
- captureSequences.ts
- second-step.tsx
- auth/index.ts
- TabBar.tsx
- live-capture.test.tsx
- useTenantApplications
- CustomTabBar.tsx
- upload-id.test.tsx
- request-maintenance.tsx
- useLandlordVisitRequests
- conversationService.test.ts
- notification-toast.tsx
- applications/index.ts
- LandlordSection.tsx
- ReceiptCard.tsx
- useDocumentUrls.ts
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
- useVisitRequest.ts
- useLandlordStats

## God Nodes (most connected - your core abstractions)
1. `useColors()` - 328 edges
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
- `AnalyticsScreen()` --calls--> `useColors()`  [EXTRACTED]
  app/landlord/analytics.tsx → hooks/useTheme.ts

## Import Cycles
- 2-file cycle: `hooks/applications/index.ts -> hooks/applications/useApplicationActions.ts -> hooks/applications/index.ts`
- 2-file cycle: `hooks/applications/index.ts -> service/applications/tenantApplicationsService.ts -> hooks/applications/index.ts`
- 3-file cycle: `hooks/applications/index.ts -> hooks/applications/useTenantApplications.ts -> service/applications/tenantApplicationsService.ts -> hooks/applications/index.ts`
- 3-file cycle: `hooks/payments/index.ts -> hooks/payments/usePayments.ts -> service/payments/paymentService.ts -> hooks/payments/index.ts`

## Communities (169 total, 70 thin omitted)

### Community 0 - "apartment/[apartmentId]/index.tsx"
Cohesion: 0.11
Nodes (15): ApartmentSkeleton(), ApartmentDescriptionSection(), ApartmentDescriptionSectionProps, ApartmentDetailsSection(), ApartmentDetailsSectionProps, ApartmentHeroSection(), ApartmentHeroSectionProps, ApartmentImage (+7 more)

### Community 1 - "ScreenWrapper.tsx"
Cohesion: 0.07
Nodes (28): RateApartmentSkeleton(), ErrorDialogState, FormErrors, TenancyLeasePeriod, DOCUMENT_TYPE_ICONS, TODO: Persist the uploaded document to Supabase Storage and store its, AnalyticsScreen(), MAX_AMOUNT (+20 more)

### Community 2 - "[landlordId].tsx"
Cohesion: 0.23
Nodes (9): SORT_OPTIONS, TODO: Implement function to handle report landlord, RatingCard(), RatingCardProps, RatingCardSkeleton(), SmallRatingCard(), SmallRatingCardProps, StarRating() (+1 more)

### Community 3 - "[tenantId].tsx"
Cohesion: 0.06
Nodes (48): RateApartment(), RatingsPage(), ReviewsPage(), PublicLandlordProfile(), PublicTenantProfile(), TODO: Implement function to handle report tenant, PastApartmentCard(), PastApartmentCardProps (+40 more)

### Community 4 - "dashboard.tsx"
Cohesion: 0.07
Nodes (36): DashboardSkeleton(), chartLabel(), ProfitByPropertyCard(), ProfitByPropertyCardProps, BUILDERS, ChartDatum, FilterOption, filterOptions (+28 more)

### Community 5 - "useApartmentFormStore"
Cohesion: 0.18
Nodes (14): Amenities(), FourthStep(), DEFAULT_COORDS, MAP_STYLE, MapPin(), getMimeType(), uploadBytes(), uploadImage() (+6 more)

### Community 6 - "useConversations.test.tsx"
Cohesion: 0.14
Nodes (21): Chat(), Chat(), getConversationsQueryKey(), NewChatRow, createWrapper(), mockChannelFn, mockFetchConversations, mockGetChannels (+13 more)

### Community 7 - "useFavorites"
Cohesion: 0.08
Nodes (37): ApartmentsList(), ApartmentsListProps, DEFAULT_FILTERS, FilterBottomSheet(), FilterState, Props, ROOM_OPTS, SearchFiltersBar() (+29 more)

### Community 8 - "third-process.tsx"
Cohesion: 0.14
Nodes (13): FormErrors, FormErrors, Index(), FieldErrors, ThirdStep(), UploadFileField(), UploadFileFieldProps, UploadImageField() (+5 more)

### Community 9 - "useTheme.ts"
Cohesion: 0.09
Nodes (29): FieldErrors, FormErrors, AuthCompleteProfile(), ProfileForm, requiredFields, CompleteProfile(), ProfileForm, requiredFields (+21 more)

### Community 10 - "devDependencies"
Cohesion: 0.05
Nodes (42): eslint, eslint-config-expo, eslint-import-resolver-typescript, expo-doctor, fast-check, jest, jest-expo, metro-minify-terser (+34 more)

### Community 11 - "expo"
Cohesion: 0.05
Nodes (39): backgroundColor, foregroundImage, adaptiveIcon, googleServicesFile, package, permissions, predictiveBackGestureEnabled, softwareKeyboardLayoutMode (+31 more)

### Community 13 - "review-information.tsx"
Cohesion: 0.27
Nodes (6): ReviewAccordionItem(), ReviewAccordionItemProps, ReviewDocumentFile(), ReviewDocumentFileProps, ReviewDocumentImage(), ReviewDocumentImageProps

### Community 14 - "privateMediaResolver.ts"
Cohesion: 0.15
Nodes (23): cacheKey(), chatMediaRetryKeys, claimChatMediaRetry(), clearPrivateMediaUrlCache(), getCachedPrivateMediaUrl(), getPrivateMediaCacheGeneration(), isPrivateMediaCacheGenerationCurrent(), setCachedPrivateMediaUrl() (+15 more)

### Community 15 - "paymentService.ts"
Cohesion: 0.17
Nodes (17): getPaymentByReferenceQueryKey(), getPaymentQueryKey(), getPaymentsQueryKey(), usePaymentByReference(), usePayments(), CreateCashPaymentParams, fetchPaymentById(), fetchPaymentByReferenceId() (+9 more)

### Community 16 - "images.ts"
Cohesion: 0.10
Nodes (17): TODO: Implement contact support functionality,, TODO: Fetch and display user's uploaded documents and IDs here. This may…, UploadedDocument, AIHeaderProps, getLastMessageDisplay(), MessageCard(), MessageCardProps, getLogoSource() (+9 more)

### Community 17 - "ai-search.tsx"
Cohesion: 0.10
Nodes (20): AISearchScreen(), SUGGESTION_CHIPS, AIHeader(), EmptyChatState(), MessageBubble(), MessageBubbleProps, MessageComposer(), MessageComposerProps (+12 more)

### Community 18 - "usePersonalizationStore.ts"
Cohesion: 0.13
Nodes (20): CityCheckBox(), CityCheckBoxProps, PersonalizationProgress(), Props, PersonalizationRadioButton(), PersonalizationRadioButtonProps, StepFive(), StepFour() (+12 more)

### Community 19 - "notificationService.ts"
Cohesion: 0.19
Nodes (15): NotificationManager(), GENERAL_TOGGLES, GeneralToggleKey, NOTIFICATION_TYPE_LABELS, getNotificationPreferencesQueryKey(), useNotificationPreferences(), usePushRegistration(), DEFAULT_NOTIFICATION_PREFERENCES (+7 more)

### Community 20 - "useVerificationStore"
Cohesion: 0.15
Nodes (17): getCaptureSequence(), SelectId(), SelfiePrep(), Success(), UploadSelfie(), StepProgress(), StepProgressProps, useVerificationStore (+9 more)

### Community 21 - "chatService.ts"
Cohesion: 0.14
Nodes (23): Options, AttachmentUploadFailure, buildOlderThanChatMessageFilter(), ChatMessageCursor, ChatMessagePage, EXTENSION_BY_MIME_TYPE, fetchMessagePage(), fetchMessages() (+15 more)

### Community 22 - "[conversationId].tsx"
Cohesion: 0.12
Nodes (18): ATTACHMENT_OPTIONS, ChatBox(), ChatBoxProps, StagedAsset, ChatEmptyState(), ChatEmptyStateProps, ChatHeader(), ChatHeaderProps (+10 more)

### Community 23 - "useNotifications.ts"
Cohesion: 0.24
Nodes (14): attach(), ChannelEntry, detach(), handleEvent(), NotificationRealtimeCallbacks, registry, useNotificationRealtime(), getErrorMessage() (+6 more)

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
Cohesion: 0.09
Nodes (27): Index(), Index(), getLandlordUnitsQueryKey(), useLandlordUnits(), useLandlordTenancy(), DB_TO_DISPLAY_STATUS, DbStatus, DISPLAY_TO_DB_STATUS (+19 more)

### Community 30 - "fifth-step.tsx"
Cohesion: 0.15
Nodes (12): PerksSection(), PerksSectionProps, DEFAULT_COORDS, MAP_STYLE, BasePerkButtonProps, PerkButton(), PerkButtonProps, BasePerkItemProps (+4 more)

### Community 31 - "tenant-applications/index.tsx"
Cohesion: 0.13
Nodes (15): ApplicationFilters, ApplicationFilterSheet(), LOCATION_OPTIONS, Props, STATUS_OPTIONS, EmptyApplications(), EmptySearchResults(), getInitials() (+7 more)

### Community 32 - "useColors"
Cohesion: 0.08
Nodes (24): RatingBarCount(), RatingBarCountProps, Index(), Failed(), SelectDocument(), Upload(), MaintenanceRequestCard(), MaintenanceRequestCardProps (+16 more)

### Community 33 - "upload-id.tsx"
Cohesion: 0.22
Nodes (13): CaptureStepConfig, CaptureStepSummary(), CaptureStepSummaryProps, UploadId(), CaptureProgress, computeCanContinue(), getCaptureProgress(), IdCaptureResult (+5 more)

### Community 34 - "live-capture.tsx"
Cohesion: 0.16
Nodes (10): getNextCaptureStep(), CapturedPhoto, LiveCapture(), ScreenState, computeFillRatio(), computeGuidedFrameRect(), GuidedFrameOverlay(), GuidedFrameOverlayProps (+2 more)

### Community 35 - "manage-apartment/[apartmentId]/index.tsx"
Cohesion: 0.16
Nodes (8): PropertyOverviewSkeleton(), EmptyApplicationData(), TenantApplicationDetailsSkeleton(), EmptyRequestData(), ConfirmDialog(), Props, RejectDialog(), RejectDialogProps

### Community 36 - "units.tsx"
Cohesion: 0.12
Nodes (16): EmptyProperties(), Props, PropertyCard(), PropertyCardProps, PropertyCardSkeleton(), PropertyFilterSheet(), PropertyFilterSheetProps, SORT_LABELS (+8 more)

### Community 37 - "useFrameQualityCheck.ts"
Cohesion: 0.18
Nodes (13): GuidedFrameRect, CameraPermissionState, useCameraPermission(), UseCameraPermissionResult, evaluateBlurHeuristic(), evaluateGlareHeuristic(), FrameQualityCheckOptions, FrameQualityReason (+5 more)

### Community 38 - "dependencies"
Cohesion: 0.11
Nodes (19): emoji-regex-xs, expo-constants, expo-router, dependencies, emoji-regex-xs, expo-constants, expo-router, react-native-gesture-handler (+11 more)

### Community 39 - "app/_layout.tsx"
Cohesion: 0.18
Nodes (9): RootLayout(), ThemeInitializer(), Index(), DevBadge(), useTheme(), expo-web-browser, ThemeMode, ThemeStore (+1 more)

### Community 40 - "maintenance-requests/index.tsx"
Cohesion: 0.16
Nodes (12): EmptyMaintenanceRequestsList(), MaintenanceRequestCard(), MaintenanceRequestCardProps, MaintenanceRequestCardSkeleton(), LOCATION_OPTIONS, MaintenanceRequestFilters, MaintenanceRequestFilterSheet(), Props (+4 more)

### Community 41 - "NotificationScreen.tsx"
Cohesion: 0.18
Nodes (10): NotificationCardType, NotificationCardSkeleton(), NotificationFilter, NotificationList(), NotificationListProps, NotificationScreen(), NotificationScreenProps, useNotificationActions() (+2 more)

### Community 42 - "history/index.tsx"
Cohesion: 0.17
Nodes (13): PaymentHistoryCard(), PaymentHistoryCardProps, PaymentHistoryItem, PaymentHistoryFilters, PaymentHistoryFilterSheet(), PaymentSort, Props, SORT_OPTIONS (+5 more)

### Community 43 - "payment/index.tsx"
Cohesion: 0.19
Nodes (14): validateCashPayment(), PaymentFooter(), PaymentFooterProps, PaymentSummaryCard(), PaymentSummaryCardProps, formatLeaseDate(), INITIAL_CARD, PaymentCheckout() (+6 more)

### Community 44 - "UploadDocumentField.tsx"
Cohesion: 0.23
Nodes (11): EditProfile(), ACCEPTED_FILE_TYPES, UploadDocumentField(), UploadDocumentFieldProps, UploadedDocument, BUCKET_MAP, UploadTarget, useImageUpload() (+3 more)

### Community 45 - "audit-fix.characterization.test.ts"
Cohesion: 0.12
Nodes (10): ChatRow, mockChannel, mockChatRows, mockCreateSignedUrls, mockFrom, mockGetUser, mockRemoveChannel, mockStorageFrom (+2 more)

### Community 46 - "useApplicationActions.test.tsx"
Cohesion: 0.18
Nodes (14): getStatusStyle(), TenantApplicationDetails(), createWrapper(), mockEq, mockFrom, mockUpdate, mockUseCurrentUser, useApplicationActions() (+6 more)

### Community 47 - "useLandlordActionBadges"
Cohesion: 0.22
Nodes (10): MaintenanceRequests(), Units(), EMPTY_COUNTS, getLandlordBadgesQueryKey(), useLandlordActionBadges(), ActionBadgeCategory, ActionBadgeCounts, fetchLandlordApartmentIds() (+2 more)

### Community 48 - "useProfile"
Cohesion: 0.17
Nodes (11): TabsLayout(), ApplicationApartment(), RequestVisit(), DocumentRow(), DocumentRowProps, getExtension(), IMAGE_EXTENSIONS, useProfile() (+3 more)

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
Cohesion: 0.19
Nodes (11): EmptyPending(), VisitRequestCardSkeleton(), DATE_RANGE_OPTIONS, DateRange, Props, STATUS_OPTIONS, VisitRequestFilters, VisitRequestFilterSheet() (+3 more)

### Community 53 - "visit-requests/index.tsx"
Cohesion: 0.19
Nodes (10): EmptyApproved(), VisitRequestCalendar(), VisitRequestCalendarProps, getGroup(), Group, GROUP_ORDER, GroupedItem, PastToggle() (+2 more)

### Community 54 - "useChatChannel.ts"
Cohesion: 0.16
Nodes (12): BroadcastEvent, BroadcastPayload, PresenceJoinEvent, PresenceLeaveEvent, PresenceState, ChannelHandler, MockChannel, mockChannels (+4 more)

### Community 55 - "rentals.tsx"
Cohesion: 0.13
Nodes (14): NotificationBellButton(), NotificationBellButtonProps, QuickActionButton(), QuickActionButtonProps, ApartmentDescriptionCard(), ApartmentDescriptionCardProps, PaymentSummaryCard(), PaymentSummaryCardProps (+6 more)

### Community 56 - "sign-in.tsx"
Cohesion: 0.26
Nodes (9): AuthButton(), AuthButtonProps, AuthDivider(), AuthDividerProps, RoleTab(), RoleTabProps, SignIn(), SignUp() (+1 more)

### Community 57 - "maintenanceService.ts"
Cohesion: 0.19
Nodes (15): MaintenanceHistory(), StatusStyle, getMaintenanceRequestHistoryQueryKey(), useMaintenanceRequestHistory(), UseMaintenanceRequestHistoryParams, getLatestMaintenanceRequestQueryKey(), useMaintenanceRequests(), UseMaintenanceRequestsParams (+7 more)

### Community 58 - "maintenance-requests/index.ts"
Cohesion: 0.26
Nodes (11): getLandlordMaintenanceRequestsQueryKey(), getNextStatus(), STATUS_FLOW, useLandlordMaintenanceRequests(), MaintenanceCategorySlug, MaintenanceUrgencySlug, SubmitMaintenanceRequestInput, useSubmitMaintenanceRequest() (+3 more)

### Community 59 - "RescheduleSheet.tsx"
Cohesion: 0.18
Nodes (10): Period, Props, RescheduleSheet(), tomorrow, toSupabaseTime(), HOURS, Period, PERIODS (+2 more)

### Community 60 - "useApplicationFormStore.ts"
Cohesion: 0.10
Nodes (23): FirstProcess(), ReviewInformation(), SecondProcess(), ThirdProcess(), DocKey, getContentType(), MIME_MAP, SubmitArgs (+15 more)

### Community 61 - "chatService.pagination.test.ts"
Cohesion: 0.16
Nodes (9): ChatMessagePlacement, mergeChatMessages(), Message, ChatRow, mockFrom, mockStorageFrom, pageResponses, QueryLog (+1 more)

### Community 62 - "useInAppNotificationBanner.tsx"
Cohesion: 0.26
Nodes (9): getOpenChatConversationKey(), shouldSuppressChatToast(), useInAppNotificationBanner(), useNotificationTapHandler(), markNotificationRead(), buildNotificationDeepLink(), NotificationData, parseConversationKey() (+1 more)

### Community 63 - "onboarding.tsx"
Cohesion: 0.21
Nodes (7): { width }, OnBoardingSlide(), OnBoardingSlideProps, Slide, SLIDES, USER_ROLES, UserRole

### Community 64 - "visitRequests/index.ts"
Cohesion: 0.19
Nodes (11): VisitRequestCard(), VisitRequestCardProps, Props, VisitRequest, VisitRequestCard(), Props, VisitRequestHistoryItem(), FALLBACK_STYLE() (+3 more)

### Community 65 - "ChatBubble.tsx"
Cohesion: 0.27
Nodes (8): calculateImageSize(), ChatBubble(), ChatBubbleProps, mockPlayer, VideoBubble(), VisualMediaBubble(), isEmojiOnly(), MessageType

### Community 66 - "apartments/index.ts"
Cohesion: 0.29
Nodes (11): ApartmentSummary(), IncludedPerks(), getApartmentDetailsQueryKey(), getApartmentReviewsPreviewQueryKey(), useApartmentDetails(), UseApartmentDetailsOptions, ApartmentDetails, fetchApartmentDetails() (+3 more)

### Community 67 - "map-view.tsx"
Cohesion: 0.11
Nodes (17): IconButton(), IconButtonProps, IconComponent, DEFAULT_COORDS, DirectionMode, MAP_STYLE, MapPreviewSection(), MapPreviewSectionProps (+9 more)

### Community 68 - "updateApartmentMain.ts"
Cohesion: 0.24
Nodes (11): EditMain(), validateForm(), ApartmentMainFields, deleteStorageImage(), ExistingImage, PendingImage, thumbPathFor(), updateApartmentMain() (+3 more)

### Community 69 - "useLandlordPayments.ts"
Cohesion: 0.24
Nodes (10): getLandlordPaymentsQueryKey(), useLandlordPaymentConfirmation(), useLandlordPayments(), getLandlordTenancyQueryKey(), fetchLandlordPayments(), LandlordPaymentRecord, mockFrom, QueryResult (+2 more)

### Community 70 - "captureSequences.ts"
Cohesion: 0.24
Nodes (8): ALL_SUPPORTED_ID_TYPES, CaptureCameraFacing, CaptureGuideShape, CARD_SEQUENCE, PASSPORT_SEQUENCE, SELFIE_STEP, SEQUENCE_BY_ID_TYPE, NON_PASSPORT_ID_TYPES

### Community 71 - "second-step.tsx"
Cohesion: 0.31
Nodes (8): DEFAULT_COORDS, DEFAULT_ROOM_LIMITS, formatLimitMessage(), formatRange(), FormErrors, isZeroRange(), MAP_STYLE, SecondStep()

### Community 72 - "auth/index.ts"
Cohesion: 0.36
Nodes (7): UseCountdownOptions, useCurrentUser(), useCurrentUserId(), getCurrentUser(), getUserProfileByColumn(), getUserProfileById(), UserProfile

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

### Community 78 - "request-maintenance.tsx"
Cohesion: 0.16
Nodes (14): EmptyMaintenanceRequestDetail(), ResolveRequestDialog(), ResolveRequestDialogProps, MaintenanceRequestDetails(), MaintenanceRequestCard(), MaintenanceRequestCardProps, MaintenanceDetails(), MaintenanceDetails (+6 more)

### Community 79 - "useLandlordVisitRequests"
Cohesion: 0.28
Nodes (7): VisitRequestDetails(), getLandlordVisitRequestsQueryKey(), useLandlordVisitRequests(), ActionStatus, useVisitRequestActions(), fetchLandlordVisitRequests(), resolveApartmentImageUrls()

### Community 80 - "conversationService.test.ts"
Cohesion: 0.33
Nodes (6): Conversation, createQuery(), mockFrom, mockLegacyQueries(), mockRpc, seedV2Conversations

### Community 81 - "notification-toast.tsx"
Cohesion: 0.40
Nodes (5): MOCK_TOASTS, MockRow, MockToast, NotificationToastDevScreen(), showNotificationToast()

### Community 82 - "applications/index.ts"
Cohesion: 0.30
Nodes (8): ApplicationStatusCard(), Props, ApplicationStatus, ApplicationStatusStyle, ChipColor, FALLBACK_STYLE(), useApplicationStatusStyles(), useCancelApplication()

### Community 83 - "LandlordSection.tsx"
Cohesion: 0.33
Nodes (4): LandlordSection(), LandlordSectionProps, LandlordCard(), LandlordCardProps

### Community 84 - "ReceiptCard.tsx"
Cohesion: 0.33
Nodes (4): ReceiptCardProps, STATUS_META, ZigzagEdge(), ZigzagEdgeProps

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

### Community 97 - "reset-password.tsx"
Cohesion: 0.50
Nodes (3): ResetPassword(), AppInput(), AppInputProps

### Community 165 - "queryClient.ts"
Cohesion: 0.06
Nodes (40): CompleteProfileCard(), CompleteProfileCardProps, ProfileHeader(), ProfileHeaderProps, AccountStatus, StatusConfig, VerificationStatus(), VerificationStatusProps (+32 more)

### Community 167 - "useVisitRequest.ts"
Cohesion: 0.48
Nodes (5): getVisitRequestQueryKey(), useVisitRequest(), fetchVisitRequest(), VisitRequest, VisitRequestResult

### Community 169 - "useLandlordStats"
Cohesion: 0.50
Nodes (4): FifthStep(), useLandlordStats(), fetchLandlordStats(), LandlordStats

## Knowledge Gaps
- **633 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+628 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **70 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useColors()` connect `useColors` to `apartment/[apartmentId]/index.tsx`, `ScreenWrapper.tsx`, `[landlordId].tsx`, `[tenantId].tsx`, `dashboard.tsx`, `useApartmentFormStore`, `useConversations.test.tsx`, `useFavorites`, `third-process.tsx`, `useTheme.ts`, `review-information.tsx`, `images.ts`, `ai-search.tsx`, `usePersonalizationStore.ts`, `notificationService.ts`, `useVerificationStore`, `[conversationId].tsx`, `notifications/index.ts`, `PaymentMethodSelector.tsx`, `payment-history/index.tsx`, `landlordService.ts`, `fifth-step.tsx`, `tenant-applications/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `units.tsx`, `queryClient.ts`, `app/_layout.tsx`, `maintenance-requests/index.tsx`, `useLandlordStats`, `history/index.tsx`, `payment/index.tsx`, `UploadDocumentField.tsx`, `useApplicationActions.test.tsx`, `useLandlordActionBadges`, `useProfile`, `ApplicationList.tsx`, `useTenancy`, `DocumentCard.tsx`, `pending.tsx`, `visit-requests/index.tsx`, `rentals.tsx`, `sign-in.tsx`, `maintenanceService.ts`, `RescheduleSheet.tsx`, `visitRequests/index.ts`, `ChatBubble.tsx`, `apartments/index.ts`, `map-view.tsx`, `second-step.tsx`, `TabBar.tsx`, `CustomTabBar.tsx`, `request-maintenance.tsx`, `useLandlordVisitRequests`, `applications/index.ts`, `LandlordSection.tsx`, `ReceiptCard.tsx`, `reset-password.tsx`?**
  _High betweenness centrality (0.238) - this node is a cross-community bridge._
- **Why does `expo-router` connect `expo-router` to `apartment/[apartmentId]/index.tsx`, `ScreenWrapper.tsx`, `[landlordId].tsx`, `[tenantId].tsx`, `dashboard.tsx`, `useApartmentFormStore`, `useFavorites`, `third-process.tsx`, `useTheme.ts`, `review-information.tsx`, `images.ts`, `usePersonalizationStore.ts`, `useVerificationStore`, `[conversationId].tsx`, `paymongoService.ts`, `payment-history/index.tsx`, `fifth-step.tsx`, `tenant-applications/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `units.tsx`, `queryClient.ts`, `useFrameQualityCheck.ts`, `app/_layout.tsx`, `maintenance-requests/index.tsx`, `NotificationScreen.tsx`, `history/index.tsx`, `payment/index.tsx`, `useProfile`, `ApplicationList.tsx`, `pending.tsx`, `visit-requests/index.tsx`, `rentals.tsx`, `sign-in.tsx`, `useInAppNotificationBanner.tsx`, `onboarding.tsx`, `apartments/index.ts`, `map-view.tsx`, `second-step.tsx`, `CustomTabBar.tsx`, `request-maintenance.tsx`, `applications/index.ts`, `playground.tsx`, `reset-password.tsx`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **Why does `ScreenWrapper` connect `ScreenWrapper.tsx` to `apartment/[apartmentId]/index.tsx`, `[landlordId].tsx`, `[tenantId].tsx`, `dashboard.tsx`, `useApartmentFormStore`, `useFavorites`, `third-process.tsx`, `useTheme.ts`, `review-information.tsx`, `images.ts`, `ai-search.tsx`, `usePersonalizationStore.ts`, `notificationService.ts`, `useVerificationStore`, `[conversationId].tsx`, `payment-history/index.tsx`, `fifth-step.tsx`, `tenant-applications/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `units.tsx`, `maintenance-requests/index.tsx`, `NotificationScreen.tsx`, `history/index.tsx`, `payment/index.tsx`, `useProfile`, `ApplicationList.tsx`, `pending.tsx`, `visit-requests/index.tsx`, `rentals.tsx`, `sign-in.tsx`, `apartments/index.ts`, `map-view.tsx`, `second-step.tsx`, `request-maintenance.tsx`, `reset-password.tsx`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _633 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `apartment/[apartmentId]/index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10869565217391304 - nodes in this community are weakly interconnected._
- **Should `ScreenWrapper.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06980433632998413 - nodes in this community are weakly interconnected._
- **Should `[tenantId].tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.059227921734531994 - nodes in this community are weakly interconnected._