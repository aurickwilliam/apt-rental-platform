# Graph Report - mobile  (2026-08-23)

## Corpus Check
- 445 files · ~635,987 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1996 nodes · 4724 edges · 165 communities (95 shown, 70 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.61)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4b0eb3f6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- apartments/index.ts
- ScreenWrapper.tsx
- useColors
- ratings/index.ts
- dashboard.tsx
- edit-main.tsx
- CustomTabBar.tsx
- useFavorites
- fifth-step.tsx
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
- notifications/index.ts
- useVerificationStore
- chatService.ts
- [conversationId].tsx
- NotificationScreen.tsx
- payments/index.ts
- paths
- NotificationToast.tsx
- PaymentMethodSelector.tsx
- payment-history.tsx
- landlordService.ts
- description/index.tsx
- tenant-applications/index.tsx
- rentals.tsx
- upload-id.tsx
- live-capture.tsx
- manage-apartment/[apartmentId]/index.tsx
- units.tsx
- useFrameQualityCheck.ts
- dependencies
- app/_layout.tsx
- queryClient.ts
- maintenanceService.ts
- history/index.tsx
- payment/index.tsx
- createMobileQueryClient
- audit-fix.characterization.test.ts
- useApplicationActions.test.tsx
- visit-requests/index.tsx
- maintenance-requests/index.ts
- tenantApplicationsService.ts
- useTenancyRealtime.ts
- document-id/index.tsx
- maintenance-requests/index.tsx
- useTenancy
- useChatChannel.ts
- chatService.pagination.test.ts
- sign-in.tsx
- useMaintenanceRequestStatusStyles
- pending.tsx
- RescheduleSheet.tsx
- paymongoService.ts
- auth/index.ts
- useInAppNotificationBanner.tsx
- onboarding.tsx
- visitRequests/index.ts
- ChatBubble.tsx
- useLandlordActionBadges
- applications/index.ts
- applications/[applicationId].tsx
- useLandlordPayments.ts
- captureSequences.ts
- useLandlordVisitRequests
- useTenancyRealtime.test.ts
- TabBar.tsx
- live-capture.test.tsx
- useProfile
- ApplicationList.tsx
- upload-id.test.tsx
- tenant-applications/[applicationId].tsx
- applications/components/VisitRequestCard.tsx
- ReceiptCard.tsx
- useNotificationRealtime.ts
- useLandlordTenancy.ts
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
1. `useColors()` - 322 edges
2. `expo-router` - 132 edges
3. `ScreenWrapper` - 103 edges
4. `StandardHeader()` - 55 edges
5. `useCurrentUser()` - 46 edges
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
- `ThirdProcess()` --calls--> `useApplicationFormStore`  [EXTRACTED]
  app/apartment/[apartmentId]/apply/third-process.tsx → stores/useApplicationFormStore.ts
- `Upload()` --calls--> `useColors()`  [EXTRACTED]
  app/document-id/upload.tsx → hooks/useTheme.ts

## Import Cycles
- 2-file cycle: `hooks/applications/index.ts -> hooks/applications/useApplicationActions.ts -> hooks/applications/index.ts`
- 2-file cycle: `hooks/applications/index.ts -> service/applications/tenantApplicationsService.ts -> hooks/applications/index.ts`
- 3-file cycle: `hooks/payments/index.ts -> hooks/payments/usePayments.ts -> service/payments/paymentService.ts -> hooks/payments/index.ts`
- 3-file cycle: `hooks/applications/index.ts -> hooks/applications/useTenantApplications.ts -> service/applications/tenantApplicationsService.ts -> hooks/applications/index.ts`

## Communities (165 total, 70 thin omitted)

### Community 0 - "apartments/index.ts"
Cohesion: 0.05
Nodes (46): ApartmentSummary(), ApartmentSkeleton(), IconButton(), IconButtonProps, IconComponent, ApartmentDescriptionSection(), ApartmentDescriptionSectionProps, ApartmentDetailsSection() (+38 more)

