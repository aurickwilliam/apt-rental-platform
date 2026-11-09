/**
 * Rewrites named imports from the Tabler barrel into per-icon imports:
 *
 *   import { IconMap, IconRoute } from "@tabler/icons-react-native";
 *   -> import IconMap from "@tabler/icons-react-native/IconMap";
 *      import IconRoute from "@tabler/icons-react-native/IconRoute";
 *
 * Metro does not tree-shake, so the barrel would bundle all ~6,000 icons even
 * though the app uses a couple of hundred. The package's `./*` subpath exports
 * map each name to its own module. Type-only names (`Icon`, `IconProps`) have
 * no module and stay on the barrel; the TypeScript transform removes them.
 * Namespace and default imports are left alone.
 */
const TABLER_PACKAGE = "@tabler/icons-react-native";
const TYPE_ONLY_EXPORTS = new Set(["Icon", "IconProps"]);

module.exports = function tablerPerIcon({ types: t }) {
  return {
    name: "tabler-per-icon",
    visitor: {
      ImportDeclaration(path) {
        const { node } = path;
        if (node.source.value !== TABLER_PACKAGE) return;
        if (node.importKind === "type" || node.importKind === "typeof") return;

        const iconSpecifiers = [];
        const kept = [];
        for (const specifier of node.specifiers) {
          const isIcon =
            t.isImportSpecifier(specifier) &&
            specifier.importKind !== "type" &&
            specifier.importKind !== "typeof" &&
            t.isIdentifier(specifier.imported) &&
            !TYPE_ONLY_EXPORTS.has(specifier.imported.name);
          (isIcon ? iconSpecifiers : kept).push(specifier);
        }
        if (iconSpecifiers.length === 0) return;

        const replacements = iconSpecifiers.map((specifier) =>
          t.importDeclaration(
            [t.importDefaultSpecifier(t.identifier(specifier.local.name))],
            t.stringLiteral(`${TABLER_PACKAGE}/${specifier.imported.name}`),
          ),
        );
        if (kept.length > 0) {
          replacements.unshift(
            t.importDeclaration(kept, t.stringLiteral(TABLER_PACKAGE)),
          );
        }
        path.replaceWithMultiple(replacements);
      },
    },
  };
};
