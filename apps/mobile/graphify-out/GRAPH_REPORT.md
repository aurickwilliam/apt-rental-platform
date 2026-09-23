# Graph Report - mobile  (2026-09-23)

## Corpus Check
- 486 files · ~484,934 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2175 nodes · 5167 edges · 190 communities (120 shown, 70 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.62)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1f90351a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- apartments/index.ts
- ScreenWrapper
- map-search.tsx
- reviews/index.tsx
- ProfitTrendCard.tsx
- second-step.tsx
- conversationService.ts
- search.tsx
- profilesService.ts
- edit-profile.tsx
- devDependencies
- apartment/[apartmentId]/index.tsx
- sign-in.tsx
- useFavorites
- privateMediaResolver.ts
- paymentService.ts
- saved-methods/index.tsx
- ai-search.tsx
- usePersonalizationStore.ts
- notificationService.ts
- verification-flow.test.tsx
- chatService.ts
- [conversationId].tsx
- useVerification.ts
- paymongoService.ts
- compilerOptions
- notifications/index.ts
- PaymentMethodSelector.tsx
- payment-history/index.tsx
- landlordService.ts
- [tenantId].tsx
- tenant-applications/index.tsx
- manage-apartment/[apartmentId]/index.tsx
- upload-id.tsx
- live-capture.tsx
- fifth-step.tsx
- units.tsx
- useCameraPermission
- maintenance-requests/index.ts
- useCurrentUser.ts
- MapPreviewSection.tsx
- useTheme.ts
- visit-requests/index.tsx
- payment/index.tsx
- updateApartmentMain.ts
- audit-fix.characterization.test.ts
- useProfile
- maintenance-requests/index.tsx
- app/_layout.tsx
- auth/index.ts
- useTenancy
- document-id/index.tsx
- HoldMenu.tsx
- pending.tsx
- useChat.ts
- edit-main.tsx
- NotificationScreen.tsx
- selfie-prep.tsx
- emoji-regex-xs
- request-visit.tsx
- chatService.pagination.test.ts
- verificationService.test.ts
- useInAppNotificationBanner.tsx
- onboarding.tsx
- queryClient.ts
- ChatBubble.tsx
- review.tsx
- ScreenWrapper.tsx
- expo-linking
- landlordService.test.ts
- useApplicationFormStore.ts
- useNotifications.ts
- useColors
- TabBar.tsx
- live-capture.test.tsx
- rentals.tsx
- UploadDocumentField.tsx
- applications/index.ts
- reset-password.tsx
- app.config.js
- review.test.tsx
- applications/[applicationId].tsx
- useApplicationActions.test.tsx
- notification-toast.tsx
- history/index.tsx
- metro.config.js
- Welcome to your Expo app 👋
- playground.tsx
- uniwind-types.d.ts
- ReviewField.tsx
- StatusPill.tsx
- eslint.config.js
- useVerificationStore.ts
- expo-crypto
- useVerification.test.tsx
- dependencies
- expo-document-picker
- expo-file-system
- expo-font
- expo-haptics
- expo-image
- expo-image-manipulator
- expo-image-picker
- expo-linear-gradient
- useLandlordTenancy.ts
- @expo/metro-runtime
- expo-splash-screen
- expo-status-bar
- expo-symbols
- expo-system-ui
- @expo/vector-icons
- expo-video
- expo-video-thumbnails
- useLandlordMaintenanceRequests.ts
- ChatBox.tsx
- @gorhom/bottom-sheet
- @gorhom/portal
- usePublishApartment.ts
- @maplibre/maplibre-react-native
- useChatChannel.test.tsx
- @ptomasroos/react-native-multi-slider
- analytics.tsx
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
- DocumentRow.tsx
- react-native-screens
- react-native-svg
- react-native-webview
- react-native-worklets
- expo-blur
- expo-clipboard
- @react-navigation/native
- expo-constants
- @repo/constants
- @repo/hooks
- expo-device-hub
- @tabler/icons-react-native
- tailwind-merge
- @tanstack/react-query
- uniwind
- zustand
- CR80_ASPECT_RATIO
- @expo/dom-webview
- expo-notifications
- react-native-gesture-handler
- react-native-keyboard-aware-scroll-view
- react-native-linear-gradient
- expo
- expo-dev-client
- expo-location
- heroui-native
- react-native
- react-native-web
- react-native-maps
- tailwind-variants
- react-native-svg-transformer
- @repo/supabase