### Community 1 - "ScreenWrapper.tsx"
Cohesion: 0.08
Nodes (23): DOCUMENT_TYPE_ICONS, SORT_OPTIONS, EmptyRequestData(), TODO: Implement function to handle report landlord, AboutScreen(), developers, socials, faqs (+15 more)

### Community 2 - "useColors"
Cohesion: 0.07
Nodes (37): RatingBarCount(), RatingBarCountProps, Index(), OTPVerification(), ResetPassword(), OTPVerification(), SignIn(), Failed() (+29 more)

### Community 3 - "ratings/index.ts"
Cohesion: 0.07
Nodes (43): ApartmentScreen(), RateApartment(), RatingsPage(), ReviewsPage(), PublicLandlordProfile(), PublicTenantProfile(), getPublicLandlordProfileQueryKey(), usePublicLandlordProfile() (+35 more)

### Community 4 - "dashboard.tsx"
Cohesion: 0.06
Nodes (38): DashboardSkeleton(), chartLabel(), ProfitByPropertyCard(), ProfitByPropertyCardProps, BUILDERS, ChartDatum, FilterOption, filterOptions (+30 more)

### Community 5 - "edit-main.tsx"
Cohesion: 0.07
Nodes (38): FormErrors, ThirdProcess(), TODO: Persist the uploaded document to Supabase Storage and store its, Upload(), EditProfile(), FifthStep(), ApartmentInformation, DisplayImage (+30 more)

### Community 6 - "CustomTabBar.tsx"
Cohesion: 0.06
Nodes (39): getLastMessageDisplay(), MessageCard(), MessageCardProps, CustomTabBar(), CustomTabConfig, Props, TabItemsProps, TablerIconComponent (+31 more)

### Community 7 - "useFavorites"
Cohesion: 0.08
Nodes (37): ApartmentsList(), ApartmentsListProps, DEFAULT_FILTERS, FilterBottomSheet(), FilterState, Props, ROOM_OPTS, SearchFiltersBar() (+29 more)

### Community 8 - "fifth-step.tsx"
Cohesion: 0.07
Nodes (33): FieldErrors, FormErrors, Amenities(), DEFAULT_COORDS, MAP_STYLE, FourthStep(), FormErrors, Index() (+25 more)

### Community 9 - "edit-profile.tsx"
Cohesion: 0.08
Nodes (30): RateApartmentSkeleton(), ErrorDialogState, FormErrors, TenancyLeasePeriod, AuthCompleteProfile(), ProfileForm, requiredFields, CompleteProfile() (+22 more)

### Community 10 - "devDependencies"
Cohesion: 0.05
Nodes (42): eslint, eslint-config-expo, eslint-import-resolver-typescript, expo-doctor, fast-check, jest, jest-expo, metro-minify-terser (+34 more)

### Community 11 - "expo"
Cohesion: 0.05
Nodes (39): backgroundColor, foregroundImage, adaptiveIcon, googleServicesFile, package, permissions, predictiveBackGestureEnabled, softwareKeyboardLayoutMode (+31 more)

### Community 13 - "review-information.tsx"
Cohesion: 0.08
Nodes (28): ReviewAccordionItem(), ReviewAccordionItemProps, ReviewDocumentFile(), ReviewDocumentFileProps, ReviewDocumentImage(), ReviewDocumentImageProps, FirstProcess(), ReviewInformation() (+20 more)

### Community 14 - "privateMediaResolver.ts"
Cohesion: 0.11
Nodes (27): DocEntry, ResolvedDoc, DocumentEntriesProps, mockResolvePrivateMediaUrls, useDocumentUrls(), cacheKey(), chatMediaRetryKeys, claimChatMediaRetry() (+19 more)

