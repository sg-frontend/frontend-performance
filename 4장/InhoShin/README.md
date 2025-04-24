# 4장 이미지 갤러리 최적화

- **이미지 지연 로딩**: 이미지 지연 로딩 라이브러리 사용
- **레이아웃 이동 피하기**
- **리덕스 렌더링 최적화**
- **병목 코드 최적화**: 메모이제이션 적용

## 서비스 실행

### Node.js 버전 설정

> Node.js 버전 호환 문제 해결을 위해 버전 설정 필요합니다.

```bash
nvm install 16
nvm use 16
```

### 서비스 실행

```bash
npm install
npm run start # 프론트엔드 시작
npm run server # 백엔드 시작

# localhost:3000 접속
```

## 레이아웃 이동 피하기

### 레이아웃 이동이란?

CLS: 레이아웃 이동은 위치를 순간적으로 변경시키면서 의도와 다른 클릭을 유발함. 사용자 경험 나쁨.

- 0~1까지의 값: 0 나쁨, 1 좋음

### 레이아웃 이동의 원인

- 사이즈가 미리 정의되지 않은 이미지 요소
- 사이즈가 미리 정의되지 않은 광고 요소
- 동적으로 삽입된 콘텐츠
- 웹 폰트(FOIT, FOUT)

### 레이아웃 이동 해결

💡 핵심: 레이아웃 이동을 일으키는 요소의 사이즈를 지정하자.

#### 이미지 크기를 비율로 설정하는 방법 두가지

1. padding-top 사용

```html
<div class="wrapper">
  <img class="image" src="..." />
</div>
```

```css
.wrapper {
  position: relative;
  width: 160px;
  padding-top: 56.25%; /* 16:9 비율 */
}

.image {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}
```

2. aspect-ratio 사용

```css
.wrapper {
  width: 100%;
  aspect-ratio: 16 / 9;
}

.image {
  width: 100%;
  height: 100%;
}
```

> 호환성 확인: https://caniuse.com/css-aspect-ratio

![image](./images/1.png)

> LightHouse 결과

![image](./images/2.png)

> 레이아웃 이동 해결 후(0으로 감소, 즉 레이아웃 이동이 발생하지 않음)

![image](./images/3.png)

## 이미지 지연 로딩

Intersection Observer API 대신, `react-lazyload` 라이브러리 사용

```bash
npm install react-lazyload
```

```js
import LazyLoad from "react-lazyload";

function Component() {
  return (
    <div>
      <LazyLoad>
        <img src="..." alt="..." />
      </LazyLoad>
    </div>
  );
}
```

**react-lazyload 라이브러리 장점**

- 단순히 이미지뿐만 아니라 일반 컴포넌트도 지연 로드할 수 있다.

photoItem.js 컴포넌트에서 지연 로드 적용

```tsx
import LazyLoad from "react-lazyload";

function PhotoItem({ photo: { urls, alt } }) {
  // 생략

  return (
    <ImageWrap>
      <LazyLoad>
        <Image
          src={urls.small + "&t=" + new Date().getTime()}
          alt={alt}
          onClick={openModal}
        />
      </LazyLoad>
    </ImageWrap>
  );
}
```

기본적으로 지연 로드 적용된 이미지는 화면에 보이지 않을 때 로드되지 않음.

스크롤을 내릴 시, 이미지가 로드되는 것을 확인할 수 있음.

스크롤 내릴 때 미리 이미지를 로드하고 싶다면, `offset` 속성을 사용하면 됨.

```tsx
<LazyLoad offset={100}>
  <img src="..." alt="..." />
</LazyLoad>
```

## 리덕스 렌더링 최적화

### 리액트의 렌더링

렌더링이 오래 걸리는 코드, 렌더링하지 않아도 되는 컴포넌트에서 불필요하게 리렌더링이 발생하는지 등 React Developer Tools에서 확인할 수 있음.

![image](./images/4.png)

`Highlights updates when components render` 를 켜면 리렌더링이 발생한 컴포넌트에 테두리를 띄움.

