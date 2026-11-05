
import { Link } from "react-router-dom";

const faqs = [
  {
    question: "What is Velora?",
    answer:
      "Velora is a personal investment tracking platform that helps you manage your stock holdings, monitor market updates, explore forecasts and track your portfolio performance.",
  },
  {
    question: "Are the stock forecasts guaranteed?",
    answer:
      "No. Forecasts are estimates generated using historical market data. Actual market prices can change unpredictably, and forecasts should not be treated as guaranteed outcomes.",
  },
  {
    question: "Does Velora provide financial advice?",
    answer:
      "No. Velora is an informational and portfolio tracking tool. It does not provide professional financial, investment or trading advice.",
  },
  {
    question: "Where does the market data come from?",
    answer:
      "Velora uses external market data sources. Data availability, accuracy and update frequency may vary depending on the provider.",
  },
];

const socialLinks = [
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/riya-sehgal-161838290/",
  },
  {
    name: "GitHub",
    href: "https://github.com/riyasehgal-codes",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/riyalityyy_/",
  },
];

const exploreLinks = [
  { name: "Home", to: "/" },
  { name: "Portfolio", to: "/portfolio" },
  { name: "Forecast", to: "/forecast" },
  { name: "News", to: "/news" },
  { name: "Alerts", to: "/alerts" },
  { name: "Velora AI", to: "/ai-chat" },
];

function Footer() {
  return (
    <footer className="mt-0 border-t border-blue-950 bg-[#030817] text-slate-300">
      <div className="mx-auto max-w-[1500px] px-5 py-12 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-10">

          {/* Brand */}
          <div>
            <Link
              to="/"
              className="group inline-flex items-center gap-4"
              aria-label="Velora home"
            >
              <span className="relative flex h-14.5 w-13 items-center justify-center">
                <span className="absolute left-2.25 top-0.75 h-12.25 w-4 rotate-[-28deg] rounded-sm bg-linear-to-b from-cyan-400 to-blue-600 transition group-hover:brightness-125" />
                <span className="absolute right-2.25 top-0.75 h-12.25 w-4 rotate-28 rounded-sm bg-linear-to-b from-blue-600 to-violet-500 transition group-hover:brightness-125" />
              </span>

              <span className="text-2xl font-medium tracking-[0.35em] text-white">
                VELORA
              </span>
            </Link>

            <h2 className="mt-7 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Smarter Investing.
            </h2>

            <p className="mt-2 text-lg font-semibold text-slate-300">
              Brighter Tomorrow.
            </p>

            <p className="mt-5 max-w-xs text-sm leading-6 text-slate-500">
              Making your investment journey simpler, smarter and more
              informed.
            </p>
          </div>

          {/* FAQ */}
          <div>
            <h3 className="mb-5 text-lg font-semibold text-white">FAQ</h3>

            <div className="space-y-3">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group border-b border-slate-800 pb-3"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-slate-300 transition hover:text-blue-300 [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <span className="text-lg text-blue-400 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>

                  <p className="mt-3 text-xs leading-6 text-slate-500">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>

          {/* Connect */}
          <div>
            <h3 className="mb-5 text-lg font-semibold text-white">
              Connect with us
            </h3>

            <div className="space-y-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-fit items-center gap-3 text-sm text-slate-400 transition hover:translate-x-1 hover:text-blue-300"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-[#08152d] text-xs font-semibold text-blue-300">
                    {social.name === "LinkedIn"
                      ? "in"
                      : social.name === "GitHub"
                      ? "GH"
                      : "IG"}
                  </span>
                  {social.name}
                  <span className="text-xs">↗</span>
                </a>
              ))}

              <a
                href="mailto:riyasehgalcodes@gmail.com"
                className="flex w-fit items-center gap-3 text-sm text-slate-400 transition hover:translate-x-1 hover:text-blue-300"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-[#08152d] text-sm text-blue-300">
                  @
                </span>
                Email
                <span className="text-xs">↗</span>
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="mb-5 text-lg font-semibold text-white">
              Explore Velora
            </h3>

            <div className="space-y-3">
              {exploreLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block w-fit text-sm text-slate-400 transition hover:translate-x-1 hover:text-blue-300"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-12 border-t border-slate-800 pt-6">
          <p className="text-xs leading-6 text-slate-500">
            <span className="font-semibold text-slate-400">
              Disclaimer:
            </span>{" "}
            Velora is an informational portfolio tracking platform.
            Market data and forecasts are provided for educational
            purposes only and should not be considered financial or
            investment advice. Investing involves risk.
          </p>

          <div className="mt-6 flex flex-col justify-between gap-3 text-xs text-slate-600 sm:flex-row sm:items-center">
            <p>
              © {new Date().getFullYear()} Velora. All rights reserved.
            </p>

            <p>
              Designed and developed with care by{" "}
              <span className="font-medium text-slate-400">
                Riya Sehgal
              </span>
              .
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