### Community 15 - "paymentService.ts"
Cohesion: 0.11
Nodes (25): History(), getPaymentQueryKey(), getRefundsQueryKey(), usePayment(), usePaymentByReference(), usePayments(), useRefundForPayment(), useRequestRefund() (+17 more)

### Community 16 - "images.ts"
Cohesion: 0.10
Nodes (16): ChatHeader(), ChatHeaderProps, AIHeaderProps, Add(), PAYMENT_METHOD_TYPES, PaymentMethodType, getLogoSource(), maskMobileNumber() (+8 more)

### Community 17 - "ai-search.tsx"
Cohesion: 0.11
Nodes (19): AISearchScreen(), SUGGESTION_CHIPS, AIHeader(), EmptyChatState(), MessageBubble(), MessageBubbleProps, MessageComposer(), MessageComposerProps (+11 more)

### Community 18 - "usePersonalizationStore.ts"
Cohesion: 0.12
Nodes (20): CityCheckBox(), CityCheckBoxProps, PersonalizationProgress(), Props, PersonalizationRadioButton(), PersonalizationRadioButtonProps, StepFive(), StepFour() (+12 more)

### Community 19 - "notifications/index.ts"
Cohesion: 0.16
Nodes (19): GENERAL_TOGGLES, GeneralToggleKey, NOTIFICATION_TYPE_LABELS, getNotificationPreferencesQueryKey(), createWrapper(), mockFetchNotificationPreferences, mockUpdateNotificationPreferences, mockUseCurrentUser (+11 more)

### Community 20 - "useVerificationStore"
Cohesion: 0.15
Nodes (17): getCaptureSequence(), SelectId(), SelfiePrep(), Success(), UploadSelfie(), StepProgress(), StepProgressProps, useVerificationStore (+9 more)

### Community 21 - "chatService.ts"
Cohesion: 0.14
Nodes (23): Options, AttachmentUploadFailure, buildOlderThanChatMessageFilter(), ChatMessageCursor, ChatMessagePage, EXTENSION_BY_MIME_TYPE, fetchMessagePage(), fetchMessages() (+15 more)

### Community 22 - "[conversationId].tsx"
Cohesion: 0.13
Nodes (16): ATTACHMENT_OPTIONS, ChatBox(), ChatBoxProps, StagedAsset, ChatEmptyState(), ChatEmptyStateProps, ChatLoadingSkeleton(), ChatScreen() (+8 more)

### Community 23 - "NotificationScreen.tsx"
Cohesion: 0.17
Nodes (15): NotificationCardType, NotificationFilter, NotificationList(), NotificationListProps, NotificationScreen(), NotificationScreenProps, useNotificationActions(), getErrorMessage() (+7 more)

### Community 24 - "payments/index.ts"
Cohesion: 0.21
Nodes (18): PayoutAccountForm(), CreatePayoutDestinationParams, getPayoutDestinationsQueryKey(), UpdatePayoutDestinationParams, useCreatePayoutDestination(), useDeletePayoutDestination(), usePayoutDestinations(), useUpdatePayoutDestination() (+10 more)