## God Nodes (most connected - your core abstractions)
1. `useColors()` - 351 edges
2. `ScreenWrapper` - 102 edges
3. `StandardHeader()` - 53 edges
4. `useCurrentUser()` - 52 edges
5. `useProfile()` - 44 edges
6. `useApartmentDetails()` - 23 edges
7. `resolvePrivateMediaUrls()` - 22 edges
8. `useVerificationStore` - 22 edges
9. `createMobileQueryClient()` - 21 edges
10. `useFavorites()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `Index()` --calls--> `useColors()`  [EXTRACTED]
  app/(auth)/forgot-password/index.tsx → hooks/useTheme.ts
- `ResetPassword()` --calls--> `useColors()`  [EXTRACTED]
  app/(auth)/forgot-password/reset-password.tsx → hooks/useTheme.ts
- `Failed()` --calls--> `useColors()`  [EXTRACTED]
  app/(auth)/verify-account/failed.tsx → hooks/useTheme.ts
- `ReviewPhotoCard()` --calls--> `useColors()`  [EXTRACTED]
  app/(auth)/verify-account/review.tsx → hooks/useTheme.ts
- `CaptureStepSummary()` --calls--> `useColors()`  [EXTRACTED]
  app/(auth)/verify-account/upload-id.tsx → hooks/useTheme.ts

## Import Cycles
- 2-file cycle: `hooks/applications/index.ts -> hooks/applications/useApplicationActions.ts -> hooks/applications/index.ts`
- 2-file cycle: `hooks/applications/index.ts -> service/applications/tenantApplicationsService.ts -> hooks/applications/index.ts`
- 3-file cycle: `hooks/applications/index.ts -> hooks/applications/useTenantApplications.ts -> service/applications/tenantApplicationsService.ts -> hooks/applications/index.ts`
- 3-file cycle: `hooks/payments/index.ts -> hooks/payments/usePayments.ts -> service/payments/paymentService.ts -> hooks/payments/index.ts`

## Communities (190 total, 70 thin omitted)

### Community 0 - "apartments/index.ts"
Cohesion: 0.17
Nodes (16): ApartmentSummary(), ApartmentDetailsSection(), ApartmentDetailsSectionProps, ApartmentHeroSection(), ApartmentHeroSectionProps, ApartmentImage, IncludedPerks(), getApartmentDetailsQueryKey() (+8 more)

### Community 1 - "ScreenWrapper"
Cohesion: 0.07
Nodes (28): RateApartmentSkeleton(), ErrorDialogState, FormErrors, TenancyLeasePeriod, DOCUMENT_TYPE_ICONS, SelectDocument(), TODO: Persist the uploaded document to Supabase Storage and store its, Upload() (+20 more)

### Community 2 - "map-search.tsx"
Cohesion: 0.08
Nodes (47): ApartmentMapViewScreen(), DirectionMode, MapPin(), MapPreviewSheet(), Props, INITIAL_REGION, TenantMapSearchScreen(), GoogleMapPin (+39 more)

### Community 3 - "reviews/index.tsx"
Cohesion: 0.08
Nodes (35): RatingBarCount(), RatingBarCountProps, RatingsPage(), ReviewsPage(), SORT_OPTIONS, DropdownButton(), DropdownButtonProps, formatMultiDisplay() (+27 more)

### Community 4 - "ProfitTrendCard.tsx"
Cohesion: 0.10
Nodes (21): BUILDERS, ChartDatum, FilterOption, filterOptions, ProfitTrendCard(), ProfitTrendCardProps, toMonthly(), EMPTY_DASHBOARD_DATA (+13 more)

### Community 5 - "second-step.tsx"
Cohesion: 0.14
Nodes (17): Amenities(), FourthStep(), FormErrors, Index(), DEFAULT_ROOM_LIMITS, formatLimitMessage(), formatRange(), FormErrors (+9 more)

### Community 6 - "conversationService.ts"
Cohesion: 0.06
Nodes (49): ConversationRow(), ConversationRowProps, AvatarMock(), ButtonLabel(), ButtonMock(), MockIcon(), PressableFeedbackMock(), SwipeableStub() (+41 more)

### Community 7 - "search.tsx"
Cohesion: 0.07
Nodes (37): SectionDetail(), BEDROOM_OPTIONS, FAMILY_OPTIONS, NO_PARKING_OPTIONS, RentalPreferences(), DEFAULT_FILTERS, FilterBottomSheet(), FilterState (+29 more)

### Community 8 - "profilesService.ts"
Cohesion: 0.22
Nodes (14): getPublicLandlordProfileQueryKey(), usePublicLandlordProfile(), getPublicTenantProfileQueryKey(), usePublicTenantProfile(), fetchPublicLandlordProfile(), fetchPublicTenantProfile(), formatMonth(), formatYear() (+6 more)

### Community 9 - "edit-profile.tsx"
Cohesion: 0.09
Nodes (29): AuthCompleteProfile(), ProfileForm, requiredFields, CompleteProfile(), ProfileForm, requiredFields, OTPVerification(), OTPVerification() (+21 more)

### Community 10 - "devDependencies"
Cohesion: 0.05
Nodes (42): eslint, eslint-config-expo, eslint-import-resolver-typescript, expo-doctor, fast-check, jest, jest-expo, metro-minify-terser (+34 more)

### Community 11 - "apartment/[apartmentId]/index.tsx"
Cohesion: 0.15
Nodes (15): ApartmentSkeleton(), ApartmentDescriptionSection(), ApartmentDescriptionSectionProps, LandlordSection(), LandlordSectionProps, LeaseAgreementSection(), LeaseAgreementSectionProps, PerksSection() (+7 more)

### Community 12 - "sign-in.tsx"
Cohesion: 0.26
Nodes (9): AuthButton(), AuthButtonProps, AuthDivider(), AuthDividerProps, RoleTab(), RoleTabProps, SignIn(), SignUp() (+1 more)

### Community 13 - "useFavorites"
Cohesion: 0.16
Nodes (22): ApartmentScreen(), TenantFavorites(), getErrorMessage(), getFavoriteApartmentsQueryKey(), getFavoritesQueryKey(), createWrapper(), mockDeleteFavorite, mockFetchApartmentsByIds (+14 more)

### Community 14 - "privateMediaResolver.ts"
Cohesion: 0.10
Nodes (29): UseLeaseAgreementOptions, DocEntry, ResolvedDoc, DocumentEntriesProps, mockResolvePrivateMediaUrls, useDocumentUrls(), cacheKey(), chatMediaRetryKeys (+21 more)

### Community 15 - "paymentService.ts"
Cohesion: 0.16
Nodes (17): getPaymentByReferenceQueryKey(), getPaymentQueryKey(), getPaymentsQueryKey(), usePaymentByReference(), CreateCashPaymentParams, fetchPaymentById(), fetchPaymentByReferenceId(), fetchPayments() (+9 more)

### Community 16 - "saved-methods/index.tsx"
Cohesion: 0.33
Nodes (7): getLogoSource(), maskMobileNumber(), PaymentMethod, PaymentMethodCard(), PaymentMethodCardProps, Index(), INITIAL_PAYMENT_METHODS

### Community 17 - "ai-search.tsx"
Cohesion: 0.09
Nodes (21): AISearchScreen(), SUGGESTION_CHIPS, AIHeader(), AIHeaderProps, EmptyChatState(), MessageBubble(), MessageBubbleProps, MessageComposer() (+13 more)

### Community 18 - "usePersonalizationStore.ts"
Cohesion: 0.13
Nodes (20): CityCheckBox(), CityCheckBoxProps, PersonalizationProgress(), Props, PersonalizationRadioButton(), PersonalizationRadioButtonProps, StepFive(), StepFour() (+12 more)

### Community 19 - "notificationService.ts"
Cohesion: 0.17
Nodes (16): GENERAL_TOGGLES, GeneralToggleKey, NOTIFICATION_TYPE_LABELS, getNotificationPreferencesQueryKey(), createWrapper(), mockFetchNotificationPreferences, mockUpdateNotificationPreferences, mockUseCurrentUser (+8 more)

### Community 20 - "verification-flow.test.tsx"
Cohesion: 0.23
Nodes (7): SelectId(), StepProgress(), StepProgressProps, mockBack, mockDismissTo, mockPush, mockReplace

### Community 21 - "chatService.ts"
Cohesion: 0.14
Nodes (21): AttachmentUploadFailure, buildOlderThanChatMessageFilter(), ChatMessageCursor, ChatMessagePage, EXTENSION_BY_MIME_TYPE, fetchMessagePage(), fetchMessages(), fetchOtherUserProfile() (+13 more)

### Community 22 - "[conversationId].tsx"
Cohesion: 0.10
Nodes (22): ChatBubble(), formatHoldDate(), playReactionHaptic(), ChatEmptyState(), ChatEmptyStateProps, ChatHeader(), ChatHeaderProps, ChatLoadingSkeleton() (+14 more)

### Community 23 - "useVerification.ts"
Cohesion: 0.25
Nodes (16): useCurrentUserId(), getUserVerificationHistoryQueryKey(), getUserVerificationQueryKey(), useLatestVerification(), useSubmitVerification(), useVerificationHistory(), buildVerificationInput(), fetchLatestVerification() (+8 more)

### Community 24 - "paymongoService.ts"
Cohesion: 0.17
Nodes (11): PaymentVerify(), extractError(), getCheckoutSessionStatus(), invoke(), PaymongoCard, PaymongoCardPaymentResult, PaymongoCheckoutSession, PaymongoEnvelope (+3 more)

### Community 25 - "compilerOptions"
Cohesion: 0.07
Nodes (26): ./assets/*, ./components/*, ./constants/*, expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.ts, ./hooks/*, jest (+18 more)

### Community 26 - "notifications/index.ts"
Cohesion: 0.32
Nodes (12): NotificationCard(), NotificationCardProps, NotificationSettingsScreen(), NotificationToastContent(), TOAST_VARIANT_BY_TYPE, getNotificationTypeIcon(), iconMap, isRentDueNotification() (+4 more)

### Community 27 - "PaymentMethodSelector.tsx"
Cohesion: 0.13
Nodes (18): CardInformation, CardPaymentForm(), CardPaymentFormProps, CashPaymentErrors, CashPaymentForm(), CashPaymentFormProps, PaymentMethodButton(), PaymentMethodButtonProps (+10 more)

### Community 28 - "payment-history/index.tsx"
Cohesion: 0.19
Nodes (18): PaymentHistoryCard(), PaymentHistoryCardProps, EMPTY_FILTERS, FlatPayment, PaymentHistoryScreen(), toFlatPayment(), LandlordPaymentReceipt(), ReceiptCard() (+10 more)

### Community 29 - "landlordService.ts"
Cohesion: 0.10
Nodes (25): TenantApplications(), Units(), EMPTY_COUNTS, getLandlordBadgesQueryKey(), useLandlordActionBadges(), ActionBadgeCategory, ActionBadgeCounts, asNullableString() (+17 more)

### Community 30 - "[tenantId].tsx"
Cohesion: 0.12
Nodes (18): PublicTenantProfile(), TODO: Implement function to handle report tenant, CompleteProfileCard(), CompleteProfileCardProps, ProfileHeader(), ProfileHeaderProps, AccountStatus, StatusConfig (+10 more)

### Community 31 - "tenant-applications/index.tsx"
Cohesion: 0.17
Nodes (12): ApplicationFilters, ApplicationFilterSheet(), LOCATION_OPTIONS, Props, STATUS_OPTIONS, getInitials(), STATUS_STYLES, TenantApplicationCard() (+4 more)

### Community 32 - "manage-apartment/[apartmentId]/index.tsx"
Cohesion: 0.14
Nodes (12): MaintenanceRequestCard(), MaintenanceRequestCardProps, PropertyActionMenu(), Props, ApartmentImage, PropertyOverview(), Props, PropertyOverviewSkeleton() (+4 more)

### Community 33 - "upload-id.tsx"
Cohesion: 0.28
Nodes (11): CaptureStepConfig, CaptureStepSummary(), CaptureStepSummaryProps, UploadId(), UploadSelfie(), CaptureProgress, computeCanContinue(), getCaptureProgress() (+3 more)

### Community 34 - "live-capture.tsx"
Cohesion: 0.12
Nodes (17): CapturedPhoto, ScreenState, CropPhotoOptions, cropPhotoToFrame(), ImageCropRegion, isCropRegionSane(), mapGuidedRectToImageCrop(), computeFillRatio() (+9 more)

### Community 35 - "fifth-step.tsx"
Cohesion: 0.15
Nodes (13): DEFAULT_COORDS, FifthStep(), MAP_STYLE, Index(), CurrentApartmentDetails(), formatDateToMonthYear(), Divider(), DividerProps (+5 more)

### Community 36 - "units.tsx"
Cohesion: 0.12
Nodes (16): QuickActionButton(), QuickActionButtonProps, PropertyCard(), PropertyCardProps, PropertyCardSkeleton(), PropertyFilterSheet(), PropertyFilterSheetProps, SORT_LABELS (+8 more)

### Community 37 - "useCameraPermission"
Cohesion: 0.50
Nodes (3): CameraPermissionState, useCameraPermission(), UseCameraPermissionResult

### Community 38 - "maintenance-requests/index.ts"
Cohesion: 0.10
Nodes (30): EmptyMaintenanceRequestDetail(), MaintenanceRequestCard(), MaintenanceRequestCardProps, ResolveRequestDialog(), ResolveRequestDialogProps, MaintenanceRequestDetails(), MaintenanceRequestCard(), MaintenanceRequestCardProps (+22 more)

### Community 39 - "useCurrentUser.ts"
Cohesion: 0.57
Nodes (4): getCurrentUser(), getUserProfileByColumn(), getUserProfileById(), UserProfile

### Community 40 - "MapPreviewSection.tsx"
Cohesion: 0.19
Nodes (10): DirectionMode, MapPreviewSection(), MapPreviewSectionProps, MoveInCostFooterProps, MoveInCostFooterSection(), AppDialog(), AppDialogProps, formatOrNone() (+2 more)

### Community 41 - "useTheme.ts"
Cohesion: 0.09
Nodes (28): PublicLandlordProfile(), TODO: Implement function to handle report landlord, DashboardSkeleton(), chartLabel(), ProfitByPropertyCard(), ProfitByPropertyCardProps, RentDueCard(), RentDueCardProps (+20 more)

### Community 42 - "visit-requests/index.tsx"
Cohesion: 0.18
Nodes (12): VisitRequestCalendar(), VisitRequestCalendarProps, getGroup(), Group, GROUP_ORDER, GroupedItem, PastToggle(), VisitRequests() (+4 more)

### Community 43 - "payment/index.tsx"
Cohesion: 0.18
Nodes (16): Rentals(), validateCashPayment(), PaymentFooter(), PaymentFooterProps, PaymentSummaryCard(), PaymentSummaryCardProps, formatLeaseDate(), INITIAL_CARD (+8 more)

### Community 44 - "updateApartmentMain.ts"
Cohesion: 0.24
Nodes (11): EditMain(), validateForm(), ApartmentMainFields, deleteStorageImage(), ExistingImage, PendingImage, thumbPathFor(), updateApartmentMain() (+3 more)

### Community 45 - "audit-fix.characterization.test.ts"
Cohesion: 0.12
Nodes (10): ChatRow, mockChannel, mockChatRows, mockCreateSignedUrls, mockFrom, mockGetUser, mockRemoveChannel, mockStorageFrom (+2 more)

### Community 46 - "useProfile"
Cohesion: 0.16
Nodes (13): RateApartment(), TabsLayout(), useProfile(), SubmitReviewParams, SubmitReviewResult, useSubmitReview(), useSubmitVisitRequest(), VisitRequestPayload (+5 more)

### Community 47 - "maintenance-requests/index.tsx"
Cohesion: 0.19
Nodes (10): EmptyMaintenanceRequestsList(), MaintenanceRequestCardSkeleton(), LOCATION_OPTIONS, MaintenanceRequestFilters, MaintenanceRequestFilterSheet(), Props, STATUS_OPTIONS, URGENCY_OPTIONS (+2 more)

### Community 48 - "app/_layout.tsx"
Cohesion: 0.23
Nodes (9): Index(), RootLayout(), ThemeInitializer(), Index(), DevBadge(), useTheme(), ThemeMode, ThemeStore (+1 more)

### Community 49 - "auth/index.ts"
Cohesion: 0.24
Nodes (8): NotificationManager(), UseCountdownOptions, useCurrentUser(), useInAppNotificationBanner(), useNotificationTapHandler(), usePushRegistration(), deletePushToken(), markNotificationRead()

### Community 50 - "useTenancy"
Cohesion: 0.09
Nodes (30): getErrorMessage(), getRecordString(), getTenancyQueryKey(), useTenancy(), attachPaymentChannel(), attachSubscriber(), attachTenantChannel(), Channel (+22 more)

### Community 51 - "document-id/index.tsx"
Cohesion: 0.23
Nodes (11): DocumentCard(), DocumentCardProps, Index(), TODO: Implement contact support functionality,, TODO: Fetch and display user's uploaded documents and IDs here. This may…, UploadedDocument, DOCUMENT_EXTENSIONS, getExtension() (+3 more)

### Community 52 - "HoldMenu.tsx"
Cohesion: 0.22
Nodes (7): HoldMenu(), HoldMenuData, HoldMenuProps, baseData, QUICK_REACTIONS, ReactionStrip(), ReactionStripProps

### Community 53 - "pending.tsx"
Cohesion: 0.22
Nodes (10): VisitRequestCardSkeleton(), DATE_RANGE_OPTIONS, DateRange, Props, STATUS_OPTIONS, VisitRequestFilters, VisitRequestFilterSheet(), EMPTY_FILTERS (+2 more)

### Community 54 - "useChat.ts"
Cohesion: 0.12
Nodes (23): Options, useChat(), BroadcastEvent, BroadcastPayload, DeleteEvent, DeletePayload, PresenceJoinEvent, PresenceLeaveEvent (+15 more)

### Community 55 - "edit-main.tsx"
Cohesion: 0.17
Nodes (9): FormErrors, FieldErrors, ThirdStep(), ApartmentInformation, DisplayImage, UploadFileField(), UploadFileFieldProps, UploadImageField() (+1 more)

### Community 56 - "NotificationScreen.tsx"
Cohesion: 0.18
Nodes (10): NotificationCardType, NotificationCardSkeleton(), NotificationFilter, NotificationList(), NotificationListProps, NotificationScreen(), NotificationScreenProps, useNotificationActions() (+2 more)

### Community 57 - "selfie-prep.tsx"
Cohesion: 0.20
Nodes (9): GuidelineIcon, SELFIE_GUIDELINES, SelfieGuideline, SelfiePrep(), BACK_CAPTURE, FRONT_CAPTURE, mockBack, mockPush (+1 more)

### Community 59 - "request-visit.tsx"
Cohesion: 0.14
Nodes (13): Period, Props, RescheduleSheet(), tomorrow, toSupabaseTime(), RequestVisit(), Props, QuantityField() (+5 more)

### Community 60 - "chatService.pagination.test.ts"
Cohesion: 0.18
Nodes (6): ChatRow, mockFrom, mockStorageFrom, pageResponses, QueryLog, queryLogs

### Community 61 - "verificationService.test.ts"
Cohesion: 0.18
Nodes (8): ChainResult, createdRow, mockFrom, mockGetUser, mockRemove, mockStorageFrom, mockUpload, validInput

### Community 62 - "useInAppNotificationBanner.tsx"
Cohesion: 0.30
Nodes (6): getOpenChatConversationKey(), shouldSuppressChatToast(), buildNotificationDeepLink(), NotificationData, parseConversationKey(), Role

### Community 63 - "onboarding.tsx"
Cohesion: 0.21
Nodes (7): { width }, OnBoardingSlide(), OnBoardingSlideProps, Slide, SLIDES, USER_ROLES, UserRole

### Community 64 - "queryClient.ts"
Cohesion: 0.09
Nodes (26): QueryProvider(), QueryProviderProps, createWrapper(), mockFetchApartmentDetails, mockFetchReviewsPreview, createWrapper(), mockFetchTenantApplications, mockUseCurrentUser (+18 more)

### Community 65 - "ChatBubble.tsx"
Cohesion: 0.20
Nodes (14): BlurBackdrop(), calculateImageSize(), ChatBubbleContent(), ChatBubbleContentProps, ChatBubbleProps, getReplySnippet(), mockPlayer, useDoubleTapPress() (+6 more)

### Community 66 - "review.tsx"
Cohesion: 0.18
Nodes (14): ALL_SUPPORTED_ID_TYPES, CaptureCameraFacing, CaptureGuideShape, CARD_SEQUENCE, getCaptureSequence(), getNextCaptureStep(), PASSPORT_SEQUENCE, SELFIE_STEP (+6 more)

### Community 67 - "ScreenWrapper.tsx"
Cohesion: 0.12
Nodes (8): Index(), Failed(), Add(), PAYMENT_METHOD_TYPES, PaymentMethodType, ScreenWrapperProps, IMAGES, PAYMENT_METHOD_LOGOS

### Community 69 - "landlordService.test.ts"
Cohesion: 0.18
Nodes (13): getLandlordPaymentsQueryKey(), useLandlordPaymentConfirmation(), useLandlordPayments(), useLandlordStats(), fetchLandlordPayments(), fetchLandlordStats(), LandlordPaymentRecord, LandlordStats (+5 more)

### Community 70 - "useApplicationFormStore.ts"
Cohesion: 0.09
Nodes (29): ReviewAccordionItem(), ReviewAccordionItemProps, FieldErrors, FirstProcess(), ReviewInformation(), FormErrors, SecondProcess(), ThirdProcess() (+21 more)

### Community 71 - "useNotifications.ts"
Cohesion: 0.26
Nodes (13): attach(), ChannelEntry, detach(), handleEvent(), registry, useNotificationRealtime(), getErrorMessage(), getUnreadNotificationsQueryKey() (+5 more)

### Community 72 - "useColors"
Cohesion: 0.07
Nodes (29): ReviewDocumentFile(), ReviewDocumentFileProps, ReviewDocumentImage(), ReviewDocumentImageProps, IconButton(), IconButtonProps, IconComponent, BasePerkButtonProps (+21 more)

### Community 73 - "TabBar.tsx"
Cohesion: 0.31
Nodes (6): TabBar(), TabBarIcon(), TabBarIconProps, IconProps, LANDLORDICONS, TENANTICONS

### Community 74 - "live-capture.test.tsx"
Cohesion: 0.17
Nodes (12): captureAndReachReview(), mockBack, mockCropAction, mockDismissTo, mockFlipAction, mockManipulate, mockRenderAsync, mockReplace (+4 more)

### Community 75 - "rentals.tsx"
Cohesion: 0.12
Nodes (13): ApartmentDescriptionCard(), ApartmentDescriptionCardProps, ApplicationsList(), ApplicationsEmptyState(), ApplicationStatusCardSkeleton(), PaymentSummaryCard(), PaymentSummaryCardProps, RentalsSkeleton() (+5 more)

### Community 76 - "UploadDocumentField.tsx"
Cohesion: 0.22
Nodes (11): EditProfile(), ACCEPTED_FILE_TYPES, UploadDocumentField(), UploadDocumentFieldProps, UploadedDocument, BUCKET_MAP, UploadTarget, useImageUpload() (+3 more)

### Community 77 - "applications/index.ts"
Cohesion: 0.13
Nodes (20): ApplicationStatusCard(), Props, ApplicationApartment(), ApplicationStatus, ApplicationStatusStyle, ChipColor, FALLBACK_STYLE(), useApplicationStatusStyles() (+12 more)

### Community 78 - "reset-password.tsx"
Cohesion: 0.50
Nodes (3): ResetPassword(), AppInput(), AppInputProps

### Community 80 - "review.test.tsx"
Cohesion: 0.18
Nodes (10): BACK_CAPTURE, BUILT_INPUT, COMPLETE_STATE, FRONT_CAPTURE, mockBack, mockBuildVerificationInput, mockMutateAsync, mockPush (+2 more)

### Community 81 - "applications/[applicationId].tsx"
Cohesion: 0.14
Nodes (15): VisitRequestCard(), VisitRequestCardProps, VisitRequestDetails(), Props, VisitRequest, VisitRequestCard(), Props, VisitRequestHistoryItem() (+7 more)

### Community 82 - "useApplicationActions.test.tsx"
Cohesion: 0.15
Nodes (17): getStatusStyle(), TenantApplicationDetails(), getLandlordUnitsQueryKey(), useLandlordUnits(), createWrapper(), mockEq, mockFrom, mockUpdate (+9 more)

### Community 83 - "notification-toast.tsx"
Cohesion: 0.22
Nodes (9): MOCK_TOASTS, MockRow, MockToast, NotificationToastDevScreen(), NotificationToastContentProps, NotificationToastOptions, showNotificationToast(), NotificationRealtimeCallbacks (+1 more)

### Community 84 - "history/index.tsx"
Cohesion: 0.14
Nodes (16): ReceiptCardProps, PaymentHistoryCard(), PaymentHistoryCardProps, PaymentHistoryItem, PaymentHistoryFilters, PaymentHistoryFilterSheet(), PaymentSort, Props (+8 more)

### Community 86 - "metro.config.js"
Cohesion: 0.33
Nodes (5): config, { getDefaultConfig }, monorepoRoot, path, { withUniwindConfig }

### Community 87 - "Welcome to your Expo app 👋"
Cohesion: 0.33
Nodes (5): Get a fresh project, Get started, Join the community, Learn more, Welcome to your Expo app 👋

### Community 89 - "uniwind-types.d.ts"
Cohesion: 0.50
Nodes (3): NOTE: This file is generated by uniwind and it should not be edited manually., uniwind, UniwindConfig

### Community 98 - "useVerificationStore.ts"
Cohesion: 0.13
Nodes (16): Success(), initialVerificationState, useVerificationStore, VerificationData, VerificationStore, mockAddListener, mockDispatch, mockProfile (+8 more)

### Community 100 - "useVerification.test.tsx"
Cohesion: 0.22
Nodes (7): mockFetchLatestVerification, mockFrom, mockGetUser, mockSubmitVerification, profileRecord, submitInput, verificationRow

### Community 101 - "dependencies"
Cohesion: 0.12
Nodes (17): expo-camera, expo-device, expo-web-browser, @giphy/react-native-sdk, @miblanchard/react-native-slider, dependencies, expo-camera, expo-device (+9 more)

### Community 111 - "useLandlordTenancy.ts"
Cohesion: 0.36
Nodes (7): Index(), getLandlordTenancyQueryKey(), useLandlordTenancy(), fetchLandlordTenancy(), LandlordTenancyMaintenanceRequest, LandlordTenant, PaymentRecord

### Community 121 - "useLandlordMaintenanceRequests.ts"
Cohesion: 0.43
Nodes (7): getLandlordMaintenanceRequestsQueryKey(), getNextStatus(), STATUS_FLOW, useLandlordMaintenanceRequests(), fetchLandlordMaintenanceRequests(), LandlordMaintenanceRequest, updateLandlordMaintenanceStatus()

### Community 122 - "ChatBox.tsx"
Cohesion: 0.33
Nodes (6): ATTACHMENT_OPTIONS, ChatBox(), ChatBoxProps, getSnippet(), StagedAsset, PickedChatAsset

### Community 125 - "usePublishApartment.ts"
Cohesion: 0.60
Nodes (5): getMimeType(), uploadBytes(), uploadImage(), usePublishApartment(), buildImageTiers()

### Community 128 - "useChatChannel.test.tsx"
Cohesion: 0.33
Nodes (5): ChannelHandler, MockChannel, mockChannels, mockGetChannels, mockRemoveChannel

### Community 130 - "analytics.tsx"
Cohesion: 0.40
Nodes (4): AnalyticsScreen(), MAX_AMOUNT, monthlyData, stats

### Community 141 - "DocumentRow.tsx"
Cohesion: 0.50
Nodes (4): DocumentRow(), DocumentRowProps, getExtension(), IMAGE_EXTENSIONS

## Knowledge Gaps
- **677 isolated node(s):** `googleMapsKey`, `googleServicesFile`, `ProfileForm`, `requiredFields`, `ProfileForm` (+672 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **70 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useColors()` connect `useColors` to `apartments/index.ts`, `ScreenWrapper`, `map-search.tsx`, `reviews/index.tsx`, `analytics.tsx`, `second-step.tsx`, `conversationService.ts`, `search.tsx`, `ProfitTrendCard.tsx`, `edit-profile.tsx`, `apartment/[apartmentId]/index.tsx`, `sign-in.tsx`, `useFavorites`, `DocumentRow.tsx`, `saved-methods/index.tsx`, `ai-search.tsx`, `usePersonalizationStore.ts`, `notificationService.ts`, `verification-flow.test.tsx`, `[conversationId].tsx`, `notifications/index.ts`, `PaymentMethodSelector.tsx`, `payment-history/index.tsx`, `landlordService.ts`, `[tenantId].tsx`, `tenant-applications/index.tsx`, `manage-apartment/[apartmentId]/index.tsx`, `upload-id.tsx`, `live-capture.tsx`, `fifth-step.tsx`, `units.tsx`, `maintenance-requests/index.ts`, `MapPreviewSection.tsx`, `useTheme.ts`, `visit-requests/index.tsx`, `payment/index.tsx`, `useProfile`, `maintenance-requests/index.tsx`, `app/_layout.tsx`, `document-id/index.tsx`, `HoldMenu.tsx`, `pending.tsx`, `edit-main.tsx`, `selfie-prep.tsx`, `request-visit.tsx`, `ChatBubble.tsx`, `review.tsx`, `ScreenWrapper.tsx`, `TabBar.tsx`, `rentals.tsx`, `UploadDocumentField.tsx`, `applications/index.ts`, `reset-password.tsx`, `applications/[applicationId].tsx`, `useApplicationActions.test.tsx`, `history/index.tsx`, `useLandlordTenancy.ts`, `ChatBox.tsx`?**
  _High betweenness centrality (0.341) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `@ptomasroos/react-native-multi-slider`, `react-dom`, `expo-router`, `@react-native-async-storage/async-storage`, `conversationService.ts`, `react-native-awesome-gallery`, `react-native-calendars`, `@react-native-community/datetimepicker`, `devDependencies`, `@react-native-community/slider`, `react-native-gifted-charts`, `react-native-image-viewing`, `react-native-reanimated`, `react-native-screens`, `react-native-svg`, `react-native-webview`, `react-native-worklets`, `expo-blur`, `expo-clipboard`, `@react-navigation/native`, `expo-constants`, `@repo/constants`, `@repo/hooks`, `expo-device-hub`, `@tabler/icons-react-native`, `tailwind-merge`, `@tanstack/react-query`, `uniwind`, `zustand`, `@expo/dom-webview`, `expo-notifications`, `react-native-gesture-handler`, `react-native-keyboard-aware-scroll-view`, `react-native-linear-gradient`, `expo`, `expo-dev-client`, `expo-location`, `heroui-native`, `react-native`, `react-native-web`, `emoji-regex-xs`, `react-native-maps`, `react-native-svg-transformer`, `@repo/supabase`, `tailwind-variants`, `expo-linking`, `expo-crypto`, `expo-document-picker`, `expo-file-system`, `expo-font`, `expo-haptics`, `expo-image`, `expo-image-manipulator`, `expo-image-picker`, `expo-linear-gradient`, `@expo/metro-runtime`, `expo-splash-screen`, `expo-status-bar`, `expo-symbols`, `expo-system-ui`, `@expo/vector-icons`, `expo-video`, `expo-video-thumbnails`, `@gorhom/bottom-sheet`, `@gorhom/portal`, `@maplibre/maplibre-react-native`?**
  _High betweenness centrality (0.183) - this node is a cross-community bridge._
- **Why does `react` connect `conversationService.ts` to `dependencies`?**
  _High betweenness centrality (0.174) - this node is a cross-community bridge._
- **What connects `googleMapsKey`, `googleServicesFile`, `ProfileForm` to the rest of the system?**
  _677 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ScreenWrapper` be split into smaller, more focused modules?**
  _Cohesion score 0.06578947368421052 - nodes in this community are weakly interconnected._
- **Should `map-search.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07578084997439836 - nodes in this community are weakly interconnected._
- **Should `reviews/index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08078231292517007 - nodes in this community are weakly interconnected._