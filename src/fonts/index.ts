import localFont from "next/font/local";

export const pretendard = localFont({
  src: "./PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

// 아래 글꼴은 preload하지 않는다. 그 글꼴로 렌더되는 텍스트가 있을 때만 브라우저가 내려받는다.
export const hahmlet = localFont({
  src: "./HahmletVariable.ttf",
  variable: "--font-hahmlet",
  weight: "100 900",
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
});

export const blackHanSans = localFont({
  src: "./BlackHanSans-Regular.ttf",
  variable: "--font-black-han-sans",
  weight: "400",
  display: "swap",
  preload: false,
});

/** <html>에 붙여 모든 글꼴 CSS 변수를 정의하는 클래스 */
export const fontVariables = [pretendard, hahmlet, blackHanSans].map((font) => font.variable).join(" ");
