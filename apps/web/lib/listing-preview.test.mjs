import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

test("listing preview keeps flat sections, layout and preview interactions", () => {
  const source = readFileSync(new URL("../app/landlord/properties/create/components/Step5Preview.tsx", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const Card = Object.assign(() => {}, { Header: "Header", Content: "Content", Footer: "Footer" });
  const jsx = (type, props) => ({ type, props });
  const modules = {
    react: { useMemo: fn => fn() },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "next/dynamic": { default: () => "MapPreview" },
    "@heroui/react": { Card, Separator: "Separator", Button: "Button" },
    "@repo/utils": { formatPesoDisplay: value => `₱ ${value.toLocaleString("en-PH")}` },
    "@tabler/icons-react": new Proxy({}, { get: (_, key) => key }),
    "../../../../browse/[apartmentId]/components/ImageHeader": { default: "ImageHeader" },
    "../../../../browse/[apartmentId]/components/ExpandableDescription": { default: "Description" },
    "../../../../browse/[apartmentId]/components/Amenities": { default: "Amenities" },
    "../../../../browse/[apartmentId]/components/LandlordCard": { default: "LandlordCard" },
    "../../../../browse/[apartmentId]/components/PriceCard": { default: "PriceCard" },
    "../../../../browse/[apartmentId]/components/LeaseAgreementCard": { default: "LeaseAgreementCard" },
    "../../../../browse/[apartmentId]/components/RatingBreakdown": { default: "RatingBreakdown" },
  };
  const context = { exports: {}, require: name => modules[name], URL: { createObjectURL: () => "blob:test-photo" } };
  vm.runInNewContext(compiled, context);
  const formData = {
    name: "My listing", thumbnail: {}, additionalPhotos: [], description: "A lovely home", amenities: ["kitchen"],
    monthly_rent: 5000, security_deposit_months: 2, advance_rent_months: 1,
    street_address: "123 Street", barangay: "Baritan", city: "Malabon", province: "Metro Manila", zip_code: "1470",
    latitude: 14.6, longitude: 120.9, no_bedrooms: 1, no_bathrooms: 1, max_occupants: 2,
    area_sqm: 25, type: "Studio", furnished_type: "Furnished", floor_level: "1", lease_duration: "12 months",
    lease_agreement: { name: "lease.pdf" },
  };
  const nodes = element => {
    if (!element || typeof element !== "object") return [];
    return [element, ...[element.props?.children].flat(Infinity).flatMap(nodes)];
  };
  const landlord = { first_name: "Test", last_name: "Owner", avatar_url: "avatar-path" };
  const all = nodes(context.exports.default({ formData, landlord }));
  const cards = all.filter(node => node.type === Card);
  assert.deepEqual(cards.map(node => node.props["aria-label"]), [
    "Property details", "Apartment description", "Apartment amenities", "Apartment location", "Ratings and reviews",
  ]);
  assert.ok(cards.every(node => node.props.className.includes("create-listing-preview-card")));
  assert.ok(all.some(node => node.type === "section" && node.props["aria-label"] === "Listing photos"), "photos are outside the section cards");
  const details = nodes(cards.find(node => node.props["aria-label"] === "Property details"));
  assert.ok(details.some(node => node.type === "h1" && node.props.children === "My listing"));
  assert.ok(details.some(node => node.type === "p" && node.props.children === "123 Street, Baritan, Malabon, Metro Manila, 1470"));
  assert.ok(all.some(node => node.props?.className?.includes("lg:grid-cols-4")), "property details use four columns on desktop");
  assert.equal(all.find(node => node.type === "Description").props.text, formData.description);
  assert.equal(all.find(node => node.type === "Description").props.headingIcon.type, "IconBuilding");
  assert.equal(all.find(node => node.type === "Amenities").props.headingIcon.type, "IconSquareCheck");
  assert.deepEqual(all.find(node => node.type === "Amenities").props.apartmentPerks, ["kitchen"]);
  const map = all.find(node => node.type === "MapPreview");
  assert.equal(map.props.readOnly, true);
  assert.equal(map.props.latitude, formData.latitude);
  assert.equal(map.props.showHeader, false);
  assert.equal(all.find(node => node.type === "ImageHeader").props.imageUrl.length, 1);
  assert.equal(all.find(node => node.type === "ImageHeader").props.layout, "sidebar-aligned", "photo columns align with the preview card grid");
  const price = all.find(node => node.type === "PriceCard");
  assert.equal(price.props.isPreview, true);
  assert.equal(price.props.price + price.props.securityDeposit + price.props.advancePayment, 20000);
  const lease = all.find(node => node.type === "LeaseAgreementCard");
  assert.equal(lease.props.localFile, formData.lease_agreement);
  assert.equal(lease.props.leaseDetailsUrl, "");
  assert.equal(all.find(node => node.type === "RatingBreakdown").props.totalReviews, 0);
  assert.ok(all.some(node => node.type === "aside"), "pricing remains separate from the main sections");
  const sidebar = all.find(node => node.type === "aside");
  const landlordCard = nodes(sidebar).find(node => node.type === "LandlordCard");
  assert.equal(landlordCard.props.name, "Test Owner");
  assert.equal(landlordCard.props.avatarUrl, "avatar-path");
  assert.equal(landlordCard.props.showMessageButton, false);
  assert.ok(landlordCard.props.className.includes("create-listing-preview-boxed"));
  assert.ok(all.some(node => node.props?.children === "No ratings or reviews yet"));
  assert.ok(all.indexOf(map) < all.indexOf(cards.find(node => node.props["aria-label"] === "Ratings and reviews")), "reviews appear below the map");
});
