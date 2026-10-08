function NewsCard({ article }) {
  const formatDate = (timestamp) => {
    if (!timestamp) {
      return "Recently";
    }

    const date = new Date(
      Number(timestamp) * 1000
    );

    if (isNaN(date.getTime())) {
      return "Recently";
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-600 hover:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-4">

        <div className="flex-1">

          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-blue-400">
            {article.publisher}
          </p>

          <h3 className="text-base font-semibold leading-6 text-white transition group-hover:text-blue-400">
            {article.title}
          </h3>

          <p className="mt-3 text-xs text-slate-500">
            {formatDate(article.published_at)}
          </p>

        </div>

        <span className="text-slate-500 transition group-hover:text-blue-400">
          ↗
        </span>

      </div>
    </a>
  );
}

export default NewsCard;