import Button from "./ui/Button";

export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages, has_next, has_prev, total } = pagination;

  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5">
      <p className="text-xs text-slate-400">
        Page <span className="font-medium text-slate-600">{page}</span> of{" "}
        <span className="font-medium text-slate-600">{pages}</span>
        {typeof total === "number" && <span> &middot; {total} total</span>}
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!has_prev}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!has_next}
        >
          Next
        </Button>
      </div>
    </div>
  );
}