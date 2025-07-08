import {
  includeObjectSync,
  excludeObjectSync,
  objectContainedLogSync,
  getItemByPathSync,
} from './object-util';
import { PathTree, pathsToPathTree } from '../reflected';

describe('includeObjectSync', () => {
  it('should include only specified paths from object', () => {
    const obj = {
      name: 'John',
      email: 'john@example.com',
      profile: {
        age: 30,
        address: {
          street: '123 Main St',
          city: 'New York',
        },
      },
    };

    const pathTree: PathTree = {
      name: null,
      profile: {
        age: null,
      },
    };

    const result = includeObjectSync(obj, { pathTree });

    expect(result).toEqual({
      name: 'John',
      profile: {
        age: 30,
      },
    });
  });

  it('should handle nested object inclusion', () => {
    const obj = {
      user: {
        personal: {
          name: 'Alice',
          age: 25,
        },
        contact: {
          email: 'alice@example.com',
          phone: '123-456-7890',
        },
      },
      metadata: {
        created: '2023-01-01',
      },
    };

    const pathTree: PathTree = {
      user: {
        personal: {
          name: null,
        },
        contact: {
          email: null,
        },
      },
    };

    const result = includeObjectSync(obj, { pathTree });

    expect(result).toEqual({
      user: {
        personal: {
          name: 'Alice',
        },
        contact: {
          email: 'alice@example.com',
        },
      },
    });
  });

  it('should handle arrays correctly', () => {
    const obj = {
      items: [
        { id: 1, name: 'Item 1', description: 'First item' },
        { id: 2, name: 'Item 2', description: 'Second item' },
      ],
      count: 2,
    };

    const pathTree: PathTree = {
      items: {
        '0': {
          name: null,
        },
        '1': {
          id: null,
        },
      },
    };

    const result = includeObjectSync(obj, { pathTree });

    expect(result).toEqual({
      items: [{ name: 'Item 1' }, { id: 2 }],
    });
  });

  it('should return empty object for non-matching paths', () => {
    const obj = {
      name: 'John',
      email: 'john@example.com',
    };

    const pathTree: PathTree = {
      nonexistent: {
        field: null,
      },
      name: null,
    };

    const result = includeObjectSync(obj, { pathTree });

    expect(result).toEqual({ name: 'John' });
  });

  it('should handle primitive values', () => {
    const result1 = includeObjectSync('string', { pathTree: { name: null } });
    const result2 = includeObjectSync(123, { pathTree: { name: null } });
    const result3 = includeObjectSync(true, { pathTree: { name: null } });

    expect(result1).toBe('string');
    expect(result2).toBe(123);
    expect(result3).toBe(true);
  });
});

