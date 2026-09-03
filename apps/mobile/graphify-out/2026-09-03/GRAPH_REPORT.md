# Graph Report - mobile  (2026-09-03)

## Corpus Check
- 460 files · ~645,062 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2056 nodes · 4937 edges · 180 communities (111 shown, 69 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b2e86f00`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- apartments/index.ts
- ScreenWrapper.tsx
- map-search.tsx
- [landlordId].tsx
- ProfitTrendCard.tsx
- useTheme.ts
- useConversations.test.tsx
- search.tsx
- fifth-step.tsx
- ErrorDialog.tsx
- devDependencies
- expo
- expo-router
- useFavorites
- privateMediaResolver.ts
- paymentService.ts
- images.ts
- ai-search.tsx
- usePersonalizationStore.ts
- notificationService.ts
- useVerificationStore.ts
- chatService.ts
- [conversationId].tsx
- NotificationScreen.tsx
- paymongoService.ts
- paths
- notifications/index.ts
- PaymentMethodSelector.tsx
- payment-history/[paymentId].tsx
- landlordService.ts
- useColors
- tenant-applications/index.tsx
- manage-apartment/[apartmentId]/index.tsx
- upload-id.tsx
- live-capture.tsx
- useTenancy
- units.tsx
- useFrameQualityCheck.ts
- edit-profile.tsx
- auth/index.ts
- plugins
- favorites.tsx
- history/index.tsx
- payment/index.tsx
- edit-main.tsx
- audit-fix.characterization.test.ts
- ProfitByPropertyCard.tsx
- createMobileQueryClient
- app/_layout.tsx
- android
- useTenancyRealtime.ts
- document-id/index.tsx
- infoPlist
- useTenantApplications
- useChatChannel.ts
- review-information.tsx
- dashboard.tsx
- maintenance-requests/index.ts
- dependencies
- RescheduleSheet.tsx
- useApplicationFormStore.ts
- useProfile
- useInAppNotificationBanner.tsx
- onboarding.tsx
- visit-requests/index.tsx
- ChatBubble.tsx
- GuidedFrameOverlay.tsx
- useTenancyRealtime.test.ts
- expo-linking
- useLandlordPayments.ts
- useUserPreferences.ts
- pending.tsx
- CustomTabBar.tsx
- TabBar.tsx
- live-capture.test.tsx
- rentals.tsx
- visitRequests/index.ts
- applications/index.ts
- sign-in.tsx
- UploadDocumentField.tsx
- third-process.tsx
- useVisitRequestStatusStyles
- tenant-applications/[applicationId].tsx
- useNotifications.ts
- payments/index.ts
- web
- metro.config.js
- Welcome to your Expo app 👋
- playground.tsx
- uniwind-types.d.ts
- ReviewField.tsx
- StatusPill.tsx
- eslint.config.js
- ios
- applications/[applicationId].tsx
- expo-crypto
- [sectionId].tsx
- expo-device
- expo-document-picker
- expo-file-system
- expo-font
- notification-toast.tsx
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
- queryClient.ts
- expo-camera
- request-visit.tsx
- useLandlordApplications.ts
- react-native-maps
- react-native-svg-transformer
- @repo/supabase
- third-step.tsx
- useLandlordTenancy.ts
- useVisitRequest.ts
- useTenancy.test.tsx
- config
- extra
- useSearchLogic.test.tsx
- emoji-regex-xs

## God Nodes (most connected - your core abstractions)
1. `useColors()` - 340 edges
2. `expo-router` - 134 edges
3. `ScreenWrapper` - 102 edges
4. `StandardHeader()` - 54 edges
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

## Communities (180 total, 69 thin omitted)

### Community 0 - "apartments/index.ts"
Cohesion: 0.07
Nodes (31): ApartmentSkeleton(), ApartmentDescriptionSection(), ApartmentDescriptionSectionProps, ApartmentDetailsSection(), ApartmentDetailsSectionProps, ApartmentHeroSection(), ApartmentHeroSectionProps, ApartmentImage (+23 more)

### Community 1 - "ScreenWrapper.tsx"
Cohesion: 0.07
Nodes (28): RateApartmentSkeleton(), ErrorDialogState, FormErrors, TenancyLeasePeriod, DOCUMENT_TYPE_ICONS, TODO: Persist the uploaded document to Supabase Storage and store its, AnalyticsScreen(), MAX_AMOUNT (+20 more)

### Community 2 - "map-search.tsx"
Cohesion: 0.08
Nodes (40): IconButton(), IconButtonProps, IconComponent, ApartmentMapViewScreen(), DirectionMode, MapPin(), INITIAL_REGION, TenantMapSearchScreen() (+32 more)

### Community 3 - "[landlordId].tsx"
Cohesion: 0.05
Nodes (57): RatingBarCount(), RatingBarCountProps, ApartmentScreen(), RatingsPage(), ReviewsPage(), SORT_OPTIONS, PublicLandlordProfile(), TODO: Implement function to handle report landlord (+49 more)

### Community 4 - "ProfitTrendCard.tsx"
Cohesion: 0.10
Nodes (22): BUILDERS, ChartDatum, FilterOption, filterOptions, ProfitTrendCard(), ProfitTrendCardProps, toMonthly(), Dashboard() (+14 more)

### Community 5 - "useTheme.ts"
Cohesion: 0.13
Nodes (17): PerksSection(), PerksSectionProps, Index(), BasePerkButtonProps, PerkButton(), PerkButtonProps, CurrentApartmentDetails(), formatDateToMonthYear() (+9 more)

### Community 6 - "useConversations.test.tsx"
Cohesion: 0.11
Nodes (26): Chat(), getConversationsQueryKey(), NewChatRow, createWrapper(), mockChannelFn, mockFetchConversations, mockGetChannels, mockRemoveChannel (+18 more)

### Community 7 - "search.tsx"
Cohesion: 0.18
Nodes (11): DEFAULT_FILTERS, FilterBottomSheet(), FilterState, Props, ROOM_OPTS, SearchFiltersBar(), SearchFiltersBarProps, SearchHeader() (+3 more)

### Community 8 - "fifth-step.tsx"
Cohesion: 0.18
Nodes (14): Amenities(), DEFAULT_COORDS, MAP_STYLE, FourthStep(), Index(), getMimeType(), uploadBytes(), uploadImage() (+6 more)

### Community 9 - "ErrorDialog.tsx"
Cohesion: 0.15
Nodes (17): AuthCompleteProfile(), ProfileForm, requiredFields, CompleteProfile(), ProfileForm, requiredFields, OTPVerification(), OTPVerification() (+9 more)

### Community 10 - "devDependencies"
Cohesion: 0.05
Nodes (42): eslint, eslint-config-expo, eslint-import-resolver-typescript, expo-doctor, fast-check, jest, jest-expo, metro-minify-terser (+34 more)

### Community 11 - "expo"
Cohesion: 0.17
Nodes (11): reactCompiler, typedRoutes, expo, experiments, icon, name, orientation, scheme (+3 more)

### Community 12 - "expo-router"
Cohesion: 0.05
Nodes (3): StepProgress(), StepProgressProps, expo-router

### Community 13 - "useFavorites"
Cohesion: 0.17
Nodes (20): TenantFavorites(), getErrorMessage(), getFavoriteApartmentsQueryKey(), getFavoritesQueryKey(), createWrapper(), mockDeleteFavorite, mockFetchApartmentsByIds, mockFetchFavoriteApartmentIds (+12 more)

### Community 14 - "privateMediaResolver.ts"
Cohesion: 0.12
Nodes (27): DocEntry, ResolvedDoc, DocumentEntriesProps, mockResolvePrivateMediaUrls, cacheKey(), chatMediaRetryKeys, claimChatMediaRetry(), clearPrivateMediaUrlCache() (+19 more)

### Community 15 - "paymentService.ts"
Cohesion: 0.21
Nodes (12): CreateCashPaymentParams, fetchPaymentById(), fetchPaymentByReferenceId(), fetchPayments(), METHOD_LABELS, PaymentRecord, PaymentRow, STATUS_LABELS (+4 more)

### Community 16 - "images.ts"
Cohesion: 0.10
Nodes (16): AIHeaderProps, getLastMessageDisplay(), MessageCard(), MessageCardProps, Add(), PAYMENT_METHOD_TYPES, PaymentMethodType, getLogoSource() (+8 more)

### Community 17 - "ai-search.tsx"
Cohesion: 0.10
Nodes (20): AISearchScreen(), SUGGESTION_CHIPS, AIHeader(), EmptyChatState(), MessageBubble(), MessageBubbleProps, MessageComposer(), MessageComposerProps (+12 more)

### Community 18 - "usePersonalizationStore.ts"
Cohesion: 0.13
Nodes (20): CityCheckBox(), CityCheckBoxProps, PersonalizationProgress(), Props, PersonalizationRadioButton(), PersonalizationRadioButtonProps, StepFive(), StepFour() (+12 more)

### Community 19 - "notificationService.ts"
Cohesion: 0.15
Nodes (18): GENERAL_TOGGLES, GeneralToggleKey, NOTIFICATION_TYPE_LABELS, getNotificationPreferencesQueryKey(), createWrapper(), mockFetchNotificationPreferences, mockUpdateNotificationPreferences, mockUseCurrentUser (+10 more)

### Community 20 - "useVerificationStore.ts"
Cohesion: 0.09
Nodes (24): SelectId(), SelfiePrep(), Success(), UploadSelfie(), initialVerificationState, useVerificationStore, VerificationData, VerificationStore (+16 more)

### Community 21 - "chatService.ts"
Cohesion: 0.09
Nodes (32): Options, ChatMessagePlacement, mergeChatMessages(), AttachmentUploadFailure, buildOlderThanChatMessageFilter(), ChatMessageCursor, ChatMessagePage, EXTENSION_BY_MIME_TYPE (+24 more)

### Community 22 - "[conversationId].tsx"
Cohesion: 0.12
Nodes (18): ATTACHMENT_OPTIONS, ChatBox(), ChatBoxProps, StagedAsset, ChatEmptyState(), ChatEmptyStateProps, ChatHeader(), ChatHeaderProps (+10 more)

### Community 23 - "NotificationScreen.tsx"
Cohesion: 0.18
Nodes (10): NotificationCardSkeleton(), NotificationFilter, NotificationList(), NotificationListProps, NotificationScreen(), NotificationScreenProps, useNotificationActions(), getNotificationsQueryKey() (+2 more)

### Community 24 - "paymongoService.ts"
Cohesion: 0.17
Nodes (11): PaymentVerify(), extractError(), getCheckoutSessionStatus(), invoke(), PaymongoCard, PaymongoCardPaymentResult, PaymongoCheckoutSession, PaymongoEnvelope (+3 more)

### Community 25 - "paths"
Cohesion: 0.09
Nodes (22): ./assets/*, ./components/*, ./constants/*, expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.ts, ./hooks/*, ../../packages/ui/* (+14 more)

### Community 26 - "notifications/index.ts"
Cohesion: 0.23
Nodes (16): NotificationCard(), NotificationCardProps, NotificationCardType, NotificationSettingsScreen(), NotificationToastContent(), NotificationToastContentProps, NotificationToastOptions, TOAST_VARIANT_BY_TYPE (+8 more)

### Community 27 - "PaymentMethodSelector.tsx"
Cohesion: 0.13
Nodes (18): CardInformation, CardPaymentForm(), CardPaymentFormProps, CashPaymentErrors, CashPaymentForm(), CashPaymentFormProps, PaymentMethodButton(), PaymentMethodButtonProps (+10 more)

### Community 28 - "payment-history/[paymentId].tsx"
Cohesion: 0.36
Nodes (12): PaymentHistoryCard(), PaymentHistoryCardProps, LandlordPaymentReceipt(), PaymentReceipt(), Success(), getPaymentQueryKey(), usePayment(), usePaymentByReference() (+4 more)

### Community 29 - "landlordService.ts"
Cohesion: 0.10
Nodes (27): MaintenanceRequests(), Units(), EMPTY_COUNTS, getLandlordBadgesQueryKey(), useLandlordActionBadges(), getLandlordUnitsQueryKey(), useLandlordUnits(), ActionBadgeCategory (+19 more)

### Community 30 - "useColors"
Cohesion: 0.12
Nodes (23): Index(), ResetPassword(), SignIn(), Failed(), SelectDocument(), Upload(), EditPerks(), LeaseViewer() (+15 more)

### Community 31 - "tenant-applications/index.tsx"
Cohesion: 0.13
Nodes (15): ApplicationFilters, ApplicationFilterSheet(), LOCATION_OPTIONS, Props, STATUS_OPTIONS, EmptyApplications(), EmptySearchResults(), getInitials() (+7 more)

### Community 32 - "manage-apartment/[apartmentId]/index.tsx"
Cohesion: 0.17
Nodes (10): MaintenanceRequestCard(), MaintenanceRequestCardProps, PropertyActionMenu(), Props, ApartmentImage, PropertyOverview(), Props, PropertyOverviewSkeleton() (+2 more)

### Community 33 - "upload-id.tsx"
Cohesion: 0.31
Nodes (10): CaptureStepConfig, CaptureStepSummary(), CaptureStepSummaryProps, UploadId(), CaptureProgress, computeCanContinue(), getCaptureProgress(), IdCaptureResult (+2 more)

### Community 34 - "live-capture.tsx"
Cohesion: 0.14
Nodes (13): ALL_SUPPORTED_ID_TYPES, CaptureCameraFacing, CaptureGuideShape, CARD_SEQUENCE, getCaptureSequence(), getNextCaptureStep(), PASSPORT_SEQUENCE, SELFIE_STEP (+5 more)

### Community 35 - "useTenancy"
Cohesion: 0.27
Nodes (11): Chat(), getErrorMessage(), getRecordString(), getTenancyQueryKey(), useTenancy(), CurrentTenancy, fetchTenancy(), TenancyApartment (+3 more)

### Community 36 - "units.tsx"
Cohesion: 0.12
Nodes (16): EmptyProperties(), Props, PropertyCard(), PropertyCardProps, PropertyCardSkeleton(), PropertyFilterSheet(), PropertyFilterSheetProps, SORT_LABELS (+8 more)

### Community 37 - "useFrameQualityCheck.ts"
Cohesion: 0.18
Nodes (13): GuidedFrameRect, CameraPermissionState, useCameraPermission(), UseCameraPermissionResult, evaluateBlurHeuristic(), evaluateGlareHeuristic(), FrameQualityCheckOptions, FrameQualityReason (+5 more)

### Community 38 - "edit-profile.tsx"
Cohesion: 0.14
Nodes (14): EditProfile(), EditProfileForm, EMPTY_FORM, FormErrors, EditSpecs(), MaintenanceDetails, MaintenanceErrors, RequestMaintenance() (+6 more)

### Community 39 - "auth/index.ts"
Cohesion: 0.36
Nodes (7): UseCountdownOptions, useCurrentUser(), useCurrentUserId(), getCurrentUser(), getUserProfileByColumn(), getUserProfileById(), UserProfile

### Community 40 - "plugins"
Cohesion: 0.25
Nodes (6): plugins, expo-font, expo-video, expo-web-browser, @maplibre/maplibre-react-native, @react-native-community/datetimepicker

### Community 41 - "favorites.tsx"
Cohesion: 0.16
Nodes (15): ApartmentsList(), ApartmentsListProps, Props, SearchGridSkeleton(), SearchSection(), SearchSectionSkeleton(), Props, SearchSectionsList() (+7 more)

### Community 42 - "history/index.tsx"
Cohesion: 0.17
Nodes (13): EMPTY_FILTERS, FlatPayment, PaymentHistoryScreen(), toFlatPayment(), PaymentHistoryFilters, PaymentHistoryFilterSheet(), PaymentSort, Props (+5 more)

### Community 43 - "payment/index.tsx"
Cohesion: 0.18
Nodes (16): Rentals(), validateCashPayment(), PaymentFooter(), PaymentFooterProps, PaymentSummaryCard(), PaymentSummaryCardProps, formatLeaseDate(), INITIAL_CARD (+8 more)

### Community 44 - "edit-main.tsx"
Cohesion: 0.21
Nodes (13): ApartmentInformation, DisplayImage, EditMain(), validateForm(), ApartmentMainFields, deleteStorageImage(), ExistingImage, PendingImage (+5 more)

### Community 45 - "audit-fix.characterization.test.ts"
Cohesion: 0.12
Nodes (10): ChatRow, mockChannel, mockChatRows, mockCreateSignedUrls, mockFrom, mockGetUser, mockRemoveChannel, mockStorageFrom (+2 more)

### Community 46 - "ProfitByPropertyCard.tsx"
Cohesion: 0.47
Nodes (5): chartLabel(), ProfitByPropertyCard(), ProfitByPropertyCardProps, MONTHS, PropertyRevenue

### Community 47 - "createMobileQueryClient"
Cohesion: 0.16
Nodes (12): createWrapper(), mockFetchApartmentDetails, mockFetchReviewsPreview, createWrapper(), mockEq, mockFrom, mockUpdate, mockUseCurrentUser (+4 more)

### Community 48 - "app/_layout.tsx"
Cohesion: 0.16
Nodes (13): NotificationManager(), RootLayout(), ThemeInitializer(), Index(), SettingItem, SettingSection, DevBadge(), useInAppNotificationBanner() (+5 more)

### Community 49 - "android"
Cohesion: 0.17
Nodes (12): backgroundColor, foregroundImage, adaptiveIcon, googleServicesFile, package, permissions, predictiveBackGestureEnabled, softwareKeyboardLayoutMode (+4 more)

### Community 50 - "useTenancyRealtime.ts"
Cohesion: 0.24
Nodes (13): attachPaymentChannel(), attachSubscriber(), attachTenantChannel(), Channel, createRefSubscriber(), detachSubscriber(), getRecordString(), paymentChannels (+5 more)

### Community 51 - "document-id/index.tsx"
Cohesion: 0.23
Nodes (11): DocumentCard(), DocumentCardProps, Index(), TODO: Implement contact support functionality,, TODO: Fetch and display user's uploaded documents and IDs here. This may…, UploadedDocument, DOCUMENT_EXTENSIONS, getExtension() (+3 more)

### Community 52 - "infoPlist"
Cohesion: 0.33
Nodes (6): ITSAppUsesNonExemptEncryption, NSCameraUsageDescription, NSLocationAlwaysAndWhenInUseUsageDescription, NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, infoPlist

### Community 53 - "useTenantApplications"
Cohesion: 0.20
Nodes (11): getTenantApplicationsQueryKey(), useTenantApplications(), ApplicationDocument, ApplicationDocumentPathKey, ApplicationRow, DOCUMENT_DEFINITIONS, fetchTenantApplications(), TenantApplication (+3 more)

### Community 54 - "useChatChannel.ts"
Cohesion: 0.16
Nodes (12): BroadcastEvent, BroadcastPayload, PresenceJoinEvent, PresenceLeaveEvent, PresenceState, ChannelHandler, MockChannel, mockChannels (+4 more)

### Community 55 - "review-information.tsx"
Cohesion: 0.14
Nodes (16): ApartmentSummary(), ReviewAccordionItem(), ReviewAccordionItemProps, ReviewDocumentFile(), ReviewDocumentFileProps, ReviewDocumentImage(), ReviewDocumentImageProps, ReviewInformation() (+8 more)

### Community 56 - "dashboard.tsx"
Cohesion: 0.31
Nodes (5): DashboardSkeleton(), RentDueCard(), RentDueCardProps, NotificationBellButton(), NotificationBellButtonProps

### Community 57 - "maintenance-requests/index.ts"
Cohesion: 0.06
Nodes (48): EmptyMaintenanceRequestDetail(), EmptyMaintenanceRequestsList(), MaintenanceRequestCard(), MaintenanceRequestCardProps, MaintenanceRequestCardSkeleton(), LOCATION_OPTIONS, MaintenanceRequestFilters, MaintenanceRequestFilterSheet() (+40 more)

### Community 58 - "dependencies"
Cohesion: 0.12
Nodes (17): expo, expo-dev-client, expo-haptics, heroui-native, dependencies, expo, expo-dev-client, expo-haptics (+9 more)

### Community 59 - "RescheduleSheet.tsx"
Cohesion: 0.18
Nodes (10): Period, Props, RescheduleSheet(), tomorrow, toSupabaseTime(), HOURS, Period, PERIODS (+2 more)

### Community 60 - "useApplicationFormStore.ts"
Cohesion: 0.17
Nodes (11): ApartmentContext, ApplicationFormState, initialApartmentContext, initialDocuments, initialRentalPreferences, initialTenantInformation, initialUploadedPaths, RentalPreferences (+3 more)

### Community 61 - "useProfile"
Cohesion: 0.18
Nodes (11): FieldErrors, FirstProcess(), RateApartment(), FifthStep(), Index(), TabsLayout(), ApplicationApartment(), useProfile() (+3 more)

### Community 62 - "useInAppNotificationBanner.tsx"
Cohesion: 0.26
Nodes (7): getOpenChatConversationKey(), shouldSuppressChatToast(), useNotificationTapHandler(), buildNotificationDeepLink(), NotificationData, parseConversationKey(), Role

### Community 63 - "onboarding.tsx"
Cohesion: 0.21
Nodes (7): { width }, OnBoardingSlide(), OnBoardingSlideProps, Slide, SLIDES, USER_ROLES, UserRole

### Community 64 - "visit-requests/index.tsx"
Cohesion: 0.18
Nodes (10): EmptyApproved(), VisitRequestCalendar(), VisitRequestCalendarProps, VisitRequestCardSkeleton(), getGroup(), Group, GROUP_ORDER, GroupedItem (+2 more)

### Community 65 - "ChatBubble.tsx"
Cohesion: 0.27
Nodes (8): calculateImageSize(), ChatBubble(), ChatBubbleProps, mockPlayer, VideoBubble(), VisualMediaBubble(), isEmojiOnly(), MessageType

### Community 66 - "GuidedFrameOverlay.tsx"
Cohesion: 0.36
Nodes (6): computeFillRatio(), computeGuidedFrameRect(), GuidedFrameOverlay(), GuidedFrameOverlayProps, GuidedFrameShape, evaluateFillHeuristic()

### Community 67 - "useTenancyRealtime.test.ts"
Cohesion: 0.20
Nodes (7): MockChannel, mockChannelFactory, MockChannelHandler, mockChannelsByName, MockPayload, MockPostgresFilter, mockRemoveChannel

### Community 69 - "useLandlordPayments.ts"
Cohesion: 0.19
Nodes (12): getLandlordPaymentsQueryKey(), useLandlordPaymentConfirmation(), useLandlordPayments(), useLandlordStats(), fetchLandlordPayments(), fetchLandlordStats(), LandlordPaymentRecord, LandlordStats (+4 more)

### Community 70 - "useUserPreferences.ts"
Cohesion: 0.23
Nodes (12): RentalPreferences(), DEFAULT_PREFS, prefsEqual(), useRentalPreferencesForm(), hasPersonalization(), isDefaultBudget(), parsePreferences(), TenantPreferences (+4 more)

### Community 71 - "pending.tsx"
Cohesion: 0.22
Nodes (10): EmptyPending(), DATE_RANGE_OPTIONS, DateRange, Props, STATUS_OPTIONS, VisitRequestFilters, VisitRequestFilterSheet(), EMPTY_FILTERS (+2 more)

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
Cohesion: 0.12
Nodes (12): QuickActionButton(), QuickActionButtonProps, ApartmentDescriptionCard(), ApartmentDescriptionCardProps, PaymentSummaryCard(), PaymentSummaryCardProps, RentalsSkeleton(), TenancyEmptyState() (+4 more)

### Community 76 - "visitRequests/index.ts"
Cohesion: 0.27
Nodes (8): VisitRequestDetails(), getLandlordVisitRequestsQueryKey(), useLandlordVisitRequests(), useRespondToReschedule(), ActionStatus, useVisitRequestActions(), fetchLandlordVisitRequests(), LandlordVisitRequest

### Community 77 - "applications/index.ts"
Cohesion: 0.30
Nodes (8): ApplicationStatusCard(), Props, ApplicationStatus, ApplicationStatusStyle, ChipColor, FALLBACK_STYLE(), useApplicationStatusStyles(), useCancelApplication()

### Community 78 - "sign-in.tsx"
Cohesion: 0.25
Nodes (8): AuthButton(), AuthButtonProps, AuthDivider(), AuthDividerProps, RoleTab(), RoleTabProps, SignUp(), useGoogleAuth()

### Community 79 - "UploadDocumentField.tsx"
Cohesion: 0.24
Nodes (10): ACCEPTED_FILE_TYPES, UploadDocumentField(), UploadDocumentFieldProps, UploadedDocument, BUCKET_MAP, UploadTarget, useImageUpload(), compressImage() (+2 more)

### Community 80 - "third-process.tsx"
Cohesion: 0.17
Nodes (11): FormErrors, SecondProcess(), FormErrors, ThirdProcess(), FormErrors, UploadImageField(), UploadImageFieldProps, ApplicationHeader() (+3 more)

### Community 81 - "useVisitRequestStatusStyles"
Cohesion: 0.29
Nodes (8): VisitRequestCard(), VisitRequestCardProps, Props, VisitRequestHistoryItem(), FALLBACK_STYLE(), StatusStyle, useVisitRequestStatusStyles(), VisitRequestStatus

### Community 82 - "tenant-applications/[applicationId].tsx"
Cohesion: 0.20
Nodes (11): getStatusStyle(), TenantApplicationDetails(), EmptyApplicationData(), DocumentRow(), DocumentRowProps, getExtension(), IMAGE_EXTENSIONS, RejectDialog() (+3 more)

### Community 83 - "useNotifications.ts"
Cohesion: 0.26
Nodes (13): attach(), ChannelEntry, detach(), handleEvent(), NotificationRealtimeCallbacks, registry, useNotificationRealtime(), getErrorMessage() (+5 more)

### Community 84 - "payments/index.ts"
Cohesion: 0.16
Nodes (13): ReceiptCard(), ReceiptCardProps, STATUS_META, ZigzagEdge(), ZigzagEdgeProps, PaymentHistoryCard(), PaymentHistoryCardProps, PaymentHistoryItem (+5 more)

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

### Community 98 - "applications/[applicationId].tsx"
Cohesion: 0.22
Nodes (5): Props, VisitRequest, VisitRequestCard(), ConfirmDialog(), Props

### Community 100 - "[sectionId].tsx"
Cohesion: 0.33
Nodes (7): SectionDetail(), scorePreferences(), SECTION_DEFS, SectionId, transformApartments(), useSearchSections(), UseSearchSectionsParams

### Community 105 - "notification-toast.tsx"
Cohesion: 0.40
Nodes (5): MOCK_TOASTS, MockRow, MockToast, NotificationToastDevScreen(), showNotificationToast()

### Community 110 - "second-step.tsx"
Cohesion: 0.36
Nodes (7): DEFAULT_COORDS, DEFAULT_ROOM_LIMITS, formatLimitMessage(), formatRange(), FormErrors, isZeroRange(), SecondStep()

### Community 125 - "ApplicationList.tsx"
Cohesion: 0.36
Nodes (3): ApplicationsList(), ApplicationsEmptyState(), ApplicationStatusCardSkeleton()

### Community 165 - "queryClient.ts"
Cohesion: 0.16
Nodes (12): QueryProvider(), QueryProviderProps, createWrapper(), mockFrom, mockGetUser, profileRecord, queryClient, RetryableReadError (+4 more)

### Community 167 - "request-visit.tsx"
Cohesion: 0.32
Nodes (5): RequestVisit(), Props, QuantityField(), useSubmitVisitRequest(), VisitRequestPayload

### Community 168 - "useLandlordApplications.ts"
Cohesion: 0.39
Nodes (6): getLandlordApplicationsQueryKey(), useLandlordApplications(), asNullableString(), DisplayStatus, fetchLandlordApplications(), LandlordApplication

### Community 172 - "third-step.tsx"
Cohesion: 0.33
Nodes (4): FieldErrors, ThirdStep(), UploadFileField(), UploadFileFieldProps

### Community 173 - "useLandlordTenancy.ts"
Cohesion: 0.38
Nodes (6): getLandlordTenancyQueryKey(), useLandlordTenancy(), fetchLandlordTenancy(), LandlordTenancyMaintenanceRequest, LandlordTenant, PaymentRecord

### Community 174 - "useVisitRequest.ts"
Cohesion: 0.48
Nodes (5): getVisitRequestQueryKey(), useVisitRequest(), fetchVisitRequest(), VisitRequest, VisitRequestResult

### Community 175 - "useTenancy.test.tsx"
Cohesion: 0.33
Nodes (5): createWrapper(), mockChannel, mockFetchTenancy, mockRemoveChannel, mockUseCurrentUser

### Community 176 - "config"
Cohesion: 0.67
Nodes (3): config, googleMaps, apiKey

### Community 177 - "extra"
Cohesion: 0.67
Nodes (3): projectId, extra, eas

### Community 178 - "useSearchLogic.test.tsx"
Cohesion: 0.50
Nodes (3): mockFrom, mockIsFavorite, mockToggleFavorite

## Knowledge Gaps
- **646 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+641 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **69 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useColors()` connect `useColors` to `apartments/index.ts`, `ScreenWrapper.tsx`, `map-search.tsx`, `[landlordId].tsx`, `ProfitTrendCard.tsx`, `useTheme.ts`, `useConversations.test.tsx`, `search.tsx`, `fifth-step.tsx`, `ErrorDialog.tsx`, `expo-router`, `useFavorites`, `images.ts`, `ai-search.tsx`, `usePersonalizationStore.ts`, `notificationService.ts`, `useVerificationStore.ts`, `[conversationId].tsx`, `notifications/index.ts`, `PaymentMethodSelector.tsx`, `payment-history/[paymentId].tsx`, `landlordService.ts`, `tenant-applications/index.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `useTenancy`, `units.tsx`, `edit-profile.tsx`, `favorites.tsx`, `history/index.tsx`, `payment/index.tsx`, `third-step.tsx`, `ProfitByPropertyCard.tsx`, `app/_layout.tsx`, `document-id/index.tsx`, `review-information.tsx`, `dashboard.tsx`, `maintenance-requests/index.ts`, `RescheduleSheet.tsx`, `useProfile`, `visit-requests/index.tsx`, `ChatBubble.tsx`, `useUserPreferences.ts`, `pending.tsx`, `CustomTabBar.tsx`, `TabBar.tsx`, `rentals.tsx`, `visitRequests/index.ts`, `applications/index.ts`, `sign-in.tsx`, `UploadDocumentField.tsx`, `third-process.tsx`, `useVisitRequestStatusStyles`, `tenant-applications/[applicationId].tsx`, `payments/index.ts`, `applications/[applicationId].tsx`, `[sectionId].tsx`, `second-step.tsx`, `ApplicationList.tsx`?**
  _High betweenness centrality (0.229) - this node is a cross-community bridge._
- **Why does `expo-router` connect `expo-router` to `apartments/index.ts`, `ScreenWrapper.tsx`, `map-search.tsx`, `[landlordId].tsx`, `useTheme.ts`, `search.tsx`, `fifth-step.tsx`, `ErrorDialog.tsx`, `images.ts`, `usePersonalizationStore.ts`, `[conversationId].tsx`, `NotificationScreen.tsx`, `paymongoService.ts`, `payment-history/[paymentId].tsx`, `useColors`, `tenant-applications/index.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `units.tsx`, `useFrameQualityCheck.ts`, `edit-profile.tsx`, `request-visit.tsx`, `plugins`, `favorites.tsx`, `history/index.tsx`, `payment/index.tsx`, `third-step.tsx`, `edit-main.tsx`, `app/_layout.tsx`, `document-id/index.tsx`, `review-information.tsx`, `dashboard.tsx`, `maintenance-requests/index.ts`, `useProfile`, `useInAppNotificationBanner.tsx`, `onboarding.tsx`, `visit-requests/index.tsx`, `pending.tsx`, `CustomTabBar.tsx`, `rentals.tsx`, `applications/index.ts`, `sign-in.tsx`, `third-process.tsx`, `tenant-applications/[applicationId].tsx`, `payments/index.ts`, `playground.tsx`, `applications/[applicationId].tsx`, `[sectionId].tsx`, `second-step.tsx`, `ApplicationList.tsx`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Why does `ScreenWrapper` connect `ScreenWrapper.tsx` to `apartments/index.ts`, `map-search.tsx`, `[landlordId].tsx`, `useTheme.ts`, `search.tsx`, `fifth-step.tsx`, `ErrorDialog.tsx`, `expo-router`, `images.ts`, `ai-search.tsx`, `usePersonalizationStore.ts`, `notificationService.ts`, `[conversationId].tsx`, `NotificationScreen.tsx`, `tenant-applications/index.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `units.tsx`, `edit-profile.tsx`, `request-visit.tsx`, `favorites.tsx`, `history/index.tsx`, `payment/index.tsx`, `third-step.tsx`, `edit-main.tsx`, `app/_layout.tsx`, `document-id/index.tsx`, `review-information.tsx`, `dashboard.tsx`, `maintenance-requests/index.ts`, `useProfile`, `visit-requests/index.tsx`, `pending.tsx`, `rentals.tsx`, `sign-in.tsx`, `third-process.tsx`, `tenant-applications/[applicationId].tsx`, `applications/[applicationId].tsx`, `[sectionId].tsx`, `second-step.tsx`, `ApplicationList.tsx`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _646 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `apartments/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07493061979648474 - nodes in this community are weakly interconnected._
- **Should `ScreenWrapper.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06557377049180328 - nodes in this community are weakly interconnected._
- **Should `map-search.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08490566037735849 - nodes in this community are weakly interconnected._