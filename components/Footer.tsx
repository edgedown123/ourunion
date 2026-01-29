export default function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-500 text-sm px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-2 text-center md:text-left">

        <p className="font-semibold text-gray-700">
          우리노동조합
        </p>

        <p>
          서울특별시 은평구 통일로 1190 진관버스공영차고지
        </p>

        <p>
          TEL: 02-123-4567&nbsp;&nbsp;
          FAX: 02-1234-5678
        </p>

        <p>
          EMAIL: edgedown@naver.com
        </p>

        <p className="pt-4 text-xs text-gray-400">
          Copyright © 2025 우리노동조합. All rights reserved.
        </p>

        <div className="pt-2 flex justify-center md:justify-start gap-6 text-sm">
          <a href="/privacy" className="hover:underline">
            개인정보처리방침
          </a>
          <a href="/email-policy" className="hover:underline">
            이메일무단수집거부
          </a>
        </div>

      </div>
    </footer>
  );
}
