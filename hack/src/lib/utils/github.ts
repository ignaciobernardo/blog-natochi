interface ProxiedRequestOptions {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export async function fetchViaProxy(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const proxyUrl = process.env.GITHUB_PROXY_URL;

  if (!proxyUrl) {
    return fetch(url, options);
  }

  const proxiedRequest: ProxiedRequestOptions = {
    method: options.method || 'GET',
    url,
    headers: options.headers as Record<string, string>,
  };

  if (options.body) {
    proxiedRequest.body =
      typeof options.body === 'string'
        ? JSON.parse(options.body)
        : options.body;
  }

  const proxyResponse = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(proxiedRequest),
  });

  if (!proxyResponse.ok) {
    throw new Error(
      `Proxy request failed: ${proxyResponse.status} ${proxyResponse.statusText}`,
    );
  }

  return proxyResponse;
}

export interface GitHubFork {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
  html_url: string;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      date: string;
    };
    message: string;
  };
  author?: {
    login: string;
  } | null;
  committer?: {
    login: string;
  } | null;
}

export async function getRepoForks(
  owner: string,
  repo: string,
): Promise<GitHubFork[]> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is not set');
  }

  const allForks: GitHubFork[] = [];
  let page = 1;
  const perPage = 100; // Max allowed by GitHub API

  while (true) {
    const url = `https://api.github.com/repos/${owner}/${repo}/forks?per_page=${perPage}&page=${page}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch forks: ${response.status} ${response.statusText}`,
      );
    }

    const forks: GitHubFork[] = await response.json();

    if (forks.length === 0) {
      break;
    }

    allForks.push(...forks);

    // If we got fewer forks than requested, we're on the last page
    if (forks.length < perPage) {
      break;
    }

    page++;
  }

  return allForks;
}

export async function getRepoCommits(
  owner: string,
  repo: string,
  branch = 'main',
): Promise<GitHubCommit[]> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is not set');
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch commits: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

export async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  ref?: string,
): Promise<string | null> {
  const token = process.env.GITHUB_TOKEN;
  const url = ref
    ? `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`
    : `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch file content: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();

  if (data.type !== 'file' || !data.content) {
    return null;
  }

  return Buffer.from(data.content, 'base64').toString('utf-8');
}

export async function getFileBase64(
  owner: string,
  repo: string,
  path: string,
  ref?: string,
): Promise<string | null> {
  const token = process.env.GITHUB_TOKEN;
  const url = ref
    ? `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`
    : `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch file: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();

  if (data.type !== 'file') {
    return null;
  }

  // If content is present, return it directly (files < 1 MB)
  if (data.content) {
    return data.content.replace(/\n/g, '');
  }

  // For files > 1 MB, use the Blob API
  if (data.sha) {
    const blobUrl = `https://api.github.com/repos/${owner}/${repo}/git/blobs/${data.sha}`;
    const blobResponse = await fetch(blobUrl, { headers });

    if (!blobResponse.ok) {
      throw new Error(
        `Failed to fetch blob: ${blobResponse.status} ${blobResponse.statusText}`,
      );
    }

    const blobData = await blobResponse.json();
    if (blobData.content) {
      return blobData.content.replace(/\n/g, '');
    }
  }

  return null;
}
