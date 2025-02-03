const fs = require('fs/promises');
const path = require('path');

const SEPARATOR = '='.repeat(45);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const OUTPUT_DIR = 'merged_output';

async function readIgnorePatterns() {
  try {
    const ignoreFile = await fs.readFile('.mergeignore', 'utf8');
    return ignoreFile
      .split('\n')
      .filter((line) => line.trim() && !line.startsWith('#'))
      .map((pattern) => pattern.trim());
  } catch {
    // 기본 무시 패턴
    return [
      '.idea/',
      '.vscode/',
      'node_modules/',
      '*.exe',
      '*.iml',
      '.git/',
      '.DS_Store',
    ];
  }
}

function shouldIgnore(filePath, ignorePatterns) {
  // 경로 구분자를 통일 (Windows의 경우 \를 /로 변환)
  filePath = filePath.replace(/\\/g, '/');

  return ignorePatterns.some((pattern) => {
    // 패턴에서 주석과 공백 제거
    pattern = pattern.trim();
    if (!pattern || pattern.startsWith('#')) return false;

    // 디렉토리 패턴 (끝에 / 있는 경우)
    if (pattern.endsWith('/')) {
      return filePath.startsWith(pattern) || filePath.includes('/' + pattern);
    }

    // 확장자 패턴 (*.xxx)
    if (pattern.startsWith('*.')) {
      const ext = pattern.slice(1); // *.exe -> .exe
      return filePath.endsWith(ext);
    }

    // 정확한 경로 매치
    return filePath === pattern || filePath.includes('/' + pattern);
  });
}

async function getProjectStructure(rootDir, ignorePatterns) {
  let structure = [];

  async function traverse(dir, prefix = '') {
    const items = await fs.readdir(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      const relativePath = path.relative(rootDir, fullPath);

      if (shouldIgnore(relativePath, ignorePatterns)) {
        continue;
      }

      if (item.isDirectory()) {
        structure.push(prefix + '├── ' + item.name + '/');
        await traverse(fullPath, prefix + '│   ');
      } else {
        structure.push(prefix + '├── ' + item.name);
      }
    }
  }

  structure.push(path.basename(rootDir) + '/');
  await traverse(rootDir);
  return structure.join('\n');
}

async function getAllFiles(dir, ignorePatterns) {
  let files = [];

  async function traverse(currentDir) {
    const items = await fs.readdir(currentDir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(currentDir, item.name);
      const relativePath = path.relative(dir, fullPath);

      if (shouldIgnore(relativePath, ignorePatterns)) {
        continue;
      }

      if (item.isDirectory()) {
        await traverse(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }

  await traverse(dir);
  return files;
}

async function formatSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

async function mergeFiles() {
  try {
    // 출력 디렉토리 생성
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    const ignorePatterns = await readIgnorePatterns();
    const projectStructure = await getProjectStructure('.', ignorePatterns);
    const files = await getAllFiles('.', ignorePatterns);

    let currentPart = 1;
    let currentSize = 0;
    let currentOutput = [];

    // 프로젝트 구조 추가
    currentOutput.push(SEPARATOR);
    currentOutput.push(`=== Part ${currentPart} ===`);
    currentOutput.push(SEPARATOR);
    currentOutput.push('PROJECT STRUCTURE:');
    currentOutput.push(projectStructure);
    currentOutput.push(SEPARATOR);

    for (const file of files) {
      const content = await fs.readFile(file, 'utf8');
      const stats = await fs.stat(file);
      const relativePath = path.relative('.', file);

      const fileHeader = [
        SEPARATOR,
        `PATH: ${relativePath}`,
        `SIZE: ${await formatSize(stats.size)}`,
        SEPARATOR,
      ].join('\n');

      const fileContent = fileHeader + '\n' + content + '\n\n';

      // 새 파트가 필요한지 확인
      if (currentSize + Buffer.byteLength(fileContent) > MAX_FILE_SIZE) {
        // 현재 파트 저장
        await fs.writeFile(
          path.join(OUTPUT_DIR, `part${currentPart}.txt`),
          currentOutput.join('\n'),
          'utf8'
        );

        // 새 파트 시작
        currentPart++;
        currentSize = 0;
        currentOutput = [
          SEPARATOR,
          `=== Part ${currentPart} ===`,
          SEPARATOR,
          'PROJECT STRUCTURE:',
          projectStructure,
          SEPARATOR,
        ];
      }

      currentOutput.push(fileContent);
      currentSize += Buffer.byteLength(fileContent);
    }

    // 마지막 파트 저장
    if (currentOutput.length > 0) {
      await fs.writeFile(
        path.join(OUTPUT_DIR, `part${currentPart}.txt`),
        currentOutput.join('\n'),
        'utf8'
      );
    }

    console.log(
      `✨ 완료! ${currentPart}개의 파트 파일이 ${OUTPUT_DIR} 디렉토리에 생성되었습니다.`
    );
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 스크립트 실행
mergeFiles();
