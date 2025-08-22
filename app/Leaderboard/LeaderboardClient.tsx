'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type Row = {
  player: `0x${string}`;
  score: bigint | number | string;
  transactions: bigint | number | string;
  username?: string | null;
};

type ApiOk = { ok: true; rows: Row[]; fromBlock?: number | string; toBlock?: number | string };
type ApiErr = { ok: false; error: string };
type ApiResp = ApiOk | ApiErr;

export default function LeaderboardClient() {
  const router = useRouter();
  const params = useSearchParams();

  const initialScope = (params.get('scope') === 'all' ? 'all' : 'game') as 'game' | 'all';
  const initialRange = Math.max(1000, Number(params.get('range') ?? 100000));
  const highlight = params.get('highlight')?.toLowerCase();

  const [scope, setScope] = useState<'game' | 'all'>(initialScope);
  const [range, setRange] = useState<number>(initialRange);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const prettyScope = useMemo(
    () => (scope === 'game' ? 'This Game' : 'All Games'),
    [scope]
  );

  const pushUrl = useCallback(() => {
    const q = new URLSearchParams();
    q.set('scope', scope);
    q.set('range', String(range));
    if (highlight) q.set('highlight', highlight);
    router.replace(`/leaderboard?${q.toString()}`);
  }, [router, scope, range, highlight]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const q = new URLSearchParams();
      q.set('scope', scope === 'all' ? 'global' : 'game');
      q.set('range', String(range));
      const r = await fetch(`/api/leaderboard?${q.toString()}`, { cache: 'no-store' });
      const data: ApiResp = await r.json();
      if (!data.ok) {
        const e = (data as ApiErr).error ?? 'unknown';
        throw new Error(e);
      }
      const ordered = [...data.rows].sort(
        (a, b) => Number(b.score) - Number(a.score)
      );
      setRows(ordered);
    } catch (e) {
      const msg = e instanceof Error ? e.message : typeof e === 'string' ? e : 'unknown';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }, [scope, range]);

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="lb">
      <div className="lb__head">
        <h1 className="lb__title">
          Hall of Champions <span aria-hidden>🏰</span>
        </h1>
        <div className="lb__actions">
          <Link href="/" className="btn">
            <span className="icon">←</span> Return to Dungeon
          </Link>
        </div>
      </div>

      <section className="panel">
        <div className="filters">
          <div className="field">
            <label className="filter-label">Realm Scope: </label>
            <select
              value={scope}
              onChange={(e) => setScope((e.target.value as 'game' | 'all') ?? 'game')}
              className="dungeon-select"
            >
              <option value="game">This Dungeon</option>
              <option value="all">All Realms</option>
            </select>
          </div>

          <div className="field">
            <label className="filter-label">Time Span: </label>
            <input
              type="number"
              min={1000}
              step={1000}
              value={range}
              onChange={(e) => setRange(Math.max(1000, Number(e.target.value || 0)))}
              className="dungeon-input"
            />
          </div>

          <div className="field btns">
            <button
              className="btn refresh-btn"
              onClick={() => {
                pushUrl();
                void load();
              }}
              disabled={loading}
            >
              {loading ? (
                <span className="loading">
                  <span className="spinner">⌛</span> Consulting the Scrolls...
                </span>
              ) : (
                <>
                  <span className="icon">🔮</span> Update Records
                </>
              )}
            </button>
          </div>
        </div>

        <div className="meta">
          <span className="scope">{prettyScope}</span>
          <span className="sep">|</span>
          <span className="range">Last {range.toLocaleString('tr-TR')} Moons</span>
          {rows.length > 0 && (
            <>
              <span className="sep">|</span>
              <span className="count">{rows.length} Adventurers</span>
            </>
          )}
        </div>

        {err && (
          <div className="error">
            <span className="icon">💀</span> Failed to load: {err}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th className="colRank">Rank</th>
                <th className="colPlayer">Adventurer</th>
                <th className="colGold">Gold</th>
                <th className="colQuests">Quests</th>
                <th className="colAction">Profile</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !loading && !err && (
                <tr>
                  <td colSpan={5} className="empty">
                    The halls are empty... for now
                  </td>
                </tr>
              )}
              {rows.map((r, i) => {
                const addr = r.player.toLowerCase();
                const isMe = highlight && addr === highlight.toLowerCase();
                return (
                  <tr key={`${addr}-${i}`} className={isMe ? 'isMe' : ''}>
                    <td className="colRank">
                      <span className="rank-pill">{i + 1}</span>
                    </td>
                    <td className="colPlayer mono">
                      {r.username ? (
                        <b className="username">@{r.username}</b>
                      ) : (
                        <span className="address">{shorten(addr)}</span>
                      )}
                    </td>
                    <td className="colGold">
                      <b>{Number(r.score).toLocaleString('tr-TR')}</b>
                      <span className="coin">🪙</span>
                    </td>
                    <td className="colQuests">
                      {Number(r.transactions).toLocaleString('tr-TR')}
                      <span className="quest-icon">🗡️</span>
                    </td>
                    <td className="colAction">
                      <Link
                        href={`/profile?address=${addr}`}
                        className="btn profile-btn"
                        title="View Scroll"
                      >
                        <span className="icon">📜</span> Scroll
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <style jsx>{`
        .colRank {
          width: 80px;
          text-align: center;
          padding: 12px 8px !important;
        }

        .colPlayer {
          width: 220px;
          text-align: center;
          padding: 12px 8px !important;
        }

        .colGold {
          width: 120px;
          text-align: center;
          padding: 12px 8px !important;
        }

        .colQuests {
          width: 120px;
          text-align: center;
          padding: 12px 8px !important;
        }

        .colAction {
          width: 140px;
          text-align: center;
          padding: 12px 8px !important;
        }

        .lb {
          max-width: 1100px;
          margin: 0 auto;
          padding: 16px;
          background: url('/images/dungeon-bg.jpg') no-repeat center center fixed;
          background-size: cover;
          color: #e0d6ff;
        }

        .lb__head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .lb__title {
          margin: 0;
          font-size: 32px;
          font-weight: 800;
          font-family: 'MedievalSharp', cursive;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          background: linear-gradient(
            to right,
            #d4af37,
            #f9d423,
            #d4af37
          );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          letter-spacing: 1px;
        }

        .panel {
          background: rgba(20, 12, 36, 0.8);
          border: 1px solid #3a2a5f;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          backdrop-filter: blur(4px);
        }

        .filters {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          align-items: flex-end;
        }

        .filter-label {
          font-size: 12px;
          font-weight: 700;
          color: #b8a2e6;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 5px;
        }

        .dungeon-select,
        .dungeon-input {
          height: 40px;
          min-width: 180px;
          padding: 8px 12px;
          border: 1px solid #4a3a6a;
          border-radius: 6px;
          background: rgba(30, 20, 50, 0.7);
          color: #e0d6ff;
          font-weight: 600;
          font-family: 'MedievalSharp', cursive;
        }

        .dungeon-select {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23b8a2e6'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 10px center;
          background-size: 16px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(to bottom, #4a3a6a, #3a2a5a);
          color: #e0d6ff;
          border: 1px solid #5d4a7a;
          padding: 10px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
          font-family: 'MedievalSharp', cursive;
          text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
        }

        .btn:hover {
          background: linear-gradient(to bottom, #5d4a7a, #4a3a6a);
          transform: translateY(-1px);
        }

        .btn:active {
          transform: translateY(0);
        }

        .refresh-btn {
          background: linear-gradient(to bottom, #5a3a6a, #4a2a5a);
        }

        .refresh-btn:hover {
          background: linear-gradient(to bottom, #6a4a7a, #5a3a6a);
        }

        .profile-btn {
          padding: 6px 12px;
          font-size: 14px;
        }

        .icon {
          font-size: 16px;
        }

        .meta {
          margin-top: 15px;
          font-size: 13px;
          color: #b8a2e6;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sep {
          opacity: 0.6;
        }

        .scope {
          background: rgba(92, 28, 168, 0.3);
          color: #d4af37;
          padding: 4px 10px;
          border-radius: 999px;
          font-family: 'MedievalSharp', cursive;
        }

        .error {
          margin-top: 15px;
          padding: 12px;
          border-radius: 6px;
          background: rgba(168, 28, 56, 0.3);
          color: #ff9e9e;
          border: 1px solid rgba(244, 63, 94, 0.35);
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tableWrap {
          overflow: auto;
          border-radius: 6px;
        }

        .table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0 6px;
        }

        thead th {
          text-align: center;
          font-size: 13px;
          color: #d4af37;
          font-weight: 800;
          padding: 12px 8px;
          font-family: 'MedievalSharp', cursive;
          text-transform: uppercase;
          letter-spacing: 1px;
          background: rgba(58, 42, 95, 0.7);
          border-bottom: 2px solid #3a2a5f;
          vertical-align: middle;
        }

        tbody td {
          background: rgba(40, 30, 60, 0.7);
          color: #e0d6ff;
          font-weight: 600;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          vertical-align: middle;
        }

        tbody tr td:first-child {
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          border-top-left-radius: 6px;
          border-bottom-left-radius: 6px;
        }

        tbody tr td:last-child {
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          border-top-right-radius: 6px;
          border-bottom-right-radius: 6px;
        }

        .colRank {
          width: 80px;
          text-align: center;
        }

        .rank-pill {
          display: inline-block;
          width: 30px;
          height: 30px;
          line-height: 30px;
          border-radius: 50%;
          background: rgba(212, 175, 55, 0.2);
          color: #d4af37;
          font-weight: 800;
          text-align: center;
        }

        .player-cell {
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .username {
          color: #b8a2e6;
        }

        .address {
          color: #9f8fbf;
        }

        .score-cell,
        .tx-cell {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          font-family: 'MedievalSharp', cursive;
        }

        .coin,
        .quest-icon {
          font-size: 16px;
        }

        .colAction {
          width: 120px;
          text-align: center;
        }

        .empty {
          text-align: center;
          background: transparent;
          border: none;
          color: #7a6a9a;
          font-weight: 700;
          padding: 30px 0;
          font-style: italic;
        }

        .mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            'Courier New', monospace;
        }

        tr.isMe td {
          background: linear-gradient(
            90deg,
            rgba(92, 28, 168, 0.3),
            rgba(58, 42, 95, 0.6)
          );
          box-shadow: inset 0 0 0 1px rgba(212, 175, 55, 0.5);
        }

        .loading {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .colPlayer {
            width: 160px;
          }
          .colGold,
          .colQuests {
            width: 100px;
          }
          .colAction {
            width: 120px;
          }
        }

        @media (max-width: 576px) {
          .tableWrap {
            overflow-x: auto;
          }
          .colRank {
            width: 60px;
          }
          .colPlayer {
            width: 140px;
          }
          .colGold,
          .colQuests {
            width: 80px;
          }
          .colAction {
            width: 100px;
          }
          .profile-btn {
            padding: 4px 8px;
            font-size: 12px;
          }
        }

        @media (max-width: 768px) {
          .lb__head {
            flex-direction: column;
            align-items: flex-start;
          }

          .lb__actions {
            width: 100%;
          }

          .btn {
            width: 100%;
            justify-content: center;
          }

          .filters {
            flex-direction: column;
          }

          .field.btns {
            margin-left: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

function shorten(addr: string) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';
}