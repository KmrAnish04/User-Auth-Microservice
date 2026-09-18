/**
 * Load Testing Script for SSO Auth Microservice
 * Tool: k6 (https://k6.io/)
 * 
 * Install k6:
 * - Windows: choco install k6  OR  winget install k6
 * - Mac: brew install k6
 * - Linux: snap install k6
 * 
 * Run tests:
 * k6 run load_test.js                          # Default (smoke test)
 * k6 run --env TEST=load load_test.js          # Load test
 * k6 run --env TEST=stress load_test.js        # Stress test
 * k6 run --env TEST=spike load_test.js         # Spike test
 * k6 run --env TEST=soak load_test.js          # Soak test
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ============================================
// CONFIGURATION
// ============================================

const BASE_URL = __ENV.BASE_URL || 'http://52.4.118.129:3000';

// Custom metrics
const errorRate = new Rate('errors');
const healthCheckDuration = new Trend('health_check_duration');
const metricsCheckDuration = new Trend('metrics_check_duration');
const totalRequests = new Counter('total_requests');

// ============================================
// TEST SCENARIOS
// ============================================

const scenarios = {
  // 1. SMOKE TEST - Minimal load to verify system works
  smoke: {
    executor: 'constant-vus',
    vus: 1,
    duration: '1m',
  },

  // 2. LOAD TEST - Normal expected load
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 10 },  // Ramp up to 10 users
      { duration: '5m', target: 10 },  // Stay at 10 users
      { duration: '2m', target: 20 },  // Ramp up to 20 users
      { duration: '5m', target: 20 },  // Stay at 20 users
      { duration: '2m', target: 0 },   // Ramp down to 0
    ],
  },

  // 3. STRESS TEST - Push beyond normal capacity
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 20 },   // Ramp to normal load
      { duration: '5m', target: 20 },   // Stay at normal
      { duration: '2m', target: 50 },   // Ramp to high load
      { duration: '5m', target: 50 },   // Stay at high
      { duration: '2m', target: 100 },  // Ramp to stress
      { duration: '5m', target: 100 },  // Stay at stress
      { duration: '5m', target: 0 },    // Recover
    ],
  },

  // 4. SPIKE TEST - Sudden traffic surge
  spike: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '10s', target: 5 },    // Normal load
      { duration: '1m', target: 5 },     // Stay normal
      { duration: '10s', target: 100 },  // SPIKE!
      { duration: '3m', target: 100 },   // Stay at spike
      { duration: '10s', target: 5 },    // Drop back
      { duration: '3m', target: 5 },     // Recover
      { duration: '10s', target: 0 },    // Stop
    ],
  },

  // 5. SOAK TEST - Extended duration at moderate load
  soak: {
    executor: 'constant-vus',
    vus: 20,
    duration: '30m',  // Run for 30 minutes
  },

  // 6. BREAKPOINT TEST - Find system limits
  breakpoint: {
    executor: 'ramping-arrival-rate',
    startRate: 10,
    timeUnit: '1s',
    preAllocatedVUs: 500,
    maxVUs: 1000,
    stages: [
      { duration: '2m', target: 10 },    // 10 req/s
      { duration: '2m', target: 50 },    // 50 req/s
      { duration: '2m', target: 100 },   // 100 req/s
      { duration: '2m', target: 200 },   // 200 req/s
      { duration: '2m', target: 400 },   // 400 req/s
      { duration: '2m', target: 800 },   // 800 req/s - breaking point?
    ],
  },
};

// Select test type from environment variable
const testType = __ENV.TEST || 'smoke';

export const options = {
  scenarios: {
    [testType]: scenarios[testType],
  },
  thresholds: {
    // HTTP errors should be less than 1%
    'http_req_failed': ['rate<0.01'],
    
    // 95% of requests should complete within 2 seconds
    'http_req_duration': ['p(95)<2000'],
    
    // Health check should respond within 500ms
    'health_check_duration': ['p(95)<500'],
    
    // Error rate threshold
    'errors': ['rate<0.05'],
  },
};

// ============================================
// TEST SCENARIOS
// ============================================

export default function () {
  totalRequests.add(1);

  // Test 1: Health Check
  testHealthEndpoint();

  // Test 2: Metrics Endpoint
  testMetricsEndpoint();

  // Test 3: Root endpoint (404 expected)
  testRootEndpoint();

  // Test 4: Non-existent endpoint (404)
  testNotFoundEndpoint();

  // Random sleep between 1-3 seconds (simulates user think time)
  sleep(Math.random() * 2 + 1);
}

// ============================================
// TEST FUNCTIONS
// ============================================

function testHealthEndpoint() {
  const res = http.get(`${BASE_URL}/api/v1/health`);
  
  const success = check(res, {
    'health check status is 200': (r) => r.status === 200,
    'health check has success field': (r) => JSON.parse(r.body).success === true,
    'health check responds quickly': (r) => r.timings.duration < 1000,
  });

  healthCheckDuration.add(res.timings.duration);
  errorRate.add(!success);

  if (!success) {
    console.error(`Health check failed: ${res.status} - ${res.body}`);
  }
}

function testMetricsEndpoint() {
  const res = http.get(`${BASE_URL}/api/v1/metrics`);
  
  const success = check(res, {
    'metrics endpoint status is 200': (r) => r.status === 200,
    'metrics endpoint returns text': (r) => r.body.includes('http_requests_total'),
    'metrics endpoint responds quickly': (r) => r.timings.duration < 1000,
  });

  metricsCheckDuration.add(res.timings.duration);
  errorRate.add(!success);
}

function testRootEndpoint() {
  const res = http.get(`${BASE_URL}/`);
  
  check(res, {
    'root endpoint handles request': (r) => r.status >= 200 && r.status < 500,
  });
}

function testNotFoundEndpoint() {
  const res = http.get(`${BASE_URL}/api/v1/nonexistent`);
  
  check(res, {
    'non-existent endpoint returns 404': (r) => r.status === 404,
  });
}

// ============================================
// LIFECYCLE HOOKS
// ============================================

export function setup() {
  console.log(`Starting ${testType} test against ${BASE_URL}`);
  console.log('Warming up...');
  
  // Warmup request
  const res = http.get(`${BASE_URL}/api/v1/health`);
  
  if (res.status !== 200) {
    console.error('❌ Health check failed during setup!');
    console.error(`Status: ${res.status}`);
    console.error(`Body: ${res.body}`);
    throw new Error('Service is not healthy - aborting test');
  }
  
  console.log('✅ Service is healthy - starting test');
  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Test completed in ${duration.toFixed(2)} seconds`);
}

// ============================================
// CUSTOM SUMMARY
// ============================================

export function handleSummary(data) {
  console.log('\n📊 TEST SUMMARY\n');
  console.log(`Test Type: ${testType.toUpperCase()}`);
  console.log(`Duration: ${data.state.testRunDurationMs / 1000}s`);
  console.log(`Total Requests: ${data.metrics.total_requests.values.count}`);
  console.log(`Failed Requests: ${data.metrics.http_req_failed.values.passes || 0}`);
  console.log(`Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)} req/s`);
  console.log(`Avg Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`);
  console.log(`P95 Response Time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`Error Rate: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%`);

  return {
    'stdout': JSON.stringify(data, null, 2),
    'summary.json': JSON.stringify(data, null, 2),
  };
}