#### 문제점

이미지를 클릭해서 모달을 띄울 때/모달 배경 변경/모달 닫을 때, 모달만 렌더링되지 않고 이미지 리스트 컴포넌트까지 리렌더링 발생함.

#### 리렌더링의 원인

: 결론부터 말하면 리덕스 때문에 발생함. 컴포넌트들이 리덕스 상태를 구독하고 있기 때문에 리덕스 상태가 변경될 때마다 불필요한 리렌더링이 발생함.

```tsx
const { photos, loading } = useSelector((state) => ({
  photos:
    state.category.category === "all"
      ? state.photos.data
      : state.photos.data.filter(
          (photo) => photo.category === state.category.category
        ),
  loading: state.photos.loading,
}));
```

현재 코드는 매번 객체를 새로 만들어서 새로운 참조 값을 반환하는 형태이므로 `useSelector`는 구독한 값이 변했다고 판단함.

#### useSelector 문제 해결

새로운 객체를 만들지 않도록 반환 값을 나누고, Equality Function을 사용하여 참조 값이 변경되지 않도록 함.

- **객체를 새로 만들지 않도록 반환 값 나누기**

```tsx
// 기존 코드
const { modalVisible, bgColor, src, alt } = useSelector((state) => ({
  modalVisible: state.imageModal.modalVisible,
  bgColor: state.imageModal.bgColor,
  src: state.imageModal.src,
  alt: state.imageModal.alt,
}));
```

```tsx
// 새로운 코드
const modalVisible = useSelector((state) => state.imageModal.modalVisible);
const bgColor = useSelector((state) => state.imageModal.bgColor);
const src = useSelector((state) => state.imageModal.src);
const alt = useSelector((state) => state.imageModal.alt);
```

객체로 묶어서 한번에 반환하던 것을 단일 값으로 반환하도록 수정함. 다른 상태 변화에 영향을 받지 않도록 함.

```tsx
// 이전 코드
const { category } = useSelector((state) => ({
  category: state.category.category,
}));

// 새로운 코드
const category = useSelector((state) => state.category.category);
```

Header 컴포넌트에서 사용하는 코드도 객체로 묶어서 반환하던 것을 단일 값으로 반환하도록 수정함.

객체를 생성하지 않고 원시값(primitive value)을 직접 반환함. useSelector는 이전 값과 새로운 값을 비교할 때 값 자체를 비교하게 되므로, 실제로 category 값이 변경되었을 때만 리렌더링이 발생.

- **새로운 Equality Function 사용**

이전 반환 값과 현재 반환 값을 비교하여 값이 변경되었을 때만 리렌더링 발생하는 방식이다.

리덕스 useSelector 훅에서 옵션으로 `shallowEqual` 을 넣으면 작동한다.

```tsx
import { useSelector, shallowEqual } from "react-redux";

const { modalVisible, bgColor, src, alt } = useSelector(
  (state) => ({
    modalVisible: state.imageModal.modalVisible,
    bgColor: state.imageModal.bgColor,
    src: state.imageModal.src,
    alt: state.imageModal.alt,
  }),
  shallowEqual
);
```

```tsx
// PhotoListContainer.js
const { photos, loading } = useSelector(
  (state) => ({
    photos:
      state.category.category === "all"
        ? state.photos.data
        : state.photos.data.filter(
            (photo) => photo.category === state.category.category
          ),
    loading: state.photos.loading,
  }),
  shallowEqual // 메인 이미지 리스트 리렌더링 막아줌
);
```

#### 추가 문제: All 말고 다른 카테고리에서는 여전히 리렌더링 발생

useSelector에서 filter를 사용하다보니 리렌더링 발생.

**해결 방법**

```tsx
const { category, allPhotos, loading } = useSelector(
  (state) => ({
    category: state.category.category,
    allPhotos: state.photos.data,
    loading: state.photos.loading,
  }),
  shallowEqual
);

const photos =
  category === "all"
    ? allPhotos
    : allPhotos.filter((photo) => photo.category === category);
```

