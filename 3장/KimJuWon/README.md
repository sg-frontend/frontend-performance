# 이미지 최적화와 Lazy Loading으로 웹 성능 높이기

## 🤔 글을 작성하게 된 계기

웹 페이지의 성능은 사용자 경험에 직접적인 영향을 미치는 중요한 요소입니다. 특히 이미지나 동영상과 같은 미디어 리소스는 웹 페이지의 로딩 속도를 크게 좌우합니다. 이 글에서는 이미지 로딩 최적화에 초점을 맞추어, 사용자에게 더 나은 경험을 제공할 수 있는 다양한 기법들을 알아보겠습니다.

## 1. Lazy Loading과 최적화 기법

### 1.1 Throttle 기법

웹 페이지에서 스크롤 이벤트는 매우 빈번하게 발생합니다. 실제로 스크롤을 감지하고 콘솔에 로그를 출력해보면, 한 틱당 거의 하나씩 많은 이벤트가 발생하는 것을 확인할 수 있습니다.

**Throttle이란?**

- 이벤트가 과도하게 발생할 경우, 그 처리를 제한하는 기법
- 일정 시간(예: 200ms) 동안 이벤트를 한 번만 처리하도록 제한할 수 있습니다

**문제점:**

- 정확성 문제: Throttle을 사용하면, 이미지가 뷰포트에 들어왔을 때 로딩되어야 하는 시점을 놓칠 수 있습니다. 예를 들어, 200ms 동안 이벤트를 무시한다면, 사용자가 빠르게 스크롤을 움직여 이미지가 뷰포트에 짧은 시간 동안만 노출되었을 때, 로딩이 이루어지지 않을 수 있습니다.

이러한 문제점 때문에 더 효율적인 대안으로 Intersection Observer API가 권장됩니다.

### 1.2 Intersection Observer

**Intersection Observer란?**

- 웹 페이지의 특정 요소와 뷰포트가 교차하는 시점을 감지하는 데 사용되는 브라우저 API
- 어떤 요소가 화면에 보이는지 혹은 사라지는지를 실시간으로 판단할 수 있습니다
- 이를 활용하면, 이미지나 다른 요소들이 실제로 사용자에게 보일 필요가 있을 때만 로딩을 시작하도록 할 수 있습니다

**코드 예시:**

```javascript
useEffect(() => {
  const options = {
    root: null,
    threshold: 1,
    rootMargin: 0,
  };

  const callback = (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
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
```

이미지는 `img` 태그에 `src`가 할당되는 순간에 로딩이 발생합니다. 따라서 위 코드에서는 처음에는 `data-src` 속성에 이미지 경로를 저장해두고, 이미지가 화면에 보이는 시점에 `src` 속성으로 값을 옮겨 로딩을 시작합니다.

### 1.3 Native Lazy Loading

브라우저에서 내장된 이미지 지연 로딩 기능인 Native Lazy Loading을 활용하면 JavaScript 코드 없이도 이미지나 iframe을 지연 로딩할 수 있습니다.

```html
<img src="image.jpg" alt="Description" loading="lazy" />

<!-- loading 속성 -->
<!-- - auto  : 브라우저가 결정 -->
<!-- - lazy  : 요소가 뷰포트에 가까워질때까지 지연 -->
<!-- - eager : 지연없이 바로 로딩 -->
```

**주의점:**

1. 상세한 시점 제어 불가: 세부적인 지연 로딩의 시점을 지정할 수 없습니다.
2. 브라우저 지원성: 모든 웹 브라우저에서 이 기능을 지원하지는 않습니다.
3. SEO 관련 주의점: Native Lazy Loading을 사용하면, 일부 검색 엔진이 지연 로딩된 콘텐츠를 정확하게 크롤링하지 못할 수 있습니다.

## 2. 이미지 최적화

불필요하게 큰 이미지는 웹 페이지의 로딩 속도를 저하시킵니다. Squoosh와 같은 도구를 활용하여 이미지를 WebP 포맷으로 압축하면 크기를 크게 줄일 수 있습니다.

하지만 WebP 포맷은 모든 브라우저에서 지원되지 않을 수 있으므로, 호환성 문제를 위해 `picture` 태그를 사용하는 것이 좋습니다.

```html
<picture>
  <source data-srcset="{props.webp}" type="image/webp" />
  <img data-src="{props.image}" ref="{imgRef}" />
</picture>
```

`picture` 태그는 다양한 타입의 이미지 렌더링에 사용되는 컨테이너로, 지원되는 타입의 이미지를 위에서부터 확인 후 렌더링합니다. 이를 Intersection Observer와 함께 사용하면 다음과 같이 코드를 작성할 수 있습니다:

