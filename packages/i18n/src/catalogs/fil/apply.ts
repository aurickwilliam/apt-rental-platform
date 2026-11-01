import type { apply as enApply } from "../en/apply";

export const apply: Record<keyof typeof enApply, string> = {
  "apply.back": "Bumalik",
  "apply.next": "Susunod",
  "apply.applyingTo": "Nag-a-apply sa",
  "apply.listingFallback": "Listing",
  "apply.apartmentFallback": "Apartment",
  "apply.nextStep": "Susunod: {title}",
  "apply.progress": "{current} ng {total}",

  "apply.step.tenant": "Impormasyon ng Tenant",
  "apply.step.preferences": "Rental Preferences",
  "apply.step.review": "I-review ang Application",
  "apply.step.submit": "I-submit ang Application",

  "apply.discard.title": "Itapon ang Application?",
  "apply.discard.body":
    "Mawawala ang mga naipasok mo kapag umalis ka ngayon. Sigurado ka bang gusto mong i-cancel?",
  "apply.discard.keepEditing": "Magpatuloy sa Pag-edit",
  "apply.discard.confirm": "Itapon",

  "apply.notFound.title": "Hindi mahanap ang apartment",
  "apply.notFound.body":
    "Wala ang listing na sinusubukan mong applyan.",

  "apply.start.monthlyRent": "Buwanang Upa",
  "apply.start.securityDeposit": "Security Deposit",
  "apply.start.advanceRent": "Advance na Upa",
  "apply.start.totalMoveIn": "Kabuuang Gastos sa Paglipat",
  "apply.start.maxOccupants":
    "Hanggang {count} occupant(s) lang ang unit na ito.",
  "apply.start.checkingPassport": "Sinusuri ang APT Passport mo",
  "apply.start.passportError":
    "Hindi ma-check ang APT Passport mo: {error}",
  "apply.start.tryAgain": "Subukan ulit",
  "apply.start.cancel": "Kanselahin",
  "apply.start.continue": "Ituloy ang Application",
  "apply.start.guidelines": "Tingnan ang guidelines sa pag-apply",

  "apply.guidelines.title": "Bago ka mag-apply",
  "apply.guidelines.subtitle":
    "Ilang bagay na dapat mong malaman sa pag-apply sa apartment na ito.",
  "apply.guidelines.passport.title":
    "Awtomatikong isinusumite ang APT Passport mo",
  "apply.guidelines.passport.body":
    "Kasamang ipinapadala ang ID at mga supporting document mo sa application, kaya wala nang ia-upload.",
  "apply.guidelines.verified.title": "Kailangan ng verified na account",
  "apply.guidelines.verified.body":
    "Mga tenant na may verified na account lang ang puwedeng mag-apply. I-verify muna ang account mo kung hindi pa.",
  "apply.guidelines.documents.title": "Mga kailangang dokumento",
  "apply.guidelines.documents.body":
    "Government ID at proof of billing o residency. Kailangan din ng proof of income ng mga employed at self-employed. Optional ang NBI clearance.",
  "apply.guidelines.current.title": "Panatilihing updated ang dokumento",
  "apply.guidelines.current.body":
    "Hindi ipinapadala ang mga expired o rejected na dokumento. Mag-upload ng bagong kopya sa APT Passport mo bago mag-apply.",
  "apply.guidelines.one.title": "Isang application bawat apartment",
  "apply.guidelines.one.body":
    "Isang pending application lang ang puwede sa bawat apartment, at hindi ka puwedeng mag-apply sa sarili mong listing. Pakisiguro na tama ang mga impormasyon.",
  "apply.guidelines.confirm": "Naintindihan ko",

  "apply.passport.title": "Awtomatikong isinusumite ang APT Passport mo",
  "apply.passport.bodyBefore":
    "Kasamang ipinapadala ang ID at mga supporting document mo sa application, kaya wala nang ia-upload. Panatilihin silang updated sa",
  "apply.passport.link": "APT Passport",
  "apply.passport.bodyAfter": ".",

  "apply.issue.unverified":
    "I-verify muna ang account mo. Isinusumite ang APT Passport mo sa bawat application.",
  "apply.issue.ownListing": "Hindi ka puwedeng mag-apply sa sarili mong property.",
  "apply.issue.alreadyApplied":
    "May active application ka na sa apartment na ito.",
  "apply.issue.passportMissing": "Idagdag sa APT Passport mo: {slots}.",
  "apply.issue.passportExpired":
    "Expired sa APT Passport mo: {slots}. Mag-upload ng bagong kopya.",

  "apply.action.verify": "I-verify ang account",
  "apply.action.addToPassport": "Idagdag sa APT Passport",
  "apply.action.openPassport": "Buksan ang APT Passport",
  "apply.action.viewApplications": "Tingnan ang applications ko",

  "apply.tenant.personalTitle": "Personal na Impormasyon",
  "apply.tenant.personalHintBefore":
    "Mula sa profile mo. Para baguhin ang mga ito, i-update ang",
  "apply.tenant.personalHintLink": "profile",
  "apply.tenant.personalHintAfter": "mo.",
  "apply.tenant.employmentTitle": "Trabaho at Kita",
  "apply.tenant.referencesTitle": "Mga Reference",
  "apply.tenant.referencesHint": "Mas mabilis ang review kapag mayroon",
  "apply.tenant.employmentType": "Uri ng Trabaho",
  "apply.tenant.employmentPlaceholder": "Pumili ng uri ng trabaho",
  "apply.tenant.occupation": "Trabaho / Job Title",
  "apply.tenant.occupationPlaceholder": "Ilagay ang trabaho mo",
  "apply.tenant.company": "Pangalan ng Kumpanya",
  "apply.tenant.companyPlaceholder": "Ilagay ang pangalan ng kumpanya",
  "apply.tenant.companyNotApplicable": "Hindi applicable",
  "apply.tenant.income": "Buwanang Kita",
  "apply.tenant.incomePlaceholder": "Ilagay ang buwanang kita",
  "apply.tenant.incomePlaceholderNoIncome": "Ilagay ang 0 kung walang kita",
  "apply.tenant.prevLandlordName": "Pangalan ng Dating Landlord",
  "apply.tenant.prevLandlordNamePlaceholder":
    "Ilagay ang pangalan ng dating landlord",
  "apply.tenant.prevLandlordContact": "Contact ng Dating Landlord",

  "apply.field.fullName": "Buong Pangalan",
  "apply.field.email": "Email",
  "apply.field.dateOfBirth": "Petsa ng Kapanganakan",
  "apply.field.contactNumber": "Contact Number",
  "apply.field.currentAddress": "Kasalukuyang Address",

  "apply.empty.fullName": "Walang nakatalang buong pangalan",
  "apply.empty.email": "Walang nakatalang email",
  "apply.empty.dateOfBirth": "Walang nakatalang petsa ng kapanganakan",
  "apply.empty.contactNumber": "Walang nakatalang contact number",
  "apply.empty.currentAddress": "Walang nakatalang kasalukuyang address",

  "apply.prefs.title": "Rental Preferences",
  "apply.prefs.moveInDate": "Gustong Petsa ng Paglipat",
  "apply.prefs.maxOccupants":
    "Hanggang {count} occupant(s) lang ang unit na ito.",
  "apply.prefs.occupants": "Bilang ng Occupant",
  "apply.prefs.occupantsPlaceholder": "Ilagay ang bilang ng occupant",
  "apply.prefs.hasPets": "May alaga ka bang hayop?",
  "apply.prefs.smoker": "Naninigarilyo ka ba?",
  "apply.prefs.parking": "Kailangan mo ba ng parking?",
  "apply.prefs.notes": "Karagdagang Tala",
  "apply.prefs.notesPlaceholder":
    "Ilagay ang iba pang impormasyon o preference",
  "apply.prefs.notesCount": "{count}/{max} character",

  "apply.review.applyingFor": "Nag-a-apply ka para sa",
  "apply.review.summaryTitle": "Buod ng Application",
  "apply.review.summaryBody":
    "I-review ang mga detalye mo. Siguraduhing tama lahat bago i-submit.",
  "apply.review.tenantSection": "Impormasyon ng Tenant",
  "apply.review.prefsSection": "Rental Preferences",
  "apply.review.documentsSection": "Mga Dokumento sa APT Passport",
  "apply.review.checkingPassport": "Sinusuri ang APT Passport mo…",
  "apply.review.notProvidedOptional": "Walang binigay (optional)",
  "apply.review.notProvidedNotRequired":
    "Walang binigay (hindi kailangan)",
  "apply.review.missing": "Kulang",
  "apply.review.frontAndBack": " (harap at likod)",
  "apply.review.persons": "{count} Person(s)",
  "apply.review.submitting": "Nagsu-submit…",
  "apply.review.submit": "I-submit ang Application",
  "apply.review.landlordNotified":
    "Aabisuhan agad ang landlord kapag nag-submit ka.",

  "apply.detail.unitType": "Uri ng Unit",
  "apply.detail.furnishing": "Furnishing",
  "apply.detail.floorLevel": "Palapag",
  "apply.detail.maxOccupants": "Max na Occupant",
  "apply.detail.leaseDuration": "Tagal ng Lease",
  "apply.detail.monthlyRent": "Buwanang Upa",
  "apply.detail.securityDeposit": "Security Deposit",
  "apply.detail.advanceRent": "Advance na Upa",
  "apply.detail.totalMoveIn": "Kabuuang Gastos sa Paglipat",
  "apply.detail.rentalOwner": "May-ari",
  "apply.detail.employmentType": "Uri ng Trabaho",
  "apply.detail.occupation": "Trabaho",
  "apply.detail.companyName": "Pangalan ng Kumpanya",
  "apply.detail.monthlyIncome": "Buwanang Kita",
  "apply.detail.prevLandlordName": "Pangalan ng Dating Landlord",
  "apply.detail.prevLandlordContact": "Contact ng Dating Landlord",
  "apply.detail.moveInDate": "Petsa ng Paglipat",
  "apply.detail.occupants": "Bilang ng Occupant",
  "apply.detail.hasPets": "May Alaga?",
  "apply.detail.smoker": "Naninigarilyo?",
  "apply.detail.parking": "Kailangan ng Parking?",
  "apply.detail.notes": "Karagdagang Tala",

  "apply.submitted.title": "Naipadala ang Application!",
  "apply.submitted.body":
    "Naipadala na ang application mo para sa {name} kasama ang mga dokumento sa APT Passport mo. I-review ito ng may-ari at babalikan ka agad.",
  "apply.submitted.fallbackName": "apartment na ito",
  "apply.submitted.viewStatus": "Tingnan ang Status ng Application",

  "apply.error.fullName":
    "Idagdag muna ang buong pangalan mo sa profile.",
  "apply.error.emailRequired": "Idagdag muna ang email mo sa profile.",
  "apply.error.emailInvalid": "Maglagay ng valid na email address.",
  "apply.error.birthDateRequired":
    "Idagdag muna ang petsa ng kapanganakan mo sa profile.",
  "apply.error.birthDateInvalid": "Maglagay ng valid na petsa.",
  "apply.error.birthDateFuture":
    "Hindi puwedeng nasa hinaharap ang petsa ng kapanganakan.",
  "apply.error.contactRequired":
    "Idagdag muna ang contact number mo sa profile.",
  "apply.error.contactInvalid": "Hindi valid ang contact number.",
  "apply.error.addressRequired":
    "Idagdag muna ang kasalukuyang address mo sa profile.",
  "apply.error.employmentTypeRequired": "Kailangan ang uri ng trabaho.",
  "apply.error.occupationRequired": "Kailangan ang trabaho.",
  "apply.error.companyRequired": "Kailangan ang pangalan ng kumpanya.",
  "apply.error.incomeRequired": "Kailangan ang buwanang kita.",
  "apply.error.incomeNegative":
    "Hindi puwedeng negatibo ang buwanang kita.",
  "apply.error.prevContactRequired": "Kailangan ang contact number.",
  "apply.error.prevNameRequired": "Kailangan ang pangalan ng landlord.",
  "apply.error.moveInRequired": "Pumili ng gustong petsa ng paglipat.",
  "apply.error.moveInPast":
    "Hindi puwedeng nasa nakaraan ang petsa ng paglipat.",
  "apply.error.moveInToday":
    "Hindi puwedeng ngayon ang petsa ng paglipat.",
  "apply.error.occupantsInvalid": "Maglagay ng valid na bilang ng occupant.",
  "apply.error.occupantsTooMany":
    "Maglagay ng {count} o mas kaunting occupant.",
  "apply.error.hasPetsRequired": "Sabihin kung may alaga kang hayop.",
  "apply.error.smokerRequired": "Sabihin kung naninigarilyo ka.",
  "apply.error.parkingRequired": "Sabihin kung kailangan mo ng parking.",
};
