// Local macOS development build only. Never installs, publishes, or changes Safari settings.
import { spawnSync } from 'node:child_process';
import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const usage = `Safari 本地试用构建（需要 macOS、Node.js 22+、完整 Xcode）
  node build-safari.mjs [--extension <safari目录>] [--output <新输出目录>] [--project-only] [--release]

默认生成 Xcode 项目并构建仅供本机测试的 ad-hoc 签名 Mac 应用，不安装、不修改 Safari 设置。
--project-only  只生成项目，随后可在 Xcode 中打开并构建。
--release       构建 Intel / Apple 芯片通用 Release 应用，供预构建下载包使用。
输出目录必须不存在；不会覆盖旧构建或清除浏览器授权。
`;

// Xcode 27.2's packager can leave the template's parent ID despite --bundle-identifier.
// Support both Xcode project formats, and keep the extension ID used by the Swift launcher.
export function normalizeSafariBundleIdentifiers(source, bundleIdentifier) {
  let apps = 0, extensions = 0;
  const identifier = value => {
    if (value === bundleIdentifier + '.Extension') { extensions++; return value; }
    apps++;
    return bundleIdentifier;
  };
  const normalized = source
    .replace(/("PRODUCT_BUNDLE_IDENTIFIER"\s*:\s*")([^"]+)(")/g, (_, prefix, value, suffix) => prefix + identifier(value) + suffix)
    .replace(/(PRODUCT_BUNDLE_IDENTIFIER\s*=\s*)("?)([A-Za-z0-9_.-]+)\2(;)/g, (_, prefix, quote, value, suffix) => prefix + quote + identifier(value) + quote + suffix);
  if (!apps || !extensions) throw Error('无法识别 Safari 工程的应用与扩展标识；停止构建，请检查生成的项目。');
  return normalized;
}

async function main() {
  const options = { extension: resolve(dirname(fileURLToPath(import.meta.url)), 'safari'), output: resolve('safari-local-build') };
  for (let i = 2; i < process.argv.length; i++) {
    const argument = process.argv[i];
    if (argument === '--help') { console.log(usage); return; }
    if (argument === '--project-only') { options.projectOnly = true; continue; }
    if (argument === '--release') { options.release = true; continue; }
    if (!['--extension', '--output'].includes(argument) || !process.argv[i + 1] || process.argv[i + 1].startsWith('--')) throw Error(usage);
    options[argument.slice(2)] = resolve(process.argv[++i]);
  }
  if (process.platform !== 'darwin') throw Error('Safari 本地构建只支持 macOS。Chromium / Firefox 扩展不受影响。');
  const manifest = JSON.parse(await readFile(join(options.extension, 'manifest.json'), 'utf8'));
  if (!manifest.browser_specific_settings?.safari) throw Error('请选择构建产物中的 safari 扩展目录。');
  try {
    await access(options.output);
    throw Error('输出目录已存在，请通过 --output 指定新目录；旧项目和构建不会被覆盖。');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }

  // Apple renamed converter to packager. Find the tool in the selected Xcode, without changing it.
  let packager;
  for (const tool of ['safari-web-extension-packager', 'safari-web-extension-converter']) {
    const result = spawnSync('/usr/bin/xcrun', ['--find', tool], { encoding: 'utf8' });
    if (result.status === 0 && result.stdout.trim()) { packager = result.stdout.trim(); break; }
  }
  if (!packager) throw Error('未找到 Safari 扩展打包工具。需要完整 Xcode；Command Line Tools 不包含它。若已安装 Xcode，可通过 DEVELOPER_DIR 指向其 Contents/Developer 后重试。未生成或安装 Safari 应用。');

  const run = (command, args) => {
    const result = spawnSync(command, args, { stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) throw Error(`Safari 构建步骤失败（退出状态 ${result.status ?? result.signal}）；保留输出供排查，未安装应用。`);
  };
  const appName = 'Account Dashboard Safari';
  const bundleIdentifier = 'com.beianbai.accountdashboard';
  run(packager, [options.extension, '--project-location', options.output, '--app-name', appName,
    '--bundle-identifier', bundleIdentifier, '--macos-only', '--swift', '--copy-resources', '--no-open', '--no-prompt']);
  const projects = [];
  async function findProjects(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const path = join(directory, entry.name);
      if (entry.name.endsWith('.xcodeproj')) projects.push(path);
      else await findProjects(path);
    }
  }
  await findProjects(options.output);
  if (projects.length !== 1) throw Error('无法唯一识别生成的 Xcode 项目，请查看输出目录。未安装应用。');
  const projectFiles = (await readdir(projects[0])).filter(name => ['project.pbxproj', 'project.xcproj'].includes(name));
  if (projectFiles.length !== 1) throw Error('无法唯一识别 Safari 工程设置文件，停止构建。');
  const projectFile = join(projects[0], projectFiles[0]);
  await writeFile(projectFile, normalizeSafariBundleIdentifiers(await readFile(projectFile, 'utf8'), bundleIdentifier));
  console.log('Xcode 项目：', projects[0]);
  if (options.projectOnly) return;
  const derived = join(options.output, 'DerivedData');
  const configuration=options.release?'Release':'Debug';
  run('/usr/bin/xcrun', ['xcodebuild', '-project', projects[0], '-scheme', appName, '-configuration', configuration,
    '-derivedDataPath', derived, '-sdk', 'macosx', 'CODE_SIGN_STYLE=Manual', 'CODE_SIGN_IDENTITY=-',
    'DEVELOPMENT_TEAM=', 'CODE_SIGNING_ALLOWED=YES', 'MACOSX_DEPLOYMENT_TARGET=12.0',
    `MARKETING_VERSION=${manifest.version}`, 'CURRENT_PROJECT_VERSION=1',
    ...(options.release?['ARCHS=arm64 x86_64','ONLY_ACTIVE_ARCH=NO','GCC_GENERATE_DEBUGGING_SYMBOLS=NO','SWIFT_SERIALIZE_DEBUGGING_OPTIONS=NO','COPY_PHASE_STRIP=YES']:[]),'build']);
  const app = join(derived, 'Build', 'Products', configuration, appName + '.app');
  await access(app);
  run('/usr/bin/codesign', ['--verify', '--deep', '--strict', '--verbose=2', app]);
  console.log('已构建本地试用应用（ad-hoc 签名，无开发者证书、未公证）：', app);
  console.log('尚未安装或启用。请按 README 在 Safari 中允许本地测试、启用扩展并授予所需网站权限。');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
