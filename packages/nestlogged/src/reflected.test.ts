import { pathsToPathTree, PathTree } from './reflected';

describe('pathsToPathTree', () => {
  it('should return empty object for empty array', () => {
    const result = pathsToPathTree([]);
    expect(result).toEqual({});
  });

  it('should create leaf node for single segment path', () => {
    const result = pathsToPathTree(['name']);
    const expected: PathTree = { name: null };
    expect(result).toEqual(expected);
  });

  it('should create nested structure for multi-segment path', () => {
    const result = pathsToPathTree(['user.profile.name']);
    const expected: PathTree = {
      user: {
        profile: {
          name: null
        }
      }
    };
    expect(result).toEqual(expected);
  });

  it('should merge shared prefixes correctly', () => {
    const result = pathsToPathTree(['user.name', 'user.email', 'user.profile.avatar']);
    const expected: PathTree = {
      user: {
        name: null,
        email: null,
        profile: {
          avatar: null
        }
      }
    };
    expect(result).toEqual(expected);
  });

  it('should handle multiple independent paths', () => {
    const result = pathsToPathTree(['name', 'email', 'address.street']);
    const expected: PathTree = {
      name: null,
      email: null,
      address: {
        street: null
      }
    };
    expect(result).toEqual(expected);
  });

  it('should build complex nested structures correctly', () => {
    const result = pathsToPathTree([
      'user.profile.personal.name',
      'user.profile.personal.age',
      'user.profile.contact.email',
      'user.settings.theme',
      'metadata.created'
    ]);
    const expected: PathTree = {
      user: {
        profile: {
          personal: {
            name: null,
            age: null
          },
          contact: {
            email: null
          }
        },
        settings: {
          theme: null
        }
      },
      metadata: {
        created: null
      }
    };
    expect(result).toEqual(expected);
  });

  it('should merge overlapping structures correctly', () => {
    const result = pathsToPathTree(['a.b.c', 'a.b.d', 'a.e']);
    const expected: PathTree = {
      a: {
        b: {
          c: null,
          d: null
        },
        e: null
      }
    };
    expect(result).toEqual(expected);
  });

  it('should handle duplicate paths gracefully', () => {
    const result = pathsToPathTree(['user.name', 'user.name', 'user.email']);
    const expected: PathTree = {
      user: {
        name: null,
        email: null
      }
    };
    expect(result).toEqual(expected);
  });

  it('should handle single character segments', () => {
    const result = pathsToPathTree(['a.b.c', 'x.y']);
    const expected: PathTree = {
      a: {
        b: {
          c: null
        }
      },
      x: {
        y: null
      }
    };
    expect(result).toEqual(expected);
  });

  it('should handle paths with numeric segments', () => {
    const result = pathsToPathTree(['items.0.name', 'items.1.name']);
    const expected: PathTree = {
      items: {
        '0': {
          name: null
        },
        '1': {
          name: null
        }
      }
    };
    expect(result).toEqual(expected);
  });
});