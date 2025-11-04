/**
 * Utility functions for handling retries and error recovery
 */

// Default retry configuration
const DEFAULT_RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
  retryCondition: (error) => {
    // Retry on network errors, 5xx server errors, and rate limiting
    if (!error.response) return true; // Network error
    const status = error.response.status;
    return status >= 500 || status === 429; // Server error or rate limit
  }
};

/**
 * Exponential backoff delay calculation
 * @param {number} attempt - Current attempt number (0-based)
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {number} backoffFactor - Multiplier for each attempt
 * @param {number} maxDelay - Maximum delay in milliseconds
 * @returns {number} Delay in milliseconds
 */
export const calculateDelay = (attempt, baseDelay = 1000, backoffFactor = 2, maxDelay = 10000) => {
  const delay = baseDelay * Math.pow(backoffFactor, attempt);
  return Math.min(delay, maxDelay);
};

/**
 * Add jitter to delay to prevent thundering herd
 * @param {number} delay - Base delay in milliseconds
 * @param {number} jitterFactor - Jitter factor (0-1)
 * @returns {number} Delay with jitter
 */
export const addJitter = (delay, jitterFactor = 0.1) => {
  const jitter = delay * jitterFactor * Math.random();
  return delay + jitter;
};

/**
 * Sleep for specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry an async operation with exponential backoff
 * @param {Function} operation - Async function to retry
 * @param {Object} config - Retry configuration
 * @returns {Promise} Promise that resolves with operation result
 */
export const retryWithBackoff = async (operation, config = {}) => {
  const {
    maxAttempts,
    baseDelay,
    maxDelay,
    backoffFactor,
    retryCondition
  } = { ...DEFAULT_RETRY_CONFIG, ...config };

  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      lastError = error;

      // Don't retry if this is the last attempt
      if (attempt === maxAttempts - 1) {
        break;
      }

      // Check if we should retry this error
      if (!retryCondition(error)) {
        break;
      }

      // Calculate delay with jitter
      const delay = calculateDelay(attempt, baseDelay, backoffFactor, maxDelay);
      const delayWithJitter = addJitter(delay);

      console.warn(`Operation failed (attempt ${attempt + 1}/${maxAttempts}), retrying in ${Math.round(delayWithJitter)}ms:`, error.message);

      await sleep(delayWithJitter);
    }
  }

  throw lastError;
};

/**
 * Create a retry wrapper for a function
 * @param {Function} fn - Function to wrap with retry logic
 * @param {Object} config - Retry configuration
 * @returns {Function} Wrapped function with retry logic
 */
export const createRetryWrapper = (fn, config = {}) => {
  return async (...args) => {
    return retryWithBackoff(() => fn(...args), config);
  };
};

/**
 * Retry configuration for different types of operations
 */
export const RETRY_CONFIGS = {
  // Quick operations (search, user actions)
  QUICK: {
    maxAttempts: 2,
    baseDelay: 500,
    maxDelay: 2000,
    backoffFactor: 2
  },

  // Standard API calls
  STANDARD: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffFactor: 2
  },

  // Critical operations (save playlist, authentication)
  CRITICAL: {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 1.5
  },

  // Background operations (analytics, logging)
  BACKGROUND: {
    maxAttempts: 3,
    baseDelay: 2000,
    maxDelay: 30000,
    backoffFactor: 3
  }
};

/**
 * Enhanced error class with retry information
 */
export class RetryableError extends Error {
  constructor(message, originalError, attempts = 0, isRetryable = true) {
    super(message);
    this.name = 'RetryableError';
    this.originalError = originalError;
    this.attempts = attempts;
    this.isRetryable = isRetryable;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Circuit breaker pattern for preventing cascading failures
 */
export class CircuitBreaker {
  constructor(config = {}) {
    this.failureThreshold = config.failureThreshold || 5;
    this.resetTimeout = config.resetTimeout || 60000; // 1 minute
    this.monitoringPeriod = config.monitoringPeriod || 10000; // 10 seconds
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN - operation not allowed');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = 'CLOSED';
      }
    }
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}

const retryUtilsDefault = {
  retryWithBackoff,
  createRetryWrapper,
  RETRY_CONFIGS,
  RetryableError,
  CircuitBreaker,
  calculateDelay,
  addJitter,
  sleep
};

export default retryUtilsDefault;