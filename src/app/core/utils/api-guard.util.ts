import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export function parseValidId(rawId: unknown): number | null {
  if (rawId === null || rawId === undefined || rawId === '') {
    return null;
  }
  const parsed = Number(rawId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export function requireValidId(rawId: unknown, entityName = 'entidade'): number {
  const validId = parseValidId(rawId);
  if (validId === null) {
    throw new Error(`ID inválido para ${entityName}: ${String(rawId)}`);
  }
  return validId;
}

export function safeListResponse<T>(): (source: Observable<T[] | null | undefined>) => Observable<T[]> {
  return (source$) =>
    source$.pipe(
      map((res) => (Array.isArray(res) ? res : [])),
      catchError(() => of([]))
    );
}

export function safeSingleResponse<T>(fallback: T | null = null): (source: Observable<T | null | undefined>) => Observable<T | null> {
  return (source$) =>
    source$.pipe(
      map((res) => (res ?? fallback)),
      catchError((err) => {
        if (err?.status === 404 || err?.silentNotFound) {
          return of(fallback);
        }
        return throwError(() => err);
      })
    );
}