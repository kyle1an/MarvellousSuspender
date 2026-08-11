// @ts-check

const ATLASSIAN_ISSUE_CACHE_PREFIX = '__atlassian_favicon__/issue';
const JIRA_ISSUE_KEY_PATTERN = /^[A-Z][A-Z0-9]+-\d+$/i;
const REMOTE_SOURCE_TIMEOUT_MS = 5000;

export const CHROME_STYLE_FALLBACK_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABJUlEQVR42mKgOogpKJBMTM08kJCS+RXAJ1UbVBRDUWQIRmACWmwEpHxuN8GpkRIdAOuRfehwnQDXe7696C+eJkdvoox+ceEd/7DWFZyUcinO6JNBf3FOP/z+HGXirkX0hzXs8YJbG78ZvHp2dtaP/3E+Owqwcv1aJLDGSl8Ap6kY7JDmcjfK6UklaDvR4iBfy/Zq+19cyCETqF7AdAiilF6RGbYV0hFWOm9dbyYBiu0QIBcK85XLm090guoDGI3AUPiOM3HJrtbhKs8XBvh7k4mO+DkNMWC0CL6saS5D1Q0IERcRrBKdVy729Ti0apaojlEFHvI1k+Q03t6HESOeMUbjILUJCpo0bK8C7DxI9ezFMtibDuiLQY8oDJn/h5yUKctM1AYAkF4mBkXjJukAAAAASUVORK5CYII=';

/**
 * @param {string | URL | undefined} url
 * @returns {URL | undefined}
 */
function parseUrl(url) {
  if (!url) return;
  try {
    return new URL(url);
  }
  catch (error) { /* Invalid URLs have no fork-specific favicon rules. */ }
}

/**
 * @param {string} hostname
 * @returns {boolean}
 */
function isAtlassianHostname(hostname) {
  return hostname === 'atlassian.net' || hostname.endsWith('.atlassian.net');
}

/**
 * @param {URL} url
 * @returns {string | undefined}
 */
function getJiraIssueKey(url) {
  for (const parameter of ['selectedIssue', 'issueKey']) {
    const issueKey = url.searchParams.get(parameter);
    if (issueKey && JIRA_ISSUE_KEY_PATTERN.test(issueKey)) {
      return issueKey.toUpperCase();
    }
  }

  const pathMatch = url.pathname.match(/(?:^|\/)([A-Z][A-Z0-9]+-\d+)(?:\/|$)/i);
  return pathMatch?.[1].toUpperCase();
}

/**
 * @param {URL | undefined} url
 * @returns {boolean}
 */
function isGoogleFaviconServiceUrl(url) {
  return Boolean(
    url &&
    (
      (url.hostname === 'www.google.com' && url.pathname === '/s2/favicons') ||
      (url.hostname.endsWith('.gstatic.com') && url.pathname === '/faviconV2')
    )
  );
}

/**
 * @param {string} imageUrl
 * @returns {Promise<string>}
 */
async function fetchImageAsDataUrl(imageUrl) {
  const response = await fetch(imageUrl, {
    signal: AbortSignal.timeout(REMOTE_SOURCE_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch favicon image ${response.status} ${imageUrl}`);
  }

  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error(`Failed to read favicon image ${imageUrl}`));
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error(`Failed to read favicon image ${imageUrl}`));
    };
    reader.readAsDataURL(blob);
  });
}

export const faviconResolutionRules = {
  /**
   * @param {string} pageUrl
   * @param {string} defaultCacheKey
   * @returns {string | undefined}
   */
  getCacheKey(pageUrl, defaultCacheKey) {
    const parsedPageUrl = parseUrl(pageUrl);
    if (parsedPageUrl && isAtlassianHostname(parsedPageUrl.hostname)) {
      const issueKey = getJiraIssueKey(parsedPageUrl);
      if (issueKey) {
        return `${parsedPageUrl.hostname}/${ATLASSIAN_ISSUE_CACHE_PREFIX}/${issueKey}`;
      }
    }
    return defaultCacheKey || undefined;
  },

  /**
   * @param {string} pageUrl
   * @param {string | undefined} sourceUrl
   * @param {{ cacheOnly?: boolean, recursive?: boolean }} [options]
   * @returns {{
   *   preferSource: boolean,
   *   readStored: boolean,
   *   retryRoot: boolean,
   * }}
   */
  getResolutionPlan(pageUrl, sourceUrl, options = {}) {
    const parsedPageUrl = parseUrl(pageUrl);
    const issueKey = parsedPageUrl && isAtlassianHostname(parsedPageUrl.hostname)
      ? getJiraIssueKey(parsedPageUrl)
      : undefined;
    const hasSource = Boolean(sourceUrl);
    const cacheOnly = options.cacheOnly ?? false;
    const recursive = options.recursive ?? false;
    return {
      preferSource: Boolean(issueKey && hasSource && !cacheOnly),
      readStored: cacheOnly || hasSource || recursive,
      retryRoot:
        !cacheOnly &&
        !recursive &&
        parsedPageUrl?.hostname === 'www.youtube.com' &&
        parsedPageUrl.pathname === '/watch',
    };
  },

  /**
   * @param {string | undefined} sourceUrl
   * @returns {boolean}
   */
  shouldNormalizeRemoteSource(sourceUrl) {
    const parsedSourceUrl = parseUrl(sourceUrl);
    return Boolean(
      parsedSourceUrl &&
      (
        isAtlassianHostname(parsedSourceUrl.hostname) ||
        isGoogleFaviconServiceUrl(parsedSourceUrl)
      )
    );
  },

  /**
   * @param {string} sourceUrl
   * @returns {Promise<string>}
   */
  async getLoadableSource(sourceUrl) {
    if (!faviconResolutionRules.shouldNormalizeRemoteSource(sourceUrl)) {
      return sourceUrl;
    }
    return fetchImageAsDataUrl(sourceUrl);
  },

  /**
   * @param {string | undefined} pageUrl
   * @param {string | undefined} sourceUrl
   * @returns {boolean}
   */
  shouldEmbedSource(pageUrl, sourceUrl) {
    const parsedPageUrl = parseUrl(pageUrl);
    return Boolean(
      parsedPageUrl &&
      isAtlassianHostname(parsedPageUrl.hostname) &&
      faviconResolutionRules.shouldNormalizeRemoteSource(sourceUrl)
    );
  },
};