전체 이미지에서 나중에 filter를 사용하여 필요한 이미지만 추려내는 방식으로 리렌더링 문제 해결.

## 병목 코드 최적화

### 이미지 모달 분석

배경 색 늦게 뜨는 원인 -> Performance 탭에서 확인

![image](./images/5.png)

> 모달 컴포넌트에서 이미지 로드 시 배경 색 늦게 뜨는 원인

가장 하단에 Image Decode라는 작업이 있는데, drawImage 함수 하위 작업임.

해당 작업이 끝나고 새롭게 렌더링되면서 배경화면이 뜨는 것을 확인할 수 있음.

### getAverageColorOfImage 함수 분석

```js
export function getAverageColorOfImage(imgElement) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext && canvas.getContext("2d");
  const averageColor = {
    r: 0,
    g: 0,
    b: 0,
  };

  if (!context) {
    return averageColor;
  }

  const width = (canvas.width =
    imgElement.naturalWidth || imgElement.offsetWidth || imgElement.width);
  const height = (canvas.height =
    imgElement.naturalHeight || imgElement.offsetHeight || imgElement.height);

  context.drawImage(imgElement, 0, 0);

  const imageData = context.getImageData(0, 0, width, height).data;
  const length = imageData.length;

  for (let i = 0; i < length; i += 4) {
    averageColor.r += imageData[i];
    averageColor.g += imageData[i + 1];
    averageColor.b += imageData[i + 2];
  }

  const count = length / 4;
  averageColor.r = ~~(averageColor.r / count); // ~~ => convert to int
  averageColor.g = ~~(averageColor.g / count);
  averageColor.b = ~~(averageColor.b / count);

  return averageColor;
}
```

픽셀 정보를 통해 하나씩 더해서 평균을 내고 있는 함수라 큰 이미지를 통째로 넣으면 렌더링 속도가 느려짐.

### 메모이제이션 적용

메모이제이션은 함수의 결과를 저장하여 **동일한 인자 값이 들어오면 이전 결과 값을 반환**하는 기술임.

![image](./images/6.png)

#### 메모이제이션 적용

```js
const cache = {};

export function getAverageColorOfImage(imgElement) {
  if (cache.hasOwnProperty(imgElement.src)) {
    return cache[imgElement.src];
  }

  /* 중략 */
  cache[imgElement.src] = averageColor;

  return averageColor;
}
```

같은 이미지를 여러번 모달 띄워 보면, 처음 동작에는 배경 색 적용이 느리지만, 이후에는 바로 적용되는 것을 확인할 수 있다.

![image](./images/7.png)

위 이미지는 동일한 이미지를 두번 실행했을 때 첫번째 실행에는 배경 색 적용이 느리지만, 두번째 실행에는 바로 적용되는 것을 확인할 수 있다.

> #### 메모이제이션의 단점
>
> 메모이제이션을 적용해도 재활용할 수 있는 조건이 충족되지 않으면, 오히려 메모리만 잡아먹음.
> 따라서 메모이제이션을 적용할 때는 해당 로직이 동일한 조건에서 충분히 반복 실행되는지 먼저 체크해야 함.

**아직 첫번째 실행 때는 느리기 때문에 로직 수정이 필요함.**

1. 이미지 크기 조절

- 원본이미지로 계산하지 말고, 썸네일 이미지로 계산하여 최적화 해보자.
- 이미지 리스트에서 클릭한 이미지의 썸네일 이미지를 사용하여 배경색 계산하면 속도가 빨라진다.
- 이미지와 병렬적으로 배경색 계산 작업을 진행되어 배경이 먼저 계산되어 나타는걸 아래 사진을 통해 확인 할 수 있다.

![image](./images/8.png)

performance 패널으로 확인해보면 이전 작업 시간에 비해 매우 빠르게 완료된 것을 확인 할 수 있다.

![image](./images/9.png)
