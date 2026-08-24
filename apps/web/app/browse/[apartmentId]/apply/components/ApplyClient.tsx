"use client";

import { useState, useRef } from "react";
import {
  Card,
  Button,
  Separator,
  TextField,
  Input,
  Label,
  FieldError,
  TextArea,
  Select,
  ListBox,
  Modal,
  useOverlayState,
  Description,
  ToggleButtonGroup,
  ToggleButton,
} from "@heroui/react";
import {
  MapPin,
  House,
  BedDouble,
  Bath,
  Expand,
  Building2,
  Users,
  Calendar as CalendarIcon,
  Armchair,
  Star,
  Check,
  FileText,
  UploadCloud,
  ImageIcon,
  CircleCheckBig,
  ArrowLeft,
} from "lucide-react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import ApplicationHeader from "./ApplicationHeader";
import { formatPesoDisplay, handlePesoChange, isValidEmail } from "@repo/utils";
import {
  EMPLOYMENT_TYPES,
  REQUIRES_OCCUPATION_TYPES,
  REQUIRES_COMPANY_NAME_TYPES,
  requiresProofOfIncome,
  EmploymentType,
} from "@repo/constants";

function validatePHMobile(input: string): { isValid: boolean; errorMessage?: string } {
  const trimmed = input.trim();
  if (!trimmed) return { isValid: true };
  const digits = trimmed.replace(/[\s\-().]/g, "");
  let normalized = digits;
  if (/^\+639\d{9}$/.test(digits)) normalized = "0" + digits.slice(3);
  else if (/^639\d{9}$/.test(digits)) normalized = "0" + digits.slice(2);
  else if (/^9\d{9}$/.test(digits)) normalized = "0" + digits;
  if (!/^09\d{9}$/.test(normalized)) {
    return { isValid: false, errorMessage: "Invalid format. Use 09XXXXXXXXX." };
  }
  return { isValid: true };
}

type ApartmentContext = {
  id: string;
  name: string | null;
  address: string | null;
  type: string | null;
  cover: string;
  images: string[];
  landlordName: string | null;
  landlordAvatarUrl: string | null;
  monthlyRent: number | null;
  securityDeposit: number | null;
  advanceRent: number | null;
  maxOccupants: number | null;
  noBedrooms: number | null;
  noBathrooms: number | null;
  areaSqm: number | null;
  floorLevel: string | null;
  furnishedType: string | null;
  leaseDuration: string | null;
  averageRating: number | null;
};

const WIZARD_TITLES: Record<number, { currentTitle: string; nextTitle: string }> = {
  2: { currentTitle: "Tenant Information", nextTitle: "Rental Preferences" },
  3: { currentTitle: "Rental Preferences", nextTitle: "Upload Required Documents" },
  4: { currentTitle: "Upload Required Documents", nextTitle: "Review Application" },
  5: { currentTitle: "Review Application", nextTitle: "Submit Application" },
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-grey-700 font-medium">{label}</span>
      <span className="text-sm font-semibold text-black">{value || "—"}</span>
    </div>
  );
}

