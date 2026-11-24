import type { passport as enPassport } from "../en/passport";

export const passport: Record<keyof typeof enPassport, string> = {
  "passport.title": "APT Passport",
  "passport.back": "APT Passport",
  "passport.subtitle.tenant":
    "Ang verified ID at mga supporting document mo, awtomatikong kasama kapag nag-apply ka.",
  "passport.subtitle.landlord":
    "Ang verified ID at mga dokumento ng pagmamay-ari mo. Ipinapakita nito sa mga tenant na legitimate landlord ka.",
  "passport.loadingDocuments": "Naglo-load ng mga dokumento…",
  "passport.loadingDocument": "Naglo-load ng dokumento…",

  "passport.card.meta": "Naidagdag {date} · {expiry}",
  "passport.card.expires": "Mag-e-expire {date}",
  "passport.card.noExpiry": "Walang expiry",

  "passport.picker.intro.tenant":
    "Pumili ng uri ng dokumentong gusto mong idagdag.",
  "passport.picker.intro.landlord":
    "Piliin ang dokumentong nagpapatunay na ikaw ang may-ari o awtorisadong magpaupa ng mga property mo.",
  "passport.picker.reviewHintBefore": "Ang mga uri na may",
  "passport.picker.reviewHintAfter":
    "ay puwedeng ipadala para sa review pagkatapos mong idagdag. Awtomatikong naidadagdag ang government ID mo kapag naaprubahan ang verification ng account mo.",
  "passport.picker.shieldLabel": "shield",
  "passport.picker.alreadyAdded":
    "Naidagdag na. Buksan ito sa wallet mo para palitan ang file.",
  "passport.picker.canBeVerified": "Puwedeng i-verify",

  "passport.id.title": "Government ID",
  "passport.id.autoLinked":
    "Awtomatikong naka-link ang ID mo mula sa naaprubahang verification ng account mo.",
  "passport.id.enlargeAria": "Palakihin ang {side} ng ID mo",
  "passport.id.alt": "{idType} ({side})",
  "passport.id.previewUnavailable": "Walang preview",
  "passport.id.showFront": "Ipakita ang harap ng ID",
  "passport.id.showBack": "Ipakita ang likod ng ID",
  "passport.id.side.front": "harap",
  "passport.id.side.back": "likod",

  "passport.readiness.title": "Mga dokumento sa application",
  "passport.readiness.ready": "Ready nang mag-apply",
  "passport.readiness.notReady": "Hindi pa ready",
  "passport.readiness.hint.required": "Kailangan",
  "passport.readiness.hint.income":
    "Kailangan maliban kung student o unemployed ka",
  "passport.readiness.hint.optional": "Optional",
  "passport.readiness.expired":
    "Expired na. Mag-upload ng bagong kopya.",
  "passport.readiness.addAria": "Idagdag ang {slot}",
  "passport.readiness.add": "Idagdag",
  "passport.readiness.verify": "I-verify",

  "passport.profile.verified": "Na-verify na ang pagkakakilanlan mo.",
  "passport.profile.pending":
    "Sinusuri pa ang verification ng pagkakakilanlan mo.",
  "passport.profile.rejected":
    "Hindi natuloy ang verification. I-review ang resulta at mag-submit ulit.",
  "passport.profile.unverified":
    "I-verify ang pagkakakilanlan mo para makapagsimula.",
  "passport.profile.open": "Buksan ang Passport",
  "passport.profile.apply": "Mag-apply ng Verification",
  "passport.profile.reapply": "Mag-apply Ulit ng Verification",

  "passport.activity.loading": "Naglo-load ng progreso ng verification",

  "passport.loadError.title": "Hindi ma-load ang mga dokumento mo",
  "passport.loadError.retry": "Subukan Uli",

  "passport.supporting.title": "Mga supporting document",
  "passport.supporting.count": "{count} dokumento",
  "passport.supporting.countPlural": "{count} dokumento",
  "passport.supporting.layoutAria": "Layout ng dokumento",
  "passport.supporting.gridView": "Grid view",
  "passport.supporting.listView": "List view",
  "passport.supporting.emptyTitle": "Wala pang supporting document",
  "passport.supporting.emptyBody.tenant":
    "Magdagdag ng payslip, billing statement, o clearance para ready na ang mga ito kapag nag-apply ka ng apartment. Ipinapakita lang ang mga dokumento sa mga landlord na ina-applyan mo.",
  "passport.supporting.emptyBody.landlord":
    "Magdagdag ng tax declaration, land title, business permit o iba pang dokumento ng pagmamay-ari para mapaniwalaan ng mga tenant ang mga listing mo. Sinusuri ito ng team namin para kumpirmahing legitimate landlord ka.",
  "passport.supporting.addDocument": "Magdagdag ng Dokumento",
  "passport.supporting.add": "Magdagdag ng dokumento",
  "passport.toast.added": "Naidagdag ang {type}",

  "passport.upload.expiryPast":
    "Hindi puwedeng nasa nakaraan ang expiry date.",
  "passport.upload.legalNotice":
    "Sa pag-upload ng mga dokumento mo, kinukumpirma mo na totoo at valid ang lahat ng impormasyon. Ang anumang pekeng o falsified na dokumento ay maaaring magresulta sa suspensyon ng account at legal na aksyon alinsunod sa mga naaangkop na batas ng Pilipinas sa fraud at identity theft, kasama ang Cybercrime Prevention Act (Republic Act No. 10175).",
  "passport.upload.add": "Idagdag ang Dokumento",
  "passport.upload.adding": "Idinadagdag…",
  "passport.upload.saveError":
    "Hindi na-save ang dokumento mo. Subukan ulit.",
  "passport.upload.fileHint": "JPG, PNG, WebP, o PDF, hanggang 5 MB",
  "passport.upload.reviewHint":
    "Puwedeng i-verify: humiling ng review sa page ng dokumento pagkatapos mong idagdag ito.",
  "passport.upload.document": "Dokumento",
  "passport.upload.chooseAria": "Pumili ng file para sa {type} mo",
  "passport.upload.replaceAria": "Palitan ang {name}",
  "passport.upload.chooseFile": "Pumili ng file",
  "passport.upload.previewAlt": "Preview ng {type}",
  "passport.upload.remove": "Alisin",
  "passport.upload.expiryLabel": "Expiry date (optional)",
  "passport.upload.clearExpiry": "Alisin ang expiry date",
  "passport.upload.calendarAria": "Expiry date",
  "passport.upload.confirm":
    "Kinukumpirma ko na totoo ang impormasyong ibinigay at akin ang dokumento.",
  "passport.upload.certify":
    "Sa pag-upload, kinukumpirma mo na valid ang dokumentong ito at sa iyo ito. Ang mga pekeng dokumento ay maaaring humantong sa suspensyon ng account.",
  "passport.upload.legalNoticeTitle": "Legal na paalala",
  "passport.upload.cancel": "Kanselahin",
  "passport.upload.gotIt": "Naintindihan ko",

  "passport.add.documentTypes": "Mga uri ng dokumento",
  "passport.add.title": "Magdagdag ng dokumento",
  "passport.add.alreadyAdded":
    "Naidagdag mo na ang {type}. Buksan ito sa wallet mo para palitan ang file.",
  "passport.add.identity":
    "Ang mga identity document ay gumagamit ng live ID capture at selfie sa verification ng account. Kapag naaprubahan, awtomatikong naidadagdag ang ID mo sa APT Passport mo.",
  "passport.add.unavailable":
    "Hindi available ang uri ng dokumentong ito para sa Passport upload. Pumili na lang ng uri sa listahan.",
  "passport.add.goVerify": "Pumunta sa ID verification",
  "passport.add.chooseType": "Pumili ng uri ng dokumento",

  "passport.replace.title": "Palitan ang {type}",
  "passport.replace.submit": "Palitan ang Dokumento",
  "passport.replace.pending": "Pinapalitan…",
  "passport.replace.wasChecked":
    "Kapag pinalitan ang dokumentong ito, babalik ito sa hindi verified. Kailangan mong humiling ulit ng verification.",
  "passport.replace.notice": "Papalitan ng bagong file ang kasalukuyan.",

  "passport.detail.loadError": "Hindi ma-load ang dokumentong ito",
  "passport.detail.notFound": "Hindi mahanap ang dokumento",
  "passport.detail.deleted": "Maaaring na-delete na ang dokumentong ito.",
  "passport.detail.backToDocuments": "Bumalik sa mga Dokumento",
  "passport.detail.reviewRequested":
    "Nakiusap na ng verification. Aabisuhan ka namin kapag na-check na ito ng admin.",
  "passport.detail.reviewError":
    "Hindi makahiling ng review. Subukan ulit.",
  "passport.detail.replaced":
    "Napalitan ang {type}. Hindi pa ito verified.",
  "passport.detail.deletedToast": "Na-delete ang dokumento",
  "passport.detail.deleteError":
    "Hindi ma-delete ang dokumentong ito. Subukan ulit.",
  "passport.detail.previewAria": "Preview ng dokumento",
  "passport.detail.enlargeAria": "Palakihin ang {type} {side}",
  "passport.detail.openAria": "Buksan ang file ng {type}",
  "passport.detail.previewUnavailable": "Walang preview",
  "passport.detail.openFile": "Buksan ang file",
  "passport.detail.linkedId":
    "Naka-link ang ID na ito sa naaprubahang verification ng account mo at awtomatikong pinamamahalaan.",
  "passport.detail.uploaded": "Na-upload",
  "passport.detail.expiryDate": "Expiry date",
  "passport.detail.noExpiry": "Walang expiry",
  "passport.detail.expiredSuffix": "(Expired)",
  "passport.detail.notVerified": "Hindi verified",
  "passport.detail.notVerifiedBody":
    "Hindi na-verify ng admin ang dokumentong ito.",
  "passport.detail.expiredTitle": "Expired na dokumento",
  "passport.detail.expiredBody":
    "Mag-upload ng bagong kopya bago humiling ng verification.",
  "passport.detail.underReviewTitle": "Sinusuri ng admin",
  "passport.detail.underReviewBody":
    "Aabisuhan ka namin kapag na-check na ng admin ang dokumentong ito.",
  "passport.detail.replace": "Palitan ang Dokumento",
  "passport.detail.requestAgain": "Humiling Uli ng Review",
  "passport.detail.request": "Humiling ng Verification",
  "passport.detail.delete": "I-delete ang Dokumento",
  "passport.detail.deleteTitle": "I-delete ang dokumento?",
  "passport.detail.deleteBody":
    "Permanenteng tatanggalin ang dokumentong ito sa passport mo. Hindi puwedeng i-delete ang mga dokumentong naka-attach sa active application.",
  "passport.detail.keep": "Itago",
  "passport.detail.deleteConfirm": "I-delete",
  "passport.detail.deleting": "Dinidelete…",

  "passport.timeline.title": "Progreso ng verification",
  "passport.timeline.verified": "Na-verify ang pagkakakilanlan",
  "passport.timeline.rejected": "Tinanggihan ang verification",
  "passport.timeline.awaiting": "Naghihintay ng review",
  "passport.timeline.awaitingCaption":
    "Aabisuhan ka namin kapag tapos na ang verification.",
  "passport.timeline.submitted": "Naisumite ang mga dokumento",
  "passport.timeline.completed": "{date} · Tapos na",

  "passport.docType.proofOfIncome.description":
    "Ipakita ang kita mo bilang proof of income para sa mga rental application.",
  "passport.docType.proofOfResidency.description":
    "Kumpirmahin ang address mo kapag may application na nangangailangan ng proof of billing o residency.",
  "passport.docType.birthCertificate.description":
    "Panatilihin ang karagdagang rekord ng pagkakakilanlan sa APT Passport mo.",
  "passport.docType.nbiClearance.description":
    "Panatilihing updated ang clearance mo kapag may rental application na nangangailangan nito.",
  "passport.docType.nbiClearance.landlordDescription":
    "Ipakita ang updated na clearance para mapaniwalaan ng mga tenant na legitimate lessor ka.",
  "passport.docType.certificateOfEmployment.description":
    "Kumpirmahin ang trabaho mo bilang proof of income para sa mga rental application.",
  "passport.docType.payslip.description":
    "Ipakita ang mga kamakailang sahod bilang proof of income para sa mga rental application.",
  "passport.docType.incomeTaxReturn.description":
    "Ipakita ang idineklarang taunang kita bilang proof of income para sa mga rental application.",
  "passport.docType.taxDeclaration.description":
    "Ipakita na nakadeklara ang property para sa buwis sa pangalan mo o ng may-ari, para patunayang legitimate lessor ka.",
  "passport.docType.transferCertificateOfTitle.description":
    "Patunayan ang pagmamay-ari ng property na pinapaupahan mo gamit ang land title nito.",
  "passport.docType.realPropertyTaxReceipt.description":
    "Ipakita ang updated na bayad sa real property tax ng property na naka-list.",
  "passport.docType.businessPermit.description":
    "Ipakita ang Mayor's o business permit mo kung negosyo ang pagpapaupa mo.",
  "passport.docType.dtiSecRegistration.description":
    "Ipakita ang DTI o SEC registration mo kung rehistradong negosyo ang pagpapaupa mo.",
  "passport.docType.authorizationLetterSpa.description":
    "Ipakita ang authorization ng may-ari kung ikaw ang nagma-manage o nagpapaupa ng property para sa kanila.",
  "passport.docType.unknown.description":
    "Panatilihin ang dokumentong ito sa APT Passport mo para sa sarili mong rekord.",
};
