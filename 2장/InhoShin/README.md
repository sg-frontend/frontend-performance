# 2장 올림픽 통계 서비스 최적화

**최적화 기법**

- CSS 애니메이션
- 컴포넌트 지연 로딩
- 컴포넌트 사전 로딩
- 이미지 사전 로딩

## 애니메이션 최적화

설문 영역의 막대 그래프의 애니메이션을 최적화 해보자.

### 브라우저 렌더링 과정

1. DOM, CSSOM 생성
2. 렌더링 트리 구축
3. 레이아웃: 렌더링 트리의 각 노드 위치와 크기 계산
4. 페인트: 레이어별로 그리기 준비
5. 컴포지트: 레이어를 합성하여 화면에 표시

### 리플로우, 리페인트

리플로우는 주요 렌더링 경로의 모든 단계를 모두 재실행함. 즉, 브라우저 리소스를 많이 사용함.

**리플로우와 리페인트를 발생시키는 속성**

- 리플로우: position, display, width, float, height, font-family, top, left, font-size, font-weight, line-height, min-height, margin, padding, border 등
- 리페인트: background, background-color, background-position, border-radius, border-style, box-shadow, color, line-style, outline 등

-> `transform`, `opacity` 속성은 **리플로우와 리페인트를 발생시키지 않음**.

-> 해당 요소를 **별도의 레이어로 분리하고 작업을 GPU에 위임하여 처리함**.

### 하드웨어 가속(GPU 가속)

- `transform: translate()` 는 변화가 일어나는 순간 레이어를 분리함.
- `transform: translate3d()`, `scale3d()` 와 같은 3d 속성들, 또는 will-change 속성은 처음부터 레이어를 분리해 두기 때문에 변화에 더욱 빠르게 대처 가능함. 레이어가 너무 많아지면 그만큼 메모리를 많이 사용하기 때문에 주의해야 함.

**Jank 현상**

- 애니메이션이 부드럽지 않은 현상
- 애니메이션이 부드럽게 작동하려면 60fps 이상의 속도가 필요함.
- 60fps 이상의 속도를 유지하려면 16.6ms 이하의 시간이 필요함.

: **리플로우 때문에 프레임 드랍이 생기고, 이로 인해 화면이 버벅거리거나 애니메이션이 매끄럽지 않은 것**을 의미함