### Community 25 - "paths"
Cohesion: 0.09
Nodes (22): ./assets/*, ./components/*, ./constants/*, expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.ts, ./hooks/*, ../../packages/ui/* (+14 more)

### Community 26 - "NotificationToast.tsx"
Cohesion: 0.16
Nodes (18): MOCK_TOASTS, MockRow, MockToast, NotificationToastDevScreen(), NotificationCard(), NotificationCardProps, NotificationSettingsScreen(), NotificationToastContent() (+10 more)

### Community 27 - "PaymentMethodSelector.tsx"
Cohesion: 0.13
Nodes (18): CardInformation, CardPaymentForm(), CardPaymentFormProps, CashPaymentErrors, CashPaymentForm(), CashPaymentFormProps, PaymentMethodButton(), PaymentMethodButtonProps (+10 more)

### Community 28 - "payment-history.tsx"
Cohesion: 0.23
Nodes (16): PaymentHistoryCard(), PaymentHistoryCardProps, FlatPayment, PaymentHistoryScreen(), toFlatPayment(), ReceiptCard(), toHistoryItem(), PaymentReceipt() (+8 more)

### Community 29 - "landlordService.ts"
Cohesion: 0.11
Nodes (19): Index(), useLandlordStats(), DB_TO_DISPLAY_STATUS, DbStatus, DISPLAY_TO_DB_STATUS, fetchLandlordStats(), fetchManageApartmentDescription(), getManageApartmentDescriptionQueryKey() (+11 more)

### Community 30 - "description/index.tsx"
Cohesion: 0.15
Nodes (12): PerksSectionProps, EditPerks(), BasePerkButtonProps, PerkButton(), PerkButtonProps, Divider(), DividerProps, BasePerkItemProps (+4 more)

### Community 31 - "tenant-applications/index.tsx"
Cohesion: 0.14
Nodes (14): ApplicationFilters, ApplicationFilterSheet(), LOCATION_OPTIONS, Props, STATUS_OPTIONS, EmptyApplications(), EmptySearchResults(), getInitials() (+6 more)

### Community 32 - "rentals.tsx"
Cohesion: 0.13
Nodes (13): QuickActionButton(), QuickActionButtonProps, ApartmentDescriptionCard(), ApartmentDescriptionCardProps, PaymentSummaryCard(), PaymentSummaryCardProps, TenancyEmptyState(), actions (+5 more)

### Community 33 - "upload-id.tsx"
Cohesion: 0.22
Nodes (13): CaptureStepConfig, CaptureStepSummary(), CaptureStepSummaryProps, UploadId(), CaptureProgress, computeCanContinue(), getCaptureProgress(), IdCaptureResult (+5 more)

### Community 34 - "live-capture.tsx"
Cohesion: 0.16
Nodes (10): getNextCaptureStep(), CapturedPhoto, LiveCapture(), ScreenState, computeFillRatio(), computeGuidedFrameRect(), GuidedFrameOverlay(), GuidedFrameOverlayProps (+2 more)

### Community 35 - "manage-apartment/[apartmentId]/index.tsx"
Cohesion: 0.15
Nodes (12): MaintenanceRequestCard(), MaintenanceRequestCardProps, PropertyActionMenu(), Props, ApartmentImage, PropertyOverview(), Props, PropertyOverviewSkeleton() (+4 more)

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
Cohesion: 0.16
Nodes (12): NotificationManager(), RootLayout(), ThemeInitializer(), Index(), DevBadge(), useInAppNotificationBanner(), useNotificationTapHandler(), useTheme() (+4 more)

### Community 40 - "queryClient.ts"
Cohesion: 0.16
Nodes (13): QueryProvider(), QueryProviderProps, createWrapper(), mockFrom, mockGetUser, profileRecord, CURRENT_USER_QUERY_KEY, queryClient (+5 more)

### Community 41 - "maintenanceService.ts"
Cohesion: 0.21
Nodes (14): MaintenanceHistory(), getMaintenanceRequestHistoryQueryKey(), useMaintenanceRequestHistory(), UseMaintenanceRequestHistoryParams, getLatestMaintenanceRequestQueryKey(), useMaintenanceRequests(), UseMaintenanceRequestsParams, cancelMaintenanceRequest() (+6 more)

### Community 42 - "history/index.tsx"
Cohesion: 0.17
Nodes (13): PaymentHistoryCard(), PaymentHistoryCardProps, PaymentHistoryItem, PaymentHistoryFilters, PaymentHistoryFilterSheet(), PaymentSort, Props, SORT_OPTIONS (+5 more)

### Community 43 - "payment/index.tsx"
Cohesion: 0.20
Nodes (13): validateCashPayment(), PaymentFooter(), PaymentFooterProps, PaymentSummaryCard(), PaymentSummaryCardProps, formatLeaseDate(), INITIAL_CARD, PaymentCheckout() (+5 more)

### Community 44 - "createMobileQueryClient"
Cohesion: 0.15
Nodes (13): createWrapper(), mockFetchApartmentDetails, mockFetchReviewsPreview, createWrapper(), createWrapper(), mockFetchTenantApplications, mockUseCurrentUser, createWrapper() (+5 more)

### Community 45 - "audit-fix.characterization.test.ts"
Cohesion: 0.12
Nodes (10): ChatRow, mockChannel, mockChatRows, mockCreateSignedUrls, mockFrom, mockGetUser, mockRemoveChannel, mockStorageFrom (+2 more)

### Community 46 - "useApplicationActions.test.tsx"
Cohesion: 0.21
Nodes (12): getStatusStyle(), TenantApplicationDetails(), mockEq, mockFrom, mockUpdate, mockUseCurrentUser, useApplicationActions(), getLandlordApplicationsQueryKey() (+4 more)

### Community 47 - "visit-requests/index.tsx"
Cohesion: 0.18
Nodes (10): EmptyApproved(), VisitRequestCalendar(), VisitRequestCalendarProps, VisitRequestCardSkeleton(), getGroup(), Group, GROUP_ORDER, GroupedItem (+2 more)

### Community 48 - "maintenance-requests/index.ts"
Cohesion: 0.24
Nodes (12): RequestMaintenance(), getLandlordMaintenanceRequestsQueryKey(), getNextStatus(), STATUS_FLOW, useLandlordMaintenanceRequests(), MaintenanceCategorySlug, MaintenanceUrgencySlug, SubmitMaintenanceRequestInput (+4 more)

### Community 49 - "tenantApplicationsService.ts"
Cohesion: 0.20
Nodes (11): getTenantApplicationsQueryKey(), useTenantApplications(), ApplicationDocument, ApplicationDocumentPathKey, ApplicationRow, DOCUMENT_DEFINITIONS, fetchTenantApplications(), TenantApplication (+3 more)

### Community 50 - "useTenancyRealtime.ts"
Cohesion: 0.24
Nodes (13): attachPaymentChannel(), attachSubscriber(), attachTenantChannel(), Channel, createRefSubscriber(), detachSubscriber(), getRecordString(), paymentChannels (+5 more)

### Community 51 - "document-id/index.tsx"
Cohesion: 0.23
Nodes (11): DocumentCard(), DocumentCardProps, Index(), TODO: Implement contact support functionality,, TODO: Fetch and display user's uploaded documents and IDs here. This may…, UploadedDocument, DOCUMENT_EXTENSIONS, getExtension() (+3 more)

### Community 52 - "maintenance-requests/index.tsx"
Cohesion: 0.19
Nodes (10): EmptyMaintenanceRequestsList(), MaintenanceRequestCardSkeleton(), LOCATION_OPTIONS, MaintenanceRequestFilters, MaintenanceRequestFilterSheet(), Props, STATUS_OPTIONS, URGENCY_OPTIONS (+2 more)

### Community 53 - "useTenancy"
Cohesion: 0.24
Nodes (12): CurrentApartmentDetails(), formatDateToMonthYear(), getErrorMessage(), getRecordString(), getTenancyQueryKey(), useTenancy(), CurrentTenancy, fetchTenancy() (+4 more)

### Community 54 - "useChatChannel.ts"
Cohesion: 0.16
Nodes (12): BroadcastEvent, BroadcastPayload, PresenceJoinEvent, PresenceLeaveEvent, PresenceState, ChannelHandler, MockChannel, mockChannels (+4 more)

### Community 55 - "chatService.pagination.test.ts"
Cohesion: 0.16
Nodes (9): ChatMessagePlacement, mergeChatMessages(), Message, ChatRow, mockFrom, mockStorageFrom, pageResponses, QueryLog (+1 more)

### Community 56 - "sign-in.tsx"
Cohesion: 0.28
Nodes (8): AuthButton(), AuthButtonProps, AuthDivider(), AuthDividerProps, RoleTab(), RoleTabProps, SignUp(), useGoogleAuth()

### Community 57 - "useMaintenanceRequestStatusStyles"
Cohesion: 0.26
Nodes (10): MaintenanceRequestCard(), MaintenanceRequestCardProps, MaintenanceRequestDetails(), MaintenanceRequestCard(), MaintenanceRequestCardProps, MaintenanceDetails(), StatusStyle, useMaintenanceRequestStatusStyles() (+2 more)

### Community 58 - "pending.tsx"
Cohesion: 0.22
Nodes (10): EmptyPending(), DATE_RANGE_OPTIONS, DateRange, Props, STATUS_OPTIONS, VisitRequestFilters, VisitRequestFilterSheet(), EMPTY_FILTERS (+2 more)

### Community 59 - "RescheduleSheet.tsx"
Cohesion: 0.18
Nodes (10): Period, Props, RescheduleSheet(), tomorrow, toSupabaseTime(), HOURS, Period, PERIODS (+2 more)

### Community 60 - "paymongoService.ts"
Cohesion: 0.17
Nodes (11): EWalletRedirect(), extractError(), getCheckoutSessionStatus(), invoke(), PaymongoCard, PaymongoCardPaymentResult, PaymongoCheckoutSession, PaymongoEnvelope (+3 more)

### Community 61 - "auth/index.ts"
Cohesion: 0.33
Nodes (8): UseCountdownOptions, useCurrentUser(), useCurrentUserId(), getCurrentUser(), getUserProfileByColumn(), getUserProfileById(), UserProfile, setPrivateMediaCacheUser()

### Community 62 - "useInAppNotificationBanner.tsx"
Cohesion: 0.28
Nodes (6): getOpenChatConversationKey(), shouldSuppressChatToast(), buildNotificationDeepLink(), NotificationData, parseConversationKey(), Role

### Community 63 - "onboarding.tsx"
Cohesion: 0.21
Nodes (7): { width }, OnBoardingSlide(), OnBoardingSlideProps, Slide, SLIDES, USER_ROLES, UserRole

### Community 64 - "visitRequests/index.ts"
Cohesion: 0.33
Nodes (8): VisitRequestCard(), VisitRequestCardProps, Props, VisitRequestHistoryItem(), FALLBACK_STYLE(), StatusStyle, useVisitRequestStatusStyles(), VisitRequestStatus

### Community 65 - "ChatBubble.tsx"
Cohesion: 0.27
Nodes (8): calculateImageSize(), ChatBubble(), ChatBubbleProps, mockPlayer, VideoBubble(), VisualMediaBubble(), isEmojiOnly(), MessageType

### Community 66 - "useLandlordActionBadges"
Cohesion: 0.22
Nodes (10): TenantApplications(), Units(), EMPTY_COUNTS, getLandlordBadgesQueryKey(), useLandlordActionBadges(), ActionBadgeCategory, ActionBadgeCounts, fetchLandlordApartmentIds() (+2 more)

### Community 67 - "applications/index.ts"
Cohesion: 0.33
Nodes (8): ApplicationStatusCard(), Props, ApplicationStatus, ApplicationStatusStyle, ChipColor, FALLBACK_STYLE(), useApplicationStatusStyles(), LandlordApplication

### Community 68 - "applications/[applicationId].tsx"
Cohesion: 0.25
Nodes (7): ApplicationApartment(), DocumentRow(), DocumentRowProps, getExtension(), IMAGE_EXTENSIONS, useCancelApplication(), useRespondToReschedule()

### Community 69 - "useLandlordPayments.ts"
Cohesion: 0.25
Nodes (8): getLandlordPaymentsQueryKey(), useLandlordPayments(), fetchLandlordPayments(), LandlordPaymentRecord, mockFrom, QueryResult, ROW, updateLandlordPaymentStatus()

### Community 70 - "captureSequences.ts"
Cohesion: 0.24
Nodes (8): ALL_SUPPORTED_ID_TYPES, CaptureCameraFacing, CaptureGuideShape, CARD_SEQUENCE, PASSPORT_SEQUENCE, SELFIE_STEP, SEQUENCE_BY_ID_TYPE, NON_PASSPORT_ID_TYPES

### Community 71 - "useLandlordVisitRequests"
Cohesion: 0.24
Nodes (8): VisitRequestDetails(), getLandlordVisitRequestsQueryKey(), useLandlordVisitRequests(), ActionStatus, useVisitRequestActions(), fetchLandlordVisitRequests(), LandlordVisitRequest, resolveApartmentImageUrls()

### Community 72 - "useTenancyRealtime.test.ts"
Cohesion: 0.20
Nodes (7): MockChannel, mockChannelFactory, MockChannelHandler, mockChannelsByName, MockPayload, MockPostgresFilter, mockRemoveChannel

### Community 73 - "TabBar.tsx"
Cohesion: 0.31
Nodes (6): TabBar(), TabBarIcon(), TabBarIconProps, IconProps, LANDLORDICONS, TENANTICONS

### Community 74 - "live-capture.test.tsx"
Cohesion: 0.25
Nodes (8): captureAndReachReview(), DEFAULT_QUALITY_RESULT, mockBack, mockDismissTo, mockReplace, mockSearchParams, mockTakePictureAsync, setPermission()

### Community 75 - "useProfile"
Cohesion: 0.32
Nodes (6): PayoutAccount(), TabsLayout(), RequestVisit(), useProfile(), useSubmitVisitRequest(), VisitRequestPayload

### Community 76 - "ApplicationList.tsx"
Cohesion: 0.36
Nodes (3): ApplicationsList(), ApplicationsEmptyState(), ApplicationStatusCardSkeleton()

### Community 77 - "upload-id.test.tsx"
Cohesion: 0.25
Nodes (7): BACK_CAPTURE, FRONT_CAPTURE, mockBack, mockPush, mockReplace, mockUseFocusEffect, SELFIE_CAPTURE

### Community 78 - "tenant-applications/[applicationId].tsx"
Cohesion: 0.38
Nodes (4): EmptyApplicationData(), TenantApplicationDetailsSkeleton(), RejectDialog(), RejectDialogProps

### Community 79 - "applications/components/VisitRequestCard.tsx"
Cohesion: 0.29
Nodes (3): Props, VisitRequest, VisitRequestCard()

### Community 80 - "ReceiptCard.tsx"
Cohesion: 0.33
Nodes (4): ReceiptCardProps, STATUS_META, ZigzagEdge(), ZigzagEdgeProps

### Community 81 - "useNotificationRealtime.ts"
Cohesion: 0.43
Nodes (6): attach(), ChannelEntry, detach(), handleEvent(), registry, useNotificationRealtime()

### Community 82 - "useLandlordTenancy.ts"
Cohesion: 0.38
Nodes (6): getLandlordTenancyQueryKey(), useLandlordTenancy(), fetchLandlordTenancy(), LandlordTenancyMaintenanceRequest, LandlordTenant, PaymentRecord

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
- **635 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+630 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **70 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useColors()` connect `useColors` to `apartments/index.ts`, `ScreenWrapper.tsx`, `ratings/index.ts`, `dashboard.tsx`, `edit-main.tsx`, `CustomTabBar.tsx`, `useFavorites`, `fifth-step.tsx`, `edit-profile.tsx`, `review-information.tsx`, `paymentService.ts`, `images.ts`, `ai-search.tsx`, `usePersonalizationStore.ts`, `notifications/index.ts`, `useVerificationStore`, `[conversationId].tsx`, `NotificationToast.tsx`, `PaymentMethodSelector.tsx`, `payment-history.tsx`, `landlordService.ts`, `description/index.tsx`, `tenant-applications/index.tsx`, `rentals.tsx`, `upload-id.tsx`, `live-capture.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `units.tsx`, `app/_layout.tsx`, `maintenanceService.ts`, `history/index.tsx`, `useApplicationActions.test.tsx`, `visit-requests/index.tsx`, `maintenance-requests/index.ts`, `document-id/index.tsx`, `maintenance-requests/index.tsx`, `useTenancy`, `sign-in.tsx`, `useMaintenanceRequestStatusStyles`, `pending.tsx`, `RescheduleSheet.tsx`, `visitRequests/index.ts`, `ChatBubble.tsx`, `useLandlordActionBadges`, `applications/index.ts`, `applications/[applicationId].tsx`, `useLandlordVisitRequests`, `TabBar.tsx`, `useProfile`, `ApplicationList.tsx`, `tenant-applications/[applicationId].tsx`, `applications/components/VisitRequestCard.tsx`, `ReceiptCard.tsx`, `maintenance-requests/[requestId].tsx`?**
  _High betweenness centrality (0.231) - this node is a cross-community bridge._
- **Why does `expo-router` connect `expo-router` to `apartments/index.ts`, `ScreenWrapper.tsx`, `useColors`, `dashboard.tsx`, `edit-main.tsx`, `CustomTabBar.tsx`, `useFavorites`, `fifth-step.tsx`, `edit-profile.tsx`, `review-information.tsx`, `images.ts`, `usePersonalizationStore.ts`, `useVerificationStore`, `[conversationId].tsx`, `NotificationScreen.tsx`, `payment-history.tsx`, `description/index.tsx`, `tenant-applications/index.tsx`, `rentals.tsx`, `upload-id.tsx`, `live-capture.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `units.tsx`, `useFrameQualityCheck.ts`, `app/_layout.tsx`, `history/index.tsx`, `payment/index.tsx`, `visit-requests/index.tsx`, `document-id/index.tsx`, `maintenance-requests/index.tsx`, `sign-in.tsx`, `pending.tsx`, `useInAppNotificationBanner.tsx`, `onboarding.tsx`, `applications/index.ts`, `applications/[applicationId].tsx`, `useProfile`, `ApplicationList.tsx`, `tenant-applications/[applicationId].tsx`, `maintenance-requests/[requestId].tsx`, `playground.tsx`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Why does `ScreenWrapper` connect `ScreenWrapper.tsx` to `apartments/index.ts`, `useColors`, `dashboard.tsx`, `edit-main.tsx`, `CustomTabBar.tsx`, `useFavorites`, `fifth-step.tsx`, `edit-profile.tsx`, `review-information.tsx`, `images.ts`, `ai-search.tsx`, `usePersonalizationStore.ts`, `notifications/index.ts`, `useVerificationStore`, `[conversationId].tsx`, `NotificationScreen.tsx`, `payment-history.tsx`, `description/index.tsx`, `tenant-applications/index.tsx`, `rentals.tsx`, `upload-id.tsx`, `live-capture.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `units.tsx`, `history/index.tsx`, `payment/index.tsx`, `visit-requests/index.tsx`, `document-id/index.tsx`, `maintenance-requests/index.tsx`, `sign-in.tsx`, `pending.tsx`, `applications/[applicationId].tsx`, `ApplicationList.tsx`, `tenant-applications/[applicationId].tsx`, `maintenance-requests/[requestId].tsx`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _635 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `apartments/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.051203277009728626 - nodes in this community are weakly interconnected._
- **Should `ScreenWrapper.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07868852459016394 - nodes in this community are weakly interconnected._
- **Should `useColors` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._