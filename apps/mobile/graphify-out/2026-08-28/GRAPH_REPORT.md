# Graph Report - mobile  (2026-08-26)

## Corpus Check
- 454 files · ~640,180 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2035 nodes · 4854 edges · 167 communities (98 shown, 69 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.61)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `db8fb69b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- apartments/index.ts
- StandardHeader.tsx
- [landlordId].tsx
- [tenantId].tsx
- ProfitTrendCard.tsx
- UploadImageField.tsx
- useConversations.test.tsx
- useFavorites
- useApartmentFormStore
- ErrorDialog.tsx
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
- useCurrentUser
- payments/index.ts
- paths
- NotificationList.tsx
- PaymentMethodSelector.tsx
- [paymentId].tsx
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
- usePayouts.ts
- history/index.tsx
- payment/index.tsx
- edit-main.tsx
- audit-fix.characterization.test.ts
- useApplicationActions.test.tsx
- visit-requests/index.tsx
- (landlord)/profile.tsx
- ApplicationList.tsx
- useTenancyRealtime.ts
- DocumentCard.tsx
- third-process.tsx
- useTenancy
- useChatChannel.ts
- rentals.tsx
- sign-in.tsx
- maintenance-requests/index.ts
- pending.tsx
- RescheduleSheet.tsx
- useApplicationFormStore.ts
- useProfile
- useInAppNotificationBanner.tsx
- onboarding.tsx
- applications/components/VisitRequestCard.tsx
- ChatBubble.tsx
- visitRequests/index.ts
- fifth-step.tsx
- dashboard.tsx
- useLandlordPayments.ts
- captureSequences.ts
- first-process.tsx
- auth/index.ts
- TabBar.tsx
- live-capture.test.tsx
- tenantApplicationsService.ts
- CustomTabBar.tsx
- upload-id.test.tsx
- applications/[applicationId].tsx
- useTenancyRealtime.test.ts
- second-step.tsx
- NotificationToast.tsx
- applications/index.ts
- useVisitRequest.ts
- maintenance-requests/[requestId].tsx
- useLandlordTenancy.ts
- metro.config.js
- Welcome to your Expo app 👋
- playground.tsx
- uniwind-types.d.ts
- ReviewField.tsx
- StatusPill.tsx
- eslint.config.js
- usePayoutBalances
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

## God Nodes (most connected - your core abstractions)
1. `useColors()` - 332 edges
2. `expo-router` - 136 edges
3. `ScreenWrapper` - 105 edges
4. `StandardHeader()` - 57 edges
5. `useCurrentUser()` - 48 edges
6. `useProfile()` - 46 edges
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
- `SecondProcess()` --calls--> `useApplicationFormStore`  [EXTRACTED]
  app/apartment/[apartmentId]/apply/second-process.tsx → stores/useApplicationFormStore.ts

## Import Cycles
- 2-file cycle: `hooks/applications/index.ts -> service/applications/tenantApplicationsService.ts -> hooks/applications/index.ts`
- 2-file cycle: `hooks/applications/index.ts -> hooks/applications/useApplicationActions.ts -> hooks/applications/index.ts`
- 3-file cycle: `hooks/payments/index.ts -> hooks/payments/usePayments.ts -> service/payments/paymentService.ts -> hooks/payments/index.ts`
- 3-file cycle: `hooks/applications/index.ts -> hooks/applications/useTenantApplications.ts -> service/applications/tenantApplicationsService.ts -> hooks/applications/index.ts`

## Communities (167 total, 69 thin omitted)

### Community 0 - "apartments/index.ts"
Cohesion: 0.06
Nodes (42): ApartmentSummary(), ApartmentSkeleton(), IconButton(), IconButtonProps, IconComponent, ApartmentDescriptionSection(), ApartmentDescriptionSectionProps, ApartmentDetailsSection() (+34 more)

### Community 1 - "StandardHeader.tsx"
Cohesion: 0.09
Nodes (13): RateApartmentSkeleton(), ErrorDialogState, FormErrors, TenancyLeasePeriod, TODO: Persist the uploaded document to Supabase Storage and store its, faqs, sections, sections (+5 more)

### Community 2 - "[landlordId].tsx"
Cohesion: 0.14
Nodes (14): RatingBarCount(), RatingBarCountProps, SORT_OPTIONS, TODO: Implement function to handle report landlord, SearchHeader(), SearchHeaderProps, DropdownButton(), DropdownButtonProps (+6 more)

### Community 3 - "[tenantId].tsx"
Cohesion: 0.07
Nodes (44): RatingsPage(), ReviewsPage(), PublicLandlordProfile(), PublicTenantProfile(), TODO: Implement function to handle report tenant, PastApartmentCard(), PastApartmentCardProps, ProfileStat (+36 more)

### Community 4 - "ProfitTrendCard.tsx"
Cohesion: 0.10
Nodes (22): BUILDERS, ChartDatum, FilterOption, filterOptions, ProfitTrendCard(), ProfitTrendCardProps, toMonthly(), Dashboard() (+14 more)

### Community 5 - "UploadImageField.tsx"
Cohesion: 0.26
Nodes (9): ACCEPTED_FILE_TYPES, UploadDocumentField(), UploadDocumentFieldProps, UploadedDocument, UploadImageField(), UploadImageFieldProps, buildImageTiers(), compressImage() (+1 more)

### Community 6 - "useConversations.test.tsx"
Cohesion: 0.10
Nodes (27): Chat(), Chat(), getConversationsQueryKey(), NewChatRow, createWrapper(), mockChannelFn, mockFetchConversations, mockGetChannels (+19 more)

### Community 7 - "useFavorites"
Cohesion: 0.08
Nodes (37): ApartmentsList(), ApartmentsListProps, DEFAULT_FILTERS, FilterBottomSheet(), FilterState, Props, ROOM_OPTS, SearchFiltersBar() (+29 more)

### Community 8 - "useApartmentFormStore"
Cohesion: 0.15
Nodes (16): Amenities(), FourthStep(), FormErrors, Index(), DEFAULT_COORDS, MAP_STYLE, MapPin(), ThirdStep() (+8 more)

### Community 9 - "ErrorDialog.tsx"
Cohesion: 0.13
Nodes (18): AuthCompleteProfile(), ProfileForm, requiredFields, CompleteProfile(), ProfileForm, requiredFields, OTPVerification(), OTPVerification() (+10 more)

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
Cohesion: 0.23
Nodes (9): ReviewAccordionItem(), ReviewAccordionItemProps, ReviewDocumentFile(), ReviewDocumentFileProps, ReviewDocumentImage(), ReviewDocumentImageProps, ReviewInformation(), useSubmitApplication() (+1 more)

### Community 14 - "privateMediaResolver.ts"
Cohesion: 0.11
Nodes (28): DocEntry, ResolvedDoc, DocumentEntriesProps, mockResolvePrivateMediaUrls, useDocumentUrls(), cacheKey(), chatMediaRetryKeys, claimChatMediaRetry() (+20 more)

### Community 15 - "paymentService.ts"
Cohesion: 0.13
Nodes (20): getPaymentQueryKey(), getRefundsQueryKey(), useRefundForPayment(), useRequestRefund(), CreateCashPaymentParams, fetchPaymentById(), fetchPaymentByReferenceId(), fetchPayments() (+12 more)

### Community 16 - "(tenant)/chat.tsx"
Cohesion: 0.21
Nodes (10): getLastMessageDisplay(), MessageCard(), MessageCardProps, getLogoSource(), maskMobileNumber(), PaymentMethod, PaymentMethodCard(), PaymentMethodCardProps (+2 more)

### Community 17 - "ai-search.tsx"
Cohesion: 0.11
Nodes (19): AISearchScreen(), SUGGESTION_CHIPS, AIHeader(), EmptyChatState(), MessageBubble(), MessageBubbleProps, MessageComposer(), MessageComposerProps (+11 more)

### Community 18 - "usePersonalizationStore.ts"
Cohesion: 0.13
Nodes (20): CityCheckBox(), CityCheckBoxProps, PersonalizationProgress(), Props, PersonalizationRadioButton(), PersonalizationRadioButtonProps, StepFive(), StepFour() (+12 more)

### Community 19 - "notifications/index.ts"
Cohesion: 0.17
Nodes (19): GENERAL_TOGGLES, GeneralToggleKey, NOTIFICATION_TYPE_LABELS, getNotificationPreferencesQueryKey(), mockFetchNotificationPreferences, mockUpdateNotificationPreferences, mockUseCurrentUser, useNotificationPreferences() (+11 more)

### Community 20 - "useVerificationStore"
Cohesion: 0.15
Nodes (17): getCaptureSequence(), SelectId(), SelfiePrep(), Success(), UploadSelfie(), StepProgress(), StepProgressProps, useVerificationStore (+9 more)

### Community 21 - "chatService.ts"
Cohesion: 0.09
Nodes (32): Options, ChatMessagePlacement, mergeChatMessages(), AttachmentUploadFailure, buildOlderThanChatMessageFilter(), ChatMessageCursor, ChatMessagePage, EXTENSION_BY_MIME_TYPE (+24 more)

### Community 22 - "[conversationId].tsx"
Cohesion: 0.11
Nodes (19): ATTACHMENT_OPTIONS, ChatBox(), ChatBoxProps, StagedAsset, ChatEmptyState(), ChatEmptyStateProps, ChatHeader(), ChatHeaderProps (+11 more)

### Community 23 - "useCurrentUser"
Cohesion: 0.22
Nodes (14): NotificationList(), NotificationScreen(), NotificationScreenProps, useCurrentUser(), useNotificationActions(), useNotificationRealtime(), getErrorMessage(), getNotificationsQueryKey() (+6 more)

### Community 24 - "payments/index.ts"
Cohesion: 0.20
Nodes (19): FormErrors, PayoutAccountForm(), CreatePayoutDestinationParams, getPayoutDestinationsQueryKey(), UpdatePayoutDestinationParams, useCreatePayoutDestination(), useDeletePayoutDestination(), usePayoutDestinations() (+11 more)

### Community 25 - "paths"
Cohesion: 0.09
Nodes (22): ./assets/*, ./components/*, ./constants/*, expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.ts, ./hooks/*, ../../packages/ui/* (+14 more)

### Community 26 - "NotificationList.tsx"
Cohesion: 0.22
Nodes (12): NotificationCard(), NotificationCardProps, NotificationCardType, NotificationFilter, NotificationListProps, NotificationSettingsScreen(), NotificationToastContent(), getNotificationTypeIcon() (+4 more)

### Community 27 - "PaymentMethodSelector.tsx"
Cohesion: 0.14
Nodes (16): CardInformation, CardPaymentForm(), CardPaymentFormProps, CashPaymentErrors, PaymentMethodButton(), PaymentMethodButtonProps, PaymentMethodButtonVariant, getSelectedMethod() (+8 more)

### Community 28 - "[paymentId].tsx"
Cohesion: 0.17
Nodes (18): PaymentHistoryCard(), PaymentHistoryCardProps, toFlatPayment(), ReceiptCard(), STATUS_META, ZigzagEdge(), ZigzagEdgeProps, History() (+10 more)

### Community 29 - "landlordService.ts"
Cohesion: 0.09
Nodes (30): Index(), Units(), EMPTY_COUNTS, getLandlordBadgesQueryKey(), useLandlordActionBadges(), getLandlordUnitsQueryKey(), useLandlordUnits(), ActionBadgeCategory (+22 more)

### Community 30 - "useTheme.ts"
Cohesion: 0.09
Nodes (22): PerksSectionProps, ResetPassword(), DOCUMENT_TYPE_ICONS, AnalyticsScreen(), MAX_AMOUNT, monthlyData, stats, developers (+14 more)

### Community 31 - "tenant-applications/index.tsx"
Cohesion: 0.13
Nodes (15): ApplicationFilters, ApplicationFilterSheet(), LOCATION_OPTIONS, Props, STATUS_OPTIONS, EmptyApplications(), EmptySearchResults(), getInitials() (+7 more)

### Community 32 - "useColors"
Cohesion: 0.10
Nodes (19): Index(), Failed(), SelectDocument(), Upload(), ApartmentImage, PropertyOverview(), Props, EditPerks() (+11 more)

### Community 33 - "upload-id.tsx"
Cohesion: 0.22
Nodes (13): CaptureStepConfig, CaptureStepSummary(), CaptureStepSummaryProps, UploadId(), CaptureProgress, computeCanContinue(), getCaptureProgress(), IdCaptureResult (+5 more)

### Community 34 - "live-capture.tsx"
Cohesion: 0.16
Nodes (10): getNextCaptureStep(), CapturedPhoto, LiveCapture(), ScreenState, computeFillRatio(), computeGuidedFrameRect(), GuidedFrameOverlay(), GuidedFrameOverlayProps (+2 more)

### Community 35 - "manage-apartment/[apartmentId]/index.tsx"
Cohesion: 0.23
Nodes (7): MaintenanceRequestCard(), MaintenanceRequestCardProps, PropertyActionMenu(), Props, PropertyOverviewSkeleton(), TenantCard(), TenantCardProps

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
Cohesion: 0.12
Nodes (14): NotificationManager(), RootLayout(), ThemeInitializer(), Index(), DevBadge(), QueryProvider(), QueryProviderProps, useInAppNotificationBanner() (+6 more)

### Community 40 - "createMobileQueryClient"
Cohesion: 0.20
Nodes (10): createWrapper(), mockFetchApartmentDetails, mockFetchReviewsPreview, createWrapper(), createWrapper(), mockFetchTenantApplications, mockUseCurrentUser, createWrapper() (+2 more)

### Community 41 - "usePayouts.ts"
Cohesion: 0.17
Nodes (18): PayoutHistoryCard(), Props, PayoutsIndex(), PayoutDetail(), getPayoutPaymentsQueryKey(), getPayoutQueryKey(), getPayoutsQueryKey(), usePayout() (+10 more)

### Community 42 - "history/index.tsx"
Cohesion: 0.16
Nodes (14): ReceiptCardProps, PaymentHistoryCard(), PaymentHistoryCardProps, PaymentHistoryItem, PaymentHistoryFilters, PaymentHistoryFilterSheet(), PaymentSort, Props (+6 more)

### Community 43 - "payment/index.tsx"
Cohesion: 0.11
Nodes (24): validateCashPayment(), PaymentFooter(), PaymentFooterProps, PaymentSummaryCard(), PaymentSummaryCardProps, formatLeaseDate(), INITIAL_CARD, PaymentCheckout() (+16 more)

### Community 44 - "edit-main.tsx"
Cohesion: 0.21
Nodes (13): ApartmentInformation, DisplayImage, EditMain(), validateForm(), ApartmentMainFields, deleteStorageImage(), ExistingImage, PendingImage (+5 more)

### Community 45 - "audit-fix.characterization.test.ts"
Cohesion: 0.12
Nodes (10): ChatRow, mockChannel, mockChatRows, mockCreateSignedUrls, mockFrom, mockGetUser, mockRemoveChannel, mockStorageFrom (+2 more)

### Community 46 - "useApplicationActions.test.tsx"
Cohesion: 0.21
Nodes (12): getStatusStyle(), TenantApplicationDetails(), mockEq, mockFrom, mockUpdate, mockUseCurrentUser, useApplicationActions(), getLandlordApplicationsQueryKey() (+4 more)

### Community 47 - "visit-requests/index.tsx"
Cohesion: 0.18
Nodes (10): EmptyApproved(), VisitRequestCalendar(), VisitRequestCalendarProps, VisitRequestCardSkeleton(), getGroup(), Group, GROUP_ORDER, GroupedItem (+2 more)

### Community 48 - "(landlord)/profile.tsx"
Cohesion: 0.20
Nodes (12): SignIn(), CompleteProfileCard(), CompleteProfileCardProps, ProfileHeader(), ProfileHeaderProps, AccountStatus, StatusConfig, VerificationStatus() (+4 more)

### Community 49 - "ApplicationList.tsx"
Cohesion: 0.36
Nodes (3): ApplicationsList(), ApplicationsEmptyState(), ApplicationStatusCardSkeleton()

### Community 50 - "useTenancyRealtime.ts"
Cohesion: 0.24
Nodes (13): attachPaymentChannel(), attachSubscriber(), attachTenantChannel(), Channel, createRefSubscriber(), detachSubscriber(), getRecordString(), paymentChannels (+5 more)

### Community 51 - "DocumentCard.tsx"
Cohesion: 0.33
Nodes (7): DocumentCard(), DocumentCardProps, Index(), DOCUMENT_EXTENSIONS, getExtension(), IMAGE_EXTENSIONS, isImageUri()

### Community 52 - "third-process.tsx"
Cohesion: 0.28
Nodes (5): FormErrors, ThirdProcess(), FieldErrors, UploadFileField(), UploadFileFieldProps

### Community 53 - "useTenancy"
Cohesion: 0.16
Nodes (16): CurrentApartmentDetails(), formatDateToMonthYear(), getErrorMessage(), getRecordString(), getTenancyQueryKey(), mockChannel, mockFetchTenancy, mockRemoveChannel (+8 more)

### Community 54 - "useChatChannel.ts"
Cohesion: 0.16
Nodes (12): BroadcastEvent, BroadcastPayload, PresenceJoinEvent, PresenceLeaveEvent, PresenceState, ChannelHandler, MockChannel, mockChannels (+4 more)

### Community 55 - "rentals.tsx"
Cohesion: 0.14
Nodes (13): NotificationBellButton(), NotificationBellButtonProps, QuickActionButton(), QuickActionButtonProps, ApartmentDescriptionCard(), ApartmentDescriptionCardProps, PaymentSummaryCard(), PaymentSummaryCardProps (+5 more)

### Community 56 - "sign-in.tsx"
Cohesion: 0.28
Nodes (8): AuthButton(), AuthButtonProps, AuthDivider(), AuthDividerProps, RoleTab(), RoleTabProps, SignUp(), useGoogleAuth()

### Community 57 - "maintenance-requests/index.ts"
Cohesion: 0.07
Nodes (46): EmptyMaintenanceRequestsList(), MaintenanceRequestCard(), MaintenanceRequestCardProps, MaintenanceRequestCardSkeleton(), LOCATION_OPTIONS, MaintenanceRequestFilters, MaintenanceRequestFilterSheet(), Props (+38 more)

### Community 58 - "pending.tsx"
Cohesion: 0.22
Nodes (10): EmptyPending(), DATE_RANGE_OPTIONS, DateRange, Props, STATUS_OPTIONS, VisitRequestFilters, VisitRequestFilterSheet(), EMPTY_FILTERS (+2 more)

### Community 59 - "RescheduleSheet.tsx"
Cohesion: 0.18
Nodes (10): Period, Props, RescheduleSheet(), tomorrow, toSupabaseTime(), HOURS, Period, PERIODS (+2 more)

### Community 60 - "useApplicationFormStore.ts"
Cohesion: 0.12
Nodes (17): DocKey, getContentType(), MIME_MAP, SubmitArgs, SubmitResult, uploadDoc(), ApartmentContext, ApplicationFormState (+9 more)

### Community 61 - "useProfile"
Cohesion: 0.20
Nodes (10): RateApartment(), FifthStep(), Index(), PayoutAccount(), TabsLayout(), ApplicationApartment(), useProfile(), SubmitReviewParams (+2 more)

### Community 62 - "useInAppNotificationBanner.tsx"
Cohesion: 0.26
Nodes (8): getOpenChatConversationKey(), shouldSuppressChatToast(), useNotificationTapHandler(), markNotificationRead(), buildNotificationDeepLink(), NotificationData, parseConversationKey(), Role

### Community 63 - "onboarding.tsx"
Cohesion: 0.21
Nodes (7): { width }, OnBoardingSlide(), OnBoardingSlideProps, Slide, SLIDES, USER_ROLES, UserRole

### Community 64 - "applications/components/VisitRequestCard.tsx"
Cohesion: 0.16
Nodes (11): VisitRequestCard(), VisitRequestCardProps, Props, VisitRequest, VisitRequestCard(), Props, VisitRequestHistoryItem(), FALLBACK_STYLE() (+3 more)

### Community 65 - "ChatBubble.tsx"
Cohesion: 0.27
Nodes (8): calculateImageSize(), ChatBubble(), ChatBubbleProps, mockPlayer, VideoBubble(), VisualMediaBubble(), isEmojiOnly(), MessageType

### Community 66 - "visitRequests/index.ts"
Cohesion: 0.18
Nodes (12): VisitRequestDetails(), RequestVisit(), getLandlordVisitRequestsQueryKey(), useLandlordVisitRequests(), useRespondToReschedule(), useSubmitVisitRequest(), VisitRequestPayload, ActionStatus (+4 more)

### Community 67 - "fifth-step.tsx"
Cohesion: 0.20
Nodes (8): plugins, DEFAULT_COORDS, MAP_STYLE, LandlordCard(), LandlordCardProps, expo-font, expo-video, @maplibre/maplibre-react-native

### Community 68 - "dashboard.tsx"
Cohesion: 0.19
Nodes (10): DashboardSkeleton(), chartLabel(), ProfitByPropertyCard(), ProfitByPropertyCardProps, RentDueCard(), RentDueCardProps, MONTHS, EmptyState() (+2 more)

### Community 69 - "useLandlordPayments.ts"
Cohesion: 0.18
Nodes (14): PaymentHistoryScreen(), getLandlordPaymentsQueryKey(), useLandlordPaymentConfirmation(), useLandlordPayments(), useLandlordStats(), getLandlordTenancyQueryKey(), fetchLandlordPayments(), fetchLandlordStats() (+6 more)

### Community 70 - "captureSequences.ts"
Cohesion: 0.24
Nodes (8): ALL_SUPPORTED_ID_TYPES, CaptureCameraFacing, CaptureGuideShape, CARD_SEQUENCE, PASSPORT_SEQUENCE, SELFIE_STEP, SEQUENCE_BY_ID_TYPE, NON_PASSPORT_ID_TYPES

### Community 71 - "first-process.tsx"
Cohesion: 0.15
Nodes (13): FieldErrors, FirstProcess(), FormErrors, SecondProcess(), CashPaymentForm(), CashPaymentFormProps, DateField(), DateFieldProps (+5 more)

### Community 72 - "auth/index.ts"
Cohesion: 0.18
Nodes (11): UseCountdownOptions, createWrapper(), mockFrom, mockGetUser, profileRecord, useCurrentUserId(), getCurrentUser(), getUserProfileByColumn() (+3 more)

### Community 73 - "TabBar.tsx"
Cohesion: 0.31
Nodes (6): TabBar(), TabBarIcon(), TabBarIconProps, IconProps, LANDLORDICONS, TENANTICONS

### Community 74 - "live-capture.test.tsx"
Cohesion: 0.25
Nodes (8): captureAndReachReview(), DEFAULT_QUALITY_RESULT, mockBack, mockDismissTo, mockReplace, mockSearchParams, mockTakePictureAsync, setPermission()

### Community 75 - "tenantApplicationsService.ts"
Cohesion: 0.20
Nodes (11): getTenantApplicationsQueryKey(), useTenantApplications(), ApplicationDocument, ApplicationDocumentPathKey, ApplicationRow, DOCUMENT_DEFINITIONS, fetchTenantApplications(), TenantApplication (+3 more)

### Community 76 - "CustomTabBar.tsx"
Cohesion: 0.21
Nodes (9): CustomTabBar(), CustomTabConfig, Props, TabItemsProps, TablerIconComponent, LANDLORD_TABS, LandlordTabLayout(), TENANT_TABS (+1 more)

### Community 77 - "upload-id.test.tsx"
Cohesion: 0.25
Nodes (7): BACK_CAPTURE, FRONT_CAPTURE, mockBack, mockPush, mockReplace, mockUseFocusEffect, SELFIE_CAPTURE

### Community 78 - "applications/[applicationId].tsx"
Cohesion: 0.11
Nodes (16): FlatPayment, EmptyApplicationData(), TenantApplicationDetailsSkeleton(), EmptyRequestData(), MaintenanceDetails, MaintenanceErrors, ConfirmDialog(), Props (+8 more)

### Community 79 - "useTenancyRealtime.test.ts"
Cohesion: 0.20
Nodes (7): MockChannel, mockChannelFactory, MockChannelHandler, mockChannelsByName, MockPayload, MockPostgresFilter, mockRemoveChannel

### Community 80 - "second-step.tsx"
Cohesion: 0.31
Nodes (8): DEFAULT_COORDS, DEFAULT_ROOM_LIMITS, formatLimitMessage(), formatRange(), FormErrors, isZeroRange(), MAP_STYLE, SecondStep()

### Community 81 - "NotificationToast.tsx"
Cohesion: 0.15
Nodes (16): MOCK_TOASTS, MockRow, MockToast, NotificationToastDevScreen(), NotificationToastContentProps, NotificationToastOptions, showNotificationToast(), TOAST_VARIANT_BY_TYPE (+8 more)

### Community 82 - "applications/index.ts"
Cohesion: 0.27
Nodes (9): ApplicationStatusCard(), Props, ApplicationStatus, ApplicationStatusStyle, ChipColor, FALLBACK_STYLE(), useApplicationStatusStyles(), useCancelApplication() (+1 more)

### Community 83 - "useVisitRequest.ts"
Cohesion: 0.48
Nodes (5): getVisitRequestQueryKey(), useVisitRequest(), fetchVisitRequest(), VisitRequest, VisitRequestResult

### Community 84 - "maintenance-requests/[requestId].tsx"
Cohesion: 0.47
Nodes (3): EmptyMaintenanceRequestDetail(), ResolveRequestDialog(), ResolveRequestDialogProps

### Community 85 - "useLandlordTenancy.ts"
Cohesion: 0.40
Nodes (5): useLandlordTenancy(), fetchLandlordTenancy(), LandlordTenancyMaintenanceRequest, LandlordTenant, PaymentRecord

### Community 86 - "metro.config.js"
Cohesion: 0.33
Nodes (5): config, { getDefaultConfig }, monorepoRoot, path, { withUniwindConfig }

### Community 87 - "Welcome to your Expo app 👋"
Cohesion: 0.33
Nodes (5): Get a fresh project, Get started, Join the community, Learn more, Welcome to your Expo app 👋

### Community 89 - "uniwind-types.d.ts"
Cohesion: 0.50
Nodes (3): NOTE: This file is generated by uniwind and it should not be edited manually., uniwind, UniwindConfig

### Community 97 - "usePayoutBalances"
Cohesion: 0.60
Nodes (4): Balances, fetchBalances(), getPayoutBalancesQueryKey(), usePayoutBalances()

### Community 165 - "queryClient.ts"
Cohesion: 0.16
Nodes (15): EditProfile(), EditProfileForm, EMPTY_FORM, FormErrors, SuccessDialog(), SuccessDialogProps, BUCKET_MAP, UploadTarget (+7 more)

## Knowledge Gaps
- **643 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+638 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **69 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useColors()` connect `useColors` to `apartments/index.ts`, `StandardHeader.tsx`, `[landlordId].tsx`, `[tenantId].tsx`, `ProfitTrendCard.tsx`, `UploadImageField.tsx`, `useConversations.test.tsx`, `useFavorites`, `useApartmentFormStore`, `ErrorDialog.tsx`, `expo-router`, `review-information.tsx`, `(tenant)/chat.tsx`, `ai-search.tsx`, `usePersonalizationStore.ts`, `notifications/index.ts`, `useVerificationStore`, `[conversationId].tsx`, `NotificationList.tsx`, `PaymentMethodSelector.tsx`, `[paymentId].tsx`, `landlordService.ts`, `useTheme.ts`, `tenant-applications/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `units.tsx`, `queryClient.ts`, `app/_layout.tsx`, `usePayouts.ts`, `history/index.tsx`, `payment/index.tsx`, `useApplicationActions.test.tsx`, `visit-requests/index.tsx`, `(landlord)/profile.tsx`, `ApplicationList.tsx`, `DocumentCard.tsx`, `third-process.tsx`, `useTenancy`, `rentals.tsx`, `sign-in.tsx`, `maintenance-requests/index.ts`, `pending.tsx`, `RescheduleSheet.tsx`, `useProfile`, `applications/components/VisitRequestCard.tsx`, `ChatBubble.tsx`, `visitRequests/index.ts`, `fifth-step.tsx`, `dashboard.tsx`, `useLandlordPayments.ts`, `first-process.tsx`, `TabBar.tsx`, `CustomTabBar.tsx`, `applications/[applicationId].tsx`, `second-step.tsx`, `NotificationToast.tsx`, `applications/index.ts`, `maintenance-requests/[requestId].tsx`?**
  _High betweenness centrality (0.227) - this node is a cross-community bridge._
- **Why does `expo-router` connect `expo-router` to `apartments/index.ts`, `StandardHeader.tsx`, `[landlordId].tsx`, `[tenantId].tsx`, `useFavorites`, `useApartmentFormStore`, `ErrorDialog.tsx`, `review-information.tsx`, `(tenant)/chat.tsx`, `usePersonalizationStore.ts`, `useVerificationStore`, `[conversationId].tsx`, `payments/index.ts`, `NotificationList.tsx`, `[paymentId].tsx`, `useTheme.ts`, `tenant-applications/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `units.tsx`, `useFrameQualityCheck.ts`, `app/_layout.tsx`, `history/index.tsx`, `payment/index.tsx`, `edit-main.tsx`, `visit-requests/index.tsx`, `(landlord)/profile.tsx`, `ApplicationList.tsx`, `third-process.tsx`, `rentals.tsx`, `sign-in.tsx`, `maintenance-requests/index.ts`, `pending.tsx`, `useProfile`, `useInAppNotificationBanner.tsx`, `onboarding.tsx`, `fifth-step.tsx`, `dashboard.tsx`, `first-process.tsx`, `CustomTabBar.tsx`, `applications/[applicationId].tsx`, `second-step.tsx`, `applications/index.ts`, `maintenance-requests/[requestId].tsx`, `playground.tsx`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Why does `ScreenWrapper` connect `useTheme.ts` to `apartments/index.ts`, `StandardHeader.tsx`, `[landlordId].tsx`, `[tenantId].tsx`, `useFavorites`, `useApartmentFormStore`, `ErrorDialog.tsx`, `expo-router`, `review-information.tsx`, `(tenant)/chat.tsx`, `ai-search.tsx`, `usePersonalizationStore.ts`, `notifications/index.ts`, `useVerificationStore`, `[conversationId].tsx`, `useCurrentUser`, `payments/index.ts`, `tenant-applications/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `units.tsx`, `queryClient.ts`, `history/index.tsx`, `payment/index.tsx`, `edit-main.tsx`, `visit-requests/index.tsx`, `ApplicationList.tsx`, `third-process.tsx`, `rentals.tsx`, `sign-in.tsx`, `maintenance-requests/index.ts`, `pending.tsx`, `fifth-step.tsx`, `dashboard.tsx`, `first-process.tsx`, `applications/[applicationId].tsx`, `second-step.tsx`, `maintenance-requests/[requestId].tsx`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _643 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `apartments/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.056107539450613676 - nodes in this community are weakly interconnected._
- **Should `StandardHeader.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08571428571428572 - nodes in this community are weakly interconnected._
- **Should `[landlordId].tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14492753623188406 - nodes in this community are weakly interconnected._