```javascript
useEffect(() => {
  const options = {
    /* ... */
  };

  const callback = (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const previousSibling = target.previousSibling;

        target.src = target.dataset.src;
        previousSibling.srcset = previousSibling.dataset.srcset;
        observer.unobserve(entry.target);
      }
    });
  };
});

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
```

여러 이미지 포맷을 지원하고 싶다면, DOM 구조의 변경에 더 안정적으로 대응할 수 있도록 클래스를 활용하는 방법도 있습니다:

```html
<picture>
  <source class="webp-source" data-srcset="{main_styles_webp}" type="image/webp" />
  <source class="png-source" data-srcset="{main_styles_png}" type="image/png" />
  <img data-src="{main_styles}" ref="{imgEl3}" />
</picture>
```

```javascript
const callback = (entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const webpSourceEl = entry.target.parentElement.querySelector(".webp-source");
      const pngSourceEl = entry.target.parentElement.querySelector(".png-source");

      webpSourceEl.srcset = webpSourceEl.dataset.srcset;
      pngSourceEl.srcset = pngSourceEl.dataset.srcset;

      entry.target.src = entry.target.dataset.src;
      observer.unobserve(entry.target);
    }
  });
};
```

## 3. 동영상 최적화

동영상의 경우도 이미지와 마찬가지로 WebM 확장자를 사용해 압축을 처리할 수 있습니다. 이때도 역시 호환성을 고려해 `video` 태그 안에 `source`를 사용하는 것이 좋습니다:

```html
<!-- 최적화 전 -->
<video
  src="{video}"
  className="absolute translateX--1/2 h-screen max-w-none min-w-screen -z-1 bg-black min-w-full min-h-screen"
  autoplay
  loop
  muted
/>

<!-- 최적화 후 -->
<video
  className="absolute translateX--1/2 h-screen max-w-none min-w-screen -z-1 bg-black min-w-full min-h-screen"
  autoplay
  loop
  muted
>
  <source src="{video_webm}" type="video/webm" />
  <source src="{video}" type="video/mp4" />
</video>
```

압축으로 인한 화질 저하 문제를 완화하기 위해 다음과 같은 방법을 활용할 수 있습니다:

1. **블러 처리**: CSS의 Blur 필터를 사용해 화질 저하를 눈에 띄지 않게 만들기
2. **패턴 적용**: 영상 위에 패턴을 씌워 저화질 느낌을 감소시키기

```css
.pattern-overlay {
  background-image: url("path/to/pattern.png");
  opacity: 0.5;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
```

## 4. 폰트 최적화

### 4.1 FOUT vs FOIT

웹 폰트 로딩 시 발생할 수 있는 두 가지 현상이 있습니다:

**FOUT (Flash of Unstyled Text)**

- 폰트의 다운로드 여부와 상관없이 먼저 텍스트를 보여줍니다
- 장점: 페이지 내용을 바로 볼 수 있습니다
- 단점: 텍스트 스타일이 바뀌는 것이 사용자에게 어색하게 느껴질 수 있습니다

**FOIT (Flash of Invisible Text)**

- 폰트가 로드되어야 텍스트를 표현합니다
- 장점: 시각적으로 어색한 변화가 없습니다
- 단점: 사용자가 페이지 내용을 확인하는 데 시간이 더 걸립니다

"늦게 보여줘도 되는 텍스트는 차라리 FOIT으로 표현하자!"라는 접근도 고려해볼 수 있습니다.

### 4.2 시점 제어

폰트 적용의 시점을 제어하여 최적화를 수행할 수 있습니다. CSS의 `font-display` 속성을 활용하면 됩니다:

**font-display 속성의 주요 값**:

- `auto`: 브라우저의 기본 로딩 동작 (대부분의 경우 FOIT)
- `block`: FOIT
- `swap`: FOUT
- `fallback`: 3초 동안 FOIT 후 FOUT
- `optional`: FOIT 후 브라우저가 네트워크 상태를 기준으로 폰트 로딩을 포기

폰트 로딩 시 CSS 애니메이션 효과를 통해 사용자 경험을 개선할 수도 있습니다. `fontfaceobserver` 라이브러리를 활용하면 폰트 로딩 시점을 감지하고 적절한 애니메이션을 적용할 수 있습니다:

```javascript
import FontFaceObserver from "fontfaceobserver";

const font = new FontFaceObserver("BMYEONSUNG");

function BannerVideo() {
  const [isFontLoaded, setIsFontLoaded] = useState(false);

  useEffect(() => {
    font.load(null, 20000).then(() => {
      console.log("폰트 로드");
      setIsFontLoaded(true);
    });
  }, []);

  return (
    <div
      className="w-full h-full flex justify-center items-center"
      style={
        {
           폰트 로딩 상태에 따른 스타일 적용
        }
      }
    >
    </div>
  );
}
```

