# Graph Report - mobile  (2026-08-29)

## Corpus Check
- 447 files · ~637,604 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1988 nodes · 4720 edges · 172 communities (103 shown, 69 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `20d4923f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- apartments/index.ts
- ScreenWrapper.tsx
- edit-profile.tsx
- ratings/index.ts
- dashboardService.ts
- fifth-step.tsx
- useConversations.test.tsx
- search.tsx
- useApartmentFormStore
- useColors
- devDependencies
- expo
- expo-router
- tenant-applications/[applicationId].tsx
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
- payment-history/[paymentId].tsx
- landlordService.ts
- useTheme.ts
- tenant-applications/index.tsx
- manage-apartment/[apartmentId]/index.tsx
- upload-id.tsx
- live-capture.tsx
- ProfitTrendCard.tsx
- units.tsx
- useFrameQualityCheck.ts
- emoji-regex-xs
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
- document-id/index.tsx
- pending.tsx
- visit-requests/index.tsx
- useChatChannel.ts
- review-information.tsx
- reviews/index.tsx
- rentals.tsx
- dependencies
- RescheduleSheet.tsx
- useApplicationFormStore.ts
- chatService.pagination.test.ts
- useInAppNotificationBanner.tsx
- onboarding.tsx
- visitRequests/index.ts
- ChatBubble.tsx
- MaintenanceRequestFilterSheet.tsx
- useTenancyRealtime.test.ts
- map-view.tsx
- useLandlordPayments.ts
- captureSequences.ts
- applications/[applicationId].tsx
- useProfile
- TabBar.tsx
- live-capture.test.tsx
- applications/index.ts
- CustomTabBar.tsx
- upload-id.test.tsx
- sign-in.tsx
- UploadImageField.tsx
- third-process.tsx
- ProfitByPropertyCard.tsx
- applications/components/VisitRequestCard.tsx
- notification-toast.tsx
- ReceiptCard.tsx
- maintenance-requests/index.tsx
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
- ApplicationFilterSheet.tsx
- expo-device
- expo-document-picker
- expo-file-system
- expo-font
- expo-haptics
- expo-image
- expo-image-manipulator
- expo-image-picker
- expo-linear-gradient
- useLandlordTenancy.ts
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
- useSubmitReview.ts
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
- tenantApplicationsService.test.ts
- react-native-maps
- react-native-svg-transformer
- @repo/supabase

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
- 2-file cycle: `hooks/applications/index.ts -> service/applications/tenantApplicationsService.ts -> hooks/applications/index.ts`
- 2-file cycle: `hooks/applications/index.ts -> hooks/applications/useApplicationActions.ts -> hooks/applications/index.ts`
- 3-file cycle: `hooks/applications/index.ts -> hooks/applications/useTenantApplications.ts -> service/applications/tenantApplicationsService.ts -> hooks/applications/index.ts`
- 3-file cycle: `hooks/payments/index.ts -> hooks/payments/usePayments.ts -> service/payments/paymentService.ts -> hooks/payments/index.ts`

## Communities (172 total, 69 thin omitted)

### Community 0 - "apartments/index.ts"
Cohesion: 0.07
Nodes (35): ApartmentSummary(), ApartmentSkeleton(), ApartmentDescriptionSection(), ApartmentDescriptionSectionProps, ApartmentDetailsSection(), ApartmentDetailsSectionProps, ApartmentHeroSection(), ApartmentHeroSectionProps (+27 more)

### Community 1 - "ScreenWrapper.tsx"
Cohesion: 0.07
Nodes (25): RateApartmentSkeleton(), ErrorDialogState, FormErrors, TenancyLeasePeriod, DOCUMENT_TYPE_ICONS, TODO: Persist the uploaded document to Supabase Storage and store its, AnalyticsScreen(), MAX_AMOUNT (+17 more)

### Community 2 - "edit-profile.tsx"
Cohesion: 0.15
Nodes (12): EditProfile(), EditProfileForm, EMPTY_FORM, FormErrors, SuccessDialog(), SuccessDialogProps, DropdownFieldProps, SearchInputProps (+4 more)

### Community 3 - "ratings/index.ts"
Cohesion: 0.16
Nodes (20): ApartmentScreen(), ApartmentReview, formatLeaseDuration(), getApartmentReviewsQueryKey(), getErrorMessage(), RatingBarCountData, useApartmentReviews(), UseApartmentReviewsResult (+12 more)

### Community 4 - "dashboardService.ts"
Cohesion: 0.17
Nodes (13): Dashboard(), EMPTY_DASHBOARD_DATA, getDashboardDataQueryKey(), getErrorMessage(), useDashboardData(), DashboardData, DashboardStats, fetchDashboardData() (+5 more)

### Community 5 - "fifth-step.tsx"
Cohesion: 0.11
Nodes (16): PerksSectionProps, DEFAULT_COORDS, MAP_STYLE, EditPerks(), BasePerkButtonProps, PerkButton(), PerkButtonProps, CurrentApartmentDetails() (+8 more)

### Community 6 - "useConversations.test.tsx"
Cohesion: 0.10
Nodes (27): Chat(), Chat(), getConversationsQueryKey(), NewChatRow, createWrapper(), mockChannelFn, mockFetchConversations, mockGetChannels (+19 more)

### Community 7 - "search.tsx"
Cohesion: 0.06
Nodes (46): PublicLandlordProfile(), PublicTenantProfile(), ApartmentsList(), ApartmentsListProps, DEFAULT_FILTERS, FilterBottomSheet(), FilterState, Props (+38 more)

### Community 8 - "useApartmentFormStore"
Cohesion: 0.15
Nodes (17): Amenities(), FifthStep(), FourthStep(), FormErrors, Index(), DEFAULT_COORDS, MAP_STYLE, MapPin() (+9 more)

### Community 9 - "useColors"
Cohesion: 0.10
Nodes (29): AuthCompleteProfile(), ProfileForm, requiredFields, CompleteProfile(), ProfileForm, requiredFields, Index(), OTPVerification() (+21 more)

### Community 10 - "devDependencies"
Cohesion: 0.05
Nodes (42): eslint, eslint-config-expo, eslint-import-resolver-typescript, expo-doctor, fast-check, jest, jest-expo, metro-minify-terser (+34 more)

### Community 11 - "expo"
Cohesion: 0.05
Nodes (39): backgroundColor, foregroundImage, adaptiveIcon, googleServicesFile, package, permissions, predictiveBackGestureEnabled, softwareKeyboardLayoutMode (+31 more)

### Community 12 - "expo-router"
Cohesion: 0.05
Nodes (9): CompleteProfileCard(), CompleteProfileCardProps, ProfileHeader(), ProfileHeaderProps, AccountStatus, StatusConfig, VerificationStatus(), VerificationStatusProps (+1 more)

### Community 13 - "tenant-applications/[applicationId].tsx"
Cohesion: 0.16
Nodes (12): getStatusStyle(), TenantApplicationDetails(), EmptyApplicationData(), TenantApplicationDetailsSkeleton(), RejectDialog(), RejectDialogProps, useApplicationActions(), DocEntry (+4 more)

### Community 14 - "privateMediaResolver.ts"
Cohesion: 0.15
Nodes (23): cacheKey(), chatMediaRetryKeys, claimChatMediaRetry(), clearPrivateMediaUrlCache(), getCachedPrivateMediaUrl(), getPrivateMediaCacheGeneration(), isPrivateMediaCacheGenerationCurrent(), setCachedPrivateMediaUrl() (+15 more)

### Community 15 - "paymentService.ts"
Cohesion: 0.17
Nodes (17): getPaymentByReferenceQueryKey(), getPaymentQueryKey(), getPaymentsQueryKey(), usePaymentByReference(), usePayments(), CreateCashPaymentParams, fetchPaymentById(), fetchPaymentByReferenceId() (+9 more)

### Community 16 - "images.ts"
Cohesion: 0.12
Nodes (18): ChatHeader(), ChatHeaderProps, getLastMessageDisplay(), MessageCard(), MessageCardProps, Add(), PAYMENT_METHOD_TYPES, PaymentMethodType (+10 more)

### Community 17 - "ai-search.tsx"
Cohesion: 0.11
Nodes (19): AISearchScreen(), SUGGESTION_CHIPS, AIHeader(), EmptyChatState(), MessageBubble(), MessageBubbleProps, MessageComposer(), MessageComposerProps (+11 more)

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
Cohesion: 0.13
Nodes (16): ATTACHMENT_OPTIONS, ChatBox(), ChatBoxProps, StagedAsset, ChatEmptyState(), ChatEmptyStateProps, ChatLoadingSkeleton(), ChatScreen() (+8 more)

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
Cohesion: 0.11
Nodes (20): CardInformation, CardPaymentForm(), CardPaymentFormProps, CashPaymentErrors, CashPaymentForm(), CashPaymentFormProps, PaymentMethodButton(), PaymentMethodButtonProps (+12 more)

### Community 28 - "payment-history/[paymentId].tsx"
Cohesion: 0.38
Nodes (12): PaymentHistoryCard(), PaymentHistoryCardProps, LandlordPaymentReceipt(), ReceiptCard(), toHistoryItem(), PaymentReceipt(), Success(), usePayment() (+4 more)

### Community 29 - "landlordService.ts"
Cohesion: 0.10
Nodes (24): Index(), getLandlordUnitsQueryKey(), useLandlordUnits(), useLandlordStats(), asNullableString(), DB_TO_DISPLAY_STATUS, DbStatus, DISPLAY_TO_DB_STATUS (+16 more)

### Community 30 - "useTheme.ts"
Cohesion: 0.13
Nodes (14): TODO: Implement function to handle report landlord, TODO: Implement function to handle report tenant, DashboardSkeleton(), RentDueCard(), RentDueCardProps, NotificationBellButton(), NotificationBellButtonProps, EmptyProperties() (+6 more)

### Community 31 - "tenant-applications/index.tsx"
Cohesion: 0.31
Nodes (5): EmptyApplications(), EmptySearchResults(), TenantApplicationCardSkeleton(), EMPTY_FILTERS, TenantApplications()

### Community 32 - "manage-apartment/[apartmentId]/index.tsx"
Cohesion: 0.13
Nodes (13): MaintenanceRequestCard(), MaintenanceRequestCardProps, PropertyActionMenu(), Props, ApartmentImage, PropertyOverview(), Props, PropertyOverviewSkeleton() (+5 more)

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

### Community 39 - "auth/index.ts"
Cohesion: 0.36
Nodes (7): UseCountdownOptions, useCurrentUser(), useCurrentUserId(), getCurrentUser(), getUserProfileByColumn(), getUserProfileById(), UserProfile

### Community 40 - "second-step.tsx"
Cohesion: 0.18
Nodes (13): plugins, DEFAULT_COORDS, DEFAULT_ROOM_LIMITS, formatLimitMessage(), formatRange(), FormErrors, isZeroRange(), MAP_STYLE (+5 more)

### Community 41 - "NotificationScreen.tsx"
Cohesion: 0.18
Nodes (10): NotificationCardType, NotificationCardSkeleton(), NotificationFilter, NotificationList(), NotificationListProps, NotificationScreen(), NotificationScreenProps, useNotificationActions() (+2 more)

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

### Community 46 - "useApplicationActions.test.tsx"
Cohesion: 0.23
Nodes (10): createWrapper(), mockEq, mockFrom, mockUpdate, mockUseCurrentUser, getLandlordApplicationsQueryKey(), useLandlordApplications(), DisplayStatus (+2 more)

### Community 47 - "useLandlordActionBadges"
Cohesion: 0.22
Nodes (10): MaintenanceRequests(), Units(), EMPTY_COUNTS, getLandlordBadgesQueryKey(), useLandlordActionBadges(), ActionBadgeCategory, ActionBadgeCounts, fetchLandlordApartmentIds() (+2 more)

### Community 48 - "app/_layout.tsx"
Cohesion: 0.18
Nodes (9): RootLayout(), ThemeInitializer(), Index(), DevBadge(), useTheme(), expo-web-browser, ThemeMode, ThemeStore (+1 more)

### Community 49 - "ApplicationList.tsx"
Cohesion: 0.36
Nodes (3): ApplicationsList(), ApplicationsEmptyState(), ApplicationStatusCardSkeleton()

### Community 50 - "useTenancy"
Cohesion: 0.15
Nodes (22): getErrorMessage(), getRecordString(), getTenancyQueryKey(), useTenancy(), attachPaymentChannel(), attachSubscriber(), attachTenantChannel(), Channel (+14 more)

### Community 51 - "document-id/index.tsx"
Cohesion: 0.23
Nodes (11): DocumentCard(), DocumentCardProps, Index(), TODO: Implement contact support functionality,, TODO: Fetch and display user's uploaded documents and IDs here. This may…, UploadedDocument, DOCUMENT_EXTENSIONS, getExtension() (+3 more)

### Community 52 - "pending.tsx"
Cohesion: 0.22
Nodes (10): EmptyPending(), DATE_RANGE_OPTIONS, DateRange, Props, STATUS_OPTIONS, VisitRequestFilters, VisitRequestFilterSheet(), EMPTY_FILTERS (+2 more)

### Community 53 - "visit-requests/index.tsx"
Cohesion: 0.18
Nodes (10): EmptyApproved(), VisitRequestCalendar(), VisitRequestCalendarProps, VisitRequestCardSkeleton(), getGroup(), Group, GROUP_ORDER, GroupedItem (+2 more)

### Community 54 - "useChatChannel.ts"
Cohesion: 0.16
Nodes (12): BroadcastEvent, BroadcastPayload, PresenceJoinEvent, PresenceLeaveEvent, PresenceState, ChannelHandler, MockChannel, mockChannels (+4 more)

### Community 55 - "review-information.tsx"
Cohesion: 0.13
Nodes (17): ReviewAccordionItem(), ReviewAccordionItemProps, ReviewDocumentFile(), ReviewDocumentFileProps, ReviewDocumentImage(), ReviewDocumentImageProps, FieldErrors, FirstProcess() (+9 more)

### Community 56 - "reviews/index.tsx"
Cohesion: 0.16
Nodes (13): RatingBarCount(), RatingBarCountProps, RatingsPage(), ReviewsPage(), SORT_OPTIONS, DropdownButton(), DropdownButtonProps, RatingCard() (+5 more)

### Community 57 - "rentals.tsx"
Cohesion: 0.05
Nodes (55): EmptyMaintenanceRequestDetail(), MaintenanceRequestCard(), MaintenanceRequestCardProps, ResolveRequestDialog(), ResolveRequestDialogProps, MaintenanceRequestDetails(), ApartmentDescriptionCard(), ApartmentDescriptionCardProps (+47 more)

### Community 58 - "dependencies"
Cohesion: 0.12
Nodes (17): expo, expo-dev-client, expo-linking, heroui-native, dependencies, expo, expo-dev-client, expo-linking (+9 more)

### Community 59 - "RescheduleSheet.tsx"
Cohesion: 0.18
Nodes (10): Period, Props, RescheduleSheet(), tomorrow, toSupabaseTime(), HOURS, Period, PERIODS (+2 more)

### Community 60 - "useApplicationFormStore.ts"
Cohesion: 0.12
Nodes (17): DocKey, getContentType(), MIME_MAP, SubmitArgs, SubmitResult, uploadDoc(), ApartmentContext, ApplicationFormState (+9 more)

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
Cohesion: 0.23
Nodes (11): VisitRequestCard(), VisitRequestCardProps, VisitRequestDetails(), Props, VisitRequestHistoryItem(), ActionStatus, useVisitRequestActions(), FALLBACK_STYLE() (+3 more)

### Community 65 - "ChatBubble.tsx"
Cohesion: 0.27
Nodes (8): calculateImageSize(), ChatBubble(), ChatBubbleProps, mockPlayer, VideoBubble(), VisualMediaBubble(), isEmojiOnly(), MessageType

### Community 66 - "MaintenanceRequestFilterSheet.tsx"
Cohesion: 0.29
Nodes (6): LOCATION_OPTIONS, MaintenanceRequestFilters, MaintenanceRequestFilterSheet(), Props, STATUS_OPTIONS, URGENCY_OPTIONS

### Community 67 - "useTenancyRealtime.test.ts"
Cohesion: 0.18
Nodes (8): TenancyRealtimeCallbacks, MockChannel, mockChannelFactory, MockChannelHandler, mockChannelsByName, MockPayload, MockPostgresFilter, mockRemoveChannel

### Community 68 - "map-view.tsx"
Cohesion: 0.25
Nodes (7): IconButton(), IconButtonProps, IconComponent, ApartmentMapViewScreen(), DEFAULT_COORDS, DirectionMode, MAP_STYLE

### Community 69 - "useLandlordPayments.ts"
Cohesion: 0.24
Nodes (10): getLandlordPaymentsQueryKey(), useLandlordPaymentConfirmation(), useLandlordPayments(), getLandlordTenancyQueryKey(), fetchLandlordPayments(), LandlordPaymentRecord, mockFrom, QueryResult (+2 more)

### Community 70 - "captureSequences.ts"
Cohesion: 0.24
Nodes (8): ALL_SUPPORTED_ID_TYPES, CaptureCameraFacing, CaptureGuideShape, CARD_SEQUENCE, PASSPORT_SEQUENCE, SELFIE_STEP, SEQUENCE_BY_ID_TYPE, NON_PASSPORT_ID_TYPES

### Community 71 - "applications/[applicationId].tsx"
Cohesion: 0.25
Nodes (7): ApplicationApartment(), DocumentRow(), DocumentRowProps, getExtension(), IMAGE_EXTENSIONS, useCancelApplication(), useRespondToReschedule()

### Community 72 - "useProfile"
Cohesion: 0.22
Nodes (10): Index(), TabsLayout(), RequestVisit(), useProfile(), getLandlordVisitRequestsQueryKey(), useLandlordVisitRequests(), useSubmitVisitRequest(), VisitRequestPayload (+2 more)

### Community 73 - "TabBar.tsx"
Cohesion: 0.31
Nodes (6): TabBar(), TabBarIcon(), TabBarIconProps, IconProps, LANDLORDICONS, TENANTICONS

### Community 74 - "live-capture.test.tsx"
Cohesion: 0.25
Nodes (8): captureAndReachReview(), DEFAULT_QUALITY_RESULT, mockBack, mockDismissTo, mockReplace, mockSearchParams, mockTakePictureAsync, setPermission()

### Community 75 - "applications/index.ts"
Cohesion: 0.21
Nodes (15): ApplicationStatusCard(), Props, ApplicationStatus, ApplicationStatusStyle, ChipColor, FALLBACK_STYLE(), useApplicationStatusStyles(), getTenantApplicationsQueryKey() (+7 more)

### Community 76 - "CustomTabBar.tsx"
Cohesion: 0.17
Nodes (11): SectionDetail(), transformApartments(), CustomTabBar(), CustomTabConfig, Props, TabItemsProps, TablerIconComponent, LANDLORD_TABS (+3 more)

### Community 77 - "upload-id.test.tsx"
Cohesion: 0.25
Nodes (7): BACK_CAPTURE, FRONT_CAPTURE, mockBack, mockPush, mockReplace, mockUseFocusEffect, SELFIE_CAPTURE

### Community 78 - "sign-in.tsx"
Cohesion: 0.14
Nodes (10): AuthButton(), AuthButtonProps, AuthDivider(), AuthDividerProps, RoleTab(), RoleTabProps, SignUp(), AIHeaderProps (+2 more)

### Community 79 - "UploadImageField.tsx"
Cohesion: 0.28
Nodes (8): ACCEPTED_FILE_TYPES, UploadDocumentField(), UploadDocumentFieldProps, UploadedDocument, UploadImageField(), UploadImageFieldProps, compressImage(), compressImageTo()

### Community 80 - "third-process.tsx"
Cohesion: 0.24
Nodes (6): FormErrors, ThirdProcess(), FieldErrors, ThirdStep(), UploadFileField(), UploadFileFieldProps

### Community 81 - "ProfitByPropertyCard.tsx"
Cohesion: 0.31
Nodes (7): chartLabel(), ProfitByPropertyCard(), ProfitByPropertyCardProps, MONTHS, EmptyState(), EmptyStateProps, PropertyRevenue

### Community 82 - "applications/components/VisitRequestCard.tsx"
Cohesion: 0.29
Nodes (3): Props, VisitRequest, VisitRequestCard()

### Community 83 - "notification-toast.tsx"
Cohesion: 0.40
Nodes (5): MOCK_TOASTS, MockRow, MockToast, NotificationToastDevScreen(), showNotificationToast()

### Community 84 - "ReceiptCard.tsx"
Cohesion: 0.18
Nodes (10): ReceiptCardProps, STATUS_META, ZigzagEdge(), ZigzagEdgeProps, PaymentHistoryCard(), PaymentHistoryCardProps, PaymentHistoryItem, PaymentStatus (+2 more)

### Community 85 - "maintenance-requests/index.tsx"
Cohesion: 0.47
Nodes (3): EmptyMaintenanceRequestsList(), MaintenanceRequestCardSkeleton(), EMPTY_FILTERS

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

### Community 100 - "ApplicationFilterSheet.tsx"
Cohesion: 0.33
Nodes (5): ApplicationFilters, ApplicationFilterSheet(), LOCATION_OPTIONS, Props, STATUS_OPTIONS

### Community 110 - "useLandlordTenancy.ts"
Cohesion: 0.40
Nodes (5): useLandlordTenancy(), fetchLandlordTenancy(), LandlordTenancyMaintenanceRequest, LandlordTenant, PaymentRecord

### Community 125 - "useSubmitReview.ts"
Cohesion: 0.40
Nodes (4): RateApartment(), SubmitReviewParams, SubmitReviewResult, useSubmitReview()

### Community 165 - "queryClient.ts"
Cohesion: 0.06
Nodes (49): TenantFavorites(), QueryProvider(), QueryProviderProps, createWrapper(), mockFetchApartmentDetails, mockFetchReviewsPreview, createWrapper(), mockFetchTenantApplications (+41 more)

### Community 167 - "useVisitRequest.ts"
Cohesion: 0.48
Nodes (5): getVisitRequestQueryKey(), useVisitRequest(), fetchVisitRequest(), VisitRequest, VisitRequestResult

### Community 168 - "tenantApplicationsService.test.ts"
Cohesion: 0.40
Nodes (3): applicationRow, mockFrom, mockResolvePrivateMediaUrls

## Knowledge Gaps
- **636 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+631 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **69 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useColors()` connect `useColors` to `apartments/index.ts`, `ScreenWrapper.tsx`, `edit-profile.tsx`, `ratings/index.ts`, `dashboardService.ts`, `fifth-step.tsx`, `useConversations.test.tsx`, `search.tsx`, `useApartmentFormStore`, `expo-router`, `tenant-applications/[applicationId].tsx`, `images.ts`, `ai-search.tsx`, `usePersonalizationStore.ts`, `notificationService.ts`, `useVerificationStore`, `[conversationId].tsx`, `notifications/index.ts`, `PaymentMethodSelector.tsx`, `payment-history/[paymentId].tsx`, `landlordService.ts`, `useTheme.ts`, `tenant-applications/index.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `ProfitTrendCard.tsx`, `units.tsx`, `queryClient.ts`, `second-step.tsx`, `history/index.tsx`, `payment/index.tsx`, `useLandlordActionBadges`, `app/_layout.tsx`, `ApplicationList.tsx`, `document-id/index.tsx`, `pending.tsx`, `visit-requests/index.tsx`, `review-information.tsx`, `reviews/index.tsx`, `rentals.tsx`, `RescheduleSheet.tsx`, `visitRequests/index.ts`, `ChatBubble.tsx`, `map-view.tsx`, `applications/[applicationId].tsx`, `useProfile`, `TabBar.tsx`, `applications/index.ts`, `CustomTabBar.tsx`, `sign-in.tsx`, `UploadImageField.tsx`, `third-process.tsx`, `ProfitByPropertyCard.tsx`, `applications/components/VisitRequestCard.tsx`, `ReceiptCard.tsx`, `maintenance-requests/index.tsx`, `reset-password.tsx`, `useSubmitReview.ts`?**
  _High betweenness centrality (0.215) - this node is a cross-community bridge._
- **Why does `expo-router` connect `expo-router` to `apartments/index.ts`, `ScreenWrapper.tsx`, `fifth-step.tsx`, `search.tsx`, `useApartmentFormStore`, `useColors`, `tenant-applications/[applicationId].tsx`, `images.ts`, `usePersonalizationStore.ts`, `useVerificationStore`, `[conversationId].tsx`, `paymongoService.ts`, `payment-history/[paymentId].tsx`, `useTheme.ts`, `tenant-applications/index.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `units.tsx`, `useFrameQualityCheck.ts`, `second-step.tsx`, `NotificationScreen.tsx`, `history/index.tsx`, `payment/index.tsx`, `edit-main.tsx`, `app/_layout.tsx`, `ApplicationList.tsx`, `document-id/index.tsx`, `pending.tsx`, `visit-requests/index.tsx`, `review-information.tsx`, `reviews/index.tsx`, `rentals.tsx`, `useInAppNotificationBanner.tsx`, `onboarding.tsx`, `map-view.tsx`, `applications/[applicationId].tsx`, `useProfile`, `applications/index.ts`, `CustomTabBar.tsx`, `sign-in.tsx`, `third-process.tsx`, `ReceiptCard.tsx`, `maintenance-requests/index.tsx`, `playground.tsx`, `reset-password.tsx`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `ScreenWrapper` connect `ScreenWrapper.tsx` to `apartments/index.ts`, `edit-profile.tsx`, `fifth-step.tsx`, `search.tsx`, `useApartmentFormStore`, `useColors`, `tenant-applications/[applicationId].tsx`, `images.ts`, `ai-search.tsx`, `usePersonalizationStore.ts`, `notificationService.ts`, `useVerificationStore`, `[conversationId].tsx`, `useTheme.ts`, `tenant-applications/index.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `units.tsx`, `second-step.tsx`, `NotificationScreen.tsx`, `history/index.tsx`, `payment/index.tsx`, `edit-main.tsx`, `ApplicationList.tsx`, `document-id/index.tsx`, `pending.tsx`, `visit-requests/index.tsx`, `review-information.tsx`, `reviews/index.tsx`, `rentals.tsx`, `map-view.tsx`, `applications/[applicationId].tsx`, `CustomTabBar.tsx`, `sign-in.tsx`, `third-process.tsx`, `maintenance-requests/index.tsx`, `reset-password.tsx`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _636 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `apartments/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `ScreenWrapper.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07231638418079096 - nodes in this community are weakly interconnected._
- **Should `fifth-step.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11384615384615385 - nodes in this community are weakly interconnected._