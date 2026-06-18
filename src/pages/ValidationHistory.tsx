import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Text } from '../components/Text';
import { useVerifierStore, type ValidationTask } from '../Zustand/Store';
import {
  filterValidationHistory,
  paginateCollection,
  type ValidationHistoryStatusFilter,
} from '../utils/paginate';

const STATUS_OPTIONS: Array<{ value: ValidationHistoryStatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const PAGE_SIZE_OPTIONS = [5, 10, 20];

export default function ValidationHistory() {
  const navigate = useNavigate();
  const { validationHistory } = useVerifierStore();
  const [statusFilter, setStatusFilter] = useState<ValidationHistoryStatusFilter>('all');
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);

  const total = validationHistory.length;
  const approvedCount = validationHistory.filter((task) => task.status === 'approved').length;
  const rejectedCount = validationHistory.filter((task) => task.status === 'rejected').length;
  const approvalRate = total > 0 ? Math.round((approvedCount / total) * 100) : 0;

  const filteredHistory = useMemo(
    () => filterValidationHistory(validationHistory, { status: statusFilter, search }),
    [validationHistory, search, statusFilter],
  );

  const paginated = useMemo(
    () => paginateCollection(filteredHistory, page, pageSize),
    [filteredHistory, page, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

  useEffect(() => {
    if (page !== paginated.page) {
      setPage(paginated.page);
    }
  }, [page, paginated.page]);

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <button
          type="button"
          onClick={() => navigate('/verifier')}
          style={backButtonStyle}
        >
          &larr; Back to Dashboard
        </button>
        <Text role="display" as="h1" style={{ margin: 0 }}>
          Validation History
        </Text>
        <Text role="body" as="p" style={{ color: 'var(--muted)', margin: '0.35rem 0 0' }}>
          Review completed verifier decisions with outcome filters, search, and pagination.
        </Text>
      </header>

      <section style={statsGridStyle} aria-label="Validation history summary">
        <StatCard label="Total Validated" value={total} />
        <StatCard label="Approved" value={approvedCount} tone="success" />
        <StatCard label="Rejected" value={rejectedCount} tone="danger" />
        <StatCard label="Approval Rate" value={`${approvalRate}%`} />
      </section>

      <section style={toolbarStyle} aria-label="Validation history filters">
        <div style={searchWrapStyle}>
          <label htmlFor="validation-history-search" style={controlLabelStyle}>
            Search vault or owner
          </label>
          <div style={searchInputWrapStyle}>
            <Search size={16} aria-hidden="true" />
            <input
              id="validation-history-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search vault or owner"
              style={inputStyle}
            />
          </div>
        </div>

        <fieldset style={statusFieldsetStyle}>
          <legend style={controlLabelStyle}>Outcome</legend>
          <div style={segmentedStyle}>
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={statusFilter === option.value}
                onClick={() => setStatusFilter(option.value)}
                style={segmentButtonStyle(statusFilter === option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div style={pageSizeWrapStyle}>
          <label htmlFor="validation-history-page-size" style={controlLabelStyle}>
            Page size
          </label>
          <select
            id="validation-history-page-size"
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
            style={selectStyle}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} rows
              </option>
            ))}
          </select>
        </div>
      </section>

      <section style={historyPanelStyle} aria-label="Validation history results">
        <div style={resultHeaderStyle}>
          <Text role="body" as="h2" style={{ margin: 0 }}>
            Results
          </Text>
          <Text role="caption" as="p" style={{ color: 'var(--muted)', margin: 0 }}>
            {filteredHistory.length === 0
              ? 'No matching validations'
              : `Showing ${paginated.startIndex + 1}-${paginated.endIndex} of ${filteredHistory.length}`}
          </Text>
        </div>

        {total === 0 ? (
          <EmptyState
            title="No History Found"
            message="You haven't processed any validations yet."
          />
        ) : filteredHistory.length === 0 ? (
          <EmptyState
            title="No Matching Validations"
            message="Adjust the search text or outcome filter to broaden the result set."
          />
        ) : (
          <>
            <div style={listStyle}>
              {paginated.items.map((task) => (
                <HistoryItem key={task.id} task={task} />
              ))}
            </div>
            <PaginationControls
              page={paginated.page}
              pageCount={paginated.pageCount}
              onPageChange={setPage}
            />
          </>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: 'success' | 'danger';
}) {
  const color = tone === 'success' ? 'var(--success)' : tone === 'danger' ? 'var(--danger)' : 'var(--text)';

  return (
    <div style={statCardStyle}>
      <Text role="caption" as="p" style={{ color: 'var(--muted)', margin: 0 }}>
        {label}
      </Text>
      <Text role="display" as="p" style={{ color, margin: '0.35rem 0 0' }}>
        {value}
      </Text>
    </div>
  );
}

function HistoryItem({ task }: { task: ValidationTask }) {
  const isApproved = task.status === 'approved';
  const statusColor = isApproved ? 'var(--success)' : 'var(--danger)';
  const statusBg = isApproved ? 'var(--success-transparent)' : 'var(--danger-transparent)';

  return (
    <article style={historyItemStyle}>
      <div style={historyMainStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <span
            style={{
              ...statusPillStyle,
              color: statusColor,
              background: statusBg,
              borderColor: statusColor,
            }}
          >
            {task.status}
          </span>
          <Text role="mono" as="span" style={{ color: 'var(--muted)', fontSize: 12 }}>
            ID: {task.id}
          </Text>
        </div>
        <Text role="body" as="h3" style={{ margin: '0.5rem 0 0', fontWeight: 700 }}>
          {task.vaultName}
        </Text>
        <Text role="caption" as="p" style={{ margin: '0.35rem 0', color: 'var(--text)' }}>
          {task.milestone}
        </Text>
        <Text role="mono" as="p" style={ownerStyle}>
          Owner: {task.owner}
        </Text>
      </div>

      <div style={notesStyle}>
        <Text role="caption" as="p" style={notesLabelStyle}>
          Verification Notes
        </Text>
        <Text role="body" as="p" style={{ margin: 0, fontStyle: 'italic', color: 'var(--text)' }}>
          "{task.notes || 'No notes provided during verification.'}"
        </Text>
      </div>
    </article>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div style={emptyStyle}>
      <Text role="body" as="h3" style={{ margin: 0 }}>
        {title}
      </Text>
      <Text role="body" as="p" style={{ margin: '0.5rem 0 0', color: 'var(--muted)' }}>
        {message}
      </Text>
    </div>
  );
}

function PaginationControls({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);

  return (
    <nav aria-label="Validation history pagination" style={paginationStyle}>
      <button
        type="button"
        aria-label="Previous page"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        style={paginationButtonStyle(page === 1)}
      >
        <ChevronLeft size={16} aria-hidden="true" />
      </button>
      {pages.map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          aria-label={`Page ${pageNumber}`}
          aria-current={pageNumber === page ? 'page' : undefined}
          onClick={() => onPageChange(pageNumber)}
          style={pageButtonStyle(pageNumber === page)}
        >
          {pageNumber}
        </button>
      ))}
      <button
        type="button"
        aria-label="Next page"
        disabled={page === pageCount}
        onClick={() => onPageChange(page + 1)}
        style={paginationButtonStyle(page === pageCount)}
      >
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}

const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
  padding: '1.5rem',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
};

