/**
 * Security utilities to help prevent HTTP request smuggling (CVE-2005-2088)
 * and other HTTP header-related vulnerabilities
 */

/**
 * Validates headers to prevent HTTP request smuggling
 * Rejects requests with both Content-Length and Transfer-Encoding
 * 
 * @param headers - Headers object, record or HeadersInit to validate
 * @returns boolean - true if headers are valid, false otherwise
 */
export function validateHeaders(headers: Headers | Record<string, string> | HeadersInit): boolean {
  let hasContentLength = false;
  let hasTransferEncoding = false;

  // Check if headers is a Headers object
  if (headers instanceof Headers) {
    hasContentLength = headers.has('content-length');
    hasTransferEncoding = headers.has('transfer-encoding');
  } 
  // Check if headers is an array of [key, value] pairs
  else if (Array.isArray(headers)) {
    for (const [key, _] of headers) {
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'content-length') hasContentLength = true;
      if (lowerKey === 'transfer-encoding') hasTransferEncoding = true;
    }
  }
  // Check if headers is a plain object
  else {
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
 * Validates URL paths to prevent path traversal attacks
 * Rejects requests with directory traversal sequences like "../"
 * 
 * @param url - URL string or URL object to validate
 * @returns boolean - true if URL is valid, false if it contains path traversal attempts
 */
export function validateUrlPath(url: string | URL): boolean {
  let path: string;
  
  if (url instanceof URL) {
    path = url.pathname;
  } else if (typeof url === 'string') {
    try {
      // Try to parse as full URL first
      const parsedUrl = new URL(url);
      path = parsedUrl.pathname;
    } catch {
      // If parsing fails, assume it's just a path
      path = url;
    }
  } else {
    console.error('Invalid URL type provided');
    return false;
  }
  
  // Check for path traversal sequences
  const hasTraversal = path.includes('../') || 
                       path.includes('..\\') || 
                       path.includes('/..');
                       
  if (hasTraversal) {
    console.error('Security warning: Path traversal attempt detected');
    return false;
  }
  
  return true;
}

/**
 * Checks if a URL path points to a potentially sensitive file
 * 
 * @param url - URL string or URL object to validate
 * @returns boolean - true if the URL is safe, false if it points to a sensitive file
 */
export function validateSensitiveFileAccess(url: string | URL): boolean {
  let path: string;
  
  if (url instanceof URL) {
    path = url.pathname.toLowerCase();
  } else if (typeof url === 'string') {
    try {
      // Try to parse as full URL first
      const parsedUrl = new URL(url);
      path = parsedUrl.pathname.toLowerCase();
    } catch {
      // If parsing fails, assume it's just a path
      path = url.toLowerCase();
    }
  } else {
    console.error('Invalid URL type provided');
    return false;
  }
  
  // Detect attempts to access configuration or other sensitive files
  const sensitivePatterns = [
    '/includes/global.inc',
    '/config.',
    '.env',
    '.ini', 
    '.conf',
    '.config',
    '.json',
    '/includes/',
    '/config/',
    '/settings/'
  ];
  
  for (const pattern of sensitivePatterns) {
    if (path.includes(pattern)) {
      console.error(`Security warning: Attempt to access sensitive file detected: ${path}`);
      return false;
    }
  }
  
  return true;
}

/**
 * Validates IP addresses to prevent portmapper redirection attacks
 * Rejects requests that appear to be redirected or spoofed
 * 
 * @param ip - IP address to validate
 * @param headers - Request headers to check for proxy indicators
 * @returns boolean - true if the IP source seems legitimate, false if it might be spoofed
 */
export function validateIPSource(ip: string, headers?: Headers | Record<string, string>): boolean {
  // Check if the IP is a loopback/localhost address
  const isLocalhost = ip === '127.0.0.1' || ip === '::1' || ip === 'localhost';
  
  // If this is a localhost request, check if there are proxy headers
  // that might indicate the request is actually being forwarded
  if (isLocalhost && headers) {
    const proxyHeaders = [
      'x-forwarded-for',
      'forwarded',
      'x-real-ip',
      'x-client-ip',
      'via',
      'proxy-connection'
    ];
    
    let hasProxyHeaders = false;
    
    // Check headers object
    if (headers instanceof Headers) {
      for (const header of proxyHeaders) {
        if (headers.has(header)) {
          hasProxyHeaders = true;
          break;
        }
      }
    } 
    // Check record/object of headers
    else if (typeof headers === 'object' && headers !== null) {
      const headerKeys = Object.keys(headers).map(k => k.toLowerCase());
      hasProxyHeaders = proxyHeaders.some(h => headerKeys.includes(h.toLowerCase()));
    }
    
    if (hasProxyHeaders) {
      console.error('Security warning: Localhost request contains proxy headers - possible portmapper redirection attack');
      return false;
    }
  }
  
  // Check if this is a private IP making external requests
  // This could indicate a NAT traversal or other bypass attempt
  const isPrivateIP = (
    /^10\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/.test(ip) || // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\.([0-9]{1,3})\.([0-9]{1,3})$/.test(ip) || // 172.16.0.0/12
    /^192\.168\.([0-9]{1,3})\.([0-9]{1,3})$/.test(ip) // 192.168.0.0/16
  );
  
  // Additional checks could be implemented here based on specific threat models
  
  return true; // Allow by default, specific implementations can use this function for targeted checks
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
 * Creates a secure fetch function that validates headers and URLs
 * 
 * @returns Function - A wrapped fetch function that validates headers and URLs
 */
export function createSecureFetch(): typeof fetch {
  return (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : input;
    
    // Validate URL to prevent path traversal
    if (!validateUrlPath(url)) {
      return Promise.reject(new Error("Path traversal attempt detected"));
    }
    
    // Validate access to sensitive files
    if (!validateSensitiveFileAccess(url)) {
      return Promise.reject(new Error("Access to sensitive file denied"));
    }
    
    const secureInit = secureRequestInit(init);
    return fetch(input, secureInit);
  };
}

/**
 * Verifies that a request is not being proxied or redirected through a portmapper
 * Can be used in server-side environments to protect against NFS mount bypasses and similar attacks
 * 
 * @param request - Request object to validate
 * @param clientIP - IP address of the client
 * @returns boolean - true if the request appears legitimate, false if it might be redirected
 */
export function verifyRequestOrigin(request: Request, clientIP: string): boolean {
  // Get the host being requested
  const host = request.headers.get('host');
  
  // Verify the client IP
  if (!validateIPSource(clientIP, request.headers)) {
    return false;
  }
  
  // Check for suspicious host/origin combinations that might indicate port forwarding
  const origin = request.headers.get('origin');
  if (origin && host) {
    try {
      const originHost = new URL(origin).hostname;
      if (originHost !== host && !['localhost', '127.0.0.1', '::1'].includes(originHost)) {
        console.error(`Security warning: Mismatched origin (${origin}) and host (${host})`);
        return false;
      }
    } catch (e) {
      console.error('Security warning: Invalid origin header', e);
      return false;
    }
  }
  
  // Check for RPC-specific headers or ports that might indicate portmapper abuse
  const url = new URL(request.url);
  const suspiciousRPCPorts = [111, 2049, 4045]; // portmapper, NFS, lockd
  if (suspiciousRPCPorts.includes(parseInt(url.port))) {
    console.error(`Security warning: Request to sensitive RPC port ${url.port}`);
    return false;
  }
  
  return true;
}

// Export a pre-configured secure fetch function
export const secureFetch = createSecureFetch();