describe('excludeObjectSync', () => {
  it('should exclude specified paths from object', () => {
    const obj = {
      name: 'John',
      email: 'john@example.com',
      password: 'secret123',
      profile: {
        age: 30,
        address: {
          street: '123 Main St',
          city: 'New York',
        },
      },
    };

    const pathTree: PathTree = {
      password: null,
      profile: {
        address: {
          street: null,
        },
      },
    };

    const result = excludeObjectSync(obj, { pathTree });

    expect(result).toEqual({
      name: 'John',
      email: 'john@example.com',
      profile: {
        age: 30,
        address: {
          city: 'New York',
        },
      },
    });
  });

  it('should handle nested object exclusion', () => {
    const obj = {
      user: {
        personal: {
          name: 'Alice',
          ssn: '123-45-6789',
        },
        contact: {
          email: 'alice@example.com',
          phone: '123-456-7890',
        },
      },
      metadata: {
        created: '2023-01-01',
        internal: 'secret',
      },
    };

    const pathTree: PathTree = {
      user: {
        personal: {
          ssn: null,
        },
      },
      metadata: {
        internal: null,
      },
    };

    const result = excludeObjectSync(obj, { pathTree });

    expect(result).toEqual({
      user: {
        personal: {
          name: 'Alice',
        },
        contact: {
          email: 'alice@example.com',
          phone: '123-456-7890',
        },
      },
      metadata: {
        created: '2023-01-01',
      },
    });
  });

  it('should handle arrays correctly', () => {
    const obj = {
      items: [
        { id: 1, name: 'Item 1', secret: 'hidden1' },
        { id: 2, name: 'Item 2', secret: 'hidden2' },
      ],
      count: 2,
    };

    const pathTree: PathTree = {
      items: {
        '0': {
          secret: null,
        },
        '1': {
          secret: null,
        },
      },
    };

    const result = excludeObjectSync(obj, { pathTree });

    expect(result).toEqual({
      items: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ],
      count: 2,
    });
  });

  it('should not modify original object', () => {
    const obj = {
      name: 'John',
      password: 'secret',
    };

    const pathTree: PathTree = {
      password: null,
    };

    const result = excludeObjectSync(obj, { pathTree });

    expect(obj).toEqual({
      name: 'John',
      password: 'secret',
    });
    expect(result).toEqual({
      name: 'John',
    });
  });

  it('should handle primitive values', () => {
    const result1 = excludeObjectSync('string', { pathTree: { name: null } });
    const result2 = excludeObjectSync(123, { pathTree: { name: null } });
    const result3 = excludeObjectSync(true, { pathTree: { name: null } });

    expect(result1).toBe('string');
    expect(result2).toBe(123);
    expect(result3).toBe(true);
  });
});

describe('objectContainedLogSync', () => {
  it('should return JSON string for objects without options', () => {
    const obj = {
      name: 'John',
      age: 30,
    };

    const result = objectContainedLogSync(obj);

    expect(result).toBe('{"name":"John","age":30}');
  });

  it('should return string representation for primitives', () => {
    expect(objectContainedLogSync('hello')).toBe('hello');
    expect(objectContainedLogSync(123)).toBe('123');
    expect(objectContainedLogSync(true)).toBe('true');
    expect(objectContainedLogSync(null)).toBe('null');
    expect(objectContainedLogSync(undefined)).toBe('undefined');
  });

  it('should use includePathTree when provided', () => {
    const obj = {
      name: 'John',
      email: 'john@example.com',
      password: 'secret',
    };

    const includePathTree: PathTree = {
      name: null,
      email: null,
    };

    const result = objectContainedLogSync(obj, { includePathTree });

    expect(result).toBe('{"name":"John","email":"john@example.com"}');
  });

  it('should use excludePathTree when provided', () => {
    const obj = {
      name: 'John',
      email: 'john@example.com',
      password: 'secret',
    };

    const excludePathTree: PathTree = {
      password: null,
    };

    const result = objectContainedLogSync(obj, { excludePathTree });

    expect(result).toBe('{"name":"John","email":"john@example.com"}');
  });

  it('should prioritize includePathTree over excludePathTree', () => {
    const obj = {
      name: 'John',
      email: 'john@example.com',
      password: 'secret',
    };

    const includePathTree: PathTree = {
      name: null,
    };

    const excludePathTree: PathTree = {
      password: null,
    };

    const result = objectContainedLogSync(obj, {
      includePathTree,
      excludePathTree,
    });

    // Should use include and ignore exclude
    expect(result).toBe('{"name":"John"}');
  });

  it('should handle complex nested objects with includePathTree', () => {
    const obj = {
      user: {
        profile: {
          name: 'Alice',
          age: 25,
        },
        settings: {
          theme: 'dark',
          notifications: true,
        },
      },
      metadata: {
        created: '2023-01-01',
      },
    };

    const includePathTree: PathTree = {
      user: {
        profile: {
          name: null,
        },
        settings: {
          theme: null,
        },
      },
    };

    const result = objectContainedLogSync(obj, { includePathTree });

    expect(result).toBe(
      '{"user":{"profile":{"name":"Alice"},"settings":{"theme":"dark"}}}',
    );
  });

  it('should handle arrays in objects', () => {
    const obj = {
      items: [1, 2, 3],
      metadata: {
        count: 3,
      },
    };

    const result = objectContainedLogSync(obj);

    expect(result).toBe('{"items":[1,2,3],"metadata":{"count":3}}');
  });

  it('should handle null and undefined objects', () => {
    expect(objectContainedLogSync(null)).toBe('null');
    expect(objectContainedLogSync(undefined)).toBe('undefined');
  });

  it('should work with pathsToPathTree helper', () => {
    const obj = {
      user: {
        name: 'John',
        email: 'john@example.com',
        password: 'secret',
      },
    };

    const includePathTree = pathsToPathTree(['user.name', 'user.email']);
    const result = objectContainedLogSync(obj, { includePathTree });

    expect(result).toBe('{"user":{"name":"John","email":"john@example.com"}}');
  });
});

