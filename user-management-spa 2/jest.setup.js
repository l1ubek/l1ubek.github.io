import "@testing-library/jest-dom";

// Mock environment variables
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-purposes";

// Mock Headers
global.Headers = class Headers {
  constructor(init = {}) {
    this._headers = {};
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.set(key, value);
      });
    }
  }
  get(name) {
    return this._headers[name.toLowerCase()] || null;
  }
  set(name, value) {
    this._headers[name.toLowerCase()] = value;
  }
  has(name) {
    return this._headers[name.toLowerCase()] !== undefined;
  }
};

// Mock Request
global.Request = class Request {
  constructor(input, init) {
    this.url = input;
    this.method = init?.method || "GET";
    this.headers = new Headers(init?.headers);
    this.body = init?.body;
  }
};

// Mock Response
global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || "";
    this.headers = new Headers(init.headers);
    this._bodyInit = body;
  }
  json() {
    try {
      return Promise.resolve(JSON.parse(this._bodyInit || "{}"));
    } catch {
      return Promise.resolve({});
    }
  }
  text() {
    return Promise.resolve(this._bodyInit || "");
  }
};

// Mock NextResponse (!!! ГОЛОВНЕ ДЛЯ ТВОЄЇ ПОМИЛКИ !!!)
jest.mock("next/server", () => {
  // Залишаємо можливість розширити мок при потребі
  return {
    NextResponse: {
      json: (data, init = {}) => {
        // Повертаємо об'єкт, схожий на Response
        return new global.Response(JSON.stringify(data), {
          status: init.status || 200,
          headers: { "Content-Type": "application/json", ...(init.headers || {}) },
        });
      },
    },
  };
});

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};