const backButtonStyle: CSSProperties = {
  alignSelf: 'flex-start',
  background: 'transparent',
  border: 0,
  color: 'var(--muted)',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  padding: 0,
};

const statsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '1rem',
};

const statCardStyle: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--elevated)',
  padding: '1.1rem',
};

const toolbarStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1rem',
  alignItems: 'end',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '1rem',
};

const searchWrapStyle: CSSProperties = {
  minWidth: 0,
};

const pageSizeWrapStyle: CSSProperties = {
  minWidth: 130,
};

const controlLabelStyle: CSSProperties = {
  display: 'block',
  color: 'var(--muted)',
  fontSize: 12,
  fontWeight: 700,
  marginBottom: '0.4rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const searchInputWrapStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  color: 'var(--muted)',
  padding: '0 0.75rem',
};

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 40,
  border: 0,
  outline: 'none',
  background: 'transparent',
  color: 'var(--text)',
};

const selectStyle: CSSProperties = {
  width: '100%',
  minHeight: 40,
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  background: 'var(--bg)',
  color: 'var(--text)',
  padding: '0 0.65rem',
};

const statusFieldsetStyle: CSSProperties = {
  border: 0,
  margin: 0,
  padding: 0,
};

const segmentedStyle: CSSProperties = {
  display: 'inline-flex',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  overflow: 'hidden',
  background: 'var(--bg)',
};

function segmentButtonStyle(active: boolean): CSSProperties {
  return {
    minHeight: 40,
    border: 0,
    borderRight: '1px solid var(--border)',
    background: active ? 'var(--accent-transparent)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text)',
    cursor: 'pointer',
    fontWeight: 700,
    padding: '0 0.85rem',
  };
}

const historyPanelStyle: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--elevated)',
  overflow: 'hidden',
};

const resultHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  borderBottom: '1px solid var(--border)',
  padding: '1rem 1.25rem',
};

const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const historyItemStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '1rem',
  padding: '1.25rem',
  borderBottom: '1px solid var(--border)',
};

const historyMainStyle: CSSProperties = {
  minWidth: 0,
};

const statusPillStyle: CSSProperties = {
  alignItems: 'center',
  border: '1px solid',
  borderRadius: 'var(--radius-full)',
  display: 'inline-flex',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.04em',
  padding: '0.15rem 0.5rem',
  textTransform: 'uppercase',
};

const ownerStyle: CSSProperties = {
  display: 'inline-flex',
  color: 'var(--muted)',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  margin: '0.25rem 0 0',
  padding: '0.25rem 0.45rem',
  width: 'max-content',
  maxWidth: '100%',
};

const notesStyle: CSSProperties = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '1rem',
};

const notesLabelStyle: CSSProperties = {
  color: 'var(--muted)',
  fontWeight: 800,
  margin: '0 0 0.4rem',
  textTransform: 'uppercase',
};

const emptyStyle: CSSProperties = {
  padding: '3rem 1.5rem',
  textAlign: 'center',
};

const paginationStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '0.4rem',
  padding: '1rem 1.25rem',
};

function paginationButtonStyle(disabled: boolean): CSSProperties {
  return {
    alignItems: 'center',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: disabled ? 'var(--muted)' : 'var(--text)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 36,
    opacity: disabled ? 0.55 : 1,
  };
}

function pageButtonStyle(active: boolean): CSSProperties {
  return {
    background: active ? 'var(--accent)' : 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: active ? 'var(--bg)' : 'var(--text)',
    cursor: 'pointer',
    fontWeight: 700,
    minHeight: 36,
    minWidth: 36,
  };
}
