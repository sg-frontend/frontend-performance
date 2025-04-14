# 3장 홈페이지 최적화

## 서비스 실행

### Node.js 버전 설정

> Node.js 버전 호환이 안되어 버전 설정 필요합니다.

```bash
nvm install 16
nvm use 16
```

### 서비스 실행

```bash
npm install
npm run dev
```

### 서버 실행

```bash
npm run server
```

### 빌드된 파일 + 서버 실행

```bash
npm run build
npm run serve
```

### 도움 및 참고 사이트

- **squoosh**: https://squoosh.app/ 이미지 압축 툴
- **PurgeCSS**: https://purgecss.com/ 불필요한 CSS 제거 툴

## 이미지 지연 로딩

### 네트워크 쓰로틀링

> #### 네트워크 속도를 제한하여 테스트 진행
>
> Network > throttling > Custom add > 6000kb/s로 다운로드/업로드, Latency 20ms로 설정해서 테스트

- **문제점**: 바로 나와야 할 동영상 콘텐츠가 다른 이미지에 의해 지연되는 문제 발생
- **해결 방법**: 이미지를 지연 로드해서 동영상을 먼저 로드하도록 함
  - 이미지가 보이는 순간 / 보이는 직전에 로드
- **상세 방법**: `Intersection Observer` 브라우저 API 사용
  - 이유: 스크롤 이벤트로 감지하면 많은 이벤트가 발생하기 때문에 메인 스레드에 무리가 갈 수 있음.
  - 특정 관찰 요소가 화면에 들어온 시점 여부를 알수 있음.

> 코드 예시

```js
const options = {
  root: null, // 가시성을 확인할 때 사용되는 뷰포트 요소(기본값 null == 브라우저 뷰포트)
  rootMargin: "0px", // root 요소의 여백
  threshold: 1.0, // 가시성 퍼센티지 1.0 == 모두 보이는 경우, 0 == 1px이라도 보이는 경우 콜백 실행
};

// 가시성이 변경될 때마다 실행되는 함수
const callback = (entries, observer) => {
  // entries: 가시성이 변한 요소를 배열 형태로 전달 받음
  console.log("Entries", entries);
};

// Intersection Observer 객체 생성 (가시성이 변할 때마다 콜백 실행)
const observer = new IntersectionObserver(callback, options);

observer.observe(document.querySelector("#target-element1"));
observer.observe(document.querySelector("#target-element2"));
```

### Intersection Observer 적용하기

```js
import React, { useRef, useEffect } from "react";

function Card(props) {
  const imgRef = useRef(null);

  useEffect(() => {
    const options = {};
    const callback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          console.log("is intersecting", entry.target.dataset.src);
          entry.target.src = entry.target.dataset.src;
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(callback, options);
    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="Card text-center">
      <img data-src={props.image} ref={imgRef} />
      <div className="p-5 font-semibold text-gray-700 text-xl md:text-lg lg:text-xl keep-all">
        {props.children}
      </div>
    </div>
  );
}

export default Card;
```

- img의 src 이미지 주소를 data-src에 넣으면, 이미지가 로드되지 않는다.
- 나중에 이미지가 뷰포트에 들어왔을 때, data-src에 있는 값을 src로 옮겨 이미지를 로드하도록 처리한다.
- `isIntersecting` 이 true인지 여부 확인해 src 값을 할당
- `unobserve`: observe 해제. 이미지 로드 후에는 더 이상 관찰할 필요가 없음.
- **정리**: 처음에 src 값 대신 data-src 값을 할당하고, 이미지가 뷰포트에 들어온 순간, 이미지 지연 로딩 기법을 통해 이미지를 로드하도록 처리

![이미지 지연 로딩 결과](./images/1.png)

- **이미지 지연 로딩 결과**: `banner-video.mp4` 가 로드된 이후, `main1,2,3` 이미지가 로드되는 것을 확인할 수 있음.

## 이미지 사이즈 최적화

### 느린 이미지 로딩 분석

🚨 **이미지가 느리게 보이는 이유:**

