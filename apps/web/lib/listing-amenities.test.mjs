import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const compile = path => ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const constants = { exports: {} };
vm.runInNewContext(compile("../../../packages/constants/src/apartment/amenity-rules.ts"), constants);
const component = compile("../app/landlord/properties/create/components/Step4Description.tsx");
const nodes = element => {
  if (!element || typeof element !== "object") return [];
  return [element, ...[element.props?.children].flat(Infinity).flatMap(nodes)];
};

test("amenities search, selected tags, removal, conflicts and rules dialog", () => {
  const state = [];
  let cursor = 0;
  let formData = { amenities: ["kitchen", "furniture"], description: "A home" };
  const compound = (name, parts) => Object.assign(() => {}, Object.fromEntries(parts.map(part => [part, `${name}.${part}`])));
  const SearchField = compound("SearchField", ["Group", "Input", "SearchIcon", "ClearButton"]);
  const TagGroup = compound("TagGroup", ["List"]);
  const Modal = compound("Modal", ["Backdrop", "Container", "Dialog", "Header", "Heading", "Body", "Footer"]);
  const perks = Object.fromEntries(["kitchen", "no_cooking", "smoking", "nonsmoking", "furniture"].map(id => [id, { id, name: id, icon: "Icon" }]));
  const jsx = (type, props) => ({ type, props });
  const modules = {
    react: {
      useState(initial) {
        const slot = cursor++;
        if (!(slot in state)) state[slot] = initial;
        return [state[slot], value => { state[slot] = value; }];
      },
      useMemo: fn => fn(),
    },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@heroui/react": { SearchField, TagGroup, Modal, Tag: "Tag", Button: "Button", Label: "Label", TextField: "TextField", TextArea: "TextArea", Description: "Description", FieldError: "FieldError" },
    "@tabler/icons-react": { IconInfoCircle: "InfoIcon", IconSearch: "SearchIcon" },
    "@repo/constants": { ...constants.exports, MAX_DESCRIPTION_LENGTH: 2000 },
    "../../../../components/inputs/perks": { PERKS: perks },
  };
  const context = { exports: {}, require: name => modules[name] };
  vm.runInNewContext(component, context);
  const render = () => {
    cursor = 0;
    return context.exports.default({ formData, errors: {}, updateForm: updates => { formData = { ...formData, ...updates }; } });
  };
  const all = () => nodes(render());
  const available = () => all().filter(node => node.type === "Button" && node.props.className?.includes("button--bare"));
  const tags = () => all().filter(node => node.type === "Tag").map(node => node.props.id);
  assert.deepEqual(tags(), ["kitchen", "furniture"], "retired selections remain visible/removable");
  for (const tag of all().filter(node => node.type === "Tag")) {
    const icon = nodes(tag).find(node => node.type === "Icon");
    assert.equal(icon.props.className, "text-primary");
    assert.equal(icon.props.size, 16);
  }
  assert.ok(available().every(node => node.props.className.includes("bg-card")), "available amenities use card surfaces");
  assert.equal(available().length, 3, "selected and retired options are not repeated");
  all().find(node => node.type === SearchField).props.onChange("no_cooking");
  assert.equal(available().length, 1);
  assert.deepEqual(tags(), ["kitchen", "furniture"], "search never hides selected tags");
  assert.ok(all().some(node => node.type === "SearchField.ClearButton" && node.props["aria-label"]));
  available()[0].props.onClick();
  assert.deepEqual(Array.from(formData.amenities), ["furniture", "no_cooking"], "picking a conflict updates the selections");
  all().find(node => node.type === TagGroup).props.onRemove(new Set(["furniture"]));
  assert.deepEqual(Array.from(formData.amenities), ["no_cooking"]);
  all().find(node => node.type === SearchField).props.onChange("");
  assert.equal(available().length, 3, "clearing search restores available options");
  all().find(node => node.type === "Button" && node.props["aria-label"] === "Perks that can't go together").props.onPress();
  assert.equal(all().find(node => node.type === "Modal.Backdrop").props.isOpen, true);
  const dialog = all().find(node => node.type === "Modal.Dialog");
  const close = () => all().find(node => node.type === "Modal.Backdrop").props.onOpenChange(false);
  const contents = nodes(dialog.props.children({ close }));
  assert.ok(contents.some(node => node.props?.children === "Picking one of these removes the others."));
  contents.find(node => node.type === "Button" && node.props.children === "Got it").props.onPress();
  assert.equal(all().find(node => node.type === "Modal.Backdrop").props.isOpen, false);
});