describe('getItemByPathSync', () => {
  it('should return the value at the given path', () => {
    const obj = {
      user: {
        name: 'John',
        email: 'john@example.com',
        password: 'secret',
      },
    };

    expect(getItemByPathSync(obj, 'user.name')).toBe('John');
    expect(getItemByPathSync(obj, 'user.email')).toBe('john@example.com');
    expect(getItemByPathSync(obj, 'user.password')).toBe('secret');
  });

  it('should return undefined if the path is not found', () => {
    const obj = {
      user: {
        name: 'John',
        email: 'john@example.com',
        password: 'secret',
      },
    };

    expect(getItemByPathSync(obj, 'user.name.first')).toBeUndefined();
    expect(getItemByPathSync(obj, 'user.email.first')).toBeUndefined();
    expect(getItemByPathSync(obj, 'user.password.first')).toBeUndefined();
  });

  it('should handle arrays', () => {
    const obj = {
      items: [1, 2, 3],
    };

    expect(getItemByPathSync(obj, 'items.0')).toBe(1);
    expect(getItemByPathSync(obj, 'items.1')).toBe(2);
    expect(getItemByPathSync(obj, 'items.2')).toBe(3);
    expect(getItemByPathSync(obj, 'items.3')).toBeUndefined();
    expect(getItemByPathSync(obj, 'items.first')).toBeUndefined();
    expect(getItemByPathSync(obj, 'items.first.name')).toBeUndefined();
  });

  it('should handle nested objects', () => {
    const obj = {
      user: {
        name: 'John',
        email: 'john@example.com',
        password: 'secret',
      },
    };

    expect(getItemByPathSync(obj, 'user.name')).toBe('John');
    expect(getItemByPathSync(obj, 'user.email')).toBe('john@example.com');
    expect(getItemByPathSync(obj, 'user.password')).toBe('secret');
  });

  it('should handle arrays in nested objects', () => {
    const obj = {
      user: {
        items: [1, 2, 3],
      },
    };

    expect(getItemByPathSync(obj, 'user.items.0')).toBe(1);
    expect(getItemByPathSync(obj, 'user.items.1')).toBe(2);
    expect(getItemByPathSync(obj, 'user.items.2')).toBe(3);
    expect(getItemByPathSync(obj, 'user.items.3')).toBeUndefined();
    expect(getItemByPathSync(obj, 'user.items.first')).toBeUndefined();
    expect(getItemByPathSync(obj, 'user.items.first.name')).toBeUndefined();
  });

  it('should handle arrays in nested objects with arrays', () => {
    const obj = {
      user: {
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
      },
    };

    expect(getItemByPathSync(obj, 'user.items.0.id')).toBe(1);
    expect(getItemByPathSync(obj, 'user.items.1.id')).toBe(2);
    expect(getItemByPathSync(obj, 'user.items.0.name')).toBe('Item 1');
    expect(getItemByPathSync(obj, 'user.items.1.name')).toBe('Item 2');
  });

  it('should handle direct undefined and null values', () => {
    expect(getItemByPathSync(undefined, 'user.name')).toBeUndefined();
    expect(getItemByPathSync(null, 'user.name')).toBeUndefined();
  });
});
