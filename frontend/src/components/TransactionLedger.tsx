import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, RefreshCw } from 'lucide-react';
import { ResaleTransaction } from '../types';
import { formatDateTime, inr } from '../lib/format';
import { Button, CountUp, cx, EmptyState, PageHeader, Pill, Segmented } from './ui';

interface TransactionLedgerProps {
  transactions: ResaleTransaction[];
  isLoading: boolean;
  onRefresh: () => void;
}

type Filter = 'all' | 'done' | 'open' | 'declined';

const bucket = (s: string): Filter =>
  s === 'COMPLETED' ? 'done' : s === 'REJECTED' || s === 'FAILED' ? 'declined' : 'open';

const statusPill = (s: string) => {
  const b = bucket(s);
  if (b === 'done') return <Pill tone="coach">Completed</Pill>;
  if (b === 'declined') return <Pill tone="danger">{s === 'REJECTED' ? 'Declined' : 'Failed'}</Pill>;
  if (s === 'REISSUE_PENDING') return <Pill tone="marigold" dot>With operator</Pill>;
  return <Pill tone="neutral">{s.replace(/_/g, ' ').toLowerCase()}</Pill>;
};

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({ transactions, isLoading, onRefresh }) => {
  const [filter, setFilter] = useState<Filter>('all');
  const txs = transactions as any[];
  const shown = filter === 'all' ? txs : txs.filter((t) => bucket(t.status) === filter);
  const done = txs.filter((t) => t.status === 'COMPLETED');
  const relayed = done.reduce((n, t) => n + Number(t.resalePrice || 0), 0);
  const repaid = done.reduce((n, t) => n + Number(t.sellerRefundAmount || 0), 0);

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 pb-12 pt-32 sm:px-8 sm:pt-36">
      <PageHeader
        kicker="Resale ledger"
        title="Every seat that changed hands."
        lede="Who paid, what went back to the seller, and where each transfer stands. Identity numbers stay masked."
        actions={
          <Button variant="ghost" onClick={onRefresh}>
            <RefreshCw className={cx('h-4 w-4', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        }
      />

      <div className="mt-8 grid grid-cols-2 overflow-hidden rounded-2xl border border-line bg-surface md:grid-cols-4">
        {[
          { label: 'Transfers', value: txs.length },
          { label: 'Completed', value: done.length },
          { label: 'Fares relayed', value: relayed, prefix: '₹' },
          { label: 'Paid back to sellers', value: repaid, prefix: '₹' },
        ].map((s, i) => (
          <div key={s.label} className={cx('p-5 sm:p-6', i % 2 === 1 && 'border-l border-line', i >= 2 && 'border-t border-line md:border-t-0', i === 2 && 'md:border-l')}>
            <p className="text-sm text-ink3">{s.label}</p>
            <p className="display-md mt-2 text-[2rem] text-ink">
              <CountUp value={s.value} prefix={s.prefix} />
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-ink2">
          <span className="num font-semibold text-ink">{shown.length}</span> {shown.length === 1 ? 'record' : 'records'}
        </p>
        <Segmented
          id="ledger-filter"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All' },
            { value: 'done', label: 'Completed' },
            { value: 'open', label: 'In progress' },
            { value: 'declined', label: 'Declined' },
          ]}
        />
      </div>

      <div className="mt-5">
        {isLoading && txs.length === 0 ? (
          <div className="skeleton h-64 rounded-2xl" />
        ) : shown.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-10 w-10" strokeWidth={1.25} />}
            title={txs.length === 0 ? 'Nothing has changed hands yet' : 'No records in this view'}
            body={txs.length === 0 ? 'Release a seat as Rahul, or run the live walkthrough from the Platform menu.' : 'Switch the filter to see other transfers.'}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="overflow-x-auto" data-lenis-prevent>
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="border-b border-line bg-surface2/60 text-xs text-ink3">
                  <tr>
                    {['Transfer', 'When', 'Route and berth', 'New passenger', 'Buyer paid', 'Seller refund', 'Status'].map((h) => (
                      <th key={h} className="px-5 py-3.5 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {shown.map((tx, i) => (
                    <motion.tr
                      key={tx.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.035, 0.3), duration: 0.4 }}
                      className="transition-colors hover:bg-surface2/50"
                    >
                      <td className="code px-5 py-4 text-ink">#{tx.transactionNumber}</td>
                      <td className="num px-5 py-4 text-ink3">{formatDateTime(tx.createdAt)}</td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-ink">{tx.routeFrom} to {tx.routeTo}</span>
                        <span className="block text-xs text-ink3">
                          {tx.operatorName} · <span className="code">{tx.seatNumber}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-ink">{tx.buyerPassengerName}</span>
                        <span className="code block text-xs text-ink3">{tx.buyerGovIdType} {tx.buyerGovIdNumber}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="num font-semibold text-ink">{inr(tx.resalePrice)}</span>
                        <span className="block text-xs text-ink3">fee {inr(tx.platformFee)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="num font-semibold text-accent">{inr(tx.sellerRefundAmount)}</span>
                        <span className="code block text-xs text-ink3">{tx.refundReferenceId || 'pending'}</span>
                      </td>
                      <td className="px-5 py-4">{statusPill(tx.status)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
