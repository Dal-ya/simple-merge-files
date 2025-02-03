# Simple Merge Files

프로젝트의 모든 파일들을 크기 제한(10MB)에 맞춰 하나의 텍스트 파일로 병합하는 CLI 도구입니다.

## 설치 방법

```bash
# npm을 통한 글로벌 설치
npm install -g simple-merge-files
# 글로벌 설치 후 merge-files 명령어로 사용 가능


# 또는 npx를 통한 직접 실행(권장)
npx simple-merge-files
```

## 사용 방법

1. 병합하고자 하는 프로젝트 디렉토리로 이동
```bash
cd your-project-directory
```

2. 명령어 실행
```bash
npx simple-merge-files
```

## 기능

- 실행한 디렉토리를 기준으로 모든 하위 파일들을 탐색하여 병합
- 파일 크기를 10MB 단위로 나누어 저장
- 각 파트마다 전체 프로젝트 구조도 포함
- 무시할 파일/디렉토리 패턴 지정 가능

## 출력 형식

- 출력 위치: `merged_output` 디렉토리
- 파일명: `part1.txt`, `part2.txt`, ...
- 각 파트 파일 구조:
  ```
  =============================================
  === Part 1 ===
  =============================================
  PROJECT STRUCTURE:
  your-project/
  ├── src/
  │   ├── index.js
  │   └── utils.js
  ├── package.json
  └── README.md
  =============================================
  PATH: src/index.js
  SIZE: 1.25 KB
  =============================================
  // 파일 내용
  ```

## 파일 무시 패턴

기본적으로 다음 패턴의 파일/디렉토리는 병합에서 제외됩니다:
- `.idea/`
- `.vscode/`
- `node_modules/`
- `*.exe`
- `*.iml`
- `.git/`
- `.DS_Store`

커스텀 무시 패턴을 적용하려면 프로젝트 루트에 `.mergeignore` 파일을 생성하고 패턴을 작성하면 됩니다.

## 라이선스

MIT License
