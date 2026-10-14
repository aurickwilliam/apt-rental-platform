import ConfirmDialog from '@/components/display/ConfirmDialog'

import type { ConversationActionOverlaysState } from '@/hooks/chat/useConversationRowActions'

import ConversationMoreSheet from './ConversationMoreSheet'
import ReportUserDialog from './ReportUserDialog'

/** The More sheet, report dialog and block confirmation for a Messages list. */
export default function ConversationActionOverlays({
  moreTarget,
  isMoreOpen,
  isMorePinLocked,
  onMoreOpenChange,
  onSelectMoreAction,
  reportTarget,
  reportError,
  isReporting,
  onCloseReport,
  onSubmitReport,
  blockTarget,
  blockError,
  onCloseBlock,
  onConfirmBlock,
}: ConversationActionOverlaysState) {
  const blockName = blockTarget?.other_user_name || 'this person';

  return (
    <>
      <ConversationMoreSheet
        conversation={moreTarget}
        isOpen={isMoreOpen}
        isPinLocked={isMorePinLocked}
        onOpenChange={onMoreOpenChange}
        onSelect={onSelectMoreAction}
      />

      {/* Keyed by conversation so the form starts empty for each person. */}
      <ReportUserDialog
        key={reportTarget?.conversation_key ?? 'none'}
        isOpen={reportTarget !== null}
        name={reportTarget?.other_user_name || 'this person'}
        isSubmitting={isReporting}
        errorMessage={reportError}
        onClose={onCloseReport}
        onSubmit={(reason, details) => void onSubmitReport(reason, details)}
      />

      <ConfirmDialog
        isOpen={blockTarget !== null}
        onOpenChange={(open) => { if (!open) onCloseBlock(); }}
        title={`Block ${blockName}?`}
        description={`You and ${blockName} won't be able to message each other. They won't be told. You can unblock them anytime from this chat's options.`}
        confirmLabel='Block'
        onConfirm={() => void onConfirmBlock()}
        errorMessage={blockError}
      />
    </>
  );
}