export default function ApplyClient({ apartment }: { apartment: ApartmentContext }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const discardModal = useOverlayState();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [currentAddress, setCurrentAddress] = useState("");
  const [employmentType, setEmploymentType] = useState<string>("");
  const [occupation, setOccupation] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [monthlyIncomeText, setMonthlyIncomeText] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState<number | null>(null);
  const [prevLandlordName, setPrevLandlordName] = useState("");
  const [prevLandlordContact, setPrevLandlordContact] = useState("");

  const isNoIncomeType = !requiresProofOfIncome(employmentType || "");
  const requiresOccupation = REQUIRES_OCCUPATION_TYPES.includes(employmentType as EmploymentType);
  const requiresCompany = REQUIRES_COMPANY_NAME_TYPES.includes(employmentType as EmploymentType);

  const [moveInDate, setMoveInDate] = useState("");
  const [noOccupants, setNoOccupants] = useState("");
  const [hasPets, setHasPets] = useState<string | null>(null);
  const [isSmoker, setIsSmoker] = useState<string | null>(null);
  const [needParking, setNeedParking] = useState<string | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [govIdFile, setGovIdFile] = useState<File | null>(null);
  const [govIdPreview, setGovIdPreview] = useState<string | null>(null);
  const [proofOfBillingFile, setProofOfBillingFile] = useState<File | null>(null);
  const [proofOfBillingPreview, setProofOfBillingPreview] = useState<string | null>(null);
  const [proofOfIncomeFile, setProofOfIncomeFile] = useState<File | null>(null);
  const [nbiClearanceFile, setNbiClearanceFile] = useState<File | null>(null);

  const govIdRef = useRef<HTMLInputElement>(null);
  const billingRef = useRef<HTMLInputElement>(null);
  const incomeRef = useRef<HTMLInputElement>(null);
  const nbiRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const clearError = (k: string) => setErrors((p) => ({ ...p, [k]: "" }));

  const validateTenant = () => {
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = "Full name is required.";
    if (!email.trim()) next.email = "Email is required.";
    else if (!isValidEmail(email.trim())) next.email = "Enter a valid email address.";
    if (!dateOfBirth) next.dateOfBirth = "Date of birth is required.";
    else {
      const d = new Date(dateOfBirth);
      if (Number.isNaN(d.getTime())) next.dateOfBirth = "Enter a valid date.";
      else if (d > new Date()) next.dateOfBirth = "Date of birth cannot be in the future.";
    }
    if (!contactNumber.trim()) next.contactNumber = "Contact number is required.";
    else {
      const v = validatePHMobile(contactNumber);
      if (!v.isValid) next.contactNumber = v.errorMessage ?? "Invalid contact number.";
    }
    if (!currentAddress.trim()) next.currentAddress = "Current address is required.";
    if (!employmentType.trim()) next.employmentType = "Employment type is required.";
    if (requiresOccupation && !occupation.trim()) next.occupation = "Occupation is required.";
    if (requiresCompany && !companyName.trim()) next.companyName = "Company name is required.";
    if (monthlyIncome === null || Number.isNaN(monthlyIncome as number)) next.monthlyIncome = "Monthly income is required.";
    else if ((monthlyIncome as number) < 0) next.monthlyIncome = "Monthly income cannot be negative.";
    else if (!isNoIncomeType && (monthlyIncome as number) === 0) next.monthlyIncome = "Monthly income is required.";
    const hasName = prevLandlordName.trim().length > 0;
    const hasContact = prevLandlordContact.trim().length > 0;
    if (prevLandlordContact.trim()) {
      const v = validatePHMobile(prevLandlordContact);
      if (!v.isValid) next.prevLandlordContact = v.errorMessage ?? "Invalid contact number.";
    }
    if (hasName && !hasContact) next.prevLandlordContact = "Contact number is required.";
    if (!hasName && hasContact) next.prevLandlordName = "Landlord name is required.";
    setErrors(next);
    return Object.values(next).every((v) => !v);
  };

  const validatePrefs = () => {
    const next: Record<string, string> = {};
    if (!moveInDate) next.moveInDate = "Please select your preferred move-in date.";
    else {
      const d = new Date(moveInDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const picked = new Date(d);
      picked.setHours(0, 0, 0, 0);
      if (picked < today) next.moveInDate = "Move-in date cannot be in the past.";
      else if (picked.getTime() === today.getTime()) next.moveInDate = "Move-in date cannot be today.";
    }
    const num = parseInt(noOccupants, 10);
    if (!noOccupants || Number.isNaN(num) || num <= 0) next.noOccupants = "Please enter a valid number of occupants.";
    else if (apartment.maxOccupants !== null && num > apartment.maxOccupants)
      next.noOccupants = `Please enter ${apartment.maxOccupants} or fewer occupants.`;
    if (!hasPets) next.hasPets = "Please indicate if you have pets.";
    if (!isSmoker) next.isSmoker = "Please indicate if you are a smoker.";
    if (!needParking) next.needParking = "Please indicate if you need parking.";
    setErrors(next);
    return Object.values(next).every((v) => !v);
  };

  const validateDocs = () => {
    const next: Record<string, string> = {};
    if (!govIdFile) next.govId = "Please upload a valid government-issued ID.";
    if (requiresProofOfIncome(employmentType || "") && !proofOfIncomeFile) next.proofOfIncome = "Please upload proof of income.";
    if (!proofOfBillingFile) next.proofOfBilling = "Please upload proof of billing.";
    setErrors(next);
    return Object.values(next).every((v) => !v);
  };

  const totalMoveIn = (apartment.monthlyRent ?? 0) + (apartment.securityDeposit ?? 0) + (apartment.advanceRent ?? 0);

  const onFilePick =
    (setter: (f: File | null) => void, previewSetter?: (s: string | null) => void, isImage?: boolean) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0] ?? null;
      setter(f);
      if (f && isImage && previewSetter) {
        const url = URL.createObjectURL(f);
        previewSetter(url);
      } else if (!f && previewSetter) {
        previewSetter(null);
      }
      e.target.value = "";
    };

  const wizardStep = Math.min(Math.max(step - 1, 1), 4);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-12">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="outline" size="sm" onPress={() => (step > 1 ? setStep((s) => s - 1) : router.back())}>
          <ArrowLeft size={16} />
          Back
        </Button>
        <div className="ml-auto text-xs text-grey-700 hidden md:block">
          Applying to <span className="font-semibold text-primary">{apartment.name ?? "Listing"}</span>
        </div>
      </div>

      {step >= 2 && step <= 5 && WIZARD_TITLES[step] && (
        <div className="mb-6">
          <ApplicationHeader
            currentTitle={WIZARD_TITLES[step].currentTitle}
            nextTitle={WIZARD_TITLES[step].nextTitle}
            step={wizardStep}
            totalSteps={4}
          />
        </div>
      )}

      {step === 1 && (
        <Card className="border shadow-none overflow-hidden bg-white">
          <div className="relative h-64 md:h-80">
            <NextImage src={apartment.cover} alt={apartment.name ?? "Apartment"} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h1 className="text-white text-2xl md:text-3xl font-bold">{apartment.name}</h1>
              <p className="text-white/90 text-sm flex items-center gap-1 mt-1">
                <MapPin size={14} /> {apartment.address}
              </p>
            </div>
          </div>
          <Card.Content className="p-5 md:p-6 flex flex-col gap-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <House size={18} className="text-grey-700" /> <span className="font-medium">{apartment.type ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <BedDouble size={18} className="text-grey-700" /> <span className="font-medium">{apartment.noBedrooms ?? "—"} Bedrooms</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Bath size={18} className="text-grey-700" /> <span className="font-medium">{apartment.noBathrooms ?? "—"} Bathrooms</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Expand size={18} className="text-grey-700" /> <span className="font-medium">{apartment.areaSqm ?? "—"} sqm</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building2 size={18} className="text-grey-700" /> <span className="font-medium">{apartment.floorLevel ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users size={18} className="text-grey-700" /> <span className="font-medium">{apartment.maxOccupants ?? "—"} Occupants</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon size={18} className="text-grey-700" /> <span className="font-medium">{apartment.leaseDuration ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Armchair size={18} className="text-grey-700" /> <span className="font-medium">{apartment.furnishedType ?? "—"}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm">
                <Star size={16} className="text-amber-500 fill-amber-500" />
                <span className="font-semibold">{apartment.averageRating?.toFixed(1) ?? "—"}</span>
                <span className="text-grey-700">rating</span>
              </div>
              {apartment.landlordName && (
                <div className="flex items-center gap-2 ml-auto text-sm">
                  {apartment.landlordAvatarUrl ? (
                    <img src={apartment.landlordAvatarUrl} alt="Owner" width={24} height={24} className="rounded-full object-cover w-6 h-6" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-grey-200" />
                  )}
                  <span className="font-medium">{apartment.landlordName}</span>
                  <span className="text-grey-700 text-xs">Rental Owner</span>
                </div>
              )}
            </div>
            <Separator />
            <div className="flex flex-col gap-3 bg-darker-white p-4 rounded-xl">
              <div className="flex justify-between text-sm">
                <span className="text-grey-700">Monthly Rent</span>
                <span className="font-semibold">{formatPesoDisplay(apartment.monthlyRent)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-grey-700">Security Deposit</span>
                <span className="font-medium">{formatPesoDisplay(apartment.securityDeposit)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-grey-700">Advance Rent</span>
                <span className="font-medium">{formatPesoDisplay(apartment.advanceRent)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="font-semibold">Total Move-in Cost</span>
                <span className="font-bold text-primary">{formatPesoDisplay(totalMoveIn)}</span>
              </div>
              {apartment.maxOccupants !== null && (
                <p className="text-xs text-grey-700">This unit allows a maximum of {apartment.maxOccupants} occupant(s).</p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onPress={() => discardModal.open()}>
                Cancel
              </Button>
              <Button className="flex-1" onPress={() => setStep(2)}>
                Continue Application
              </Button>
            </div>
          </Card.Content>
        </Card>
      )}

      {step === 2 && (
        <Card className="border shadow-none bg-white p-5 md:p-8">
          <h2 className="text-lg font-semibold text-black">Personal Information</h2>
          <p className="text-xs text-grey-700 mb-5">All fields are editable. Please ensure accuracy.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <TextField isRequired isInvalid={!!errors.fullName} value={fullName} onChange={(v: string) => { setFullName(v); if (v.trim()) clearError("fullName"); }}>
              <Label>Full Name</Label>
              <Input placeholder="Enter your full name" />
              <FieldError>{errors.fullName}</FieldError>
            </TextField>
            <TextField isRequired isInvalid={!!errors.email} value={email} onChange={(v: string) => { setEmail(v); if (v.trim()) clearError("email"); }}>
              <Label>Email</Label>
              <Input placeholder="Enter your email" inputMode="email" />
              <FieldError>{errors.email}</FieldError>
            </TextField>
            <TextField isRequired isInvalid={!!errors.dateOfBirth} value={dateOfBirth} onChange={(v: string) => { setDateOfBirth(v); if (v) clearError("dateOfBirth"); }}>
              <Label>Date of Birth</Label>
              <Input type="date" />
              <FieldError>{errors.dateOfBirth}</FieldError>
            </TextField>
            <TextField isRequired isInvalid={!!errors.contactNumber} value={contactNumber} onChange={(v: string) => { setContactNumber(v); clearError("contactNumber"); }}>
              <Label>Contact Number</Label>
              <Input placeholder="09XXXXXXXXX" inputMode="numeric" />
              <FieldError>{errors.contactNumber}</FieldError>
            </TextField>
            <div className="md:col-span-2">
              <TextField isRequired isInvalid={!!errors.currentAddress} value={currentAddress} onChange={(v: string) => { setCurrentAddress(v); if (v.trim()) clearError("currentAddress"); }}>
                <Label>Current Address</Label>
                <Input placeholder="Street, Barangay, City, Province" />
                <FieldError>{errors.currentAddress}</FieldError>
              </TextField>
            </div>
          </div>

          <Separator className="my-6" />
          <h3 className="text-base font-semibold text-black mb-4">Employment & Income Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Select
              isRequired
              placeholder="Select your employment type"
              value={employmentType || null}
              onChange={(k) => {
                const val = k ? String(k) : "";
                setEmploymentType(val);
                clearError("employmentType");
                if (val && !REQUIRES_OCCUPATION_TYPES.includes(val as EmploymentType)) clearError("occupation");
                if (val && !requiresProofOfIncome(val)) {
                  setCompanyName("");
                  clearError("companyName");
                  clearError("monthlyIncome");
                }
              }}
              isInvalid={!!errors.employmentType}
            >
              <Label>Employment Type</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {EMPLOYMENT_TYPES.map((t) => (
                    <ListBox.Item key={t} id={t} textValue={t}>{t}</ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
              <FieldError>{errors.employmentType}</FieldError>
            </Select>

            <TextField isRequired={requiresOccupation} isInvalid={!!errors.occupation} value={occupation} onChange={(v: string) => { setOccupation(v); if (v.trim()) clearError("occupation"); }}>
              <Label>Occupation / Job Title</Label>
              <Input placeholder="Enter your occupation" />
              <FieldError>{errors.occupation}</FieldError>
            </TextField>

            <TextField isRequired={requiresCompany} isInvalid={!!errors.companyName} isDisabled={isNoIncomeType} value={isNoIncomeType ? "" : companyName} onChange={(v: string) => { setCompanyName(v); if (v.trim()) clearError("companyName"); }}>
              <Label>Company Name</Label>
              <Input placeholder={isNoIncomeType ? "Not applicable" : "Enter your company name"} />
              <FieldError>{errors.companyName}</FieldError>
            </TextField>

            <TextField isRequired isInvalid={!!errors.monthlyIncome} value={monthlyIncomeText} onChange={(v: string) => {
              const { raw, formatted } = handlePesoChange(v);
              setMonthlyIncomeText(formatted);
              const parsed = raw === "" || raw === "." ? null : parseFloat(raw);
              setMonthlyIncome(parsed);
              if (parsed !== null) {
                const valid = parsed >= 0 && (isNoIncomeType || parsed > 0);
                if (valid) clearError("monthlyIncome");
              }
            }}>
              <Label>Monthly Income</Label>
              <Input placeholder={isNoIncomeType ? "Enter 0 if no income" : "Enter your monthly income"} inputMode="decimal" />
              <FieldError>{errors.monthlyIncome}</FieldError>
            </TextField>
          </div>

          <Separator className="my-6" />
          <h3 className="text-base font-semibold text-black">References</h3>
          <p className="text-xs text-grey-700 mb-4">Preferred for fast-track review</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <TextField isInvalid={!!errors.prevLandlordName} value={prevLandlordName} onChange={(v: string) => { setPrevLandlordName(v); if (v.trim()) clearError("prevLandlordName"); }}>
              <Label>Previous Landlord Name</Label>
              <Input placeholder="Enter previous landlord name" />
              <FieldError>{errors.prevLandlordName}</FieldError>
            </TextField>
            <TextField isInvalid={!!errors.prevLandlordContact} value={prevLandlordContact} onChange={(v: string) => { setPrevLandlordContact(v); clearError("prevLandlordContact"); }}>
              <Label>Previous Landlord Contact</Label>
              <Input placeholder="09XXXXXXXXX" />
              <FieldError>{errors.prevLandlordContact}</FieldError>
            </TextField>
          </div>

          <div className="flex gap-3 mt-8">
            <Button variant="outline" className="flex-1" onPress={() => setStep(1)}>Back</Button>
            <Button className="flex-1" onPress={() => { if (validateTenant()) { setErrors({}); setStep(3); } }}>Next</Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="border shadow-none bg-white p-5 md:p-8">
          <h2 className="text-lg font-semibold text-black mb-5">Rental Preferences</h2>
          <div className="flex flex-col gap-5">
            <TextField isRequired isInvalid={!!errors.moveInDate} value={moveInDate} onChange={(v: string) => { setMoveInDate(v); if (v) clearError("moveInDate"); }}>
              <Label>Preferred Move-In Date</Label>
              <Input type="date" />
              <FieldError>{errors.moveInDate}</FieldError>
              {apartment.maxOccupants !== null && !errors.moveInDate && (
                <Description>This unit allows a maximum of {apartment.maxOccupants} occupant(s).</Description>
              )}
            </TextField>

            <TextField isRequired isInvalid={!!errors.noOccupants} value={noOccupants} onChange={(v: string) => {
              const val = v.replace(/\D/g, "");
              setNoOccupants(val);
              const num = parseInt(val, 10);
              if (!Number.isNaN(num) && num > 0 && (apartment.maxOccupants === null || num <= apartment.maxOccupants)) clearError("noOccupants");
            }}>
              <Label>Number of Occupants</Label>
              <Input type="number" placeholder="Enter number of occupants" inputMode="numeric" />
              <FieldError>{errors.noOccupants}</FieldError>
            </TextField>

            <Separator />

            {(["hasPets", "isSmoker", "needParking"] as const).map((field) => {
              const labels: Record<string, { title: string; opts: [string, string] }> = {
                hasPets: { title: "Do you have pets?", opts: ["Yes", "No"] },
                isSmoker: { title: "Are you a smoker?", opts: ["Yes", "No"] },
                needParking: { title: "Do you need parking?", opts: ["Yes", "No"] },
              };
              const val = field === "hasPets" ? hasPets : field === "isSmoker" ? isSmoker : needParking;
              const setVal = field === "hasPets" ? setHasPets : field === "isSmoker" ? setIsSmoker : setNeedParking;
              return (
                <div key={field}>
                  <Label className="text-sm font-medium text-black mb-2 block">
                    {labels[field].title} <span className="text-red-600">*</span>
                  </Label>
                  <ToggleButtonGroup
                    selectionMode="single"
                    selectedKeys={val ? [val] : []}
                    onSelectionChange={(keys) => {
                      const first = Array.from(keys as Set<string>)[0] as string | undefined;
                      if (first) { setVal(first); clearError(field); }
                    }}
                    className="flex gap-2"
                  >
                    {labels[field].opts.map((opt) => {
                      const id = opt.toLowerCase();
                      return (
                        <ToggleButton
                          key={opt}
                          id={id}
                          className="rounded-full px-5 py-2 text-sm font-medium border data-[selected=true]:bg-primary data-[selected=true]:text-white data-[selected=true]:border-primary"
                        >
                          {opt}
                        </ToggleButton>
                      );
                    })}
                  </ToggleButtonGroup>
                  {errors[field] && <p className="text-xs text-red-600 mt-1">{errors[field]}</p>}
                </div>
              );
            })}

            <Separator />

            <TextField value={additionalNotes} onChange={(v: string) => setAdditionalNotes(v)}>
              <Label>Additional Notes</Label>
              <TextArea placeholder="Enter any additional information or preferences" rows={5} maxLength={1000} />
              <Description>{additionalNotes.length}/1000 characters</Description>
            </TextField>
          </div>
          <div className="flex gap-3 mt-8">
            <Button variant="outline" className="flex-1" onPress={() => setStep(2)}>Back</Button>
            <Button className="flex-1" onPress={() => { if (validatePrefs()) { setErrors({}); setStep(4); } }}>Next</Button>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card className="border shadow-none bg-white p-5 md:p-8">
          <h2 className="text-lg font-semibold text-black mb-1">Upload Required Documents</h2>
          <p className="text-xs text-grey-700 mb-6">Accepted: images for ID/billing; PDF/DOC/DOCX for income/NBI. UI-only preview.</p>
          <div className="flex flex-col gap-6">
            <div>
              <Label className="text-sm font-medium text-black mb-2 block">Valid Government-issued ID <span className="text-red-600">*</span></Label>
              <input ref={govIdRef} type="file" accept="image/*" className="hidden" onChange={onFilePick(setGovIdFile, setGovIdPreview, true)} />
              {govIdFile ? (
                <div className="flex items-center gap-3 border border-grey-300 rounded-xl p-3">
                  {govIdPreview && <img src={govIdPreview} alt="Gov ID preview" width={56} height={56} className="w-14 h-14 rounded-lg object-cover border" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{govIdFile.name}</p>
                    <p className="text-xs text-grey-700">{(govIdFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button size="sm" variant="outline" onPress={() => { setGovIdFile(null); setGovIdPreview(null); clearError("govId"); }}>Remove</Button>
                  <Button size="sm" variant="tertiary" onPress={() => govIdRef.current?.click()}>Replace</Button>
                </div>
              ) : (
                <button type="button" onClick={() => govIdRef.current?.click()} className={`w-full rounded-xl border-2 border-dashed py-8 flex flex-col items-center justify-center gap-2 text-sm transition-colors ${errors.govId ? "border-red-300 bg-red-50/30" : "border-grey-300 hover:border-primary hover:bg-light-blue/40"}`}>
                  <UploadCloud size={20} className={errors.govId ? "text-red-600" : "text-grey-700"} />
                  <span className={errors.govId ? "text-red-600" : "text-grey-700"}>Choose photo</span>
                </button>
              )}
              {errors.govId && <p className="text-xs text-red-600 mt-1">{errors.govId}</p>}
            </div>
            <Separator />
            <div>
              <Label className="text-sm font-medium text-black mb-2 block">
                Proof of Income {requiresProofOfIncome(employmentType || "") && <span className="text-red-600">*</span>}
                <span className="text-grey-700 font-normal ml-2 text-xs">(COE, payslip, or ITR — PDF/DOC/DOCX)</span>
              </Label>
              <input ref={incomeRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={onFilePick(setProofOfIncomeFile)} />
              {proofOfIncomeFile ? (
                <div className="flex items-center gap-3 border border-grey-300 rounded-xl p-3 bg-darker-white">
                  <FileText size={18} className="text-primary" />
                  <span className="text-sm font-medium flex-1 truncate">{proofOfIncomeFile.name}</span>
                  <Button size="sm" variant="outline" onPress={() => { setProofOfIncomeFile(null); clearError("proofOfIncome"); }}>Remove</Button>
                  <Button size="sm" variant="tertiary" onPress={() => incomeRef.current?.click()}>Replace</Button>
                </div>
              ) : (
                <button type="button" onClick={() => incomeRef.current?.click()} className={`w-full rounded-xl border-2 border-dashed py-8 flex flex-col items-center justify-center gap-2 text-sm ${errors.proofOfIncome ? "border-red-300 bg-red-50/30" : "border-grey-300 hover:border-primary"}`}>
                  <FileText size={20} className={errors.proofOfIncome ? "text-red-600" : "text-grey-700"} />
                  <span className={errors.proofOfIncome ? "text-red-600" : "text-grey-700"}>Upload proof of income</span>
                </button>
              )}
              {errors.proofOfIncome && <p className="text-xs text-red-600 mt-1">{errors.proofOfIncome}</p>}
            </div>
            <Separator />
            <div>
              <Label className="text-sm font-medium text-black mb-2 block">Proof of Billing <span className="text-red-600">*</span></Label>
              <input ref={billingRef} type="file" accept="image/*" className="hidden" onChange={onFilePick(setProofOfBillingFile, setProofOfBillingPreview, true)} />
              {proofOfBillingFile ? (
                <div className="flex items-center gap-3 border border-grey-300 rounded-xl p-3">
                  {proofOfBillingPreview && <img src={proofOfBillingPreview} alt="Billing preview" width={56} height={56} className="w-14 h-14 rounded-lg object-cover border" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{proofOfBillingFile.name}</p>
                    <p className="text-xs text-grey-700">{(proofOfBillingFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button size="sm" variant="outline" onPress={() => { setProofOfBillingFile(null); setProofOfBillingPreview(null); clearError("proofOfBilling"); }}>Remove</Button>
                  <Button size="sm" variant="tertiary" onPress={() => billingRef.current?.click()}>Replace</Button>
                </div>
              ) : (
                <button type="button" onClick={() => billingRef.current?.click()} className={`w-full rounded-xl border-2 border-dashed py-8 flex flex-col items-center justify-center gap-2 text-sm ${errors.proofOfBilling ? "border-red-300 bg-red-50/30" : "border-grey-300 hover:border-primary"}`}>
                  <UploadCloud size={20} className={errors.proofOfBilling ? "text-red-600" : "text-grey-700"} />
                  <span className={errors.proofOfBilling ? "text-red-600" : "text-grey-700"}>Choose photo</span>
                </button>
              )}
              {errors.proofOfBilling && <p className="text-xs text-red-600 mt-1">{errors.proofOfBilling}</p>}
            </div>
            <Separator />
            <div>
              <Label className="text-sm font-medium text-black mb-2 block">NBI Clearance <span className="text-grey-700 font-normal text-xs">(optional)</span></Label>
              <input ref={nbiRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={onFilePick(setNbiClearanceFile)} />
              {nbiClearanceFile ? (
                <div className="flex items-center gap-3 border border-grey-300 rounded-xl p-3 bg-darker-white">
                  <FileText size={18} className="text-primary" />
                  <span className="text-sm font-medium flex-1 truncate">{nbiClearanceFile.name}</span>
                  <Button size="sm" variant="outline" onPress={() => setNbiClearanceFile(null)}>Remove</Button>
                  <Button size="sm" variant="tertiary" onPress={() => nbiRef.current?.click()}>Replace</Button>
                </div>
              ) : (
                <button type="button" onClick={() => nbiRef.current?.click()} className="w-full rounded-xl border-2 border-dashed py-8 flex flex-col items-center justify-center gap-2 text-sm border-grey-300 hover:border-primary">
                  <UploadCloud size={20} className="text-grey-700" />
                  <span className="text-grey-700">Upload NBI clearance (optional)</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-8">
            <Button variant="outline" className="flex-1" onPress={() => setStep(3)}>Back</Button>
            <Button className="flex-1" onPress={() => { if (validateDocs()) { setErrors({}); setStep(5); } }}>Next</Button>
          </div>
        </Card>
      )}

      {step === 5 && (
        <div className="flex flex-col gap-6">
          <Card className="border shadow-none bg-white p-5 md:p-6">
            <p className="text-xs tracking-widest uppercase text-grey-700 mb-1">You are applying for</p>
            <h2 className="text-xl font-bold text-black">{apartment.name}</h2>
            <p className="text-sm text-grey-700 flex items-center gap-1"><MapPin size={14} /> {apartment.address}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              <DetailRow label="Unit Type" value={apartment.type ?? "—"} />
              <DetailRow label="Furnishing" value={apartment.furnishedType ?? "—"} />
              <DetailRow label="Floor Level" value={apartment.floorLevel ?? "—"} />
              <DetailRow label="Max Occupants" value={apartment.maxOccupants ? `${apartment.maxOccupants} Person(s)` : "—"} />
              <DetailRow label="Lease Duration" value={apartment.leaseDuration ?? "—"} />
              <DetailRow label="Monthly Rent" value={formatPesoDisplay(apartment.monthlyRent) || "—"} />
              <DetailRow label="Security Deposit" value={formatPesoDisplay(apartment.securityDeposit) || "—"} />
              <DetailRow label="Advance Rent" value={formatPesoDisplay(apartment.advanceRent) || "—"} />
              <DetailRow label="Total Move-In Cost" value={formatPesoDisplay(totalMoveIn) || "—"} />
              <DetailRow label="Rental Owner" value={apartment.landlordName ?? "—"} />
            </div>
          </Card>

          <Card className="border shadow-none bg-white p-5 md:p-6">
            <h3 className="text-base font-semibold text-black">Summary of Application</h3>
            <p className="text-xs text-grey-700 mb-4">Please review your details. Make sure everything is accurate before submitting.</p>
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border bg-darker-white p-4">
                <h4 className="text-sm font-semibold text-black mb-3">Tenant Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailRow label="Full Name" value={fullName} />
                  <DetailRow label="Email" value={email} />
                  <DetailRow label="Date of Birth" value={dateOfBirth ? new Date(dateOfBirth).toLocaleDateString() : "—"} />
                  <DetailRow label="Contact Number" value={contactNumber} />
                  <div className="md:col-span-2"><DetailRow label="Current Address" value={currentAddress} /></div>
                  <DetailRow label="Employment Type" value={employmentType || "—"} />
                  <DetailRow label="Occupation" value={occupation || "—"} />
                  <DetailRow label="Company Name" value={companyName || "—"} />
                  <DetailRow label="Monthly Income" value={monthlyIncomeText || "—"} />
                  <DetailRow label="Previous Landlord Name" value={prevLandlordName || "—"} />
                  <DetailRow label="Previous Landlord Contact" value={prevLandlordContact || "—"} />
                </div>
              </div>
              <div className="rounded-xl border bg-darker-white p-4">
                <h4 className="text-sm font-semibold text-black mb-3">Rental Preferences</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailRow label="Move-in Date" value={moveInDate ? new Date(moveInDate).toLocaleDateString() : "—"} />
                  <DetailRow label="Number of Occupants" value={noOccupants ? `${noOccupants} Person(s)` : "—"} />
                  <DetailRow label="Has Pets?" value={hasPets ? (hasPets === "yes" ? "Yes" : "No") : "—"} />
                  <DetailRow label="Smoker?" value={isSmoker ? (isSmoker === "yes" ? "Yes" : "No") : "—"} />
                  <DetailRow label="Need Parking?" value={needParking ? (needParking === "yes" ? "Yes" : "No") : "—"} />
                  <div className="md:col-span-2"><DetailRow label="Additional Notes" value={additionalNotes || "—"} /></div>
                </div>
              </div>
              <div className="rounded-xl border bg-darker-white p-4">
                <h4 className="text-sm font-semibold text-black mb-3">Uploaded Documents</h4>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 border rounded-xl p-3 bg-white">
                    {govIdPreview ? <img src={govIdPreview} alt="Gov ID" width={56} height={56} className="w-14 h-14 rounded-lg object-cover border" /> : <ImageIcon size={20} className="text-grey-700" />}
                    <div><p className="text-sm font-medium">Valid Government-issued ID</p><p className="text-xs text-grey-700">{govIdFile?.name ?? "Not uploaded"}</p></div>
                  </div>
                  <div className="flex items-center gap-3 border rounded-xl p-3 bg-white">
                    <FileText size={20} className="text-grey-700" />
                    <div><p className="text-sm font-medium">Proof of Income</p><p className="text-xs text-grey-700">{proofOfIncomeFile?.name ?? "Not uploaded"}</p></div>
                  </div>
                  <div className="flex items-center gap-3 border rounded-xl p-3 bg-white">
                    {proofOfBillingPreview ? <img src={proofOfBillingPreview} alt="Billing" width={56} height={56} className="w-14 h-14 rounded-lg object-cover border" /> : <ImageIcon size={20} className="text-grey-700" />}
                    <div><p className="text-sm font-medium">Proof of Billing</p><p className="text-xs text-grey-700">{proofOfBillingFile?.name ?? "Not uploaded"}</p></div>
                  </div>
                  <div className="flex items-center gap-3 border rounded-xl p-3 bg-white">
                    <FileText size={20} className="text-grey-700" />
                    <div><p className="text-sm font-medium">NBI Clearance</p><p className="text-xs text-grey-700">{nbiClearanceFile?.name ?? "Not uploaded"}</p></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onPress={() => setStep(4)}>Back</Button>
              <Button className="flex-1" onPress={() => setStep(6)}>Submit Application</Button>
            </div>
            <p className="text-[11px] text-grey-700 mt-3 text-center">UI-only demo — no data is sent to the server.</p>
          </Card>
        </div>
      )}

      {step === 6 && (
        <Card className="border shadow-none bg-white p-8 md:p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CircleCheckBig size={32} className="text-green-500" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-primary">Application Sent!</h2>
          <p className="text-sm text-black mt-3 max-w-xl mx-auto">
            Your application for <span className="font-semibold">{apartment.name}</span> has been submitted. The rental owner will review it and get back to you.
          </p>
          <p className="text-xs text-grey-700 mt-2">This is a UI-only preview — no data was stored.</p>
        </Card>
      )}

      <Modal isOpen={discardModal.isOpen} onOpenChange={discardModal.setOpen}>
        <Modal.Backdrop>
          <Modal.Container size="sm">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Discard Application?</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm text-grey-700">Your progress will be lost if you leave now. Are you sure you want to cancel?</p>
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onPress={() => discardModal.setOpen(false)}>Keep Editing</Button>
                <Button variant="tertiary" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100" onPress={() => { discardModal.setOpen(false); router.back(); }}>
                  Discard
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
