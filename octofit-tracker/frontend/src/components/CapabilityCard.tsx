import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Props = {
  title: string;
  description: string;
  endpoint: string;
  dataKey: string;
  emptyMessage: string;
};

type RequestState =
  | { status: 'loading' }
  | { status: 'success'; items: unknown[] }
  | { status: 'error'; message: string };

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(formatValue).join(', ');
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).map(([key, item]) => `${key}: ${formatValue(item)}`).join(', ');
  }
  return value == null ? '' : String(value);
}

export function CapabilityCard({ title, description, endpoint, dataKey, emptyMessage }: Props) {
  const [state, setState] = useState<RequestState>({ status: 'loading' });

  useEffect(() => {
    let active = true;

    getJson<Record<string, unknown>>(endpoint)
      .then((payload) => {
        const items = payload[dataKey];
        if (!Array.isArray(items)) throw new Error(`Invalid ${dataKey} response`);
        if (active) setState({ status: 'success', items });
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Unknown error';
        setState({ status: 'error', message });
      });

    return () => {
      active = false;
    };
  }, [dataKey, endpoint]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {state.status === 'loading' && <p role="status">Loading {title.toLowerCase()}...</p>}
        {state.status === 'error' && <p role="alert">Unable to load {title.toLowerCase()}: {state.message}</p>}
        {state.status === 'success' && state.items.length === 0 && <p>{emptyMessage}</p>}
        {state.status === 'success' && state.items.length > 0 && (
          <ul className="list-group">
            {state.items.map((item, index) => (
              <li className="list-group-item" key={index}>{formatValue(item)}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