- 스크롤에 도달하자마자 로드하기 때문에 전체 이미지가 보이지 않아서 잘려보이는 것 처럼 보임.
- 이미지 크기가 크기 때문에 로드 시간이 오래 걸림.

✅ **이미지 사이즈 최적화를 통해 UX 최적화**

### 이미지 포맷 종류

- PNG: 무손실 압축, 알파 채널 지원
- JPG: 손실 압축, 더 작은 파일 크기
- WebP: 무손실 압출, 손실 압축 모두 제공, 더 작은 파일 크기, 호환성 낮음
  - PNG 대비 26%, JPG 대비 25~34% 작은 파일 크기

### 이미지 포맷 비교

- 사이즈: PNG > JPG > WebP
- 화질: PNG = WebP > JPG
- 호환성: PNG = JPG > WebP

### WebP 포맷 호환성 표

![WebP 포맷 호환성 표](./images/2.png)

- IE를 제외하면 거의 모든 브라우저에서 지원하기 때문에 사용해도 괜찮을 것으로 보임.

### Squoosh를 사용하여 이미지 변환

- **squoosh**: https://squoosh.app/ - 구글에서 만든 이미지 압축 애플리케이션
  - 이미지 크기 조절: 너비 600px, 높이 600px (두 배 크기로 조절)
  - 압축 방식: `WebP`
  - 압축률: `75`

![이미지 압축 결과](./images/3.png)

- 원본(6.39MB) 대비 압축률 100%로 14.7kB로 줄어들었음.

하지만, 특정 브라우저에서 렌더링이 제대로 동작하지 않을 수 있기 때문에, `picture` 태그를 사용하여 이미지를 렌더링 할 수 있도록 처리해야 함.

```html
# 뷰포트에 따라
<picture>
  <source media="(min-width:650px)" srcset="img_pink_flowers.jpg" />
  <source media="(min-width:465px)" srcset="img_white_flowers.jpg" />
  <img src="img_orange_flowers.jpg" alt="Flowers" style="width:auto;" />
</picture>

# 이미지 포맷에 따라
<picture>
  <source srcset="photo.avif" type="image/avif" />
  <source srcset="photo.webp" type="image/webp" />
  <img src="photo.jpg" alt="photo" />
</picture>
```

#### 이미지 최적화 코드

```js
// [MainPage.js]

<Card image={main1} webp={main1_webp}>
  롱보드는 아주 재밌습니다.
</Card>
<Card image={main2} webp={main2_webp}>
  롱보드를 타면 아주 신납니다.
</Card>
<Card image={main3} webp={main3_webp}>
  롱보드는 굉장히 재밌습니다.
</Card>
```

```js
// [Card.js]
import React, { useRef, useEffect } from "react";

function Card(props) {
  const imgRef = useRef(null);

  useEffect(() => {
    const options = {};
    const callback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target;
          const previousSibling = target.previousSibling;
          console.log("is intersecting", entry.target.dataset.src);
          target.src = target.dataset.src;
          previousSibling.srcset = previousSibling.dataset.srcset;
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(callback, options);
    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="Card text-center">
      <picture>
        <source data-srcset={props.webp} type="image/webp" />
        <img data-src={props.image} ref={imgRef} />
      </picture>
      <div className="p-5 font-semibold text-gray-700 text-xl md:text-lg lg:text-xl keep-all">
        {props.children}
      </div>
    </div>
  );
}

export default Card;
```

- webp 포맷을 사용하여 이미지를 렌더링 할 수 있도록 처리
- img 태그 대신 picture 태그를 사용해 source, img 태그 추가함.(webP 우선 로드 후 지원하지 못하면 source 태그를 무시함. img태그의 JPG 렌더링)
- picture 태그는 첫 번째 이미지를 로드하지 못하면 두 번째 이미지를 로드함.

```js
const target = entry.target; // 현재 <img> 태그
const previousSibling = target.previousSibling; // 바로 앞의 형제 요소인 <source> 태그
```

## 동영상 최적화



## 폰트 최적화

## 캐시 최적화

## 불필요한 CSS 제거
