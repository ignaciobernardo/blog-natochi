export const ARCADE_STORAGE_REQUEST_MESSAGE = 'arcade:storage-request';
export const ARCADE_STORAGE_RESPONSE_MESSAGE = 'arcade:storage-response';
export const ARCADE_STORAGE_KEY_PREFIX = 'platanus:arcade-storage:v1';
export const ARCADE_STORAGE_MAX_PAYLOAD_BYTES = 64 * 1024;
export const ARCADE_STORAGE_KEY_PATTERN = /^[A-Za-z0-9._:/-]{1,128}$/;

export type ArcadeStorageJson =
  | null
  | boolean
  | number
  | string
  | ArcadeStorageJson[]
  | {
      [key: string]: ArcadeStorageJson;
    };

export type ArcadeStorageMethod =
  | 'storage:get'
  | 'storage:set'
  | 'storage:remove';

export type ArcadeStorageRequestMessage = {
  type: typeof ARCADE_STORAGE_REQUEST_MESSAGE;
  requestId: string;
  method: ArcadeStorageMethod;
  key: string;
  value?: ArcadeStorageJson;
};

export type ArcadeStorageResponseMessage = {
  type: typeof ARCADE_STORAGE_RESPONSE_MESSAGE;
  requestId: string;
  method: ArcadeStorageMethod;
  ok: boolean;
  found?: boolean;
  value?: ArcadeStorageJson;
  error?: string;
};

type ArcadeStorageNamespaceInput = {
  challengeId: string;
  gameId: string;
  key: string;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function getSerializedPayloadSize(value: unknown): number | null {
  try {
    const serialized = JSON.stringify(value);
    if (typeof serialized !== 'string') {
      return null;
    }

    return new TextEncoder().encode(serialized).length;
  } catch {
    return null;
  }
}

function isFiniteJsonNumber(value: number) {
  return Number.isFinite(value);
}

export function isArcadeStorageJson(
  value: unknown,
  depth: number = 0,
): value is ArcadeStorageJson {
  if (depth > 32) {
    return false;
  }

  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'string'
  ) {
    return true;
  }

  if (typeof value === 'number') {
    return isFiniteJsonNumber(value);
  }

  if (Array.isArray(value)) {
    return value.every((item) => isArcadeStorageJson(item, depth + 1));
  }

  if (!isPlainObject(value)) {
    return false;
  }

  return Object.values(value).every((item) =>
    isArcadeStorageJson(item, depth + 1),
  );
}

export function isValidArcadeStorageKey(key: unknown): key is string {
  return typeof key === 'string' && ARCADE_STORAGE_KEY_PATTERN.test(key);
}

export function isValidArcadeStoragePayloadSize(value: unknown): boolean {
  const size = getSerializedPayloadSize(value);
  return size !== null && size <= ARCADE_STORAGE_MAX_PAYLOAD_BYTES;
}

export function getArcadeStorageNamespaceKey({
  challengeId,
  gameId,
  key,
}: ArcadeStorageNamespaceInput): string {
  return [ARCADE_STORAGE_KEY_PREFIX, challengeId, gameId, key].join(':');
}

export function parseArcadeStorageRequestMessage(
  value: unknown,
): ArcadeStorageRequestMessage | null {
  if (!isPlainObject(value) || !isValidArcadeStoragePayloadSize(value)) {
    return null;
  }

  const { type, requestId, method, key, value: payload } = value;

  if (
    type !== ARCADE_STORAGE_REQUEST_MESSAGE ||
    typeof requestId !== 'string' ||
    requestId.length === 0 ||
    requestId.length > 128 ||
    (method !== 'storage:get' &&
      method !== 'storage:set' &&
      method !== 'storage:remove') ||
    !isValidArcadeStorageKey(key)
  ) {
    return null;
  }

  if (method === 'storage:set' && !isArcadeStorageJson(payload)) {
    return null;
  }

  if (method !== 'storage:set' && payload !== undefined) {
    return null;
  }

  const requestValue =
    method === 'storage:set' ? (payload as ArcadeStorageJson) : undefined;

  return {
    type,
    requestId,
    method,
    key,
    value: requestValue,
  };
}

export function createArcadeStorageResponseMessage(
  response: ArcadeStorageResponseMessage,
): ArcadeStorageResponseMessage {
  return response;
}
