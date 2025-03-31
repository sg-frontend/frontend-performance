# 2️⃣ 올림픽 통계 서비스 최적화

## **2-1) 서비스 실행**

```bash
npm install
npm run start
```

> Node.js의 버전 문제로 `export NODE_OPTIONS=--openssl-legacy-provider`임시 환경 변수를 설정하여 실행하였습니다.

```bash
npm run server
```

### 최적화 포인트

1. 하단 올림픽 이미지 깨짐 현상
2. 설문 결과 애니메이션 끊김 현상

## **2-2) 애니메이션 최적화**

### 애니메이션 원리

일반적으로 사용하는 디스플레이는 주사율이 60Hz이기 때문에,
**브라우저도 최대 초당 60프레임(FPS)**으로 화면을 렌더링함.

**쟁크 현상?** <br/>
-> 브라우저가 정상적으로 60FPS을 그리지 못 할 때의 끊김 현상.

### 브라우저 렌더링 과정

![렌더링 과정](./image/1.png)

#### 1. HTML 파싱 -> DOM 트리

- 파싱 : 렌더링 엔진이 HTML 문서를 토큰 token 으로 나누고 이를 바탕으로 문법적 의미와 구조 를 분석하여 파스 트리 생성
- DOM : 문서 객체 모델, HTML과 자바스크립트를 서로 이어줌
  - JS를 사용하여 DOM 요소 조작 할 수 있음

#### 2. CSS 파싱 -> CSSOM

- HTML 문서에 연결된 CSS 파일을 파싱해서 CSS 파일을 읽어 반영한 CSSOM 트리 생성
- 각 요소가 어떤 스타일을 포함하는지에 대한 정보

#### 3. DOM + CSSOM = Render Tree (렌더 트리)

- 렌더링에 필요한 노드만 object들만 모인 렌더트리 생성

#### 4. Layout / Reflow (페이지 레이아웃 계산)

- 렌더트리의 각 노드가 가지는 정확한 위치와 크기를 계산하고 배치하는 작업
- **리플로우 발생 원인 및 특징**
  - width, height, margin, padding, position 등이 변경
  - DOM 추가/삭제
  - 창 크기 변경
  - 주요 렌더링 경로를 모두 재실행함 (브라우저 리소스 매우 많이 사용)

#### 5. Paint

- 스타일과 위치 정보를 기반으로 요소들을 픽셀로 변환해서 그림
- **리페인트 발생 원인 및 특징**
  - color, background 등 색상 요소의 변경
  - 레이아웃을 제외한 주요 렌더링 경로 재실행 (리소스 많이 사용)

> **리플로우, 리페인트 개선 방법** <br />
> transform, opacity 등의 속성을 사용하여 해당 요소를 별도의 레이어로 분리하고 작업을 GPU에 위임하여 처리 (--> 레이아웃, 페인트 단계를 건너뛸 수 있음.)

#### 6. Composition

- 생성된 여러 레이어들을 하나로 합성

#### 🚨 하드웨어 가속 (GPU 가속)

- HTML 파싱, JS 실행, 레이아웃/스타일 계산 등 *CPU에서 처리하는 작업*을 **GPU에 위임**하여 작업을 빠르게 처리
- 요소를 별도의 레이어로 분리하여 GPU로 보내면 하드웨어 가속을 사용할 수 있음.

### 현재 상황

![performance 과정](./image/2.png)

애니메이션 실행 시, width 값 변경으로 인해 리플로우 발생
리플로우 작업이 화면 갱신 시점을 넘어서 쟁크 현상이 발생하고 있음.

### 애니메이션 최적화

✅ 리플로우, 리페인트가 일어나는 속성을 사용하지 않고 GPU를 사용할 수 있도록 transform과 같은 속성으로 변경하기

- components/Bar.js

```js
const BarGraph = styled.div`
  position: absolute;
  left: 0;
  top: 0;

  width: 100%;
  transform: scaleX(${({ width }) => width / 100}); // 퍼센트 -> 실수값으로 사용
  transform-origin: center left; // 왼쪽 기준으로 변경
  transition: transform 1.5s ease;

  height: 100%;
  background: ${({ isSelected }) =>
    isSelected ? "rgba(126, 198, 81, 0.7)" : "rgb(198, 198, 198)"};
  z-index: 1;
`;
```

### 애니메이션 최적화 결과

- 최적화 전
  ![성능 개선 전](./image/2.png)

- 최적화 후

  ![성능 개선 후](./image/3.png)

  - 레이아웃, 페인트 작업 생략되어 작업 개수가 적어짐

## **2-3) 컴포넌트 지연 로딩**

### 번들 파일 분석