### 4.3 포맷 변경

웹 페이지에서 폰트 파일 포맷의 선택은 성능과 호환성에 큰 영향을 미칩니다:

**TTF (TrueType Font) & OTF (OpenType Font)**

- 특징: 벡터 기반으로 만들어져 확대/축소가 자유롭습니다
- 웹 최적화: 본래 데스크톱 환경을 위해 설계되었기 때문에 파일 크기가 상대적으로 큽니다

**WOFF (Web Open Font Format)**

- 특징: OTF와 TTF를 기반으로 하되, 웹 전송을 위해 압축되어 있습니다
- 웹 최적화: 파일 크기가 작아 로딩 시간이 빠르지만, 모든 브라우저가 지원하지 않을 수 있습니다

**WOFF2**

- 특징: WOFF1보다 약 30% 더 효율적으로 압축되어 있습니다
- 웹 최적화: 필요한 글리프만 포함하여 서브셋을 생성할 수 있습니다

호환성 문제를 고려하여 여러 포맷을 제공하는 것이 좋습니다:

```css
@font-face {
  font-family: BMYEONSUNG;
  src: url("./assets/fonts/subset-BMYEONSUNG.woff2") format("woff2"), url("./assets/fonts/subset-BMYEONSUNG.woff")
      format("woff"), url("./assets/fonts/subset-BMYEONSUNG.ttf") format("truetype");
  font-display: block;
  /* 위에서부터 우선적으로 폰트를 다운로드 */
}
```

### 4.4 DATA-URL

Data-URL은 웹 리소스를 URL 문자열로 직접 내장하는 방식입니다. 이를 통해 폰트 파일을 CSS 내부에 직접 삽입할 수 있으며, 별도의 네트워크 요청 없이 CSS 파일에서 폰트를 사용할 수 있습니다.

**장점**:

- HTTP 요청 감소: 별도의 파일 요청이 없어 네트워크 부하가 줄어듭니다
- 로딩 속도 향상: 작은 파일의 경우 별도 네트워크 지연 없이 즉시 로딩됩니다
- 호환성 보장: URL 형식은 모든 웹 브라우저에서 지원됩니다

**단점**:

- 파일 크기 증가: Base64 인코딩은 원래 파일 크기를 약 33% 증가시킵니다
- 캐싱 문제: Data-URL은 브라우저 캐시에 저장되지 않아 재방문 시 다시 로드됩니다
- 유지 보수 어려움: 원본 파일 수정 시 다시 인코딩 작업이 필요합니다

```css
@font-face {
  font-family: BMYEONSUNG;
  src: url("data:font/woff2;charset=utf-8;base64...") format("woff2");
}
```

## 5. 캐시 최적화

캐시는 웹 페이지 성능 향상에 중요한 역할을 합니다. 적절한 캐시 설정은 반복 방문 시 로딩 시간을 크게 줄일 수 있습니다.

**메모리 캐시**:

- RAM에 저장하는 캐시
- 빠른 속도로 데이터에 접근 가능하지만 브라우저를 종료하면 사라집니다

**디스크 캐시**:

- 하드 드라이브나 SSD와 같은 영구 저장 매체에 저장하는 캐시
- 브라우저를 종료해도 데이터가 유지됩니다

캐시 적용 여부는 `Cache-Control` 응답 헤더를 통해 제어할 수 있습니다:

**Cache-Control 헤더의 주요 속성**:

- `max-age`: 캐시의 유효시간 (초 단위)
- `no-cache`: 캐시를 사용 전에 서버에 검증 필요
- `no-store`: 캐시를 사용하지 않음 (민감한 정보에 사용)
- `private`: 응답이 개별 사용자에게 특화되었음
- `public`: 응답이 공용 캐시에 저장될 수 있음

Node.js 서버에서 적절한 캐시 헤더를 설정하는 예:

```javascript
// 최적화 전
const header = {
  setHeaders: (res, path) => {
    res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.setHeader("Expires", "-1");
    res.setHeader("Pragma", "no-cache");
  },
};

// 최적화 후
const header = {
  setHeaders: (res, path) => {
    if (path.endsWith(".html")) {
      res.setHeader("Cache-Control", "no-cache");
    } else if (path.endsWith(".js") || path.endsWith(".css") || path.endsWith(".webp")) {
      res.setHeader("Cache-Control", "public, max-age=31536000");
    } else {
      res.setHeader("Cache-Control", "no-store");
    }
  },
};
```
