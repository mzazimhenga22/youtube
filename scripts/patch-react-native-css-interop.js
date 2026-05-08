const fs = require("fs");
const path = require("path");

const packageRoot = path.join(
  __dirname,
  "..",
  "node_modules",
  "react-native-css-interop",
);

const files = [
  {
    path: path.join(packageRoot, "dist", "metro", "index.js"),
    replacements: [
      [
        "let haste;\nlet virtualModulesPossible",
        "let haste;\nlet hasteRootDir = process.cwd();\nlet virtualModulesPossible",
      ],
      [
        "haste = graph._haste;\n                            ensureFileSystemPatched",
        "haste = graph._haste;\n                            hasteRootDir = graph._config?.projectRoot ?? process.cwd();\n                            ensureFileSystemPatched",
      ],
      [
        `haste.emit("change", {
                eventsQueue: [
                    {
                        filePath,
                        metadata: {
                            modifiedTime: Date.now(),
                            size: 1,
                            type: "virtual",
                        },
                        type: "change",
                    },
                ],
            });`,
        `const canonicalPath = path_1.default.relative(hasteRootDir, filePath);
            haste.emit("change", {
                changes: {
                    addedDirectories: new Set(),
                    removedDirectories: new Set(),
                    addedFiles: new Map(),
                    modifiedFiles: new Map([
                        [
                            canonicalPath,
                            {
                                isSymlink: false,
                                modifiedTime: Date.now(),
                            },
                        ],
                    ]),
                    removedFiles: new Map(),
                },
                logger: null,
                rootDir: hasteRootDir,
            });`,
      ],
    ],
  },
  {
    path: path.join(packageRoot, "src", "metro", "index.ts"),
    replacements: [
      [
        "let haste: any;\nlet virtualModulesPossible",
        "let haste: any;\nlet hasteRootDir = process.cwd();\nlet virtualModulesPossible",
      ],
      [
        "haste = graph._haste;\n                ensureFileSystemPatched",
        "haste = graph._haste;\n                hasteRootDir = graph._config?.projectRoot ?? process.cwd();\n                ensureFileSystemPatched",
      ],
      [
        `haste.emit("change", {
          eventsQueue: [
            {
              filePath,
              metadata: {
                modifiedTime: Date.now(),
                size: 1, // Can be anything
                type: "virtual", // Can be anything
              },
              type: "change",
            },
          ],
        });`,
        `const canonicalPath = path.relative(hasteRootDir, filePath);
        haste.emit("change", {
          changes: {
            addedDirectories: new Set(),
            removedDirectories: new Set(),
            addedFiles: new Map(),
            modifiedFiles: new Map([
              [
                canonicalPath,
                {
                  isSymlink: false,
                  modifiedTime: Date.now(),
                },
              ],
            ]),
            removedFiles: new Map(),
          },
          logger: null,
          rootDir: hasteRootDir,
        });`,
      ],
    ],
  },
  {
    path: path.join(packageRoot, "dist", "runtime", "third-party-libs", "react-native-safe-area-context.native.js"),
    replacements: [
      [
        "function maybeHijackSafeAreaProvider(type) {\n    const name = type.displayName || type.name;",
        "function maybeHijackSafeAreaProvider(type) {\n    if (!type) return type;\n    const name = type.displayName || type.name;",
      ],
    ],
  },
  {
    path: path.join(packageRoot, "dist", "runtime", "native", "render-component.js"),
    replacements: [
      [
        `        const newValue = Array.isArray(value) ? [] : {};
        for (const entry of Object.entries(value)) {
            newValue[entry[0]] = replace(entry[0], entry[1]);
        }
        seen.delete(value);
        return newValue;`,
        `        const newValue = Array.isArray(value) ? [] : {};
        let entries;
        try {
            entries = Object.entries(value);
        }
        catch (error) {
            seen.delete(value);
            return \`[Unserializable: \${error?.message ?? "unknown error"}]\`;
        }
        for (const entry of entries) {
            try {
                newValue[entry[0]] = replace(entry[0], entry[1]);
            }
            catch (error) {
                newValue[entry[0]] = \`[Unserializable: \${error?.message ?? "unknown error"}]\`;
            }
        }
        seen.delete(value);
        return newValue;`,
      ],
      [
        `        if (seen.has(value)) {
            return "[Circular]";
        }
        seen.add(value);`,
        `        if (seen.has(value)) {
            return "[Circular]";
        }
        if ("_isReanimatedSharedValue" in value ||
            ("get" in value && "set" in value && typeof value.get === "function")) {
            return "[SharedValue]";
        }
        seen.add(value);`,
      ],
      [
        `            if ("_isReanimatedSharedValue" in value && "value" in value) {
                return \`\${value.value} (animated value)\`;
            }
            if ("get" in value && typeof value.get === "function") {
                return value.get();
            }`,
        `            if ("_isReanimatedSharedValue" in value && "value" in value) {
                return "[SharedValue]";
            }
            if ("get" in value && typeof value.get === "function") {
                return "[Observable]";
            }`,
      ],
    ],
  },
  {
    path: path.join(packageRoot, "src", "runtime", "native", "render-component.tsx"),
    replacements: [
      [
        `      const newValue: any = Array.isArray(value) ? [] : {};

      for (const entry of Object.entries(value)) {
        newValue[entry[0]] = replace(entry[0], entry[1]);
      }

      seen.delete(value);

      return newValue;`,
        `      const newValue: any = Array.isArray(value) ? [] : {};

      let entries: [string, any][];
      try {
        entries = Object.entries(value);
      } catch (error: any) {
        seen.delete(value);
        return \`[Unserializable: \${error?.message ?? "unknown error"}]\`;
      }

      for (const entry of entries) {
        try {
          newValue[entry[0]] = replace(entry[0], entry[1]);
        } catch (error: any) {
          newValue[entry[0]] = \`[Unserializable: \${error?.message ?? "unknown error"}]\`;
        }
      }

      seen.delete(value);

      return newValue;`,
      ],
      [
        `      if (seen.has(value)) {
        return "[Circular]";
      }

      seen.add(value);`,
        `      if (seen.has(value)) {
        return "[Circular]";
      }

      if (
        "_isReanimatedSharedValue" in value ||
        ("get" in value && "set" in value && typeof value.get === "function")
      ) {
        return "[SharedValue]";
      }

      seen.add(value);`,
      ],
      [
        `      if ("_isReanimatedSharedValue" in value && "value" in value) {
        return \`\${value.value} (animated value)\`;
      }

      if ("get" in value && typeof value.get === "function") {
        return value.get();
      }`,
        `      if ("_isReanimatedSharedValue" in value && "value" in value) {
        return "[SharedValue]";
      }

      if ("get" in value && typeof value.get === "function") {
        return "[Observable]";
      }`,
      ],
    ],
  },
];

for (const target of files) {
  if (!fs.existsSync(target.path)) {
    continue;
  }

  let source = fs.readFileSync(target.path, "utf8");
  let changed = false;

  for (const [before, after] of target.replacements) {
    if (source.includes(after)) {
      continue;
    }

    if (!source.includes(before)) {
      throw new Error(`Patch target not found in ${target.path}`);
    }

    source = source.replace(before, after);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(target.path, source);
    console.log(`Patched ${path.relative(process.cwd(), target.path)}`);
  }
}
