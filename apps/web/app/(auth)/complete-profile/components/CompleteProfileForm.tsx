"use client";

import {
  TextField,
  Input,
  Label,
  Select,
  ListBox,
  Button,
  Separator,
  Spinner,
  DatePicker,
  DateField,
  Calendar,
} from "@heroui/react";

import { useActionState, useState } from "react";
import { completeProfile } from "../../actions/complete-profile";
import { GENDERS, PROVINCES } from "@repo/constants";

type Props = {
  email: string;
  firstName: string;
  lastName: string;
  role: "tenant" | "landlord";
};

export default function CompleteProfileForm({
  email,
  firstName,
  lastName,
  role,
}: Props) {
  const [state, action, isPending] = useActionState(completeProfile, {});
  const [postalCode, setPostalCode] = useState(""); 

  return (
    <form action={action} className="flex flex-col gap-8">
      <input type="hidden" name="role" value={role} />

      {/* Personal Information */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium font-noto-serif">
          Personal Information
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField name="email" isReadOnly defaultValue={email} fullWidth>
            <Label>Email</Label>
            <Input />
          </TextField>

          <TextField name="first_name" isRequired defaultValue={firstName} fullWidth>
            <Label>First Name</Label>
            <Input placeholder="Enter your first name" />
          </TextField>

          <TextField name="last_name" isRequired defaultValue={lastName} fullWidth>
            <Label>Last Name</Label>
            <Input placeholder="Enter your last name" />
          </TextField>

          <TextField name="middle_name" fullWidth>
            <Label>Middle Name</Label>
            <Input placeholder="Enter your middle name (optional)" />
          </TextField>

          <Select name="gender" isRequired fullWidth placeholder="Select your gender">
            <Label>Gender</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {GENDERS.map((gender) => (
                  <ListBox.Item key={gender} id={gender} textValue={gender}>
                    {gender}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <TextField name="mobile_number" isRequired fullWidth>
            <Label>Mobile Number</Label>
            <Input type="tel" placeholder="Enter your mobile number" />
          </TextField>

          <DatePicker name="birth_date" isRequired>
            <Label>Birth Date</Label>
            <DateField.Group fullWidth className="border border-grey-300">
              <DateField.Input>
                {(segment) => (
                  <DateField.Segment
                    segment={segment}
                    className="data-[placeholder=true]:text-foreground/40 text-foreground"
                  />
                )}
              </DateField.Input>
              <DateField.Suffix>
                <DatePicker.Trigger>
                  <DatePicker.TriggerIndicator className="text-grey-500" />
                </DatePicker.Trigger>
              </DateField.Suffix>
            </DateField.Group>

            <DatePicker.Popover>
              <Calendar aria-label="Birth Date">
                <Calendar.Header>
                  <Calendar.YearPickerTrigger>
                    <Calendar.YearPickerTriggerHeading />
                    <Calendar.YearPickerTriggerIndicator className="text-grey-500" />
                  </Calendar.YearPickerTrigger>
                  
                  <Calendar.NavButton slot="previous" className="text-grey-500" />
                  <Calendar.NavButton slot="next" className="text-grey-500" />
                </Calendar.Header>
                <Calendar.Grid>
                  <Calendar.GridHeader>
                    {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                  </Calendar.GridHeader>
                  <Calendar.GridBody>
                    {(date) => (
                      <Calendar.Cell
                        date={date}
                        className="data-selected:bg-primary data-selected:text-white"
                      />
                    )}
                  </Calendar.GridBody>
                </Calendar.Grid>

                <Calendar.YearPickerGrid>
                  <Calendar.YearPickerGridBody>
                    {(yearProps) => (
                      <Calendar.YearPickerCell
                        year={yearProps.year}
                        className="data-selected:bg-primary data-selected:text-white"
                      />
                    )}
                  </Calendar.YearPickerGridBody>
                </Calendar.YearPickerGrid>
              </Calendar>
            </DatePicker.Popover>
          </DatePicker>
        </div>
      </section>

      <Separator />

      {/* Address Information */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium font-noto-serif">
          Address Information
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField name="street_address" isRequired fullWidth>
            <Label>Street Address</Label>
            <Input placeholder="Enter your street address" />
          </TextField>

          <TextField name="barangay" isRequired fullWidth>
            <Label>Barangay</Label>
            <Input placeholder="Enter your barangay" />
          </TextField>

          <TextField name="city" isRequired fullWidth>
            <Label>City</Label>
            <Input placeholder="Enter your city" />
          </TextField>

          <Select name="province" isRequired fullWidth placeholder="Select your province">
            <Label>Province</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {PROVINCES.map((province) => (
                  <ListBox.Item key={province} id={province} textValue={province}>
                    {province}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <TextField
            name="postal_code"
            isRequired
            fullWidth
            value={postalCode}
            onChange={(val) => setPostalCode(val.replace(/\D/g, ""))}
          >
            <Label>Postal Code</Label>
            <Input
              placeholder="Enter your postal code"
              inputMode="numeric"
              maxLength={4}
            />
          </TextField>
        </div>
      </section>

      {state?.error && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 p-3">
          <p className="text-center text-sm text-danger">{state.error}</p>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full font-semibold"
        isDisabled={isPending}
      >
        {isPending ? (
          <>
            <Spinner size="sm" />
            Completing Profile...
          </>
        ) : (
          "Complete Profile"
        )}
      </Button>
    </form>
  );
}