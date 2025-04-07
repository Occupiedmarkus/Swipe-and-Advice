
/**
 * Security utilities to help prevent HTTP request smuggling (CVE-2005-2088)
 * and other HTTP header-related vulnerabilities
 */

/**
 * Validates headers to prevent HTTP request smuggling
 * Rejects requests with both Content-Length and Transfer-Encoding
 * 
 * @param headers - Headers object or record to validate
 * @returns boolean - true if headers are valid, false otherwise
 */
export function validateHeaders(headers: Headers | Record<string, string>): boolean {
  let hasContentLength = false;
  let hasTransferEncoding = false;

  // Check if headers is a Headers object or a plain object
  if (headers instanceof Headers) {
    hasContentLength = headers.has('content-length');
    hasTransferEncoding = headers.has('transfer-encoding');
  } else {
    // Convert headers to lowercase for case-insensitive comparison
    const headerKeys = Object.keys(headers).map(key => key.toLowerCase());
    hasContentLength = headerKeys.includes('content-length');
    hasTransferEncoding = headerKeys.includes('transfer-encoding');
  }

  // Reject requests with both Content-Length and Transfer-Encoding
  if (hasContentLength && hasTransferEncoding) {
    console.error('Security warning: Request contained both Content-Length and Transfer-Encoding headers');
    return false;
  }

  return true;
}

/**
 * Applies security headers to a fetch request
 * 
 * @param init - RequestInit object
 * @returns RequestInit - Modified RequestInit with validated headers
 */
export function secureRequestInit(init?: RequestInit): RequestInit {
  const secureInit: RequestInit = init || {};
  
  if (!secureInit.headers) {
    return secureInit;
  }
  
  // Validate headers
  if (!validateHeaders(secureInit.headers)) {
    throw new Error("Invalid request headers detected");
  }
  
  return secureInit;
}

/**
 * Creates a secure fetch function that validates headers
 * 
 * @returns Function - A wrapped fetch function that validates headers
 */
export function createSecureFetch(): typeof fetch {
  return (input: RequestInfo | URL, init?: RequestInit) => {
    const secureInit = secureRequestInit(init);
    return fetch(input, secureInit);
  };
}

// Export a pre-configured secure fetch function
export const secureFetch = createSecureFetch();
