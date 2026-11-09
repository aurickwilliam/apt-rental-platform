// Only network transport and Next's image adapter are replaced. Validation,
// compression, the photo hook and the modal components remain production code.
import { createElement } from "react";

export default function FixtureImage({ fill, unoptimized, ...props }) {
  void unoptimized;
  return createElement("img", { ...props, style: fill ? { position: "absolute", width: "100%", height: "100%" } : undefined });
}

export const createClient = () => ({
  storage: {
    from: (bucket) => ({
      async upload(path, blob) {
        window.fixturePhotoWrites.push({ kind: "upload", bucket, path, type: blob.type, size: blob.size });
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { error: window.fixturePhotoError ? { message: window.fixturePhotoError } : null };
      },
      getPublicUrl() { return { data: { publicUrl: `${location.origin}/saved.png` } }; },
      async remove(paths) {
        window.fixturePhotoWrites.push({ kind: "remove", bucket, paths });
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { error: window.fixturePhotoError ? { message: window.fixturePhotoError } : null };
      },
    }),
  },
  from: (table) => ({
    update: (values) => ({
      async eq(column, id) {
        window.fixturePhotoWrites.push({ kind: "update", table, values, column, id });
        return { error: null };
      },
    }),
  }),
});
