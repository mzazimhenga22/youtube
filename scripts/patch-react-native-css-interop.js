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
